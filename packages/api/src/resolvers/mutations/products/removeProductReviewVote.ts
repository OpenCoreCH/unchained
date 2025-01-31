import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { ProductReviewVoteType } from '@unchainedshop/types/products.reviews';
import { ProductReviewNotFoundError, InvalidIdError } from '../../../errors';

export default async function removeProductReviewVote(
  root: Root,
  params: { productReviewId: string; type: ProductReviewVoteType },
  { modules, userId }: Context,
) {
  const { productReviewId, type } = params;

  log(`mutation removeProductReviewVote ${productReviewId}`, { userId });

  if (!productReviewId) throw new InvalidIdError({ productReviewId });

  const productReview = await modules.products.reviews.findProductReview({
    productReviewId,
  });
  if (!productReview) throw new ProductReviewNotFoundError({ productReviewId });

  return modules.products.reviews.votes.removeVote(productReviewId, { type, userId }, userId);
}
