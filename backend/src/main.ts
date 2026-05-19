import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const host = process.env.HOST || '127.0.0.1';

  configureApp(app);

  await app.listen(port, host);
}

bootstrap();
