import { Injectable } from '@nestjs/common';
import { Business, Prisma, Provider } from '@prisma/client';
import { SessionService } from 'src/auth/session.service';
import { BusinessService } from 'src/business/business.service';
import { FinancialAnalyticsService } from 'src/financial-analytics/financial-analytics.service';
import { OrderResponse, OrderStatusEnum, PayMethodEnum } from 'src/order/dto/order.dto';
import { OrderService } from 'src/order/order.service';
import { ProviderEnum } from 'src/provider/provider.type';

import { mapToDate } from './utils/getTimeRange';
import { WoltOrderPrismaSelectArgs } from 'src/provider/wolt/dto/wolt-order.dto';
import { HistoryFilterQuery, HistoryQuery } from './dto/history,dto';
import { OrderingPaymentEnum } from 'src/provider/ordering/dto/ordering-order.dto';

@Injectable()
export class HistoryService {
  constructor(
    private orderService: OrderService,
    private sessionService: SessionService,
    private businessService: BusinessService,
    private financialAnalyticsService: FinancialAnalyticsService,
  ) {}

  async getOrderHistory(
    sessionPublicId: string,
    { date, page, rowPerPage }: HistoryQuery,
    filterQuery?: HistoryFilterQuery,
  ) {
    const sessionArgs = {
      include: {
        businesses: true,
      },
    };
    const session = await this.sessionService.getSessionByPublicId<any>(
      sessionPublicId,
      sessionArgs,
    );
    const orderingBusinessIds = session.businesses.map(
      (business: Business) => business.orderingBusinessId,
    );

    //Map to date base on date pm
    const [startDate, endDate] = mapToDate(date);

    const rowPerPageInNumber = parseInt(rowPerPage);
    const pageInNumber = parseInt(page);

    //Create a prisma argument to get order data
    const orderArgs = Prisma.validator<Prisma.OrderFindManyArgs>()({
      where: {
        orderingBusinessId: {
          in: orderingBusinessIds,
        },
        status: {
          in: filterQuery.orderStatus
            ? filterQuery.orderStatus
            : [OrderStatusEnum.DELIVERED, OrderStatusEnum.REJECTED],
        },
        provider: {
          in: filterQuery.provider
            ? filterQuery.provider
            : [ProviderEnum.Munchi, ProviderEnum.Wolt],
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        OR: filterQuery.payMethod
          ? [
              ...(filterQuery.payMethod.includes(PayMethodEnum.Cash)
                ? [{ payMethodId: { in: [OrderingPaymentEnum.Cash] } }]
                : []),
              ...(filterQuery.payMethod.includes(PayMethodEnum.Card)
                ? [{ payMethodId: { not: OrderingPaymentEnum.Cash } }, { payMethodId: null }] // Includes null and values not 1
                : []),
            ]
          : undefined,
      },
      include: WoltOrderPrismaSelectArgs,
      orderBy: {
        orderNumber: 'desc',
      },
      take: rowPerPageInNumber,
      skip: (pageInNumber - 1) * rowPerPageInNumber,
    });

    const totalOrderArgs =  Prisma.validator<Prisma.OrderFindManyArgs>()({
      where: orderArgs.where,
      include: orderArgs.include,
    });

    const totalOrders = await this.orderService.getManyOrderByArgs(totalOrderArgs);

    const order: OrderResponse[] = await this.orderService.getManyOrderByArgs(orderArgs);

    const analyticsData = await this.financialAnalyticsService.analyzeOrderData(totalOrders);

    return {
      ...analyticsData,
      totalOrders: totalOrders.length,
      orders: order,
    };
  }

  async getProductHistory(sessionPublicId: string, { date, page, rowPerPage }: HistoryQuery) {
    const sessionArgs = {
      include: {
        businesses: true,
      },
    };
    const session = await this.sessionService.getSessionByPublicId<any>(
      sessionPublicId,
      sessionArgs,
    );

    const orderingBusinessIds = session.businesses.map(
      (business: Business) => business.orderingBusinessId,
    );

    const [startDate, endDate] = mapToDate(date);

    const result: any[] = [];

    await Promise.all(
      orderingBusinessIds.map(async (orderingBusinessId: string) => {
        const businessIncludeArgs = Prisma.validator<Prisma.BusinessArgs>()({
          include: {
            provider: true,
          },
        });

        // Check business provider
        const business = await this.businessService.findBusinessByOrderingId(
          orderingBusinessId,
          businessIncludeArgs,
        );

        //Initialize the business response with initial data
        const businessObj = {
          id: business.publicId,
          name: business.name,
          salesByProvider: [],
        };

        //Munchi productr is compulsory
        const munchiOrderArgs = Prisma.validator<Prisma.OrderFindManyArgs>()({
          where: {
            orderingBusinessId: orderingBusinessId,
            provider: ProviderEnum.Munchi,
            status: OrderStatusEnum.DELIVERED,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: WoltOrderPrismaSelectArgs,
          orderBy: {
            orderNumber: 'desc',
          },
        });

        const order = await this.orderService.getManyOrderByArgs(munchiOrderArgs);

        const munchiAnalyticsData = await this.financialAnalyticsService.analyzeProductData(order);

        businessObj.salesByProvider.push({
          provider: ProviderEnum.Munchi,
          products: munchiAnalyticsData,
        });

        //Analyze orders sold by other provider
        if (business.provider.length !== 0) {
          await Promise.all(
            business.provider.map(async (provider: Provider) => {
              //Analyzer order by provider
              const providerOrderArgs = Prisma.validator<Prisma.OrderFindManyArgs>()({
                where: {
                  orderingBusinessId: orderingBusinessId,
                  provider: provider.name,
                  status: OrderStatusEnum.DELIVERED,
                  createdAt: {
                    gte: startDate,
                    lte: endDate,
                  },
                },
                include: WoltOrderPrismaSelectArgs,
                orderBy: {
                  orderNumber: 'desc',
                },
              });

              const providerOrder = await this.orderService.getManyOrderByArgs(providerOrderArgs);

              const providerAnalyticsData = await this.financialAnalyticsService.analyzeProductData(
                providerOrder,
              );

              businessObj.salesByProvider.push({
                provider: provider.name,
                products: providerAnalyticsData,
              });
            }),
          );
        }

        result.push(businessObj);
      }),
    );
    return result;
  }
}
