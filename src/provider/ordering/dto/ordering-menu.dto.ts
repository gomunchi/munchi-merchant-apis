export type OrderingMenuCategory = {
  id: number;
  business_id: number;
  name: string;
  image: string | null; // Image can be a URL or null
  rank: number;
  enabled: boolean;
  external_id: string;
  parent_category_id: number | null; // Allow for nested categories
  slug: string | null;
  seo_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  header: string | null;
  description: string | null;
  products: OrderingCategoryProduct[];
};

export type OrderingCategoryProduct = {
  id: number;
  name: string;
  price: number;
  description: string;
  images: string;
  sku: string | null;
  categoryId: number;
  inventoried: boolean;
  quantity: number;
  featured: boolean;
  enabled: boolean;
  upselling: boolean;
  inOffer: boolean;
  offerPrice: number | null;
  rank: number;
  offerRate: number;
  offerRateType: number; // Consider using an enum for offerRateType
  offerIncludeOptions: boolean;
  externalId: string | null;
  barcode: string | null;
  barcodeAlternative: string | null;
  estimatedPerson: number | null;
  taxId: number | null;
  feeId: number | null;
  slug: string | null;
  seoImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  costPrice: number | null;
  costOfferPrice: number | null;
  weight: number | null;
  calories: number | null;
  weightUnit: string | null;
  hideSpecialInstructions: boolean;
  maximumPerOrder: number | null;
  minimumPerOrder: number;
  duration: number | null;
  type: string; // Consider using an enum for product types
  loadType: string; // Consider using an enum
  updatedAt: string; // ISO 8601 formatted date string
  createdAt: string; // ISO 8601 formatted date string
  deletedAt: string | null;
  isHidden: boolean;
  tags: string[];
  gallery: any[]; // Replace 'any' with a GalleryImage interface if you have one
  ingredients: any[]; // Replace 'any' with an Ingredient interface if you have one
  tax: any | null; // Replace 'any' with a Tax interface if you have one
  fee: any | null; // Replace 'any' with a Fee interface if you have one
  extras: OrderingCategoryProductExtra[];
  metafields: any[];
};

export interface OrderingCategoryProductExtra {
  id: number;
  businessId: number;
  name: string;
  description: string | null;
  enabled: boolean;
  externalId: string | null;
  rank: number;
  options: OrderingCategoryProductExtraOption[];
  metafields: any[];
}

export interface OrderingCategoryProductExtraOption {
  id: number;
  extraId: number;
  name: string;
  image: string | null;
  conditioned: boolean;
  respectTo: string | null;
  min: number;
  max: number;
  rank: number;
  withHalfOption: boolean;
  allowSuboptionQuantity: boolean;
  limitSuboptionsByMax: boolean;
  enabled: boolean;
  externalId: string | null;
  suboptions: OrderingCategoryProductExtraSubOption[];
  metafields: any[];
}

export interface OrderingCategoryProductExtraSubOption {
  id: number;
  extraOptionId: number;
  name: string;
  price: number;
  image: string | null;
  sku: string | null;
  rank: number;
  description: string | null;
  max: number;
  halfPrice: number | null;
  enabled: boolean;
  externalId: string | null;
  preselected: boolean;
  metafields: any[];
}
