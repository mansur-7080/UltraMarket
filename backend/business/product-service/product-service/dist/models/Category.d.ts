import mongoose, { Document } from 'mongoose';
export interface ICategory extends Document {
    name: string;
    slug: string;
    description?: string;
    image?: string;
    parentId?: mongoose.Types.ObjectId;
    parent?: ICategory;
    children?: ICategory[];
    level: number;
    sortOrder: number;
    productCount: number;
    isActive: boolean;
    seo?: {
        title?: string;
        description?: string;
        keywords?: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const Category: any;
//# sourceMappingURL=Category.d.ts.map