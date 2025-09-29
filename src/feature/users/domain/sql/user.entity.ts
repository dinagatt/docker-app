export interface UserEntity {
  id: string;
  login: string;
  passwordHash: string;
  email: string;
  createdAt: Date;
  isConfirmed: boolean;
}
