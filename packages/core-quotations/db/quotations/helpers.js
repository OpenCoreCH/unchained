import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { objectInvert } from 'meteor/unchained:utils';
import { Users } from 'meteor/unchained:core-users';
import { Products } from 'meteor/unchained:core-products';
import { Countries } from 'meteor/unchained:core-countries';
import { Currencies } from 'meteor/unchained:core-currencies';
import { log } from 'unchained-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import {
  uploadObjectStream,
  uploadFileFromURL,
  MediaObjects,
} from 'meteor/unchained:core-files-next';
import { Quotations } from './collections';
import { QuotationStatus } from './schema';
import { QuotationDirector } from '../../director';
import settings from '../../settings';
import { updateQuotationDocuments } from '../quotation-documents/helpers';

// Logs.helpers({
//   quotation() {
//     return (
//       this.meta &&
//       Quotations.findOne({
//         _id: this.meta.quotationId,
//       })
//     );
//   },
// });

Users.helpers({
  quotations() {
    return Quotations.find(
      { userId: this._id },
      {
        sort: {
          created: -1,
        },
      }
    ).fetch();
  },
});

Quotations.findQuotation = ({ quotationId }, options) => {
  return Quotations.findOne({ _id: quotationId }, options);
};

Quotations.findQuotations = ({ limit, offset }) => {
  return Quotations.find({}, { skip: offset, limit }).fetch();
};

Quotations.count = async () => {
  const count = await Quotations.rawCollection().countDocuments();
  return count;
};

Quotations.helpers({
  user() {
    return Users.findOne({
      _id: this.userId,
    });
  },
  product() {
    return Products.findOne({
      _id: this.productId,
    });
  },
  country() {
    return Countries.findOne({ isoCode: this.countryCode });
  },
  currency() {
    return Currencies.findOne({ isoCode: this.currencyCode });
  },
  normalizedStatus() {
    return objectInvert(QuotationStatus)[this.status || null];
  },
  updateContext(context) {
    return Quotations.updateContext({
      quotationId: this._id,
      context,
    });
  },
  verify({ quotationContext } = {}, options) {
    if (this.status !== QuotationStatus.REQUESTED) return this;
    const locale = this.user().locale(options);
    return this.setStatus(
      QuotationStatus.PROCESSING,
      'verified elligibility manually'
    )
      .process({ quotationContext })
      .sendStatusToCustomer({ locale });
  },
  reject({ quotationContext } = {}, options) {
    if (this.status === QuotationStatus.FULLFILLED) return this;
    const locale = this.user().locale(options);
    return this.setStatus(QuotationStatus.REJECTED, 'rejected manually')
      .process({ quotationContext })
      .sendStatusToCustomer({ locale });
  },
  propose({ quotationContext } = {}, options) {
    if (this.status !== QuotationStatus.PROCESSING) return this;
    const locale = this.user().locale(options);
    return this.setStatus(QuotationStatus.PROPOSED, 'proposed manually')
      .process({ quotationContext })
      .sendStatusToCustomer({ locale });
  },
  fullfill({ quotationContext, info } = {}, options) {
    if (this.status === QuotationStatus.FULLFILLED) return this;
    const locale = this.user().locale(options);
    return this.setStatus(QuotationStatus.FULLFILLED, JSON.stringify(info))
      .process({ quotationContext })
      .sendStatusToCustomer({ locale });
  },
  sendStatusToCustomer({ locale }) {
    WorkerDirector.addWork({
      type: 'MESSAGE',
      retries: 0,
      input: {
        locale,
        template: 'QUOTATION_STATUS',
        quotationId: this._id,
      },
    });
    return this;
  },
  process({ quotationContext } = {}) {
    if (
      this.status === QuotationStatus.REQUESTED &&
      this.nextStatus() !== QuotationStatus.REQUESTED
    ) {
      this.submitRequest(quotationContext);
    }
    if (this.nextStatus() !== QuotationStatus.PROCESSING) {
      this.verifyRequest(quotationContext);
    }
    if (this.nextStatus() === QuotationStatus.PROPOSED) {
      this.buildProposal(quotationContext);
    }
    return this.setStatus(this.nextStatus(), 'quotation processed');
  },
  transformItemConfiguration(itemConfiguration) {
    const director = this.director();
    return Promise.await(
      director.transformItemConfiguration(itemConfiguration)
    );
  },
  nextStatus() {
    let { status } = this;
    const director = this.director();

    if (status === QuotationStatus.REQUESTED) {
      if (!Promise.await(director.isManualRequestVerificationRequired())) {
        status = QuotationStatus.PROCESSING;
      }
    }
    if (status === QuotationStatus.PROCESSING) {
      if (!Promise.await(director.isManualProposalRequired())) {
        status = QuotationStatus.PROPOSED;
      }
    }
    return status;
  },
  submitRequest(quotationContext) {
    const director = this.director();
    Promise.await(director.submit(quotationContext));
    return this;
  },
  verifyRequest(quotationContext) {
    const director = this.director();
    Promise.await(director.verify(quotationContext));
    return this;
  },
  buildProposal(quotationContext) {
    const director = this.director();
    const proposal = Promise.await(director.quote(quotationContext));
    return Quotations.updateProposal({
      ...proposal,
      quotationId: this._id,
    });
  },
  director() {
    const director = new QuotationDirector(this);
    return director;
  },
  setStatus(status, info) {
    return Quotations.updateStatus({
      quotationId: this._id,
      status,
      info,
    });
  },
  addDocument(objOrString, meta, options = {}) {
    if (typeof objOrString === 'string' || objOrString instanceof String) {
      return Promise.await(
        uploadFileFromURL(
          'quotation-documents',
          { fileLink: objOrString },
          {
            ...options,
            meta: {
              quotationId: this._id,
              ...meta,
            },
          }
        )
      );
    }
    const { rawFile, userId } = objOrString;
    return uploadObjectStream('quotation-documents', rawFile, {
      userId,
      quotationId: this._id,
      ...meta,
    });
  },
  documents(options) {
    const { type } = options || {};
    const selector = { 'meta.quotationId': this._id };
    if (type) {
      selector['meta.type'] = type;
    }
    return MediaObjects.find(selector, {
      sort: { 'meta.date': -1 },
    }).fetch();
  },
  document(options) {
    const { type } = options || {};
    const selector = { 'meta.quotationId': this._id };
    if (type) {
      selector['meta.type'] = type;
    }
    return MediaObjects.findOne(selector, { sort: { 'meta.date': -1 } });
  },
  // --> Moved to API query resolver using the modules pattern
  // logs({ limit, offset }) {
  //   const selector = { 'meta.quotationId': this._id };
  //   const logs = Logs.find(selector, {
  //     skip: offset,
  //     limit,
  //     sort: {
  //       created: -1,
  //     },
  //   }).fetch();
  //   return logs;
  // },
  isProposalValid() {
    return this.status === QuotationStatus.PROPOSED && !this.isExpired();
  },
  isExpired({ referenceDate } = {}) {
    const relevantDate = referenceDate ? new Date(referenceDate) : new Date();
    const expiryDate = new Date(this.expires);
    const isExpired = relevantDate.getTime() > expiryDate.getTime();
    return isExpired;
  },
});

Quotations.requestQuotation = (
  { productId, userId, countryCode, configuration },
  options
) => {
  log('Create Quotation', { userId });
  const quotationId = Quotations.insert({
    created: new Date(),
    status: QuotationStatus.REQUESTED,
    userId,
    productId,
    configuration,
    currencyCode: Countries.resolveDefaultCurrencyCode({
      isoCode: countryCode,
    }),
    countryCode,
  });
  const quotation = Quotations.findOne({ _id: quotationId });
  const locale = quotation.user().locale(options);
  return quotation.process().sendStatusToCustomer({ locale });
};

Quotations.updateContext = ({ context, quotationId }) => {
  log('Update Arbitrary Context', { quotationId });
  Quotations.update(
    { _id: quotationId },
    {
      $set: {
        context,
        updated: new Date(),
      },
    }
  );
  return Quotations.findOne({ _id: quotationId });
};

Quotations.updateProposal = ({ price, expires, meta, quotationId }) => {
  log('Update Quotation with Proposal', { quotationId });
  Quotations.update(
    { _id: quotationId },
    {
      $set: {
        price,
        expires,
        meta,
        updated: new Date(),
      },
    }
  );
  return Quotations.findOne({ _id: quotationId });
};

Quotations.newQuotationNumber = (quotation) => {
  let quotationNumber = null;
  let i = 0;
  while (!quotationNumber) {
    const newHashID = settings.quotationNumberHashFn(quotation, i);
    if (
      Quotations.find({ quotationNumber: newHashID }, { limit: 1 }).count() ===
      0
    ) {
      quotationNumber = newHashID;
    }
    i += 1;
  }
  return quotationNumber;
};

Quotations.updateStatus = ({ status, quotationId, info = '' }) => {
  const quotation = Quotations.findOne({ _id: quotationId });
  if (quotation.status === status) return quotation;
  const date = new Date();
  let isShouldUpdateDocuments = false;
  const modifier = {
    $set: { status, updated: new Date() },
    $push: {
      log: {
        date,
        status,
        info,
      },
    },
  };
  switch (status) {
    // explicitly use fallthrough here!
    case QuotationStatus.FULLFILLED:
      if (!quotation.fullfilled) {
        modifier.$set.fullfilled = date;
      }
      modifier.$set.expires = date;
    case QuotationStatus.PROPOSED: // eslint-disable-line no-fallthrough
      isShouldUpdateDocuments = true;
    case QuotationStatus.PROCESSING: // eslint-disable-line no-fallthrough
      if (!quotation.quotationNumber) {
        modifier.$set.quotationNumber =
          Quotations.newQuotationNumber(quotation);
      }
      break;
    case QuotationStatus.REJECTED:
      modifier.$set.expires = date;
      modifier.$set.rejected = date;
      break;
    default:
      break;
  }
  // documents represent long-living state of orders,
  // so we only track when transitioning to proposed or fullfilled status
  if (isShouldUpdateDocuments) {
    try {
      // we are now allowed to stop this process, else we could
      // end up with non-proposed but charged orders.
      updateQuotationDocuments({
        quotationId,
        date,
        ...modifier.$set,
      });
    } catch (e) {
      log(e, { level: 'error' });
    }
  }
  log(`New Status: ${status}`, { quotationId });
  Quotations.update({ _id: quotationId }, modifier);
  return Quotations.findOne({ _id: quotationId });
};
