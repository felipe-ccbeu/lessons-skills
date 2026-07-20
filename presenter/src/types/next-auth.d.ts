import type { Role } from '@/generated/prisma/client';
import type { DefaultSession } from 'next-auth';

declare module '@auth/core/types' {
  interface Session {
    user: { id: string; role: Role } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: Role;
    userId?: string;
  }
}
