import { z } from "zod";
import { fetchPage, absoluteUrl, parsePrice } from "../scraper.js";
import type { ComponentDetails, StorePrice } from "../types.js";

export const getComponentDetailsSchema = z.object({
  url: z.string().describe("URL do componente (ex: '/peca/W6UIQZ/processador-amd-ryzen-7-5800x3d' ou URL completa)"),
});

export type GetComponentDetailsParams = z.infer<typeof getComponentDetailsSchema>;

export async function getComponentDetails(params: GetComponentDetailsParams): Promise<string> {
  const { url } = params;
  const root = await fetchPage(url);

  const name = root.querySelector("h1.title")?.text.trim() ?? "";

  // Extrair categoria do breadcrumb
  let category: string | null = null;
  root.querySelectorAll("nav.breadcrumb li a").forEach(el => {
    const href = el.getAttribute("href") ?? "";
    if (href.match(/meupc\.net\/\w/) && !href.includes("/peca/")) {
      category = el.text.trim();
    }
  });

  // Imagem principal
  const image = root.querySelector("div.glide ul.glide__slides li.glide__slide figure img")?.getAttribute("src")
    ?? root.querySelector("figure.image img")?.getAttribute("src")
    ?? null;

  // Especificações técnicas (primeira table.table.is-striped)
  const specs: Record<string, string> = {};
  root.querySelectorAll("table.table.is-striped tr").forEach(row => {
    const label = row.querySelector("th")?.text.trim() ?? "";
    if (!label) return;

    const td = row.querySelector("td");
    if (!td) return;

    // Verificar valores booleanos (ícones sim/não)
    const yesIcon = td.querySelector('span.icon[title="Sim"]');
    const noIcon = td.querySelector('span.icon[title="Não"], span.icon[title="Nao"], span.icon[title="Não/Nenhum"], span.icon[title="Nao/Nenhum"]');

    let value: string;
    if (yesIcon) {
      value = "Sim";
    } else if (noIcon) {
      value = "Não";
    } else {
      value = td.text.trim();
    }

    if (label && value) {
      specs[label] = value;
    }
  });

  // Preços por loja (table.table.is-responsive)
  const prices: StorePrice[] = [];
  root.querySelectorAll("table.table.is-responsive tbody tr").forEach(row => {
    const storeImg = row.querySelector("th a.loja-img img");
    const store = storeImg?.getAttribute("alt")?.trim() ?? storeImg?.getAttribute("title")?.trim() ?? "";
    if (!store) return;

    const priceTd = row.querySelector('td[data-label="Preco"], td.table-responsive-fullwidth.has-text-right');
    const priceText = priceTd?.querySelector("a.has-text-weight-bold")?.text.trim() ?? "";
    const price = parsePrice(priceText);

    const pixTd = row.querySelector('td[data-label="Preco PIX"]');
    const pixText = pixTd?.querySelector("a.has-text-weight-bold")?.text.trim() ?? "";
    const pricePix = parsePrice(pixText);

    const buyLink = row.querySelector("a.button.is-buy")?.getAttribute("href") ?? null;

    // Verificar disponibilidade — se não tem preço, não está disponível
    const available = price !== null || pricePix !== null;

    prices.push({
      store,
      price: price ?? 0,
      pricePix,
      url: buyLink ? absoluteUrl(buyLink) : null,
      available,
    });
  });

  // Menor preço (PIX se disponível, senão normal)
  const allPrices = prices
    .filter(p => p.available)
    .flatMap(p => [p.pricePix, p.price].filter((v): v is number => v !== null && v > 0));
  const lowestPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;

  const result: ComponentDetails = {
    name,
    category,
    specs,
    prices,
    lowestPrice,
    url: absoluteUrl(url),
    image: image ? absoluteUrl(image) : null,
  };

  return JSON.stringify(result, null, 2);
}
