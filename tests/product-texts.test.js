import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';
import { SimpleProduct } from './seeds/products';

let connection;
let graphqlFetch;

describe('ProductText', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('mutation.updateProductTexts should for admin user', () => {
    it('Update product texts successfuly', async () => {
      const { data: { updateProductTexts } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductTexts(
            $productId: ID!
            $texts: [UpdateProductTextInput!]!
          ) {
            updateProductTexts(productId: $productId, texts: $texts) {
              _id
              locale
              slug
              title
              description
              brand
              vendor
              labels
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          texts: [
            {
              locale: 'et',
              slug: 'slug-et',
              title: 'simple product title et',
              brand: 'brand-et',
              description: 'text-et',
              labels: ['label-et-1', 'label-et-2'],
              subtitle: 'subtitle-et',
              vendor: 'vendor-et',
            },
          ],
        },
      });

      expect(updateProductTexts.length).toEqual(1);
    });

    it('return not found error when passed non existing productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductTexts(
            $productId: ID!
            $texts: [UpdateProductTextInput!]!
          ) {
            updateProductTexts(productId: $productId, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          productId: 'none-existing-id',
          texts: [
            {
              locale: 'et',
              slug: 'slug-et',
              title: 'simple product title et',
              brand: 'brand-et',
              description: 'text-et',
              labels: ['label-et-1', 'label-et-2'],
              subtitle: 'subtitle-et',
              vendor: 'vendor-et',
            },
          ],
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductTexts(
            $productId: ID!
            $texts: [UpdateProductTextInput!]!
          ) {
            updateProductTexts(productId: $productId, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          productId: '',
          texts: [
            {
              locale: 'et',
              slug: 'slug-et',
              title: 'simple product title et',
              brand: 'brand-et',
              description: 'text-et',
              labels: ['label-et-1', 'label-et-2'],
              subtitle: 'subtitle-et',
              vendor: 'vendor-et',
            },
          ],
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.updateProductTexts for anonymous user', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateProductTexts(
            $productId: ID!
            $texts: [UpdateProductTextInput!]!
          ) {
            updateProductTexts(productId: $productId, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          texts: [
            {
              locale: 'et',
              slug: 'slug-et',
              title: 'simple product title et',
              brand: 'brand-et',
              description: 'text-et',
              labels: ['label-et-1', 'label-et-2'],
              subtitle: 'subtitle-et',
              vendor: 'vendor-et',
            },
          ],
        },
      });

      expect(errors.length).toEqual(1);
    });
  });
});
