const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting deep seeding of all tables...');

  // 1. BILLING PLANS
  const plans = await Promise.all([
    prisma.billingPlan.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: 'Basic Plan', price: '999', type: 'Monthly', planType: 'BASIC', status: 'ACTIVE' }
    }),
    prisma.billingPlan.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, name: 'Professional Plan', price: '4999', type: 'Yearly', planType: 'PROFESSIONAL', status: 'ACTIVE' }
    })
  ]);
  console.log('✅ Billing Plans seeded.');

  // 2. MAIN SOCIETY
  const society = await prisma.society.upsert({
    where: { code: 'LIVE99' },
    update: {},
    create: {
      name: 'Modern Living Apartments',
      address: '7th Avenue, Green Park',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      code: 'LIVE99',
      status: 'ACTIVE',
      subscriptionPlan: 'PROFESSIONAL',
      isPaid: true,
      billingPlanId: plans[1].id
    }
  });
  console.log('✅ Society "Modern Living" seeded.');

  // 3. USERS (Roles)
  const pwd = await bcrypt.hash('pass123', 10);
  
  // Super Admin
  await prisma.user.upsert({
    where: { email: 'super@socity.com' },
    update: {},
    create: { email: 'super@socity.com', name: 'Platform Admin', password: pwd, role: 'SUPER_ADMIN' }
  });

  // Society Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@live99.com' },
    update: {},
    create: { email: 'admin@live99.com', name: 'Sanjay Admin', password: pwd, role: 'ADMIN', societyId: society.id, phone: '9000000001' }
  });

  // Residents
  const res1 = await prisma.user.upsert({
    where: { email: 'john@live99.com' },
    update: {},
    create: { email: 'john@live99.com', name: 'John Doe', password: pwd, role: 'RESIDENT', societyId: society.id, phone: '9000000002' }
  });

  const res2 = await prisma.user.upsert({
    where: { email: 'jane@live99.com' },
    update: {},
    create: { email: 'jane@live99.com', name: 'Jane Smith', password: pwd, role: 'RESIDENT', societyId: society.id, phone: '9000000003' }
  });

  // Guards
  const guard = await prisma.user.upsert({
    where: { email: 'guard1@live99.com' },
    update: {},
    create: { email: 'guard1@live99.com', name: 'Bahadur Singh', password: pwd, role: 'GUARD', societyId: society.id, phone: '9000000004' }
  });

  console.log('✅ Core users created.');

  // 4. UNITS (Linked to Residents)
  const units = await Promise.all([
    prisma.unit.upsert({
      where: { societyId_block_number: { societyId: society.id, block: 'A', number: '101' } },
      update: {},
      create: { block: 'A', number: '101', floor: 1, type: '2BHK', areaSqFt: 1200, status: 'OCCUPIED', societyId: society.id, ownerId: res1.id }
    }),
    prisma.unit.upsert({
      where: { societyId_block_number: { societyId: society.id, block: 'A', number: '102' } },
      update: {},
      create: { block: 'A', number: '102', floor: 1, type: '2BHK', areaSqFt: 1200, status: 'OCCUPIED', societyId: society.id, ownerId: res2.id }
    }),
    prisma.unit.upsert({
      where: { societyId_block_number: { societyId: society.id, block: 'B', number: '201' } },
      update: {},
      create: { block: 'B', number: '201', floor: 2, type: '3BHK', areaSqFt: 1800, status: 'VACANT', societyId: society.id }
    })
  ]);
  console.log('✅ Units seeded and assigned.');

  // 5. PARKING SLOTS
  await prisma.parkingSlot.createMany({
    data: [
      { number: 'P-A1', type: '4-Wheeler', status: 'ALLOCATED', allocatedToUnitId: units[0].id, societyId: society.id },
      { number: 'P-A2', type: '4-Wheeler', status: 'ALLOCATED', allocatedToUnitId: units[1].id, societyId: society.id },
      { number: 'P-B1', type: '2-Wheeler', status: 'VACANT', societyId: society.id }
    ],
    skipDuplicates: true
  });

  // 6. AMENITIES
  const gym = await prisma.amenity.upsert({
    where: { id: 10 },
    update: {},
    create: { id: 10, name: 'Power Gym', type: 'gym', capacity: 20, societyId: society.id, status: 'available' }
  });

  // 7. COMPLAINTS & NOTICES
  await prisma.complaint.create({
    data: {
      title: 'Water pressure low',
      description: 'The water pressure in floor 1 is very low since morning.',
      category: 'plumbing',
      priority: 'MEDIUM',
      status: 'OPEN',
      societyId: society.id,
      reportedById: res1.id
    }
  });

  await prisma.notice.create({
    data: {
      title: 'Monthly Maintenance Due',
      content: 'Maintenance bills for April 2024 are out. Pay by 10th to avoid late fee.',
      audience: 'ALL',
      type: 'announcement',
      status: 'PUBLISHED',
      societyId: society.id
    }
  });

  // 8. VISITORS
  await prisma.visitor.create({
    data: {
      name: 'Zomato Delivery',
      phone: '9876543210',
      purpose: 'Delivery',
      status: 'CHECKED_OUT',
      entryTime: new Date(Date.now() - 3600000),
      exitTime: new Date(),
      societyId: society.id,
      visitingUnitId: units[0].id,
      residentId: res1.id,
      checkedInById: guard.id
    }
  });

  // 9. ACCOUNTING (Transaction & Invoices)
  await prisma.transaction.createMany({
    data: [
      { 
        type: 'INCOME', 
        category: 'Maintenance', 
        amount: 2500, 
        date: new Date(), 
        paymentMethod: 'UPI', 
        status: 'PAID', 
        receivedFrom: 'John Doe', 
        societyId: society.id 
      },
      { 
        type: 'EXPENSE', 
        category: 'Salary', 
        amount: 15000, 
        date: new Date(), 
        paymentMethod: 'ONLINE', 
        status: 'PAID', 
        paidTo: 'Bahadur Singh', 
        societyId: society.id 
      }
    ]
  });

  await prisma.invoice.create({
    data: {
      invoiceNo: 'INV-2024-001',
      societyId: society.id,
      unitId: units[0].id,
      residentId: res1.id,
      amount: 2500,
      maintenance: 2000,
      utilities: 500,
      dueDate: new Date(Date.now() + 864000000),
      status: 'PENDING'
    }
  });

  // 10. SYSTEM SETTINGS
  await prisma.systemSetting.upsert({
    where: { key: 'currency' },
    update: {},
    create: { key: 'currency', value: 'INR' }
  });

  console.log('🏁 ALL TABLES SEEDED SUCCESSFULLY!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
