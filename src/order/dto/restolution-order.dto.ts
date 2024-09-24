export interface OrderRow {
  articleID?: string;
  priceID?: string;
  price: number;
  quantity: number;
  tax?: number;
  options?: {
    optionListID: string;
    articleIDs?: string[];
  }[];
  userMessage?: string;
}

export interface PaymentRow {
  paymentCode: string;
  amount: number;
  tip?: number;
}

export interface RestolutionOrder {
  orderID: string;
  tableCode?: string;
  userMessage?: string;
  orderRows: OrderRow[];
  paymentRows?: PaymentRow[];
  waitForCashRegister?: boolean;
  loadImmediately?: boolean;
  replaceExisting?: boolean;
  postponeKitchenSending?: boolean;
  finishTransaction?: boolean;
  customerAmount?: number;
  customerNumber?: string;
  cardNumber?: string;
  cardHolderName?: string;
  deliveryType?: 'LOCAL' | 'TAKEAWAY' | 'DELIVERY';
  lang?: string;
}

export interface PlaceOrderResponse {
  transactionUUID: string;
  orderNumber?: string;
}
