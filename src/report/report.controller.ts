// report/report.controller.ts

import { Body, Controller, Post, UseGuards, Request, Logger } from '@nestjs/common';
import { ReportAppBusinessDto, ReportAppStateDto } from './dto/report.dto';
import { NotificationService } from '../notification/notification.service'; // Adjust the import path based on your file structure
import { AppState } from './report.type';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { SessionService } from 'src/auth/session.service';

@ApiTags('Report')
@Controller('report')
export class ReportController {
  private readonly logger = new Logger(ReportController.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly sessionService: SessionService,
  ) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtGuard)
  @Post('app-state')
  async reportAppState(@Body() reportAppStateDto: ReportAppStateDto, @Request() req: any) {
    const { sessionPublicId } = req.user;

    const isOnline = reportAppStateDto.state !== AppState.BACKGROUND;
    await this.sessionService.setSessionOnlineStatus(sessionPublicId, isOnline);

    return { message: 'App state reported successfully' };
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtGuard)
  @Post('app-business')
  async reportSelectedBusiness(
    @Body() reportAppBusinessDto: ReportAppBusinessDto,
    @Request() req: any,
  ) {
    const { sessionPublicId } = req.user;
    await this.sessionService.setBusinessForSession(sessionPublicId, reportAppBusinessDto);
    return { message: 'App businesses reported successfully' };
  }
}
