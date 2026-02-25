import { z } from "zod";
import { fetchPage, absoluteUrl, parsePrice } from "../scraper.js";
import type { DealResult } from "../types.js";

export const getDealsSchema = z.object({
  page: z.number().int().positive().default(1).describe("Número da página"),
  category: z.string().optional().describe("Filtrar por categoria (ex: 'processadores', 'placas-video', 'memorias')"),
});

export type GetDealsParams = z.infer<typeof getDealsSchema>;

export async function getDeals(params: GetDealsParams): Promise<string> {
  const { page, category } = params;

  let url = `/ofertas?page=${page}`;
  if (category) {
    url += `&peca=${encodeURIComponent(category)}`;
  }

  const root = await fetchPage(url);
  const results: DealResult[] = [];

  root.querySelectorAll("div.card.is-fullheight").forEach(card => {
    const name = card.querySelector(".card-content h3.title a")?.text.trim() ?? "";
    if (!name) return;

    const productUrl = card.querySelector(".card-content h3.title a")?.getAttribute("href") ?? "";

    const image = card.querySelector("header.card-image figure img")?.getAttribute("src") ?? null;

    // Loja
    const store = card.querySelector(".card-content p.uppertitle")?.text.trim()
      || card.querySelector("header.card-image div.loja-img img")?.getAttribute("alt")?.trim()
      || null;

    // Desconto (tag vermelha, ex: "-50%")
    const discount = card.querySelector(".card-content span.tag.is-danger")?.text.trim() || null;

    // Preço atual
    const currentPriceText = card.querySelector(".card-content a.preco")?.text.trim() ?? "";
    const currentPrice = parsePrice(currentPriceText) ?? 0;

    // Menor preço em 90 dias (no div.level.is-fullwidth)
    let oldPrice: number | null = null;

    card.querySelectorAll(".card-content div.level.is-fullwidth").forEach(lvl => {
      const text = lvl.text;
      if (text.includes("Menor") || text.includes("90 dias")) {
        const priceMatch = text.match(/R\$\s*([\d.,]+)/);
        if (priceMatch) {
          oldPrice = parsePrice(priceMatch[1]);
        }
      }
    });

    results.push({
      name,
      currentPrice,
      oldPrice,
      discount,
      store,
      url: absoluteUrl(productUrl),
      image: image ? absoluteUrl(image) : null,
    });
  });

  return JSON.stringify(results, null, 2);
}
