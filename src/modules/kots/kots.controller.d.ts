import { Elysia } from 'elysia';
export declare const kotsController: Elysia<"/v1/kots", {
    decorator: any;
    store: {
        [x: string]: any;
    };
    derive: any;
    resolve: any;
}, any, any, {
    v1: {
        kots: {};
    };
} & {
    v1: {
        kots: any;
    };
} & {
    v1: {
        kots: {
            ":id": {
                status: {
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
