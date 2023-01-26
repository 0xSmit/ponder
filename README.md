# Ponder

A framework for blockchain app backends

## Documentation

For full documentation and guides, visit [ponder.sh](https://ponder.sh).

## Features

Ponder is an open-source framework for building frontend-ready APIs that serve blockchain data. It can be used as an alternative to Graph Protocol subgraphs.

- Local development server with hot reloading
- Familiar Node.js runtime and NPM package ecosystem
- Works with any Ethereum-based blockchain, and natively supports cross-chain apps

## Quickstart

The `create-ponder` command line interface is the easiest way to get started with Ponder.

### 1) Run the `create-ponder` CLI

This command creates a project folder called `ponder` in the current working directory. You can also bootstrap your project from a Graph Protocol subgraph (`--from-subgraph`) or an Etherscan contract link (`--from-etherscan`).

```bash
npm init ponder@latest
# or
pnpm create ponder
# or
yarn create ponder
```

### 2) Start the development server

The dev server is an important part of the Ponder development workflow. Just like Next.js, the dev server automatically reloads when you save changes in any project file. It also prints `console.log` statements and errors encountered while running your code.

```bash
cd ponder
```

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

### 3) Add contracts & networks to `ponder.config.ts`

Ponder uses `ponder.config.ts` to determine what blockchain data it needs to fetch. This is where you provide contract addresses, paths to ABI files, RPC URLs, start blocks, and more.

### 4) Define your schema

Ponder uses `schema.graphql` to define the project's schema. Any types marked with the `@entity` directive will become available as entity models in your handler functions.

Using this schema, Ponder automatically generates a GraphQL API that serves entity data.

### 5) Write event handlers

The files in the `handlers/` folder contain event handler functions. Ponder uses these functions to process blockchain events. These functions are where you should insert and update the entity data that will get served by the GraphQL API. [Visit the docs](https://ponder.sh) to learn more about writing event handlers.

## Contributing

If you're interested in contributing to Ponder, you can reach out via Twitter DM or open a GitHub issue.

## Packages

- `@ponder/core`
- `@ponder/graphql`
- `create-ponder`

## About

Ponder is MIT-licensed open-source software.
