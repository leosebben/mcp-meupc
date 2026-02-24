# mcp-meupc

### MCP server for Brazilian PC building and price comparison

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that lets AI assistants search PC components, compare prices across stores, find deals, and explore community builds on [meupc.net](https://meupc.net). No API keys required.

[![npm version](https://img.shields.io/npm/v/mcp-meupc.svg)](https://www.npmjs.com/package/mcp-meupc)
[![npm downloads](https://img.shields.io/npm/dm/mcp-meupc.svg)](https://www.npmjs.com/package/mcp-meupc)
[![GitHub stars](https://img.shields.io/github/stars/leosebben/mcp-meupc.svg?style=flat&logo=github&color=brightgreen)](https://github.com/leosebben/mcp-meupc/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Quick Start

Add the following config to your MCP client:

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

### MCP Client Configuration

<details open>
<summary><strong>Claude Code</strong></summary>

```bash
claude mcp add meupc -- npx -y mcp-meupc
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

[<img src="https://cursor.com/deeplink/mcp-install-dark.svg" alt="Install in Cursor" height="32">](https://cursor.com/install-mcp?name=meupc&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIm1jcC1tZXVwYyJdfQ%3D%3D)

Or go to `Cursor Settings` → `MCP` → `New MCP Server` and use the config above.

</details>

<details>
<summary><strong>VS Code / Copilot</strong></summary>

Install via the VS Code CLI:

```bash
code --add-mcp '{"name":"meupc","command":"npx","args":["-y","mcp-meupc"]}'
```

Or follow the [MCP install guide](https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_add-an-mcp-server) with the config above.

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

Add the config above to your `claude_desktop_config.json`:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

</details>

<details>
<summary><strong>Codex</strong></summary>

```bash
codex mcp add meupc -- npx -y mcp-meupc
```

</details>

<details>
<summary><strong>Windsurf</strong></summary>

Follow the [configure MCP guide](https://docs.windsurf.com/windsurf/cascade/mcp#mcp-config-json) using the config above.

</details>

<details>
<summary><strong>Cline</strong></summary>

Follow the [Cline MCP configuration guide](https://docs.cline.bot/mcp/configuring-mcp-servers) and use the config above.

</details>

<details>
<summary><strong>Warp</strong></summary>

Go to `Settings | AI | Manage MCP Servers` → `+ Add` to [add an MCP Server](https://docs.warp.dev/knowledge-and-collaboration/mcp#adding-an-mcp-server). Use the config above.

</details>

<details>
<summary><strong>JetBrains AI Assistant</strong></summary>

Go to `Settings | Tools | AI Assistant | Model Context Protocol (MCP)` → `Add`. Use the config above.

</details>

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
