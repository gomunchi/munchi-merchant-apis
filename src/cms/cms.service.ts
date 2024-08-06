import { Injectable } from '@nestjs/common';
import { OrderingService } from 'src/provider/ordering/ordering.service';

import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class CmsService {
  constructor(private utils: UtilsService, private orderingService: OrderingService) {}
  async getPage(userId: number) {
    const accessToken = await this.utils.getOrderingAccessToken(userId);
    // getPage from ordering
    return await this.orderingService.getPage(accessToken);
    //return getPage to client
  }
}
