import { ApolloServer } from "@apollo/server";
import {
  ApolloGateway,
  IntrospectAndCompose,
  RemoteGraphQLDataSource,
} from "@apollo/gateway";
import { startStandaloneServer } from "@apollo/server/standalone";
import { verifyJwtToken } from "./libs/auth";
import { config } from "./config";
const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: "user", url: config.userServiceUrl },
      { name: "post", url: config.postServiceUrl },
    ],
  }),
  buildService({ url }) {
    return new RemoteGraphQLDataSource({
      url,
      willSendRequest({ request, context }) {
        // the request variable is to sent to subgraphs
        const { token } = context;
        try {
          if (token && typeof token === "string") {
            const decoded = verifyJwtToken(token);
            request?.http?.headers.set("user-id", decoded.id);
          }
        } catch (err) {}
      },
    });
  },
});

const server = new ApolloServer({
  gateway,
});

(async () => {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4002 },
    context: async ({ req }) => {
      const token = req.headers.authorization;
      return { token };
    },
  });
  console.log(`🚀  Server ready at: ${url}`);
})();
