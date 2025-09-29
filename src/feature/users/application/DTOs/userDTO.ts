export class UserDTO {
  login: string;
  passwordHash: string;
  email: string;
  createdAt: Date;
  isConfirmed: boolean;
}
