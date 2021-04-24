import { Mongo } from 'meteor/mongo';
import { createFilesCollection } from 'meteor/unchained:core-files';

export const ProductMedia = new Mongo.Collection('product_media');
export const ProductMediaTexts = new Mongo.Collection('product_media_texts');

export const Media = createFilesCollection('media', {
  maxSize: 104857600,
  extensionRegex: /png|jpg|jpeg|pdf/i,
});
