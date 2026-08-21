import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Duty, DutyDocument } from '../../../infrastructure/database/mongoose/schemas/duty.schema';
import { RedlockService } from '../../../infrastructure/redis/redlock.service';

@Injectable()
export class DutiesService {
  private readonly logger = new Logger(DutiesService.name);

  constructor(
    @InjectModel(Duty.name) private dutyModel: Model<DutyDocument>,
    private readonly redlockService: RedlockService,
  ) {}

  async assignDuty(
    vehicleId: string,
    routeId: string,
    startTime: Date,
    endTime: Date,
  ) {
    const resource = `lock:vehicle:${vehicleId}`;
    const ttl = 5000; // 5 seconds lock

    let lock;
    try {
      // 1. Acquire distributed lock using Redis
      lock = await this.redlockService.redlock.acquire([resource], ttl);
      
      // 2. Critical Section: Check for overlapping duties in MongoDB
      const overlapping = await this.dutyModel.findOne({
        vehicleId,
        $and: [
          { startTime: { $lt: endTime } },
          { endTime: { $gt: startTime } },
        ],
      }).exec();

      if (overlapping) {
        throw new ConflictException(
          'The vehicle already has an overlapping duty in this time window',
        );
      }

      // 3. Create the duty
      return await this.dutyModel.create({
        vehicleId,
        routeId,
        startTime,
        endTime,
      });

    } catch (error) {
      if (error.name === 'ExecutionError') {
        // Redlock could not acquire the lock (another process holds it)
        this.logger.warn(`Could not acquire lock for vehicle ${vehicleId}`);
        throw new ConflictException('Vehicle assignment is currently locked. Try again.');
      }
      throw error;
    } finally {
      if (lock) {
        // 4. Release the lock
        await lock.release().catch((err: any) => {
          this.logger.error(`Failed to release lock for vehicle ${vehicleId}`, err);
        });
      }
    }
  }

  async findAll() {
    const duties = await this.dutyModel.find()
      .populate('vehicleId')
      .populate('routeId')
      .exec();

    return duties.map(d => {
      const { vehicleId, routeId, ...rest } = d.toObject();
      return {
        ...rest,
        vehicle: vehicleId,
        route: routeId,
      };
    });
  }
}
