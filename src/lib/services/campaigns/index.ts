/**
 * Campaign Services Index
 *
 * Main export file for the campaign execution infrastructure.
 */

// Types
export * from './types';

// Campaign Execution Service
export {
  CampaignExecutionService,
  getCampaignExecutionService,
} from './campaign-execution-service';

// Event Emitter
export {
  CampaignEventEmitter,
  getCampaignEventEmitter,
  emitCampaignEvent,
  emitCampaignEventAsync,
  CampaignEvents,
} from './event-emitter';
