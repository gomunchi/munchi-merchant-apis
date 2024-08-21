export interface PreorderAcknowledgement {
  type: 'preorder';
  received: boolean;
  orderNumber: string;
  business: string;
  message: string;
}

export interface OrdersRegisterAcknowledgement {
  type: 'orders_register';
  received: boolean;
  orderNumber: string;
  business: string;
  message: string;
}

export type AcknowledgementType = 'preorder' | 'orders_register' | 'other' | 'order_change'; // Add more types as needed

export interface BaseAcknowledgement {
  type: AcknowledgementType;
  received: boolean;
  orderNumber: string;
  business: string;
  message: string;
}

export interface EmitOptions {
  room: string;
  event: string;
  data: any;
  acknowledgementType: AcknowledgementType;
  timeout?: number;
}
