import postgres from 'postgres';
import * as schema from './schema/index';
export declare const db: (import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
    $client: postgres.Sql<{}>;
}) | (import("drizzle-orm/neon-http").NeonHttpDatabase<typeof schema> & {
    $client: import("@neondatabase/serverless").NeonQueryFunction<false, false>;
});
export declare const rawSql: Bun.SQL.Query<any> | null;
