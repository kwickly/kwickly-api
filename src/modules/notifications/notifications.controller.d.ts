import { Elysia } from 'elysia';
export declare const notificationsController: Elysia<"/v1/notifications", {
    decorator: any;
    store: {
        [x: string]: any;
    };
    derive: any;
    resolve: any;
}, any, any, {
    v1: {
        notifications: {};
    };
} & {
    v1: {
        notifications: any;
    };
} & {
    v1: {
        notifications: {
            templates: {
                post: {
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
        notifications: {
            send: {
                post: {
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
