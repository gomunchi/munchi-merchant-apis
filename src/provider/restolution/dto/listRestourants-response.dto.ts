export interface RestolutionRestaurants {
  success: boolean;
  timestamp: Date;
  requestID: string;
  response: Response;
}

export interface RestolutionResponse {
  restaurants: RestolutionRestaurants[];
}

export interface RestolutionRestaurants {
  restaurantID: string;
  businessUnitUUID: string;
  clientUUID: string;
  name: string;
  contact: RestolutionContact;
  openHours?: RestolutionOpenHour[];
  menus: RestolutionMenu[];
  units: RestolutionUnit[];
}

export interface RestolutionContact {
  emailAddress: string;
  street: string;
  city: string;
  postIndex: string;
  phoneNr: string;
  registrationNr: string;
  companyName?: string;
}

export interface RestolutionMenu {
  menuID: string;
  name: string;
  articles: RestolutionArticle[];
}

export interface RestolutionArticle {
  articleID: string;
  name: string;
  type: RestolutionStructureType;
  restrictedItem: boolean;
  includeOptionPrice: boolean;
  printerIDs?: string[];
  prices?: RestolutionPrice[];
  barCodes?: string[];
  description?: string;
  structure?: RestolutionStructure[];
  options?: RestolutionOption[];
}

export interface RestolutionOption {
  articleOptionID: string;
  name: string;
  minselections: number;
  maxSelections: number;
  articleIDs: string[];
}

export interface RestolutionPrice {
  priceID: string;
  price?: number;
  tax: number;
  priceWithoutTax?: number;
}

export interface RestolutionStructure {
  articleID: string;
  name: string;
  type: RestolutionStructureType;
  amount: number;
}

export enum RestolutionStructureType {
  Sale = 'SALE',
}

export interface RestolutionOpenHour {
  Monday?: RestolutionDay[];
  Tuesday?: RestolutionDay[];
  Wednesday?: RestolutionDay[];
  Thursday?: RestolutionDay[];
  Friday?: RestolutionDay[];
  Saturday?: RestolutionDay[];
  Sunday?: RestolutionDay[];
}

export interface RestolutionDay {
  type: RestolutionFridayType;
  start: string;
  finish: string;
}

export enum RestolutionFridayType {
  Kitchen = 'KITCHEN',
  Restaurant = 'RESTAURANT',
}

export interface RestolutionUnit {
  unitName: string;
  unitUUID: string;
}
