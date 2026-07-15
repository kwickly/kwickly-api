import { Elysia } from 'elysia';
export declare const combosController: Elysia<"/v1/combos", {
    decorator: any;
    store: {
        [x: string]: any;
    };
    derive: any;
    resolve: any;
}, any, any, {
    v1: {
        combos: {};
    };
} & {
    v1: {
        combos: {
            get: {
                body: unknown;
                params: {};
                query: {
                    branchId?: string | undefined;
                };
                headers: unknown;
                response: {
                    200: {
                        error: string;
                        message: string;
                    } | {
                        success: boolean;
                        data: {
                            id: string;
                            tenantId: string;
                            branchId: string | null;
                            name: string;
                            description: string | null;
                            imageUrl: string | null;
                            price: string;
                            availableFrom: string | null;
                            availableUntil: string | null;
                            status: "ACTIVE" | "PAUSED";
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
        combos: any;
    };
} & {
    v1: {
        combos: {
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
    response: {
        200: {
            error: string;
            message: string;
        };
    };
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
