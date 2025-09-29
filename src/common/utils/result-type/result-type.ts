export type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };

export interface DomainError {
  message: string;
}

//SESSIONS
export class SessionNotFoundError implements DomainError {
  message = 'Session not found.';
}

export class ForbiddenError implements DomainError {
  message = 'You do not have permission to delete this session.';
}

//GAME:PAIRS
export class ForbiddenToJoinOrCreatePairError implements DomainError {
  message = 'You are not allowed to join or create a pair.';
}

export class GameInternalServerError implements DomainError {
  message = 'Internal Server Error in Game connection or creation';
}

//GAME:ANSWERS
export class NotInActivePairOrQuestionsAlreadyAnsweredError
  implements DomainError
{
  message = 'You are not allowed to answer this question.';
}

export class GameAnswersInternalServerError implements DomainError {
  message = 'Internal Server Error in Answer creation';
}
