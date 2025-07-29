import express from 'express';

const router = express.Router();

// GET /api/v1/products
router.get('/', async (req, res) => {
  try {
    console.log('Getting all products');
    res.json({
      success: true,
      data: [],
      message: 'Products retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting products', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Getting product by id', { id });
    res.json({
      success: true,
      data: { id, name: 'Sample Product' },
      message: 'Product retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting product', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;