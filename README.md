# ChordDB

<p align="center">
  <img src="https://raw.githubusercontent.com/imiakk/chorddb/refs/heads/main/assets/ChordDB%20logo.png" />
</p>

![Built with Node.js](https://img.shields.io/badge/Built%20with-Node.js-green?logo=node.js&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript&style=for-the-badge)
![npm](https://img.shields.io/npm/v/chorddb?style=for-the-badge)

**ChordDB** is a lightweight, MongoDB-inspired database that uses **Discord channels as storage**, with **end-to-end encryption** and optional **wrapper-based caching** for performance.

It is designed primarily for **bots, prototypes, and small-scale systems** where simplicity and zero external infrastructure matter.

## Features

- 📦 Discord messages as database records (1 message = 1 document)
- 🔐 AES-GCM encryption using Node.js `crypto`
- 🧠 Mongo-like query & update operators (`$set`, `$inc`, `$unset`, `$push`)
- ⚡ Cache-aware fetching (recommended with Discord API wrappers)
- 🧩 ESM-first with CJS support
- 🧪 Works with plain JSON data

## Installation

### npm

```bash
npm install chorddb
```

## Importing

### ESM (recommended)

```js
import { Chord } from "chorddb";
```

### CommonJS

```js
const { Chord } = require("chorddb");
```

## Initialization

### Create a Chord instance

```ts
import { Chord, getKey } from "chorddb";

const chord = new Chord({
	token: "YOUR_BOT_TOKEN",
	key: getKey("YOUR_ENCRYPTION_KEY_OR_PASSWORD"),
	collections: [
		{ name: "users", channelId: "1469947881367797825" },
		{ name: "guilds", channelId: "1469947881367797826" },
	],
});
```

> [!NOTE]  
> You can optionally provide a Discord API wrapper (discord.js, oceanic, bakit, etc.)
> to enable **cache-based reads** and reduce REST usage.

### Use with Discord API wrappers

```ts
import { Chord } from "chorddb";
import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

const chord = new Chord({
	token: "YOUR_BOT_TOKEN",
	key: getKey("YOUR_ENCRYPTION_KEY_OR_PASSWORD"),
	collections: [...]
});

// Listen for gateway payloads to make sure the cache is up-to-date
client.on("raw", (payload) => chord.updateGatewayPayload(payload));

// Enable wrapper mode for caching
// You can either use await it or just let it run
await chord.useWrapper();

await client.login("YOUR_BOT_TOKEN");
```

### Create / Access a Collection

```ts
const users = chord.collect("users");
const guilds = chord.collect("guilds");
```

## Basic Usage

### Insert a document

```ts
await users.create({
	username: "someone",
	coins: 100,
});
```

### Find documents

```ts
await users.findBy({
	username: "someone",
});

await users.findById("123"); // ID is the message ID
```

or using a predicate:

```ts
const richUsers = await users.findBy((doc) => doc.coins > 500);
```

### Update documents

```ts
await users.updateBy(
	{ username: "someone" },
	{
		$inc: { coins: 50 },
		$set: { premium: true },
	},
);
```

### Fetch all documents

```ts
const allUsers = await users.findAll();
```

## Query & Update Operators

### Supported filters

- Object matching
- Predicate functions

### Supported update operators

- `$set`
- `$inc`
- `$unset`
- `$push`

(Operator behavior is intentionally Mongo-like but simplified.)

## Performance Notes

- **Cache is optional but strongly recommended**
- Without a wrapper cache, ChordDB falls back to paginated REST fetching
- Fetching is lazy and incremental to avoid rate limits

## Intended Use Cases

- ✅ Prototype bots
- ✅ Startup MVPs
- ✅ Small persistent data needs
- ⚠️ Not intended for high-write or large-scale production databases

## Roadmap

- Image / binary uploads
- Indexing helpers
- Better schema validation
- Query optimization

## Contributing

Contributions are welcome! Please open an issue or pull request if you have any suggestions or find any bugs.

Thanks to everyone who helps make ChordDB better!

<div align="center">
  <a href="https://github.com/open-devhub/chorddb/graphs/contributors">
	<img src="https://contrib.rocks/image?repo=open-devhub/chorddb" />
  </a>
</div>
