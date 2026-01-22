/**
 * Prisma seed entry point.
 *
 * This file is called by `npx prisma db seed` when configured in package.json.
 * For CLI usage, use `scripts/db/seed.ts` instead.
 */

import { seed } from './seed/index';

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
