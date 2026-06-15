import { EventEmitter } from 'node:events';

/**
 * Global Event Bus for internal micro-communications (e.g., Service -> WebSocket Controller)
 */
export const eventBus = new EventEmitter();

export const EVENTS = {
  NEW_KOT: 'new_kot',
  KOT_UPDATED: 'kot_updated',
};
