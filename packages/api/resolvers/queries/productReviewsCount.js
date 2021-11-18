import { log } from 'unchained-logger';
import { ProductReviews } from 'meteor/unchained:core-products';

export default function productReviewsCount(root, { userId }) {
  log(`query productReviewsCount`, { userId });
  return ProductReviews.count();
}
