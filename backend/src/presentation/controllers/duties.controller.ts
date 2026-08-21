import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DutiesService } from '../../core/application/duties/duties.service';

@ApiTags('Duties')
@Controller('duties')
export class DutiesController {
  constructor(private readonly dutiesService: DutiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all duties' })
  async findAll() {
    return this.dutiesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Assign a new duty' })
  async assign(
    @Body()
    body: {
      vehicleId: string;
      routeId: string;
      startTime: string;
      endTime: string;
    },
  ) {
    return this.dutiesService.assignDuty(
      body.vehicleId,
      body.routeId,
      new Date(body.startTime),
      new Date(body.endTime),
    );
  }
}
