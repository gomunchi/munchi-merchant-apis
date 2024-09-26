import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { OrderingService } from 'src/provider/ordering/ordering.service';

@Injectable()
export class TokenInterceptor implements NestInterceptor {
  constructor(private readonly orderingService: OrderingService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization;
    const user_id = request.headers['x-user-id'];

    if (!request) {
      throw new UnauthorizedException('Invalid request');
    }

    if (!authorizationHeader || !user_id) {
      throw new UnauthorizedException('Missing authorization header or user ID');
    }

    // Extract token from authorization header
    const orderingAccessToken = authorizationHeader.split(' ')[1];

    try {
      const { error, result } = await this.orderingService.getUser(orderingAccessToken, user_id);

      if (!error && result) {
        request.users = {
          access_token: orderingAccessToken,
          ...result,
        };
        return next.handle();
      }
      return next.handle();
    } catch (error) {
      throw new UnauthorizedException('Invalid token or user');
    }
  }
}
