import { eq, and, lte, gte, or, isNull } from 'drizzle-orm';
import { db } from '../../db/index';
import { inAppAds, adImpressions } from '../../db/schema/ads';

export class AdsService {
  /**
   * Fetch active ads for a branch or tenant-wide
   */
  async getActiveAds(tenantId: string, branchId?: string) {
    const now = new Date();

    return await db
      .select()
      .from(inAppAds)
      .where(
        and(
          eq(inAppAds.tenantId, tenantId),
          eq(inAppAds.isActive, true),
          or(eq(inAppAds.branchId, branchId as any), isNull(inAppAds.branchId)),
          lte(inAppAds.activeFrom, now),
          or(gte(inAppAds.activeUntil, now), isNull(inAppAds.activeUntil))
        )
      )
      .execute();
  }

  /**
   * Create a new advertisement
   */
  async createAd(tenantId: string, payload: {
    branchId?: string;
    title: string;
    imageUrl: string;
    link?: string;
    activeFrom?: Date;
    activeUntil?: Date;
  }) {
    const [newAd] = await db
      .insert(inAppAds)
      .values({
        tenantId,
        branchId: payload.branchId,
        title: payload.title,
        imageUrl: payload.imageUrl,
        link: payload.link,
        activeFrom: payload.activeFrom ?? new Date(),
        activeUntil: payload.activeUntil,
      })
      .returning();
    return newAd;
  }

  /**
   * Record an ad impression or click
   */
  async recordImpression(adId: string, userId?: string, isClick: boolean = false) {
    await db.insert(adImpressions).values({
      adId,
      userId,
      clickedAt: isClick ? new Date() : null,
    });
  }
}
