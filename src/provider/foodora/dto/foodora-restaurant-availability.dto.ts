export interface OpenRestaurantDto {
  platformKey: string;
  platformRestaurantId: string;
}

export interface CloseRestaurantDto {
  closedReason: string;
  closingMinutes?: number;
  platformKey: string;
  platformRestaurantId: string;
}

export interface AvailabilityStatusResponse {
  availabilityState: string;
  availabilityStates?: string[];
  changeable?: boolean;
  closedReason?: string;
  closingMinutes?: number[];
  closingReasons?: string[];
  platformId?: string;
  platformKey?: string;
  platformRestaurantId?: string;
  platformType?: string;
}
