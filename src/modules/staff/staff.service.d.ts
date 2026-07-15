export declare class StaffService {
    /**
     * Fetch all available granular permissions in the system.
     */
    getPermissions(): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
    }[]>;
    /**
     * Fetch roles available for a tenant (System + Custom)
     */
    getRoles(tenantId: string): Promise<{
        id: string;
        name: string;
        slug: string;
        isSystem: boolean;
        permissions: string[];
    }[]>;
    /**
     * Create a new custom role for a tenant
     */
    createRole(tenantId: string, name: string, permissionSlugs: string[]): Promise<{
        success: boolean;
        roleId: string;
    }>;
    /**
     * Update permissions for a specific role and invalidate cache
     */
    updateRolePermissions(tenantId: string | null, roleId: string, permissionSlugs: string[], requestingUser: any): Promise<{
        success: boolean;
        forked: boolean;
        roleId: string;
    }>;
    /**
     * Fetch staff profiles with user details
     */
    getStaff(tenantId: string): Promise<{
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
        role: "platform_owner" | "super_admin" | "tenant_owner" | "manager" | "cashier" | "kitchen_staff" | "qr_scanner" | "staff" | "customer";
        roleId: string | null;
        roleName: string | null;
        pin: string | null;
        status: "ACTIVE" | "SUSPENDED" | "TERMINATED" | "ON_LEAVE";
        salaryType: "HOURLY" | "MONTHLY" | null;
        baseSalary: string | null;
        hourlyRate: string | null;
    }[]>;
    /**
     * Register a staff profile and underlying user
     */
    registerStaff(tenantId: string, payload: {
        name: string;
        phone: string;
        roleId: string;
        branchId?: string;
        salaryType?: 'HOURLY' | 'MONTHLY';
        baseSalary?: string;
        hourlyRate?: string;
    }): Promise<{
        profile: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            userId: string;
            emergencyContact: string | null;
            joiningDate: string;
            salaryType: "HOURLY" | "MONTHLY";
            baseSalary: string | null;
            hourlyRate: string | null;
            digitalIdToken: string;
            digitalIdUrl: string | null;
        };
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
     * Update an employee user and salary profile.
     */
    updateStaff(tenantId: string, staffId: string, payload: {
        name?: string;
        phone?: string;
        roleId?: string;
        branchId?: string;
        status?: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'ON_LEAVE';
        salaryType?: 'HOURLY' | 'MONTHLY';
        baseSalary?: string;
        hourlyRate?: string;
    }): Promise<{
        profile: {
            id: string;
            tenantId: string;
            userId: string;
            emergencyContact: string | null;
            joiningDate: string;
            salaryType: "HOURLY" | "MONTHLY";
            baseSalary: string | null;
            hourlyRate: string | null;
            digitalIdToken: string;
            digitalIdUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        };
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
     * Soft delete a staff member.
     */
    deleteStaff(tenantId: string, staffId: string): Promise<{
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
     * Delete a custom role. System roles cannot be deleted.
     */
    deleteRole(tenantId: string | null, roleId: string, requestingUser: any): Promise<{
        success: boolean;
    }>;
    /**
     * Fetch timesheets
     */
    getPlatformTimesheets(params?: {
        limit?: number;
        offset?: number;
    }): Promise<{
        id: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string | null;
        branchId: string | null;
        staffId: string;
        totalHours: string | null;
        clockIn: Date;
        clockOut: Date | null;
        reviewedBy: string | null;
        reviewerNotes: string | null;
        reviewedAt: Date | null;
        staff: {
            name: string;
            email: string | null;
            role: "platform_owner" | "super_admin" | "tenant_owner" | "manager" | "cashier" | "kitchen_staff" | "qr_scanner" | "staff" | "customer";
        };
        branch: {
            name: string;
        } | null;
        reviewer: {
            name: string;
        } | null;
    }[]>;
    /**
     * Fetch timesheets for a specific tenant
     */
    getTenantTimesheets(tenantId: string): Promise<{
        id: string;
        staffId: string;
        staffName: string;
        clockIn: Date;
        clockOut: Date | null;
        status: "PENDING" | "APPROVED" | "REJECTED";
        totalHours: number;
        reviewerNotes: string | null;
    }[]>;
    /**
     * Staff clock in
     */
    clockIn(tenantId: string, staffId: string): Promise<{
        id: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string | null;
        branchId: string | null;
        staffId: string;
        totalHours: string | null;
        clockIn: Date;
        clockOut: Date | null;
        reviewedBy: string | null;
        reviewerNotes: string | null;
        reviewedAt: Date | null;
    }>;
    /**
     * Staff clock out
     */
    clockOut(tenantId: string, staffId: string): Promise<{
        id: string;
        tenantId: string | null;
        branchId: string | null;
        staffId: string;
        clockIn: Date;
        clockOut: Date | null;
        totalHours: string | null;
        status: "PENDING" | "APPROVED" | "REJECTED";
        reviewedBy: string | null;
        reviewerNotes: string | null;
        reviewedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    /**
     * Update timesheet status and remarks
     */
    updateTimesheet(id: string, payload: {
        status: 'PENDING' | 'APPROVED' | 'REJECTED';
        reviewerNotes?: string;
        reviewedBy: string;
    }): Promise<{
        id: string;
        tenantId: string | null;
        branchId: string | null;
        staffId: string;
        clockIn: Date;
        clockOut: Date | null;
        totalHours: string | null;
        status: "PENDING" | "APPROVED" | "REJECTED";
        reviewedBy: string | null;
        reviewerNotes: string | null;
        reviewedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
}
