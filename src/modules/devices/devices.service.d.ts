export declare class DevicesService {
    /**
     * List all devices for a specific branch
     */
    listDevices(tenantId: string, branchId: string): Promise<{
        id: string;
        tenantId: string;
        branchId: string;
        name: string;
        type: "POS" | "KDS";
        pairingCode: string | null;
        pairingCodeExpiresAt: Date | null;
        status: "active" | "offline" | "revoked";
        lastSeenAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }[]>;
    /**
     * Register a new device and generate a pairing code
     */
    registerDevice(data: {
        tenantId: string;
        branchId: string;
        name: string;
        type: 'POS' | 'KDS';
    }): Promise<{
        id: string;
        name: string;
        status: "active" | "offline" | "revoked";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        branchId: string;
        type: "POS" | "KDS";
        pairingCode: string | null;
        pairingCodeExpiresAt: Date | null;
        lastSeenAt: Date | null;
    }>;
    /**
     * Revoke a device
     */
    revokeDevice(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        branchId: string;
        name: string;
        type: "POS" | "KDS";
        pairingCode: string | null;
        pairingCodeExpiresAt: Date | null;
        status: "active" | "offline" | "revoked";
        lastSeenAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    /**
     * PIN Authentication for POS
     */
    authenticateWithPin(tenantId: string, branchId: string, userId: string, pin: string): Promise<{
        sub: string;
        role: "platform_owner" | "super_admin" | "tenant_owner" | "manager" | "cashier" | "kitchen_staff" | "qr_scanner" | "staff" | "customer";
        roleId: string | null;
        tenantId: string | null;
        branchId: string;
    }>;
    /**
     * Set or reset POS PIN for a user
     */
    setPosPin(tenantId: string, userId: string, pin: string): Promise<{
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
    }>;
}
