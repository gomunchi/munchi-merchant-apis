export interface RawMenuData {
  menus: any[];
  menus_shared: any[];
  categories: any[];
}

export interface ProcessedCategory {
  id: number;
  name: string;
  description: string | null;
  menuIds: number[];
  products: ProcessedProduct[];
  enabled: boolean;
  subcategories?: ProcessedCategory[];
}

export interface ProcessedProduct {
  id: number;
  name: string;
  price: number;
  description: string | null;
  enabled: boolean;
  categoryId: number;
  images: string | null;
  menuIds: number[];
}
