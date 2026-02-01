import 'dotenv/config';
import { PrismaClient as TeamPrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in team-service');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

declare global {
  // eslint-disable-next-line no-var
  var teamPrisma: TeamPrismaClient | undefined;
}

export const prisma = global.teamPrisma || new TeamPrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  global.teamPrisma = prisma;
}
