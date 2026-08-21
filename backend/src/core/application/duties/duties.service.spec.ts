import { Test, TestingModule } from '@nestjs/testing';
import { DutiesService } from './duties.service';
import { getModelToken } from '@nestjs/mongoose';
import { Duty } from '../../../infrastructure/database/mongoose/schemas/duty.schema';
import { RedlockService } from '../../../infrastructure/redis/redlock.service';

describe('DutiesService Concurrency (MongoDB + Redis)', () => {
  let service: DutiesService;

  const mockDutyModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockLock = {
    release: jest.fn().mockResolvedValue(true),
  };

  const mockRedlockService = {
    redlock: {
      acquire: jest.fn().mockResolvedValue(mockLock),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DutiesService,
        {
          provide: getModelToken(Duty.name),
          useValue: mockDutyModel,
        },
        {
          provide: RedlockService,
          useValue: mockRedlockService,
        },
      ],
    }).compile();

    service = module.get<DutiesService>(DutiesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ConflictException on concurrent overlapping assignment', async () => {
    // Simulamos que la BD primero no encuentra solapamiento, y luego sí (si se colara)
    mockDutyModel.findOne.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(null), // Primero no encuentra solapamiento
    });
    mockDutyModel.findOne.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce({ _id: 'existing-duty' }), // El segundo encuentra solapamiento
    });
    mockDutyModel.create.mockResolvedValue({ _id: 'new-duty' });

    // Hacemos que Redlock rechace el segundo acquire simulando el bloqueo distribuido
    mockRedlockService.redlock.acquire.mockResolvedValueOnce(mockLock);
    
    // execution error for second lock acquire
    const lockError = new Error('The resource "lock:vehicle:veh1" is already locked.');
    lockError.name = 'ExecutionError';
    mockRedlockService.redlock.acquire.mockRejectedValueOnce(lockError);

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 1000 * 60 * 60);

    // Disparamos dos asignaciones concurrentes
    const promise1 = service.assignDuty('veh1', 'route1', startTime, endTime);
    const promise2 = service.assignDuty('veh1', 'route1', startTime, endTime);

    // Una debe pasar, la otra debe tirar error por el Lock
    const results = await Promise.allSettled([promise1, promise2]);

    const rejected = results.filter(r => r.status === 'rejected');
    expect(rejected.length).toBe(1);
    
    const rejectedResult = rejected[0] as PromiseRejectedResult;
    expect(String(rejectedResult.reason)).toContain('locked');
    expect(mockLock.release).toHaveBeenCalledTimes(1);
  });
});
