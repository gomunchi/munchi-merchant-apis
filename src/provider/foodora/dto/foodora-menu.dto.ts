export interface CatalogImportDto {
  callbackUrl?: string;
  catalog: Catalog;
  vendors: string[];
}

export interface Catalog {
  items: {
    [itemId: string]: CatalogItem;
  };
}

export type CatalogItem = Menu | Product | Topping | Category | Image | ScheduleEntry;

export interface BaseCatalogItem {
  id: string;
  type: CatalogItemType;
  title: {
    default: string;
  };
  images?: {
    [imageId: string]: Image;
  };
}

export interface Menu extends BaseCatalogItem {
  menuType: MenuType;
  products?: {
    [productId: string]: ProductReference;
  };
  schedule?: {
    [scheduleId: string]: ScheduleEntry;
  };
}

export interface Product extends BaseCatalogItem {
  active?: boolean;
  isPrepackedItem?: boolean;
  isExpressItem?: boolean;
  excludeDishInformation?: boolean;
  containerPrice?: string;
  calories?: number;
  price?: string;
  variants?: {
    [variantId: string]: ProductVariant;
  };
  toppings?: {
    [toppingId: string]: Topping;
  };
  parent?: ProductReference;
  tags?: {
    ageRestrictedItem?: string[];
    masterCategory?: string[];
    occasionType?: string[];
  };
}

export interface ProductVariant extends BaseCatalogItem {
  parent: ProductReference;
  price?: string;
  toppings?: {
    [toppingId: string]: Topping;
  };
}

export interface ProductReference {
  id: string;
  type: 'Product';
}

export interface Topping extends BaseCatalogItem {
  quantity: {
    minimum: number;
    maximum: number;
  };
  products?: {
    [productId: string]: ProductReference;
  };
  toppingType?: ToppingType;
}

export interface Category extends BaseCatalogItem {
  products?: {
    [productId: string]: ProductReference;
  };
}

export interface Image {
  id: string;
  type: 'Image';
  url: string;
  alt: {
    default: string;
  };
}

export interface ScheduleEntry {
  id: string;
  type: 'ScheduleEntry';
  starTime: string;
  endTime: string;
  weekDays: WeekDay[];
}

export enum CatalogItemType {
  Menu = 'Menu',
  Product = 'Product',
  Topping = 'Topping',
  Category = 'Category',
  Image = 'Image',
  ScheduleEntry = 'ScheduleEntry',
}

export enum MenuType {
  DELIVERY = 'DELIVERY',
}

export enum ToppingType {
  PRODUCT_OPTION = 'PRODUCT_OPTION',
  PANDORA_PRODUCT_GROUP = 'PANDORA_PRODUCT_GROUP',
}

export enum WeekDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}
