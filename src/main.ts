import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { applyAppSettings } from './settings/apply-app-settings';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CoreConfig } from './core/core.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const coreConfig = app.get<CoreConfig>(CoreConfig);

  app.enableCors(/*{
    origin: '*',
    credentials: true,
    allowedHeaders: 'Authorization, Content-Type',
  }*/);

  app.use(cookieParser());

  applyAppSettings(app);

  /*app.use((req, res, next) => {
    console.log('🔥 FULL REQUEST:', {
      method: req.method,
      url: req.url,
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
    });
    next();
  });*/
  /* /!*app.use((req, res, next) => {
    console.log('Incoming Headers:', req.headers);
    next();
  });*!/
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] === 'https') {
      req.headers['x-forwarded-proto'] = 'http'; // Force HTTP
    }
    next();
  });

  // Get the underlying Express instance
  const expressApp = app.getHttpAdapter().getInstance();

  // Trust the proxy (Ngrok) headers
  expressApp.set('trust proxy', 1);

  await app.listen(3005, '0.0.0.0'); // Bind to all network interfaces*/

  const config = new DocumentBuilder()
    .setTitle('My App IT-Incubator')
    .setDescription('The API description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(coreConfig.port /*appSettings.api.APP_PORT*/, () => {
    console.log(`Server is listening on port ${coreConfig.port}`);
    /*console.log('ENV: ', appSettings.env.getEnv());*/
  });
}

bootstrap();
