import mongoose, { Document } from 'mongoose';
export interface IProduct extends Document {
    name: string;
    description: string;
    shortDescription: string;
    sku: string;
    categoryId: mongoose.Types.ObjectId;
    brand: string;
    price: number;
    compareAtPrice?: number;
    cost?: number;
    currency: string;
    images: string[];
    thumbnail: string;
    tags: string[];
    attributes: {
        [key: string]: string | number | boolean;
    };
    variants: {
        id: string;
        name: string;
        sku: string;
        price: number;
        comparePrice?: number;
        stock: number;
        attributes: {
            [key: string]: string | number | boolean;
        };
    }[];
    stock: number;
    weight: number;
    dimensions: {
        length: number;
        width: number;
        height: number;
    };
    isActive: boolean;
    isFeatured: boolean;
    isDigital: boolean;
    requiresShipping: boolean;
    taxRate: number;
    seo?: {
        title?: string;
        description?: string;
        keywords?: string[];
    };
    ratings: {
        average: number;
        count: number;
    };
    sales: {
        total: number;
        lastMonth: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const Product: any;
//# sourceMappingURL=Product.d.ts.map