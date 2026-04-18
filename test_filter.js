const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFilter(role) {
  const userRole = role.toUpperCase();
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'COMMUNITY_MANAGER'].includes(userRole);
  
  const where = {
    societyId: 1
  };

  if (!isAdmin) {
    const allowedAudiences = ['ALL'];
    if (['RESIDENT', 'TENANT', 'OWNER'].includes(userRole)) {
      allowedAudiences.push('RESIDENTS');
    }
    if (userRole === 'OWNER') {
      allowedAudiences.push('OWNERS');
    }
    if (userRole === 'GUARD') {
      allowedAudiences.push('GUARD');
    }

    where.status = 'PUBLISHED';
    where.audience = { in: allowedAudiences };
  }

  console.log(`Testing for role: ${role}`);
  console.log('Query Where:', JSON.stringify(where, null, 2));
  
  const notices = await prisma.notice.findMany({ where });
  console.log('Results:', notices.map(n => n.title));
}

async function main() {
  await testFilter('GUARD');
  await testFilter('RESIDENT');
  await testFilter('ADMIN');
}

main().finally(() => prisma.$disconnect());
