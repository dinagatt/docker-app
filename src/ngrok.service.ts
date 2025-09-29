import { Injectable, OnModuleInit } from '@nestjs/common';
import ngrok from 'ngrok';

@Injectable()
export class NgrokService implements OnModuleInit {
  async onModuleInit() {
    try {
      const url = await ngrok.connect({
        addr: 3005,
        proto: 'http',
        host_header: 'localhost:3005',
      });

      console.log(`Ngrok tunnel running at: ${url}`);
    } catch (err) {
      console.error('Ngrok failed to start:', err);
    }
  }
}
