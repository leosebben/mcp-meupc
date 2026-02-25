import { describe, it, expect, vi, beforeEach } from "vitest";
import { parse } from "node-html-parser";

vi.mock("../scraper.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../scraper.js")>();
  return { ...actual, fetchPage: vi.fn() };
});

import { fetchPage } from "../scraper.js";
import { listCommunityBuilds } from "./list-community-builds.js";

const mockFetchPage = vi.mocked(fetchPage);

const BUILDS_HTML = `
<html><body>
  <article class="card is-fullheight">
    <div class="card-content">
      <h3 class="title"><a href="/build/oI7mI7">Build Gamer 2024</a></h3>
      <p class="by">por <a class="has-text-weight-semibold">leosebben</a></p>
      <a class="preco">R$ 5.000,00</a>
      <div class="content is-small">
        <ul>
          <li>AMD Ryzen 7 5800X3D</li>
          <li>RTX 4070 Super</li>
          <li>32GB DDR4</li>
        </ul>
      </div>
    </div>
    <footer>
      <a class="js-like-button" data-total-likes="42"></a>
      <span class="js-like-total">42</span>
    </footer>
  </article>
  <article class="card is-fullheight">
    <div class="card-content">
      <h3 class="title"><a href="/build/xK9pL2">PC Escritório</a></h3>
      <a class="preco">R$ 2.100,00</a>
      <div class="content is-small">
        <ul>
          <li>Intel Core i3-12100</li>
        </ul>
      </div>
    </div>
    <footer>
      <span class="js-like-total">7</span>
    </footer>
  </article>
</body></html>
`;

beforeEach(() => {
  mockFetchPage.mockReset();
});

describe("listCommunityBuilds", () => {
  it("extrai builds com todos os campos", async () => {
    mockFetchPage.mockResolvedValue(parse(BUILDS_HTML));

    const result = JSON.parse(await listCommunityBuilds({ sort: "melhores-recentes", page: 1 }));

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      title: "Build Gamer 2024",
      author: "leosebben",
      totalPrice: 5000,
      likes: 42,
      url: "https://meupc.net/build/oI7mI7",
      components: ["AMD Ryzen 7 5800X3D", "RTX 4070 Super", "32GB DDR4"],
    });
  });

  it("trata build sem autor", async () => {
    mockFetchPage.mockResolvedValue(parse(BUILDS_HTML));

    const result = JSON.parse(await listCommunityBuilds({ sort: "melhores-recentes", page: 1 }));

    expect(result[1].author).toBeNull();
  });

  it("extrai likes do span quando não há data-total-likes", async () => {
    mockFetchPage.mockResolvedValue(parse(BUILDS_HTML));

    const result = JSON.parse(await listCommunityBuilds({ sort: "melhores-recentes", page: 1 }));

    expect(result[1].likes).toBe(7);
  });

  it("constrói URL correta com parâmetros", async () => {
    mockFetchPage.mockResolvedValue(parse("<html><body></body></html>"));

    await listCommunityBuilds({ sort: "novas", page: 3 });

    expect(mockFetchPage).toHaveBeenCalledWith("/builds-comunidade?ordem=novas&page=3");
  });

  it("retorna array vazio sem builds", async () => {
    mockFetchPage.mockResolvedValue(parse("<html><body></body></html>"));

    const result = JSON.parse(await listCommunityBuilds({ sort: "melhores", page: 1 }));

    expect(result).toEqual([]);
  });
});
