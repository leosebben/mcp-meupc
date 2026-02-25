import { describe, it, expect } from "vitest";
import { parsePrice, absoluteUrl, BASE_URL } from "./scraper.js";

describe("parsePrice", () => {
  it("converte formato brasileiro R$ X.XXX,XX", () => {
    expect(parsePrice("R$ 1.299,90")).toBe(1299.9);
  });

  it("converte valor sem milhar", () => {
    expect(parsePrice("R$ 299,90")).toBe(299.9);
  });

  it("converte valor inteiro", () => {
    expect(parsePrice("R$ 5.000")).toBe(5000);
  });

  it("converte valor com espaços extras", () => {
    expect(parsePrice("  R$  3.500,00  ")).toBe(3500);
  });

  it("converte valor sem símbolo R$", () => {
    expect(parsePrice("1.234,56")).toBe(1234.56);
  });

  it("retorna null para null", () => {
    expect(parsePrice(null)).toBeNull();
  });

  it("retorna null para undefined", () => {
    expect(parsePrice(undefined)).toBeNull();
  });

  it("retorna null para string vazia", () => {
    expect(parsePrice("")).toBeNull();
  });

  it("retorna null para texto sem número", () => {
    expect(parsePrice("indisponível")).toBeNull();
  });
});

describe("absoluteUrl", () => {
  it("retorna URL absoluta sem alteração", () => {
    expect(absoluteUrl("https://meupc.net/peca/ABC")).toBe("https://meupc.net/peca/ABC");
  });

  it("retorna URL http sem alteração", () => {
    expect(absoluteUrl("http://example.com")).toBe("http://example.com");
  });

  it("converte path com barra inicial", () => {
    expect(absoluteUrl("/peca/ABC/ryzen")).toBe(`${BASE_URL}/peca/ABC/ryzen`);
  });

  it("converte path sem barra inicial", () => {
    expect(absoluteUrl("peca/ABC/ryzen")).toBe(`${BASE_URL}/peca/ABC/ryzen`);
  });

  it("retorna string vazia para null", () => {
    expect(absoluteUrl(null)).toBe("");
  });

  it("retorna string vazia para undefined", () => {
    expect(absoluteUrl(undefined)).toBe("");
  });

  it("retorna string vazia para string vazia", () => {
    expect(absoluteUrl("")).toBe("");
  });
});
