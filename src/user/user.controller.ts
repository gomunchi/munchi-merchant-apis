import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard/jwt.guard';

@Controller('user')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuard)
export class UserController {}
