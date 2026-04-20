const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Linking Rahul Resident (ID 4) to Unit A-101 (ID 1) as Owner
    const updatedUnit = await prisma.unit.update({
        where: { id: 1 },
        data: {
            ownerId: 4,
            status: 'OCCUPIED'
        }
    });

    console.log('Unit updated:', JSON.stringify(updatedUnit, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
