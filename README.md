# Arthetic: Gateway service

A Gateway service of Arthetic's microservice, and should only be running as a Apollo supergraph.

# Prerequisites

- Node Version : 18
- User service subgraph running
- Post service subgraph running
- Market service subgraph running

# Environment Setup

Before running the service, ensure that you have set up the required environment variables. Create a .env file in the root of your project and include the following variables:

```
JWT_SECRET= 'same-as-user-service'
PORT=
USER_SERVICE_URL=
POST_SERVICE_URL=
MARKET_SERVICE_URL=
CHAT_SERVICE_URL=

```

# Installation

```
pnpm install
```

# Start

- This service should be running after user, post, market service.

```
pnpm run dev
```
