import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UtilsService } from 'src/utils/utils.service';
import { SessionDto } from './dto/session.dto';
import { UserService } from 'src/user/user.service';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthCredentials } from 'src/type';
import { OrderingIoService } from 'src/ordering.io/ordering.io.service';
import { Prisma } from '@prisma/client';
import { JwtTokenPayload } from './session.type';
import { ReportAppBusinessDto } from 'src/report/dto/report.dto';
import moment from 'moment';

@Injectable()
export class SessionService {
  constructor(
    @Inject(forwardRef(() => AuthService)) private authService: AuthService,
    @Inject(forwardRef(() => UtilsService)) readonly utils: UtilsService,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
    @Inject(forwardRef(() => OrderingIoService))
    private readonly orderingIo: OrderingIoService,
    private readonly jwt: JwtService,
    private config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async hashData(data: string) {
    return argon2.hash(data);
  }

  async updateOrderingIoAccessToken(credentials: AuthCredentials) {
    const orderingUserInfo = await this.orderingIo.signIn(credentials);

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

    const session = await this.getSessionByPublcId<
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
    await this.prisma.session.update({
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

    return await this.prisma.session.create({
      data: createInput,
      select,
    });
  }

  async getSessionByPublcId<T>(publicId: string, args?): Promise<T> {
    let findArgs: Prisma.SessionFindUniqueArgsBase = {
      where: {
        publicId: publicId,
      },
    };

    if (args) {
      findArgs = { ...findArgs, ...args };
    }

    return (await this.prisma.session.findUnique(findArgs)) as T;
  }

  async deleteSession(where: Prisma.SessionWhereInput) {
    await this.prisma.session.deleteMany({
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

    const session = await this.prisma.session.findFirst({
      where: {
        publicId: sessionPublicId,
      },
      select,
    });

    return session.user;
  }

  async getOfflineSession() {
    return await this.prisma.session.findMany({
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
          },
        },
      },
    });
  }

  async updateAccessTime(sessionPublicId: string) {
    await this.prisma.session.update({
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
      },
    });

    const session = await this.getSessionByPublcId<
      Prisma.SessionGetPayload<typeof findSessionArgs>
    >(sessionPublicId, findSessionArgs);

    if (!session) {
      throw new NotFoundException('Cannot find session by public Id');
    }

    await this.prisma.session.update({
      where: {
        publicId: sessionPublicId,
      },
      data: {
        isOnline,
      },
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
    const session = await this.getSessionByPublcId<
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
    await this.prisma.session.update({
      where: {
        publicId: sessionPublicId,
      },
      data: {
        businesses: {
          set: [],
        },
      },
    });

    // Reconnect
    await this.prisma.session.update({
      where: {
        publicId: sessionPublicId,
      },
      data: {
        businesses: {
          connect: validIds,
        },
        deviceId: deviceId,
      },
    });
  }
}
