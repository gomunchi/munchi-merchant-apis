import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from 'src/auth/guard/apiKey.guard';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { SessionService } from 'src/auth/session.service';
import { BusinessService } from './business.service';
import { BusinessDto, SetOnlineStatusDto } from './dto/business.dto';
import { ProviderDto } from './validation';

@Controller('business')
@ApiBearerAuth('JWT-auth')
@ApiBadRequestResponse({
  description: 'Something wrong happened',
})
@ApiTags('Business')
export class BusinessController {
  constructor(private businessService: BusinessService, private sessionService: SessionService) {}

  @ApiAcceptedResponse({
    description: 'Retrieve all businesses owned by a user',
  })
  @UseGuards(JwtGuard)
  @Get('allbusiness')
  async getUserBusinesses(@Request() req: any): Promise<BusinessDto[]> {
    const { sessionPublicId } = req.user;
    const user = await this.sessionService.getSessionUserBySessionPublicId(sessionPublicId);
    return this.businessService.businessOwnershipService(user.orderingUserId);
  }

  @UseGuards(ApiKeyGuard)
  @Get('ordering-businesses')
  async getAllBusiness(@Request() request: any) {
    const page = request.query.page;
    const rowPerPage = request.query.rowPerPage;
    return this.businessService.getAllBusiness(parseInt(page), parseInt(rowPerPage));
  }

  @ApiCreatedResponse({
    description: 'Get business in session',
  })
  @UseGuards(JwtGuard)
  @Get('session-business')
  async getBusinessInSession(@Request() req: any) {
    const { sessionPublicId } = req.user;

    return this.businessService.getBusinessInSession(sessionPublicId);
  }

  @ApiCreatedResponse({
    description: 'Get a specific business',
    type: BusinessDto,
  })
  @UseGuards(JwtGuard)
  @Get(':businessId')
  async getBusinessById(@Request() req: any, @Param('businessId') publicBusinessId: string) {
    const { sessionPublicId } = req.user;
    const user = await this.sessionService.getSessionUserBySessionPublicId(sessionPublicId);
    return await this.businessService.getBusinessById(user.orderingUserId, publicBusinessId);
  }
  @ApiCreatedResponse({
    description: 'Edit a specific business',
    type: BusinessDto,
  })
  @UseGuards(JwtGuard)
  @Post('online-status')
  async setOnlineStatus(@Request() req: any, @Body() body: SetOnlineStatusDto) {
    const { status, duration, id: businessPublicId, provider } = body;

    if (status === false && !duration) {
      throw new BadRequestException('duration is needed when status is false');
    }

    const { userPublicId } = req.user;
    return this.businessService.setOnlineStatusByPublicId(
      provider,
      userPublicId,
      businessPublicId,
      status,
      duration,
    );
  }

  @ApiCreatedResponse({
    description: 'Add an extra business config for a specific extra business',
  })
  @UseGuards(ApiKeyGuard)
  @Post('add-provider')
  async setExtraConfig(@Body(new ValidationPipe()) providerBodyData: ProviderDto) {
    const { id: businessPublicId } = providerBodyData;

    return this.businessService.addBusinessProvider(businessPublicId, providerBodyData);
  }
}
