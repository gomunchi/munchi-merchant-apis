import { Injectable } from '@nestjs/common';
import { SessionService } from 'src/auth/session.service';
import { OrderingService } from 'src/provider/ordering/ordering.service';

@Injectable()
export class CmsService {
  constructor(private sessionService: SessionService, private orderingService: OrderingService) {}
  async getPage(userId: number) {
    const accessToken = await this.sessionService.getOrderingAccessToken(userId);
    // getPage from ordering
    return await this.orderingService.getPage(accessToken);
    //return getPage to client
  }
}
