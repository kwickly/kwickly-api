import { Elysia } from 'elysia';
export declare const app: Elysia<"", {
    decorator: any;
    store: {
        [x: string]: any;
    };
    derive: any;
    resolve: any;
}, any, any, any, any, {
    derive: any;
    resolve: any;
    schema: any;
    standaloneSchema: any;
    response: {
        200: {
            success: boolean;
            error: string;
            details: any;
        } | {
            success: boolean;
            error: string;
            details?: undefined;
        };
    };
} & {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}>;
export type App = typeof app;
