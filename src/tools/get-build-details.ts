import { z } from "zod";
import { fetchPage, absoluteUrl, parsePrice } from "../scraper.js";
import type { BuildDetails, BuildComponent } from "../types.js";

export const getBuildDetailsSchema = z.object({
  build_id: z.string().describe("ID da build (ex: 'oI7mI7', extraído da URL /build/{id})"),
});

export type GetBuildDetailsParams = z.infer<typeof getBuildDetailsSchema>;

export async function getBuildDetails(params: GetBuildDetailsParams): Promise<string> {
  const { build_id } = params;

  const $ = await fetchPage(`/build/${build_id}`);

  // Título — pode ser genérico ("PC montado (Build)") ou customizado
  const title = $("h1.title").first().text().trim() || "Build";

  // Autor — buscar no conteúdo da página
  const authorEl = $("p.by a.has-text-weight-semibold, a[href*='/perfil/']").first();
  const author = authorEl.text().trim() || null;

  // Compatibilidade / observações
  const compatNotes: string[] = [];
  $("article.message div.message-body ul li").each((_, li) => {
    const note = $(li).text().trim();
    if (note) compatNotes.push(note);
  });

  // Consumo estimado
  const consumption = $("div.consumption strong").text().trim() || null;

  // Componentes da build — iterar por <tr> individual (não por <tbody>)
  // pois múltiplos itens do mesmo tipo (ex: 2 pentes de RAM) ficam
  // em <tr> separados dentro do mesmo <tbody>
  const components: BuildComponent[] = [];

  $("table.table.is-body-striped tbody:not(.table-responsive-totals) tr").each((_, row) => {
    const $row = $(row);

    // Tipo do componente (ex: "Processador", "Placa de vídeo")
    const type = $row.find("th.table-responsive-title a").first().text().trim()
      || $row.find("th.table-responsive-title").first().text().trim();
    if (!type) return;

    // Nome do componente (normalizar whitespace interno)
    const nameEl = $row.find("td.table-responsive-selection a.has-text-strong").first();
    const name = nameEl.text().trim().replace(/\s+/g, " ");
    if (!name) return;

    const componentUrl = nameEl.attr("href") ?? null;

    // Preço — tentar PIX (bold) primeiro, depois normal (medium)
    const pixText = $row.find("td.table-responsive-price a.has-text-weight-bold.has-text-success").first().text().trim();
    const normalText = $row.find("td.table-responsive-price a.has-text-weight-medium.has-text-success").first().text().trim();
    const price = parsePrice(pixText) ?? parsePrice(normalText);

    components.push({
      type,
      name,
      price,
      url: componentUrl ? absoluteUrl(componentUrl) : null,
    });
  });

  // Totais
  const totalsRows = $("tbody.table-responsive-totals tr");
  let totalPrice: number | null = null;
  let totalPricePix: number | null = null;

  totalsRows.each((_, row) => {
    const text = $(row).text();
    const priceCell = $(row).find("td.has-text-right").last().text().trim();

    if (text.includes("Total no PIX") || text.includes("Total PIX")) {
      totalPricePix = parsePrice(priceCell);
    } else if (text.includes("Total") && !text.includes("Desconto")) {
      totalPrice = parsePrice(priceCell);
    }
  });

  const result: BuildDetails & {
    totalPricePix: number | null;
    compatibility: string[];
    consumption: string | null;
  } = {
    title,
    author,
    totalPrice: totalPricePix ?? totalPrice,
    likes: null, // Não disponível na página de detalhes
    components,
    url: absoluteUrl(`/build/${build_id}`),
    totalPricePix,
    compatibility: compatNotes,
    consumption,
  };

  return JSON.stringify(result, null, 2);
}
