export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    image?: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateCategoryData {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    image?: string;
    isActive?: boolean;
    sortOrder?: number;
}
export interface UpdateCategoryData {
    name?: string;
    slug?: string;
    description?: string;
    parentId?: string;
    image?: string;
    isActive?: boolean;
    sortOrder?: number;
}
export declare class CategoryService {
    private prisma;
    constructor();
    /**
     * Get all categories
     */
    getAllCategories(): Promise<Category[]>;
    /**
     * Get category by ID
     */
    getCategoryById(id: string): Promise<Category | null>;
    /**
     * Get category by slug
     */
    getCategoryBySlug(slug: string): Promise<Category | null>;
    /**
     * Get subcategories by parent ID
     */
    getSubcategories(parentId: string): Promise<Category[]>;
    /**
     * Create category
     */
    createCategory(data: CreateCategoryData): Promise<Category>;
    /**
     * Update category
     */
    updateCategory(id: string, data: UpdateCategoryData): Promise<Category>;
    /**
     * Delete category
     */
    deleteCategory(id: string): Promise<void>;
    /**
     * Get category tree
     */
    getCategoryTree(): Promise<Category[]>;
    /**
     * Get category path (breadcrumb)
     */
    getCategoryPath(id: string): Promise<Category[]>;
    /**
     * Search categories
     */
    searchCategories(query: string): Promise<Category[]>;
    /**
     * Get category statistics
     */
    getCategoryStats(): Promise<{
        totalCategories: number;
        activeCategories: number;
        categoriesWithProducts: number;
    }>;
}
//# sourceMappingURL=categoryService.d.ts.map