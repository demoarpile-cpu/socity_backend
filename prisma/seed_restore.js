const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const hashes = {
    super: await bcrypt.hash('super123', 10),
    admin: await bcrypt.hash('admin123', 10),
    resident: await bcrypt.hash('resident123', 10),
    guard: await bcrypt.hash('guard123', 10),
    vendor: await bcrypt.hash('11111111', 10),
    individual: await bcrypt.hash('user123', 10),
  };

  // 1. Create Society
  const society = await prisma.society.upsert({
    where: { code: 'SOC001' },
    update: {},
    create: {
      name: 'Trinity CHS',
      address: 'Near Central Park',
      city: 'Noida',
      state: 'UP',
      pincode: '201301',
      code: 'SOC001',
      status: 'ACTIVE',
    },
  });

  // 2. Create Users
  const users = [
    { email: 'superadmin@society.com', password: hashes.super, name: 'Main Super Admin', role: 'SUPER_ADMIN' },
    { email: 'admin@society.com', password: hashes.admin, name: 'Sanjay Admin', role: 'ADMIN' },
    { email: 'resident1@society.com', password: hashes.resident, name: 'Rahul Resident', role: 'RESIDENT' },
    { email: 'guard@society.com', password: hashes.guard, name: 'Bahadur Guard', role: 'GUARD' },
    { email: 'test4@gmail.com', password: hashes.vendor, name: 'Expert Services', role: 'VENDOR' },
    { email: 'individual@example.com', password: hashes.individual, name: 'Amit Individual', role: 'INDIVIDUAL' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { password: u.password, role: u.role, name: u.name, societyId: u.role !== 'SUPER_ADMIN' ? society.id : null },
      create: { 
        email: u.email, 
        password: u.password, 
        name: u.name, 
        role: u.role, 
        societyId: u.role !== 'SUPER_ADMIN' ? society.id : null,
        status: 'ACTIVE'
      },
    });
  }

  // 3. Create Demo Notices
  await prisma.notice.deleteMany({ where: { societyId: society.id } }); // Clear existing
  await prisma.notice.createMany({
    data: [
      {
        title: 'Society Annual General Meeting',
        content: 'The Annual General Meeting will be held on January 20th, 2025 at 6:00 PM in the clubhouse. All members are requested to attend.',
        audience: 'ALL',
        type: 'announcement',
        priority: 'high',
        status: 'PUBLISHED',
        isPinned: true,
        societyId: society.id,
      },
      {
        title: 'Water Supply Interruption Notice',
        content: 'Water supply will be suspended on January 15th from 10:00 AM to 4:00 PM for tank cleaning. Please store water accordingly.',
        audience: 'ALL',
        type: 'maintenance',
        priority: 'high',
        status: 'PUBLISHED',
        isPinned: true,
        societyId: society.id,
      },
      {
        title: 'Republic Day Celebration 2025',
        content: 'Join us for the Republic Day celebration on January 26th at 8:00 AM in the society garden.',
        audience: 'ALL',
        type: 'event',
        priority: 'medium',
        status: 'PUBLISHED',
        isPinned: false,
        societyId: society.id,
      }
    ]
  });

  // 4. Create some Unit demo data
  await prisma.unit.upsert({
    where: { societyId_block_number: { societyId: society.id, block: 'A', number: '101' } },
    update: {},
    create: {
      block: 'A',
      number: '101',
      floor: 1,
      type: '3BHK',
      areaSqFt: 1500,
      societyId: society.id,
      status: 'OCCUPIED'
    }
  });

  console.log('Full demo seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
