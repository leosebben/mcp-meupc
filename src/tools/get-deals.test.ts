import { describe, it, expect, vi, beforeEach } from "vitest";
import { parse } from "node-html-parser";

vi.mock("../scraper.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../scraper.js")>();
  return { ...actual, fetchPage: vi.fn() };
});

import { fetchPage } from "../scraper.js";
import { getDeals } from "./get-deals.js";

const mockFetchPage = vi.mocked(fetchPage);

const DEALS_HTML = `
<html><body>
  <div class="card is-fullheight">
    <header class="card-image">
      <figure><img src="/img/rtx4070.jpg"></figure>
      <div class="loja-img"><img alt="Kabum"></div>
    </header>
    <div class="card-content">
      <p class="uppertitle">Kabum</p>
      <h3 class="title"><a href="/peca/XYZ/placa-video-rtx-4070">RTX 4070 Super</a></h3>
      <span class="tag is-danger">-25%</span>
      <a class="preco">R$ 2.999,00</a>
      <div class="level is-fullwidth">Menor preço nos últimos 90 dias: R$ 3.800,00</div>
    </div>
  </div>
  <div class="card is-fullheight">
    <header class="card-image">
      <figure><img src="/img/ssd.jpg"></figure>
    </header>
    <div class="card-content">
      <h3 class="title"><a href="/peca/QWE/ssd-kingston">SSD Kingston 1TB</a></h3>
      <a class="preco">R$ 399,90</a>
    </div>
  </div>
</body></html>
`;

beforeEach(() => {
  mockFetchPage.mockReset();
});

describe("getDeals", () => {
  it("extrai ofertas com todos os campos", async () => {
    mockFetchPage.mockResolvedValue(parse(DEALS_HTML));

    const result = JSON.parse(await getDeals({ page: 1 }));

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      name: "RTX 4070 Super",
      currentPrice: 2999,
      oldPrice: 3800,
      discount: "-25%",
      store: "Kabum",
      url: "https://meupc.net/peca/XYZ/placa-video-rtx-4070",
      image: "https://meupc.net/img/rtx4070.jpg",
    });
  });

  it("extrai oferta sem desconto e sem preço antigo", async () => {
    mockFetchPage.mockResolvedValue(parse(DEALS_HTML));

    const result = JSON.parse(await getDeals({ page: 1 }));

    expect(result[1]).toMatchObject({
      name: "SSD Kingston 1TB",
      currentPrice: 399.9,
      oldPrice: null,
      discount: null,
    });
  });

  it("usa loja-img como fallback para nome da loja", async () => {
    const html = `
    <html><body>
      <div class="card is-fullheight">
        <header class="card-image">
          <figure><img src="/img/x.jpg"></figure>
          <div class="loja-img"><img alt="Pichau"></div>
        </header>
        <div class="card-content">
          <h3 class="title"><a href="/peca/A/b">Produto</a></h3>
          <a class="preco">R$ 100,00</a>
        </div>
      </div>
    </body></html>`;
    mockFetchPage.mockResolvedValue(parse(html));

    const result = JSON.parse(await getDeals({ page: 1 }));

    expect(result[0].store).toBe("Pichau");
  });

  it("constrói URL com categoria quando fornecida", async () => {
    mockFetchPage.mockResolvedValue(parse("<html><body></body></html>"));

    await getDeals({ page: 2, category: "placas-video" });

    expect(mockFetchPage).toHaveBeenCalledWith("/ofertas?page=2&peca=placas-video");
  });

  it("retorna array vazio sem ofertas", async () => {
    mockFetchPage.mockResolvedValue(parse("<html><body></body></html>"));

    const result = JSON.parse(await getDeals({ page: 1 }));

    expect(result).toEqual([]);
  });
});
