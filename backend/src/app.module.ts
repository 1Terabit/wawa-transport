import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from './infrastructure/redis/redis.module';
import { AiModule } from './core/application/ai/ai.module';
import { VehiclesModule } from './vehicles.module';
import { RoutesModule } from './routes.module';
import { DutiesModule } from './duties.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/wawa-transport'),
    RedisModule,
    AiModule,
    VehiclesModule,
    RoutesModule,
    DutiesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
