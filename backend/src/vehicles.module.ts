import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VehiclesController } from './presentation/controllers/vehicles.controller';
import { VehiclesService } from './core/application/vehicles/vehicles.service';
import { Vehicle, VehicleSchema } from './infrastructure/database/mongoose/schemas/vehicle.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Vehicle.name, schema: VehicleSchema }])],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}
