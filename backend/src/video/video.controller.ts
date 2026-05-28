import { Body, Controller, Get, Param, Post, BadRequestException } from '@nestjs/common';
import { VideoService } from './video.service';

@Controller('api/video')
export class VideoController {
  constructor(private video: VideoService) {}

  // POST /api/video/generate  body: { prompt: string, image_url?: string, engine?: string, ... }
  // Pass through nguyen body de support image-to-video / engine selection cua Ecomdy
  @Post('generate')
  generate(@Body() body: Record<string, any>) {
    const prompt = body?.prompt;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new BadRequestException('Prompt is required');
    }
    return this.video.generate({ ...body, prompt: prompt.trim() });
  }

  // GET /api/video/jobs/:id
  @Get('jobs/:id')
  getJob(@Param('id') id: string) {
    return this.video.getJob(id);
  }
}
