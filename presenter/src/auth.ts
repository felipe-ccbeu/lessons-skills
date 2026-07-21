import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const ALLOWED_DOMAIN = 'ccbeuguarapuava.com.br';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: { hd: ALLOWED_DOMAIN, prompt: 'select_account' },
      },
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().toLowerCase().trim();
        const password = credentials?.password?.toString();
        if (!email || !password) return null;

        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser?.passwordHash) return null;

        const valid = await bcrypt.compare(password, dbUser.passwordHash);
        if (!valid) return null;

        return { id: dbUser.id, email: dbUser.email, name: dbUser.name, image: dbUser.image };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      const email = user.email;
      if (!email) return false;

      // Credentials auth already verified the password against an existing user; skip the domain/upsert dance below.
      if (account?.provider === 'credentials') return true;

      if (!email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
        // The Google `hd` param only filters the account picker; this is the real check.
        return false;
      }
      await prisma.user.upsert({
        where: { email },
        update: { name: user.name ?? undefined, image: user.image ?? undefined },
        create: { email, name: user.name ?? undefined, image: user.image ?? undefined },
      });
      return true;
    },
    async jwt({ token }) {
      if (!token.email) return token;
      const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
      if (dbUser) {
        token.role = dbUser.role;
        token.userId = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role ?? 'NONE';
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
