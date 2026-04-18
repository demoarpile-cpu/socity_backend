const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, name: true }
  });
  console.log(JSON.stringify(users, null, 2));
  
  const notices = await prisma.notice.findMany({
    select: { title: true, audience: true }
  });
  console.log(JSON.stringify(notices, null, 2));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
