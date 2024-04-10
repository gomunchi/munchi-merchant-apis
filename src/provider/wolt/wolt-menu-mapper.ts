import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderingMenuCategory } from '../ordering/dto/ordering-menu.dto';
import {
  ItemBinding,
  OptionBinding,
  MenuData,
  MenuItem,
  TranslatedText,
  WoltCategory as WoltMenuCategory,
  MenuItemOption,
  MenuItemOptionValue,
} from './dto/wolt-menu.dto';
import { WoltLanguageCode } from './wolt.type';

@Injectable()
export class WoltMenuMapperService {
  constructor() {}

  mapToOrderingCategory(woltMenuData: MenuData) {
    const { menu } = woltMenuData;

    const { categories, items, options } = menu;

    return categories
      .map((category) => {
        const products = [];

        if (category.item_bindings.length === 0) {
          return;
        }

        category.item_bindings.map((itemBinding: ItemBinding) => {
          items.map((item) => {
            const optionArray = [];

            // Resolve option to product
            item.option_bindings.map((optionBinding: OptionBinding) => {
              options.map((option) => {
                const optionName = option.name.filter(
                  (name) => name.lang === WoltLanguageCode.English,
                )[0].value;

                const optionValues = option.values.map((values) => {
                  const productValueName = values.product.name.filter(
                    (name) => name.lang === WoltLanguageCode.English,
                  )[0].value;

                  const product = {
                    ...values.product,
                    name: productValueName,
                  };

                  return {
                    ...values,
                    product: product,
                    price: values.price / 100,
                  };
                });
                const optionObject = {
                  ...option,
                  name: optionName,
                  values: optionValues,
                };

                if (option.id === optionBinding.option_id) {
                  optionArray.push(optionObject);
                }
              });
            });

            const productName = item.product.name.filter(
              (name) => name.lang === WoltLanguageCode.English,
            )[0].value;

            const productDescription = item.product.description.filter(
              (description) => description.lang === WoltLanguageCode.English,
            )[0].value;

            const product = {
              ...item.product,
              name: productName,
              description: productDescription,
              price: item.price / 100,
            };
            //Initialize product object
            const productObject = {
              ...item,
              product: product,
              options: optionArray,
            };

            if (item.id === itemBinding.item_id) {
              // Assuming IDs are guaranteed to match
              products.push(productObject);
            }
          });
        });

        return {
          name: category.name.filter(
            (text: TranslatedText) => text.lang === WoltLanguageCode.English,
          )[0].value,
          enabled: true,
          products: products,
        };
      })
      .filter(Boolean);
  }

  mapToOrderingOption(option: MenuItemOption) {
    const newOptionName = option.name.filter((name) => name.lang === WoltLanguageCode.English)[0]
      .value;

    const newValues = option.values.map((value: MenuItemOptionValue) => {
      const newValueName = value.product.name.filter(
        (name) => name.lang === WoltLanguageCode.English,
      )[0].value;

      return {
        ...value,
        product: {
          ...value.product,
          name: newValueName,
        },
      };
    });

    return {
      ...option,
      name: newOptionName,
      values: newValues,
    };
  }
}
