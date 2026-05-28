import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bat CORS cho frontend Vite (mac dinh port 5173)
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`[ecomdy-backend] San sang o http://localhost:${port}`);
}

bootstrap();
