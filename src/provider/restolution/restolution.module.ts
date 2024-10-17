import { Module } from '@nestjs/common';
import { RestolutionService } from './restolution.service';
import { RestolutionController } from './restolution.controller';

@Module({
  imports: [],
  controllers: [RestolutionController],
  providers: [RestolutionService],
})
export class RestolutionModule {}
