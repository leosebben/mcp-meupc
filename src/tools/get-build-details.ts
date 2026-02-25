import { z } from "zod";
import { fetchPage, absoluteUrl, parsePrice } from "../scraper.js";
import type { BuildDetails, BuildComponent } from "../types.js";

export const getBuildDetailsSchema = z.object({
  build_id: z.string().describe("ID da build (ex: 'oI7mI7', extraído da URL /build/{id})"),
});

export type GetBuildDetailsParams = z.infer<typeof getBuildDetailsSchema>;

export async function getBuildDetails(params: GetBuildDetailsParams): Promise<string> {
  const { build_id } = params;

  const root = await fetchPage(`/build/${build_id}`);

  // Título — pode ser genérico ("PC montado (Build)") ou customizado
  const title = root.querySelector("h1.title")?.text.trim() || "Build";

  // Autor — buscar no conteúdo da página
  const authorEl = root.querySelector("p.by a.has-text-weight-semibold, a[href*='/perfil/']");
  const author = authorEl?.text.trim() || null;

  // Compatibilidade / observações
  const compatNotes: string[] = [];
  root.querySelectorAll("article.message div.message-body ul li").forEach(li => {
    const note = li.text.trim();
    if (note) compatNotes.push(note);
  });

  // Consumo estimado
  const consumption = root.querySelector("div.consumption strong")?.text.trim() || null;

  // Componentes da build — iterar por <tr> individual (não por <tbody>)
  // pois múltiplos itens do mesmo tipo (ex: 2 pentes de RAM) ficam
  // em <tr> separados dentro do mesmo <tbody>
  const components: BuildComponent[] = [];

  root.querySelectorAll("table.table.is-body-striped tbody:not(.table-responsive-totals) tr").forEach(row => {
    // Tipo do componente (ex: "Processador", "Placa de vídeo")
    const type = row.querySelector("th.table-responsive-title a")?.text.trim()
      || row.querySelector("th.table-responsive-title")?.text.trim()
      || "";
    if (!type) return;

    // Nome do componente (normalizar whitespace interno)
    const nameEl = row.querySelector("td.table-responsive-selection a.has-text-strong");
    const name = nameEl?.text.trim().replace(/\s+/g, " ") ?? "";
    if (!name) return;

    const componentUrl = nameEl?.getAttribute("href") ?? null;

    // Preço — tentar PIX (bold) primeiro, depois normal (medium)
    const pixText = row.querySelector("td.table-responsive-price a.has-text-weight-bold.has-text-success")?.text.trim() ?? "";
    const normalText = row.querySelector("td.table-responsive-price a.has-text-weight-medium.has-text-success")?.text.trim() ?? "";
    const price = parsePrice(pixText) ?? parsePrice(normalText);

    components.push({
      type,
      name,
      price,
      url: componentUrl ? absoluteUrl(componentUrl) : null,
    });
  });

  // Totais
  let totalPrice: number | null = null;
  let totalPricePix: number | null = null;

  root.querySelectorAll("tbody.table-responsive-totals tr").forEach(row => {
    const text = row.text;
    const priceCells = row.querySelectorAll("td.has-text-right");
    const priceCell = priceCells.length > 0 ? priceCells[priceCells.length - 1].text.trim() : "";

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
