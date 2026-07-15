import { Elysia } from 'elysia';
export declare const promotionsController: Elysia<"/v1/promotions", {
    decorator: any;
    store: {
        [x: string]: any;
    };
    derive: any;
    resolve: any;
}, any, any, {
    v1: {
        promotions: {};
    };
} & {
    v1: {
        promotions: {
            coupons: {
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
                                code: string;
                                discountType: "PERCENTAGE" | "FLAT";
                                discountValue: string;
                                minOrderValue: string | null;
                                maxDiscountAmount: string | null;
                                validFrom: Date | null;
                                validUntil: Date | null;
                                usageLimit: number | null;
                                usedCount: number;
                                status: "ACTIVE" | "PAUSED" | "EXPIRED";
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                            }[];
                        };
                    };
                };
            };
        };
    };
} & {
    v1: {
        promotions: {
            "predefined-discounts": {
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
                                discountType: "PERCENTAGE" | "FLAT";
                                discountValue: string;
                                requiresManagerPin: boolean;
                                status: "ACTIVE" | "PAUSED" | "EXPIRED";
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                            }[];
                        };
                    };
                };
            };
        };
    };
} & {
    v1: {
        promotions: any;
    };
} & {
    v1: {
        promotions: {
            coupons: {
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
        promotions: {
            "predefined-discounts": {
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
