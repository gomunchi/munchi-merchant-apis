import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import {
  ValidatedBusinessId,
  ValidatedCategoryBody,
  ValidatedMenuTrackingBody,
  ValidatedProductBody,
  ValidatedSuboptionBody,
} from './dto/menu.dto';
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
  getBusinessProduct(
    @Req() request: any,
    @Query(new ValidationPipe()) menuQuery: ValidatedBusinessId,
  ) {
    const { orderingUserId } = request.user;

    return this.menuService.getBusinessProduct(orderingUserId, menuQuery.businessPublicId);
  }

  @UseGuards(JwtGuard)
  @Get('option')
  getBusinessProductOption(
    @Req() request: any,
    @Query(new ValidationPipe()) menuQuery: ValidatedBusinessId,
  ) {
    const { orderingUserId } = request.user;

    return this.menuService.getBusinessProductOption(orderingUserId, menuQuery.businessPublicId);
  }

  @UseGuards(JwtGuard)
  @Get('product/unavailable')
  getUnavailableBusinessProduct(
    @Req() request: any,
    @Query(new ValidationPipe()) menuQuery: ValidatedBusinessId,
  ) {
    const { orderingUserId } = request.user;

    return this.menuService.getUnavailableBusinessProduct(
      orderingUserId,
      menuQuery.businessPublicId,
    );
  }

  @UseGuards(JwtGuard)
  @Patch('category')
  businessCategory(
    @Req() request: any,
    @Body(new ValidationPipe()) bodyData: ValidatedCategoryBody,
  ) {
    console.log('🚀 ~ MenuController ~ bodyData:', bodyData);
    const { orderingUserId } = request.user;

    return this.menuService.editBusinessCategory(orderingUserId, bodyData);
  }

  @UseGuards(JwtGuard)
  @Patch('products')
  businessProduct(@Req() request: any, @Body(new ValidationPipe()) bodyData: ValidatedProductBody) {
    console.log('🚀 ~ MenuController ~ bodyData:', bodyData);
    const { orderingUserId } = request.user;

    return this.menuService.editBusinessProduct(orderingUserId, bodyData);
  }

  @UseGuards(JwtGuard)
  @Patch('suboptions')
  businessSuboption(
    @Req() request: any,
    @Body(new ValidationPipe()) bodyData: ValidatedSuboptionBody,
  ) {
    console.log('🚀 ~ MenuController ~ bodyData:', bodyData);
    const { orderingUserId } = request.user;

    return this.menuService.editBusinessSuboption(orderingUserId, bodyData);
  }

  @UseGuards(JwtGuard)
  @Get('tracking')
  menuTracking(@Req() request: any, @Query(new ValidationPipe()) query: ValidatedBusinessId) {
    return this.menuService.getTrackingData(query.businessPublicId);
  }

  @UseGuards(JwtGuard)
  @Post('tracking')
  menuTrackingInformation(
    @Req() request: any,
    @Body(new ValidationPipe()) bodyData: ValidatedMenuTrackingBody,
  ) {
    return this.menuService.createMenuSynchronizationTracking(bodyData);
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
