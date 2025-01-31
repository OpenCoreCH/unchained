import { Context } from '@unchainedshop/types/api';
import {
  AssortmentPathLink as AssortmentPathLinkType,
  AssortmentLink as AssortmentLinkType,
  AssortmentText,
} from '@unchainedshop/types/assortments';

type HelperType<P, T> = (assortmentPathLink: AssortmentPathLinkType, params: P, context: Context) => T;

export interface AssortmentPathLinkHelperTypes {
  link: (
    params: { assortmentId: string; childAssortmentId: string },
    _: never,
    context: Context,
  ) => Promise<AssortmentLinkType>;

  assortmentSlug: HelperType<{ forceLocale?: string }, Promise<string>>;

  assortmentTexts: HelperType<{ forceLocale?: string }, Promise<AssortmentText>>;
}

export const AssortmentPathLink: AssortmentPathLinkHelperTypes = {
  link: async ({ assortmentId, childAssortmentId }, _, { modules }) => {
    return modules.assortments.links.findLink({
      parentAssortmentId: assortmentId,
      childAssortmentId,
    });
  },

  assortmentSlug: async ({ assortmentId }, params, { modules, localeContext }) => {
    const text = await modules.assortments.texts.findLocalizedText({
      assortmentId,
      locale: params.forceLocale || localeContext.normalized,
    });

    return text.slug;
  },

  assortmentTexts: async ({ assortmentId }, params, { modules, localeContext }) => {
    return modules.assortments.texts.findLocalizedText({
      assortmentId,
      locale: params.forceLocale || localeContext.normalized,
    });
  },
};
