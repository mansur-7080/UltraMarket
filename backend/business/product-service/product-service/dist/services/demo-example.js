"use strict";
/**
 * Example usage of the Enhanced Product Service
 * This file demonstrates various features of the service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runExample = runExample;
const logger_1 = require("../utils/logger");
const demo_product_service_1 = require("./demo-product-service");
/**
 * Run the example
 */
async function runExample() {
    // Initialize the cache service and product service
    const cacheService = new demo_product_service_1.MockCacheService();
    const productService = new demo_product_service_1.EnhancedProductService(cacheService);
    try {
        logger_1.logger.info('Enhanced Product Service Demonstration');
        // 1. Create a new product
        logger_1.logger.info('\n1. Creating a new product');
        const newProduct = await productService.createProduct({
            name: 'Premium Gaming Mouse',
            description: 'High-precision gaming mouse with RGB lighting and programmable buttons',
            sku: 'MOUSE-GAMING-001',
            slug: 'premium-gaming-mouse',
            category: 'gaming-peripherals',
            brand: 'GamerTech',
            price: 89.99,
            originalPrice: 109.99,
            discount: 18.18,
            stock: 35,
            images: JSON.stringify([
                { url: 'https://example.com/images/mouse-1.jpg', isMain: true },
                { url: 'https://example.com/images/mouse-2.jpg', isMain: false },
            ]),
            specifications: JSON.stringify({
                DPI: 'Up to 16,000',
                buttons: '8 programmable buttons',
                connection: 'Wired USB',
                weight: '95g',
            }),
            tags: JSON.stringify(['gaming', 'mouse', 'rgb', 'high-precision']),
            vendorId: 'vendor123',
            isFeatured: true,
            isActive: true,
            isDeleted: false,
            seoTitle: 'Premium Gaming Mouse with RGB - GamerTech',
            seoDescription: 'Elevate your gaming experience with the Premium Gaming Mouse featuring RGB lighting and 8 programmable buttons.',
            seoKeywords: JSON.stringify(['gaming mouse', 'rgb mouse', 'programmable mouse']),
        });
        logger_1.logger.info('Product created successfully', { productId: newProduct.id });
        // 2. Retrieve a product by ID
        logger_1.logger.info('\n2. Retrieving product by ID');
        const product = await productService.getProductById(newProduct.id);
        logger_1.logger.info('Product retrieved successfully', { productId: product.id, name: product.name });
        // 3. Update the product
        logger_1.logger.info('\n3. Updating product');
        const updatedProduct = await productService.updateProduct(product.id, {
            price: 79.99,
            stock: 40,
            isFeatured: true,
        });
        logger_1.logger.info('Product updated successfully', {
            productId: updatedProduct.id,
            newPrice: updatedProduct.price,
            newStock: updatedProduct.stock,
        });
        // 4. Demonstrate error handling with duplicate SKU
        logger_1.logger.info('\n4. Demonstrating error handling (duplicate SKU)');
        try {
            await productService.createProduct({
                name: 'Another Gaming Mouse',
                description: 'Another gaming mouse',
                sku: 'MOUSE-GAMING-001', // Same SKU as before
                category: 'gaming-peripherals',
                price: 59.99,
                stock: 20,
                slug: 'another-gaming-mouse',
                images: '[]',
                specifications: '{}',
                tags: '[]',
                isActive: true,
                isDeleted: false,
                isFeatured: false,
            });
        }
        catch (error) {
            if (error instanceof demo_product_service_1.DuplicateProductError) {
                logger_1.logger.info('Successfully caught duplicate SKU error', { message: error.message });
            }
            else {
                logger_1.logger.error('Unexpected error', { message: error.message });
            }
        }
        // 5. Demonstrate error handling with validation
        logger_1.logger.info('\n5. Demonstrating error handling (validation)');
        try {
            await productService.createProduct({
                name: '', // Empty name (validation error)
                description: 'A product with validation errors',
                sku: 'INVALID-001',
                category: '', // Empty category (validation error)
                price: -10, // Negative price (validation error)
                stock: -5, // Negative stock (validation error)
                slug: 'invalid-product',
                images: '[]',
                specifications: '{}',
                tags: '[]',
                isActive: true,
                isDeleted: false,
                isFeatured: false,
            });
        }
        catch (error) {
            if (error instanceof demo_product_service_1.ProductValidationError) {
                logger_1.logger.info('Successfully caught validation error', {
                    message: error.message,
                    validationErrors: error.validationErrors,
                });
            }
            else {
                logger_1.logger.error('Unexpected error', { message: error.message });
            }
        }
        // 6. Get products with filtering
        logger_1.logger.info('\n6. Getting products with filters');
        const productsResult = await productService.getProducts({
            page: 1,
            limit: 10,
            filters: {
                category: 'gaming-peripherals',
                minPrice: 50,
                isFeatured: true,
            },
        });
        logger_1.logger.info('Products retrieved successfully', {
            count: productsResult.products.length,
            total: productsResult.total,
            pages: productsResult.pages,
        });
        // 7. Bulk update stock
        logger_1.logger.info('\n7. Performing bulk stock update');
        await productService.bulkUpdateStock([{ productId: product.id, newStock: 25 }]);
        logger_1.logger.info('Bulk stock update completed');
        // Verify stock update
        const updatedStockProduct = await productService.getProductById(product.id);
        logger_1.logger.info('Stock updated successfully', {
            productId: updatedStockProduct.id,
            newStock: updatedStockProduct.stock,
        });
        // 8. Delete a product (soft delete)
        logger_1.logger.info('\n8. Soft deleting a product');
        await productService.deleteProduct(product.id);
        logger_1.logger.info('Product soft deleted', { productId: product.id });
        // 9. Demonstrate error handling with not found product
        logger_1.logger.info('\n9. Demonstrating error handling (not found)');
        try {
            await productService.getProductById('nonexistent-id');
        }
        catch (error) {
            if (error instanceof demo_product_service_1.ProductNotFoundError) {
                logger_1.logger.info('Successfully caught not found error', { message: error.message });
            }
            else {
                logger_1.logger.error('Unexpected error', { message: error.message });
            }
        }
        logger_1.logger.info('Enhanced Product Service demonstration completed successfully');
    }
    catch (error) {
        logger_1.logger.error('Error in demonstration', { error: error.message, stack: error.stack });
    }
}
// Execute the example when this file is run directly
if (require.main === module) {
    runExample().catch((err) => {
        logger_1.logger.error('Failed to run example', { error: err.message, stack: err.stack });
        process.exit(1);
    });
}
//# sourceMappingURL=demo-example.js.map