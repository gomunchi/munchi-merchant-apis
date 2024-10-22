import { Prisma } from '@prisma/client';
import { PosAvailabilityState, PosClosingReason } from './foodora.enum.dto';

export interface OpenRestaurantDto {
  platformKey: string;
  platformRestaurantId: string;
}

export interface CloseRestaurantDto {
  availabilityState: PosAvailabilityState;
  closedReason: PosClosingReason;
  closingMinutes?: number;
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

export const FoodoraOrderPrismaSelectArgs = Prisma.validator<Prisma.OrderInclude>()({
  business: {
    select: {
      publicId: true,
      name: true,
      logo: true,
      email: true,
      phone: true,
      description: true,
      timeZone: true,
    },
  },
  customer: {
    select: {
      name: true,
      phone: true,
    },
  },
  offers: true,
  preorder: {
    select: {
      preorderTime: true,
      status: true,
    },
  },
  products: {
    select: {
      productId: true,
      comment: true,
      name: true,
      options: {
        select: {
          optionId: true,
          image: true,
          price: true,
          name: true,
          subOptions: {
            select: {
              subOptionId: true,
              name: true,
              image: true,
              price: true,
              position: true,
              quantity: true,
            },
          },
        },
      },
      price: true,
      quantity: true,
    },
  },
  summary: {
    select: {
      total: true,
    },
  },
});
