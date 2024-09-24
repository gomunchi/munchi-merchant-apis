export interface FoodoraOrder {
  token?: string;
  code?: string;
  comments?: {
    customerComment?: string;
    vendorComment?: string;
  };
  createdAt?: string;
  customer?: FoodoraCustomer;
  delivery?: FoodoraDelivery;
  discounts?: FoodoraDiscount[];
  expeditionType?: string;
  expiryDate?: string;
  extraParameters?: FoodoraExtraParameters;
  localInfo?: FoodoraLocalInfo;
  payment?: FoodoraPayment;
  test?: boolean;
  shortCode?: string;
  preOrder?: boolean;
  pickup?: any;
  platformRestaurant?: FoodoraPlatformRestaurant;
  price?: FoodoraPrice;
  products?: FoodoraProduct[];
  corporateOrder?: boolean;
  corporateTaxId?: string;
  integrationInfo?: Record<string, any>;
  mobileOrder?: boolean;
  webOrder?: boolean;
  vouchers?: any[];
  callbackUrls?: FoodoraCallbackUrls;
  status?: string;
  reason?: any;
}

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

export interface FoodoraDelivery {
  address?: FoodoraAddress;
  expectedDeliveryTime?: string;
  expressDelivery?: boolean;
  riderPickupTime?: string;
}

export interface FoodoraAddress {
  postcode?: number;
  city?: string;
  street?: string;
  number?: number;
}

export interface FoodoraDiscount {
  name?: string;
  amount?: string;
  type?: string;
  sponsorships?: FoodoraSponsorship[];
}

export interface FoodoraSponsorship {
  sponsor?: string;
  amount?: string;
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

export interface FoodoraDeliveryFee {
  name?: string;
  value?: number;
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

export interface FoodoraCallbackUrls {
  orderAcceptedUrl?: string;
  orderRejectedUrl?: string;
  orderPickedUpUrl?: string;
  orderPreparedUrl?: string;
}
