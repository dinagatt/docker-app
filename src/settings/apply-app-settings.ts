// Префикс нашего приложения (https://site.com/api)
import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { useContainer } from 'class-validator';
import { AppModule } from '../app.module';
import { HttpExceptionFilter } from '../common/exception-filters/exception.filter';

//const APP_PREFIX = '/api';

// Используем данную функцию в main.ts и в e2e тестах
export const applyAppSettings = (app: INestApplication) => {
  // Для внедрения зависимостей в validator constraint
  // {fallbackOnErrors: true} требуется, поскольку Nest генерирует исключение,
  // когда DI не имеет необходимого класса.
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Применение глобальных Interceptors
  //app.useGlobalInterceptors(new LoggingInterceptor())

  //const userService = app.get(UsersService)  TODO: what is that?

  // Применение глобальных Guards
  // app.useGlobalGuards(new AuthGuard(userService));

  // Применить middleware глобально
  //app.use(LoggerMiddlewareFunc);

  // Установка префикса
  //setAppPrefix(app);

  // Конфигурация swagger документации
  //setSwagger(app);

  // Применение глобальных pipes
  setAppPipes(app);

  // Применение глобальных exceptions filters
  setAppExceptionsFilters(app);
};

/*const setAppPrefix = (app: INestApplication) => {
  // Устанавливается для разворачивания front-end и back-end на одном домене
  // https://site.com - front-end
  // https://site.com/api - backend-end
  app.setGlobalPrefix(APP_PREFIX);
};*/

/*const setSwagger = (app: INestApplication) => {
  if (!appSettings.env.isProduction()) {
    const swaggerPath = APP_PREFIX + '/swagger-doc';

    const config = new DocumentBuilder()
      .setTitle('BLOGGER API')
      .addBearerAuth()
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerPath, app, document, {
      customSiteTitle: 'Blogger Swagger',
    });
  }
};*/

const setAppPipes = (app: INestApplication) => {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Ensures data is transformed to DTO instances
      whitelist: true, // Strips out properties not in the DTO
      forbidNonWhitelisted: true, // Throws an error if non-whitelisted properties are present
      /*forbidUnknownValues: false,*/
      skipMissingProperties: true,
      stopAtFirstError: true, // Выдавать первую ошибку для каждого поля
      // Перехватываем ошибку, кастомизируем её и выкидываем 400 с собранными данными
      exceptionFactory: (errors) => {
        const errorsMessages = [];

        //console.log(errors);

        errors.forEach((e) => {
          /*   {
               isEmail: "Error email",
               isLength: "Error max length
             }
             */

          const constraintKeys = Object.keys(e.constraints as any);

          //console.log(e.constraints);

          constraintKeys.forEach((cKey, index) => {
            if (index >= 1) return;

            const msg = e.constraints?.[cKey] as any;
            // @ts-ignore
            errorsMessages.push({ message: msg, field: e.property });
          });
        });

        //console.log(errorsMessages);
        // Error 400
        throw new BadRequestException(errorsMessages);
      },
    }),
  );
};

const setAppExceptionsFilters = (app: INestApplication) => {
  app.useGlobalFilters(new HttpExceptionFilter());
};
