import { ForbiddenException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/user/user.service';
import { JwtTokenPayload } from '../session.type';
import { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService, private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtTokenPayload) {
    const selectInfo = Prisma.validator<Prisma.UserSelect>()({
      id: true,
      orderingUserId: true,
    });

    const user = await this.userService.getUserByPublicId<typeof selectInfo>(
      payload.userPublicId,
      selectInfo,
    );

    if (!user) {
      throw new ForbiddenException('Cannot find user from refresh token');
    }

    const refreshToken = req.get('Authorization').replace('Bearer', '').trim();

    return { ...user, refreshToken, ...payload };
  }
}
