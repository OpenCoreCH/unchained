import { AssortmentLink, AssortmentsModule } from '@unchainedshop/types/assortments';
import { Collection } from '@unchainedshop/types/common';
import { emit, registerEvents } from 'meteor/unchained:events';
import { generateDbFilterById, generateDbObjectId } from 'meteor/unchained:utils';

const ASSORTMENT_LINK_EVENTS = [
  'ASSORTMENT_ADD_LINK',
  'ASSORTMENT_REMOVE_LINK',
  'ASSORTMENT_REORDER_LINKS',
];

export const configureAssortmentLinksModule = ({
  AssortmentLinks,
  invalidateCache,
}: {
  AssortmentLinks: Collection<AssortmentLink>;
  invalidateCache: AssortmentsModule['invalidateCache'];
}): AssortmentsModule['links'] => {
  registerEvents(ASSORTMENT_LINK_EVENTS);

  return {
    // Queries
    findLink: async ({ assortmentLinkId, parentAssortmentId, childAssortmentId }) => {
      return AssortmentLinks.findOne(
        assortmentLinkId
          ? generateDbFilterById(assortmentLinkId)
          : { parentAssortmentId, childAssortmentId },
        {},
      );
    },

    findLinks: async ({ assortmentId, parentAssortmentId }, options) => {
      const selector = parentAssortmentId
        ? {
            parentAssortmentId,
          }
        : {
            $or: [{ parentAssortmentId: assortmentId }, { childAssortmentId: assortmentId }],
          };

      const links = AssortmentLinks.find(
        selector,
        options || {
          sort: { sortKey: 1 },
        },
      );

      return links.toArray();
    },

    // Mutations
    create: async (doc, options, userId) => {
      const { _id: assortmentLinkId, parentAssortmentId, childAssortmentId, sortKey, ...rest } = doc;

      const selector = {
        ...(assortmentLinkId ? generateDbFilterById(assortmentLinkId) : {}),
        parentAssortmentId,
        childAssortmentId,
      };

      const $set: any = {
        updated: new Date(),
        updatedBy: userId,
        ...rest,
      };
      const $setOnInsert: any = {
        _id: assortmentLinkId || generateDbObjectId(),
        parentAssortmentId,
        childAssortmentId,
        created: new Date(),
        createdBy: userId,
      };

      if (!sortKey) {
        // Get next sort key
        const lastAssortmentLink = (await AssortmentLinks.findOne(
          { parentAssortmentId },
          { sort: { sortKey: -1 } },
        )) || { sortKey: 0 };
        $setOnInsert.sortKey = lastAssortmentLink.sortKey + 1;
      } else {
        $set.sortKey = sortKey;
      }

      await AssortmentLinks.updateOne(
        selector,
        {
          $set,
          $setOnInsert,
        },
        {
          upsert: true,
        },
      );

      const assortmentLink = await AssortmentLinks.findOne(selector, {});

      emit('ASSORTMENT_ADD_LINK', { assortmentLink });

      if (!options.skipInvalidation) {
        await invalidateCache({ assortmentIds: [parentAssortmentId] });
      }

      return assortmentLink;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (assortmentLinkId, doc, options, userId) => {
      const selector = generateDbFilterById(assortmentLinkId);
      const modifier = {
        $set: {
          ...doc,
          updated: new Date(),
          updatedBy: userId,
        },
      };
      await AssortmentLinks.updateOne(selector, modifier);

      const assortmentLink = await AssortmentLinks.findOne(selector, {});
      if (!options.skipInvalidation) {
        await invalidateCache(
          { assortmentIds: [assortmentLink.childAssortmentId] },
          {
            skipUpstreamTraversal: false,
          },
        );
      }
      return assortmentLink;
    },

    delete: async (assortmentLinkId, options) => {
      const selector = generateDbFilterById(assortmentLinkId);

      const assortmentLink = await AssortmentLinks.findOne(selector, {});

      await AssortmentLinks.deleteOne(selector);

      emit('ASSORTMENT_REMOVE_LINK', {
        assortmentLinkId: assortmentLink._id,
      });

      if (!options.skipInvalidation) {
        await invalidateCache(
          {
            assortmentIds: [assortmentLink.childAssortmentId, assortmentLink.parentAssortmentId],
          },
          { skipUpstreamTraversal: false },
        );
      }

      return assortmentLink;
    },

    deleteMany: async (selector, options) => {
      const assortmentLinks = await AssortmentLinks.find(selector, {}).toArray();

      await AssortmentLinks.deleteMany(selector);
      assortmentLinks.forEach((assortmentLink) => {
        emit('ASSORTMENT_REMOVE_LINK', {
          assortmentLinkId: assortmentLink._id,
        });
      });

      if (!options.skipInvalidation && assortmentLinks.length) {
        await invalidateCache(
          {
            assortmentIds: assortmentLinks.flatMap((link) => [
              link.childAssortmentId,
              link.parentAssortmentId,
            ]),
          },
          { skipUpstreamTraversal: false },
        );
      }

      return assortmentLinks;
    },

    updateManualOrder: async ({ sortKeys }, options, userId) => {
      const changedAssortmentLinkIds = await Promise.all(
        sortKeys.map(async ({ assortmentLinkId, sortKey }) => {
          await AssortmentLinks.updateOne(generateDbFilterById(assortmentLinkId), {
            $set: {
              sortKey: sortKey + 1,
              updated: new Date(),
              updatedBy: userId,
            },
          });

          return assortmentLinkId;
        }),
      );

      const assortmentLinks = await AssortmentLinks.find({
        _id: { $in: changedAssortmentLinkIds },
      }).toArray();

      if (!options.skipInvalidation && assortmentLinks.length) {
        await invalidateCache(
          { assortmentIds: assortmentLinks.map((link) => link.childAssortmentId) },
          {
            skipUpstreamTraversal: false,
          },
        );
      }

      emit('ASSORTMENT_REORDER_LINKS', { assortmentLinks });

      return assortmentLinks;
    },
  };
};
