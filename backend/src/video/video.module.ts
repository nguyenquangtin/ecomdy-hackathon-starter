import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';

@Module({
  imports: [HttpModule],
  controllers: [VideoController],
  providers: [VideoService],
})
export class VideoModule {}
