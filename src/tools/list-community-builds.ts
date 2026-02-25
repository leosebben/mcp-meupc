import { z } from "zod";
import { fetchPage, absoluteUrl, parsePrice } from "../scraper.js";
import type { BuildSummary } from "../types.js";

const SORT_OPTIONS = ["melhores-recentes", "melhores", "novas"] as const;

export const listCommunityBuildsSchema = z.object({
  sort: z.enum(SORT_OPTIONS).default("melhores-recentes").describe("Ordenação das builds ('melhores-recentes', 'melhores', 'novas')"),
  page: z.number().int().positive().default(1).describe("Número da página"),
});

export type ListCommunityBuildsParams = z.infer<typeof listCommunityBuildsSchema>;

export async function listCommunityBuilds(params: ListCommunityBuildsParams): Promise<string> {
  const { sort, page } = params;

  const url = `/builds-comunidade?ordem=${sort}&page=${page}`;
  const root = await fetchPage(url);

  const results: BuildSummary[] = [];

  root.querySelectorAll("article.card.is-fullheight").forEach(card => {
    const titleEl = card.querySelector(".card-content h3.title a");
    const title = titleEl?.text.trim() ?? "";
    if (!title) return;

    const buildUrl = titleEl?.getAttribute("href") ?? "";

    // Autor
    const author = card.querySelector(".card-content p.by a.has-text-weight-semibold")?.text.trim() || null;

    // Preço total
    const priceText = card.querySelector(".card-content a.preco")?.text.trim() ?? "";
    const totalPrice = parsePrice(priceText);

    // Curtidas
    const likesAttr = card.querySelector("footer a.js-like-button")?.getAttribute("data-total-likes");
    const likesText = card.querySelector("footer span.js-like-total")?.text.trim() ?? "";
    const likes = likesAttr ? parseInt(likesAttr, 10) : (likesText ? parseInt(likesText, 10) : null);

    // Componentes principais (lista no card)
    const components: string[] = [];
    card.querySelectorAll(".card-content div.content.is-small ul li").forEach(li => {
      const comp = li.text.trim();
      if (comp) components.push(comp);
    });

    results.push({
      title,
      author,
      totalPrice,
      likes: isNaN(likes as number) ? null : likes,
      url: absoluteUrl(buildUrl),
      components,
    });
  });

  return JSON.stringify(results, null, 2);
}
