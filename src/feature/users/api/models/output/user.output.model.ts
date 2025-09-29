import { UserDocument } from '../../../domain/mongo/user.entity';

export class UserViewModel {
  id: string;
  login: string;
  email: string;
  createdAt: string;
}

// MAPPERS

export const UserOutputModelMapper = (user: UserDocument): UserViewModel => {
  const outputModel = new UserViewModel();

  outputModel.id = user.id;
  outputModel.login = user.login;
  outputModel.email = user.email;
  outputModel.createdAt = user.createdAt;

  return outputModel;
};
