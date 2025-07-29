import { Request } from 'express';
export interface DeviceInfo {
    deviceId: string;
    userAgent: string;
    browser: {
        name: string;
        version: string;
    };
    os: {
        name: string;
        version: string;
    };
    device: {
        vendor: string;
        model: string;
        type: string;
    };
    ip: string;
    lastAccessed: Date;
}
export declare function generateDeviceFingerprint(req: Request): string;
export declare function extractDeviceInfo(req: Request): DeviceInfo;
export declare function detectSuspiciousLogin(currentDevice: DeviceInfo, knownDevices: DeviceInfo[]): {
    suspicious: boolean;
    reason?: string;
};
//# sourceMappingURL=device-tracking.d.ts.map