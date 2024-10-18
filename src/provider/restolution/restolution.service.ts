import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import {
  RestolutionRestaurants,
  RestolutionMenu,
  RestolutionArticle,
  RestolutionResponse,
} from './dto/listRestourants-response.dto';
import NodeCache from 'node-cache';

@Injectable()
export class RestolutionService {
  private readonly apiUrl = 'https://restolution.fi/resto/api/';

  private cacheManager: NodeCache;

  constructor() {
    this.cacheManager = new NodeCache({ stdTTL: 60 * 60 }); // 1 hour
  }

  async listRestaurants(businessId: string): Promise<RestolutionResponse> {
    // TODO - get from Credential table
    const publicKey = 'publicKey';
    const privateKey = 'privateKey';

    const cacheKey = 'listRestaurants';
    const cachedData = this.cacheManager.get(cacheKey);

    if (cachedData) {
      return cachedData as RestolutionResponse;
    }

    const requestPayload = {
      timestamp: new Date().toISOString(),
      requestID: `req_${Math.floor(100000000 + Math.random() * 900000000)}`,
      method: 'listRestaurants',
      params: {
        includeArticles: true,
        includeBaseData: true,
      },
    };

    try {
      const response = await axios.post(
        this.apiUrl,
        new URLSearchParams({
          request: JSON.stringify(requestPayload),
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${publicKey}:${privateKey}`).toString('base64')}`,
          },
        },
      );

      this.cacheManager.set(cacheKey, response.data.response);

      return response.data.response as RestolutionResponse;
    } catch (error) {
      console.error('Error sending request to Restolution API', error);
      throw new HttpException('Failed to send request to Restolution API', HttpStatus.BAD_REQUEST);
    }
  }

  async listProducts(businessId: string) {
    const restaurants = await this.listRestaurants(businessId);
    const products: RestolutionArticle[] = [];

    restaurants.restaurants.forEach((restaurant: RestolutionRestaurants) => {
      restaurant.menus.forEach((menu: RestolutionMenu) => {
        menu.articles.forEach((article: RestolutionArticle) => {
          if (!products.find((product) => product.articleID === article.articleID)) {
            products.push(article);
          }
        });
      });
    });

    return products.map((product) => ({
      articleID: product.articleID,
      name: product.name,
    }));
  }

  // link all

  // unlink all

  // link one

  // unlink one
}
