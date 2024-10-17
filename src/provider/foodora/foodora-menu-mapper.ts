import { Injectable } from '@nestjs/common';
import {
  MenuProductDto,
  MenuProductOptionDto,
  OrderingCategoryExtraOptionSubOption,
  OrderingProductCategory,
} from 'src/menu/dto/menu.dto';
import {
  Catalog,
  CatalogImportDto,
  CatalogItemType,
  Category,
  Image,
  Menu,
  MenuType,
  CatalogItem,
  Product,
  ScheduleEntry,
  Topping,
  ToppingType,
  WeekDay,
} from 'src/provider/foodora/dto/foodora-menu.dto';
import { MunchiMenu, Result } from './dto/munchi-menu.dto';

@Injectable()
export class FoodoraMenuMapperService {
  async mapMenuToCatalogImportDto(munchiMenu: MunchiMenu) {
    const menus: { [key: string]: any } = {};
    const products: { [key: string]: any } = {};
    const toppingProducts: { [key: string]: any } = {};
    const toppings: { [key: string]: any } = {};
    const categories: { [key: string]: any } = {};
    // const images: { [key: string]: any } = {};
    const scheduleEntries: { [key: string]: any } = {};
    const vendorId = '351';

    menus[
      `MENU_${munchiMenu.result.menus[0].name.toLowerCase().replace(/ /g, '_')}_${
        munchiMenu.result.menus[0].id
      }`
    ] = this.mapMenu(munchiMenu.result.menus[0], scheduleEntries);

    // Map products
    munchiMenu.result.menus.forEach((menu, index) => {
      menu.products.forEach((product) => {
        const productId = `PRODUCT_${this.removeUnsupportedCharacters(product.slug)}_${product.id}`;
        if (!products[productId]) {
          products[productId] = this.mapProduct(product, vendorId, toppingProducts);
        }
        // Map toppings
        product.extras.forEach((topping) => {
          const toppingId = `TOPPING_${topping.name}_${topping.id}`;
          if (!toppings[toppingId]) {
            toppings[toppingId] = this.mapTopping(topping, productId, toppingProducts);
          }
        });
        // Map categories
        const categoryId = `CATEGORY_${this.removeUnsupportedCharacters(
          product.category.name.toLowerCase().replace(/ /g, '_'),
        )}_${product.category.id}`;
        if (!categories[categoryId]) {
          categories[categoryId] = this.mapCategory(product.category, productId);
        }
      });
    });

    const categoryId = `CATEGORY_Additional_0000`;
    categories[categoryId] = {
      id: categoryId,
      type: CatalogItemType.Category,
      title: {
        default: 'Additional',
      },
      images: {},
      products: {
        // only ids
        ...Object.keys(toppingProducts).reduce((products, toppingProductId) => {
          products[toppingProductId] = {
            id: toppingProductId,
            type: 'Product',
          };
          return products;
        }, {}),
      },
    };

    //category other - all products without category
    const productsWithoutCategory = Object.keys(products).filter((productId) => {
      return !Object.keys(categories).some(
        (categoryId) => categories[categoryId].products[productId],
      );
    });
    const categoryIdOther = `CATEGORY_Other_0000`;
    categories[categoryIdOther] = {
      id: categoryIdOther,
      type: CatalogItemType.Category,
      title: {
        default: 'Other',
      },
      images: {},
      products: {
        // only ids
        ...productsWithoutCategory.reduce((products, productId) => {
          products[productId] = {
            id: productId,
            type: 'Product',
          };
          return products;
        }, {}),
      },
    };

    const result: any = {
      // callbackUrl: null,
      catalog: {
        items: {
          ...products,
          ...toppingProducts,
          ...toppings,
          ...categories,
          // ...images,
          ...scheduleEntries,
          ...menus,
        },
      },
      vendors: [vendorId],
    };
    return result;
  }

  private mapProduct(
    product: any,
    vendorId: string,
    toppingProducts: { [key: string]: any },
  ): CatalogItem {
    const productId = `PRODUCT_${this.removeUnsupportedCharacters(product.slug)}_${product.id}`;
    return {
      id: productId,
      type: CatalogItemType.Product,
      price: product.price.toString(),
      title: {
        default: product.name,
      },
      images: {}, // Add image mapping if needed
      active: product.enabled,
      isPrepackedItem: false,
      isExpressItem: false,
      excludeDishInformation: false,
      tags: {}, // Add tags mapping if needed
      calories: product.calories || 10, // Default value for calories
      toppings: this.mapToppings(product.extras, productId),
    };
  }

  private mapTopping(
    topping: any,
    productId: string,
    toppingProducts: { [key: string]: any },
  ): any {
    const toppingId = `TOPPING_${topping.name}_${topping.id}`;
    return {
      id: toppingId,
      type: CatalogItemType.Topping,
      quantity: {
        minimum: 0, // min of option.min
        maximum: topping.options.reduce((max, option) => Math.max(max, option.max), 0), // max of option.max
      },
      title: {
        default: topping.name,
      },
      products: this.mapToppingOptions(topping.options, productId, toppingProducts), // Pass toppingProducts
    };
  }

  private mapToppings(extras: any[], productId: string): any {
    return extras.reduce((toppings, extra) => {
      const toppingId = `TOPPING_${extra.name}_${extra.id}`;
      toppings[toppingId] = {
        id: toppingId,
        type: 'Topping',
      };
      return toppings;
    }, {});
  }

  private mapToppingOptions(options: any[], productId: string, toppingProducts: any): any {
    return options.reduce((products, option) => {
      option.suboptions.forEach((suboption) => {
        const productSlug = `${option.name.toLowerCase().replace(/ /g, '_')}_${suboption.name
          .toLowerCase()
          .replace(/ /g, '_')}`;
        const subproductId = `PRODUCT_${productSlug}_${suboption.id}`;
        products[subproductId] = {
          id: subproductId,
          type: 'Product',
        };
        toppingProducts[subproductId] = {
          id: subproductId,
          type: 'Product',
          title: {
            default: `${option.name} ${suboption.name}`,
          },
          price: suboption.price.toString(),
          images: {},
          active: true,
          isPrepackedItem: false,
          isExpressItem: false,
          excludeDishInformation: false,
          tags: {},
          calories: 10, // Default value for calories
        };
      });
      return products;
    }, {});
  }

  private mapCategory(category: any, productId: string): CatalogItem {
    const categoryId = `CATEGORY_${category.name.toLowerCase().replace(/ /g, '_')}_${category.id}`;
    return {
      id: categoryId,
      type: CatalogItemType.Category,
      title: {
        default: category.name,
      },
      images: {},
      products: {
        [productId]: {
          id: productId,
          type: 'Product',
        },
      },
    };
  }

  private mapMenu(menu: any, scheduleEntries: { [key: string]: any }): any {
    const menuId = `MENU_${menu.name.toLowerCase().replace(/ /g, '_')}_${menu.id}`;
    const schedule = this.mapSchedule(menu.schedule, menuId, scheduleEntries);
    return {
      id: menuId,
      type: CatalogItemType.Menu,
      title: {
        default: 'Main Menu', //static
      },
      description: {
        default: 'Main Menu', //static
      },
      products: this.mapMenuProducts(menu.products, menuId), // Pass menuId
      schedule,
      menuType: 'DELIVERY',
      images: {},
    };
  }

  private mapMenuProducts(products: any[], menuId: string): any {
    return products.reduce((menuProducts, product) => {
      const productId = `PRODUCT_${this.removeUnsupportedCharacters(product.slug)}_${product.id}`;
      menuProducts[productId] = {
        id: productId,
        type: 'Product',
        order: Math.round(product.rank),
      };
      return menuProducts;
    }, {});
  }

  private mapSchedule(
    schedule: any[],
    menuId: string,
    scheduleEntries: { [key: string]: any },
  ): any {
    const menuScheduleEntries: { [key: string]: any } = {};
    schedule.forEach((entry, index) => {
      const entryId = `${menuId}_SCHEDULE_${this.getWeekDay(index)}`;
      menuScheduleEntries[entryId] = {
        id: entryId,
        type: CatalogItemType.ScheduleEntry,
      };
      scheduleEntries[entryId] = {
        id: entryId,
        type: CatalogItemType.ScheduleEntry,
        startTime: this.formatTime(entry.lapses[0].open),
        endTime: this.formatTime(entry.lapses[0].close),
        weekDays: [this.getWeekDay(index)],
      };
    });
    return menuScheduleEntries;
  }

  private getWeekDay(index: number): WeekDay {
    switch (index) {
      case 0:
        return WeekDay.MONDAY;
      case 1:
        return WeekDay.TUESDAY;
      case 2:
        return WeekDay.WEDNESDAY;
      case 3:
        return WeekDay.THURSDAY;
      case 4:
        return WeekDay.FRIDAY;
      case 5:
        return WeekDay.SATURDAY;
      case 6:
        return WeekDay.SUNDAY;
      default:
        return WeekDay.MONDAY;
    }
  }

  private formatTime(time: any): string {
    return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}:00`;
  }

  private removeUnsupportedCharacters(slug: string): string {
    const unsupportedCharsRegex = /[^\u0000-\uFFFF]|\ud83d\ude0d/g;
    return slug ? slug.replace(unsupportedCharsRegex ? unsupportedCharsRegex : '', '') : '';
  }
}
