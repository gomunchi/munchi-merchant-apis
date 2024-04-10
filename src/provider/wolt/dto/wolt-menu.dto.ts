// --- Helper Types ---

export interface TranslatedText {
  lang: string; // Example: 'en', 'fi'
  value: string;
}

interface OpeningHours {
  opening_day: string; // Example: 'TUESDAY', 'WEDNESDAY'
  opening_time: string; // Example: '10:30'
  closing_day: string;
  closing_time: string;
}

interface ProductInformationItem {
  ingredients?: TranslatedText[];
  additives?: TranslatedText[];
  allergens?: TranslatedText[];
  producer_information?: TranslatedText[];
  distributor_information?: TranslatedText[];
  country_of_origin?: TranslatedText[];
  conditions_of_use_and_storage?: TranslatedText[];
  nutrition_information?: {
    serving_size: string;
    nutrition_values: {
      energy_kcal?: { value: number };
      energy_kj?: { value: number };
      fats?: { unit: string; value: number };
      vitamin_c?: { unit: string; value: number };
      // Add more nutrition values as needed
    };
  };
}

interface Deposit {
  price: number;
  vat_percentage: number;
}

// --- Option Types ---

export interface WoltOptionValue {
  name: TranslatedText[];
  selection_range?: {
    max: number;
    min: number;
  };
  price: number;
  enabled: boolean;
  default?: boolean; // Optional default value
  external_data: string;
  product_information?: ProductInformationItem[]; // Optional product information
  gtin_barcode?: string;
  merchant_sku?: string;
  bundle_offer?: boolean;
  deposit?: Deposit[];
  vat_percentage?: number;
  sub_option_values?: WoltOptionValue[]; // For nested options
}

export interface WoltProductOption {
  name: TranslatedText[];
  type: 'MultiChoice' | 'SingleChoice';
  selection_range?: {
    max: number;
    min: number;
  };
  external_data: string;
  values: WoltOptionValue[];
}

// --- Product Item Type ---

export interface WoltProductItem {
  name: TranslatedText[];
  description: TranslatedText[];
  image_url: string;
  price: number;
  sales_tax_percentage?: number;
  alcohol_percentage?: number;
  enabled: boolean;
  quantity?: number;
  external_data: string;
  caffeine_content?: {
    serving_size: string;
    value: number;
  };
  product_information?: ProductInformationItem[];
  delivery_methods?: string[]; // Example: ['homedelivery']
  weekly_availability?: OpeningHours[];
  weekly_visibility?: OpeningHours[];
  options?: WoltProductOption[];
  gtin_barcode?: string;
  merchant_sku?: string;
  bundle_offer?: boolean;
  deposit?: Deposit[];
}

// --- Category Types ---

interface Subcategory {
  name: TranslatedText[];
  description: TranslatedText[];
  items: WoltProductItem[];
  weekly_availability?: OpeningHours[];
}

export interface WoltCategory {
  id: string;
  name: TranslatedText[];
  description?: TranslatedText[];
  weekly_availability?: OpeningHours[];
  items: WoltProductItem[];
  subcategories?: Subcategory[];
}

// --- Top-level Data Type ---

export interface WoltMenuData {
  id: string;
  currency: string;
  primary_language: string;
  categories: WoltCategory[];
}

export type ItemBinding = {
  id: string;
  item_id: string;
};

export type OptionBinding = {
  id: string;
  option_id: string;
};

export type MenuItemOptionValue = {
  id: string;
  product: {
    name: { lang: string; value: string }[];
    information: any;
    external_id: string;
    is_over_the_counter: boolean;
  };
  enabled: { enabled: boolean };
  price: number;
  vat_percentage: number;
  deposit_id: string;
};

export type MenuItemOption = {
  id: string;
  name: TranslatedText[];
  type: string;
  default_value: string;
  external_id: string;
  values: MenuItemOptionValue[];
};

export type MenuItem = {
  id: string;
  currency: string;
  primary_language: string;
  categories: {
    id: string;
    name: TranslatedText[];
    item_bindings: ItemBinding[];
  }[];
  items: {
    id: string;
    product: {
      name: TranslatedText[];
      information: any;
      description: { lang: string; value: string }[];
      external_id: string;
      alcohol_percentage: number;
      image_url: string;
      is_over_the_counter: boolean;
    };
    delivery_methods: string[];
    enabled: { enabled: boolean };
    option_bindings: OptionBinding[];
    price: number;
    vat_percentage: number;
    sales_tax_percentage: number;
    bundle_offer: boolean;
  }[];
  options: MenuItemOption[];
  weekly_availabilities: any[];
  deposits: {
    item_deposits: any[];
    option_value_deposits: any[];
  };
};

export type MenuData = {
  request_id: string;
  status: string;
  menu: MenuItem;
};
