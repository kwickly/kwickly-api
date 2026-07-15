import { Elysia } from 'elysia';
export declare const analyticsController: Elysia<"/v1/analytics", {
    decorator: any;
    store: {
        [x: string]: any;
    };
    derive: any;
    resolve: any;
}, any, any, {
    v1: {
        analytics: {};
    };
} & {
    v1: {
        analytics: any;
    };
} & {
    v1: {
        analytics: {
            sales: {
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
        analytics: {
            "top-items": {
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
        analytics: {
            "ai-forecast": {
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
        analytics: {
            "ai-combos": {
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
        analytics: {
            "weekly-revenue": {
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
        analytics: {
            "hourly-sales": {
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
