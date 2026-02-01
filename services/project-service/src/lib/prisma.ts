import 'dotenv/config';
import { PrismaClient } from '@generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in project-service');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

declare global {
  // eslint-disable-next-line no-var
  var projectPrisma: PrismaClient | undefined;
}

export const prisma = global.projectPrisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  global.projectPrisma = prisma;
}
