import { Injectable } from '@nestjs/common';
import { ProcessedCategory, ProcessedProduct, RawMenuData } from './dto/menu-process.dto';

@Injectable()
export class MenuDataProcessorService {
  processMenuData(rawData: RawMenuData): {
    isSharedMenu: boolean;
    categories: ProcessedCategory[];
  } {
    const isSharedMenu = rawData.menus.length === 0 && rawData.menus_shared.length > 0;
    const menusToProcess = isSharedMenu ? rawData.menus_shared : rawData.menus;
    const productsByCategory: { [categoryId: number]: ProcessedProduct[] } = {};
    const menuIdsByProduct: { [productId: number]: Set<number> } = {};

    // Process products from all menus
    menusToProcess.forEach((menu) => {
      menu.products.forEach((product) => {
        if (!productsByCategory[product.category_id]) {
          productsByCategory[product.category_id] = [];
        }
        if (!menuIdsByProduct[product.id]) {
          menuIdsByProduct[product.id] = new Set();
        }
        menuIdsByProduct[product.id].add(menu.id);
        const existingProduct = productsByCategory[product.category_id].find(
          (p) => p.id === product.id,
        );
        if (existingProduct) {
          existingProduct.menuIds.push(menu.id);
        } else {
          productsByCategory[product.category_id].push({
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.description,
            enabled: product.enabled,
            categoryId: product.category_id,
            images: product.images,
            menuIds: [menu.id],
          });
        }
      });
    });

    // Process categories
    const processCategory = (category: any): ProcessedCategory | null => {
      const processedCategory: ProcessedCategory = {
        id: category.id,
        name: category.name,
        description: category.description,
        enabled: category.enabled,
        menuIds: Array.from(
          new Set(productsByCategory[category.id]?.flatMap((p) => p.menuIds) || []),
        ),
        products: productsByCategory[category.id] || [],
      };

      if (category.subcategories && category.subcategories.length > 0) {
        processedCategory.subcategories = category.subcategories
          .map(processCategory)
          .filter((subcat): subcat is ProcessedCategory => subcat !== null);
      }

      // Check if the category has products or non-empty subcategories
      const hasProducts = processedCategory.products.length > 0;
      const hasNonEmptySubcategories =
        processedCategory.subcategories && processedCategory.subcategories.length > 0;

      return hasProducts || hasNonEmptySubcategories ? processedCategory : null;
    };

    const processedCategories = rawData.categories
      .map(processCategory)
      .filter((cat): cat is ProcessedCategory => cat !== null);

    return {
      isSharedMenu,
      categories: processedCategories,
    };
  }
}
