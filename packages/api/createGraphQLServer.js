import { ApolloServer } from 'apollo-server-express';
import { WebApp } from 'meteor/webapp';
import { createLogger } from 'meteor/unchained:core-logger';

import typeDefs from './schema';
import resolvers from './resolvers';

const logger = createLogger('unchained:api');

const { APOLLO_ENGINE_KEY } = process.env;

export default (options) => {
  const {
    corsOrigins = null, // no cookie handling
    typeDefs: additionalTypeDefs = [],
    resolvers: additionalResolvers = [],
    contextResolver,
    context,
    engine = {},
    ...apolloServerOptions
  } = options || {};

  const server = new ApolloServer({
    typeDefs: [...typeDefs, ...additionalTypeDefs],
    resolvers: [resolvers, ...additionalResolvers],
    context: context
      ? ({ req, res }) => {
          return context({ req, res, unchainedContextFn: contextResolver });
        }
      : contextResolver,
    formatError: (error) => {
      logger.error(error.originalError);
      if (error.originalError?.code) {
        // Use the originalError's code because that is more specific
        // Apollo autmatically decides if the stacktrace gets removed https://www.apollographql.com/docs/apollo-server/data/errors/#omitting-or-including-stacktrace
        error.extensions.code = error.originalError?.code; // eslint-disable-line
      }
      return error;
    },
    engine: APOLLO_ENGINE_KEY
      ? {
          apiKey: APOLLO_ENGINE_KEY,
          privateVariables: [
            'email',
            'plainPassword',
            'oldPlainPassword',
            'newPlainPassword',
          ],
          ...engine,
        }
      : undefined,
    ...apolloServerOptions,
  });

  const originFn =
    corsOrigins && Array.isArray(corsOrigins)
      ? (origin, callback) => {
          if (corsOrigins.length === 0 || !origin) {
            callback(null, true);
            return;
          }
          if (corsOrigins.indexOf(origin) !== -1) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
      : corsOrigins;

  server.applyMiddleware({
    app: WebApp.connectHandlers,
    path: '/graphql',
    cors: !originFn
      ? undefined
      : {
          origin: originFn,
          credentials: true,
        },
    bodyParserConfig: {
      limit: '5mb',
    },
  });

  WebApp.connectHandlers.use('/graphql', (req, res) => {
    if (req.method === 'GET') {
      res.end();
    }
  });

  return server;
};
