/**
 * Category Validation Schemas
 */

import { body, param } from 'express-validator';

export const categoryValidation = {
  create: [
    body('name').notEmpty().withMessage('Name is required').isLength({ max: 255 }).withMessage('Name too long'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
    body('parentId').optional().isUUID().withMessage('Invalid parent ID'),
    body('position').optional().isInt({ min: 0 }).withMessage('Position must be non-negative')
  ],

  update: [
    param('id').isUUID().withMessage('Invalid category ID'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
    body('parentId').optional().isUUID().withMessage('Invalid parent ID')
  ]
}; 