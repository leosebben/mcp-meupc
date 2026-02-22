# mcp-meupc

### MCP server for Brazilian PC building and price comparison

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that lets AI assistants search PC components, compare prices across stores, find deals, and explore community builds on [meupc.net](https://meupc.net). No API keys required.

[![npm version](https://img.shields.io/npm/v/mcp-meupc.svg)](https://www.npmjs.com/package/mcp-meupc)
[![npm downloads](https://img.shields.io/npm/dm/mcp-meupc.svg)](https://www.npmjs.com/package/mcp-meupc)
[![GitHub stars](https://img.shields.io/github/stars/leosebben/mcp-meupc.svg?style=flat&logo=github&color=brightgreen)](https://github.com/leosebben/mcp-meupc/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Quick Start

### Claude Code

```bash
claude mcp add meupc -- npx -y mcp-meupc
```

### Cursor

[<img src="https://cursor.com/deeplink/mcp-install-dark.svg" alt="Install in Cursor" height="32">](https://cursor.com/install-mcp?name=meupc&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIm1jcC1tZXVwYyJdfQ%3D%3D)

### Claude Desktop / Windsurf / Other MCP Clients

```json
{
  "mcpServers": {
    "meupc": {
      "command": "npx",
      "args": ["-y", "mcp-meupc"]
    }
  }
}
```

## What can it do?

Ask your AI assistant to:

- **"Qual a placa de video mais barata?"** — Search components and compare prices
- **"Quero montar um PC gamer por R$5000"** — Explore community builds by budget
- **"Mostra as ofertas de SSD"** — Find current deals with discount history
- **"Detalha esse Ryzen 7 5800X3D"** — Get full specs and prices across stores

## Available Tools

| Tool | Description |
|---|---|
| `search_components` | Search components by text (e.g. "rtx 4070", "ryzen 7") |
| `list_components` | List components by category with pagination and sorting |
| `get_component_details` | Full specs and prices per store (PIX and regular) |
| `get_deals` | Current deals with discount and 90-day price history |
| `list_community_builds` | Community-shared PC builds |
| `get_build_details` | Build details: components, prices, compatibility, power consumption |

**Supported categories:** processadores, placas-video, placas-mae, memorias, armazenamentos, gabinetes, fontes, monitores, coolers-processador, water-coolers

## Install from Source

```bash
git clone https://github.com/leosebben/mcp-meupc.git
cd mcp-meupc
npm install
npm run build
claude mcp add meupc -- node /path/to/mcp-meupc/build/index.js
```

## Development

```bash
npm run dev    # Run with tsx (hot reload)
npm run build  # Compile TypeScript
npm start      # Run compiled version
```

## Stack

- [TypeScript](https://www.typescriptlang.org/)
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) — Official MCP SDK
- [Cheerio](https://cheerio.js.org/) — HTML parsing
- [Zod](https://zod.dev/) — Schema validation

## License

[MIT](LICENSE)
