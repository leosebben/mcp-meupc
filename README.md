# mcp-meupc

Servidor [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) para o [meupc.net](https://meupc.net) — plataforma brasileira de montagem de PCs com comparação de preços.

Permite que assistentes de IA pesquisem componentes, comparem preços entre lojas, encontrem ofertas e explorem builds da comunidade, tudo diretamente via conversa.

## Ferramentas disponíveis

| Ferramenta | Descrição |
|---|---|
| `search_components` | Busca componentes por texto (ex: "rtx 4070", "ryzen 7") |
| `list_components` | Lista componentes por categoria com paginação e ordenação |
| `get_component_details` | Especificações técnicas completas e preços por loja (PIX e normal) |
| `get_deals` | Ofertas atuais com desconto e histórico de menor preço em 90 dias |
| `list_community_builds` | Builds compartilhadas pela comunidade |
| `get_build_details` | Detalhes de uma build: componentes, preços, compatibilidade e consumo |

**Categorias suportadas:** processadores, placas-video, placas-mae, memorias, armazenamentos, gabinetes, fontes, monitores, coolers-processador, water-coolers

## Instalação

### Claude Code

```bash
claude mcp add meupc -- npx -y mcp-meupc
```

### Claude Desktop

Adicione ao seu `claude_desktop_config.json`:

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

### Manual (do source)

```bash
git clone https://github.com/leosebben/mcp-meupc.git
cd mcp-meupc
npm install
npm run build

# Adicionar ao Claude Code
claude mcp add meupc -- node /caminho/para/mcp-meupc/build/index.js
```

## Desenvolvimento

```bash
npm run dev    # Executa com tsx (hot reload)
npm run build  # Compila TypeScript
npm start      # Executa versão compilada
```

## Stack

- [TypeScript](https://www.typescriptlang.org/)
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) — SDK oficial do MCP
- [Cheerio](https://cheerio.js.org/) — parsing de HTML
- [Zod](https://zod.dev/) — validação de schemas

## Licença

[MIT](LICENSE)
