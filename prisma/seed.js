// import bcrypt from "bcryptjs";
// import { PrismaClient } from "../app/generated/prisma/index.js";
// import { ROLES } from "../lib/roles.js";

// const prisma = new PrismaClient();

// async function main() {
//   // === ROLES ===
//   for (const roleName of Object.values(ROLES)) {
//     await prisma.role.upsert({
//       where: { name: roleName },
//       update: {},
//       create: { name: roleName },
//     });
//   }

//   // === USERS ===
//   const adminRole = await prisma.role.findUnique({ where: { name: ROLES.ADMIN } });
//   const cashierRole = await prisma.role.findUnique({ where: { name: ROLES.CASHIER } });
//   const managerRole = await prisma.role.findUnique({ where: { name: ROLES.MANAGER } });

//   const usersData = [
//     {
//       username: "admin",
//       fullName: "System Admin",
//       roleId: adminRole.id,
//       password: await bcrypt.hash("admin123", 10),
//     },
//     {
//       username: "cashier1",
//       fullName: "Jane Cashier",
//       roleId: cashierRole?.id || adminRole.id,
//       password: await bcrypt.hash("cashier123", 10),
//     },
//     {
//       username: "manager1",
//       fullName: "John Manager",
//       roleId: managerRole?.id || adminRole.id,
//       password: await bcrypt.hash("manager123", 10),
//     },
//   ];

//   for (const user of usersData) {
//     await prisma.user.upsert({
//       where: { username: user.username },
//       update: {},
//       create: user,
//     });
//   }

//   // === SUPPLIERS ===
//   const suppliers = await prisma.$transaction(
//     ["Acme Supplies", "FreshFarm", "TechMart"].map((name, i) =>
//       prisma.supplier.upsert({
//         where: { name },
//         update: {},
//         create: {
//           name,
//           contactPerson: `Contact ${i + 1}`,
//           phone: `+93 70000000${i}`,
//           email: `${name.toLowerCase()}@mail.com`,
//           address: `Street ${i + 1}, Kabul`,
//         },
//       })
//     )
//   );

//   // === CATEGORIES ===
//   const categories = await prisma.$transaction(
//     ["Beverages", "Snacks", "Electronics"].map((name) =>
//       prisma.category.upsert({
//         where: { name },
//         update: {},
//         create: { name },
//       })
//     )
//   );

//   // === PRODUCTS ===
//   const products = await prisma.$transaction(
//     [
//       {
//         name: "Coca Cola 1L",
//         categoryId: categories[0].id,
//         supplierId: suppliers[0].id,
//         price: 50,
//         costPrice: 30,
//         stockQuantity: 100,
//         barcode: "1111111111111",
//       },
//       {
//         name: "Potato Chips",
//         categoryId: categories[1].id,
//         supplierId: suppliers[1].id,
//         price: 20,
//         costPrice: 10,
//         stockQuantity: 200,
//         barcode: "2222222222222",
//       },
//       {
//         name: "Smartphone X",
//         categoryId: categories[2].id,
//         supplierId: suppliers[2].id,
//         price: 15000,
//         costPrice: 12000,
//         stockQuantity: 10,
//         barcode: "3333333333333",
//       },
//     ].map((p) =>
//       prisma.product.upsert({
//         where: { barcode: p.barcode },
//         update: {},
//         create: p,
//       })
//     )
//   );

//   // === CUSTOMERS ===
//   const customers = await prisma.$transaction(
//     ["Ali", "Sara", "Omid"].map((name, i) =>
//       prisma.customer.upsert({
//         where: { phone: `+93 70012345${i}` },
//         update: {},
//         create: {
//           name,
//           phone: `+93 70012345${i}`,
//           email: `${name.toLowerCase()}@mail.com`,
//           address: `Customer Street ${i + 1}`,
//         },
//       })
//     )
//   );

//   // === DELIVERY DRIVERS ===
//   const drivers = await prisma.$transaction(
//     ["Driver A", "Driver B"].map((name, i) =>
//       prisma.deliveryDriver.upsert({
//         where: { phone: `+93 79988888${i}` },
//         update: {},
//         create: {
//           name,
//           phone: `+93 79988888${i}`,
//         },
//       })
//     )
//   );

//   // === SALES + ITEMS + INVOICES + DELIVERIES ===
//   const cashier = await prisma.user.findUnique({ where: { username: "cashier1" } });

//   for (let i = 0; i < 5; i++) {
//     const sale = await prisma.sale.create({
//       data: {
//         userId: cashier.id,
//         customerId: customers[i % customers.length].id,
//         totalAmount: 100 + i * 10,
//         taxAmount: 2,
//         // finalAmount: 97 + i * 10,
//         paymentMethod: i % 2 === 0 ? "CASH" : "CARD",
//         items: {
//           create: [
//             {
//               productId: products[i % products.length].id,
//               quantity: 2,
//               unitPrice: products[i % products.length].price,
//               discount: 0,
//               subtotal: products[i % products.length].price * 2,
//             },
//           ],
//         },
//       },
//     });

//     await prisma.invoice.create({
//       data: {
//         saleId: sale.id,
//         invoiceNumber: `INV-${Date.now()}-${i}`,
//       },
//     });

//     if (i % 2 === 0) {
//       await prisma.delivery.create({
//         data: {
//           saleId: sale.id,
//           customerId: sale.customerId,
//           deliveryAddress: sale.customerId
//             ? customers[i % customers.length].address
//             : "N/A",
//           driverId: drivers[i % drivers.length].id,
//           status: "pending",
//         },
//       });
//     }
//   }
// }

// main()
//   .then(() => console.log("✅ Database fully seeded!"))
//   .catch((e) => console.error("❌ Error seeding database:", e))
//   .finally(async () => await prisma.$disconnect());


import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // Upsert = create if not exists, update if exists
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      role: "ADMIN", // assuming you have a role field
    },
  });

  console.log("✅ Admin user ensured: username=admin, password=admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
