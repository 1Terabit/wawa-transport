import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vehicle, VehicleDocument } from '../../../infrastructure/database/mongoose/schemas/vehicle.schema';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
  ) {}

  async getAllVehicles() {
    const vehicles = await this.vehicleModel.find().exec();
    return vehicles.map(v => v.toObject());
  }
}
