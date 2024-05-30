/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Query } from '@nestjs/common/decorators';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard/jwt.guard';

import { OrderData } from 'src/type';
import { OrderService } from './order.service';
import { OrderRejectData, OrderStatusFilter } from './validation/order.validation';

@UseGuards(JwtGuard)
@ApiBearerAuth('JWT-auth')
@Controller('orders')
@ApiTags('Order')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get('orderByStatus')
  async getOrderByStatus(
    @Request() request: any,
    @Query(new ValidationPipe({ transform: true })) queryData: OrderStatusFilter,
  ) {
    const { orderingUserId } = request.user;

    return this.orderService.getOrderByStatus(orderingUserId, queryData);
  }

  @Get(':orderId')
  async getOrderbyId(@Param('orderId') orderId: string, @Request() req: any) {
    const { orderingUserId } = req.user;

    return this.orderService.getOrderbyId(orderingUserId, orderId);
  }

  @Put(':orderId')
  async updateOrder(
    @Param('orderId') orderId: string,
    @Body() orderData: OrderData,
    @Request() req: any,
  ) {
    const { orderingUserId, sessionPublicId } = req.user;

    return this.orderService.updateOrder(sessionPublicId, orderingUserId, orderId, orderData);
  }

  @Put(':orderId/reject')
  async rejectOrder(
    @Param('orderId') orderId: string,
    @Body() orderRejectData: OrderRejectData,
    @Request() req: any,
  ) {
    const { orderingUserId, sessionPublicId } = req.user;

    return this.orderService.rejectOrder(sessionPublicId, orderingUserId, orderId, orderRejectData);
  }
}
