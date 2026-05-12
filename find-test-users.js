const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const roles = ['VENDOR', 'GUARD', 'SUPER_ADMIN']
  for (const role of roles) {
    const user = await prisma.user.findFirst({
      where: { role: role }
    })
    console.log(`${role}: ${user ? user.email : 'Not Found'}`)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
