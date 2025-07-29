import React, { useState, useEffect } from 'react';
import './ProductComparison.css';

interface Product {
  id: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  rating: number;
  specs: {
    [key: string]: any;
  };
  category: string;
}

interface ComparisonProps {
  category: string;
  initialProducts?: Product[];
}

const ProductComparison: React.FC<ComparisonProps> = ({ category, initialProducts = [] }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [highlightDifferences, setHighlightDifferences] = useState<boolean>(true);

  useEffect(() => {
    // Mahsulot ma'lumotlarini olish - real dasturda API dan olinadi
    fetchProductsForCategory(category);
  }, [category]);

  const fetchProductsForCategory = async (category: string) => {
    setLoading(true);
    try {
      // Mock data - real dasturda API dan olinadi
      const mockProducts: Product[] = [
        {
          id: 'gpu-1',
          name: 'NVIDIA GeForce RTX 4060',
          brand: 'NVIDIA',
          image: '/images/products/rtx-4060.jpg',
          price: 3800000,
          rating: 4.7,
          category: 'gpu',
          specs: {
            memory: '8GB GDDR6',
            coreClock: '1830 MHz',
            boostClock: '2460 MHz',
            memoryBus: '128-bit',
            tdp: '115W',
            ports: 'HDMI 2.1, 3x DP 1.4a',
            rayTracing: 'Yes',
            dlss: 'DLSS 3',
            length: '242mm',
          },
        },
        {
          id: 'gpu-2',
          name: 'AMD Radeon RX 7600',
          brand: 'AMD',
          image: '/images/products/rx-7600.jpg',
          price: 3200000,
          rating: 4.5,
          category: 'gpu',
          specs: {
            memory: '8GB GDDR6',
            coreClock: '1720 MHz',
            boostClock: '2250 MHz',
            memoryBus: '128-bit',
            tdp: '165W',
            ports: 'HDMI 2.1, 3x DP 1.4a',
            rayTracing: 'Yes',
            dlss: 'FSR 3',
            length: '267mm',
          },
        },
        {
          id: 'gpu-3',
          name: 'NVIDIA GeForce RTX 4070',
          brand: 'NVIDIA',
          image: '/images/products/rtx-4070.jpg',
          price: 5600000,
          rating: 4.8,
          category: 'gpu',
          specs: {
            memory: '12GB GDDR6X',
            coreClock: '1920 MHz',
            boostClock: '2475 MHz',
            memoryBus: '192-bit',
            tdp: '200W',
            ports: 'HDMI 2.1, 3x DP 1.4a',
            rayTracing: 'Yes',
            dlss: 'DLSS 3',
            length: '244mm',
          },
        },
      ];

      const categoryProducts = mockProducts.filter((p) => p.category === category);
      setAvailableProducts(categoryProducts);

      // Default holda 2 ta mahsulotni tanlash
      if (initialProducts.length === 0 && categoryProducts.length >= 2) {
        setProducts(categoryProducts.slice(0, 2));
      }

      // Mavjud spetsifikatsiyalarni olish
      if (categoryProducts.length > 0) {
        setSelectedSpecs(Object.keys(categoryProducts[0].specs));
      }
    } catch (error) {
              // Error should be handled through proper error boundary
    } finally {
      setLoading(false);
    }
  };

  const addProductToComparison = (product: Product) => {
    if (products.length < 4) {
      // Maximum 4 ta mahsulot solishtirish
      setProducts([...products, product]);
    }
  };

  const removeProductFromComparison = (productId: string) => {
    setProducts(products.filter((p) => p.id !== productId));
  };

  const toggleSpec = (spec: string) => {
    if (selectedSpecs.includes(spec)) {
      setSelectedSpecs(selectedSpecs.filter((s) => s !== spec));
    } else {
      setSelectedSpecs([...selectedSpecs, spec]);
    }
  };

  const isDifferent = (spec: string): boolean => {
    if (!highlightDifferences || products.length <= 1) return false;

    const values = products.map((p) => p.specs[spec]);
    return !values.every((v) => v === values[0]);
  };

  if (loading) {
    return <div className="comparison-loading">Mahsulotlar yuklanmoqda...</div>;
  }

  return (
    <div className="product-comparison">
      <div className="comparison-header">
        <h2>{category.toUpperCase()} Mahsulotlarni Solishtirish</h2>
        <div className="comparison-controls">
          <div className="toggle-highlight">
            <input
              type="checkbox"
              id="highlight-toggle"
              checked={highlightDifferences}
              onChange={() => setHighlightDifferences(!highlightDifferences)}
            />
            <label htmlFor="highlight-toggle">Farqlarni ajratib ko'rsatish</label>
          </div>

          {products.length < 4 && (
            <div className="add-product-dropdown">
              <select
                onChange={(e) => {
                  const selected = availableProducts.find((p) => p.id === e.target.value);
                  if (selected && !products.some((p) => p.id === selected.id)) {
                    addProductToComparison(selected);
                  }
                  e.target.value = '';
                }}
                value=""
              >
                <option value="" disabled>
                  + Mahsulot qo'shish
                </option>
                {availableProducts
                  .filter((p) => !products.some((sp) => sp.id === p.id))
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.brand} {product.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="comparison-table-container">
        <table className="comparison-table">
          <thead>
            <tr>
              <th className="spec-column">Xususiyat</th>
              {products.map((product) => (
                <th key={product.id} className="product-column">
                  <div className="product-header">
                    <img src={product.image} alt={product.name} />
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <div className="product-meta">
                        <span className="brand">{product.brand}</span>
                        <span className="rating">★ {product.rating.toFixed(1)}</span>
                        <span className="price">
                          {new Intl.NumberFormat('uz-UZ').format(product.price)} so'm
                        </span>
                      </div>
                    </div>
                    <button
                      className="remove-product"
                      onClick={() => removeProductFromComparison(product.id)}
                    >
                      ✕
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selectedSpecs.map((spec) => (
              <tr key={spec} className={isDifferent(spec) ? 'highlight-row' : ''}>
                <td className="spec-name">
                  <div className="spec-toggle">
                    <input
                      type="checkbox"
                      id={`spec-${spec}`}
                      checked={true}
                      onChange={() => toggleSpec(spec)}
                    />
                    <label htmlFor={`spec-${spec}`}>{spec}</label>
                  </div>
                </td>
                {products.map((product) => (
                  <td
                    key={`${product.id}-${spec}`}
                    className={isDifferent(spec) ? 'highlight-cell' : ''}
                  >
                    {product.specs[spec]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductComparison;
