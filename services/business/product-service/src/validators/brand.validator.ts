/**
 * Brand Validation Schemas
 */

import { body, param } from 'express-validator';

export const brandValidation = {
  create: [
    body('name').notEmpty().withMessage('Name is required').isLength({ max: 255 }).withMessage('Name too long'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
    body('website').optional().isURL().withMessage('Invalid website URL')
  ],

  update: [
    param('id').isUUID().withMessage('Invalid brand ID'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
    body('website').optional().isURL().withMessage('Invalid website URL')
  ]
}; 