import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminHash = await bcrypt.hash("admin12345", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@misslermedia.com" },
    update: {},
    create: {
      email: "admin@misslermedia.com",
      passwordHash: adminHash,
      name: "Studio Admin",
      phone: "(555) 000-0000",
      role: "ADMIN",
    },
  });

  const spotlightPhotos = [
    {
      url: "https://images.unsplash.com/photo-1493863641943-9b67192f0d4a?w=1920&q=80",
      title: "Timeless Portraits",
      caption: "Elegant photography for every occasion",
      sortOrder: 0,
    },
    {
      url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80",
      title: "Wedding Stories",
      caption: "Your love story, beautifully told",
      sortOrder: 1,
    },
    {
      url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1920&q=80",
      title: "Family Moments",
      caption: "Cherished memories preserved forever",
      sortOrder: 2,
    },
  ];

  for (const photo of spotlightPhotos) {
    const existing = await prisma.spotlightPhoto.findFirst({
      where: { url: photo.url },
    });
    if (!existing) {
      await prisma.spotlightPhoto.create({ data: photo });
    }
  }

  const packages = [
    {
      name: "Essential",
      description: "Perfect for quick portrait sessions.",
      price: 199,
      features: JSON.stringify([
        "30-minute session",
        "10 edited digital photos",
        "Online gallery access",
      ]),
      sortOrder: 0,
    },
    {
      name: "Classic",
      description: "Our most popular full session package.",
      price: 399,
      features: JSON.stringify([
        "1-hour session",
        "25 edited digital photos",
        "2 outfit changes",
        "Online gallery access",
        "Print release included",
      ]),
      sortOrder: 1,
    },
    {
      name: "Premium",
      description: "The complete photography experience.",
      price: 699,
      features: JSON.stringify([
        "2-hour session",
        "50+ edited digital photos",
        "Multiple locations",
        "Online gallery access",
        "Print release included",
        "Priority scheduling",
      ]),
      sortOrder: 2,
    },
  ];

  for (const pkg of packages) {
    const existing = await prisma.pricingPackage.findFirst({
      where: { name: pkg.name },
    });
    if (!existing) {
      await prisma.pricingPackage.create({ data: pkg });
    }
  }

  const openDayDate = new Date();
  openDayDate.setDate(openDayDate.getDate() + 14);
  openDayDate.setHours(0, 0, 0, 0);

  const existingDay = await prisma.openDay.findFirst({
    where: { date: openDayDate },
  });
  if (!existingDay) {
    await prisma.openDay.create({
      data: {
        date: openDayDate,
        startTime: "09:00",
        endTime: "17:00",
        maxAppointments: 4,
        notes: "Studio sessions available",
      },
    });
  }

  const settings = [
    { key: "stripe_enabled", value: "false" },
    { key: "paypal_enabled", value: "false" },
    { key: "venmo_enabled", value: "false" },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      create: setting,
      update: {},
    });
  }

  console.log("Seed complete!");
  console.log("Admin login: admin@misslermedia.com / admin12345");
  console.log("Admin ID:", admin.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
