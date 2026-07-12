import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Password@123";

const USERS = [
  { username: "admin", email: "admin@transitops.com", role: "ADMIN", password: "Admin@12345" },
  { username: "fleetmanager", email: "fleetmanager@transitops.com", role: "FLEET_MANAGER" },
  { username: "dispatcher", email: "dispatcher@transitops.com", role: "DISPATCHER" },
  { username: "safetyofficer", email: "safetyofficer@transitops.com", role: "SAFETY_OFFICER" },
  { username: "financialanalyst", email: "financialanalyst@transitops.com", role: "FINANCIAL_ANALYST" },
  { username: "driver", email: "driver@transitops.com", role: "DRIVER" },
];

async function main() {
  for (const u of USERS) {
    const hashedPassword = await bcrypt.hash(u.password || DEFAULT_PASSWORD, 10);

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role },
      create: {
        email: u.email,
        username: u.username,
        password: hashedPassword,
        role: u.role,
      },
    });

    console.log(`${u.role.padEnd(18)} -> email: ${user.email.padEnd(32)} password: ${u.password || DEFAULT_PASSWORD}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
