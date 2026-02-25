import { z } from "zod";
import { fetchPage, absoluteUrl, parsePrice } from "../scraper.js";
import type { ComponentResult } from "../types.js";

export const searchComponentsSchema = z.object({
  query: z.string().describe("Texto para buscar componentes (ex: 'rtx 4070', 'ryzen 7')"),
  limit: z.number().int().positive().default(10).describe("Número máximo de resultados"),
});

export type SearchComponentsParams = z.infer<typeof searchComponentsSchema>;

export async function searchComponents(params: SearchComponentsParams): Promise<string> {
  const { query, limit } = params;
  const encoded = encodeURIComponent(query);
  const root = await fetchPage(`/pesquisar?q=${encoded}`);

  const results: ComponentResult[] = [];

  for (const el of root.querySelectorAll("div.media")) {
    if (results.length >= limit) break;

    const name = el.querySelector("div.media-content a h4")?.text.trim() ?? "";
    if (!name) continue;

    const url = el.querySelector("div.media-content > a")?.getAttribute("href") ?? "";
    const image = el.querySelector("div.media-left figure img")?.getAttribute("src") ?? null;

    // Extrair categoria do link "Add na build" (ex: /processadores/add/HASH)
    const addLink = el.querySelector("a.button.is-link")?.getAttribute("href") ?? "";
    const categoryMatch = addLink.match(/meupc\.net\/([^/]+)\/add\//);
    const category = categoryMatch ? categoryMatch[1] : null;

    // Extrair preço do parágrafo de preço
    const priceP = el.querySelectorAll("div.media-content > p").find(p => p.text.includes("R$"));
    const priceText = priceP?.text ?? "";

    // Tentar pegar preço PIX primeiro, senão preço normal
    const pixMatch = priceText.match(/R\$\s*([\d.,]+)\s*no PIX/);
    const normalMatch = priceText.match(/R\$\s*([\d.,]+)/);
    const priceStr = pixMatch ? pixMatch[1] : normalMatch ? normalMatch[1] : null;
    const price = parsePrice(priceStr);

    results.push({
      name,
      category,
      price,
      url: absoluteUrl(url),
      image: image && !image.includes("placeholder") ? absoluteUrl(image) : null,
    });
  }

  return JSON.stringify(results, null, 2);
}
