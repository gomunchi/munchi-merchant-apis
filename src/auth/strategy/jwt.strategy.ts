import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SessionService } from 'src/auth/session.service';
import { UserService } from 'src/user/user.service';
import { JwtTokenPayload } from '../session.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    config: ConfigService,
    private userService: UserService,
    private sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtTokenPayload) {
    this.logger.debug(`Validating JWT payload: ${JSON.stringify(payload)}`);

    const user = await this.userService.getUserByPublicId(payload.userPublicId);

    if (!user) {
      this.logger.warn(`User not found for publicId: ${payload.userPublicId}`);
      throw new ForbiddenException('Cannot find user from jwt token');
    }

    this.logger.debug(`User found: ${JSON.stringify(user)}`);

    // Update access time for session
    try {
      await this.sessionService.updateAccessTime(payload.sessionPublicId);
      this.logger.debug(`Session access time updated for sessionId: ${payload.sessionPublicId}`);
    } catch (error) {
      this.logger.error(`Error updating session access time: ${JSON.stringify(error)}`);
      // Consider whether you want to throw this error or handle it differently
      throw error;
    }

    return { ...payload, ...user };
  }
}
