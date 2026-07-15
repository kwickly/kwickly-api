import { Elysia } from 'elysia';
/**
 * Tenant Settings Controller
 * Path: /v1/tenant
 */
export declare const tenantController: Elysia<"/v1/tenant", {
    decorator: any;
    store: {
        [x: string]: any;
    };
    derive: any;
    resolve: any;
}, any, any, {
    v1: {
        tenant: {};
    };
} & {
    v1: {
        tenant: any;
    };
} & {
    v1: {
        tenant: {
            settings: {
                get: {
                    body: any;
                    params: any;
                    query: any;
                    headers: any;
                    response: {
                        [x: string]: any;
                        [x: number]: any;
                        [x: symbol]: any;
                    };
                };
            };
        };
    };
} & {
    v1: {
        tenant: {
            settings: {
                patch: {
                    body: any;
                    params: any;
                    query: any;
                    headers: any;
                    response: {
                        [x: string]: any;
                        [x: number]: any;
                        [x: symbol]: any;
                    };
                };
            };
        };
    };
} & {
    v1: {
        tenant: {
            "audit-logs": {
                get: {
                    body: any;
                    params: any;
                    query: any;
                    headers: any;
                    response: {
                        [x: string]: any;
                        [x: number]: any;
                        [x: symbol]: any;
                    };
                };
            };
        };
    };
}, any, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
} & {
    derive: {
        readonly user: null;
    } | {
        readonly user: import("../auth/auth.guard.ts").JwtPayload;
    };
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: import("elysia").ExtractErrorFromHandle<{
        readonly user: null;
    } | {
        readonly user: import("../auth/auth.guard.ts").JwtPayload;
    }>;
} & {
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
