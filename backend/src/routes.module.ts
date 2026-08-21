import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoutesController } from './presentation/controllers/routes.controller';
import { RoutesService } from './core/application/routes/routes.service';
import { Route, RouteSchema } from './infrastructure/database/mongoose/schemas/route.schema';
import { Duty, DutySchema } from './infrastructure/database/mongoose/schemas/duty.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Route.name, schema: RouteSchema },
      { name: Duty.name, schema: DutySchema }
    ])
  ],
  controllers: [RoutesController],
  providers: [RoutesService],
})
export class RoutesModule {}
