export interface SessionEntity {
  id: number;
  userId: string;
  deviceId: string;
  deviceName: string;
  ip: string;
  iat: Date;
  exp: Date;
}
