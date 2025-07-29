import { ICategory } from '../models/product.model';
export interface CreateCategoryDto {
    name: string;
    description?: string;
    image?: string;
    isActive?: boolean;
    parentId?: string | null;
    sortOrder?: number;
    metaTitle?: string;
    metaDescription?: string;
}
export interface UpdateCategoryDto {
    name?: string;
    description?: string;
    image?: string;
    isActive?: boolean;
    parentId?: string | null;
    sortOrder?: number;
    metaTitle?: string;
    metaDescription?: string;
}
export interface CategoryQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    parentId?: string | null;
    includeChildren?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface CategoryResponse extends Omit<ICategory, 'children'> {
    children?: CategoryResponse[];
    productCount?: number;
    parent?: Pick<ICategory, 'id' | 'name' | 'slug'>;
}
export interface PaginatedCategoryResponse {
    items: CategoryResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class CategoryService {
    private categoryRepository;
    constructor();
    /**
     * Get all categories with optional filtering and pagination
     */
    getCategories(queryParams: CategoryQueryParams): Promise<PaginatedCategoryResponse>;
    /**
     * Get category tree (hierarchical structure)
     */
    getCategoryTree(isActive?: boolean): Promise<CategoryResponse[]>;
    /**
     * Get a single category by ID
     */
    getCategoryById(id: string, includeChildren?: boolean): Promise<CategoryResponse>;
    /**
     * Get a single category by slug
     */
    getCategoryBySlug(slug: string, includeChildren?: boolean): Promise<CategoryResponse>;
    /**
     * Create a new category
     */
    createCategory(data: CreateCategoryDto): Promise<CategoryResponse>;
    /**
     * Update an existing category
     */
    updateCategory(id: string, data: UpdateCategoryDto): Promise<CategoryResponse>;
    /**
     * Delete a category
     */
    deleteCategory(id: string): Promise<void>;
    /**
     * Check if a category is a descendant of another category
     * Used to prevent circular references in the category tree
     */
    private isCategoryDescendantOf;
    /**
     * Map database category to API response
     */
    private mapCategoryToResponse;
}
//# sourceMappingURL=category.service.d.ts.map