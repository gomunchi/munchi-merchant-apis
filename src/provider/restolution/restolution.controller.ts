import { Controller, Get, Post, Query } from '@nestjs/common';
import { RestolutionService } from './restolution.service';

@Controller('restolution')
export class RestolutionController {
  constructor(private readonly restolutionService: RestolutionService) {}

  @Get('list-restaurants')
  async listRestaurants(@Query('businessId') businessId: string) {
    return this.restolutionService.listRestaurants(businessId);
  }
  @Get('list-products')
  async listProducts(@Query('businessId') businessId: string) {
    return this.restolutionService.listProducts(businessId);
  }
}
