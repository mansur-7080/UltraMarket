import { Document } from 'mongoose';
export interface IReview extends Document {
    id: string;
    userId: string;
    productId: string;
    orderId?: string;
    rating: number;
    title: string;
    content: string;
    pros?: string[];
    cons?: string[];
    verified: boolean;
    helpful: {
        yes: number;
        no: number;
        userVotes: Map<string, 'yes' | 'no'>;
    };
    images?: string[];
    videos?: string[];
    moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged';
    moderationNotes?: string;
    tags?: string[];
    language: string;
    sentiment?: {
        score: number;
        label: 'positive' | 'negative' | 'neutral';
        confidence: number;
    };
    metadata: {
        ipAddress?: string;
        userAgent?: string;
        deviceInfo?: Record<string, unknown>;
        location?: {
            country: string;
            city?: string;
        };
    };
    editHistory?: Array<{
        date: Date;
        changes: string[];
        moderatorId?: string;
    }>;
    flags: Array<{
        userId: string;
        reason: string;
        description?: string;
        createdAt: Date;
    }>;
    replies?: Array<{
        id: string;
        userId: string;
        userType: 'customer' | 'merchant' | 'admin';
        content: string;
        createdAt: Date;
        helpful: {
            yes: number;
            no: number;
        };
    }>;
    featured: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Review: any;
//# sourceMappingURL=Review.d.ts.map