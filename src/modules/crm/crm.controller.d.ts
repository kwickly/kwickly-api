import { Elysia } from 'elysia';
export declare const crmController: Elysia<"/v1/crm", {
    decorator: any;
    store: {
        [x: string]: any;
    };
    derive: any;
    resolve: any;
}, any, any, {
    v1: {
        crm: {};
    };
} & {
    v1: {
        crm: {
            "my-profile": {
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
                                loyaltyPointsBalance: string;
                                walletTransactions: {
                                    id: string;
                                    tenantId: string;
                                    userId: string;
                                    orderId: string | null;
                                    amount: string;
                                    type: "CREDIT" | "DEBIT";
                                    reason: string;
                                    createdAt: Date;
                                    deletedAt: Date | null;
                                }[];
                                loyaltyLedgers: {
                                    id: string;
                                    tenantId: string;
                                    userId: string;
                                    orderId: string | null;
                                    points: string;
                                    reason: string;
                                    createdAt: Date;
                                    deletedAt: Date | null;
                                }[];
                                id: string;
                                tenantId: string;
                                userId: string;
                                dateOfBirth: Date | null;
                                anniversaryDate: Date | null;
                                marketingOptIn: boolean;
                                lifetimeValue: string;
                                walletBalance: string;
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    v1: {
        crm: {
            "my-profile": {
                post: {
                    body: {
                        dateOfBirth?: Date | undefined;
                        anniversaryDate?: Date | undefined;
                        marketingOptIn?: boolean | undefined;
                    };
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
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                                tenantId: string;
                                userId: string;
                                dateOfBirth: Date | null;
                                anniversaryDate: Date | null;
                                marketingOptIn: boolean;
                                lifetimeValue: string;
                                walletBalance: string;
                            };
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
} & {
    v1: {
        crm: any;
    };
} & {
    v1: {
        crm: {
            customers: {
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
        crm: {
            customers: {
                ":id": {
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
    };
} & {
    v1: {
        crm: {
            loyalty: {
                adjust: {
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
    };
} & {
    v1: {
        crm: {
            customers: {
                "register-offline": {
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
    };
} & {
    v1: {
        crm: {
            customers: {
                "register-offline": {
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
    };
} & {
    v1: {
        crm: {
            customers: {
                ":id": {
                    wallet: {
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
        };
    };
} & {
    v1: {
        crm: {
            segments: {
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
        crm: {
            segments: {
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
        crm: {
            campaigns: {
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
        crm: {
            campaigns: {
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
        crm: {
            loyalty: {
                config: {
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
    };
} & {
    v1: {
        crm: {
            loyalty: {
                config: {
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
    };
} & {
    v1: {
        crm: {
            "churn-prevention": {
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
