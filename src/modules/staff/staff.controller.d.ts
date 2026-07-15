import { Elysia } from 'elysia';
export declare const staffController: Elysia<"/v1/staff", {
    decorator: {
        jwt: {
            sign(signValue: {
                [x: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | {
                    [key: string]: string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined;
                nbf?: string | number | undefined;
                exp?: string | number | undefined;
                iat?: boolean | undefined;
                sub?: string | undefined;
                iss?: string | undefined;
                aud?: string | string[] | undefined;
                jti?: string | undefined;
            }): Promise<string>;
            verify(jwt?: string, options?: import("jose").JWTVerifyOptions): Promise<false | ({
                [x: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | {
                    [key: string]: string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined)[] | {
                    [key: string]: string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | (string | number | boolean | /*elided*/ any | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined)[] | /*elided*/ any | null | undefined;
                } | null | undefined;
            } & Omit<import("@elysiajs/jwt").JWTPayloadSpec, never>)>;
        };
    };
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
} & {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
}, {
    v1: {
        staff: {};
    };
} & {
    v1: {
        staff: {
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
                        error: string;
                        data?: undefined;
                    } | {
                        success: boolean;
                        data: {
                            id: string;
                            name: string;
                            phone: string | null;
                            email: string | null;
                            role: "platform_owner" | "super_admin" | "tenant_owner" | "manager" | "cashier" | "kitchen_staff" | "qr_scanner" | "staff" | "customer";
                            roleId: string | null;
                            roleName: string | null;
                            pin: string | null;
                            status: "ACTIVE" | "SUSPENDED" | "TERMINATED" | "ON_LEAVE";
                            salaryType: "HOURLY" | "MONTHLY" | null;
                            baseSalary: string | null;
                            hourlyRate: string | null;
                        }[];
                        error?: undefined;
                    };
                };
            };
        };
    };
} & {
    v1: {
        staff: {
            post: {
                body: {
                    branchId?: string | undefined;
                    salaryType?: "HOURLY" | "MONTHLY" | undefined;
                    baseSalary?: string | undefined;
                    hourlyRate?: string | undefined;
                    name: string;
                    phone: string;
                    roleId: string;
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
                        error: string;
                        data?: undefined;
                    } | {
                        success: boolean;
                        data: {
                            profile: {
                                id: string;
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                                tenantId: string;
                                userId: string;
                                emergencyContact: string | null;
                                joiningDate: string;
                                salaryType: "HOURLY" | "MONTHLY";
                                baseSalary: string | null;
                                hourlyRate: string | null;
                                digitalIdToken: string;
                                digitalIdUrl: string | null;
                            };
                            id: string;
                            name: string;
                            phone: string | null;
                            email: string | null;
                            status: "ACTIVE" | "SUSPENDED" | "TERMINATED" | "ON_LEAVE";
                            createdAt: Date;
                            updatedAt: Date;
                            deletedAt: Date | null;
                            tenantId: string | null;
                            branchId: string | null;
                            password: string | null;
                            role: "platform_owner" | "super_admin" | "tenant_owner" | "manager" | "cashier" | "kitchen_staff" | "qr_scanner" | "staff" | "customer";
                            roleId: string | null;
                            posPin: string | null;
                            avatarUrl: string | null;
                            lastLoginAt: Date | null;
                        };
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
} & {
    v1: {
        staff: {
            permissions: {
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
                                name: string;
                                slug: string;
                                description: string | null;
                            }[];
                        };
                    };
                };
            };
        };
    };
} & {
    v1: {
        staff: {
            roles: {
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
                            error: string;
                            data?: undefined;
                        } | {
                            success: boolean;
                            data: {
                                id: string;
                                name: string;
                                slug: string;
                                isSystem: boolean;
                                permissions: string[];
                            }[];
                            error?: undefined;
                        };
                    };
                };
            };
        };
    };
} & {
    v1: {
        staff: {
            roles: {
                post: {
                    body: {
                        name: string;
                        permissions: string[];
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
                            roleId: string;
                        } | {
                            success: boolean;
                            error: string;
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
        staff: {
            roles: {
                ":id": {
                    patch: {
                        body: {
                            permissions: string[];
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                message: string;
                            } | {
                                success: boolean;
                                forked: boolean;
                                roleId: string;
                            } | {
                                success: boolean;
                                error: string;
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
        staff: {
            roles: {
                ":id": {
                    delete: {
                        body: unknown;
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                message: string;
                            } | {
                                success: boolean;
                            } | {
                                success: boolean;
                                error: string;
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
        staff: {
            ":id": {
                patch: {
                    body: {
                        name?: string | undefined;
                        phone?: string | undefined;
                        status?: "ACTIVE" | "SUSPENDED" | "TERMINATED" | "ON_LEAVE" | undefined;
                        branchId?: string | undefined;
                        roleId?: string | undefined;
                        salaryType?: "HOURLY" | "MONTHLY" | undefined;
                        baseSalary?: string | undefined;
                        hourlyRate?: string | undefined;
                    };
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            message: string;
                        } | {
                            success: boolean;
                            error: string;
                            data?: undefined;
                        } | {
                            success: boolean;
                            data: {
                                profile: {
                                    id: string;
                                    tenantId: string;
                                    userId: string;
                                    emergencyContact: string | null;
                                    joiningDate: string;
                                    salaryType: "HOURLY" | "MONTHLY";
                                    baseSalary: string | null;
                                    hourlyRate: string | null;
                                    digitalIdToken: string;
                                    digitalIdUrl: string | null;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    deletedAt: Date | null;
                                };
                                id: string;
                                tenantId: string | null;
                                branchId: string | null;
                                name: string;
                                phone: string | null;
                                email: string | null;
                                password: string | null;
                                role: "platform_owner" | "super_admin" | "tenant_owner" | "manager" | "cashier" | "kitchen_staff" | "qr_scanner" | "staff" | "customer";
                                roleId: string | null;
                                posPin: string | null;
                                avatarUrl: string | null;
                                status: "ACTIVE" | "SUSPENDED" | "TERMINATED" | "ON_LEAVE";
                                lastLoginAt: Date | null;
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                            };
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
} & {
    v1: {
        staff: {
            ":id": {
                pin: {
                    post: {
                        body: {
                            pin: string;
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                message: string;
                            } | {
                                success: boolean;
                                error: string;
                                message?: undefined;
                            } | {
                                success: boolean;
                                message: string;
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
        staff: {
            ":id": {
                delete: {
                    body: unknown;
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            message: string;
                        } | {
                            success: boolean;
                            error: string;
                            data?: undefined;
                        } | {
                            success: boolean;
                            data: {
                                id: string;
                                tenantId: string | null;
                                branchId: string | null;
                                name: string;
                                phone: string | null;
                                email: string | null;
                                password: string | null;
                                role: "platform_owner" | "super_admin" | "tenant_owner" | "manager" | "cashier" | "kitchen_staff" | "qr_scanner" | "staff" | "customer";
                                roleId: string | null;
                                posPin: string | null;
                                avatarUrl: string | null;
                                status: "ACTIVE" | "SUSPENDED" | "TERMINATED" | "ON_LEAVE";
                                lastLoginAt: Date | null;
                                createdAt: Date;
                                updatedAt: Date;
                                deletedAt: Date | null;
                            };
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
} & {
    v1: {
        staff: {
            timesheets: {
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
                            error: string;
                            data?: undefined;
                        } | {
                            success: boolean;
                            data: {
                                id: string;
                                staffId: string;
                                staffName: string;
                                clockIn: Date;
                                clockOut: Date | null;
                                status: "PENDING" | "APPROVED" | "REJECTED";
                                totalHours: number;
                                reviewerNotes: string | null;
                            }[];
                            error?: undefined;
                        };
                    };
                };
            };
        };
    };
} & {
    v1: {
        staff: {
            timesheets: {
                ":id": {
                    patch: {
                        body: {
                            reviewerNotes?: string | undefined;
                            status: "PENDING" | "APPROVED" | "REJECTED";
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                message: string;
                            } | {
                                success: boolean;
                                error: string;
                                data?: undefined;
                            } | {
                                success: boolean;
                                data: {
                                    id: string;
                                    tenantId: string | null;
                                    branchId: string | null;
                                    staffId: string;
                                    clockIn: Date;
                                    clockOut: Date | null;
                                    totalHours: string | null;
                                    status: "PENDING" | "APPROVED" | "REJECTED";
                                    reviewedBy: string | null;
                                    reviewerNotes: string | null;
                                    reviewedAt: Date | null;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    deletedAt: Date | null;
                                };
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
        staff: {
            timesheets: {
                "clock-in": {
                    post: {
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
                                error: string;
                                data?: undefined;
                            } | {
                                success: boolean;
                                data: {
                                    id: string;
                                    status: "PENDING" | "APPROVED" | "REJECTED";
                                    createdAt: Date;
                                    updatedAt: Date;
                                    deletedAt: Date | null;
                                    tenantId: string | null;
                                    branchId: string | null;
                                    staffId: string;
                                    totalHours: string | null;
                                    clockIn: Date;
                                    clockOut: Date | null;
                                    reviewedBy: string | null;
                                    reviewerNotes: string | null;
                                    reviewedAt: Date | null;
                                };
                                error?: undefined;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    v1: {
        staff: {
            timesheets: {
                "clock-out": {
                    post: {
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
                                error: string;
                                data?: undefined;
                            } | {
                                success: boolean;
                                data: {
                                    id: string;
                                    tenantId: string | null;
                                    branchId: string | null;
                                    staffId: string;
                                    clockIn: Date;
                                    clockOut: Date | null;
                                    totalHours: string | null;
                                    status: "PENDING" | "APPROVED" | "REJECTED";
                                    reviewedBy: string | null;
                                    reviewerNotes: string | null;
                                    reviewedAt: Date | null;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    deletedAt: Date | null;
                                };
                                error?: undefined;
                            };
                        };
                    };
                };
            };
        };
    };
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}, {
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
}>;
