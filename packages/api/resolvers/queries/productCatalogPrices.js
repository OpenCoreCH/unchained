import { log } from 'unchained-logger';
import { Products } from 'meteor/unchained:core-products';
import { InvalidIdError } from '../../errors';

export default function productCatalogPrices(root, { productId }, { userId }) {
  log(`query productCatalogPrices ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });
  const product = Products.findProduct({ productId });
  return product?.catalogPrices();
}
