import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string | null;
}
