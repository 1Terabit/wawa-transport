import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Vehicle, VehicleSchema } from '../../../infrastructure/database/mongoose/schemas/vehicle.schema';
import { Duty, DutySchema } from '../../../infrastructure/database/mongoose/schemas/duty.schema';
import { Route, RouteSchema } from '../../../infrastructure/database/mongoose/schemas/route.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
      { name: Duty.name, schema: DutySchema },
      { name: Route.name, schema: RouteSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule { }
