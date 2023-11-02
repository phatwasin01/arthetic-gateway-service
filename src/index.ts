import { ApolloServer } from "@apollo/server";
import {
  ApolloGateway,
  IntrospectAndCompose,
  RemoteGraphQLDataSource,
} from "@apollo/gateway";
import { verifyJwtToken } from "./libs/auth";
import { config } from "./config";

import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";

const app = express();

const httpServer = http.createServer(app);

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: "user", url: config.USER_SERVICE_URL || "http://users-svc:4000" },
      { name: "post", url: config.POST_SERVICE_URL || "http://posts-svc:4000" },
      {
        name: "market",
        url: config.MARKET_SERVICE_URL || "http://market-svc:4000",
      },
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
        } catch (err) {
          console.log("No jwt token found");
        }
      },
    });
  },
});

const server = new ApolloServer({
  gateway,
  nodeEnv: "development",
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
(async () => {
  await server.start();
  app.use(
    "/graphql",
    cors<cors.CorsRequest>({ origin: "*" }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.authorization }),
    })
  );
  app.get("/", (req, res) => {
    res.send("hello world");
  });
  app.get("/health", (req, res) => {
    res.send("ok");
  });
  app.get("/healthz", (req, res) => {
    res.send("ok");
  });
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: config.PORT }, resolve)
  );
  console.log(`🚀  Server ready at: ${config.PORT}`);
})();
