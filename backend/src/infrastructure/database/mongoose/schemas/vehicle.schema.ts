import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type VehicleDocument = HydratedDocument<Vehicle>;

const transformConfig = {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
};

@Schema({ timestamps: true, toJSON: transformConfig, toObject: transformConfig })
export class Vehicle {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ required: true, unique: true })
  plate: string;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
