import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, Provider } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { BusinessService } from 'src/business/business.service';
import { OrderingMenuCategory } from 'src/provider/ordering/dto/ordering-menu.dto';
import { OrderingMenuMapperService } from 'src/provider/ordering/ordering-menu-mapper';
import { OrderingService } from 'src/provider/ordering/ordering.service';
import { ProviderManagmentService } from 'src/provider/provider-management.service';
import { ProviderEnum } from 'src/provider/provider.type';
import { MenuData, WoltCategory, WoltMenuData } from 'src/provider/wolt/dto/wolt-menu.dto';
import { WoltMenuMapperService } from 'src/provider/wolt/wolt-menu-mapper';
import { WoltService } from 'src/provider/wolt/wolt.service';
import { UtilsService } from 'src/utils/utils.service';
import {
  MenuCategoryDto,
  MenuProductDto,
  MenuProductOptionDto,
  ValidatedCategoryBody,
  ValidatedMenuTrackingBody,
  ValidatedProductBody,
  ValidatedSuboptionBody,
} from './dto/menu.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import moment from 'moment';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);
  constructor(
    private orderingService: OrderingService,
    private orderingMenuMapperService: OrderingMenuMapperService,
    private woltMenuMapperService: WoltMenuMapperService,
    private woltService: WoltService,
    private prismaService: PrismaService,
    private businessService: BusinessService,
    private providerMangementService: ProviderManagmentService,
    private utilService: UtilsService,
  ) {}
  async getMenuCategory(orderingUserId: number, publicBusinessId: string) {
    // Get access token
    const orderingAccessToken = await this.utilService.getOrderingAccessToken(orderingUserId);

    //Get business by public id
    const business = await this.businessService.findBusinessByPublicId(publicBusinessId);

    const woltVenue = business.provider.filter(
      (businessProvider) => businessProvider.provider.name === ProviderEnum.Wolt,
    );

    const menu = await this.orderingService.getMenuCategory(
      orderingAccessToken,
      business.orderingBusinessId,
    );

    //Map to wolt object and remove property that has no product out of the result object
    const result: WoltCategory[] = menu
      .map((orderingCategory: OrderingMenuCategory) => {
        if (orderingCategory.products.length === 0) {
          return undefined; // Returns undefined
        }
        return this.orderingMenuMapperService.mapToWoltCategory(orderingCategory);
      })
      .filter(Boolean);

    const woltMenuData: WoltMenuData = {
      id: this.utilService.generatePublicId(),
      currency: 'EUR',
      primary_language: 'en',
      categories: result,
    };

    return woltMenuData;
  }

  // TODO: Need checking when option bind is only one
  async getWoltMenuCategory(orderingUserId: number, publicBusinessId: string) {
    const orderingAccessToken = await this.utilService.getOrderingAccessToken(orderingUserId);

    //Get business by public id
    const business = await this.businessService.findBusinessByPublicId(publicBusinessId);

    const orderingBusinessId = business.orderingBusinessId;

    if (!business.provider || business.provider.length === 0) {
      throw new NotFoundException('No provider associate with this business');
    }

    // Get wolt Venue
    const woltVenue = business.provider.filter(
      (businessProvider) => businessProvider.provider.name === ProviderEnum.Wolt,
    );

    // Get wolt Menu data
    const woltMenuData: MenuData = await this.woltService.getMenuCategory(
      orderingUserId,
      woltVenue[0].providerId,
    );

    return woltMenuData;
  }

  deepOptionEquals(option1: any, option2: any): boolean {
    return this.createOptionKey(option1) === this.createOptionKey(option2);
  }

  createOptionKey(option: any): string {
    // Consider using a JSON-based representation for reliable comparison
    return JSON.stringify(option);
  }

  async getMatchingService(
    sourceProvider: string,
    destinationProvider: string,
    menuCategory: any,
  ): Promise<string | null> {
    switch (sourceProvider) {
      case 'Ordering':
        // if (destinationProvider === 'Wolt') {
        //   return syncMenuOrderingToWolt(option);
        // } else if (destinationProvider === 'UberEats') {
        //   return syncMenuOrderingToUberEats(option);
        // }
        break;
      case 'Wolt':
        // ... Add logic for Wolt as source
        break;
      case 'UberEats':
        // ... Add logic for UberEats as source
        break;
      default:
        console.error('Unsupported provider:', sourceProvider);
        return null;
    }

    // If provider and direction are supported, but no option match is found:
    return null;
  }

  async getBusinessProduct(orderingUserId: number, publicBusinessId: string) {
    // Get access token
    const orderingAccessToken = await this.utilService.getOrderingAccessToken(orderingUserId);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const business = await this.businessService.findBusinessByPublicId(publicBusinessId);

    const categoryData = await this.orderingService.getMenuCategory(
      orderingAccessToken,
      business.orderingBusinessId,
    );

    //Format category data to product data
    const mappedCategoryData = plainToInstance(MenuCategoryDto, categoryData);

    // TODO: can add cached here

    return mappedCategoryData;
  }

  async getUnavailableBusinessProduct(orderingUserId: number, publicBusinessId: string) {
    // Get access token
    const orderingAccessToken = await this.utilService.getOrderingAccessToken(orderingUserId);

    const business = await this.businessService.findBusinessByPublicId(publicBusinessId);

    const categoryData = await this.orderingService.getMenuCategory(
      orderingAccessToken,
      business.orderingBusinessId,
    );

    const disabledProducts = categoryData.flatMap((category) =>
      category.products.filter((product) => !product.enabled),
    );

    //Format category data to product data
    const mappedCategoryData = plainToInstance(MenuProductDto, disabledProducts);

    return mappedCategoryData;
  }

  async getBusinessProductOption(orderingUserId: number, publicBusinessId: string) {
    const orderingAccessToken = await this.utilService.getOrderingAccessToken(orderingUserId);

    const business = await this.businessService.findBusinessByPublicId(publicBusinessId);

    const extrasData = await this.orderingService.getProductExtras(
      orderingAccessToken,
      business.orderingBusinessId,
    );

    const optionsData = extrasData.flatMap((extra) => extra.options);

    const mappedOPtionData = plainToInstance(MenuProductOptionDto, optionsData);

    return mappedOPtionData;
  }

  async deleteAllCategory(orderingUserId: number, publicBusinessId: string) {
    // Get access token
    const orderingAccessToken = await this.utilService.getOrderingAccessToken(orderingUserId);

    const business = await this.businessService.findBusinessByPublicId(publicBusinessId);

    const categories = await this.orderingService.getMenuCategory(
      orderingAccessToken,
      business.orderingBusinessId,
    );

    const productExtras = await this.orderingService.getProductExtras(
      orderingAccessToken,
      business.orderingBusinessId,
    );

    productExtras.map(async (category) => {
      await this.orderingService.deleteProductExtras(
        orderingAccessToken,
        business.orderingBusinessId,
        category.id.toString(),
      );
    });

    categories.map(async (category) => {
      await this.orderingService.deleteMenuCategory(
        orderingAccessToken,
        business.orderingBusinessId,
        category.id.toString(),
      );
    });
  }

  async editBusinessCategory(orderingUserId: number, bodyData: ValidatedCategoryBody) {
    // Extract catgegory data from body
    const { data: categories } = bodyData;

    const orderingAccessToken = await this.utilService.getOrderingAccessToken(orderingUserId);

    const business = await this.businessService.findBusinessByPublicId(bodyData.businessPublicId);

    const orderingBusinessId = business.orderingBusinessId;

    categories.forEach(async (category) => {
      const { id, ...updatedCategory } = category;

      await this.orderingService.editCategory(
        orderingAccessToken,
        orderingBusinessId,
        category.id.toString(),
        updatedCategory,
      );
    });

    return {
      message: 'Success',
    };
  }

  async editBusinessProduct(orderingUserId: number, bodyData: ValidatedProductBody) {
    // Extract catgegory data from body
    const { data: products } = bodyData;

    const orderingAccessToken = await this.utilService.getOrderingAccessToken(orderingUserId);

    const business = await this.businessService.findBusinessByPublicId(bodyData.businessPublicId);

    const orderingBusinessId = business.orderingBusinessId;

    products.forEach(async (product) => {
      const { categoryId, id, images, ...updatedProduct } = product;

      await this.orderingService.editProduct(
        orderingAccessToken,
        orderingBusinessId,
        product.categoryId.toString(),
        product.id.toString(),
        updatedProduct,
      );
    });

    return {
      message: 'Success',
    };
  }

  async editBusinessSuboption(orderingUserId: number, bodyData: ValidatedSuboptionBody) {
    // Extract catgegory data from body
    const { data: suboptions } = bodyData;

    const orderingAccessToken = await this.utilService.getOrderingAccessToken(orderingUserId);

    const business = await this.businessService.findBusinessByPublicId(bodyData.businessPublicId);

    const orderingBusinessId = business.orderingBusinessId;

    suboptions.forEach(async (suboption) => {
      const { extraOptionId: optionId, extraId, id: suboptionId, ...updatedSuboptions } = suboption;

      await this.orderingService.editProductSuboptions(
        orderingAccessToken,
        orderingBusinessId,
        extraId,
        optionId.toString(),
        suboptionId.toString(),
        updatedSuboptions,
      );
    });

    return {
      message: 'Success',
    };
  }

  async createMenuSynchronizationTracking(bodyData: ValidatedMenuTrackingBody) {
    // Extract catgegory data from body
    const { businessPublicId, timeSynchronize, type } = bodyData;

    const business = await this.businessService.findBusinessByPublicId(bodyData.businessPublicId);

    const orderingBusinessId = business.orderingBusinessId;

    // Create tracking
    const data = Prisma.validator<Prisma.MenuTrackingUncheckedCreateInput>()({
      name: `${business.name} menu tracking`,
      synchronizeTime: timeSynchronize,
      type: type,
      businessPublicId: businessPublicId,
    });

    await this.prismaService.menuTracking.upsert({
      where: {
        businessPublicId: businessPublicId,
      },
      create: data,
      update: data,
    });

    return {
      message: 'Success',
    };
  }

  async getWoltMenu(orderingUserId: number, businessPublicId: string) {
    const business = await this.businessService.findBusinessByPublicId(businessPublicId);
    const orderingBusinessId = business.orderingBusinessId;

    if (!business.provider || business.provider.length === 0) {
      throw new NotFoundException('No provider associate with this business');
    }

    // Get wolt Venue
    const provider = business.provider.filter((p) => p.provider.name === ProviderEnum.Wolt);

    // Get wolt Menu data
    const woltMenuData: MenuData = await this.woltService.getMenuCategory(
      orderingUserId,
      provider[0].providerId,
    );

    return woltMenuData;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async onMenuTracking() {
    const menuQueue = await this.prismaService.menuTracking.findMany({
      take: 10,
      where: {
        synchronizeTime: {
          gt: new Date().toISOString(), // Use the current date and time for comparison
        },
      },
    });

    this.logger.log(`Processing menu tracking queue : ${menuQueue.length}`);

    menuQueue.forEach(async (queue) => {
      const calculatedTime = moment().diff(queue.synchronizeTime, 'minutes');
      this.logger.log(`${queue.name}`);

      if (calculatedTime === 0) {
        const business = await this.businessService.findBusinessByPublicId(queue.businessPublicId);

        await this.providerMangementService.menuTracking(queue, business);
      }
    });
  }

  async getTrackingData(publicBusinessId: string) {
    const menuTracking = await this.prismaService.menuTracking.findUnique({
      where: {
        businessPublicId: publicBusinessId,
      },
    });

    if (!menuTracking) {
      return {
        message: 'No tracking at the moment',
      };
    }

    return menuTracking;
  }
}
