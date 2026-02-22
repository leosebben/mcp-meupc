import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { searchComponentsSchema, searchComponents } from "./tools/search-components.js";
import { listComponentsSchema, listComponents } from "./tools/list-components.js";
import { getComponentDetailsSchema, getComponentDetails } from "./tools/get-component-details.js";
import { getDealsSchema, getDeals } from "./tools/get-deals.js";
import { listCommunityBuildsSchema, listCommunityBuilds } from "./tools/list-community-builds.js";
import { getBuildDetailsSchema, getBuildDetails } from "./tools/get-build-details.js";

const server = new McpServer({
  name: "mcp-meupc",
  version: "1.0.0",
});

server.tool(
  "search_components",
  "Busca componentes de PC por texto no meupc.net (processadores, placas de vídeo, memórias, etc.)",
  searchComponentsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await searchComponents(params) }],
  })
);

server.tool(
  "list_components",
  "Lista componentes por categoria com paginação (processadores, placas-video, placas-mae, memorias, armazenamentos, gabinetes, fontes, monitores)",
  listComponentsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await listComponents(params) }],
  })
);

server.tool(
  "get_component_details",
  "Detalhes completos de um componente: especificações técnicas, preços por loja (PIX e normal), menor preço",
  getComponentDetailsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await getComponentDetails(params) }],
  })
);

server.tool(
  "get_deals",
  "Ofertas atuais com desconto no meupc.net, com preço atual e menor preço em 90 dias",
  getDealsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await getDeals(params) }],
  })
);

server.tool(
  "list_community_builds",
  "Builds de PC compartilhadas pela comunidade do meupc.net, com título, preço e componentes",
  listCommunityBuildsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await listCommunityBuilds(params) }],
  })
);

server.tool(
  "get_build_details",
  "Detalhes de uma build específica: lista completa de componentes, preços, compatibilidade e consumo estimado",
  getBuildDetailsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await getBuildDetails(params) }],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("mcp-meupc MCP server running");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
