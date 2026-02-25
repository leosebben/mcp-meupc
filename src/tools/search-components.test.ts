import { describe, it, expect, vi, beforeEach } from "vitest";
import { parse } from "node-html-parser";

vi.mock("../scraper.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../scraper.js")>();
  return { ...actual, fetchPage: vi.fn() };
});

import { fetchPage } from "../scraper.js";
import { searchComponents } from "./search-components.js";

const mockFetchPage = vi.mocked(fetchPage);

const SEARCH_HTML = `
<html><body>
  <div class="media">
    <div class="media-left"><figure><img src="/img/ryzen7.jpg"></figure></div>
    <div class="media-content">
      <a href="/peca/ABC123/processador-amd-ryzen-7-5800x3d">
        <h4>AMD Ryzen 7 5800X3D</h4>
      </a>
      <p>A partir de R$ 1.299,90 no PIX</p>
      <a class="button is-link" href="https://meupc.net/processadores/add/ABC123">Add na build</a>
    </div>
  </div>
  <div class="media">
    <div class="media-left"><figure><img src="/img/ryzen5.jpg"></figure></div>
    <div class="media-content">
      <a href="/peca/DEF456/processador-amd-ryzen-5-5600x">
        <h4>AMD Ryzen 5 5600X</h4>
      </a>
      <p>A partir de R$ 849,90</p>
      <a class="button is-link" href="https://meupc.net/processadores/add/DEF456">Add na build</a>
    </div>
  </div>
  <div class="media">
    <div class="media-left"><figure><img src="/img/placeholder.png"></figure></div>
    <div class="media-content">
      <a href="/peca/GHI789/processador-intel-i5-12400f">
        <h4>Intel Core i5-12400F</h4>
      </a>
      <p>Indisponível</p>
    </div>
  </div>
</body></html>
`;

beforeEach(() => {
  mockFetchPage.mockReset();
});

describe("searchComponents", () => {
  it("extrai componentes dos resultados de busca", async () => {
    mockFetchPage.mockResolvedValue(parse(SEARCH_HTML));

    const result = JSON.parse(await searchComponents({ query: "ryzen", limit: 10 }));

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      name: "AMD Ryzen 7 5800X3D",
      category: "processadores",
      price: 1299.9,
      url: "https://meupc.net/peca/ABC123/processador-amd-ryzen-7-5800x3d",
      image: "https://meupc.net/img/ryzen7.jpg",
    });
  });

  it("extrai preço normal quando não há PIX", async () => {
    mockFetchPage.mockResolvedValue(parse(SEARCH_HTML));

    const result = JSON.parse(await searchComponents({ query: "ryzen", limit: 10 }));

    expect(result[1]).toMatchObject({
      name: "AMD Ryzen 5 5600X",
      price: 849.9,
    });
  });

  it("ignora imagem placeholder", async () => {
    mockFetchPage.mockResolvedValue(parse(SEARCH_HTML));

    const result = JSON.parse(await searchComponents({ query: "intel", limit: 10 }));

    expect(result[2].image).toBeNull();
  });

  it("retorna null para preço indisponível", async () => {
    mockFetchPage.mockResolvedValue(parse(SEARCH_HTML));

    const result = JSON.parse(await searchComponents({ query: "intel", limit: 10 }));

    expect(result[2].price).toBeNull();
  });

  it("respeita o limite de resultados", async () => {
    mockFetchPage.mockResolvedValue(parse(SEARCH_HTML));

    const result = JSON.parse(await searchComponents({ query: "ryzen", limit: 1 }));

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("AMD Ryzen 7 5800X3D");
  });

  it("extrai categoria do link 'Add na build'", async () => {
    mockFetchPage.mockResolvedValue(parse(SEARCH_HTML));

    const result = JSON.parse(await searchComponents({ query: "ryzen", limit: 10 }));

    expect(result[0].category).toBe("processadores");
    expect(result[2].category).toBeNull();
  });

  it("retorna array vazio quando não há resultados", async () => {
    mockFetchPage.mockResolvedValue(parse("<html><body></body></html>"));

    const result = JSON.parse(await searchComponents({ query: "nada", limit: 10 }));

    expect(result).toEqual([]);
  });
});
