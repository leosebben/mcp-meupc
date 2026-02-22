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

  const $ = await fetchPage(url);
  const results: DealResult[] = [];

  $("div.card.is-fullheight").each((_, el) => {
    const $card = $(el);

    const name = $card.find(".card-content h3.title a").text().trim();
    if (!name) return;

    const productUrl = $card.find(".card-content h3.title a").attr("href") ?? "";

    const image = $card.find("header.card-image figure img").attr("src") ?? null;

    // Loja
    const store = $card.find(".card-content p.uppertitle").text().trim()
      || $card.find("header.card-image div.loja-img img").attr("alt")?.trim()
      || null;

    // Desconto (tag vermelha, ex: "-50%")
    const discount = $card.find(".card-content span.tag.is-danger").text().trim() || null;

    // Preço atual
    const currentPriceText = $card.find(".card-content a.preco").text().trim();
    const currentPrice = parsePrice(currentPriceText) ?? 0;

    // Menor preço em 90 dias (no div.level.is-fullwidth)
    const levels = $card.find(".card-content div.level.is-fullwidth");
    let oldPrice: number | null = null;

    levels.each((_, lvl) => {
      const text = $(lvl).text();
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
