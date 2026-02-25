import { z } from "zod";
import type { HTMLElement } from "node-html-parser";
import { fetchPage, absoluteUrl, parsePrice, BASE_URL } from "../scraper.js";
import type { ComponentResult } from "../types.js";

const CATEGORIES = [
  "processadores",
  "placas-video",
  "placas-mae",
  "memorias",
  "armazenamentos",
  "gabinetes",
  "fontes",
  "monitores",
  "coolers-processador",
  "water-coolers",
] as const;

export const listComponentsSchema = z.object({
  category: z.enum(CATEGORIES).describe("Categoria de componente (ex: 'processadores', 'placas-video')"),
  page: z.number().int().positive().default(1).describe("Número da página"),
  sort: z.string().optional().describe("Ordenação (ex: 'menor-preco', 'maior-preco')"),
});

export type ListComponentsParams = z.infer<typeof listComponentsSchema>;

/**
 * A página de categorias usa Vue.js client-side para renderizar os produtos.
 * Como não executamos JS, tentamos duas estratégias:
 * 1. Extrair dados JSON embutidos nos scripts da página (window.meupcnetPecas etc.)
 * 2. Se não encontrar, usar a busca (/pesquisar) como fallback
 */
export async function listComponents(params: ListComponentsParams): Promise<string> {
  const { category, page, sort } = params;

  // Tentar extrair dados do script embutido na página de categoria
  const categoryUrl = `/${category}?page=${page}${sort ? `&ordem=${sort}` : ""}`;
  const root = await fetchPage(categoryUrl);

  // Procurar dados JSON nos scripts da página
  const results = extractFromScripts(root, category);
  if (results.length > 0) {
    return JSON.stringify(results, null, 2);
  }

  // Fallback: usar a página de busca com termo da categoria
  const categoryTerms: Record<string, string> = {
    "processadores": "processador",
    "placas-video": "placa de video",
    "placas-mae": "placa mae",
    "memorias": "memoria ram",
    "armazenamentos": "ssd",
    "gabinetes": "gabinete",
    "fontes": "fonte",
    "monitores": "monitor",
    "coolers-processador": "cooler processador",
    "water-coolers": "water cooler",
  };

  const searchTerm = categoryTerms[category] ?? category;
  const encoded = encodeURIComponent(searchTerm);
  const searchRoot = await fetchPage(`/pesquisar?q=${encoded}&page=${page}`);

  const searchResults: ComponentResult[] = [];

  searchRoot.querySelectorAll("div.media").forEach(el => {
    const name = el.querySelector("div.media-content a h4")?.text.trim() ?? "";
    if (!name) return;

    const url = el.querySelector("div.media-content > a")?.getAttribute("href") ?? "";
    const image = el.querySelector("div.media-left figure img")?.getAttribute("src") ?? null;

    const addLink = el.querySelector("a.button.is-link")?.getAttribute("href") ?? "";
    const catMatch = addLink.match(/meupc\.net\/([^/]+)\/add\//);
    const cat = catMatch ? catMatch[1] : null;

    const priceP = el.querySelectorAll("div.media-content > p").find(p => p.text.includes("R$"));
    const priceText = priceP?.text ?? "";

    const pixMatch = priceText.match(/R\$\s*([\d.,]+)\s*no PIX/);
    const normalMatch = priceText.match(/R\$\s*([\d.,]+)/);
    const priceStr = pixMatch ? pixMatch[1] : normalMatch ? normalMatch[1] : null;
    const price = parsePrice(priceStr);

    searchResults.push({
      name,
      category: cat,
      price,
      url: absoluteUrl(url),
      image: image && !image.includes("placeholder") ? absoluteUrl(image) : null,
    });
  });

  return JSON.stringify({
    note: "Dados obtidos via busca (a listagem por categoria usa renderização client-side)",
    category,
    page,
    results: searchResults,
  }, null, 2);
}

function extractFromScripts(root: HTMLElement, category: string): ComponentResult[] {
  const results: ComponentResult[] = [];

  root.querySelectorAll("script").forEach(script => {
    const content = script.innerHTML ?? "";

    // Tentar encontrar arrays de dados de peças em variáveis window.*
    const patterns = [
      /window\.meupcnetPecas\s*=\s*(\[[\s\S]*?\]);/,
      /window\.meupcnetData\s*=\s*(\{[\s\S]*?\});/,
      /var\s+pecas\s*=\s*(\[[\s\S]*?\]);/,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          const items = Array.isArray(data) ? data : (data.pecas ?? data.items ?? []);
          for (const item of items) {
            results.push({
              name: item.nome ?? item.name ?? item.title ?? "",
              category,
              price: item.preco ?? item.price ?? item.menor_preco ?? null,
              url: item.url ? absoluteUrl(item.url) : `${BASE_URL}/peca/${item.hash ?? item.id ?? ""}`,
              image: item.imagem ?? item.image ?? null,
            });
          }
        } catch {
          // JSON parse falhou, continuar
        }
      }
    }
  });

  return results;
}
