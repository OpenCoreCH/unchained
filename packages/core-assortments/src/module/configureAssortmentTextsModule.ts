import {
  Assortment,
  AssortmentsModule,
  AssortmentText,
} from '@unchainedshop/types/assortments';
import { Collection } from '@unchainedshop/types/common';
import { Locale } from 'locale';
import { emit, registerEvents } from 'meteor/unchained:events';
import {
  findLocalizedText,
  findUnusedSlug,
  generateDbFilterById,
  generateId,
} from 'meteor/unchained:utils';

const ASSORTMENT_TEXT_EVENTS = ['ASSORTMENT_UPDATE_TEXTS'];

export const configureAssortmentTextsModule = ({
  Assortments,
  AssortmentTexts,
}: {
  Assortments: Collection<Assortment>;
  AssortmentTexts: Collection<AssortmentText>;
}): AssortmentsModule['texts'] => {
  registerEvents(ASSORTMENT_TEXT_EVENTS);

  const makeSlug = async ({ slug, title, assortmentId }) => {
    const checkSlugIsUnique = async (newPotentialSlug: string) => {
      return (
        (await AssortmentTexts.find({
          assortmentId: { $ne: assortmentId },
          slug: newPotentialSlug,
        }).count()) === 0
      );
    };

    const findSlug = findUnusedSlug(checkSlugIsUnique, {});
    return await findSlug({
      existingSlug: slug,
      title: title || assortmentId,
    });
  };

  const upsertLocalizedText = async (
    assortmentId: string,
    locale: string,
    text: AssortmentText,
    userId?: string
  ) => {
    const slug = await makeSlug({
      slug: text.slug,
      title: text.title,
      assortmentId,
    });

    const modifier: any = {
      $set: {
        updated: new Date(),
        updatedBy: userId,
        description: text.description,
        subtitle: text.subtitle,
        title: text.title,
      },
      $setOnInsert: {
        created: new Date(),
        createdBy: userId,
        assortmentId,
        locale,
      },
    };

    if (text.slug) {
      modifier.$set.slug = slug;
    } else {
      modifier.$setOnInsert.slug = slug;
    }

    const selector = { assortmentId, locale };

    const updateResult = await AssortmentTexts.updateOne(selector, modifier);

    if (updateResult.upsertedCount > 0 || updateResult.modifiedCount > 0) {
      await Assortments.updateOne(generateDbFilterById(assortmentId), {
        $set: {
          updated: new Date(),
        },
        $addToSet: {
          /* @ts-ignore */
          slugs: slug,
        },
      });

      await Assortments.updateMany(
        {
          _id: { $ne: generateId(assortmentId) },
          slugs: slug,
        },
        {
          $set: {
            updated: new Date(),
          },
          $pull: {
            /* @ts-ignore */
            slugs: slug,
          },
        }
      );
    }

    return await AssortmentTexts.findOne(
      updateResult.upsertedId ? updateResult.upsertedId : selector
    );
  };

  return {
    // Queries
    findTexts: async (query, options) => {
      const texts = AssortmentTexts.find(query, options);

      return texts.toArray();
    },

    findLocalizedText: async ({ assortmentId, locale }) => {
      const parsedLocale = new Locale(locale);

      const text = await findLocalizedText<AssortmentText>(
        AssortmentTexts,
        { assortmentId },
        parsedLocale
      );

      return text;
    },

    searchTexts: async ({ searchText }) => {
      const assortmentIds = AssortmentTexts.find(
        { $text: { $search: searchText } },
        {
          projection: {
            assortmentId: 1,
          },
        }
      ).map(({ assortmentId }) => assortmentId);

      return await assortmentIds.toArray();
    },

    // Mutations
    updateTexts: async (assortmentId, texts, userId) => {
      const assortmentTexts = await Promise.all(
        texts?.map(
          async (text) =>
            await upsertLocalizedText(
              assortmentId,
              text.locale,
              {
                ...text,
                authorId: userId,
              },
              userId
            )
        )
      );

      emit('ASSORTMENT_UPDATE_TEXTS', {
        assortmentId,
        assortmentTexts,
      });

      return assortmentTexts;
    },

    upsertLocalizedText,
    makeSlug,

    deleteMany: async (assortmentId) => {
      const deletedResult = await AssortmentTexts.deleteMany({ assortmentId });

      return deletedResult.deletedCount;
    },
  };
};
