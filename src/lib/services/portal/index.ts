/**
 * Portal Services
 *
 * Exports all patient portal related services.
 */

export { getPortalAuthService, PortalAuthService } from './auth-service';
export type { PortalAuthResult, TokenResult } from './auth-service';

export { getPortalSession, requirePortalSession } from './session-helper';
export type { PortalSession } from './session-helper';
