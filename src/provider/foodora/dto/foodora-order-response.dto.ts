// Enums
export enum FoodoraExpeditionType {
  PickUp = 'pickup',
  Delivery = 'delivery',
}

// Base interfaces
export interface FoodoraCustomer {
  email?: string;
  firstName?: string;
  lastName?: string;
  mobilePhone?: string;
  code?: string;
  id?: string;
  mobilePhoneCountryCode?: string;
  flags?: string[];
}

export interface FoodoraAddress {
  postcode?: number;
  city?: string;
  street?: string;
  number?: number;
}

export interface FoodoraDelivery {
  address?: FoodoraAddress;
  expectedDeliveryTime?: string;
  expressDelivery?: boolean;
  riderPickupTime?: string;
}

export interface FoodoraPickUp {
  pickupCity: string;
  pickupAddress: string;
  pickupTime: string;
  pickupCode: string;
}

export interface FoodoraSponsorship {
  sponsor?: string;
  amount?: string;
}

export interface FoodoraDiscount {
  name?: string;
  amount?: string;
  type?: string;
  sponsorships?: FoodoraSponsorship[];
}

export interface FoodoraExtraParameters {
  property1?: string;
  property2?: string;
}

export interface FoodoraLocalInfo {
  countryCode?: string;
  currencySymbol?: string;
  platform?: string;
  platformKey?: string;
  currencySymbolPosition?: string;
  currencySymbolSpaces?: string;
  decimalDigits?: string;
  decimalSeparator?: string;
  email?: string;
  phone?: string;
  thousandsSeparator?: string;
  website?: string;
}

export interface FoodoraPayment {
  status?: string;
  type?: string;
  remoteCode?: string;
  requiredMoneyChange?: string;
  vatId?: string;
  vatName?: string;
}

export interface FoodoraPlatformRestaurant {
  id?: string;
}

export interface FoodoraDeliveryFee {
  name?: string;
  value?: number;
}

export interface FoodoraPrice {
  deliveryFees?: FoodoraDeliveryFee[];
  grandTotal?: string;
  minimumDeliveryValue?: string;
  payRestaurant?: string;
  riderTip?: string;
  subTotal?: string;
  totalNet?: string | null;
  vatTotal?: string;
  comission?: string;
  containerCharge?: string;
  deliveryFee?: string;
  collectFromCustomer?: string;
  discountAmountTotal?: string;
  deliveryFeeDiscount?: string;
  serviceFeePercent?: string;
  serviceFeeTotal?: string;
  serviceTax?: number;
  serviceTaxValue?: number;
  differenceToMinimumDeliveryValue?: string;
  vatVisible?: boolean;
  vatPercent?: string;
}

export interface FoodoraSelectedTopping {
  children?: any[];
  name?: string;
  price?: string;
  quantity?: number;
  id?: string;
  remoteCode?: string;
  type?: string;
  discounts?: FoodoraDiscount[];
}

export interface FoodoraVariation {
  name?: string;
}

export interface FoodoraProduct {
  categoryName?: string;
  name?: string;
  paidPrice?: string;
  quantity?: string;
  remoteCode?: string;
  selectedToppings?: FoodoraSelectedTopping[];
  unitPrice?: string;
  comment?: string;
  description?: string;
  discountAmount?: string;
  halfHalf?: boolean;
  id?: string;
  selectedChoices?: any[];
  variation?: FoodoraVariation;
  vatPercentage?: string;
  discounts?: FoodoraDiscount[];
}

export interface FoodoraCallbackUrls {
  orderAcceptedUrl?: string;
  orderRejectedUrl?: string;
  orderPickedUpUrl?: string;
  orderPreparedUrl?: string;
}

// Main interfaces
export interface BaseFoodoraOrder {
  token?: string;
  code?: string;
  shortCode?: string;
  preOrder?: boolean;
  expiryDate?: string;
  createdAt?: string;
  localInfo?: FoodoraLocalInfo;
  platformRestaurant?: FoodoraPlatformRestaurant;
  customer?: FoodoraCustomer;
  payment?: FoodoraPayment;
  expeditionType?: FoodoraExpeditionType;
  products?: FoodoraProduct[];
  corporateTaxId?: string;
  comments?: {
    customerComment?: string;
    vendorComment?: string;
  };
  vouchers?: any[];
  discounts?: FoodoraDiscount[];
  price?: FoodoraPrice;
  webOrder?: boolean;
  mobileOrder?: boolean;
  corporateOrder?: boolean;
  integrationInfo?: Record<string, any>;
  test?: boolean;
  delivery?: FoodoraDelivery;
  pickup?: FoodoraPickUp;
  extraParameters?: FoodoraExtraParameters;
}

// Main export interface that matches your original structure
export interface FoodoraOrder extends BaseFoodoraOrder {
  status?: string;
  reason?: any;
}

// Optional: If you need to specifically type the webhook response
export interface FoodoraWebhook extends BaseFoodoraOrder {
  callbackUrls: FoodoraCallbackUrls; // Made required for webhook
}

// Optional: If you need to specifically type the order response
export interface FoodoraOrderResponse {
  order: FoodoraOrder;
}
