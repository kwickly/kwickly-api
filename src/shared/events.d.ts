import { EventEmitter } from 'node:events';
/**
 * Global Event Bus for internal micro-communications (e.g., Service -> WebSocket Controller)
 */
export declare const eventBus: EventEmitter<any>;
export declare const EVENTS: {
    NEW_KOT: string;
    KOT_UPDATED: string;
    MENU_SYNC: string;
};
