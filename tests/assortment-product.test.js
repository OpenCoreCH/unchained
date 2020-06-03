import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from "./helpers";
import { ADMIN_TOKEN } from "./seeds/users";
import { SimpleAssortment, AssortmentProduct } from "./seeds/assortments";
import { SimpleProduct } from "./seeds/products";

let connection;
let graphqlFetch;

describe("AssortmentProduct", () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe("mutation.reorderAssortmentProducts for admin user should", () => {
    it("reorder assortment product successfuly when passed valid assortment product ID", async () => {
      const {
        data: { reorderAssortmentProducts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentProducts(
            $sortKeys: [ReorderAssortmentProductInput!]!
          ) {
            reorderAssortmentProducts(sortKeys: $sortKeys) {
              _id
              sortKey
              tags
              meta
              assortment {
                _id
              }
              product {
                _id
              }
            }
          }
        `,
        variables: {
          sortKeys: [
            {
              assortmentProductId: AssortmentProduct._id,
              sortKey: 9,
            },
          ],
        },
      });

      expect(reorderAssortmentProducts[0].sortKey).toEqual(10);
    });

    it("return empty array when passed non-existing assortment product ID", async () => {
      const {
        data: { reorderAssortmentProducts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentProducts(
            $sortKeys: [ReorderAssortmentProductInput!]!
          ) {
            reorderAssortmentProducts(sortKeys: $sortKeys) {
              _id
            }
          }
        `,
        variables: {
          sortKeys: [
            {
              assortmentProductId: "none-existing-id",
              sortKey: 9,
            },
          ],
        },
      });
      expect(reorderAssortmentProducts.length).toEqual(0);
    });
  });

  describe("mutation.reorderAssortmentProducts for anonymous user should", () => {
    it("return error", async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentProducts(
            $sortKeys: [ReorderAssortmentProductInput!]!
          ) {
            reorderAssortmentProducts(sortKeys: $sortKeys) {
              _id
            }
          }
        `,
        variables: {
          sortKeys: [
            {
              assortmentProductId: "none-existing-id",
              sortKey: 9,
            },
          ],
        },
      });
      expect(errors.length).toEqual(1);
    });
  });

  describe("mutation.addAssortmentProduct for admin user should", () => {
    it("add assortment successfuly when passed valid assortment & product id", async () => {
      const {
        data: { addAssortmentProduct },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentProduct(
            $assortmentId: ID!
            $productId: ID!
            $tags: [String!]
          ) {
            addAssortmentProduct(
              assortmentId: $assortmentId
              productId: $productId
              tags: $tags
            ) {
              _id
              sortKey
              tags
              meta
              assortment {
                _id
              }
              product {
                _id
              }
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[1]._id,
          productId: SimpleProduct._id,
          tags: ["assortment-product-et"],
        },
      });

      expect(addAssortmentProduct._id).not.toBe(null);
    });

    it("return error when passed in-valid product id", async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentProduct(
            $assortmentId: ID!
            $productId: ID!
            $tags: [String!]
          ) {
            addAssortmentProduct(
              assortmentId: $assortmentId
              productId: $productId
              tags: $tags
            ) {
              _id
              sortKey
              tags
              meta
              assortment {
                _id
              }
              product {
                _id
              }
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          productId: "non-existing-product-id",
          tags: ["assortment-product-et"],
        },
      });

      expect(errors.length).toEqual(1);
    });

    it("return error when passed in-valid assortment id", async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentProduct(
            $assortmentId: ID!
            $productId: ID!
            $tags: [String!]
          ) {
            addAssortmentProduct(
              assortmentId: $assortmentId
              productId: $productId
              tags: $tags
            ) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: "non-existing-assortment-id",
          productId: SimpleProduct._id,
        },
      });

      expect(errors.length).toEqual(1);
    });
  });

  describe("mutation.addAssortmentProduct anonymous user should", () => {
    it("return error", async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentProduct(
            $assortmentId: ID!
            $productId: ID!
            $tags: [String!]
          ) {
            addAssortmentProduct(
              assortmentId: $assortmentId
              productId: $productId
              tags: $tags
            ) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          productId: SimpleProduct._id,
          tags: ["assortment-product-et"],
        },
      });

      expect(errors.length).toEqual(1);
    });
  });

  describe("mutation.removeAssortmentProduct for admin user should", () => {
    it("remove assortment product successfuly when passed valid assortment product id", async () => {
      const {
        data: { removeAssortmentProduct },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentProduct($assortmentProductId: ID!) {
            removeAssortmentProduct(assortmentProductId: $assortmentProductId) {
              _id
              sortKey
              tags

              product {
                _id
              }
            }
          }
        `,
        variables: {
          assortmentProductId: AssortmentProduct._id,
        },
      });
      expect(removeAssortmentProduct._id).toEqual(AssortmentProduct._id);
    });

    it("return error when passed in-valid assortment product id", async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentProduct($assortmentProductId: ID!) {
            removeAssortmentProduct(assortmentProductId: $assortmentProductId) {
              _id
            }
          }
        `,
        variables: {
          assortmentProductId: "none-existing-id",
        },
      });

      expect(errors.length).toEqual(1);
    });
  });

  describe("mutation.removeAssortmentProduct for anonymous user should", () => {
    it("return error", async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentProduct($assortmentProductId: ID!) {
            removeAssortmentProduct(assortmentProductId: $assortmentProductId) {
              _id
            }
          }
        `,
        variables: {
          assortmentProductId: AssortmentProduct._id,
        },
      });
      expect(errors.length).toEqual(1);
    });
  });
});
