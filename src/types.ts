export interface ComponentResult {
  name: string;
  category: string | null;
  price: number | null;
  url: string;
  image: string | null;
}

export interface ComponentDetails {
  name: string;
  category: string | null;
  specs: Record<string, string>;
  prices: StorePrice[];
  lowestPrice: number | null;
  url: string;
  image: string | null;
}

export interface StorePrice {
  store: string;
  price: number;
  pricePix: number | null;
  url: string | null;
  available: boolean;
}

export interface DealResult {
  name: string;
  currentPrice: number;
  oldPrice: number | null;
  discount: string | null;
  store: string | null;
  url: string;
  image: string | null;
}

export interface BuildSummary {
  title: string;
  author: string | null;
  totalPrice: number | null;
  likes: number | null;
  url: string;
  components: string[];
}

export interface BuildDetails {
  title: string;
  author: string | null;
  totalPrice: number | null;
  likes: number | null;
  components: BuildComponent[];
  url: string;
}

export interface BuildComponent {
  type: string;
  name: string;
  price: number | null;
  url: string | null;
}
