import { Body, Controller, Get, Param, Post, BadRequestException } from '@nestjs/common';
import { VideoService } from './video.service';

@Controller('api/video')
export class VideoController {
  constructor(private video: VideoService) {}

  // POST /api/video/generate  body: { prompt: string }
  @Post('generate')
  generate(@Body('prompt') prompt: string) {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new BadRequestException('Prompt khong duoc rong');
    }
    return this.video.generate(prompt.trim());
  }

  // GET /api/video/jobs/:id
  @Get('jobs/:id')
  getJob(@Param('id') id: string) {
    return this.video.getJob(id);
  }
}
