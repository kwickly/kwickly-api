export declare class AdsService {
    /**
     * Fetch active ads for a branch or tenant-wide
     */
    getActiveAds(tenantId: string, branchId?: string): Promise<{
        id: string;
        tenantId: string;
        branchId: string | null;
        title: string;
        imageUrl: string;
        link: string | null;
        activeFrom: Date;
        activeUntil: Date | null;
        status: "ACTIVE" | "PAUSED" | "EXPIRED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }[]>;
    /**
     * Create a new advertisement
     */
    createAd(tenantId: string, payload: {
        branchId?: string;
        title: string;
        imageUrl: string;
        link?: string;
        activeFrom?: Date;
        activeUntil?: Date;
    }): Promise<{
        link: string | null;
        id: string;
        status: "ACTIVE" | "PAUSED" | "EXPIRED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        branchId: string | null;
        imageUrl: string;
        title: string;
        activeFrom: Date;
        activeUntil: Date | null;
    }>;
    /**
     * Record an ad impression or click
     */
    recordImpression(adId: string, userId?: string, isClick?: boolean): Promise<void>;
}
