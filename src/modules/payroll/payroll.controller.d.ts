import { Elysia } from 'elysia';
export declare const payrollController: Elysia<"/v1/payroll", {
    decorator: any;
    store: {
        [x: string]: any;
    };
    derive: any;
    resolve: any;
}, any, any, {
    v1: {
        payroll: {};
    };
} & {
    v1: {
        payroll: any;
    };
} & {
    v1: {
        payroll: {
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
} & {
    v1: {
        payroll: {
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
} & {
    v1: {
        payroll: {
            run: {
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
        payroll: {
            slips: {
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
        payroll: {
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
