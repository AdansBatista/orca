import type { UserRole } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      name: string;
      role: UserRole;
      clinicId: string;
      clinicIds: string[];
      avatar?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    role: UserRole;
    clinicId: string;
    clinicIds: string[];
    avatar?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    role: UserRole;
    clinicId: string;
    clinicIds: string[];
    avatar?: string | null;
  }
}
