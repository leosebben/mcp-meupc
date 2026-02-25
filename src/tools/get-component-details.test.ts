import { describe, it, expect, vi, beforeEach } from "vitest";
import { parse } from "node-html-parser";

vi.mock("../scraper.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../scraper.js")>();
  return { ...actual, fetchPage: vi.fn() };
});

import { fetchPage } from "../scraper.js";
import { getComponentDetails } from "./get-component-details.js";

const mockFetchPage = vi.mocked(fetchPage);

const COMPONENT_HTML = `
<html><body>
  <h1 class="title">AMD Ryzen 7 5800X3D</h1>

  <nav class="breadcrumb">
    <ul>
      <li><a href="https://meupc.net/">Home</a></li>
      <li><a href="https://meupc.net/processadores">Processadores</a></li>
      <li><a href="https://meupc.net/peca/ABC/ryzen-7-5800x3d">AMD Ryzen 7 5800X3D</a></li>
    </ul>
  </nav>

  <figure class="image"><img src="/img/ryzen7-5800x3d.jpg"></figure>

  <table class="table is-striped">
    <tr><th>Socket</th><td>AM4</td></tr>
    <tr><th>Núcleos</th><td>8</td></tr>
    <tr><th>Threads</th><td>16</td></tr>
    <tr><th>Desbloqueado</th><td><span class="icon" title="Sim"></span></td></tr>
    <tr><th>Vídeo integrado</th><td><span class="icon" title="Não"></span></td></tr>
  </table>

  <table class="table is-responsive">
    <tbody>
      <tr>
        <th><a class="loja-img"><img alt="Kabum" title="Kabum"></a></th>
        <td data-label="Preco"><a class="has-text-weight-bold">R$ 1.399,00</a></td>
        <td data-label="Preco PIX"><a class="has-text-weight-bold">R$ 1.299,90</a></td>
        <td><a class="button is-buy" href="/redirect/kabum/ABC"></a></td>
      </tr>
      <tr>
        <th><a class="loja-img"><img alt="Pichau" title="Pichau"></a></th>
        <td data-label="Preco"><a class="has-text-weight-bold">R$ 1.450,00</a></td>
        <td data-label="Preco PIX"><a class="has-text-weight-bold">R$ 1.350,00</a></td>
        <td><a class="button is-buy" href="/redirect/pichau/ABC"></a></td>
      </tr>
      <tr>
        <th><a class="loja-img"><img alt="Terabyte" title="Terabyte"></a></th>
        <td data-label="Preco"><a class="has-text-weight-bold"></a></td>
        <td data-label="Preco PIX"><a class="has-text-weight-bold"></a></td>
        <td></td>
      </tr>
    </tbody>
  </table>
</body></html>
`;

beforeEach(() => {
  mockFetchPage.mockReset();
});

describe("getComponentDetails", () => {
  it("extrai nome do componente", async () => {
    mockFetchPage.mockResolvedValue(parse(COMPONENT_HTML));

    const result = JSON.parse(await getComponentDetails({ url: "/peca/ABC/ryzen-7-5800x3d" }));

    expect(result.name).toBe("AMD Ryzen 7 5800X3D");
  });

  it("extrai categoria do breadcrumb", async () => {
    mockFetchPage.mockResolvedValue(parse(COMPONENT_HTML));

    const result = JSON.parse(await getComponentDetails({ url: "/peca/ABC/ryzen-7-5800x3d" }));

    expect(result.category).toBe("Processadores");
  });

  it("extrai imagem principal", async () => {
    mockFetchPage.mockResolvedValue(parse(COMPONENT_HTML));

    const result = JSON.parse(await getComponentDetails({ url: "/peca/ABC/ryzen-7-5800x3d" }));

    expect(result.image).toBe("https://meupc.net/img/ryzen7-5800x3d.jpg");
  });

  it("extrai especificações técnicas", async () => {
    mockFetchPage.mockResolvedValue(parse(COMPONENT_HTML));

    const result = JSON.parse(await getComponentDetails({ url: "/peca/ABC/ryzen-7-5800x3d" }));

    expect(result.specs).toMatchObject({
      Socket: "AM4",
      "Núcleos": "8",
      Threads: "16",
    });
  });

  it("converte ícones booleanos em Sim/Não", async () => {
    mockFetchPage.mockResolvedValue(parse(COMPONENT_HTML));

    const result = JSON.parse(await getComponentDetails({ url: "/peca/ABC/ryzen-7-5800x3d" }));

    expect(result.specs.Desbloqueado).toBe("Sim");
    expect(result.specs["Vídeo integrado"]).toBe("Não");
  });

  it("extrai preços por loja", async () => {
    mockFetchPage.mockResolvedValue(parse(COMPONENT_HTML));

    const result = JSON.parse(await getComponentDetails({ url: "/peca/ABC/ryzen-7-5800x3d" }));

    expect(result.prices).toHaveLength(3);
    expect(result.prices[0]).toMatchObject({
      store: "Kabum",
      price: 1399,
      pricePix: 1299.9,
      url: "https://meupc.net/redirect/kabum/ABC",
      available: true,
    });
    expect(result.prices[1]).toMatchObject({
      store: "Pichau",
      price: 1450,
      pricePix: 1350,
      available: true,
    });
  });

  it("marca loja como indisponível quando não tem preço", async () => {
    mockFetchPage.mockResolvedValue(parse(COMPONENT_HTML));

    const result = JSON.parse(await getComponentDetails({ url: "/peca/ABC/ryzen-7-5800x3d" }));

    expect(result.prices[2]).toMatchObject({
      store: "Terabyte",
      available: false,
    });
  });

  it("calcula menor preço entre todas as lojas", async () => {
    mockFetchPage.mockResolvedValue(parse(COMPONENT_HTML));

    const result = JSON.parse(await getComponentDetails({ url: "/peca/ABC/ryzen-7-5800x3d" }));

    expect(result.lowestPrice).toBe(1299.9);
  });

  it("gera URL absoluta do componente", async () => {
    mockFetchPage.mockResolvedValue(parse(COMPONENT_HTML));

    const result = JSON.parse(await getComponentDetails({ url: "/peca/ABC/ryzen-7-5800x3d" }));

    expect(result.url).toBe("https://meupc.net/peca/ABC/ryzen-7-5800x3d");
  });
});
