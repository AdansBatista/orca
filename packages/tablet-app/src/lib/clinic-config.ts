/**
 * Clinic Branding Configuration
 *
 * Centralized configuration for clinic-specific branding in the tablet app.
 * This allows easy customization for different clinics in the future.
 */

export interface ClinicBranding {
  /** Clinic name to display */
  name: string;
  /** Path to primary logo image */
  logo: string;
  /** Path to small logomark/icon (for compact spaces) */
  logomark?: string;
  /** Primary brand color (hex) */
  primaryColor?: string;
  /** Accent color (hex) */
  accentColor?: string;
}

/**
 * Default clinic branding (Willow Orthodontics)
 */
export const DEFAULT_CLINIC_BRANDING: ClinicBranding = {
  name: 'Willow Orthodontics',
  logo: '/WillowPrimaryTransparent trimmed.png',
  logomark: '/Secondarylogo(WO)blacktransparent.png',
  primaryColor: '#06b6d4', // Teal/Cyan
  accentColor: '#00a8b5', // Darker teal
};

/**
 * Get current clinic branding configuration
 *
 * Currently returns default branding. In the future, this could:
 * - Load from a config file
 * - Read from environment variables
 * - Fetch from a settings API
 */
export function getClinicBranding(): ClinicBranding {
  return DEFAULT_CLINIC_BRANDING;
}
