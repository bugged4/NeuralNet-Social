const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express4');

const getGraphQLUser = require('./authContext');
const resolvers = require('./resolvers');
const typeDefs = require('./typeDefs');

const createGraphQLMiddleware = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production'
  });

  await server.start();

  return expressMiddleware(server, {
    context: async ({ req }) => ({
      user: await getGraphQLUser(req)
    })
  });
};

module.exports = createGraphQLMiddleware;
