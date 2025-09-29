import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CryptoService {
  async _generateHash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
    //ALTERNATIVE: const hash = await bcrypt.hash(password, 10);
  }

  async _comparePasswords(
    reqPassword: string,
    userPasswordHash: string,
  ): Promise<boolean> {
    return await bcrypt.compare(reqPassword, userPasswordHash);
  }
}
