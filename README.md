# wits-client

**wits-client** is a TypeScript package that provides a simple and typed interface for interacting with the [wits.win](https://wits.win) APIs.

## Features

- Easy-to-use API client for `wits.win`
- Fully typed with TypeScript
- Supports both browser and Node.js environments
- Useful helpers and utilities for common API tasks

## Installation

```bash
bun install wits-client
# or
npm install wits-client
```

## Usage

```ts
import { WitsClient } from 'wits-client'

const client = new WitsClient({ apiKey: 'your-api-key' })

async function fetchData() {
  const result = await client.getDashboardData()
  console.log(result)
}
```

## API

### `WitsClient`

#### Constructor

```ts
new WitsClient(options: { apiKey: string })
```

#### Methods

- `getDashboardData(): Promise<DashboardData>`
- `getUserProfile(id: string): Promise<UserProfile>`
- `updateSettings(data: SettingsPayload): Promise<void>`

_(Add real method names and types based on your actual API.)_

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
