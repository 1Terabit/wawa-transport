import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VehiclesService } from '../../core/application/vehicles/vehicles.service';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'List all vehicles' })
  @ApiResponse({ status: 200, description: 'Returns an array of vehicles' })
  async getAllVehicles() {
    return this.vehiclesService.getAllVehicles();
  }
}
