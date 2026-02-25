import { describe, it, expect, vi, beforeEach } from "vitest";
import { parse } from "node-html-parser";

vi.mock("../scraper.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../scraper.js")>();
  return { ...actual, fetchPage: vi.fn() };
});

import { fetchPage } from "../scraper.js";
import { getBuildDetails } from "./get-build-details.js";

const mockFetchPage = vi.mocked(fetchPage);

const BUILD_DETAILS_HTML = `
<html><body>
  <h1 class="title">Build Gamer 2024</h1>
  <p class="by">por <a class="has-text-weight-semibold" href="/perfil/leosebben">leosebben</a></p>

  <article class="message">
    <div class="message-body">
      <ul>
        <li>Pode ser necessário atualizar a BIOS da placa-mãe</li>
        <li>Verifique a compatibilidade do cooler com o socket</li>
      </ul>
    </div>
  </article>

  <div class="consumption"><strong>550W</strong></div>

  <table class="table is-body-striped">
    <tbody>
      <tr>
        <th class="table-responsive-title"><a>Processador</a></th>
        <td class="table-responsive-selection">
          <a class="has-text-strong" href="/peca/ABC/ryzen-7-5800x3d">AMD Ryzen 7 5800X3D</a>
        </td>
        <td class="table-responsive-price">
          <a class="has-text-weight-bold has-text-success">R$ 1.299,90</a>
        </td>
      </tr>
    </tbody>
    <tbody>
      <tr>
        <th class="table-responsive-title"><a>Placa de vídeo</a></th>
        <td class="table-responsive-selection">
          <a class="has-text-strong" href="/peca/DEF/rtx-4070-super">RTX 4070 Super</a>
        </td>
        <td class="table-responsive-price">
          <a class="has-text-weight-medium has-text-success">R$ 3.200,00</a>
        </td>
      </tr>
    </tbody>
    <tbody class="table-responsive-totals">
      <tr>
        <td>Total no PIX</td>
        <td class="has-text-right">R$ 5.000,00</td>
      </tr>
      <tr>
        <td>Total</td>
        <td class="has-text-right">R$ 5.500,00</td>
      </tr>
    </tbody>
  </table>
</body></html>
`;

beforeEach(() => {
  mockFetchPage.mockReset();
});

describe("getBuildDetails", () => {
  it("extrai título da build", async () => {
    mockFetchPage.mockResolvedValue(parse(BUILD_DETAILS_HTML));

    const result = JSON.parse(await getBuildDetails({ build_id: "oI7mI7" }));

    expect(result.title).toBe("Build Gamer 2024");
  });

  it("extrai autor", async () => {
    mockFetchPage.mockResolvedValue(parse(BUILD_DETAILS_HTML));

    const result = JSON.parse(await getBuildDetails({ build_id: "oI7mI7" }));

    expect(result.author).toBe("leosebben");
  });

  it("extrai notas de compatibilidade", async () => {
    mockFetchPage.mockResolvedValue(parse(BUILD_DETAILS_HTML));

    const result = JSON.parse(await getBuildDetails({ build_id: "oI7mI7" }));

    expect(result.compatibility).toEqual([
      "Pode ser necessário atualizar a BIOS da placa-mãe",
      "Verifique a compatibilidade do cooler com o socket",
    ]);
  });

  it("extrai consumo estimado", async () => {
    mockFetchPage.mockResolvedValue(parse(BUILD_DETAILS_HTML));

    const result = JSON.parse(await getBuildDetails({ build_id: "oI7mI7" }));

    expect(result.consumption).toBe("550W");
  });

  it("extrai componentes com tipo, nome, preço e URL", async () => {
    mockFetchPage.mockResolvedValue(parse(BUILD_DETAILS_HTML));

    const result = JSON.parse(await getBuildDetails({ build_id: "oI7mI7" }));

    expect(result.components).toHaveLength(2);
    expect(result.components[0]).toMatchObject({
      type: "Processador",
      name: "AMD Ryzen 7 5800X3D",
      price: 1299.9,
      url: "https://meupc.net/peca/ABC/ryzen-7-5800x3d",
    });
  });

  it("usa preço bold (PIX) quando disponível, senão medium (normal)", async () => {
    mockFetchPage.mockResolvedValue(parse(BUILD_DETAILS_HTML));

    const result = JSON.parse(await getBuildDetails({ build_id: "oI7mI7" }));

    // Processador tem preço bold
    expect(result.components[0].price).toBe(1299.9);
    // Placa de vídeo só tem preço medium
    expect(result.components[1].price).toBe(3200);
  });

  it("extrai total PIX como preço principal", async () => {
    mockFetchPage.mockResolvedValue(parse(BUILD_DETAILS_HTML));

    const result = JSON.parse(await getBuildDetails({ build_id: "oI7mI7" }));

    expect(result.totalPrice).toBe(5000);
    expect(result.totalPricePix).toBe(5000);
  });

  it("usa total normal quando não há PIX", async () => {
    const html = `
    <html><body>
      <h1 class="title">Build Simples</h1>
      <table class="table is-body-striped">
        <tbody class="table-responsive-totals">
          <tr><td>Total</td><td class="has-text-right">R$ 3.000,00</td></tr>
        </tbody>
      </table>
    </body></html>`;
    mockFetchPage.mockResolvedValue(parse(html));

    const result = JSON.parse(await getBuildDetails({ build_id: "test" }));

    expect(result.totalPrice).toBe(3000);
    expect(result.totalPricePix).toBeNull();
  });

  it("gera URL correta da build", async () => {
    mockFetchPage.mockResolvedValue(parse(BUILD_DETAILS_HTML));

    const result = JSON.parse(await getBuildDetails({ build_id: "oI7mI7" }));

    expect(result.url).toBe("https://meupc.net/build/oI7mI7");
  });

  it("usa 'Build' como título fallback", async () => {
    const html = "<html><body></body></html>";
    mockFetchPage.mockResolvedValue(parse(html));

    const result = JSON.parse(await getBuildDetails({ build_id: "test" }));

    expect(result.title).toBe("Build");
  });
});
