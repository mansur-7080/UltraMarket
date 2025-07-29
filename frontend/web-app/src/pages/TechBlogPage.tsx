import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './TechBlogPage.css';

interface TechArticle {
  id: string;
  title: string;
  titleUz: string;
  excerpt: string;
  excerptUz: string;
  content: string;
  contentUz: string;
  category: 'review' | 'news' | 'tutorial' | 'comparison' | 'benchmark';
  author: {
    name: string;
    avatar: string;
    expertise: string[];
    verified: boolean;
  };
  featuredImage: string;
  gallery: string[];
  tags: string[];
  publishedAt: Date;
  readTime: number;
  views: number;
  likes: number;
  featured: boolean;
  relatedProducts: string[];
  specs?: any;
  benchmarkResults?: any;
  pros?: string[];
  cons?: string[];
  rating?: number;
}

interface TechNews {
  id: string;
  title: string;
  titleUz: string;
  summary: string;
  summaryUz: string;
  source: string;
  publishedAt: Date;
  category: 'industry' | 'product-launch' | 'tech-trends' | 'company-news';
  urgent: boolean;
  image: string;
}

const TechBlogPage: React.FC = () => {
  const [articles, setArticles] = useState<TechArticle[]>([]);
  const [news, setNews] = useState<TechNews[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<TechArticle | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTechContent();
  }, [activeCategory]);

  const fetchTechContent = async () => {
    setLoading(true);
    try {
      // Mock data - in real app, fetch from API
      const mockArticles: TechArticle[] = [
        {
          id: 'rtx-4090-review',
          title: 'NVIDIA RTX 4090 Complete Review: The Ultimate Gaming GPU',
          titleUz: "NVIDIA RTX 4090 To'liq Sharhi: Ultimate Gaming GPU",
          excerpt:
            'Our comprehensive review of the RTX 4090, including 4K gaming benchmarks, ray tracing performance, and value analysis.',
          excerptUz:
            "RTX 4090 ning to'liq sharhi, 4K gaming benchmark, ray tracing unumdorligi va qiymat tahlili bilan.",
          content: 'Full review content...',
          contentUz: "To'liq sharh matni...",
          category: 'review',
          author: {
            name: 'Alex Chen',
            avatar: '/images/authors/alex-chen.jpg',
            expertise: ['GPU Reviews', 'Gaming Performance', 'Ray Tracing'],
            verified: true,
          },
          featuredImage: '/images/articles/rtx-4090-review.jpg',
          gallery: [
            '/images/articles/rtx-4090-1.jpg',
            '/images/articles/rtx-4090-2.jpg',
            '/images/articles/rtx-4090-3.jpg',
          ],
          tags: ['NVIDIA', 'RTX 4090', 'GPU', 'Gaming', '4K', 'Ray Tracing'],
          publishedAt: new Date('2024-01-20'),
          readTime: 12,
          views: 15420,
          likes: 892,
          featured: true,
          relatedProducts: ['rtx-4090', 'rtx-4080', 'rtx-4070-ti'],
          specs: {
            cudaCores: 16384,
            memory: '24GB GDDR6X',
            memoryBus: '384-bit',
            baseClock: '2230 MHz',
            boostClock: '2520 MHz',
            powerConsumption: '450W',
          },
          benchmarkResults: {
            cyberpunk4k: 85,
            controlRayTracing: 120,
            assassinsCreed4k: 95,
            dlss3Performance: '2.3x improvement',
          },
          pros: [
            'Exceptional 4K gaming performance',
            'Outstanding ray tracing capabilities',
            'Large 24GB VRAM buffer',
            'DLSS 3 Frame Generation',
            'Excellent build quality',
          ],
          cons: [
            'Very high power consumption (450W)',
            'Expensive price point',
            'Requires robust cooling',
            'Large physical footprint',
          ],
          rating: 9.2,
        },
        {
          id: 'ryzen-7800x3d-gaming',
          title: 'AMD Ryzen 7 7800X3D: The Gaming Champion',
          titleUz: 'AMD Ryzen 7 7800X3D: Gaming Chempioni',
          excerpt: "Deep dive into the 7800X3D's gaming performance with 3D V-Cache technology.",
          excerptUz:
            '3D V-Cache texnologiyasi bilan 7800X3D ning gaming unumdorligiga chuqur nazar.',
          content: 'Full article content...',
          contentUz: "To'liq maqola matni...",
          category: 'review',
          author: {
            name: 'Sarah Kim',
            avatar: '/images/authors/sarah-kim.jpg',
            expertise: ['CPU Reviews', 'Gaming Benchmarks', 'AMD Technology'],
            verified: true,
          },
          featuredImage: '/images/articles/ryzen-7800x3d.jpg',
          gallery: ['/images/articles/ryzen-7800x3d-1.jpg'],
          tags: ['AMD', 'Ryzen', '7800X3D', 'Gaming', '3D V-Cache'],
          publishedAt: new Date('2024-01-18'),
          readTime: 10,
          views: 12350,
          likes: 645,
          featured: false,
          relatedProducts: ['ryzen-7800x3d', 'ryzen-7700x', 'intel-i7-13700k'],
          rating: 9.0,
        },
        {
          id: 'ddr5-buyers-guide',
          title: "DDR5 Memory Buyer's Guide 2024: Speed vs Value",
          titleUz: "DDR5 Xotira Xaridorlar Qo'llanmasi 2024: Tezlik vs Qiymat",
          excerpt: 'Complete guide to choosing the right DDR5 memory for your system.',
          excerptUz: "Tizimingiz uchun to'g'ri DDR5 xotirani tanlash bo'yicha to'liq qo'llanma.",
          content: 'Detailed guide content...',
          contentUz: "Batafsil qo'llanma matni...",
          category: 'tutorial',
          author: {
            name: 'Mike Rodriguez',
            avatar: '/images/authors/mike-rodriguez.jpg',
            expertise: ['Memory Technology', 'System Building', 'Performance Tuning'],
            verified: true,
          },
          featuredImage: '/images/articles/ddr5-guide.jpg',
          gallery: [],
          tags: ['DDR5', 'Memory', 'RAM', 'Buying Guide', 'Performance'],
          publishedAt: new Date('2024-01-15'),
          readTime: 8,
          views: 8920,
          likes: 423,
          featured: false,
          relatedProducts: ['ddr5-6000', 'ddr5-5600', 'ddr5-4800'],
          rating: 8.5,
        },
      ];

      const mockNews: TechNews[] = [
        {
          id: 'intel-14th-gen-announcement',
          title: 'Intel Announces 14th Gen Core Processors',
          titleUz: "Intel 14-avlod Core protsessorlarini e'lon qildi",
          summary:
            'Intel reveals new 14th generation processors with improved performance and efficiency.',
          summaryUz:
            'Intel yaxshilangan unumdorlik va samaradorlik bilan yangi 14-avlod protsessorlarini taqdim etdi.',
          source: 'Intel Corporation',
          publishedAt: new Date('2024-01-22'),
          category: 'product-launch',
          urgent: true,
          image: '/images/news/intel-14th-gen.jpg',
        },
        {
          id: 'nvidia-ai-breakthrough',
          title: 'NVIDIA Breakthrough in AI Computing',
          titleUz: 'NVIDIA AI Computing sohasida yangilik',
          summary:
            'NVIDIA announces new AI computing architecture with significant performance improvements.',
          summaryUz:
            "NVIDIA muhim unumdorlik yaxshilanishlari bilan yangi AI computing arxitekturasini e'lon qildi.",
          source: 'NVIDIA',
          publishedAt: new Date('2024-01-21'),
          category: 'tech-trends',
          urgent: false,
          image: '/images/news/nvidia-ai.jpg',
        },
      ];

      // Filter articles by category
      let filteredArticles = mockArticles;
      if (activeCategory !== 'all') {
        filteredArticles = mockArticles.filter((article) => article.category === activeCategory);
      }

      setArticles(filteredArticles);
      setNews(mockNews);
      setFeaturedArticle(mockArticles.find((a) => a.featured) || mockArticles[0]);
    } catch (error) {
      // Error should be handled through proper error boundary
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'Barchasi', nameEn: 'All', icon: '📚' },
    { id: 'review', name: 'Sharhlar', nameEn: 'Reviews', icon: '⭐' },
    { id: 'news', name: 'Yangiliklar', nameEn: 'News', icon: '📰' },
    { id: 'tutorial', name: "Qo'llanma", nameEn: 'Tutorials', icon: '🎓' },
    { id: 'comparison', name: 'Taqqoslash', nameEn: 'Comparisons', icon: '⚖️' },
    { id: 'benchmark', name: 'Benchmark', nameEn: 'Benchmarks', icon: '📊' },
  ];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  if (loading) {
    return (
      <div className="tech-blog-loading">
        <div className="loading-spinner"></div>
        <p>Tech kontentlar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="tech-blog-page">
      {/* Header */}
      <div className="blog-header">
        <div className="container">
          <h1>🔧 UltraMarket Tech Hub</h1>
          <p>Professional tech reviews, news va tutorials O'zbekiston uchun</p>

          {/* Category Filter */}
          <div className="category-filter">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                <span className="icon">{category.icon}</span>
                <span className="name">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="blog-content">
          {/* Featured Article */}
          {featuredArticle && (
            <section className="featured-section">
              <h2>📍 Asosiy Maqola</h2>
              <div className="featured-article">
                <div className="featured-image">
                  <img src={featuredArticle.featuredImage} alt={featuredArticle.title} />
                  <div className="featured-badge">Featured</div>
                </div>
                <div className="featured-content">
                  <div className="article-meta">
                    <span className="category">{featuredArticle.category}</span>
                    <span className="read-time">{featuredArticle.readTime} min o'qish</span>
                    {featuredArticle.rating && (
                      <span className="rating">⭐ {featuredArticle.rating}/10</span>
                    )}
                  </div>
                  <h3>{featuredArticle.titleUz}</h3>
                  <p>{featuredArticle.excerptUz}</p>

                  {/* Author Info */}
                  <div className="author-info">
                    <img src={featuredArticle.author.avatar} alt={featuredArticle.author.name} />
                    <div className="author-details">
                      <span className="author-name">
                        {featuredArticle.author.name}
                        {featuredArticle.author.verified && <span className="verified">✓</span>}
                      </span>
                      <span className="publish-date">
                        {formatDate(featuredArticle.publishedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Article Stats */}
                  <div className="article-stats">
                    <span>👁️ {formatViews(featuredArticle.views)} ko'rishlar</span>
                    <span>❤️ {featuredArticle.likes} yoqish</span>
                  </div>

                  {/* Quick Specs (for reviews) */}
                  {featuredArticle.specs && (
                    <div className="quick-specs">
                      <h4>Asosiy Spetsifikatsiyalar</h4>
                      <div className="specs-grid">
                        {Object.entries(featuredArticle.specs)
                          .slice(0, 4)
                          .map(([key, value]) => (
                            <div key={key} className="spec-item">
                              <span className="spec-label">{key}</span>
                              <span className="spec-value">{value}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <Link to={`/tech-blog/${featuredArticle.id}`} className="read-more-btn">
                    To'liq o'qish
                  </Link>
                </div>
              </div>
            </section>
          )}

          <div className="blog-main">
            {/* Latest News Sidebar */}
            <aside className="news-sidebar">
              <h3>📰 So'nggi Yangiliklar</h3>
              <div className="news-list">
                {news.map((newsItem) => (
                  <div key={newsItem.id} className="news-item">
                    {newsItem.urgent && <div className="urgent-badge">Muhim</div>}
                    <img src={newsItem.image} alt={newsItem.title} />
                    <div className="news-content">
                      <h4>{newsItem.titleUz}</h4>
                      <p>{newsItem.summaryUz}</p>
                      <div className="news-meta">
                        <span className="source">{newsItem.source}</span>
                        <span className="date">{formatDate(newsItem.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* Articles Grid */}
            <main className="articles-main">
              <h3>📚 Barcha Maqolalar</h3>
              <div className="articles-grid">
                {articles
                  .filter((article) => !article.featured)
                  .map((article) => (
                    <article key={article.id} className="article-card">
                      <div className="article-image">
                        <img src={article.featuredImage} alt={article.title} />
                        <div className="article-category">{article.category}</div>
                      </div>

                      <div className="article-content">
                        <h4>{article.titleUz}</h4>
                        <p>{article.excerptUz}</p>

                        <div className="article-tags">
                          {article.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="tag">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="article-footer">
                          <div className="author-mini">
                            <img src={article.author.avatar} alt={article.author.name} />
                            <span>{article.author.name}</span>
                          </div>
                          <div className="article-meta">
                            <span>⏱️ {article.readTime} min</span>
                            <span>👁️ {formatViews(article.views)}</span>
                          </div>
                        </div>

                        {/* Rating for reviews */}
                        {article.rating && (
                          <div className="article-rating">
                            <span className="rating-score">⭐ {article.rating}/10</span>
                            <span className="rating-text">
                              {article.rating >= 9
                                ? "A'lo"
                                : article.rating >= 8
                                  ? 'Yaxshi'
                                  : article.rating >= 7
                                    ? "O'rtacha"
                                    : 'Past'}
                            </span>
                          </div>
                        )}

                        <Link to={`/tech-blog/${article.id}`} className="read-article-btn">
                          O'qish
                        </Link>
                      </div>
                    </article>
                  ))}
              </div>

              {/* Load More */}
              <div className="load-more-section">
                <button className="load-more-btn">Ko'proq yuklash</button>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Tech Topics */}
      <section className="tech-topics">
        <div className="container">
          <h3>🔥 Mashhur Mavzular</h3>
          <div className="topics-grid">
            <div className="topic-card">
              <span className="topic-icon">🎮</span>
              <h4>Gaming Reviews</h4>
              <p>Latest gaming hardware reviews</p>
              <span className="topic-count">25 maqola</span>
            </div>
            <div className="topic-card">
              <span className="topic-icon">💻</span>
              <h4>PC Building</h4>
              <p>Step-by-step build guides</p>
              <span className="topic-count">18 qo'llanma</span>
            </div>
            <div className="topic-card">
              <span className="topic-icon">📊</span>
              <h4>Benchmarks</h4>
              <p>Performance testing results</p>
              <span className="topic-count">32 test</span>
            </div>
            <div className="topic-card">
              <span className="topic-icon">💡</span>
              <h4>Tech Tips</h4>
              <p>Optimization and troubleshooting</p>
              <span className="topic-count">45 maslahat</span>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <h3>📧 Tech Yangiliklar</h3>
            <p>Haftalik tech news va exclusive reviews uchun obuna bo'ling</p>
            <div className="newsletter-form">
              <input type="email" placeholder="Email manzilingiz" />
              <button type="submit">Obuna bo'lish</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TechBlogPage;
