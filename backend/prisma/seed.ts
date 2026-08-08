import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Mini ERP + CRM database...');

  // 1. Clean database
  await prisma.challanItem.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.stockLog.deleteMany();
  await prisma.product.deleteMany();
  await prisma.followUpNote.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@minierp.com',
      name: 'Alex Rivera (Admin)',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  const sales = await prisma.user.create({
    data: {
      email: 'sales@minierp.com',
      name: 'Sarah Connor (Sales)',
      password: passwordHash,
      role: 'SALES',
    },
  });

  const warehouse = await prisma.user.create({
    data: {
      email: 'warehouse@minierp.com',
      name: 'Walter White (Warehouse)',
      password: passwordHash,
      role: 'WAREHOUSE',
    },
  });

  const accounts = await prisma.user.create({
    data: {
      email: 'accounts@minierp.com',
      name: 'Amy Santiago (Accounts)',
      password: passwordHash,
      role: 'ACCOUNTS',
    },
  });

  console.log('Created Users: Admin, Sales, Warehouse, Accounts');

  // 3. Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Apex Wholesale Traders',
      mobile: '+91 98765 43210',
      email: 'contact@apexwholesale.com',
      businessName: 'Apex Wholesale Ltd',
      gstNumber: '27AAAAA0000A1Z5',
      customerType: 'WHOLESALE',
      address: 'Plot 42, Industrial Zone, Sector 18, Mumbai, MH',
      status: 'ACTIVE',
      followUpDate: new Date(Date.now() + 86400000 * 3),
      notes: 'Key distributor for West region. Negotiating bulk pricing.',
      followUpNotes: {
        create: [
          {
            note: 'Initial inquiry regarding bulk order of LED Monitors.',
            createdBy: sales.name,
          },
          {
            note: 'Sent quote with 5% wholesale discount.',
            createdBy: sales.name,
          },
        ],
      },
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'TechMart Retail Solutions',
      mobile: '+91 91234 56789',
      email: 'purchasing@techmart.in',
      businessName: 'TechMart Enterprises',
      gstNumber: '29BBBBA1111B1Z2',
      customerType: 'RETAIL',
      address: '102 Commercial Complex, MG Road, Bengaluru, KA',
      status: 'ACTIVE',
      followUpDate: new Date(Date.now() + 86400000 * 5),
      notes: 'Frequent buyer of high-end computer peripherals.',
      followUpNotes: {
        create: [
          {
            note: 'Discussed payment terms for next quarter.',
            createdBy: sales.name,
          },
        ],
      },
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Global Logistics & Supplies',
      mobile: '+91 99887 76655',
      email: 'info@globallogistics.org',
      businessName: 'Global Distro Corp',
      gstNumber: '07CCCCA2222C1Z9',
      customerType: 'DISTRIBUTOR',
      address: '88 Logistics Hub, NH-8, Gurugram, HR',
      status: 'LEAD',
      followUpDate: new Date(Date.now() + 86400000 * 1),
      notes: 'New prospect interested in hardware distribution deal.',
    },
  });

  console.log('Created Customers');

  // 4. Create Products
  const p1 = await prisma.product.create({
    data: {
      name: 'UltraSharp 27" 4K Monitor',
      sku: 'DISP-MON-001',
      category: 'Displays',
      unitPrice: 24999.0,
      currentStock: 45,
      minStockAlert: 10,
      location: 'Rack A-12',
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: 'Ergonomic Mechanical Keyboard',
      sku: 'PERI-KEY-002',
      category: 'Peripherals',
      unitPrice: 4500.0,
      currentStock: 8, // Low stock!
      minStockAlert: 15,
      location: 'Rack B-04',
    },
  });

  const p3 = await prisma.product.create({
    data: {
      name: 'Wireless Precision Mouse',
      sku: 'PERI-MOU-003',
      category: 'Peripherals',
      unitPrice: 1800.0,
      currentStock: 120,
      minStockAlert: 20,
      location: 'Rack B-05',
    },
  });

  const p4 = await prisma.product.create({
    data: {
      name: 'USB-C Docking Station Multiport',
      sku: 'ACC-DOCK-004',
      category: 'Accessories',
      unitPrice: 6200.0,
      currentStock: 30,
      minStockAlert: 5,
      location: 'Rack C-01',
    },
  });

  console.log('Created Products');

  // 5. Stock Movement Logs
  await prisma.stockLog.createMany({
    data: [
      {
        productId: p1.id,
        quantityChanged: 50,
        movementType: 'IN',
        reason: 'Initial shipment from vendor',
        createdBy: warehouse.name,
      },
      {
        productId: p2.id,
        quantityChanged: 20,
        movementType: 'IN',
        reason: 'Initial shipment from vendor',
        createdBy: warehouse.name,
      },
      {
        productId: p2.id,
        quantityChanged: 12,
        movementType: 'OUT',
        reason: 'Damaged goods write-off',
        createdBy: warehouse.name,
      },
    ],
  });

  console.log('Created Initial Stock Logs');

  // 6. Create Sales Challans
  // Challan 1: Confirmed (Stock reduced for p1)
  const challan1Number = 'CHLN-20260808-0001';
  await prisma.$transaction(async (tx) => {
    const challan = await tx.challan.create({
      data: {
        challanNumber: challan1Number,
        customerId: customer1.id,
        totalQuantity: 5,
        totalAmount: 5 * p1.unitPrice,
        status: 'CONFIRMED',
        createdBy: sales.name,
        items: {
          create: [
            {
              productId: p1.id,
              productName: p1.name,
              productSku: p1.sku,
              unitPrice: p1.unitPrice,
              quantity: 5,
              subtotal: 5 * p1.unitPrice,
            },
          ],
        },
      },
    });

    // Reduce stock
    await tx.product.update({
      where: { id: p1.id },
      data: { currentStock: { decrement: 5 } },
    });

    // Record stock log
    await tx.stockLog.create({
      data: {
        productId: p1.id,
        quantityChanged: 5,
        movementType: 'OUT',
        reason: `Sales Challan confirmed: ${challan1Number}`,
        createdBy: sales.name,
      },
    });
  });

  // Challan 2: Draft
  const challan2Number = 'CHLN-20260808-0002';
  await prisma.challan.create({
    data: {
      challanNumber: challan2Number,
      customerId: customer2.id,
      totalQuantity: 3,
      totalAmount: 2 * p2.unitPrice + 1 * p3.unitPrice,
      status: 'DRAFT',
      createdBy: sales.name,
      items: {
        create: [
          {
            productId: p2.id,
            productName: p2.name,
            productSku: p2.sku,
            unitPrice: p2.unitPrice,
            quantity: 2,
            subtotal: 2 * p2.unitPrice,
          },
          {
            productId: p3.id,
            productName: p3.name,
            productSku: p3.sku,
            unitPrice: p3.unitPrice,
            quantity: 1,
            subtotal: 1 * p3.unitPrice,
          },
        ],
      },
    },
  });

  console.log('Created Seed Challans');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
