import type { SeedContext } from '../types';
import { orthoGenerator } from '../generators';

/**
 * Seed core data: Clinics and system settings.
 * This must run before any other seeds as everything depends on clinics.
 */
export async function seedCore(ctx: SeedContext): Promise<void> {
  const { db, config, idTracker, logger } = ctx;
  const { clinics: clinicCount } = config.counts;

  logger.startArea('Core (Clinics)');

  // Create clinics
  for (let i = 0; i < clinicCount; i++) {
    const isFirst = i === 0;
    const clinicNumber = i + 1;

    const address = orthoGenerator.address();

    const clinic = await db.clinic.create({
      data: {
        name: isFirst ? 'Smile Orthodontics' : `Smile Orthodontics - ${address.city}`,
        code: isFirst ? 'MAIN' : `SAT${clinicNumber}`,
        address: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
        phone: orthoGenerator.phoneNumber(),
        email: isFirst
          ? 'info@smileortho.com'
          : `${address.city.toLowerCase()}@smileortho.com`,
        isActive: true,
        settings: {
          timezone: 'America/New_York',
          appointmentDuration: 20,
          workingHours: {
            monday: { start: '08:00', end: '17:00' },
            tuesday: { start: '08:00', end: '17:00' },
            wednesday: { start: '08:00', end: '17:00' },
            thursday: { start: '08:00', end: '17:00' },
            friday: { start: '08:00', end: '17:00' },
          },
        },
      },
    });

    idTracker.add('Clinic', clinic.id);
    logger.info(`Created clinic: ${clinic.name} (${clinic.code})`);
  }

  logger.endArea('Core (Clinics)', clinicCount);
}

/**
 * Clear core data.
 * WARNING: This will cascade delete all clinic-scoped data!
 */
export async function clearCore(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.warn('Clearing all clinics (this will cascade delete all data)...');

  // In a real implementation, you'd want to be more careful here
  // For now, we'll just delete clinics and let the cascade handle the rest
  await db.clinic.deleteMany({});

  logger.info('Clinics cleared');
}
