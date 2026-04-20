const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const units = await prisma.unit.findMany({
        where: { societyId: 1 }
    });

    console.log(JSON.stringify(units, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
