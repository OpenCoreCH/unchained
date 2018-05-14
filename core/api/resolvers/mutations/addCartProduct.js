import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { Users } from 'meteor/unchained:core-users';
import { ProductNotFoundError, UserNotFoundError } from '../errors';

export default function (root, { productId, quantity }, { userId, countryContext }) {
  log(`mutation addCartProduct ${productId} ${quantity}`, { userId });
  const user = Users.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError({ userId });
  const product = Products.findOne({ _id: productId });
  if (!product) throw new ProductNotFoundError({ data: { productId } });
  const cart = user.initCart({ countryCode: countryContext });
  return cart.addItem({ productId, quantity });
}
