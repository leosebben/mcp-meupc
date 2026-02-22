import { z } from "zod";
import { fetchPage, absoluteUrl, parsePrice } from "../scraper.js";
import type { ComponentDetails, StorePrice } from "../types.js";

export const getComponentDetailsSchema = z.object({
  url: z.string().describe("URL do componente (ex: '/peca/W6UIQZ/processador-amd-ryzen-7-5800x3d' ou URL completa)"),
});

export type GetComponentDetailsParams = z.infer<typeof getComponentDetailsSchema>;

export async function getComponentDetails(params: GetComponentDetailsParams): Promise<string> {
  const { url } = params;
  const $ = await fetchPage(url);

  const name = $("h1.title").first().text().trim();

  // Extrair categoria do breadcrumb
  const breadcrumbs = $("nav.breadcrumb li a");
  let category: string | null = null;
  breadcrumbs.each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (href.match(/meupc\.net\/\w/) && !href.includes("/peca/")) {
      category = $(el).text().trim();
    }
  });

  // Imagem principal
  const image = $("div.glide ul.glide__slides li.glide__slide figure img").first().attr("src")
    ?? $("figure.image img").first().attr("src")
    ?? null;

  // Especificações técnicas (primeira table.table.is-striped)
  const specs: Record<string, string> = {};
  $("table.table.is-striped tr").each((_, row) => {
    const label = $(row).find("th").text().trim();
    if (!label) return;

    const td = $(row).find("td");
    // Verificar valores booleanos (ícones sim/não)
    const yesIcon = td.find('span.icon[title="Sim"]');
    const noIcon = td.find('span.icon[title="Não"], span.icon[title="Nao"], span.icon[title="Não/Nenhum"], span.icon[title="Nao/Nenhum"]');

    let value: string;
    if (yesIcon.length > 0) {
      value = "Sim";
    } else if (noIcon.length > 0) {
      value = "Não";
    } else {
      value = td.text().trim();
    }

    if (label && value) {
      specs[label] = value;
    }
  });

  // Preços por loja (table.table.is-responsive)
  const prices: StorePrice[] = [];
  $("table.table.is-responsive tbody tr").each((_, row) => {
    const $row = $(row);
    const storeImg = $row.find("th a.loja-img img");
    const store = storeImg.attr("alt")?.trim() ?? storeImg.attr("title")?.trim() ?? "";
    if (!store) return;

    const priceTd = $row.find('td[data-label="Preco"], td.table-responsive-fullwidth.has-text-right');
    const priceText = priceTd.find("a.has-text-weight-bold").first().text().trim();
    const price = parsePrice(priceText);

    const pixTd = $row.find('td[data-label="Preco PIX"]');
    const pixText = pixTd.find("a.has-text-weight-bold").first().text().trim();
    const pricePix = parsePrice(pixText);

    const buyLink = $row.find("a.button.is-buy").attr("href") ?? null;

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
