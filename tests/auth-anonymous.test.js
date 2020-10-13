import { setupDatabase, createAnonymousGraphqlFetch } from './helpers';
import { User } from './seeds/users';

let connection;
let db;
let graphqlFetch;

describe('Auth for anonymous users', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createAnonymousGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.createUser', () => {
    it('create a new user', async () => {
      const {
        data: { createUser },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createUser(
            $username: String
            $email: String
            $password: String
            $profile: UserProfileInput
          ) {
            createUser(
              username: $username
              email: $email
              plainPassword: $password
              profile: $profile
            ) {
              id
              token
              user {
                _id
                profile {
                  displayName
                }
              }
            }
          }
        `,
        variables: {
          username: 'newuser',
          email: 'newuser@unchained.local',
          password: 'password',
          profile: {
            displayName: 'New User',
            birthday: new Date(),
            phoneMobile: '+410000000',
            gender: 'm',
            address: null,
            customFields: null,
          },
        },
      });
      expect(createUser).toMatchObject({
        user: {
          profile: {},
        },
      });
    });
  });

  describe('Mutation.loginAsGuest', () => {
    it('login as guest', async () => {
      const result = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            loginAsGuest {
              id
              token
            }
          }
        `,
      });
      expect(result.data.loginAsGuest).toMatchObject({});
    });
    it('user has guest flag', async () => {
      const Users = db.collection('users');
      const user = await Users.findOne({
        guest: true,
      });
      expect(user).toMatchObject({
        guest: true,
        emails: [
          {
            verified: false,
          },
        ],
      });
    });
  });

  describe('Mutation.loginWithPassword', () => {
    it('login via username and password', async () => {
      const { data: { loginWithPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            loginWithPassword(username: "admin", plainPassword: "password") {
              id
              token
              user {
                username
              }
            }
          }
        `,
      });
      expect(loginWithPassword).toMatchObject({
        id: 'admin',
        user: {
          username: 'admin',
        },
      });
    });
  });

  describe('Mutation.forgotPassword', () => {
    beforeAll(async () => {
      const Users = db.collection('users');
      await Users.findOrInsertOne({
        ...User,
        _id: 'userthatforgetspasswords',
        emails: [
          {
            address: 'userthatforgetspasswords@unchained.localhost',
            verified: true,
          },
        ],
      });
    });

    it('create a reset token', async () => {
      const { data: { forgotPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            forgotPassword(
              email: "userthatforgetspasswords@unchained.localhost"
            ) {
              success
            }
          }
        `,
      });
      expect(forgotPassword).toEqual({
        success: true,
      });
    });
  });

  describe('Mutation.resetPassword', () => {
    beforeAll(async () => {
      const Users = db.collection('users');
      await Users.findOrInsertOne({
        ...User,
        _id: 'userthatforgetspasswords',
        emails: [
          {
            address: 'userthatforgetspasswords@unchained.localhost',
            verified: true,
          },
        ],
      });
    });

    it('create a reset token', async () => {
      const { data: { forgotPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            forgotPassword(
              email: "userthatforgetspasswords@unchained.localhost"
            ) {
              success
            }
          }
        `,
      });
      expect(forgotPassword).toEqual({
        success: true,
      });
    });

    it('change password with token from forgotPassword call', async () => {
      // Reset the password with that token
      const Users = db.collection('users');
      const user = await Users.findOne({
        'emails.address': 'userthatforgetspasswords@unchained.localhost',
      });

      const {
        services: {
          password: {
            reset: [{ token }],
          },
        },
      } = user;

      const { data: { resetPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation resetPassword($newPlainPassword: String, $token: String!) {
            resetPassword(newPlainPassword: $newPlainPassword, token: $token) {
              id
              token
              user {
                _id
              }
            }
          }
        `,
        variables: {
          newPlainPassword: 'password',
          token,
        },
      });
      expect(resetPassword).toMatchObject({
        id: 'userthatforgetspasswords',
        user: {
          _id: 'userthatforgetspasswords',
        },
      });
    });
  });
});
