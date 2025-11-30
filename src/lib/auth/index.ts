import NextAuth from 'next-auth';
import { authConfig } from './config';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);

// Re-export types and utilities
export * from './types';
export * from './password';
export * from './permissions';
export * from './with-auth';
