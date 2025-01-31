import { Context } from './api';
import { FindOptions, TimestampFields, _ID } from './common';
import { File } from './files';

export type ProductMedia = {
  _id?: _ID;
  mediaId: string;
  productId: string;
  sortKey: number;
  tags: Array<string>;
  meta?: any;
  authorId: string;
} & TimestampFields;

export type ProductMediaText = {
  _id?: _ID;
  productMediaId: string;
  locale?: string;
  authorId: string;
  title?: string;
  subtitle?: string;
} & TimestampFields;

export type ProductMediaModule = {
  // Queries
  findProductMedia: (params: { productMediaId: string }) => Promise<ProductMedia>;

  findProductMedias: (
    params: {
      productId?: string;
      limit?: number;
      offset?: number;
      tags?: Array<string>;
    },
    options?: FindOptions,
  ) => Promise<Array<ProductMedia>>;

  // Mutations
  create: (data: { productId: string; mediaId: string }, userId: string) => Promise<ProductMedia>;

  delete: (productMediaId: string, userId?: string) => Promise<number>;
  deleteMediaFiles: (params: {
    productId?: string;
    excludedProdcutIds?: Array<_ID>;
    excludedProductMediaIds?: Array<_ID>;
  }) => Promise<number>;

  update: (productMediaId: string, productMedia: ProductMedia) => Promise<ProductMedia>;
  updateManualOrder: (
    params: {
      sortKeys: Array<{
        productMediaId: string;
        sortKey: number;
      }>;
    },
    userId?: string,
  ) => Promise<Array<ProductMedia>>;

  texts: {
    // Queries
    findMediaTexts: (query: { productMediaId: string }) => Promise<Array<ProductMediaText>>;

    findLocalizedMediaText: (query: {
      productMediaId: string;
      locale: string;
    }) => Promise<ProductMediaText>;

    // Mutations
    updateMediaTexts: (
      productMediaId: string,
      texts: Array<ProductMediaText>,
      userId: string,
    ) => Promise<Array<ProductMediaText>>;

    upsertLocalizedText: (
      productMediaId: string,
      locale: string,
      text: ProductMediaText,
      userId?: string,
    ) => Promise<ProductMediaText>;
  };
};

type HelperType<P, T> = (productMedia: ProductMedia, params: P, context: Context) => T;

export interface ProductMediaHelperTypes {
  texts: HelperType<{ forceLocale?: string }, Promise<ProductMediaText>>;
  file: HelperType<never, Promise<File>>;
}
