# Version 4
FROM node:18-alpine as builder
WORKDIR /app
RUN npm install -g pnpm
COPY . .

RUN pnpm install
RUN pnpm build

FROM node:18-alpine AS final
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder ./app/dist ./dist
COPY package.json .
COPY pnpm-lock.yaml .
RUN pnpm install --production

ENV NODE_ENV production
EXPOSE 4000

CMD [ "pnpm", "start" ]