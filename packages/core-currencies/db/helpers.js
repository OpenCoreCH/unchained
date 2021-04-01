import { Currencies } from './collections';

const buildFindSelector = ({ includeInactive = false }) => {
  const selector = {};
  if (!includeInactive) selector.isActive = true;
  return selector;
};

Currencies.createCurrency = ({ isoCode, ...countryData }) => {
  const _id = Currencies.insert({
    created: new Date(),
    isoCode: isoCode.toUpperCase(),
    isActive: true,
    ...countryData,
  });
  return Currencies.findOne({ _id });
};

Currencies.findCurrencies = ({ limit, offset, ...query }) => {
  return Currencies.find(buildFindSelector(query), {
    skip: offset,
    limit,
  }).fetch();
};

Currencies.count = async (query) => {
  const count = await Currencies.rawCollection().countDocuments(
    buildFindSelector(query)
  );
  return count;
};

Currencies.currencyExists = ({ currencyId }) => {
  return !!Currencies.find({ _id: currencyId }, { limit: 1 }).count();
};

Currencies.findCurrency = ({ currencyId, isoCode }) => {
  return Currencies.findOne(currencyId ? { _id: currencyId } : { isoCode });
};

Currencies.removeCurrency = ({ currencyId }) => {
  return Currencies.remove({ _id: currencyId });
};

Currencies.updateCurrency = ({ currencyId, isoCode, ...currency }) => {
  return Currencies.update(
    { _id: currencyId },
    {
      $set: {
        isoCode: isoCode.toUpperCase(),
        ...currency,
        updated: new Date(),
      },
    }
  );
};
