export interface UserEmailConfirmationInfoEntity {
  id: number;
  userId: string;
  confirmationCode: string;
  expirationDate: string;
}
