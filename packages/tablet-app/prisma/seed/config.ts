import type { SeedConfig } from './types';

/**
 * Predefined seed profiles for different use cases
 */
export const profiles: Record<string, SeedConfig> = {
  /**
   * Minimal profile - Fast resets for quick development iterations
   * - 1 clinic, 5 users, 10 patients
   * - Only Phase 1 (Foundation) data
   */
  minimal: {
    counts: {
      clinics: 1,
      usersPerClinic: 5,
      patientsPerClinic: 10,
      staffPerClinic: 4,
      appointmentsPerClinic: 20,
    },
    mode: 'minimal',
    clearBeforeSeed: true,
    areas: null,
    maxPhase: 1,
  },

  /**
   * Standard profile - Realistic development environment
   * - 1 clinic, 20 users, 50 patients
   * - All phases included
   */
  standard: {
    counts: {
      clinics: 1,
      usersPerClinic: 20,
      patientsPerClinic: 50,
      staffPerClinic: 10,
      appointmentsPerClinic: 100,
    },
    mode: 'standard',
    clearBeforeSeed: true,
    areas: null,
    maxPhase: 5,
  },

  /**
   * Full profile - Large dataset for performance testing
   * - 3 clinics, 30 users each, 200 patients each
   * - All phases included
   */
  full: {
    counts: {
      clinics: 3,
      usersPerClinic: 30,
      patientsPerClinic: 200,
      staffPerClinic: 15,
      appointmentsPerClinic: 500,
    },
    mode: 'full',
    clearBeforeSeed: true,
    areas: null,
    maxPhase: 5,
  },
};

/**
 * Default configuration (standard profile)
 */
export const defaultConfig: SeedConfig = profiles.standard;

/**
 * Get configuration by profile name
 */
export function getProfile(name: string): SeedConfig {
  const profile = profiles[name];
  if (!profile) {
    throw new Error(
      `Unknown profile: ${name}. Available: ${Object.keys(profiles).join(', ')}`
    );
  }
  return profile;
}

/**
 * Merge partial config with defaults
 */
export function mergeConfig(partial: Partial<SeedConfig>): SeedConfig {
  return {
    ...defaultConfig,
    ...partial,
    counts: {
      ...defaultConfig.counts,
      ...partial.counts,
    },
  };
}
