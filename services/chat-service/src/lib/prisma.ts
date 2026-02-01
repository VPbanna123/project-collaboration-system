import 'dotenv/config';
import { PrismaClient } from '@generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in chat-service');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

declare global {
  
  var chatPrisma: PrismaClient | undefined;
}

export const prisma = global.chatPrisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  global.chatPrisma = prisma;
}
