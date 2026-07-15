import { Elysia } from 'elysia';
/**
 * Global Audit Middleware
 * Intercepts all requests. If the request is mutating (POST, PUT, PATCH, DELETE)
 * AND the user is authenticated, it asynchronously records the action to the database.
 */
export declare const auditPlugin: (app: Elysia) => Elysia<"", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}>;
