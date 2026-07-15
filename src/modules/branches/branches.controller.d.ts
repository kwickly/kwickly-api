import { Elysia } from 'elysia';
/**
 * Branches Controller
 * Provides RESTful endpoints for managing physical restaurant locations.
 * Base Path: /v1/branches
 */
export declare const branchesController: Elysia<"/v1/branches", {
    decorator: any;
    store: {
        [x: string]: any;
    };
    derive: any;
    resolve: any;
}, any, any, {
    v1: {
        branches: {};
    };
} & {
    v1: {
        branches: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
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
                            name: string;
                            address: string | null;
                            phone: string | null;
                            latitude: number | null;
                            longitude: number | null;
                            openingHours: unknown;
                            currency: string | null;
                            status: "ACTIVE" | "TEMPORARILY_CLOSED" | "PERMANENTLY_CLOSED";
                            managerId: string | null;
                            createdAt: Date;
                            updatedAt: Date;
                            deletedAt: Date | null;
                        }[];
                    };
                };
            };
        };
    };
} & {
    v1: {
        branches: any;
    };
} & {
    v1: {
        branches: {
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
} & {
    v1: {
        branches: {
            ":id": {
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
