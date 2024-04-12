import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { MenuQuery, ValidatedProductBody } from './dto/menu.dto';
import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(private menuService: MenuService) {}

  @UseGuards(JwtGuard)
  @Get('category')
  getMenuCategory(@Req() request: any, @Query('businessPublicId') businessPublicId: string) {
    const { orderingUserId } = request.user;

    return this.menuService.getMenuCategory(orderingUserId, businessPublicId);
  }

  @UseGuards(JwtGuard)
  @Get('category/wolt')
  getWoltMenuCategory(@Req() request: any, @Query('businessPublicId') businessPublicId: string) {
    const { orderingUserId } = request.user;

    return this.menuService.getWoltMenuCategory(orderingUserId, businessPublicId);
  }

  @UseGuards(JwtGuard)
  @Get('product')
  getBusinessProduct(@Req() request: any, @Query(new ValidationPipe()) menuQuery: MenuQuery) {
    const { orderingUserId } = request.user;

    return this.menuService.getBusinessProduct(orderingUserId, menuQuery.businessPublicId);
  }

  @UseGuards(JwtGuard)
  @Get('option')
  getBusinessProductOption(@Req() request: any, @Query(new ValidationPipe()) menuQuery: MenuQuery) {
    const { orderingUserId } = request.user;

    return this.menuService.getBusinessProductOption(orderingUserId, menuQuery.businessPublicId);
  }

  @UseGuards(JwtGuard)
  @Get('product/unavailable')
  getUnavailableBusinessProduct(
    @Req() request: any,
    @Query(new ValidationPipe()) menuQuery: MenuQuery,
  ) {
    const { orderingUserId } = request.user;

    return this.menuService.getUnavailableBusinessProduct(
      orderingUserId,
      menuQuery.businessPublicId,
    );
  }

  @UseGuards(JwtGuard)
  @Put('category/:categoryId/product/:productId')
  putBusinessProduct(
    @Req() request: any,
    @Body(new ValidationPipe()) bodyData: ValidatedProductBody,
    @Param('categoryId') categoryId: string,
    @Param('productId') productId: string,
  ) {
    const { orderingUserId } = request.user;

    return this.menuService.setBusinessProductStatus(
      orderingUserId,
      bodyData,
      categoryId,
      productId,
    );
  }

  @UseGuards(JwtGuard)
  @Put('category/:categoryId')
  putBusinessCategory(
    @Req() request: any,
    @Body(new ValidationPipe()) bodyData: ValidatedProductBody,
    @Param('categoryId') categoryId: string,
  ) {
    const { orderingUserId } = request.user;

    return this.menuService.setBusinessCategoryStatus(orderingUserId, bodyData, categoryId);
  }

  @UseGuards(JwtGuard)
  @Delete('ordering/category')
  async deleteAllOrderingCategory(
    @Req() request: any,
    @Query('businessPublicId') businessPublicId: string,
    @Res() response: Response,
  ) {
    const { orderingUserId } = request.user;
    await this.menuService.deleteAllCategory(orderingUserId, businessPublicId);

    response.status(200).send('Success');
  }
}
