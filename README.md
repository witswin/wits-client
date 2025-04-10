# wits-client

**wits-client** is a TypeScript package that provides a simple and typed interface for interacting with the [wits.win](https://wits.win) APIs.

## Features

- Easy-to-use API client for `wits.win`
- Fully typed with TypeScript
- Supports both browser and Node.js environments
- Useful helpers and utilities for common API tasks

For more documentation head to [WITS](https://wits.win/docs).

## Installation

```bash
bun install wits-client
# or
npm install wits-client
```

## Usage

```ts
import { createClientAPI, createDashboardAPI } from 'wits-client'

export const clientAPI = createClientAPI({
  appId: 'APP_ID',
  jwtToken: 'jwtToken'
})

// Server side only

export const serverAPI = createDashboardAPI({
  appId: '',
  privateKey: ''
})
```

## Development

```bash
bun install
bun dev
```

## Formatting

To check code formatting:

```bash
bun format:check
```

To fix formatting issues:

```bash
bun format
```
