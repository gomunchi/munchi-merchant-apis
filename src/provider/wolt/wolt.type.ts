export enum WoltLanguageCode {
  English = 'en',
  Finnist = 'fi',
}

export interface ItemData {
  external_id: string;
  gtin?: string;
  sku?: string;
  price?: number;
  discounted_price?: number;
  enabled?: boolean;
  in_stock?: boolean;
  image_url?: string;
}

export type MenuItemBodyData = { [K in keyof ItemData]: ItemData[K] };
