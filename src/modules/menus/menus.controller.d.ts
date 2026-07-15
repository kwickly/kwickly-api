import { Elysia } from 'elysia';
/**
 * Menus Controller
 * Provides RESTful endpoints for managing and retrieving Restaurant Menus.
 * Base Path: /v1/menus
 */
export declare const menusController: Elysia<"/v1/menus", {
    decorator: any;
    store: {
        [x: string]: any;
    };
    derive: any;
    resolve: any;
}, any, any, {
    v1: {
        menus: {
            public: {
                ":slug": {
                    get: {
                        body: unknown;
                        params: {
                            slug: string;
                        } & {};
                        query: {
                            search?: string | undefined;
                            branchId?: string | undefined;
                            limit?: string | undefined;
                            page?: string | undefined;
                        };
                        headers: unknown;
                        response: {
                            200: {
                                success: boolean;
                                error: string;
                            } | {
                                data: {
                                    items: {
                                        variants: {
                                            id: string;
                                            menuItemId: string;
                                            name: string;
                                            priceDelta: string;
                                            isDefault: boolean;
                                            deletedAt: Date | null;
                                        }[];
                                        addons: {
                                            id: string;
                                            tenantId: string;
                                            menuItemId: string | null;
                                            name: string;
                                            price: string;
                                            status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
                                            deletedAt: Date | null;
                                        }[];
                                        id: string;
                                        tenantId: string;
                                        categoryId: string;
                                        name: string;
                                        description: string | null;
                                        price: string;
                                        imageUrl: string | null;
                                        isVeg: boolean;
                                        isJain: boolean;
                                        isGlutenFree: boolean;
                                        spiceLevel: number | null;
                                        availability: "always" | "time_window" | "days";
                                        availableFrom: string | null;
                                        availableUntil: string | null;
                                        sortOrder: number;
                                        status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
                                        createdAt: Date;
                                        updatedAt: Date;
                                        deletedAt: Date | null;
                                    }[];
                                    id: string;
                                    tenantId: string;
                                    name: string;
                                    imageUrl: string | null;
                                    sortOrder: number;
                                    status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
                                    createdAt: Date;
                                    updatedAt: Date;
                                    deletedAt: Date | null;
                                }[];
                                meta: {
                                    total: number;
                                    page: number;
                                    limit: number;
                                    totalPages: number;
                                };
                                success: boolean;
                                error?: undefined;
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
        menus: {};
    };
} & {
    v1: {
        menus: {
            ":branchId": {
                get: {
                    body: unknown;
                    params: {
                        branchId: string;
                    } & {};
                    query: {
                        search?: string | undefined;
                        limit?: string | undefined;
                        page?: string | undefined;
                    };
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            message: string;
                        } | {
                            data: {
                                items: {
                                    variants: {
                                        id: string;
                                        menuItemId: string;
                                        name: string;
                                        priceDelta: string;
                                        isDefault: boolean;
                                        deletedAt: Date | null;
                                    }[];
                                    addons: {
                                        id: string;
                                        tenantId: string;
                                        menuItemId: string | null;
                                        name: string;
                                        price: string;
                                        status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
                                        deletedAt: Date | null;
                                    }[];
                                    id: string;
                                    tenantId: string;
                                    categoryId: string;
                                    name: string;
                                    description: string | null;
                                    price: string;
                                    imageUrl: string | null;
                                    isVeg: boolean;
                                    isJain: boolean;
                                    isGlutenFree: boolean;
                                    spiceLevel: number | null;
                                    availability: "always" | "time_window" | "days";
                                    availableFrom: string | null;
                                    availableUntil: string | null;
                                    sortOrder: number;
                                    status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
                                    createdAt: Date;
                                    updatedAt: Date;
                                    deletedAt: Date | null;
                                }[];
                                id: string;
                                tenantId: string;
                                name: string;
                                imageUrl: string | null;
                                sortOrder: number;
                                status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                            }[];
                            meta: {
                                total: number;
                                page: number;
                                limit: number;
                                totalPages: number;
                            };
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
} & {
    v1: {
        menus: any;
    };
} & {
    v1: {
        menus: {
            categories: {
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
        menus: {
            items: {
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
        menus: {
            items: {
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
    };
} & {
    v1: {
        menus: {
            items: {
                ":id": {
                    delete: {
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
        menus: {
            categories: {
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
    };
} & {
    v1: {
        menus: {
            categories: {
                ":id": {
                    delete: {
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
        menus: {
            addons: {
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
        menus: {
            addons: {
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
        menus: {
            items: {
                ":id": {
                    variants: {
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
        menus: {
            variants: {
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
    };
} & {
    v1: {
        menus: {
            variants: {
                ":id": {
                    delete: {
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
        menus: {
            sync: {
                ":branchId": {
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
