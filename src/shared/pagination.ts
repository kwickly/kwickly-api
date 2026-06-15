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
export function sanitizeLimit(limit?: number | string): number {
  const parsed = typeof limit === 'string' ? parseInt(limit, 10) : limit;
  if (!parsed || isNaN(parsed) || parsed < 1) {
    return 20;
  }
  return Math.min(parsed, 100);
}

/**
 * Helper to generate standard Meta object for Cursor-based pagination.
 * 
 * @param items The retrieved items array (usually limit + 1)
 * @param limit The requested page size
 * @param cursorKey The property on the item to use as the next cursor (e.g., 'createdAt')
 */
export function buildCursorMeta<T>(
  items: T[],
  limit: number,
  cursorKey: keyof T
): { data: T[]; meta: PaginationMeta } {
  const hasMore = items.length > limit;
  
  // If we fetched limit + 1, slice off the extra item so we only return the requested `limit`
  const data = hasMore ? items.slice(0, limit) : items;
  
  let nextCursor = null;
  if (hasMore && data.length > 0) {
    const lastItem = data[data.length - 1] as NonNullable<T>;
    const rawCursor = lastItem[cursorKey];
    
    // Simple Base64 encode for opaque cursors
    if (rawCursor instanceof Date) {
      nextCursor = Buffer.from(rawCursor.toISOString()).toString('base64');
    } else if (typeof rawCursor === 'string' || typeof rawCursor === 'number') {
      nextCursor = Buffer.from(String(rawCursor)).toString('base64');
    }
  }

  return {
    data,
    meta: {
      perPage: limit,
      nextCursor,
      hasMore,
    },
  };
}
