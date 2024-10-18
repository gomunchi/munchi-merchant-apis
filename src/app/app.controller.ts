import { Body, Controller, Get, Logger, Param, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private logger = new Logger(AppController.name);
  constructor(private readonly appService: AppService) {}

  @Get()
  welcome() {
    return this.appService.getHello();
  }

  @Post('/foodora/notification/order/:remoteId')
  dummyFoodoraRoute(
    @Body() foodoraWebhookdata: any,
    @Req() request: Request,
    @Param() remoteId: string,
  ) {
    this.logger.log(`Received Foodora request headers: ${JSON.stringify(request.headers)}`);
    this.logger.log(`Received Foodora webhook data: ${JSON.stringify(foodoraWebhookdata)}`);
    return 'Its just a dummy response for testing purpose';
  }
}
