import { Elysia } from 'elysia';
/**
 * Permission check logic extracted for reuse in both plugins and individual handlers.
 */
export declare const checkPermission: (requiredSlugs: string | string[]) => ({ user, set, log }: any) => Promise<{
    error: string;
    message?: undefined;
} | {
    error: string;
    message: string;
} | undefined>;
/**
 * Middleware to enforce Granular Permission-Based Access Control.
 *
 * @param requiredSlugs Permission slug(s) required to access the route.
 */
export declare const requirePermission: (requiredSlugs: string | string[]) => (app: Elysia) => Elysia<"", {
    decorator: any;
    store: {
        [x: string]: any;
    };
    derive: any;
    resolve: any;
}, any, any, any, any, {
    derive: any;
    resolve: any;
    schema: any;
    standaloneSchema: any;
    response: {
        200: {
            error: string;
            message?: undefined;
        } | {
            error: string;
            message: string;
        };
    };
}>;
/**
 * @deprecated Use requirePermission instead for granular control.
 */
export declare const requireRoles: (allowedRoles: string[]) => (app: Elysia) => Elysia<"", {
    decorator: any;
    store: {
        [x: string]: any;
    };
    derive: any;
    resolve: any;
}, any, any, any, any, {
    derive: any;
    resolve: any;
    schema: any;
    standaloneSchema: any;
    response: {
        200: {
            error: string;
            message?: undefined;
        } | {
            error: string;
            message: string;
        };
    };
}>;
