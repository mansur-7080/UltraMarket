import express from 'express';

const router = express.Router();

// GET /api/v1/categories
router.get('/', async (req, res) => {
  try {
    console.log('Getting all categories');
    res.json({
      success: true,
      data: [],
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting categories', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/categories/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Getting category by id', { id });
    res.json({
      success: true,
      data: { id, name: 'Sample Category' },
      message: 'Category retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting category', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;