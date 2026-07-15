import { Elysia } from 'elysia';
export declare const adsController: Elysia<"/v1/ads", {
    decorator: any;
    store: {
        [x: string]: any;
    };
    derive: any;
    resolve: any;
}, any, any, {
    v1: {
        ads: {
            get: {
                body: unknown;
                params: {};
                query: {
                    branchId?: string | undefined;
                };
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
                        data: {
                            id: string;
                            tenantId: string;
                            branchId: string | null;
                            title: string;
                            imageUrl: string;
                            link: string | null;
                            activeFrom: Date;
                            activeUntil: Date | null;
                            status: "ACTIVE" | "PAUSED" | "EXPIRED";
                            createdAt: Date;
                            updatedAt: Date;
                            deletedAt: Date | null;
                        }[];
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    v1: {
        ads: {
            ":id": {
                click: {
                    post: {
                        body: unknown;
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                success: boolean;
                            };
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    v1: {
        ads: {};
    };
} & {
    v1: {
        ads: any;
    };
} & {
    v1: {
        ads: {
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
