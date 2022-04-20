export interface UserDTO {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isLocked: boolean;
  lastActivity?: Date;
  joined: Date;
  tags: string[];
  roles: string[];
  passwordChangeNeeded: boolean;
}
