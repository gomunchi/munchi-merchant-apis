import { Injectable } from '@nestjs/common';
import {
  WoltCategory,
  WoltOptionValue,
  WoltProductItem,
  WoltProductOption,
} from '../wolt/dto/wolt-menu.dto';
import {
  OrderingCategoryProduct,
  OrderingCategoryProductExtraOption,
  OrderingCategoryProductExtraSubOption,
  OrderingMenuCategory,
} from './dto/ordering-menu.dto';
import { MenuProductDto } from 'src/menu/dto/menu.dto';

@Injectable()
export class OrderingMenuMapperService {
  mapToWoltCategory(orderingCategory: OrderingMenuCategory): WoltCategory {
    const woltProducts = this.mapToWoltItem(orderingCategory.products);

    return {
      id: orderingCategory.id.toString(),
      name: [
        {
          lang: 'en',
          value: orderingCategory.name,
        },
      ],
      description: [
        {
          lang: 'en',
          value: orderingCategory.description
            ? orderingCategory.description
            : 'Testing category description',
        },
      ],
      items: woltProducts,
    };
  }

  //Map from product to wolt items
  mapToWoltItem(orderingCategoryProducts: OrderingCategoryProduct[]): WoltProductItem[] {
    // TODO: Check if there is no product in the category

    return orderingCategoryProducts.map(
      (categoryProduct: OrderingCategoryProduct): WoltProductItem => ({
        name: [
          {
            lang: 'en',
            value: categoryProduct.name,
          },
        ],
        description: [
          {
            lang: 'en',
            value: categoryProduct.description
              ? categoryProduct.description
              : 'Testing for syncing',
          },
        ],
        delivery_methods: ['takeaway', 'homedelivery', 'eatin'],
        price: categoryProduct.price,
        image_url: categoryProduct.images ? categoryProduct.images : '',
        external_data: categoryProduct.id.toString(),
        enabled: categoryProduct.enabled,
        options:
          categoryProduct.extras.length !== 0
            ? this.mapToWoltOptionFromOrdering(categoryProduct.extras[0].options).filter(Boolean)
            : undefined,
      }),
    );
  }

  // Map from ordering option and suboption to wolt option
  mapToWoltOptionFromOrdering(
    orderingProductExtras: OrderingCategoryProductExtraOption[],
  ): WoltProductOption[] {
    return orderingProductExtras.map((productOption: OrderingCategoryProductExtraOption) => {
      if (productOption.suboptions.length === 0) return undefined;

      return {
        external_data: productOption.id.toString(),
        name: [
          {
            lang: 'en',
            value: productOption.name,
          },
        ],
        type: productOption.max > 2 ? 'MultiChoice' : 'SingleChoice',
        values: productOption.suboptions.map(
          (subOption: OrderingCategoryProductExtraSubOption): WoltOptionValue => ({
            price: subOption.price,
            external_data: subOption.id.toString(),
            enabled: subOption.enabled,
            default: true,
            name: [
              {
                lang: 'en',
                value: subOption.name,
              },
            ],
          }),
        ),
      };
    });
  }

  mapCategoryToProduct(orderingCategory: OrderingCategoryProduct): MenuProductDto[] {
    return;
  }
}
