export declare class HardwareService {
    /**
     * Generates a base64 encoded ESC/POS payload for a thermal printer.
     * In a real production scenario, you would use a library like 'escpos' or 'receiptline'
     * to construct the exact byte array.
     */
    generateReceiptPayload(tenantId: string, orderId: string): Promise<string>;
}
