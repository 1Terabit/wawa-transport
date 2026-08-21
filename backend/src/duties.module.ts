import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DutiesController } from './presentation/controllers/duties.controller';
import { DutiesService } from './core/application/duties/duties.service';
import { Duty, DutySchema } from './infrastructure/database/mongoose/schemas/duty.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Duty.name, schema: DutySchema }])],
  controllers: [DutiesController],
  providers: [DutiesService],
})
export class DutiesModule {}
