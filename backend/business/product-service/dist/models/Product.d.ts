import mongoose, { Document } from 'mongoose';
export interface IProductVariant {
    sku: string;
    name: string;
    price: number;
    compareAtPrice?: number;
    cost?: number;
    inventory: {
        quantity: number;
        tracked: boolean;
        allowBackorder: boolean;
        lowStockThreshold?: number;
    };
    weight?: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };
    attributes: Record<string, string>;
    images: string[];
    isActive: boolean;
}
export interface IProductReview {
    userId: string;
    rating: number;
    title: string;
    comment: string;
    verified: boolean;
    helpful: number;
    reported: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface IProduct extends Document {
    name: string;
    slug: string;
    description: string;
    shortDescription?: string;
    sku: string;
    category: mongoose.Types.ObjectId;
    subcategory?: mongoose.Types.ObjectId;
    brand?: string;
    tags: string[];
    price: number;
    compareAtPrice?: number;
    cost?: number;
    currency: string;
    taxable: boolean;
    inventory: {
        quantity: number;
        tracked: boolean;
        allowBackorder: boolean;
        lowStockThreshold?: number;
    };
    weight?: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
        unit: string;
    };
    images: string[];
    videos?: string[];
    hasVariants: boolean;
    variants: IProductVariant[];
    options: Array<{
        name: string;
        values: string[];
    }>;
    seo: {
        title?: string;
        description?: string;
        keywords?: string[];
    };
    status: 'draft' | 'active' | 'archived';
    publishedAt?: Date;
    vendorId?: string;
    vendor?: {
        name: string;
        email: string;
    };
    reviews: IProductReview[];
    rating: {
        average: number;
        count: number;
        distribution: {
            1: number;
            2: number;
            3: number;
            4: number;
            5: number;
        };
    };
    analytics: {
        views: number;
        purchases: number;
        addedToCart: number;
        wishlisted: number;
    };
    featured: boolean;
    trending: boolean;
    newArrival: boolean;
    onSale: boolean;
    shipping: {
        required: boolean;
        weight?: number;
        dimensions?: {
            length: number;
            width: number;
            height: number;
        };
        freeShipping: boolean;
        shippingClass?: string;
    };
    relatedProducts: mongoose.Types.ObjectId[];
    upsellProducts: mongoose.Types.ObjectId[];
    crossSellProducts: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Product: any;
//# sourceMappingURL=Product.d.ts.map