import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';

// Fixed dev/test password so the seeded admin account always logs in the same way locally.
const DEV_ADMIN_PASSWORD = 'ccbeu2026';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash(DEV_ADMIN_PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: 'felipe@ccbeuguarapuava.com.br' },
    update: { role: 'ADMIN', passwordHash },
    create: { email: 'felipe@ccbeuguarapuava.com.br', name: 'Felipe', role: 'ADMIN', passwordHash },
  });
  console.log('Admin seed:', admin.email, admin.role, `(password: ${DEV_ADMIN_PASSWORD})`);

  // Dev-only test accounts, one per role, so an admin can preview the app as each kind of
  // user without needing separate real logins. Always re-seeded so the password stays known.
  const TEST_USERS: { email: string; name: string; role: 'ADMIN' | 'COORDINATOR' | 'TEACHER' | 'NONE' }[] = [
    { email: 'teste.coordenador@ccbeuguarapuava.com.br', name: 'Teste Coordenador', role: 'COORDINATOR' },
    { email: 'teste.professor@ccbeuguarapuava.com.br', name: 'Teste Professor', role: 'TEACHER' },
    { email: 'teste.semacesso@ccbeuguarapuava.com.br', name: 'Teste Sem Acesso', role: 'NONE' },
  ];
  for (const u of TEST_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, name: u.name, passwordHash },
      create: { email: u.email, name: u.name, role: u.role, passwordHash },
    });
  }
  console.log(
    'Test users seeded:',
    TEST_USERS.map((u) => `${u.email} (${u.role})`).join(', '),
    `(password: ${DEV_ADMIN_PASSWORD})`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
