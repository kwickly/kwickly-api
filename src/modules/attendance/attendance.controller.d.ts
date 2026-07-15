import { Elysia } from 'elysia';
export declare const attendanceController: Elysia<"/v1/attendance", {
    decorator: any;
    store: {
        [x: string]: any;
    };
    derive: any;
    resolve: any;
}, any, any, {
    v1: {
        attendance: {};
    };
} & {
    v1: {
        attendance: {
            staff: {
                scan: {
                    post: {
                        body: {
                            qrData: string;
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
                                action: string;
                                hours: string;
                            } | {
                                success: boolean;
                                action: string;
                                hours?: undefined;
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
        attendance: any;
    };
} & {
    v1: {
        attendance: {
            "branch-qr": {
                ":branchId": {
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
