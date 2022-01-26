import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';

let graphqlFetch;

describe('WarehousingInterfaces', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('For logged in users', () => {
    it('should return list of warehousingInterfaces by type', async () => {
      const {
        data: { warehousingInterfaces },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query WarehousingInterfaces($type: WarehousingProviderType!) {
            warehousingInterfaces(type: $type) {
              _id
              label
              version
            }
          }
        `,
        variables: {
          type: 'PHYSICAL',
        },
      });

      expect(Array.isArray(warehousingInterfaces)).toBe(true);
    });
  });

  describe('For Anonymous user', () => {
    it('should return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query WarehousingInterfaces($type: WarehousingProviderType!) {
            warehousingInterfaces(type: $type) {
              _id
            }
          }
        `,
        variables: {
          type: 'PHYSICAL',
        },
      });

      expect(errors.length).toEqual(1);
    });
  });
});
