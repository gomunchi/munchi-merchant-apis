import { ForbiddenException, Injectable } from '@nestjs/common';
import moment from 'moment';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderId } from 'src/type';
import axios from 'axios';
import { OrderingIoService } from 'src/ordering.io/ordering.io.service';
import { forwardRef } from '@nestjs/common/utils';
import { Inject } from '@nestjs/common/decorators';
import Cryptr from 'cryptr';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { UserResponse } from 'src/auth/dto/auth.dto';
@Injectable()
export class UtilsService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => OrderingIoService))
    private orderingIo: OrderingIoService,
    private config: ConfigService,
  ) {}
  getEnvUrl(path: string, idParam?: string | number, queryParams?: Array<String>): string {
    let envUrl = `${process.env.BASE_URL}/${path}`;
    if (idParam === null || idParam === undefined) return envUrl;
    else envUrl = `${process.env.BASE_URL}/${path}/${idParam}`;
    return envUrl;
  }
  async getAccessToken(userId: number) {
    const sessionData = await this.prisma.session.findUnique({
      where: {
        userId: userId,
      },
    });
    const expiredAt = moment().add(sessionData.expiresIn, 'milliseconds').format('X');
    const now = moment().format('X');
    const userData = await this.prisma.user.findUnique({
      where: {
        userId: userId,
      },
    });

    if (expiredAt < now) {
      const decryptedPassword = this.getPassword(userData.hash, false);
      const email = userData.email;
      const options = {
        method: 'POST',
        url: this.getEnvUrl('auth'),
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        data: {
          email: email,
          password: decryptedPassword,
          security_recaptcha_auth: '0',
        },
      };
      try {
        const response = await axios.request(options);
        const signInResponseObject = response.data.result;
        const { access_token } = signInResponseObject.session;
        const token = await this.getSession(signInResponseObject.id, access_token);
        return token;
      } catch (error) {
        const errorMsg = error.response.data.result;
        throw new ForbiddenException(errorMsg);
      }
    }

    return sessionData.accessToken;
  }
  async getSession(userId: number, accessToken: string) {
    //get User infomation
    try {
      const updatedSession = await this.prisma.session.update({
        where: {
          userId: userId,
        },
        data: {
          accessToken: accessToken,
        },
      });
      return updatedSession.accessToken;
    } catch (error) {
      this.getError(error);
    }
  }

  async getUpdatedPublicId(publicUserId: string) {
    const newPublicUserId = this.getPublicId();
    const user = await this.prisma.user.update({
      where: {
        publicId: publicUserId,
      },
      data: {
        publicId: newPublicUserId,
      },
    });
    return 'Signed out successfully';
  }

  getPublicId() {
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

  getError(error: any) {
    if (error.response) {
      const errorMsg = error.response.data;
      throw new ForbiddenException(errorMsg);
    } else {
      console.log(error);
    }
  }

  async signToken(userId: number, email: string): Promise<{ verifyToken: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const secret = this.config.get('JWT_SECRET');
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '4h',
      secret: secret,
    });
    return {
      verifyToken: token,
    };
  }
}
