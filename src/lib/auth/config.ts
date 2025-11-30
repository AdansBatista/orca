import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

import { db } from '@/lib/db';
import { verifyPassword } from './password';
import type { SessionUser } from './types';

// Login credentials schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Session configuration
const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds
const SESSION_UPDATE_AGE = 30 * 60; // 30 minutes - refresh session if older

// Failed login configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate input
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        // Find user
        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            clinic: {
              select: { id: true, name: true, isActive: true },
            },
          },
        });

        if (!user) {
          return null;
        }

        // Check if user is active
        if (!user.isActive) {
          throw new Error('ACCOUNT_DISABLED');
        }

        // Check if clinic is active
        if (!user.clinic.isActive) {
          throw new Error('CLINIC_DISABLED');
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error('ACCOUNT_LOCKED');
        }

        // Verify password
        if (!user.passwordHash) {
          return null;
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
          // Increment failed attempts
          const failedAttempts = user.failedAttempts + 1;
          const updateData: { failedAttempts: number; lockedUntil?: Date } = {
            failedAttempts,
          };

          // Lock account if too many failures
          if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
            updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
          }

          await db.user.update({
            where: { id: user.id },
            data: updateData,
          });

          if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
            throw new Error('ACCOUNT_LOCKED');
          }

          return null;
        }

        // Success - reset failed attempts and update last login
        await db.user.update({
          where: { id: user.id },
          data: {
            failedAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        // Return user data for session
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          clinicId: user.clinicId,
          clinicIds: user.clinicIds,
          avatar: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in - add user data to token
      if (user) {
        const sessionUser = user as SessionUser;
        token.id = sessionUser.id;
        token.email = sessionUser.email;
        token.firstName = sessionUser.firstName;
        token.lastName = sessionUser.lastName;
        token.name = sessionUser.name;
        token.role = sessionUser.role;
        token.clinicId = sessionUser.clinicId;
        token.clinicIds = sessionUser.clinicIds;
        token.avatar = sessionUser.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.name = token.name as string;
        session.user.role = token.role as SessionUser['role'];
        session.user.clinicId = token.clinicId as string;
        session.user.clinicIds = token.clinicIds as string[];
        session.user.avatar = token.avatar as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },
  // Trust the host in development/local production builds
  // In true production, this should be handled via AUTH_TRUST_HOST env var
  trustHost: true,
};
