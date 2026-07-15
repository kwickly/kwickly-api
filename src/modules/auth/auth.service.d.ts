export declare class AuthService {
    /**
     * Helper to load tenant branding info.
     */
    getTenantDetails(tenantId: string | null): Promise<{
        id: string;
        name: string;
        status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
    } | null>;
    /**
     * Helper to load role info and permissions for RBAC context.
     */
    getRoleDetails(roleSlug: string, tenantId: string | null): Promise<{
        id: string;
        name: string;
        slug: string;
        isSystem: boolean;
        permissions: string[];
    } | undefined>;
    /**
     * Traditional password-based login for staff and admins.
     */
    loginWithPassword(email: string, pass: string): Promise<{
        roleDetails: {
            id: string;
            name: string;
            slug: string;
            isSystem: boolean;
            permissions: string[];
        } | undefined;
        tenantDetails: {
            id: string;
            name: string;
            status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
        } | null;
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
    /**
     * Generates a 6-digit OTP and stores it in the database.
     */
    sendOtp(phone: string): Promise<string>;
    /**
     * Verifies the OTP, marks it used, and returns/creates the User.
     */
    verifyOtp(phone: string, code: string): Promise<{
        roleDetails: {
            id: string;
            name: string;
            slug: string;
            isSystem: boolean;
            permissions: string[];
        } | undefined;
        tenantDetails: {
            id: string;
            name: string;
            status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
        } | null;
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
    /**
     * Creates a long-lived refresh token session in the DB.
     */
    createSession(userId: string, deviceInfo: string): Promise<string>;
    /**
     * Validates a refresh token and returns the associated user.
     */
    refreshSession(refreshToken: string): Promise<{
        user: {
            roleDetails: {
                id: string;
                name: string;
                slug: string;
                isSystem: boolean;
                permissions: string[];
            } | undefined;
            tenantDetails: {
                id: string;
                name: string;
                status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
            } | null;
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
        session: {
            id: string;
            userId: string;
            refreshToken: string;
            deviceId: string | null;
            deviceInfo: string | null;
            isRevoked: boolean;
            expiresAt: Date;
            createdAt: Date;
            deletedAt: Date | null;
        };
    }>;
    /**
     * Generates a password reset token and "sends" an email.
     */
    requestPasswordReset(email: string): Promise<void>;
    /**
     * Verifies the token and updates the user's password.
     */
    resetPassword(rawToken: string, newPassword: string): Promise<void>;
    /**
     * Updates basic profile information.
     */
    updateProfile(userId: string, data: {
        name?: string;
        phone?: string;
    }): Promise<{
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
