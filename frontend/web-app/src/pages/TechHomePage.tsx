import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './TechHomePage.css';
import './TechToolsSection.css';
import PCBuilder from '../components/tech/PCBuilder';
import ProductComparison from '../components/tech/ProductComparison';
import TechNews from '../components/tech/TechNews';
import NASBuilder from '../components/tech/NASBuilder';
import MemoryFinder from '../components/tech/MemoryFinder';

interface TechDeal {
  id: string;
  productName: string;
  originalPrice: number;
  currentPrice: number;
  discount: number;
  image: string;
  category: string;
  brand: string;
  endTime: Date;
}

interface TechNews {
  id: string;
  title: string;
  titleUz: string;
  excerpt: string;
  image: string;
  publishedAt: Date;
  category: 'review' | 'news' | 'tutorial';
}

interface PCBuild {
  id: string;
  name: string;
  nameUz: string;
  price: number;
  image: string;
  specs: {
    cpu: string;
    gpu: string;
    ram: string;
    storage: string;
  };
  performance: string;
}

const TechHomePage: React.FC = () => {
  const [featuredDeals, setFeaturedDeals] = useState<TechDeal[]>([]);
  const [techNews, setTechNews] = useState<TechNews[]>([]);
  const [buildOfTheDay, setBuildOfTheDay] = useState<PCBuild | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Fetch featured deals
    setFeaturedDeals([
      {
        id: '1',
        productName: 'NVIDIA GeForce RTX 4060',
        originalPrice: 4500000,
        currentPrice: 3800000,
        discount: 15,
        image: '/images/products/rtx4060.jpg',
        category: 'GPU',
        brand: 'NVIDIA',
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        id: '2',
        productName: 'AMD Ryzen 5 7600X',
        originalPrice: 3200000,
        currentPrice: 2800000,
        discount: 12,
        image: '/images/products/ryzen7600x.jpg',
        category: 'CPU',
        brand: 'AMD',
        endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
      },
    ]);

    // Fetch tech news
    setTechNews([
      {
        id: '1',
        title: 'NVIDIA RTX 4060 Review: Great 1080p Gaming',
        titleUz: 'NVIDIA RTX 4060 Sharhi: 1080p Gaming uchun Ajoyib',
        excerpt: 'Complete review of the new RTX 4060 graphics card...',
        image: '/images/news/rtx4060-review.jpg',
        publishedAt: new Date(),
        category: 'review',
      },
    ]);

    // Fetch build of the day
    setBuildOfTheDay({
      id: '1',
      name: 'Gaming Beast 4K',
      nameUz: 'Gaming Beast 4K',
      price: 18500000,
      image: '/images/builds/gaming-beast.jpg',
      specs: {
        cpu: 'Intel Core i7-13700K',
        gpu: 'NVIDIA RTX 4070 Ti',
        ram: '32GB DDR5-5600',
        storage: '2TB NVMe SSD',
      },
      performance: '4K Ultra Settings',
    });

    // Update time every second for countdown
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatPrice = (price: number) => {
    return (
      new Intl.NumberFormat('uz-UZ', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price) + " so'm"
    );
  };

  const getCountdown = (endTime: Date) => {
    const diff = endTime.getTime() - currentTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="tech-homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-gradient"></div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>O'zbekiston #1 Tech Platform</h1>
              <p>Kompyuter, elektronika va texnologiya mahsulotlari</p>
              <div className="hero-features">
                <div className="feature">
                  <span className="icon">🖥️</span>
                  <span>PC Builder</span>
                </div>
                <div className="feature">
                  <span className="icon">⚡</span>
                  <span>Tezkor Yetkazib berish</span>
                </div>
                <div className="feature">
                  <span className="icon">🛡️</span>
                  <span>Rasmiy Kafolat</span>
                </div>
                <div className="feature">
                  <span className="icon">💳</span>
                  <span>Click, Payme, Uzcard</span>
                </div>
              </div>
            </div>

            <div className="hero-widget">
              <div className="quick-pc-builder">
                <h3>🔧 Kompyuter Yig'ing</h3>
                <p>Professional PC Builder bilan</p>
                <div className="component-selectors">
                  <select className="component-select">
                    <option value="">Protsessor tanlang</option>
                    <option value="intel-i5-13600k">Intel Core i5-13600K - 3,200,000 so'm</option>
                    <option value="amd-ryzen5-7600x">AMD Ryzen 5 7600X - 2,800,000 so'm</option>
                    <option value="intel-i7-13700k">Intel Core i7-13700K - 4,200,000 so'm</option>
                  </select>
                  <select className="component-select">
                    <option value="">Videokarta tanlang</option>
                    <option value="rtx-4060">NVIDIA RTX 4060 - 3,800,000 so'm</option>
                    <option value="rtx-4070">NVIDIA RTX 4070 - 5,500,000 so'm</option>
                    <option value="rx-7600">AMD RX 7600 - 3,200,000 so'm</option>
                  </select>
                </div>
                <Link to="/pc-builder" className="btn-primary">
                  PC Builder ochish
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Deals Section */}
      <section className="daily-deals">
        <div className="container">
          <div className="section-header">
            <h2>🔥 Bugungi Chegirmalar</h2>
            <p>Cheklangan vaqt uchun maxsus narxlar</p>
          </div>

          <div className="deals-grid">
            {featuredDeals.map((deal) => (
              <div key={deal.id} className="deal-card">
                <div className="deal-badge">
                  <span>-{deal.discount}%</span>
                </div>
                <div className="deal-countdown">
                  <span>⏰ {getCountdown(deal.endTime)}</span>
                </div>
                <img src={deal.image} alt={deal.productName} />
                <div className="deal-info">
                  <span className="deal-category">{deal.category}</span>
                  <h3>{deal.productName}</h3>
                  <div className="deal-pricing">
                    <span className="original-price">{formatPrice(deal.originalPrice)}</span>
                    <span className="current-price">{formatPrice(deal.currentPrice)}</span>
                  </div>
                  <button className="btn-deal">Sotib olish</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Categories */}
      <section className="tech-categories">
        <div className="container">
          <h2>📱 Texnologiya Kategoriyalari</h2>
          <div className="categories-grid">
            <div className="category-card">
              <div className="category-icon">
                <img src="/icons/cpu.svg" alt="CPU" />
              </div>
              <h3>Protsessorlar</h3>
              <p>Intel, AMD</p>
              <span className="product-count">150+ mahsulot</span>
              <div className="popular-brands">
                <img src="/brands/intel.png" alt="Intel" />
                <img src="/brands/amd.png" alt="AMD" />
              </div>
            </div>

            <div className="category-card">
              <div className="category-icon">
                <img src="/icons/gpu.svg" alt="GPU" />
              </div>
              <h3>Videokartalar</h3>
              <p>NVIDIA, AMD</p>
              <span className="product-count">80+ mahsulot</span>
              <div className="popular-brands">
                <img src="/brands/nvidia.png" alt="NVIDIA" />
                <img src="/brands/amd.png" alt="AMD" />
              </div>
            </div>

            <div className="category-card">
              <div className="category-icon">
                <img src="/icons/motherboard.svg" alt="Motherboard" />
              </div>
              <h3>Motherboardlar</h3>
              <p>ASUS, MSI, Gigabyte</p>
              <span className="product-count">120+ mahsulot</span>
              <div className="popular-brands">
                <img src="/brands/asus.png" alt="ASUS" />
                <img src="/brands/msi.png" alt="MSI" />
              </div>
            </div>

            <div className="category-card">
              <div className="category-icon">
                <img src="/icons/ram.svg" alt="RAM" />
              </div>
              <h3>Xotira (RAM)</h3>
              <p>DDR4, DDR5</p>
              <span className="product-count">200+ mahsulot</span>
              <div className="popular-brands">
                <img src="/brands/corsair.png" alt="Corsair" />
                <img src="/brands/gskill.png" alt="G.Skill" />
              </div>
            </div>

            <div className="category-card">
              <div className="category-icon">
                <img src="/icons/laptop.svg" alt="Laptop" />
              </div>
              <h3>Noutbuklar</h3>
              <p>Gaming, Business</p>
              <span className="product-count">300+ mahsulot</span>
              <div className="popular-brands">
                <img src="/brands/asus.png" alt="ASUS" />
                <img src="/brands/hp.png" alt="HP" />
              </div>
            </div>

            <div className="category-card">
              <div className="category-icon">
                <img src="/icons/monitor.svg" alt="Monitor" />
              </div>
              <h3>Monitorlar</h3>
              <p>4K, Gaming, Professional</p>
              <span className="product-count">180+ mahsulot</span>
              <div className="popular-brands">
                <img src="/brands/samsung.png" alt="Samsung" />
                <img src="/brands/lg.png" alt="LG" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PC Builder Showcase */}
      <section className="pc-builder-section">
        <div className="container">
          <h2>🛠️ PC Builder - Kompyuter Yig'ish</h2>
          <div className="pc-builder-container">
            <div className="builder-intro">
              <h3>Professional Kompyuter Yig'ish</h3>
              <p>
                Professional kompyuter yig'ish vositasi bilan o'zingizning ideal kompyuteringizni
                yarating
              </p>

              <div className="builder-features">
                <div className="feature">
                  <span className="icon">✅</span>
                  <span>Avtomatik moslik tekshiruvi</span>
                </div>
                <div className="feature">
                  <span className="icon">⚡</span>
                  <span>Quvvat hisoblash</span>
                </div>
                <div className="feature">
                  <span className="icon">💰</span>
                  <span>Narx optimizatsiyasi</span>
                </div>
                <div className="feature">
                  <span className="icon">🎯</span>
                  <span>Performance tahlili</span>
                </div>
                <div className="feature">
                  <span className="icon">🌡️</span>
                  <span>Issiqlik tahlili</span>
                </div>
                <div className="feature">
                  <span className="icon">🔄</span>
                  <span>O'zgartirish tavsiyalari</span>
                </div>
              </div>

              <div className="quick-build-presets">
                <h4>Tezkor Tanlov:</h4>
                <div className="preset-buttons">
                  <button className="preset-button gaming">Gaming</button>
                  <button className="preset-button office">Office</button>
                  <button className="preset-button content">Content Creation</button>
                  <button className="preset-button budget">Budget</button>
                </div>
              </div>

              <Link to="/pc-builder" className="btn-primary pulse-button">
                PC Builder boshlash
              </Link>
            </div>

            {buildOfTheDay && (
              <div className="build-of-the-day">
                <div className="build-badge">
                  <span>🏆 Bugungi Top Build</span>
                </div>
                <div className="build-card">
                  <img src={buildOfTheDay.image} alt={buildOfTheDay.name} />
                  <div className="build-info">
                    <h4>{buildOfTheDay.nameUz}</h4>
                    <p className="build-performance">{buildOfTheDay.performance}</p>
                    <div className="build-specs">
                      <div className="spec">
                        <span>CPU:</span> {buildOfTheDay.specs.cpu}
                      </div>
                      <div className="spec">
                        <span>GPU:</span> {buildOfTheDay.specs.gpu}
                      </div>
                      <div className="spec">
                        <span>RAM:</span> {buildOfTheDay.specs.ram}
                      </div>
                      <div className="spec">
                        <span>Storage:</span> {buildOfTheDay.specs.storage}
                      </div>
                    </div>
                    <div className="build-price">
                      <span>{formatPrice(buildOfTheDay.price)}</span>
                    </div>
                    <div className="build-actions">
                      <button className="btn-view-build">Batafsil ko'rish</button>
                      <button className="btn-copy-build">Build nusxalash</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tech News & Reviews */}
      <section className="tech-news">
        <div className="container">
          <div className="section-header">
            <h2>📰 Texnologiya Yangiliklari</h2>
            <Link to="/tech-blog" className="view-all">
              Hammasini ko'rish
            </Link>
          </div>

          <div className="news-grid">
            {techNews.map((news) => (
              <div key={news.id} className="news-card">
                <img src={news.image} alt={news.title} />
                <div className="news-content">
                  <span className="news-category">{news.category}</span>
                  <h3>{news.titleUz}</h3>
                  <p>{news.excerpt}</p>
                  <div className="news-meta">
                    <span>{news.publishedAt.toLocaleDateString('uz-UZ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Partnership */}
      <section className="brand-partnership">
        <div className="container">
          <h2>🤝 Rasmiy Hamkorlarimiz</h2>
          <p>Dunyo yetakchi technology brendlari bilan hamkorlikda</p>
          <div className="brands-grid">
            <img src="/brands/intel.png" alt="Intel" />
            <img src="/brands/amd.png" alt="AMD" />
            <img src="/brands/nvidia.png" alt="NVIDIA" />
            <img src="/brands/asus.png" alt="ASUS" />
            <img src="/brands/msi.png" alt="MSI" />
            <img src="/brands/gigabyte.png" alt="Gigabyte" />
            <img src="/brands/corsair.png" alt="Corsair" />
            <img src="/brands/samsung.png" alt="Samsung" />
            <img src="/brands/lg.png" alt="LG" />
            <img src="/brands/hp.png" alt="HP" />
          </div>
        </div>
      </section>

      {/* Specialized Tools Section */}
      <section className="specialized-tools">
        <div className="container">
          <div className="section-header">
            <h2>🧰 Maxsus Texnologiya Vositalari</h2>
            <p>Kompyuter uskunalarini tanlash uchun maxsus vositalar</p>
          </div>

          <div className="tools-grid">
            <div className="tool-card">
              <div className="tool-icon">🖥️</div>
              <h3>PC Builder</h3>
              <p>Shaxsiy kompyuteringizni professional darajada yig'ing</p>
              <Link to="/pc-builder" className="btn-tool">
                Boshlash
              </Link>
            </div>

            <div className="tool-card">
              <div className="tool-icon">🔍</div>
              <h3>Mahsulot Taqqoslash</h3>
              <p>Kompyuter uskunalarini taqqoslang va to'g'ri tanlov qiling</p>
              <Link to="/product-comparison" className="btn-tool">
                Boshlash
              </Link>
            </div>

            <div className="tool-card">
              <div className="tool-icon">💾</div>
              <h3>NAS Builder</h3>
              <p>Ma'lumotlar saqlash tizimini yarating (NAS)</p>
              <Link to="/nas-builder" className="btn-tool">
                Boshlash
              </Link>
            </div>

            <div className="tool-card">
              <div className="tool-icon">🧠</div>
              <h3>Xotira Topish (RAM)</h3>
              <p>Qurilmangiz uchun mos RAM xotirani toping</p>
              <Link to="/memory-finder" className="btn-tool">
                Boshlash
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* NAS Builder Preview */}
      <section className="nas-builder-preview">
        <div className="container">
          <div className="preview-header">
            <div className="preview-title">
              <h2>💾 NAS Builder</h2>
              <p>Ma'lumotlar saqlash tizimini yarating</p>
            </div>
            <Link to="/nas-builder" className="view-all">
              To'liq ochish
            </Link>
          </div>

          <div className="nas-preview-content">
            <div className="nas-intro">
              <h3>NAS (Network Attached Storage) tizimini yig'ish</h3>
              <p>
                NAS tizimini yaratish orqali fayl va ma'lumotlarni saqlash, zaxiralash va ulashish
                imkoniga ega bo'ling. Bizning vositamiz sizga qulay interfeys bilan NAS tizimini
                yig'ishga yordam beradi.
              </p>

              <div className="nas-features">
                <div className="feature">
                  <span className="icon">📁</span>
                  <span>Fayl saqlash va almashish</span>
                </div>
                <div className="feature">
                  <span className="icon">🎬</span>
                  <span>Media server (Plex, Emby)</span>
                </div>
                <div className="feature">
                  <span className="icon">🔄</span>
                  <span>Avtomatik zaxiralash</span>
                </div>
                <div className="feature">
                  <span className="icon">📊</span>
                  <span>RAID konfiguratsiyasi</span>
                </div>
              </div>

              <div className="nas-types">
                <div className="nas-type">
                  <h4>Uy uchun</h4>
                  <p>Oilaviy rasmlar, videolar va hujjatlar saqlash uchun</p>
                  <span className="price-hint">1,800,000 so'mdan</span>
                </div>

                <div className="nas-type">
                  <h4>Media Server</h4>
                  <p>4K kino va musiqa to'plamlarini saqlash va uzatish uchun</p>
                  <span className="price-hint">3,500,000 so'mdan</span>
                </div>

                <div className="nas-type">
                  <h4>Kichik biznes</h4>
                  <p>Muhim ma'lumotlar va biznes fayllarni saqlash uchun</p>
                  <span className="price-hint">5,000,000 so'mdan</span>
                </div>
              </div>

              <Link to="/nas-builder" className="btn-primary">
                NAS Builder boshlash
              </Link>
            </div>

            <div className="nas-image">
              <img src="/images/nas/nas-preview.jpg" alt="NAS Builder" />
            </div>
          </div>
        </div>
      </section>

      {/* Memory Finder Preview */}
      <section className="memory-finder-preview">
        <div className="container">
          <div className="preview-header">
            <div className="preview-title">
              <h2>🧠 Xotira Topish</h2>
              <p>Qurilmangiz uchun mos keladigan RAM xotirasini toping</p>
            </div>
            <Link to="/memory-finder" className="view-all">
              To'liq ochish
            </Link>
          </div>

          <div className="memory-preview-content">
            <div className="memory-image">
              <img src="/images/memory/memory-finder-preview.jpg" alt="Memory Finder" />
            </div>

            <div className="memory-intro">
              <h3>RAM Finder - qurilmangiz uchun ideal xotirani tanlash</h3>
              <p>
                Noutbuk, kompyuter yoki serveringiz uchun mos keladigan RAM xotirasini tanlash juda
                muhim. Bizning Memory Finder vositamiz bilan qurilmangiz uchun to'g'ri keladigan RAM
                modulini toping.
              </p>

              <div className="memory-features">
                <div className="feature">
                  <span className="icon">✅</span>
                  <span>Qurilma mosligini tekshirish</span>
                </div>
                <div className="feature">
                  <span className="icon">⚡</span>
                  <span>Tezlik va kechikish tavsiyalari</span>
                </div>
                <div className="feature">
                  <span className="icon">🔀</span>
                  <span>Turli brend va modellarni taqqoslash</span>
                </div>
                <div className="feature">
                  <span className="icon">💰</span>
                  <span>Narx va sifat nisbati tahlili</span>
                </div>
              </div>

              <div className="quick-memory-brands">
                <h4>Mashhur RAM brendlari:</h4>
                <div className="memory-brands">
                  <img src="/brands/corsair.png" alt="Corsair" />
                  <img src="/brands/gskill.png" alt="G.Skill" />
                  <img src="/brands/kingston.png" alt="Kingston" />
                  <img src="/brands/crucial.png" alt="Crucial" />
                </div>
              </div>

              <Link to="/memory-finder" className="btn-primary">
                RAM Finder boshlash
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="trust-indicators">
        <div className="container">
          <div className="indicators-grid">
            <div className="indicator">
              <div className="indicator-icon">🏆</div>
              <h3>O'zbekiston #1</h3>
              <p>Tech Platform</p>
            </div>
            <div className="indicator">
              <div className="indicator-icon">📦</div>
              <h3>10,000+</h3>
              <p>Tech mahsulotlar</p>
            </div>
            <div className="indicator">
              <div className="indicator-icon">👥</div>
              <h3>50,000+</h3>
              <p>Mamnun mijozlar</p>
            </div>
            <div className="indicator">
              <div className="indicator-icon">🚚</div>
              <h3>Toshkent bo'ylab</h3>
              <p>Bir kunlik yetkazib berish</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TechHomePage;
