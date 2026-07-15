export declare class LeaveService {
    /**
     * Public Holidays
     */
    getHolidays(tenantId: string): Promise<{
        date: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
    }[]>;
    declareHoliday(tenantId: string, payload: {
        name: string;
        date: string;
    }): Promise<{
        date: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
    }>;
    removeHoliday(id: string): Promise<{
        success: boolean;
    }>;
    /**
     * Staff Leaves
     */
    getLeaves(tenantId: string): Promise<{
        id: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        staffId: string;
        leaveType: "SICK" | "VACATION" | "UNPAID";
        startDate: string;
        endDate: string;
        staff: {
            name: string;
            email: string | null;
        };
    }[]>;
    getStaffLeaves(staffId: string): Promise<{
        id: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        staffId: string;
        leaveType: "SICK" | "VACATION" | "UNPAID";
        startDate: string;
        endDate: string;
    }[]>;
    requestLeave(tenantId: string, staffId: string, payload: {
        leaveType: 'SICK' | 'VACATION' | 'UNPAID';
        startDate: string;
        endDate: string;
    }): Promise<{
        id: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        staffId: string;
        leaveType: "SICK" | "VACATION" | "UNPAID";
        startDate: string;
        endDate: string;
    }>;
    updateLeaveStatus(id: string, status: 'APPROVED' | 'REJECTED'): Promise<{
        id: string;
        tenantId: string;
        staffId: string;
        leaveType: "SICK" | "VACATION" | "UNPAID";
        startDate: string;
        endDate: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
}
