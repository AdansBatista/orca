/**
 * Messaging Service Index
 *
 * Main export file for the messaging infrastructure.
 */

// Types
export * from './types';

// Service
export { MessagingService, getMessagingService } from './messaging-service';
export type { CreateMessageInput, SendMessageResult } from './messaging-service';

// Providers
export {
  BaseMessageProvider,
  TwilioProvider,
  getTwilioProvider,
  SendGridProvider,
  getSendGridProvider,
} from './providers';
