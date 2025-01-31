import { AssortmentProduct, AssortmentsModule } from '@unchainedshop/types/assortments';
import { Collection } from '@unchainedshop/types/common';
import { emit, registerEvents } from 'meteor/unchained:events';
import { generateDbFilterById, generateDbObjectId } from 'meteor/unchained:utils';

const ASSORTMENT_PRODUCT_EVENTS = [
  'ASSORTMENT_ADD_PRODUCT',
  'ASSORTMENT_REMOVE_PRODUCT',
  'ASSORTMENT_REORDER_PRODUCTS',
];

export const configureAssortmentProductsModule = ({
  AssortmentProducts,
  invalidateCache,
}: {
  AssortmentProducts: Collection<AssortmentProduct>;
  invalidateCache: AssortmentsModule['invalidateCache'];
}): AssortmentsModule['products'] => {
  registerEvents(ASSORTMENT_PRODUCT_EVENTS);

  return {
    // Queries
    findAssortmentIds: async ({ productId, tags }) => {
      const selector = { productId };
      if (tags) {
        selector.tags = { $in: tags };
      }
      return AssortmentProducts.find(selector, { projection: { assortmentId: true } })
        .map(({ assortmentId }) => assortmentId)
        .toArray();
    },

    findProductIds: async ({ assortmentId, tags }) => {
      const selector = { assortmentId };
      if (tags) {
        selector.tags = { $in: tags };
      }
      return AssortmentProducts.find(selector, { projection: { productId: true } })
        .map(({ productId }) => productId)
        .toArray();
    },

    findProduct: async ({ assortmentProductId }) => {
      return AssortmentProducts.findOne(generateDbFilterById(assortmentProductId), {});
    },

    findProducts: async ({ assortmentId }, options) => {
      const products = AssortmentProducts.find({ assortmentId }, options);
      return products.toArray();
    },

    findProductSiblings: async ({ assortmentIds, productId }) => {
      const selector = {
        $and: [
          {
            productId: { $ne: productId },
          },
          {
            assortmentId: { $in: assortmentIds },
          },
        ],
      };

      return AssortmentProducts.find(selector, {
        projection: { productId: 1 },
      })
        .map((product) => product.productId)
        .toArray();
    },

    // Mutations
    create: async (doc: AssortmentProduct, options, userId) => {
      const { _id, assortmentId, productId, sortKey, ...rest } = doc;

      const selector = {
        ...(doc._id ? generateDbFilterById(doc._id) : {}),
        productId,
        assortmentId,
      };
      const $set: any = {
        updated: new Date(),
        updatedBy: userId,
        ...rest,
      };
      const $setOnInsert: any = {
        _id: _id || generateDbObjectId(),
        productId,
        assortmentId,
        created: new Date(),
        createdBy: userId,
      };

      if (!sortKey) {
        // Get next sort key
        const lastAssortmentProduct = (await AssortmentProducts.findOne(
          { assortmentId },
          { sort: { sortKey: -1 } },
        )) || { sortKey: 0 };
        $setOnInsert.sortKey = lastAssortmentProduct.sortKey + 1;
      } else {
        $set.sortKey = sortKey;
      }

      await AssortmentProducts.updateOne(
        selector,
        {
          $set,
          $setOnInsert,
        },
        { upsert: true },
      );

      const assortmentProduct = await AssortmentProducts.findOne(selector, {});

      emit('ASSORTMENT_ADD_PRODUCT', { assortmentProduct });

      if (!options.skipInvalidation) {
        await invalidateCache(
          { assortmentIds: [assortmentProduct.assortmentId] },
          { skipUpstreamTraversal: false },
        );
      }

      return assortmentProduct;
    },

    delete: async (assortmentProductId, options) => {
      const selector = generateDbFilterById(assortmentProductId);

      const assortmentProduct = await AssortmentProducts.findOne(selector, {
        projection: { _id: 1, assortmentId: 1 },
      });

      if (!assortmentProduct) return [];

      await AssortmentProducts.deleteOne(selector);

      emit('ASSORTMENT_REMOVE_PRODUCT', {
        assortmentProductId: assortmentProduct._id,
      });

      if (!options.skipInvalidation) {
        await invalidateCache(
          { assortmentIds: [assortmentProduct.assortmentId] },
          {
            skipUpstreamTraversal: false,
          },
        );
      }

      return [assortmentProduct];
    },

    deleteMany: async (selector, options) => {
      const assortmentProducts = await AssortmentProducts.find(selector, {
        projection: { _id: 1, assortmentId: 1 },
      }).toArray();

      await AssortmentProducts.deleteMany(selector);
      assortmentProducts.forEach((assortmentProduct) => {
        emit('ASSORTMENT_REMOVE_PRODUCT', {
          assortmentProductId: assortmentProduct._id,
        });
      });

      if (!options.skipInvalidation && assortmentProducts.length) {
        await invalidateCache(
          { assortmentIds: assortmentProducts.map((product) => product.assortmentId) },
          {
            skipUpstreamTraversal: false,
          },
        );
      }

      return assortmentProducts;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (assortmentProductId, doc, options, userId) => {
      const selector = generateDbFilterById(assortmentProductId);
      const modifier = {
        $set: {
          ...doc,
          updated: new Date(),
          updatedBy: userId,
        },
      };
      await AssortmentProducts.updateOne(selector, modifier);

      const assortmentProduct = await AssortmentProducts.findOne(selector, {});
      if (!options.skipInvalidation) {
        await invalidateCache(
          { assortmentIds: [assortmentProduct.assortmentId] },
          {
            skipUpstreamTraversal: false,
          },
        );
      }
      return assortmentProduct;
    },

    updateManualOrder: async ({ sortKeys }, options, userId) => {
      const changedAssortmentProductIds = await Promise.all(
        sortKeys.map(async ({ assortmentProductId, sortKey }) => {
          await AssortmentProducts.updateOne(generateDbFilterById(assortmentProductId), {
            $set: {
              sortKey: sortKey + 1,
              updated: new Date(),
              updatedBy: userId,
            },
          });
          return assortmentProductId;
        }),
      );

      const assortmentProducts = await AssortmentProducts.find({
        _id: { $in: changedAssortmentProductIds },
      }).toArray();

      if (!options.skipInvalidation && assortmentProducts.length) {
        await invalidateCache(
          { assortmentIds: assortmentProducts.map((product) => product.assortmentId) },
          {
            skipUpstreamTraversal: false,
          },
        );
      }

      emit('ASSORTMENT_REORDER_PRODUCTS', { assortmentProducts });

      return assortmentProducts;
    },
  };
};
