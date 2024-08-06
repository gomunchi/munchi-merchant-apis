import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { CmsService } from './cms.service';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { SessionService } from 'src/auth/session.service';

@UseGuards(JwtGuard)
@Controller('cms')
export class CmsController {
  constructor(private cmsService: CmsService, private sessionService: SessionService) {}

  @Get('getPage')
  async getPage(@Request() req: any) {
    const { sessionPublicId } = req.user;
    const user = await this.sessionService.getSessionUserBySessionPublicId(sessionPublicId);
    return this.cmsService.getPage(user.orderingUserId);
  }
}
