import { Injectable } from '@nestjs/common';
import {
  Catalog,
  CatalogImportDto,
  CatalogItem,
  CatalogItemType,
  Category,
  MenuType,
  Product,
  Topping,
  ToppingType,
  WeekDay,
} from 'src/provider/foodora/dto/foodora-menu.dto';
import {
  MenuCategoryDto,
  MenuProductDto,
  MenuProductOptionDto,
  MenuProductOptionSuboptionDto,
  OrderingCategoryExtraOptionSubOption,
  OrderingProductCategory,
} from 'src/menu/dto/menu.dto';

@Injectable()
export class OrderingMenuMapperService {
  mapMenuToCatalogImportDto(
    vendors: string[],
    categories: OrderingProductCategory[],
    products: MenuProductDto[],
    extraOptions: MenuProductOptionDto[],
    extraOptionSuboptions: OrderingCategoryExtraOptionSubOption[],
    menus: { id: number; name: string; enabled: boolean }[],
  ): CatalogImportDto {
    const catalog: Catalog = {
      items: {},
    };

    // Map categories
    const categoryMap: { [id: string]: Category } = {};
    categories.forEach((category) => {
      const categoryId = category.external_id || category.id.toString();
      categoryMap[categoryId] = {
        id: categoryId,
        type: CatalogItemType.Category,
        title: {
          default: category.name,
        },
        products: {},
        images: category.image
          ? {
              [categoryId]: {
                id: categoryId,
                type: CatalogItemType.Image,
                url: category.image,
                alt: {
                  default: category.name,
                },
              },
            }
          : undefined,
      };
    });

    // Map products
    const productMap: { [id: string]: Product } = {};
    products.forEach((product) => {
      const productId = product.id.toString();
      productMap[productId] = {
        id: productId,
        type: CatalogItemType.Product,
        title: {
          default: product.name,
        },
        images: {
          [productId]: {
            id: productId,
            type: CatalogItemType.Image,
            url: product.images,
            alt: {
              default: product.name,
            },
          },
        },
        active: product.enabled,
        price: product.price.toString(),
        calories: 0,
        toppings: {},
        tags: {},
      };
      // Link products to categories
      const category = categoryMap[product.categoryId.toString()];
      if (category) {
        category.products[productId] = {
          id: productId,
          type: 'Product',
        };
      }
    });

    // Map extra options as toppings
    const toppingMap: { [id: string]: Topping } = {};
    extraOptions.forEach((extraOption) => {
      const toppingId = extraOption.id.toString();
      toppingMap[toppingId] = {
        id: toppingId,
        type: CatalogItemType.Topping,
        title: {
          default: extraOption.name,
        },
        quantity: {
          minimum: 1,
          maximum: 50,
        },
        products: {},
        toppingType: ToppingType.PRODUCT_OPTION,
      };
    });

    // Map extra option suboptions as products
    extraOptionSuboptions.forEach((subOption) => {
      const subOptionId = subOption.id.toString();
      const extraOption = toppingMap[subOption.extra_option_id.toString()];
      if (extraOption) {
        extraOption.products[subOptionId] = {
          id: subOptionId,
          type: 'Product',
        };
        catalog.items[subOptionId] = {
          id: subOptionId,
          type: CatalogItemType.Product,
          title: {
            default: subOption.name,
          },
          price: subOption.price.toString(),
        };
      }
    });

    // Map menus
    menus.forEach((menu) => {
      const menuId = menu.id.toString();
      catalog.items[menuId] = {
        id: menuId,
        type: CatalogItemType.Menu,
        title: {
          default: menu.name,
        },
        menuType: MenuType.DELIVERY,
        products: {},
        schedule: {
          [menuId]: {
            id: menuId,
            type: CatalogItemType.ScheduleEntry,
            starTime: '00:00:00',
            endTime: '23:59:59',
            weekDays: [
              WeekDay.MONDAY,
              WeekDay.TUESDAY,
              WeekDay.WEDNESDAY,
              WeekDay.THURSDAY,
              WeekDay.FRIDAY,
              WeekDay.SATURDAY,
              WeekDay.SUNDAY,
            ],
          },
        },
      };
      // Link products to menus
      productMap[menuId] = {
        id: menuId,
        type: CatalogItemType.Product,
        title: {
          default: menu.name,
        },
        active: menu.enabled,
        price: '0',
        // other product properties (e.g. image, variants, toppings)
      };
      catalog.items[menuId].products[menuId] = {
        id: menuId,
        type: 'Product',
      };
    });

    return {
      vendors,
      catalog,
    };
  }
}
