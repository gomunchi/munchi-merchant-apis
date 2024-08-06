import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig } from 'axios';
import { OrderResponse } from 'src/order/dto/order.dto';

@Injectable()
export class ZapierService {
  private readonly logger = new Logger(ZapierService.name);
  private zapierUrl: string;
  constructor(private configService: ConfigService) {
    this.zapierUrl = this.configService.get('ZAPIER_URL');
  }
  async sendWebhook(order: OrderResponse) {
    const options: AxiosRequestConfig = {
      method: 'POST',
      url: this.zapierUrl,
      data: order,
    };

    try {
      const repsonse = await axios.request(options);
      return repsonse.data;
    } catch (error: any) {
      this.logger.error(JSON.stringify(error));
      throw new BadRequestException(error);
    }
  }
}
