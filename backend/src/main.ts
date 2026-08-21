import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Útil para que el frontend local pueda pegarle

  // Configuración de OpenAPI (Swagger)
  const config = new DocumentBuilder()
    .setTitle('Wawa Transport API')
    .setDescription('API base para la prueba técnica')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Montar Scalar API Reference
  app.use(
    '/docs',
    apiReference({
      spec: {
        content: document,
      },
      theme: 'purple',
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
