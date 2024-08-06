import { Injectable } from '@nestjs/common';
import { Option, Product, SubOption } from '@prisma/client';
import { OrderResponse, OrderStatusEnum } from 'src/order/dto/order.dto';
import { OrderService } from 'src/order/order.service';

interface AnalysisResult {
  product: {
    name: string;
    total: number;
    quantity: number;
  }[];
  option: {
    name: string;
    total: number;
    quantity: number;
  }[];
  suboption: {
    name: string;
    total: number;
    quantity: number;
  }[];
}

@Injectable()
export class FinancialAnalyticsService {
  async analyzeOrderData(orders: OrderResponse[]) {
    const rejectedOrders = orders.filter((order) => order.status === OrderStatusEnum.REJECTED);

    const deliveredOrders = orders.filter((order) => order.status === OrderStatusEnum.DELIVERED);

    const totalRejections = rejectedOrders.length;

    const totalRejectionValue = rejectedOrders.reduce(
      (sum, order) => sum + parseFloat(order.summary.total),
      0,
    );

    const totalSales = deliveredOrders.reduce(
      (sum, order) => sum + parseFloat(order.summary.total),
      0,
    );

    return {
      totalSales,
      totalRejections,
      totalRejectionValue,
    };
  }

  async analyzeProductData(orders: any[]) {
    const result: AnalysisResult = { product: [], option: [], suboption: [] };

    for (const order of orders) {
      for (const product of order.products) {
        this.addProduct(result, product);

        if (product.option) {
          for (const option of product.option) {
            this.addOption(result, product, option);

            if (option.subOption) {
              for (const suboption of option.subOption) {
                this.addSuboption(result, product, option, suboption);
              }
            }
          }
        }
      }
    }

    return result;
  }

  addProduct(result: AnalysisResult, product: Product) {
    const existingProduct = result.product.find((p) => p.name === product.name);
    if (existingProduct) {
      existingProduct.quantity += product.quantity;
      existingProduct.total += parseFloat(product.price) * product.quantity; // Assuming price is a string
    } else {
      result.product.push({
        name: product.name,
        quantity: product.quantity,
        total: parseFloat(product.price) * product.quantity,
      });
    }
  }

  addOption(result: AnalysisResult, product: Product, option: Option) {
    const existingOption = result.option.find(
      (o) => o.name === `${product.name} - ${option.name}`, // Unique key with product name
    );

    if (existingOption) {
      existingOption.quantity += 1; // Assuming each option has a base quantity of 1
      // Add calculation for option total (multiply by option price if you have it)
    } else {
      result.option.push({
        name: `${product.name} - ${option.name}`,
        quantity: 1,
        total: 0, // Initialize the option total (you'll need option price to calculate)
      });
    }
  }

  addSuboption(result: AnalysisResult, product: Product, option: Option, suboption: SubOption) {
    const existingSuboption = result.suboption.find(
      (s) => s.name === `${product.name} - ${option.name} - ${suboption.name}`, // Unique key
    );

    if (existingSuboption) {
      existingSuboption.quantity += suboption.quantity;
      existingSuboption.total += parseFloat(suboption.price) * suboption.quantity;
    } else {
      result.suboption.push({
        name: `${product.name} - ${option.name} - ${suboption.name}`,
        quantity: suboption.quantity,
        total: parseFloat(suboption.price) * suboption.quantity,
      });
    }
  }
}
