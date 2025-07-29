import { Category, Prisma } from '@prisma/client';
export declare class CategoryRepository {
    /**
     * Find many categories with filtering and pagination
     */
    findMany(params: {
        skip?: number;
        take?: number;
        where?: Prisma.CategoryWhereInput;
        orderBy?: Prisma.CategoryOrderByWithRelationInput | Prisma.CategoryOrderByWithRelationInput[];
        include?: Prisma.CategoryInclude;
    }): Promise<Category[]>;
    /**
     * Count categories with filtering
     */
    count(params: {
        where?: Prisma.CategoryWhereInput;
    }): Promise<number>;
    /**
     * Find a single category by unique identifier
     */
    findUnique(params: {
        where: Prisma.CategoryWhereUniqueInput;
        include?: Prisma.CategoryInclude;
    }): Promise<Category | null>;
    /**
     * Find first category matching criteria
     */
    findFirst(params: {
        where?: Prisma.CategoryWhereInput;
        include?: Prisma.CategoryInclude;
        orderBy?: Prisma.CategoryOrderByWithRelationInput | Prisma.CategoryOrderByWithRelationInput[];
    }): Promise<Category | null>;
    /**
     * Create a new category
     */
    create(params: {
        data: Prisma.CategoryCreateInput;
        include?: Prisma.CategoryInclude;
    }): Promise<Category>;
    /**
     * Update an existing category
     */
    update(params: {
        where: Prisma.CategoryWhereUniqueInput;
        data: Prisma.CategoryUpdateInput;
        include?: Prisma.CategoryInclude;
    }): Promise<Category>;
    /**
     * Delete a category
     */
    delete(params: {
        where: Prisma.CategoryWhereUniqueInput;
    }): Promise<Category>;
    /**
     * Get hierarchical category tree
     */
    getCategoryTree(): Promise<Category[]>;
}
//# sourceMappingURL=category-repository.d.ts.map