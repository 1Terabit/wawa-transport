import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @Post('suggest-vehicle')
  async suggestVehicle(@Body() body: { startTime: string; endTime: string }) {
    if (!body.startTime || !body.endTime) {
      throw new HttpException('Faltan fechas startTime o endTime', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.aiService.suggestVehicle(
        new Date(body.startTime),
        new Date(body.endTime)
      );
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Error en IA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
