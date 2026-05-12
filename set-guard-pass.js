const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('12345678', 10)
  await prisma.user.update({
    where: { email: 'guard@society.com' },
    data: { password: hash }
  })
  console.log('Password updated to 12345678 for guard@society.com')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
