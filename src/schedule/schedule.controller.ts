import { Body, Controller, Get, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ReminderScheduleBodyData } from './validation/schedule.validation';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { ApiTags } from '@nestjs/swagger';

@Controller('schedule')
@ApiTags('Schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @UseGuards(JwtGuard)
  @Post('preorder-reminder')
  setPreOrderReminder(@Body(new ValidationPipe()) reminderData: ReminderScheduleBodyData) {
    return this.scheduleService.setPreOrderReminder(reminderData);
  }

  @UseGuards(JwtGuard)
  @Get('reminder')
  getReminer() {
    return this.scheduleService.getReminder();
  }
}
