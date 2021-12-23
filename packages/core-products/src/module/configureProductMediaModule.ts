import {
  ProductMedia,
  ProductMediaModule,
  ProductMediaText,
} from '@unchainedshop/types/products.media';
import {
  ModuleInput,
  ModuleMutations,
  Query,
} from '@unchainedshop/types/common';
import { Locale } from 'locale';
import { emit, registerEvents } from 'meteor/unchained:events';
import {
  findLocalizedText,
  generateDbFilterById,
  generateDbMutations,
  generateId,
} from 'meteor/unchained:utils';
import { ProductMediaCollection } from '../db/ProductMediaCollection';
import { ProductMediaSchema } from '../db/ProductMediaSchema';

const PRODUCT_MEDIA_EVENTS = [
  'PRODUCT_ADD_MEDIA',
  'PRODUCT_REMOVE_MEDIA',
  'PRODUCT_REORDER_MEDIA',
  'PRODUCT_UPDATE_MEDIA_TEXT',
];

export const configureProductMediaModule = async ({
  db,
}: ModuleInput): Promise<ProductMediaModule> => {
  registerEvents(PRODUCT_MEDIA_EVENTS);

  const { ProductMedia, ProductMediaTexts } = await ProductMediaCollection(db);

  const mutations = generateDbMutations<ProductMedia>(
    ProductMedia,
    ProductMediaSchema
  ) as ModuleMutations<ProductMedia>;

  const upsertLocalizedText = async (
    productMediaId: string,
    locale: string,
    text: ProductMediaText,
    userId: string
  ) => {
    await ProductMediaTexts.updateOne(
      {
        productMediaId,
        locale,
      },
      {
        $set: {
          updated: new Date(),
          updatedBy: userId,
          ...text,
        },
        $setOnInsert: {
          productMediaId,
          created: new Date(),
          createdBy: userId,
          locale,
        },
      }
    );

    return await ProductMediaTexts.findOne({
      productMediaId,
      locale,
    });
  };

  return {
    // Queries
    findProductMedia: async ({ productMediaId }) => {
      return await ProductMedia.findOne(generateDbFilterById(productMediaId));
    },

    findProductMedias: async ({ productId, tags, offset, limit }) => {
      const selector: Query = { productId };
      if (tags && tags.length > 0) {
        selector.tags = { $all: tags };
      }

      const mediaList = ProductMedia.find(selector, {
        skip: offset,
        limit,
        sort: { sortKey: 1 },
      });

      return await mediaList.toArray();
    },

    // Mutations
    create: async (doc: ProductMedia, userId) => {
      let sortKey = doc.sortKey;

      if (!sortKey) {
        // Get next sort key
        const lastProductMedia = (await ProductMedia.findOne(
          {
            productId: doc.productId,
          },
          {
            sort: { sortKey: -1 },
          }
        )) || { sortKey: 0 };
        sortKey = lastProductMedia.sortKey + 1;
      }

      const productMediaId = await mutations.create(
        {
          tags: [],
          ...doc,
          sortKey,
        },
        userId
      );

      const productMedia = await ProductMedia.findOne(
        generateDbFilterById(productMediaId)
      );

      emit('PRODUCT_ADD_MEDIA', {
        productMedia,
      });

      return productMedia;
    },

    delete: async (productMediaId) => {
      const selector = generateDbFilterById(productMediaId);

      const deletedResult = await ProductMedia.deleteOne(selector);

      emit('PRODUCT_REMOVE_MEDIA', {
        productMediaId,
      });

      return deletedResult.deletedCount;
    },

    updateManualOrder: async ({ sortKeys }, userId) => {
      const changedProductMediaIds = await Promise.all(
        sortKeys.map(async ({ productMediaId, sortKey }) => {
          await ProductMedia.updateOne(generateDbFilterById(productMediaId), {
            $set: {
              sortKey: sortKey + 1,
              updated: new Date(),
              updatedBy: userId,
            },
          });

          return generateId(productMediaId);
        })
      );

      const productMedias = await ProductMedia.find({
        _id: { $in: changedProductMediaIds },
      }).toArray();

      emit('PRODUCT_REORDER_MEDIA', { productMedias });

      return productMedias;
    },

    /*
     * Product Media Texts
     */

    texts: {
      // Queries
      findMediaTexts: async ({ productMediaId }) => {
        return await ProductMediaTexts.find({ productMediaId }).toArray();
      },

      findLocalizedMediaText: async ({ productMediaId, locale }) => {
        const parsedLocale = new Locale(locale);

        const text = await findLocalizedText<ProductMediaText>(
          ProductMediaTexts,
          { productMediaId },
          parsedLocale
        );

        return text;
      },

      // Mutations
      updateMediaTexts: async (productMediaId, texts, userId) => {
        const mediaTexts = await Promise.all(
          texts.map(
            async ({ locale, ...localizations }) =>
              await upsertLocalizedText(
                productMediaId,
                locale,
                {
                  ...localizations,
                  authorId: userId,
                },
                userId
              )
          )
        );

        emit('PRODUCT_UPDATE_MEDIA_TEXT', {
          productMediaId,
          mediaTexts,
        });

        return mediaTexts;
      },
    },
  };
};
