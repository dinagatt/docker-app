import { Repository } from 'typeorm';
import { User } from '../../../feature/users/domain/TypeORM/user.entity';
import { UserDTO } from '../../../feature/users/application/DTOs/userDTO';

/*export async function createTestUser(
  usersRepo: Repository<User>,
  userDTO: UserDTO,
): Promise<User> {
  const newUser = usersRepo.create({
    login: userDTO.login,
    password: userDTO.password || 'testpassword',
    username: userDTO?.username || `test_user_${Date.now()}`,
    email: userDTO?.email || `test${Date.now()}@example.com`,

    ...userDTO, // Allow overrides
  });

  return await usersRepo.save(newUser);
}*/
