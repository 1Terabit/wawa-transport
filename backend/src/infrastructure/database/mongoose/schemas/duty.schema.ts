import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Route } from './route.schema';
import { Vehicle } from './vehicle.schema';

export type DutyDocument = HydratedDocument<Duty>;

const transformConfig = {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
};

@Schema({ timestamps: true, toJSON: transformConfig, toObject: transformConfig })
export class Duty {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ type: String, ref: 'Route', required: true })
  routeId: string;

  @Prop({ type: String, ref: 'Vehicle', required: true })
  vehicleId: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;
}

export const DutySchema = SchemaFactory.createForClass(Duty);
