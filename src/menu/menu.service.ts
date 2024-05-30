import { Injectable } from '@nestjs/common';
import { Provider } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { BusinessService } from 'src/business/business.service';
import { OrderingMenuCategory } from 'src/provider/ordering/dto/ordering-menu.dto';
import { OrderingMenuMapperService } from 'src/provider/ordering/ordering-menu-mapper';
import { OrderingService } from 'src/provider/ordering/ordering.service';
import { ProviderEnum } from 'src/provider/provider.type';
import { MenuData, WoltCategory, WoltMenuData } from 'src/provider/wolt/dto/wolt-menu.dto';
import { WoltService } from 'src/provider/wolt/wolt.service';
import { UtilsService } from 'src/utils/utils.service';
import { MenuCategoryDto } from './dto/menu.dto';
import { WoltMenuMapperService } from 'src/provider/wolt/wolt-menu-mapper';

@Injectable()
export class MenuService {
  constructor(
    private orderingService: OrderingService,
    private orderingMenuMapperService: OrderingMenuMapperService,
    private woltMenuMapperService: WoltMenuMapperService,
    private businessService: BusinessService,
    private woltService: WoltService,
    private utilService: UtilsService,
  ) {}
  async getMenuCategory(orderingUserId: number, publicBusinessId: string) {
    console.log('IS this running');
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

    //Map to wolt object and remove propertyn that has no product out of the result object
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

    //Sync order to Wolt
    await this.orderingService.syncMenu(woltVenue[0].providerId, orderingUserId, woltMenuData);

    return woltMenuData;
  }

  // TODO: Need checking when option bind is only one
  async getWoltMenuCategory(orderingUserId: number, publicBusinessId: string) {
    const orderingAccessToken = await this.utilService.getOrderingAccessToken(orderingUserId);

    //Get business by public id
    const business = await this.businessService.findBusinessByPublicId(publicBusinessId);

    const orderingBusinessId = business.orderingBusinessId;

    // Get wolt Venue
    const woltVenue = business.provider.filter(
      (businessProvider) => businessProvider.provider.name === ProviderEnum.Wolt,
    );

    // Get wolt Menu data
    const woltMenuData: MenuData = await this.woltService.getMenuCategory(
      orderingUserId,
      woltVenue[0].providerId,
    );

    if (woltMenuData.status === 'READY') {
      const { options } = woltMenuData.menu;
      const orderingCategoryData = this.woltMenuMapperService.mapToOrderingCategory(woltMenuData);

      // Create product extras
      const extras = await this.orderingService.createProductsExtraField(
        orderingAccessToken,
        orderingBusinessId,
      );

      const newExtraId = typeof extras.id === 'number' ? extras.id.toString() : extras.id;

      const extrasParentObj = {
        id: newExtraId,
        options: [],
      };

      // Create option extras
      options.map(async (option) => {
        extrasParentObj.options.push(option);
        const formattedOption = this.woltMenuMapperService.mapToOrderingOption(option);
        const newOption = await this.orderingService.createProductOptions(
          orderingAccessToken,
          orderingBusinessId,
          newExtraId,
          formattedOption,
        );
        const newOptionId =
          typeof newOption.id === 'number' ? newOption.id.toString() : newOption.id;

        // Create suboption extras
        formattedOption.values.map(async (value) => {
          await this.orderingService.createProductOptionsSuboptions(
            orderingAccessToken,
            orderingBusinessId,
            newExtraId,
            newOptionId,
            value,
          );
        });
      });

      // Create category
      orderingCategoryData.map(async (category: any) => {
        const newCategory = await this.orderingService.createCategory(
          orderingAccessToken,
          orderingBusinessId,
          category,
        );

        const newCategoryId =
          typeof newCategory.id === 'number' ? newCategory.id.toString() : newCategory.id;

        // Create products
        category.products.map(async (product: any) => {
          // Create product
          const newProduct = await this.orderingService.createProducts(
            orderingAccessToken,
            orderingBusinessId,
            newCategory.id,
            product,
          );
          // Format product id
          const newProductId =
            typeof newProduct.id === 'number' ? newProduct.id.toString() : newProduct.id;

          if (product.options.length === 0 || product.option_bindings.length === 0) {
            return;
          }

          let hasMatch: boolean = false;

          for (const productOption of product.options) {
            const hasMatchingOption: boolean = extrasParentObj.options.some(
              (extrasOption: any) => extrasOption.id === productOption.id,
            );

            if (hasMatchingOption) {
              hasMatch = true;
              break;
            }
          }
          if (hasMatch) {
            // Edit product (add extras to product)
            await this.orderingService.editProduct(
              orderingAccessToken,
              orderingBusinessId,
              newCategoryId,
              newProductId,
              `[${extrasParentObj.id}]`,
            );
          }

          return;
        });
      });

      return orderingCategoryData;
    }

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

    const business = await this.businessService.findBusinessByPublicId(publicBusinessId);

    const categoryData = await this.orderingService.getMenuCategory(
      orderingAccessToken,
      business.orderingBusinessId,
    );

    //Format category data to product data
    const mappedCategoryData = plainToInstance(MenuCategoryDto, categoryData);

    return mappedCategoryData;
  }

  async getUnavailableBusinessProduct(orderingUserId: number, publicBusinessId: string) {
    // Get access token
    const orderingAccessToken = await this.utilService.getOrderingAccessToken(orderingUserId);

    const business = await this.businessService.findBusinessByPublicId(publicBusinessId);

    const categoryData = await this.orderingService.getUnavailableMenuCategory(
      orderingAccessToken,
      business.orderingBusinessId,
    );
    //Format category data to product data
    const mappedCategoryData = plainToInstance(MenuCategoryDto, categoryData);

    return mappedCategoryData;
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
}
