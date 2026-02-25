import { describe, it, expect, vi, beforeEach } from "vitest";
import { parse } from "node-html-parser";

vi.mock("../scraper.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../scraper.js")>();
  return { ...actual, fetchPage: vi.fn() };
});

import { fetchPage } from "../scraper.js";
import { listComponents } from "./list-components.js";

const mockFetchPage = vi.mocked(fetchPage);

const SCRIPT_HTML = `
<html><body>
  <script>
    window.meupcnetPecas = [
      {"nome":"AMD Ryzen 7 5800X3D","url":"/peca/ABC/ryzen-7-5800x3d","preco":1299.90,"imagem":"/img/ryzen7.jpg"},
      {"nome":"AMD Ryzen 5 5600X","url":"/peca/DEF/ryzen-5-5600x","preco":849.90,"imagem":"/img/ryzen5.jpg"}
    ];
  </script>
</body></html>
`;

const EMPTY_PAGE_HTML = `<html><body><p>Carregando...</p></body></html>`;

const SEARCH_FALLBACK_HTML = `
<html><body>
  <div class="media">
    <div class="media-left"><figure><img src="/img/ryzen7.jpg"></figure></div>
    <div class="media-content">
      <a href="/peca/ABC/processador-amd-ryzen-7-5800x3d">
        <h4>AMD Ryzen 7 5800X3D</h4>
      </a>
      <p>A partir de R$ 1.299,90 no PIX</p>
      <a class="button is-link" href="https://meupc.net/processadores/add/ABC">Add na build</a>
    </div>
  </div>
</body></html>
`;

beforeEach(() => {
  mockFetchPage.mockReset();
});

describe("listComponents", () => {
  describe("extração via script", () => {
    it("extrai componentes do window.meupcnetPecas", async () => {
      mockFetchPage.mockResolvedValue(parse(SCRIPT_HTML));

      const result = JSON.parse(await listComponents({ category: "processadores", page: 1 }));

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        name: "AMD Ryzen 7 5800X3D",
        category: "processadores",
        price: 1299.9,
        url: "https://meupc.net/peca/ABC/ryzen-7-5800x3d",
        image: "/img/ryzen7.jpg",
      });
    });

    it("extrai dados do window.meupcnetData (formato objeto)", async () => {
      const html = `
      <html><body>
        <script>
          window.meupcnetData = {"pecas":[{"nome":"RTX 4070","url":"/peca/XYZ/rtx-4070","preco":2999}]};
        </script>
      </body></html>`;
      mockFetchPage.mockResolvedValue(parse(html));

      const result = JSON.parse(await listComponents({ category: "placas-video", page: 1 }));

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("RTX 4070");
      expect(result[0].category).toBe("placas-video");
    });
  });

  describe("fallback via busca", () => {
    it("usa busca quando não há scripts com dados", async () => {
      mockFetchPage
        .mockResolvedValueOnce(parse(EMPTY_PAGE_HTML))
        .mockResolvedValueOnce(parse(SEARCH_FALLBACK_HTML));

      const result = JSON.parse(await listComponents({ category: "processadores", page: 1 }));

      expect(result.note).toContain("busca");
      expect(result.category).toBe("processadores");
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toMatchObject({
        name: "AMD Ryzen 7 5800X3D",
        price: 1299.9,
        category: "processadores",
      });
    });

    it("faz duas chamadas fetchPage no fallback", async () => {
      mockFetchPage
        .mockResolvedValueOnce(parse(EMPTY_PAGE_HTML))
        .mockResolvedValueOnce(parse(SEARCH_FALLBACK_HTML));

      await listComponents({ category: "processadores", page: 1 });

      expect(mockFetchPage).toHaveBeenCalledTimes(2);
      expect(mockFetchPage).toHaveBeenNthCalledWith(1, "/processadores?page=1");
      expect(mockFetchPage).toHaveBeenNthCalledWith(2, "/pesquisar?q=processador&page=1");
    });

    it("usa termo de busca correto por categoria", async () => {
      mockFetchPage
        .mockResolvedValueOnce(parse(EMPTY_PAGE_HTML))
        .mockResolvedValueOnce(parse("<html><body></body></html>"));

      await listComponents({ category: "placas-video", page: 1 });

      expect(mockFetchPage).toHaveBeenNthCalledWith(2, "/pesquisar?q=placa%20de%20video&page=1");
    });
  });

  it("constrói URL com parâmetro de ordenação", async () => {
    mockFetchPage.mockResolvedValue(parse(SCRIPT_HTML));

    await listComponents({ category: "processadores", page: 2, sort: "menor-preco" });

    expect(mockFetchPage).toHaveBeenCalledWith("/processadores?page=2&ordem=menor-preco");
  });
});
