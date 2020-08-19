import { log } from 'meteor/unchained:core-logger';
import { ProductVariations } from 'meteor/unchained:core-products';
import { ProductVariationNotFoundError, InvalidIdError } from '../../errors';

export default function (root, { productVariationId }, { userId }) {
  log(`mutation removeProductVariation ${productVariationId}`, { userId });
  if (!productVariationId) throw new InvalidIdError({ productVariationId });
  const productVariation = ProductVariations.findOne({
    _id: productVariationId,
  });
  if (!productVariation)
    throw new ProductVariationNotFoundError({ productVariationId });
  ProductVariations.remove({ _id: productVariationId });
  return productVariation;
}
