import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ApiKey, Business, BusinessProviders, Prisma, Provider } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import moment from 'moment-timezone';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderingService } from 'src/provider/ordering/ordering.service';
import { UserService } from 'src/user/user.service';
import { UtilsService } from 'src/utils/utils.service';
import { BusinessDto } from './dto/business.dto';

import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApiKeyService } from 'src/auth/apiKey.service';
import { SessionService } from 'src/auth/session.service';
import { OrderingBusiness } from 'src/provider/ordering/ordering.type';
import { AvailableProvider, ProviderEnum } from 'src/provider/provider.type';
import { WoltService } from 'src/provider/wolt/wolt.service';
import { BusinessInfoSelectBase } from './business.type';
import { ProviderDto } from './validation';

@Injectable()
export class BusinessService {
  private logger = new Logger(BusinessService.name);
  constructor(
    private utils: UtilsService,
    private sessionService: SessionService,
    private readonly apiKeyService: ApiKeyService,
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private woltService: WoltService,
    private eventEmitter: EventEmitter2,
    private orderingService: OrderingService,
  ) {}

  @Cron(CronExpression.MONDAY_TO_FRIDAY_AT_6AM)
  async syncBusinessFromOrdering() {
    const orderingApiKey = await this.getOrCreateOrderingApiKey();

    const orderingBusiness = await this.orderingService.getAllBusinessForAdmin(orderingApiKey);

    const formattedBusinessesData = plainToInstance(BusinessDto, orderingBusiness);

    await this.saveMultipleBusinessToDb(formattedBusinessesData);

    this.logger.log('Businesses synced');
  }

  private async getOrCreateOrderingApiKey(): Promise<string> {
    const apiKeyName = 'ORDERING_API_KEY';
    let apiKey: ApiKey | null = await this.prismaService.apiKey.findFirst({
      where: { name: apiKeyName },
    });

    if (!apiKey) {
      const apiKeyValue = this.configService.get<string>(apiKeyName);
      if (!apiKeyValue) {
        throw new Error(`${apiKeyName} is not set in the environment`);
      }

      try {
        // Create the API key
        await this.apiKeyService.createApiKey(apiKeyName, apiKeyValue);

        // Fetch the newly created API key
        apiKey = await this.prismaService.apiKey.findFirst({
          where: { name: apiKeyName },
        });

        if (!apiKey) {
          throw new Error('Failed to retrieve the newly created API key');
        }
      } catch (error: any) {
        this.logger.error(`Failed to create or retrieve API key: ${error.message}`);
        throw new Error(`Failed to create or retrieve API key: ${error.message}`);
      }
    }

    return apiKey.value;
  }

  async getAllBusiness(page: number, rowPerPage: number) {
    const businessSelectArgs = Prisma.validator<Prisma.BusinessSelect>()({
      publicId: true,
      name: true,
      owners: {
        select: {
          publicId: true,
          level: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      logo: true,
      email: true,
      phone: true,
      address: true,
      description: true,
      provider: {
        select: {
          provider: true,
        },
      },
    });

    const totalBusiness = await this.prismaService.business.count();

    const business = await this.findAllBusiness(businessSelectArgs, page, rowPerPage);

    return {
      data: business,
      total: totalBusiness,
    };
  }

  async upsertBusinessFromOrderingInfo<S extends Prisma.BusinessSelect>(
    businessInfo: OrderingBusiness,
    select: S,
  ): Promise<Prisma.BusinessGetPayload<{ select: S }>> {
    const data = Prisma.validator<Prisma.BusinessUncheckedCreateInput>()({
      name: businessInfo.name,
      logo: businessInfo.logo,
      orderingBusinessId: businessInfo.id.toString(),
      email: businessInfo.email,
      phone: businessInfo.phone,
      address: businessInfo.address,
      description: businessInfo.description,
      timeZone: businessInfo.timezone,
      enabled: businessInfo.enabled,
      open: businessInfo.open,
    });

    return await this.prismaService.business.upsert({
      where: {
        orderingBusinessId: businessInfo.id.toString(),
      },
      create: data,
      update: data,
      select,
    });
  }

  async getBusinessInSession(sessionPublicId: string) {
    const findSessionArgs = Prisma.validator<Prisma.SessionFindFirstArgs>()({
      select: {
        businesses: {
          select: {
            publicId: true,
            logo: true,
            email: true,
            phone: true,
            address: true,
            description: true,
            name: true,
            open: true,
            enabled: true,
            provider: {
              select: {
                provider: true,
              },
            },
          },
          orderBy: {
            id: 'desc',
          },
        },
      },
    });

    const session = await this.sessionService.getSessionByPublicId<
      Prisma.SessionGetPayload<typeof findSessionArgs>
    >(sessionPublicId, findSessionArgs);

    return session.businesses.map(({ publicId, provider, ...rest }) => {
      const formattedProvider = [
        ...provider.map((providerObject) => ({ ...providerObject.provider })),
      ];

      return { id: publicId, provider: formattedProvider, ...rest };
    });
  }

  async businessOwnershipService(orderingId: number): Promise<BusinessDto[]> {
    const accessToken = await this.sessionService.getOrderingAccessToken(orderingId);
    const response = await this.orderingService.getAllBusiness(accessToken);
    const mappedBusiness = plainToInstance(OrderingBusiness, response);
    const user = await this.userService.getUserInternally(orderingId, null);

    if (!user) {
      throw new ForbiddenException('Something wrong happend');
    }

    // Need to update each business into our db
    const selectInfo = { ...BusinessInfoSelectBase, owners: true };
    const businessDtos: BusinessDto[] = [];
    for (const business of mappedBusiness) {
      const existedBusiness = await this.upsertBusinessFromOrderingInfo(business, selectInfo);
      const owner = existedBusiness.owners.filter(
        (owner) => owner.orderingUserId === user.orderingUserId,
      );
      // If no ownership then add and update it to business
      if (owner.length < 1) {
        await this.updateBusinessOwners(business, user.orderingUserId);
      }

      // TODO: Need to remove if owner has been remove

      const convertData = { ...business, id: existedBusiness.publicId };

      businessDtos.push(plainToInstance(BusinessDto, convertData));
    }

    return businessDtos;
  }

  private async getBusinessProviders(businessId: number): Promise<
    (BusinessProviders & {
      provider: Provider;
    })[]
  > {
    const businessProviders = await this.prismaService.businessProviders.findMany({
      where: { orderingBusinessId: businessId.toString() },
      include: { provider: true },
    });
    return businessProviders;
  }

  async getOrderingBusiness(orderingUserId: number, publicBusinessId: string) {
    const accessToken = await this.sessionService.getOrderingAccessToken(orderingUserId);
    const business = await this.findBusinessByPublicId(publicBusinessId);
    if (!business) {
      throw new ForbiddenException(`we need this: ${publicBusinessId}`);
    }
    return await this.orderingService.getBusinessById(
      accessToken,
      business.orderingBusinessId.toString(),
    );
  }

  /**
   * This function is used to set status for today on or off
   *
   * This is used to set business is closed or not
   *
   * TODO: Now only handle for Munchi, maybe later need to do for Wolt and other
   *
   * @param orderingUserId
   * @param businessPublicId
   * @param status
   * @returns
   */
  async setOnlineStatusByPublicId(
    provider: AvailableProvider,
    userPublicId: string,
    businessPublicId: string,
    status: boolean,
    duration: number = undefined,
  ) {
    console.log('🚀 ~ BusinessService ~ duration:', duration);

    const user = await this.userService.getUserByPublicId(userPublicId);

    // Business data from ordering
    const orderingBusiness = await this.getOrderingBusiness(user.orderingUserId, businessPublicId);

    const businessProvider = await this.prismaService.businessProviders.findMany({
      where: {
        orderingBusinessId: orderingBusiness.id.toString(),
      },
      include: {
        provider: true,
      },
    });

    if (!businessProvider) {
      throw new BadRequestException('No provider found');
    }

    let scheduleOpenTime: Date;

    if (status === false) {
      if (!duration) {
        throw new BadRequestException('duration is required when set status is false');
      }

      scheduleOpenTime = moment.utc().add(duration, 'minutes').toDate();

      this.eventEmitter.emit('upsert_active_status_queue', {
        provider,
        businessPublicId,
        userPublicId,
        time: scheduleOpenTime,
      });
    } else {
      this.eventEmitter.emit('remove_active_status_queue', businessPublicId);
    }

    if (provider === ProviderEnum.Munchi) {
      await this.prismaService.business.update({
        where: {
          publicId: businessPublicId,
        },
        data: {
          open: status,
        },
      });

      const { schedule, timezone } = orderingBusiness;
      const numberOfToday = moment().tz(timezone).weekday();
      schedule[numberOfToday].enabled = status;
      const accessToken = await this.sessionService.getOrderingAccessToken(user.orderingUserId);
      const response = await this.orderingService.editBusiness(accessToken, orderingBusiness.id, {
        schedule: JSON.stringify(schedule),
      });

      // The response from edit business Ordering Co does not return today so I need to set it from schedule
      response.today = response.schedule[numberOfToday];

      return plainToInstance(BusinessDto, response);
    } else {
      const providerData = businessProvider.find(
        (businessProvider) => businessProvider.provider.name === provider,
      );

      if (!providerData) {
        throw new BadRequestException('No provider data found');
      }

      const { provider: providerInfo } = providerData;

      const localBusiness = await this.findBusinessByPublicId(businessPublicId);
      if (!orderingBusiness || !localBusiness) {
        throw new NotFoundException('Cannot find business to set today schedule');
      }

      await this.prismaService.provider.update({
        where: {
          id: providerInfo.id,
        },
        data: {
          open: status,
        },
      });
      console.log('🚀 ~ BusinessService ~ scheduleOpenTime line 320:', scheduleOpenTime);

      //send request to provider venue

      this.eventEmitter.emit(
        `${provider}.venueStatus`,
        providerInfo.id,
        status,
        !status ? scheduleOpenTime : null,
      );

      return {
        message: 'Success',
      };
    }
  }

  async getBusinessById(userId: number, publicBusinessId: string) {
    const business = await this.getOrderingBusiness(userId, publicBusinessId);
    return plainToInstance(BusinessDto, business);
  }

  async getBusinessTodayScheduleById(orderingUserId: number, publicBusinessId: string) {
    const business = await this.getOrderingBusiness(orderingUserId, publicBusinessId);
    return { today: business.today, timezone: business.timezone, name: business.name };
  }

  async findBusinessOwnedByOrderingUserId(orderingUserId: number) {
    const findUserInputArgs = Prisma.validator<Prisma.UserFindUniqueArgs>()({
      where: {
        orderingUserId: orderingUserId,
      },
      include: {
        businesses: {
          include: {
            provider: true,
          },
        },
      },
    });

    const userBusinesses = await this.prismaService.user.findUnique(findUserInputArgs);

    return userBusinesses.businesses;
  }

  async updateBusinessOwners(businsessData: any, orderingUserId: number) {
    return await this.prismaService.business.update({
      where: {
        orderingBusinessId: businsessData.id.toString(),
      },
      data: {
        owners: {
          connect: {
            orderingUserId,
          },
        },
      },
    });
  }

  async findBusinessByPublicId(publicBusinessId: string) {
    return await this.prismaService.business.findUnique({
      where: {
        publicId: publicBusinessId,
      },
      include: {
        provider: {
          include: {
            provider: true,
          },
        },
      },
    });
  }

  async findBusinessByPublicIdWithPayload<P extends Prisma.BusinessArgs>(
    publicBusinessId: string,
    getPayload: P,
  ) {
    const options = {
      where: {
        publicId: publicBusinessId,
      },
      ...getPayload,
    };

    return (await this.prismaService.business.findUnique(options)) as Prisma.BusinessGetPayload<P>;
  }

  async findBusinessByOrderingId<P extends Prisma.BusinessArgs>(
    orderingBusinessId: string,
    getPayload: P,
  ): Promise<Prisma.BusinessGetPayload<P>> {
    const options = {
      where: {
        orderingBusinessId,
      },
      ...getPayload,
    };

    return (await this.prismaService.business.findUnique(options)) as Prisma.BusinessGetPayload<P>;
  }

  async findBusinessByWoltVenueId(woltVenueId: string) {
    const provider = await this.prismaService.businessProviders.findUnique({
      where: {
        providerId: woltVenueId,
      },
      include: {
        business: true,
      },
    });
    if (!provider || !provider.business) {
      throw new NotFoundException('No business found');
    }
    return provider.business;
  }

  async getAssociateSessions(condition: Prisma.BusinessWhereInput): Promise<
    Prisma.BusinessGetPayload<{
      include: { sessions: true };
    }>[]
  > {
    return await this.prismaService.business.findMany({
      where: condition,
      include: { sessions: true },
    });
  }

  async findAllBusiness<S extends Prisma.BusinessSelect>(
    select: S,
    page: number,
    rowPerPage: number,
  ): Promise<Prisma.BusinessGetPayload<{ select: S }>[]> {
    return await this.prismaService.business.findMany({
      select,
      orderBy: {
        id: 'asc',
      },
      skip: page === 1 ? 0 : rowPerPage * (page - 1),
      take: rowPerPage,
    });
  }

  async addBusinessProvider(businessPublicId: string, data: ProviderDto) {
    const { providerId, providerName } = data;

    const business = await this.findBusinessByPublicId(businessPublicId);
    if (!business) {
      throw new NotFoundException("Business can't be found");
    }
    await this.createBusinessProvider(providerId, providerName);

    await this.createBusinessProviderCredentials(data, business);

    await this.connectBusinessProvider(providerId, business.orderingBusinessId);

    return {
      message: 'Added provider succesfully',
    };
  }

  async connectBusinessProvider(providerId: string, orderingBusinessId: string) {
    return await this.prismaService.businessProviders.create({
      data: {
        orderingBusinessId: orderingBusinessId,
        providerId: providerId,
      },
    });
  }

  async createBusinessProviderCredentials(data: ProviderDto, business: Business) {
    const { credentials, providerId, providerName, credentialName, type } = data;

    const credentialsInputArgs = Prisma.validator<Prisma.CredentialUncheckedCreateInput>()({
      name: credentialName,
      providerName: providerName,
      type: type,
      businessName: business.name,
      data: credentials,
      providers: {
        connect: {
          id: providerId,
        },
      },
    });

    return await this.prismaService.credential.create({
      data: credentialsInputArgs,
    });
  }

  async createBusinessProvider(providerId: string, providerName: string) {
    const providerCreateInputArgs = Prisma.validator<Prisma.ProviderCreateArgs>()({
      data: {
        id: providerId,
        name: providerName,
      },
    });

    return await this.prismaService.provider.create(providerCreateInputArgs);
  }

  async saveMultipleBusinessToDb(businesses: BusinessDto[]) {
    const businessesData = businesses.map((business: BusinessDto) => ({
      name: business.name,
      orderingBusinessId: business.id.toString(),
      address: business.address,
      description: business.description,
      email: business.email,
      logo: business.logo,
      phone: business.phone,
      timeZone: business.timeZone,
    }));

    await this.prismaService.business.createMany({
      data: businessesData,
      skipDuplicates: true,
    });
  }

  async findManyBusinessesByPublicId(businessPublicIds: string[]) {
    return await this.prismaService.business.findMany({
      where: {
        publicId: {
          in: businessPublicIds,
        },
      },
    });
  }
}
