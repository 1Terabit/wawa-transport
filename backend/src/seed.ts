import 'dotenv/config';
import * as mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { VehicleSchema } from './infrastructure/database/mongoose/schemas/vehicle.schema';
import { RouteSchema } from './infrastructure/database/mongoose/schemas/route.schema';
import { DutySchema } from './infrastructure/database/mongoose/schemas/duty.schema';

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wawa-transport';
  await mongoose.connect(uri);

  const Vehicle = mongoose.model('Vehicle', VehicleSchema);
  const Route = mongoose.model('Route', RouteSchema);
  const Duty = mongoose.model('Duty', DutySchema);

  // Clear existing data
  await Vehicle.deleteMany({});
  await Route.deleteMany({});
  await Duty.deleteMany({});

  // Seed Vehicle
  const v1 = await Vehicle.create({
    _id: uuidv4(),
    plate: 'WAWA-001',
    latitude: -34.6037,
    longitude: -58.3816,
  });
  console.log(`✅ Vehicle created: ${v1.plate}`);

  // Seed Route
  const r1 = await Route.create({
    _id: uuidv4(),
    name: 'Ruta Obelisco - Puerto Madero',
    points: [
      { _id: uuidv4(), lat: -34.6037, lng: -58.3816, name: 'Obelisco', orderIdx: 0 },
      { _id: uuidv4(), lat: -34.6025, lng: -58.3735, name: 'Av. Corrientes y Florida', orderIdx: 1 },
      { _id: uuidv4(), lat: -34.6053, lng: -58.3662, name: 'Puerto Madero (Tierra)', orderIdx: 2 },
    ]
  });
  console.log(`✅ Route created: ${r1.name}`);

  // Seed Duty
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 1000 * 60 * 60 * 2); // 2 hours
  await Duty.create({
    _id: uuidv4(),
    routeId: r1._id,
    vehicleId: v1._id,
    startTime,
    endTime,
  });
  console.log(`✅ Duty assigned for ${v1.plate}`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
