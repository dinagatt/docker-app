import { Module, Global } from '@nestjs/common';
import { CoreConfig } from './core.config';

@Global()
@Module({
  providers: [CoreConfig],
  exports: [CoreConfig],
})
export class CoreModule {}
