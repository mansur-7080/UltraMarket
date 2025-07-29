"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const express_validator_1 = require("express-validator");
const category_service_1 = require("../services/category.service");
const shared_1 = require("../shared");
class CategoryController {
    categoryService;
    constructor() {
        this.categoryService = new category_service_1.CategoryService();
    }
    /**
     * Get all categories with pagination and filtering
     */
    getCategories = async (req, res, next) => {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new shared_1.AppError(400, 'Validation failed');
            }
            // Cast query params to CategoryQueryParams
            const queryParams = {
                page: req.query.page ? parseInt(req.query.page) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
                search: req.query.search,
                isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
                parentId: req.query.parentId === 'null' ? null : req.query.parentId,
                includeChildren: req.query.includeChildren === 'true',
                sortBy: req.query.sortBy || 'sortOrder',
                sortOrder: req.query.sortOrder || 'asc',
            };
            const categories = await this.categoryService.getCategories(queryParams);
            shared_1.logger.info('Categories retrieved successfully', {
                count: categories.items.length,
                page: categories.page,
                totalItems: categories.total,
            });
            res.json(categories);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get category tree
     */
    getCategoryTree = async (req, res, next) => {
        try {
            const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;
            const categories = await this.categoryService.getCategoryTree(isActive);
            shared_1.logger.info('Category tree retrieved successfully', {
                count: categories.length,
            });
            res.json(categories);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get a single category by ID
     */
    getCategoryById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const includeChildren = req.query.includeChildren === 'true';
            const category = await this.categoryService.getCategoryById(id, includeChildren);
            res.json(category);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get a single category by slug
     */
    getCategoryBySlug = async (req, res, next) => {
        try {
            const { slug } = req.params;
            const includeChildren = req.query.includeChildren === 'true';
            const category = await this.categoryService.getCategoryBySlug(slug, includeChildren);
            res.json(category);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Create a new category
     */
    createCategory = async (req, res, next) => {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new shared_1.AppError(400, 'Validation failed');
            }
            const categoryData = req.body;
            const newCategory = await this.categoryService.createCategory(categoryData);
            shared_1.logger.info('Category created successfully', { id: newCategory.id });
            res.status(201).json(newCategory);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Update an existing category
     */
    updateCategory = async (req, res, next) => {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new shared_1.AppError(400, 'Validation failed');
            }
            const { id } = req.params;
            const categoryData = req.body;
            const updatedCategory = await this.categoryService.updateCategory(id, categoryData);
            shared_1.logger.info('Category updated successfully', { id });
            res.json(updatedCategory);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Delete a category
     */
    deleteCategory = async (req, res, next) => {
        try {
            const { id } = req.params;
            await this.categoryService.deleteCategory(id);
            shared_1.logger.info('Category deleted successfully', { id });
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Input validation rules
     */
    static validateCreateCategory = [
        (0, express_validator_1.body)('name').isString().notEmpty().withMessage('Name is required'),
        (0, express_validator_1.body)('parentId').optional().isUUID().withMessage('Parent ID must be a valid UUID'),
    ];
    static validateUpdateCategory = [
        (0, express_validator_1.body)('name').optional().isString().notEmpty().withMessage('Name must be a non-empty string'),
        (0, express_validator_1.body)('parentId').optional().isUUID().withMessage('Parent ID must be a valid UUID'),
        (0, express_validator_1.body)('sortOrder')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Sort order must be a non-negative integer'),
    ];
    static validateGetCategories = [
        (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1-100'),
    ];
}
exports.CategoryController = CategoryController;
//# sourceMappingURL=category.controller.js.map