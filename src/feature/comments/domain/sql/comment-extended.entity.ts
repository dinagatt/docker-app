import { CommentEntity } from './comment.entity';

export interface CommentExtendedEntity extends CommentEntity {
  userLogin: string;
}
