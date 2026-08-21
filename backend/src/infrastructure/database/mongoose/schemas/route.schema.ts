import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type RouteDocument = HydratedDocument<Route>;

const transformConfig = {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
};

@Schema({ toJSON: transformConfig, toObject: transformConfig })
export class Point {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;

  @Prop({ required: false })
  name?: string;

  @Prop({ required: true })
  orderIdx: number;
}
export const PointSchema = SchemaFactory.createForClass(Point);

@Schema({ timestamps: true, toJSON: transformConfig, toObject: transformConfig })
export class Route {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [PointSchema], default: [] })
  points: Point[];
}

export const RouteSchema = SchemaFactory.createForClass(Route);
