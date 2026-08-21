import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Route, RouteDocument } from '../../../infrastructure/database/mongoose/schemas/route.schema';
import { Duty, DutyDocument } from '../../../infrastructure/database/mongoose/schemas/duty.schema';

@Injectable()
export class RoutesService {
  constructor(
    @InjectModel(Route.name) private routeModel: Model<RouteDocument>,
    @InjectModel(Duty.name) private dutyModel: Model<DutyDocument>,
  ) {}

  async findAll() {
    const routes = await this.routeModel.find().exec();
    return routes.map(r => {
      const obj = r.toObject();
      obj.points.sort((a: any, b: any) => a.orderIdx - b.orderIdx);
      return obj;
    });
  }

  async findOne(id: string) {
    const route = await this.routeModel.findById(id).exec();
    if (!route) throw new NotFoundException('Route not found');

    const duties = await this.dutyModel.find({ routeId: id }).populate('vehicleId').exec();
    
    const obj = route.toObject();
    obj.points.sort((a: any, b: any) => a.orderIdx - b.orderIdx);
    
    // Map vehicleId to vehicle to match the frontend expectations
    const mappedDuties = duties.map(d => {
      const { vehicleId, ...rest } = d.toObject();
      return {
        ...rest,
        vehicle: vehicleId,
      };
    });

    return { ...obj, duties: mappedDuties };
  }

  async create(data: {
    name: string;
    points: { lat: number; lng: number; name?: string; orderIdx: number }[];
  }) {
    return this.routeModel.create({
      name: data.name,
      points: data.points,
    });
  }
}
