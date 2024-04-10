/* eslint-disable prettier/prettier */
import { ForbiddenException, Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import Cryptr from 'cryptr';
import moment from 'moment';
import { SessionService } from 'src/auth/session.service';
import { OrderingService } from 'src/provider/ordering/ordering.service';
import { UserService } from 'src/user/user.service';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class UtilsService {
  private readonly logger = new Logger(UtilsService.name);

  constructor(
    @Inject(forwardRef(() => SessionService)) private readonly sessionService: SessionService,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    @Inject(forwardRef(() => OrderingService)) private readonly orderingService: OrderingService,
    private config: ConfigService,
  ) {}

  // TODO: Need to change the name, seem it now only work for ordering co service
  getEnvUrl(path: string, idParam?: string | number, queryParams?: Array<string>): string {
    let envUrl = `${process.env.BASE_URL}/${path}`;
    if (idParam === null || idParam === undefined) return envUrl;
    else envUrl = `${process.env.BASE_URL}/${path}/${idParam}`;
    return envUrl;
  }

  /**
   * Get access token from user table
   *
   * @param publicUserId
   * @returns
   */
  async getOrderingAccessToken(orderingUserId: number) {
    const selectArg = Prisma.validator<Prisma.UserSelect>()({
      hash: true,
      orderingAccessTokenExpiredAt: true,
      orderingAccessToken: true,
      email: true,
      orderingUserId: true,
    });

    let user = await this.userService.getUserByOrderingUserId<typeof selectArg>(
      orderingUserId,
      selectArg,
    );

    if (!user) {
      throw new ForbiddenException('Access Denied');
    }

    const decryptedPassword = this.getPassword(user.hash, false);

    try {
      // Try to use accesstoken to get user key if no success, login again for new token
      await this.orderingService.getUserKey(user.orderingAccessToken, user.orderingUserId);
    } catch (error) {
      try {
        await this.sessionService.updateOrderingAccessToken({
          email: user.email,
          password: decryptedPassword,
        });
        user = await this.userService.getUserByOrderingUserId<typeof selectArg>(
          orderingUserId,
          selectArg,
        );
      } catch (error) {
        this.logError(error);
      }
    }

    return user.orderingAccessToken;
  }

  generatePublicId() {
    const publicId = uuidv4();
    return publicId;
  }

  getPassword(password: string, needCrypt: boolean) {
    const cryptr = new Cryptr(this.config.get('HASH_SECRET'));
    let passwordAfter: string;
    if (needCrypt) {
      passwordAfter = cryptr.encrypt(password);
    } else {
      passwordAfter = cryptr.decrypt(password);
    }
    return passwordAfter;
  }

  logError(error: any) {
    this.logger.error(error);
    if (error.response) {
      const errorMsg = error.response.data;
      throw new ForbiddenException(errorMsg);
    } else {
      throw new ForbiddenException(error);
    }
  }

  convertTimeToTimeZone(utcTime: string, targetTimeZone: string): string {
    const allTimeZones = moment.tz.names();

    // Check if the target timezone is valid
    if (allTimeZones.includes(targetTimeZone)) {
      const convertedTime = moment(utcTime).tz(targetTimeZone).toISOString(true);

      return convertedTime;
    }
    return null;
  }
}
