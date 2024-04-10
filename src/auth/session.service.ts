import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import moment from 'moment';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderingService } from 'src/provider/ordering/ordering.service';
import { ReportAppBusinessDto } from 'src/report/dto/report.dto';
import { AuthCredentials } from 'src/type';
import { UserService } from 'src/user/user.service';
import { UtilsService } from 'src/utils/utils.service';
import { JwtTokenPayload } from './session.type';

@Injectable()
export class SessionService {
  constructor(
    @Inject(forwardRef(() => UtilsService)) readonly utils: UtilsService,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
    @Inject(forwardRef(() => OrderingService))
    private readonly orderingService: OrderingService,
    private readonly jwt: JwtService,
    private config: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async hashData(data: string) {
    return argon2.hash(data);
  }

  async updateOrderingAccessToken(credentials: AuthCredentials) {
    const orderingUserInfo = await this.orderingService.signIn(credentials);

    const userSelect = Prisma.validator<Prisma.UserSelect>()({
      id: true,
    });

    await this.userService.upsertUserFromOrderingInfo<typeof userSelect>(
      { ...orderingUserInfo, password: credentials.password },
      userSelect,
    );
  }

  /**
   * * Has checked
   *
   * @param refreshToken
   * @param sessionPublicId
   * @returns
   */
  async refreshTokens(refreshToken: string, sessionPublicId: string) {
    const findSessionArgs = Prisma.validator<Prisma.SessionFindFirstArgsBase>()({
      select: {
        id: true,
        refreshToken: true,
        user: {
          select: {
            id: true,
            orderingUserId: true,
            publicId: true,
            email: true,
          },
        },
      },
    });

    const session = await this.getSessionByPublicId<
      Prisma.SessionGetPayload<typeof findSessionArgs>
    >(sessionPublicId, findSessionArgs);
    const { user } = session;

    if (!user || !session || !session.refreshToken) {
      throw new ForbiddenException('Access Denied');
    }

    const refreshTokenMatches = await argon2.verify(session.refreshToken, refreshToken);

    if (!refreshTokenMatches) {
      throw new ForbiddenException('Invalid Token');
    }

    const jwtPayload: JwtTokenPayload = {
      userPublicId: user.publicId,
      email: user.email,
      sessionPublicId: sessionPublicId,
    };

    const token = await this.getTokens(jwtPayload);

    // Update refresh token back to session
    await this.prismaService.session.update({
      where: {
        publicId: sessionPublicId,
      },
      data: {
        refreshToken: await this.hashData(token.refreshToken),
        lastAccessTs: moment.utc().toDate(),
      },
    });

    return token;
  }

  async generateJwtToken(payload: JwtTokenPayload): Promise<string> {
    const secret = this.config.get('JWT_SECRET');
    const tokenTimeToLive = this.config.get('JWT_SECRET_TTL');

    return await this.jwt.signAsync(payload, {
      expiresIn: tokenTimeToLive,
      secret: secret,
    });
  }

  async generateRefreshToken(payload: JwtTokenPayload): Promise<string> {
    const refreshSecret = this.config.get('JWT_REFRESH_SECRET');
    const refreshTokenTimeToLive = this.config.get('JWT_REFRESH_TTL');

    return await this.jwt.signAsync(payload, {
      expiresIn: refreshTokenTimeToLive,
      secret: refreshSecret,
    });
  }

  async getTokens(
    payload: JwtTokenPayload,
  ): Promise<{ verifyToken: string; refreshToken: string }> {
    return {
      verifyToken: await this.generateJwtToken(payload),
      refreshToken: await this.generateRefreshToken(payload),
    };
  }

  async createSession<
    I extends Prisma.SessionCreateInput | Prisma.SessionUncheckedCreateInput,
    S extends Prisma.SessionSelect,
  >(createInput: I, select: S) {
    createInput.refreshToken = await this.hashData(createInput.refreshToken);

    return await this.prismaService.session.create({
      data: createInput,
      select,
    });
  }

  async getSessionByPublicId<T>(publicId: string, args?): Promise<T> {
    let findArgs: Prisma.SessionFindUniqueArgsBase = {
      where: {
        publicId: publicId,
      },
    };
    if (args) {
      findArgs = { ...findArgs, ...args };
    }

    const session = (await this.prismaService.session.findUnique(findArgs)) as T;
    if (!session) {
      throw new NotFoundException('No user found');
    }

    return session;
  }

  async deleteSession(where: Prisma.SessionWhereInput) {
    await this.prismaService.session.deleteMany({
      where,
    });
  }

  async getSessionUserBySessionPublicId(sessionPublicId: string) {
    const select = Prisma.validator<Prisma.SessionSelect>()({
      user: {
        select: {
          orderingUserId: true,
          publicId: true,
        },
      },
    });

    const session = await this.prismaService.session.findFirst({
      where: {
        publicId: sessionPublicId,
      },
      select,
    });

    return session.user;
  }

  async getSessionByDeviceId(deviceId: string) {
    return await this.prismaService.session.findMany({
      where: {
        deviceId,
      },
    });
  }

  async getOfflineSession() {
    return await this.prismaService.session.findMany({
      where: {
        isOnline: false,
      },
      select: {
        id: true,
        deviceId: true,
        businesses: {
          select: {
            publicId: true,
            orderingBusinessId: true,
          },
        },
        user: {
          select: {
            id: true,
            orderingUserId: true,
          },
        },
      },
    });
  }

  async incrementOpenAppNotificationCount(sessionIds: number[]) {
    await this.prismaService.session.updateMany({
      where: {
        id: {
          in: sessionIds,
        },
      },
      data: {
        openAppNotificationCount: {
          increment: 1,
        },
      },
    });
  }

  async getSessionToEmitUpdateAppState() {
    return await this.prismaService.session.findMany({
      where: {
        openAppNotificationCount: {
          gte: 2,
        },
      },
    });
  }

  async setOpenAppNotificationSending(status: boolean, sessionIds: number[]) {
    await this.prismaService.session.updateMany({
      where: {
        isOnline: false,
        id: {
          in: sessionIds,
        },
      },
      data: {
        openAppNotifcationSending: status,
      },
    });
  }

  async updateAccessTime(sessionPublicId: string) {
    await this.prismaService.session.update({
      where: {
        publicId: sessionPublicId,
      },
      data: {
        lastAccessTs: moment.utc().toDate(),
      },
    });
  }

  async setSessionOnlineStatus(sessionPublicId: string, isOnline: boolean) {
    // TODO: Create general type instead of create seperately
    const findSessionArgs = Prisma.validator<Prisma.SessionFindFirstArgsBase>()({
      select: {
        id: true,
        publicId: true,
        openAppNotificationCount: true,
      },
    });

    const session = await this.getSessionByPublicId<
      Prisma.SessionGetPayload<typeof findSessionArgs>
    >(sessionPublicId, findSessionArgs);

    if (!session) {
      throw new NotFoundException('Cannot find session by public Id');
    }

    const data: Prisma.SessionUpdateInput = {
      isOnline,
    };

    data.openAppNotificationCount = isOnline ? 0 : session.openAppNotificationCount + 1;

    await this.prismaService.session.update({
      where: {
        publicId: sessionPublicId,
      },
      data,
    });
  }

  async setBusinessForSession(
    sessionPublicId: string,
    reportAppBusinessDto: ReportAppBusinessDto,
  ): Promise<void> {
    // TODO: Create general type instead of create seperately
    const findSessionArgs = Prisma.validator<Prisma.SessionFindFirstArgsBase>()({
      select: {
        id: true,
        refreshToken: true,
        deviceId: true,
        user: {
          select: {
            id: true,
            orderingUserId: true,
            publicId: true,
            email: true,
            businesses: true,
          },
        },
      },
    });
    const session = await this.getSessionByPublicId<
      Prisma.SessionGetPayload<typeof findSessionArgs>
    >(sessionPublicId, findSessionArgs);
    if (!session) {
      throw new NotFoundException('Cannot find session by public Id');
    }

    const { user } = session;

    const { businesses } = user;
    const { businessIds, deviceId } = reportAppBusinessDto;

    const validIds = businesses
      .filter((business) => businessIds.includes(business.publicId))
      .map<{ publicId: string }>((validBusiness) => ({
        publicId: validBusiness.publicId,
      }));

    if (validIds.length !== businessIds.length) {
      throw new ForbiddenException('Cannot assign business not owned by user');
    }

    // Disconnect all
    await this.prismaService.session.update({
      where: {
        publicId: sessionPublicId,
      },
      data: {
        businesses: {
          set: [],
        },
      },
    });

    const sessions = await this.getSessionByDeviceId(deviceId);

    const invalidSessionIds = [];
    sessions.forEach((session) => {
      if (session.publicId === sessionPublicId) {
        return true;
      }

      invalidSessionIds.push(session.id);
    });

    // Remove other sessions which has same deviceId
    if (invalidSessionIds.length > 0) {
      await this.prismaService.session.deleteMany({
        where: {
          id: {
            in: invalidSessionIds,
          },
        },
      });
    }

    const data: Prisma.SessionUpdateInput = {
      businesses: {
        connect: validIds,
      },
    };

    /**
     * Normally we need to update deviceId for session
     * but for some reason there is session has deviceId
     * already so we need to check if session has or not
     */
    if (!session.deviceId) {
      data.deviceId = deviceId;
    }

    // Reconnect
    await this.prismaService.session.update({
      where: {
        publicId: sessionPublicId,
      },
      data,
    });
  }

  async getAllUserSession(page: number, row: number) {
    const sessionSelectArgs = Prisma.validator<Prisma.UserSelect>()({
      publicId: true,
      firstName: true,
      lastName: true,
      email: true,

      businesses: {
        select: {
          publicId: true,
          logo: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      sessions: {
        select: {
          publicId: true,
          isOnline: true,
          openAppNotifcationSending: true,
          lastAccessTs: true,
        },
        orderBy: {
          lastAccessTs: 'desc',
        },
      },
    });

    const users = await this.prismaService.user.findMany();

    const userPerPage = await this.prismaService.user.findMany({
      orderBy: {
        id: 'asc',
      },
      skip: page === 1 ? 0 : row * (page - 1),
      take: row,
      select: sessionSelectArgs,
    });

    return {
      data: userPerPage,
      total: users.length,
    };
  }

  async getSessionByPublicUserId(publicUserId: string, page: number, row: number) {
    const userSelectArgs = Prisma.validator<Prisma.UserSelect>()({
      sessions: {
        select: {
          publicId: true,
          isOnline: true,
          openAppNotifcationSending: true,
          lastAccessTs: true,
        },
        orderBy: {
          lastAccessTs: 'desc',
        },
        skip: page === 1 ? 0 : row * (page - 1),
        take: row,
      },
    });

    const totalSession = await this.prismaService.session.findMany({
      where: {
        user: {
          publicId: publicUserId,
        },
      },
    });

    const { sessions } = await this.prismaService.user.findUnique({
      where: {
        publicId: publicUserId,
      },
      select: userSelectArgs,
    });

    return {
      data: sessions,
      total: totalSession.length,
    };
  }

  async deleteUserSessions(publicUserId: string, sessionPublicId: string[]) {
    await this.userService.validateUser(publicUserId);

    await this.prismaService.session.deleteMany({
      where: {
        publicId: {
          in: sessionPublicId,
        },
      },
    });

    return 'Delete sessions successfully';
  }
}
