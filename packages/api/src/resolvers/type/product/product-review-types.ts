import { Context } from '@unchainedshop/types/api';
import { Product } from '@unchainedshop/types/products';
import {
  ProductReview as ProductReviewType,
  ProductReviewVoteType,
  ProductVote,
} from '@unchainedshop/types/products.reviews';
import { User } from '@unchainedshop/types/user';

type HelperType<P, T> = (product: ProductReviewType, params: P, context: Context) => T;

export interface ProductReviewHelperTypes {
  author: HelperType<never, Promise<User>>;
  product: HelperType<never, Promise<Product>>;
  voteCount: HelperType<{ type: ProductReviewVoteType }, number>;
  ownVotes: HelperType<never, Promise<Array<ProductVote>>>;
}
export const ProductReview: ProductReviewHelperTypes = {
  author: async (obj, _, { modules }) => {
    return modules.users.findUserById(obj.authorId);
  },

  product: async (obj, _, { modules }) => {
    return modules.products.findProduct({ productId: obj.productId });
  },

  ownVotes: async (obj, _, { modules, userId }) => {
    return modules.products.reviews.votes.ownVotes(obj, { userId });
  },

  voteCount: (obj, { type }, { modules }) => {
    return modules.products.reviews.votes.userIdsThatVoted(obj, { type }).length;
  },
};
