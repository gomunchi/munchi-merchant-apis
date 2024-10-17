import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import moment from 'moment';
import { UserResponse } from 'src/auth/dto/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderingService } from 'src/provider/ordering/ordering.service';
import { AuthCredentials } from 'src/type';
import { UserService } from 'src/user/user.service';
import { UtilsService } from 'src/utils/utils.service';
import { SessionService } from './session.service';
import { JwtTokenPayload } from './session.type';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService)) private user: UserService,
    @Inject(forwardRef(() => OrderingService)) private readonly orderingService: OrderingService,
    @Inject(forwardRef(() => UtilsService)) readonly utils: UtilsService,
    private readonly sessionService: SessionService,
  ) {}

  async signIn(credentials: AuthCredentials) {
    const orderingUserInfo = await this.orderingService.signIn(credentials);

    const userSelect = Prisma.validator<Prisma.UserSelect>()({
      id: true,
      publicId: true,
      firstName: true,
      lastName: true,
      email: true,
      level: true,
      businesses: {
        select: {
          publicId: true,
          name: true,
        },
      },
    });

    // Upsert user to database
    const user = await this.user.upsertUserFromOrderingInfo<typeof userSelect>(
      { ...orderingUserInfo, password: credentials.password },
      userSelect,
    );

    const sessionPublicId = this.utils.generatePublicId();
    const jwtPayload: JwtTokenPayload = {
      userPublicId: user.publicId,
      email: user.email,
      sessionPublicId: sessionPublicId,
    };

    // Generate JwtToken and RefreshToken
    const tokens = await this.sessionService.getTokens(jwtPayload);

    const sessionData = Prisma.validator<Prisma.SessionUncheckedCreateInput>()({
      publicId: sessionPublicId,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      lastAccessTs: moment.utc().toDate(),
    });

    const sessionSelect = Prisma.validator<Prisma.SessionSelect>()({
      publicId: true,
    });

    // Create new session for user
    await this.sessionService.createSession(sessionData, sessionSelect);

    return new UserResponse(
      user.email,
      user.firstName,
      user.lastName,
      user.level,
      user.publicId,
      tokens.verifyToken,
      tokens.refreshToken,
    );
  }

  /**
   * * Have checked
   *
   * @param sessionPublicId
   */
  async signOut(sessionPublicId: string) {
    const findSessionArgs = Prisma.validator<Prisma.SessionFindFirstArgs>()({
      select: {
        id: true,
        refreshToken: true,
        user: {
          select: {
            orderingUserId: true,
          },
        },
      },
    });

    const session = await this.sessionService.getSessionByPublicId<
      Prisma.SessionGetPayload<typeof findSessionArgs>
    >(sessionPublicId, findSessionArgs);

    const accessToken = await this.sessionService.getOrderingAccessToken(
      session.user.orderingUserId,
    );
    await this.orderingService.signOut(accessToken);
    await this.sessionService.deleteSession({
      publicId: sessionPublicId,
    });

    return { message: 'Logout successfully' };
  }
}
