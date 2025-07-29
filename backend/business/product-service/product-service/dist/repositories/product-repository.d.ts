import { Product, Prisma } from '@prisma/client';
export declare class ProductRepository {
    /**
     * Find many products with filtering and pagination
     */
    findMany(params: {
        skip?: number;
        take?: number;
        where?: Prisma.ProductWhereInput;
        orderBy?: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
        include?: Prisma.ProductInclude;
    }): Promise<Product[]>;
    /**
     * Count products with filtering
     */
    count(params: {
        where?: Prisma.ProductWhereInput;
    }): Promise<number>;
    /**
     * Find a single product by unique identifier
     */
    findUnique(params: {
        where: Prisma.ProductWhereUniqueInput;
        include?: Prisma.ProductInclude;
    }): Promise<Product | null>;
    /**
     * Find first product matching criteria
     */
    findFirst(params: {
        where?: Prisma.ProductWhereInput;
        include?: Prisma.ProductInclude;
        orderBy?: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
    }): Promise<Product | null>;
    /**
     * Create a new product
     */
    create(params: {
        data: Prisma.ProductCreateInput;
        include?: Prisma.ProductInclude;
    }): Promise<Product>;
    /**
     * Update an existing product
     */
    update(params: {
        where: Prisma.ProductWhereUniqueInput;
        data: Prisma.ProductUpdateInput;
        include?: Prisma.ProductInclude;
    }): Promise<Product>;
    /**
     * Delete a product
     */
    delete(params: {
        where: Prisma.ProductWhereUniqueInput;
    }): Promise<Product>;
}
//# sourceMappingURL=product-repository.d.ts.map