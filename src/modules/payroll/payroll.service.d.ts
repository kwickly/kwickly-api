export declare class PayrollService {
    /**
     * Fetch all payroll runs for a tenant
     */
    getPayrollRuns(tenantId: string): Promise<{
        id: string;
        status: "DRAFT" | "PROCESSED" | "PAID";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        periodStartDate: string;
        periodEndDate: string;
        slips: {
            id: string;
            status: "DRAFT" | "PROCESSED" | "PAID";
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            staffId: string;
            payrollRunId: string;
            baseAmount: string;
            overtimeAmount: string | null;
            deductions: string | null;
            bonus: string | null;
            netPayable: string;
        }[];
    }[]>;
    /**
     * Fetch specific payroll run with all detailed slips
     */
    getPayrollRun(id: string): Promise<{
        id: string;
        status: "DRAFT" | "PROCESSED" | "PAID";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        periodStartDate: string;
        periodEndDate: string;
        slips: {
            id: string;
            status: "DRAFT" | "PROCESSED" | "PAID";
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            staffId: string;
            payrollRunId: string;
            baseAmount: string;
            overtimeAmount: string | null;
            deductions: string | null;
            bonus: string | null;
            netPayable: string;
            staff: {
                name: string;
                email: string | null;
            };
        }[];
    }>;
    /**
     * Generate payroll for a given period
     */
    generatePayroll(tenantId: string, payload: {
        periodStartDate: string;
        periodEndDate: string;
    }): Promise<{
        id: string;
        status: "DRAFT" | "PROCESSED" | "PAID";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        periodStartDate: string;
        periodEndDate: string;
    }>;
    /**
     * Adjust bonus and deductions on a draft slip
     */
    updateSalarySlip(slipId: string, payload: {
        bonus?: number;
        deductions?: number;
    }): Promise<{
        id: string;
        tenantId: string;
        payrollRunId: string;
        staffId: string;
        baseAmount: string;
        overtimeAmount: string | null;
        deductions: string | null;
        bonus: string | null;
        netPayable: string;
        status: "DRAFT" | "PROCESSED" | "PAID";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    /**
     * Advance Payroll State
     */
    advancePayrollStatus(runId: string, newStatus: 'PROCESSED' | 'PAID'): Promise<{
        id: string;
        tenantId: string;
        periodStartDate: string;
        periodEndDate: string;
        status: "DRAFT" | "PROCESSED" | "PAID";
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
}
