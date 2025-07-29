import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  FlashOn,
  Memory,
  MemoryOutlined,
  CompareArrows,
  AddShoppingCart,
  Favorite,
  Share,
  Build,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { styled } from '@mui/system';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import RatingStars from '../../components/common/RatingStars';
import PriceDisplay from '../../components/common/PriceDisplay';
import ProductGallery from '../../components/product/ProductGallery';
import ProductReviews from '../../components/product/ProductReviews';
import SimilarProducts from '../../components/product/SimilarProducts';
import ProductSpecifications from '../../components/product/ProductSpecifications';
import PCBuilderCompatibility from '../../components/product/PCBuilderCompatibility';
import { fetchProductById, fetchProductReviews, fetchSimilarProducts } from '../../services/api';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
}));

const ProductHighlight = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
}));

const ProductDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [comparisonList, setComparisonList] = useState([]);

  // Fetch product data
  const {
    data: product,
    isLoading: isProductLoading,
    error: productError,
  } = useQuery(['product', id], () => fetchProductById(id), { enabled: !!id });

  // Fetch reviews
  const { data: reviews, isLoading: areReviewsLoading } = useQuery(
    ['productReviews', id],
    () => fetchProductReviews(id),
    { enabled: !!id }
  );

  // Fetch similar products
  const { data: similarProducts, isLoading: areSimilarLoading } = useQuery(
    ['similarProducts', id],
    () => fetchSimilarProducts(id, product?.category),
    { enabled: !!id && !!product?.category }
  );

  // Add to compare list mutation
  const addToCompare = () => {
    if (!product) return;

    // Get current comparison list from localStorage
    const currentList = JSON.parse(localStorage.getItem('comparisonList') || '[]');

    // Check if product is already in the list
    if (currentList.some((item) => item.id === product.id)) {
      toast.info("Bu mahsulot taqqoslash ro'yxatida mavjud");
      return;
    }

    // Check if we're comparing different categories
    if (currentList.length > 0 && currentList[0].category !== product.category) {
      toast.warning('Faqat bir xil kategoriya mahsulotlarini taqqoslash mumkin');
      return;
    }

    // Add to list (max 4)
    if (currentList.length >= 4) {
      toast.warning('Maksimal 4 ta mahsulotni taqqoslash mumkin');
      return;
    }

    // Add product to comparison list
    const newList = [
      ...currentList,
      {
        id: product.id,
        name: product.name,
        image: product.images[0],
        price: product.price,
        category: product.category,
      },
    ];

    localStorage.setItem('comparisonList', JSON.stringify(newList));
    setComparisonList(newList);
    toast.success("Mahsulot taqqoslash ro'yxatiga qo'shildi");
  };

  // Add to cart handler
  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: 1,
    });

    toast.success("Mahsulot savatga qo'shildi");
  };

  // Add to wishlist handler
  const handleAddToWishlist = () => {
    if (!product) return;

    addToWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
    });

    toast.success("Mahsulot istaklar ro'yxatiga qo'shildi");
  };

  // Share product handler
  const handleShareProduct = () => {
    if (navigator.share && product) {
      navigator
        .share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        })
        .catch((error) => console.log('Share error:', error));
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Mahsulot havolasi nusxalandi');
    }
  };

  // Check if product is PC component for PC Builder compatibility
  const isPCComponent =
    product &&
    ['cpu', 'motherboard', 'gpu', 'memory', 'storage', 'power_supply', 'case', 'cooling'].includes(
      product.category
    );

  // Load comparison list from localStorage on mount
  useEffect(() => {
    const storedList = JSON.parse(localStorage.getItem('comparisonList') || '[]');
    setComparisonList(storedList);
  }, []);

  if (isProductLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="text" height={60} />
            <Skeleton variant="text" height={30} />
            <Skeleton variant="text" height={30} />
            <Box sx={{ my: 2 }}>
              <Skeleton variant="rectangular" height={60} />
            </Box>
            <Skeleton variant="rectangular" height={150} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (productError || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5" color="error" align="center">
          Mahsulot ma'lumotlarini yuklashda xatolik yuz berdi
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button variant="outlined" onClick={() => router.back()}>
            Orqaga qaytish
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Product Gallery */}
        <Grid item xs={12} md={6}>
          <ProductGallery images={product.images} />
        </Grid>

        {/* Product Details */}
        <Grid item xs={12} md={6}>
          <Typography variant="h4" component="h1" gutterBottom>
            {product.name}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <RatingStars value={product.rating} />
            <Typography variant="body2" sx={{ ml: 1 }}>
              ({product.reviewCount} sharhlar)
            </Typography>
            <Typography variant="body2" sx={{ ml: 2, color: 'success.main' }}>
              {product.inStock ? 'Sotuvda mavjud' : "Sotuvda yo'q"}
            </Typography>
          </Box>

          <Typography variant="h5" color="primary" gutterBottom>
            <PriceDisplay
              price={product.price}
              originalPrice={product.originalPrice}
              currency="UZS"
            />
          </Typography>

          {/* Quick highlights */}
          {product.highlights &&
            product.highlights.map((highlight, index) => (
              <ProductHighlight key={index}>
                <FlashOn />
                <Typography variant="body1">{highlight}</Typography>
              </ProductHighlight>
            ))}

          {/* Action buttons */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 3 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<AddShoppingCart />}
              onClick={handleAddToCart}
              disabled={!product.inStock}
              fullWidth={false}
            >
              Savatga qo'shish
            </Button>

            <Button
              variant="outlined"
              color="primary"
              startIcon={<Favorite color={isInWishlist(product.id) ? 'error' : 'inherit'} />}
              onClick={handleAddToWishlist}
            >
              Istaklarga
            </Button>

            <Button
              variant="outlined"
              color="primary"
              startIcon={<CompareArrows />}
              onClick={addToCompare}
            >
              Taqqoslash
            </Button>

            <Button
              variant="outlined"
              color="primary"
              startIcon={<Share />}
              onClick={handleShareProduct}
            >
              Ulashish
            </Button>
          </Box>

          {/* PC Builder compatibility check */}
          {isPCComponent && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Build sx={{ mr: 1 }} /> PC Builder Moslik Tekshirish
              </Typography>
              <PCBuilderCompatibilitySection product={product} />
            </Box>
          )}

          {/* Key specifications */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Asosiy xususiyatlar
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  {Object.entries(product.keySpecs || {}).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{ width: '40%', fontWeight: 'bold' }}
                      >
                        {key}
                      </TableCell>
                      <TableCell>{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Grid>
      </Grid>

      {/* Tabs for detailed information */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Box sx={{ display: 'flex', overflowX: 'auto' }}>
            {['overview', 'specifications', 'reviews', 'faq'].map((tab) => (
              <Button
                key={tab}
                sx={{
                  px: 3,
                  py: 1.5,
                  borderBottom: selectedTab === tab ? 2 : 0,
                  borderColor: 'primary.main',
                  borderRadius: 0,
                  color: selectedTab === tab ? 'primary.main' : 'text.primary',
                }}
                onClick={() => setSelectedTab(tab)}
              >
                {tab === 'overview' && "Umumiy ma'lumot"}
                {tab === 'specifications' && 'Xususiyatlar'}
                {tab === 'reviews' && 'Sharhlar'}
                {tab === 'faq' && "Ko'p so'raladigan savollar"}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Tab content */}
        <StyledPaper>
          {selectedTab === 'overview' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Mahsulot haqida
              </Typography>
              <Typography variant="body1" paragraph>
                {product.description}
              </Typography>

              {/* Features with icons */}
              {product.features && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Asosiy xususiyatlar
                  </Typography>
                  <Grid container spacing={2}>
                    {product.features.map((feature, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FlashOn color="primary" />
                          <Typography variant="body1" sx={{ ml: 1 }}>
                            {feature}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          )}

          {selectedTab === 'specifications' && (
            <ProductSpecifications specifications={product.specifications} />
          )}

          {selectedTab === 'reviews' && (
            <ProductReviews
              reviews={reviews || []}
              productId={product.id}
              isLoading={areReviewsLoading}
            />
          )}

          {selectedTab === 'faq' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Ko'p so'raladigan savollar
              </Typography>
              {product.faqs ? (
                product.faqs.map((faq, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {faq.question}
                    </Typography>
                    <Typography variant="body1">{faq.answer}</Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body1">
                  Hozircha savollar yo'q. Agar sizda savollar bo'lsa, bizga murojaat qiling.
                </Typography>
              )}
            </Box>
          )}
        </StyledPaper>
      </Box>

      {/* Similar Products */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          O'xshash mahsulotlar
        </Typography>
        <SimilarProducts products={similarProducts || []} isLoading={areSimilarLoading} />
      </Box>
    </Container>
  );
};

// PCBuilderCompatibility komponentini yangilaymiz
const PCBuilderCompatibilitySection = ({ product }) => {
  const [activeBuilds, setActiveBuilds] = useState([]);
  const [compatibility, setCompatibility] = useState({ isCompatible: true, issues: [] });
  const router = useRouter();

  useEffect(() => {
    // Get user's active builds from local storage
    const savedBuilds = localStorage.getItem('pc-builder-saved-builds');
    if (savedBuilds) {
      setActiveBuilds(JSON.parse(savedBuilds));
    }
  }, []);

  useEffect(() => {
    if (product && activeBuilds.length > 0) {
      // Check compatibility with active builds
      checkCompatibility(product);
    }
  }, [product, activeBuilds]);

  const checkCompatibility = async (product) => {
    try {
      // For demo, we're just simulating the API call
      // In production, this would call a real endpoint
      const componentType = getComponentType(product.category);

      // Simulated response for demo purposes
      const compatibilityResult = {
        isCompatible: Math.random() > 0.2, // 80% chance of compatibility for demo
        issues: [],
      };

      if (!compatibilityResult.isCompatible) {
        compatibilityResult.issues = [
          {
            severity: 'warning',
            message: `This ${componentType} might not be compatible with your current build.`,
          },
        ];
      }

      setCompatibility(compatibilityResult);
    } catch (error) {
      console.error('Error checking compatibility:', error);
    }
  };

  const getComponentType = (category) => {
    // Map product category to PC builder component type
    const categoryMapping = {
      processors: 'CPU',
      motherboards: 'motherboard',
      memory: 'RAM',
      'video-cards': 'GPU',
      storage: 'storage',
      cases: 'case',
      'power-supplies': 'power supply',
      'cpu-coolers': 'CPU cooler',
    };

    return categoryMapping[category] || category;
  };

  const addToBuild = () => {
    router.push(`/pc-builder?add=${product.id}`);
  };

  if (!product || !isComputerComponent(product.category)) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
          <Build sx={{ mr: 1 }} /> PC Builder Compatibility
        </Typography>
        <Button variant="outlined" color="primary" onClick={addToBuild} startIcon={<Memory />}>
          Add to PC Builder
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      {activeBuilds.length > 0 ? (
        <Box>
          {compatibility.isCompatible ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              This component is compatible with your current PC build.
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {compatibility.issues.map((issue, index) => (
                <div key={index}>{issue.message}</div>
              ))}
            </Alert>
          )}

          <Typography variant="subtitle2" gutterBottom>
            Component Type: {getComponentType(product.category)}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {compatibilityDetails(product)}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Start building your PC to check compatibility with this component.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<Build />}
            onClick={() => router.push('/pc-builder')}
            sx={{ mt: 1 }}
          >
            Start PC Builder
          </Button>
        </Box>
      )}
    </Paper>
  );
};

// Helper function to determine if a product is a computer component
const isComputerComponent = (category) => {
  const computerCategories = [
    'processors',
    'motherboards',
    'memory',
    'video-cards',
    'storage',
    'cases',
    'power-supplies',
    'cpu-coolers',
  ];

  return computerCategories.includes(category);
};

// Helper function to generate compatibility details based on product type
const compatibilityDetails = (product) => {
  const specs = product.specifications || {};

  switch (product.category) {
    case 'processors':
      return `Socket: ${specs.socket || 'Unknown'}, TDP: ${specs.tdp || 'Unknown'}W`;
    case 'motherboards':
      return `Socket: ${specs.socket || 'Unknown'}, Form Factor: ${specs.formFactor || 'Unknown'}`;
    case 'memory':
      return `Type: ${specs.type || 'Unknown'}, Speed: ${specs.speed || 'Unknown'}MHz`;
    case 'video-cards':
      return `Interface: PCIe, VRAM: ${specs.memory || 'Unknown'}GB`;
    default:
      return '';
  }
};

export default ProductDetailPage;
