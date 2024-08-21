import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import axios, { AxiosRequestConfig } from 'axios';
import { OrderingOrder } from 'src/provider/ordering/dto/ordering-order.dto';

@Injectable()
export class ZapierService {
  private readonly logger = new Logger(ZapierService.name);
  private zapierUrl: string;
  constructor(private configService: ConfigService) {
    this.zapierUrl = this.configService.get('ZAPIER_URL');
  }

  @OnEvent('zapier.trigger')
  async sendZapierWebhook(order: OrderingOrder) {
    try {
      const result = await this.sendWebhook(order);

      this.logger.log(`Zapier webhook sent successfully for order: ${order.id}`);

      return result;
    } catch (error) {
      this.logger.error(`error sendingZapierhook: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  async sendWebhook(order: OrderingOrder) {
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
