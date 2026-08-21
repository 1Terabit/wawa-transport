import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RoutesService } from '../../core/application/routes/routes.service';

@ApiTags('Routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @ApiOperation({ summary: 'List all routes' })
  async findAll() {
    return this.routesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get route details with points and duties' })
  async findOne(@Param('id') id: string) {
    return this.routesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new route' })
  async create(@Body() body: any) {
    return this.routesService.create(body);
  }
}
