/**
 * Portal Authentication Service
 *
 * Handles patient portal authentication including:
 * - Magic link authentication
 * - Password-based authentication
 * - Session management
 * - Password reset
 * - Email verification
 */

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { hash, compare } from 'bcryptjs';
import { randomBytes } from 'crypto';
import type { PortalActivityType } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface PortalAuthResult {
  success: boolean;
  sessionToken?: string;
  account?: {
    id: string;
    email: string;
    patientId: string;
    clinicId: string;
    patientName: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface TokenResult {
  success: boolean;
  token?: string;
  error?: {
    code: string;
    message: string;
  };
}

// =============================================================================
// Constants
// =============================================================================

const MAGIC_LINK_EXPIRY_MINUTES = 15;
const PASSWORD_RESET_EXPIRY_HOURS = 1;
const VERIFICATION_EXPIRY_HOURS = 24;
const SESSION_EXPIRY_DAYS = 30;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;
const BCRYPT_ROUNDS = 12;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Generate a short numeric code for 2FA or verification
 */
function generateCode(length = 6): string {
  const chars = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Detect device type from user agent
 */
function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) {
    return /tablet|ipad/.test(ua) ? 'tablet' : 'mobile';
  }
  return 'desktop';
}

/**
 * Extract device name from user agent
 */
function extractDeviceName(userAgent: string): string {
  // Simple extraction - could be enhanced with a proper user-agent parser
  if (/iPhone/.test(userAgent)) return 'iPhone';
  if (/iPad/.test(userAgent)) return 'iPad';
  if (/Android/.test(userAgent)) return 'Android Device';
  if (/Chrome/.test(userAgent)) return 'Chrome Browser';
  if (/Safari/.test(userAgent)) return 'Safari Browser';
  if (/Firefox/.test(userAgent)) return 'Firefox Browser';
  if (/Edge/.test(userAgent)) return 'Edge Browser';
  return 'Unknown Device';
}

// =============================================================================
// Portal Auth Service
// =============================================================================

class PortalAuthService {
  /**
   * Find or create a portal account for a patient
   */
  async findOrCreateAccount(
    clinicId: string,
    patientId: string,
    email: string
  ): Promise<{ account: { id: string; email: string; status: string } | null; isNew: boolean }> {
    // Check if account already exists
    const existing = await db.portalAccount.findFirst({
      where: withSoftDelete({
        clinicId,
        patientId,
      }),
      select: { id: true, email: true, status: true },
    });

    if (existing) {
      return { account: existing, isNew: false };
    }

    // Create new account
    const newAccount = await db.portalAccount.create({
      data: {
        clinicId,
        patientId,
        email,
        status: 'PENDING',
      },
      select: { id: true, email: true, status: true },
    });

    return { account: newAccount, isNew: true };
  }

  /**
   * Request a magic link for passwordless authentication
   */
  async requestMagicLink(
    email: string,
    clinicSlug: string
  ): Promise<TokenResult> {
    // Find clinic
    const clinic = await db.clinic.findUnique({
      where: { slug: clinicSlug },
      select: { id: true, name: true },
    });

    if (!clinic) {
      return {
        success: false,
        error: { code: 'CLINIC_NOT_FOUND', message: 'Clinic not found' },
      };
    }

    // Find patient with matching email
    const patient = await db.patient.findFirst({
      where: withSoftDelete({
        clinicId: clinic.id,
        email: email.toLowerCase(),
      }),
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!patient) {
      // Don't reveal whether email exists - always return success
      // This prevents email enumeration attacks
      return { success: true, token: undefined };
    }

    // Find or create portal account
    const { account } = await this.findOrCreateAccount(
      clinic.id,
      patient.id,
      patient.email!
    );

    if (!account) {
      return {
        success: false,
        error: { code: 'ACCOUNT_ERROR', message: 'Unable to create account' },
      };
    }

    // Check if account is locked or deactivated
    const fullAccount = await db.portalAccount.findUnique({
      where: { id: account.id },
    });

    if (fullAccount?.status === 'DEACTIVATED') {
      return {
        success: false,
        error: { code: 'ACCOUNT_DEACTIVATED', message: 'Account has been deactivated' },
      };
    }

    if (fullAccount?.status === 'LOCKED' && fullAccount.lockedUntil && fullAccount.lockedUntil > new Date()) {
      return {
        success: false,
        error: { code: 'ACCOUNT_LOCKED', message: 'Account is temporarily locked' },
      };
    }

    // Generate magic link token
    const token = generateToken();
    const expires = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

    // Save token to account
    await db.portalAccount.update({
      where: { id: account.id },
      data: {
        magicLinkToken: token,
        magicLinkExpires: expires,
        status: fullAccount?.status === 'PENDING' ? 'PENDING' : fullAccount?.status,
      },
    });

    // In production, this token would be sent via email
    // For now, return it (in production, always return success without token)
    return { success: true, token };
  }

  /**
   * Verify magic link and create session
   */
  async verifyMagicLink(
    token: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<PortalAuthResult> {
    // Find account with valid token
    const account = await db.portalAccount.findFirst({
      where: withSoftDelete({
        magicLinkToken: token,
        magicLinkExpires: { gt: new Date() },
      }),
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!account) {
      return {
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired link' },
      };
    }

    // Clear magic link token and activate account if pending
    await db.portalAccount.update({
      where: { id: account.id },
      data: {
        magicLinkToken: null,
        magicLinkExpires: null,
        emailVerified: true,
        emailVerifiedAt: account.emailVerified ? undefined : new Date(),
        status: account.status === 'PENDING' ? 'ACTIVE' : account.status,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        lastLoginUserAgent: userAgent,
      },
    });

    // Create session
    const sessionToken = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await db.portalSession.create({
      data: {
        accountId: account.id,
        sessionToken,
        userAgent,
        ipAddress,
        deviceType: userAgent ? detectDeviceType(userAgent) : undefined,
        deviceName: userAgent ? extractDeviceName(userAgent) : undefined,
        expiresAt,
      },
    });

    // Log activity
    await this.logActivity(account.id, 'LOGIN', 'Logged in via magic link', ipAddress, userAgent);

    return {
      success: true,
      sessionToken,
      account: {
        id: account.id,
        email: account.email,
        patientId: account.patientId,
        clinicId: account.clinicId,
        patientName: `${account.patient.firstName} ${account.patient.lastName}`,
      },
    };
  }

  /**
   * Login with email and password
   */
  async login(
    email: string,
    password: string,
    clinicSlug: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<PortalAuthResult> {
    // Find clinic
    const clinic = await db.clinic.findUnique({
      where: { slug: clinicSlug },
      select: { id: true },
    });

    console.log('[PortalAuth] Clinic lookup:', { clinicSlug, found: !!clinic, clinicId: clinic?.id });

    if (!clinic) {
      return {
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      };
    }

    // Find account
    const account = await db.portalAccount.findFirst({
      where: withSoftDelete({
        clinicId: clinic.id,
        email: email.toLowerCase(),
      }),
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    console.log('[PortalAuth] Account lookup:', {
      email: email.toLowerCase(),
      clinicId: clinic.id,
      found: !!account,
      hasPasswordHash: !!account?.passwordHash,
      status: account?.status
    });

    if (!account || !account.passwordHash) {
      // Log failed attempt if account exists
      if (account) {
        await this.handleFailedLogin(account.id, ipAddress, userAgent);
      }
      return {
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      };
    }

    // Check if locked
    if (account.status === 'LOCKED' && account.lockedUntil && account.lockedUntil > new Date()) {
      return {
        success: false,
        error: { code: 'ACCOUNT_LOCKED', message: 'Account is temporarily locked. Please try again later.' },
      };
    }

    if (account.status === 'DEACTIVATED') {
      return {
        success: false,
        error: { code: 'ACCOUNT_DEACTIVATED', message: 'Account has been deactivated' },
      };
    }

    // Verify password
    const isValid = await compare(password, account.passwordHash);

    if (!isValid) {
      await this.handleFailedLogin(account.id, ipAddress, userAgent);
      return {
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      };
    }

    // Check email verification
    if (!account.emailVerified) {
      return {
        success: false,
        error: { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email address first' },
      };
    }

    // Clear failed attempts and update login info
    await db.portalAccount.update({
      where: { id: account.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        status: account.status === 'LOCKED' ? 'ACTIVE' : account.status,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        lastLoginUserAgent: userAgent,
      },
    });

    // Create session
    const sessionToken = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await db.portalSession.create({
      data: {
        accountId: account.id,
        sessionToken,
        userAgent,
        ipAddress,
        deviceType: userAgent ? detectDeviceType(userAgent) : undefined,
        deviceName: userAgent ? extractDeviceName(userAgent) : undefined,
        expiresAt,
      },
    });

    // Log activity
    await this.logActivity(account.id, 'LOGIN', 'Logged in with password', ipAddress, userAgent);

    return {
      success: true,
      sessionToken,
      account: {
        id: account.id,
        email: account.email,
        patientId: account.patientId,
        clinicId: account.clinicId,
        patientName: `${account.patient.firstName} ${account.patient.lastName}`,
      },
    };
  }

  /**
   * Register a new portal account with password
   */
  async register(
    email: string,
    password: string,
    clinicSlug: string
  ): Promise<TokenResult> {
    // Find clinic
    const clinic = await db.clinic.findUnique({
      where: { slug: clinicSlug },
      select: { id: true },
    });

    if (!clinic) {
      return {
        success: false,
        error: { code: 'CLINIC_NOT_FOUND', message: 'Clinic not found' },
      };
    }

    // Find patient with matching email
    const patient = await db.patient.findFirst({
      where: withSoftDelete({
        clinicId: clinic.id,
        email: email.toLowerCase(),
      }),
      select: { id: true, email: true },
    });

    if (!patient) {
      return {
        success: false,
        error: { code: 'PATIENT_NOT_FOUND', message: 'No patient record found for this email. Please contact the clinic.' },
      };
    }

    // Check if account already exists
    const existingAccount = await db.portalAccount.findFirst({
      where: withSoftDelete({
        clinicId: clinic.id,
        patientId: patient.id,
      }),
    });

    if (existingAccount && existingAccount.passwordHash) {
      return {
        success: false,
        error: { code: 'ACCOUNT_EXISTS', message: 'An account already exists for this email' },
      };
    }

    // Hash password
    const passwordHash = await hash(password, BCRYPT_ROUNDS);

    // Generate verification token
    const verificationToken = generateToken();
    const verificationExpires = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);

    if (existingAccount) {
      // Update existing account with password
      await db.portalAccount.update({
        where: { id: existingAccount.id },
        data: {
          passwordHash,
          verificationToken,
          verificationExpires,
          termsAcceptedAt: new Date(),
        },
      });
    } else {
      // Create new account
      await db.portalAccount.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          email: patient.email!.toLowerCase(),
          passwordHash,
          status: 'PENDING',
          verificationToken,
          verificationExpires,
          termsAcceptedAt: new Date(),
        },
      });
    }

    // In production, send verification email
    return { success: true, token: verificationToken };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; error?: { code: string; message: string } }> {
    const account = await db.portalAccount.findFirst({
      where: withSoftDelete({
        verificationToken: token,
        verificationExpires: { gt: new Date() },
      }),
    });

    if (!account) {
      return {
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired verification link' },
      };
    }

    await db.portalAccount.update({
      where: { id: account.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        verificationToken: null,
        verificationExpires: null,
        status: 'ACTIVE',
      },
    });

    return { success: true };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string, clinicSlug: string): Promise<TokenResult> {
    // Find clinic
    const clinic = await db.clinic.findUnique({
      where: { slug: clinicSlug },
      select: { id: true },
    });

    if (!clinic) {
      // Don't reveal if clinic exists
      return { success: true };
    }

    // Find account
    const account = await db.portalAccount.findFirst({
      where: withSoftDelete({
        clinicId: clinic.id,
        email: email.toLowerCase(),
      }),
    });

    if (!account) {
      // Don't reveal if email exists
      return { success: true };
    }

    // Generate reset token
    const resetToken = generateToken();
    const resetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000);

    await db.portalAccount.update({
      where: { id: account.id },
      data: {
        resetToken,
        resetTokenExpires: resetExpires,
      },
    });

    // In production, send reset email
    return { success: true, token: resetToken };
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: { code: string; message: string } }> {
    const account = await db.portalAccount.findFirst({
      where: withSoftDelete({
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      }),
    });

    if (!account) {
      return {
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired reset link' },
      };
    }

    // Hash new password
    const passwordHash = await hash(newPassword, BCRYPT_ROUNDS);

    await db.portalAccount.update({
      where: { id: account.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        status: account.status === 'LOCKED' ? 'ACTIVE' : account.status,
      },
    });

    // Revoke all existing sessions for security
    await db.portalSession.updateMany({
      where: {
        accountId: account.id,
        isActive: true,
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: 'password_reset',
      },
    });

    // Log activity
    await this.logActivity(account.id, 'PASSWORD_RESET', 'Password was reset');

    return { success: true };
  }

  /**
   * Validate session token and return account info
   */
  async validateSession(
    sessionToken: string
  ): Promise<PortalAuthResult> {
    const session = await db.portalSession.findFirst({
      where: {
        sessionToken,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        account: {
          include: {
            patient: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!session || !session.account || session.account.deletedAt) {
      return {
        success: false,
        error: { code: 'INVALID_SESSION', message: 'Session is invalid or expired' },
      };
    }

    if (session.account.status !== 'ACTIVE') {
      return {
        success: false,
        error: { code: 'ACCOUNT_INACTIVE', message: 'Account is not active' },
      };
    }

    // Update last activity
    await db.portalSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    });

    return {
      success: true,
      sessionToken,
      account: {
        id: session.account.id,
        email: session.account.email,
        patientId: session.account.patientId,
        clinicId: session.account.clinicId,
        patientName: `${session.account.patient.firstName} ${session.account.patient.lastName}`,
      },
    };
  }

  /**
   * Logout and revoke session
   */
  async logout(
    sessionToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean }> {
    const session = await db.portalSession.findFirst({
      where: { sessionToken },
    });

    if (!session) {
      return { success: true }; // Already logged out
    }

    await db.portalSession.update({
      where: { id: session.id },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: 'logout',
      },
    });

    // Log activity
    await this.logActivity(session.accountId, 'LOGOUT', 'Logged out', ipAddress, userAgent);

    return { success: true };
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(
    accountId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const account = await db.portalAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) return;

    const newFailedAttempts = account.failedLoginAttempts + 1;
    const shouldLock = newFailedAttempts >= MAX_FAILED_ATTEMPTS;

    await db.portalAccount.update({
      where: { id: accountId },
      data: {
        failedLoginAttempts: newFailedAttempts,
        status: shouldLock ? 'LOCKED' : account.status,
        lockedUntil: shouldLock
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
          : account.lockedUntil,
      },
    });

    // Log activity
    await this.logActivity(accountId, 'LOGIN_FAILED', `Failed login attempt (${newFailedAttempts}/${MAX_FAILED_ATTEMPTS})`, ipAddress, userAgent);
  }

  /**
   * Log portal activity
   */
  private async logActivity(
    accountId: string,
    activityType: PortalActivityType,
    description?: string,
    ipAddress?: string,
    userAgent?: string,
    relatedType?: string,
    relatedId?: string
  ): Promise<void> {
    await db.portalActivityLog.create({
      data: {
        accountId,
        activityType,
        description,
        ipAddress,
        userAgent,
        relatedType,
        relatedId,
      },
    });
  }
}

// Singleton instance
let portalAuthService: PortalAuthService | null = null;

/**
 * Get portal auth service instance
 */
export function getPortalAuthService(): PortalAuthService {
  if (!portalAuthService) {
    portalAuthService = new PortalAuthService();
  }
  return portalAuthService;
}

export { PortalAuthService };
