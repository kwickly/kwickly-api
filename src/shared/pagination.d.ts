export interface PaginationMeta {
    totalCount?: number;
    perPage: number;
    nextCursor?: string | null;
    hasMore: boolean;
}
/**
 * Validates and sanitizes a requested limit.
 * Enforces a default of 20 and a hard maximum of 100 to prevent DoS attacks.
 */
export declare function sanitizeLimit(limit?: number | string): number;
/**
 * Helper to generate standard Meta object for Cursor-based pagination.
 *
 * @param items The retrieved items array (usually limit + 1)
 * @param limit The requested page size
 * @param cursorKey The property on the item to use as the next cursor (e.g., 'createdAt')
 */
export declare function buildCursorMeta<T>(items: T[], limit: number, cursorKey: keyof T): {
    data: T[];
    meta: PaginationMeta;
};
