import type { NewUser } from '../../db/schema/users';
/**
 * Service handling all core business logic for Users/Staff.
 * Exposes methods for listing employees and onboarding new staff securely.
 */
export declare class UsersService {
    /**
     * Retrieves a list of all active staff members belonging to a specific tenant.
     * Filters out customers and deleted users.
     *
     * @param {string} tenantId - The UUID of the tenant requesting the staff list.
     * @returns {Promise<Partial<User>[]>} A promise resolving to an array of staff members.
     */
    listStaff(tenantId: string): Promise<{
        id: string;
        name: string;
        role: "platform_owner" | "super_admin" | "tenant_owner" | "manager" | "cashier" | "kitchen_staff" | "qr_scanner" | "staff" | "customer";
        branchId: string | null;
        phone: string | null;
        status: "ACTIVE" | "SUSPENDED" | "TERMINATED" | "ON_LEAVE";
    }[]>;
    /**
     * Onboards a new staff member (e.g., Manager, Cashier, Kitchen Staff, QR Scanner).
     * Strictly validates that high-privilege roles (like Admin) or Customer roles cannot be created via this method.
     *
     * @param {string} tenantId - The UUID of the tenant the staff belongs to.
     * @param {Omit<NewUser, 'tenantId'>} data - The staff details (name, phone, role, branchId).
     * @returns {Promise<Partial<User>>} A promise resolving to the created staff member.
     * @throws {Error} If the requested role is invalid for staff onboarding.
     */
    createStaff(tenantId: string, data: Omit<NewUser, 'tenantId'>): Promise<{
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
        status: "ACTIVE" | "SUSPENDED" | "TERMINATED" | "ON_LEAVE";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string | null;
        branchId: string | null;
        password: string | null;
        role: "platform_owner" | "super_admin" | "tenant_owner" | "manager" | "cashier" | "kitchen_staff" | "qr_scanner" | "staff" | "customer";
        roleId: string | null;
        posPin: string | null;
        avatarUrl: string | null;
        lastLoginAt: Date | null;
    }>;
    /**
     * Fetches the personal profile for the authenticated user.
     */
    getUserProfile(userId: string): Promise<{
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
        role: "platform_owner" | "super_admin" | "tenant_owner" | "manager" | "cashier" | "kitchen_staff" | "qr_scanner" | "staff" | "customer";
        avatarUrl: string | null;
        tenantId: string | null;
        branchId: string | null;
        createdAt: Date;
    }>;
    /**
     * Updates the personal profile for the authenticated user.
     */
    updateUserProfile(userId: string, data: {
        name?: string;
        phone?: string;
        avatarUrl?: string;
    }): Promise<{
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
        role: "platform_owner" | "super_admin" | "tenant_owner" | "manager" | "cashier" | "kitchen_staff" | "qr_scanner" | "staff" | "customer";
        avatarUrl: string | null;
    }>;
}
