import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { WebhookService } from './webhook.service';
import { WoltOrderNotification } from 'src/provider/wolt/dto/wolt-order.dto';

@Controller('webhook')
@ApiTags('Webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('newOrder')
  newOrder(@Body() order: any) {
    return this.webhookService.newOrderNotification(order);
  }

  @Post('statusChange')
  changeOrder(@Body() order: any) {
    return this.webhookService.changeOrderNotification(order);
  }

  @Post('wolt/notification')
  woltNewOrder(@Body() woltWebhookdata: WoltOrderNotification, @Req() request: Request) {
    return this.webhookService.woltOrderNotification(woltWebhookdata);
  }

  @Post('foodora/notification/order/:remoteId')
  foodoraNewOrder(
    @Body() foodoraWebhookdata: any,
    @Req() request: Request,
    @Param() remoteId: string,
  ) {
    return this.webhookService.foodoraOrderNotification(foodoraWebhookdata, request, remoteId);
  }
}
