import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { WoltOrderNotification } from 'src/provider/wolt/wolt.type';
import { WebhookService } from './webhook.service';

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
}
