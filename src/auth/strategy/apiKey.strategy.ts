import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { ApiKeyService } from '../apiKey.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, 'api-key') {
  constructor(private apiKeyService: ApiKeyService) {
    super({ header: 'apiKey', prefix: '' }, true, async (apikey, done, req) => {
      const checkKey = await this.apiKeyService.validateApiKey(apikey);
      if (checkKey) {
        return done(null, true);
      }
      return done(new UnauthorizedException(), null);
    });
  }
}
