export enum FoodoraOrderStatus {
  Accepted = 'order_accepted',
  Rejected = 'order_rejected',
  PickedUp = 'order_picked_up',
}

export enum PosAvailabilityState {
  CLOSED_UNTIL = 'CLOSED_UNTIL',
  CLOSED = 'CLOSED',
  INACTIVE = 'INACTIVE',
  UNKNOWN = 'UNKNOWN',
  OPEN = 'OPEN',
  CLOSED_TODAY = 'CLOSED_TODAY',
}

export enum PosClosingReason {
  CLOSED = 'CLOSED',
  UPDATES_IN_MENU = 'UPDATES_IN_MENU',
  HOLIDAY_SPECIAL_DAY = 'HOLIDAY_SPECIAL_DAY',
  TECHNICAL_PROBLEM = 'TECHNICAL_PROBLEM',
  REFURBISHMENT = 'REFURBISHMENT',
  TOO_BUSY_NO_DRIVERS = 'TOO_BUSY_NO_DRIVERS',
  BAD_WEATHER = 'BAD_WEATHER',
  OTHER = 'OTHER',
}
