import { Controller, Get, Param, Query, Req, UseInterceptors } from '@nestjs/common';
import { OrderTrackingService } from './order-tracking.service';
import { TokenInterceptor } from 'src/auth/interceptor/token.interceptor';

@Controller('order-tracking')
@UseInterceptors(TokenInterceptor)
export class OrderTrackingController {
  constructor(private orderTrackingService: OrderTrackingService) {}
  @Get('/orders')
  async getOrders(@Query('business_id') businessId: string) {
    const orders = await this.orderTrackingService.getOrders(businessId);

    return {
      error: false,
      data: orders,
      message: 'success',
      status: 200,
    };
  }

  @Get(':orderId')
  async getOrdersById(@Req() req: any, @Param('orderId') orderId: string) {
    const { access_token } = req.users;

    const order = await this.orderTrackingService.getOrdersById(access_token, orderId);

    return {
      error: false,
      data: order,
      message: 'success',
      status: 200,
    };
  }
}
