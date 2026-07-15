export declare class AttendanceService {
    /**
     * Generates a static payload for the branch.
     * This payload can be converted into a QR code and printed on a wall.
     */
    generateBranchQR(tenantId: string, branchId: string): Promise<string>;
    /**
     * Staff scans the branch QR to clock in or clock out.
     */
    scanDutyQR(tenantId: string, staffId: string, qrBase64: string): Promise<{
        success: boolean;
        action: string;
        hours: string;
    } | {
        success: boolean;
        action: string;
        hours?: undefined;
    }>;
}
