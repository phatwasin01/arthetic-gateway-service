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
import winston from "winston";
const myFormat = winston.format.printf(
  ({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
  }
);
// Configure the Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    myFormat
  ),
});

// Add Console transport if not in production
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Initialize Express
const app = express();

// Create HTTP server
const httpServer = http.createServer(app);

// Apollo Gateway setup
const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: "user", url: config.USER_SERVICE_URL || "http://users-svc:4000" },
      { name: "post", url: config.POST_SERVICE_URL || "http://posts-svc:4000" },
      {
        name: "market",
        url: config.MARKET_SERVICE_URL || "http://market-svc:4000",
      },
      // { name: "chat", url: config.CHAT_SERVICE_URL || "http://chat-svc:4000" },
    ],
  }),
  buildService({ url }) {
    return new RemoteGraphQLDataSource({
      url,
      willSendRequest({ request, context }) {
        const { token } = context;
        try {
          if (token && typeof token === "string") {
            const decoded = verifyJwtToken(token);
            request?.http?.headers.set("user-id", decoded.id);
          }
        } catch (err) {
          logger.warn("No valid token found");
        }
      },
    });
  },
});

// Apollo Server setup
const server = new ApolloServer({
  gateway,
  nodeEnv: "development",
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        logger.info("Server starting up!");
      },
      async requestDidStart() {
        // logger.info("Request started! Query");

        return {
          // Fires whenever Apollo Server will parse a GraphQL
          // request to create its associated document AST.
          async parsingDidStart() {
            logger.info("Parsing started!");
          },

          // Fires whenever Apollo Server will validate a
          // request's document AST against your GraphQL schema.
          async validationDidStart() {
            logger.info("Validation started!");
          },
        };
      },
    },
  ],
});

// Start the server
(async () => {
  await server.start();
  app.use(cors<cors.CorsRequest>({ origin: "*" }));
  app.use(express.json());
  app.use(
    "/graphql",
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

  logger.info(`🚀 Server ready at http://localhost:${config.PORT}/graphql`);
})();
