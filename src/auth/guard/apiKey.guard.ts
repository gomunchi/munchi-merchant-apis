import { AuthGuard } from '@nestjs/passport';
export class ApiKeyGuard extends AuthGuard('api-key') {
  constructor() {
    super();
  }
}
