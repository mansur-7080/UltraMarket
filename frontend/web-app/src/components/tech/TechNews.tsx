import React, { useState, useEffect } from 'react';
import './TechNews.css';

interface TechNewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
}

interface TechNewsProps {
  limit?: number;
  category?: string;
}

const TechNews: React.FC<TechNewsProps> = ({ limit = 6, category }) => {
  const [newsItems, setNewsItems] = useState<TechNewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>(category || 'all');
  const [selectedArticle, setSelectedArticle] = useState<TechNewsItem | null>(null);

  useEffect(() => {
    fetchNews(activeTab);
  }, [activeTab]);

  const fetchNews = async (category: string) => {
    setLoading(true);
    try {
      // Mock data - real dasturda API dan olinadi
      const mockNews: TechNewsItem[] = [
        {
          id: 'news-1',
          title: 'NVIDIA yangi RTX 5000 seriyasini taqdim etdi',
          excerpt: "NVIDIA Blackwell arxitekturasi asosidagi yangi RTX 5000 seriyali videokartalarni e'lon qildi.",
          content: `NVIDIA kompaniyasi yangi Blackwell arxitekturasi asosidagi RTX 5000 seriyali videokartalarni taqdim etdi. Bu seriyaga RTX 5090, RTX 5080 va RTX 5070 modellari kiradi. Yangi videokartalar DLSS 4 texnologiyasi bilan jihozlangan bo'lib, sun'iy intellekt yordamida o'yinlardagi kadrlar sonini sezilarli darajada oshirishi aytilmoqda.

RTX 5090 modeli 24GB GDDR7 xotira, RTX 5080 modeli 16GB GDDR7 xotira va RTX 5070 modeli 12GB GDDR7 xotira bilan jihozlangan. Narxlar mos ravishda $1,199, $799 va $599 dan boshlanadi.`,
          image: '/images/news/rtx-5000.jpg',
          author: 'Abror Sayfullayev',
          publishedAt: '2025-07-01',
          category: 'hardware',
          tags: ['NVIDIA', 'GPU', 'Gaming', 'RTX 5000', 'Blackwell']
        },
        {
          id: 'news-2',
          title: 'AMD yangi Ryzen 9000 protsessorlarini taqdim etdi',
          excerpt: 'AMD kompaniyasi yangi Zen 5 arxitekturasi asosidagi Ryzen 9000 seriyasini e'lon qildi.',
          content: `AMD kompaniyasi yangi Zen 5 arxitekturasi asosidagi Ryzen 9000 seriyali protsessorlarni taqdim etdi. Bu seriyaga Ryzen 9 9950X, Ryzen 9 9900X, Ryzen 7 9800X va Ryzen 5 9600X modellari kiradi.

Yangi protsessorlar ilgari modellarga qaraganda 15% gacha tezroq ishlaydi va energiya tejamkorligi 20% ga oshgan. Barcha modellar AM5 soketiga mo'ljallangan bo'lib, DDR5 xotirani qo'llab-quvvatlaydi.`,
          image: '/images/news/ryzen-9000.jpg',
          author: 'Davron Kamolov',
          publishedAt: '2025-06-20',
          category: 'hardware',
          tags: ['AMD', 'CPU', 'Ryzen', 'Zen 5']
        },
        {
          id: 'news-3',
          title: 'Windows 12 operatsion tizimi rasman taqdim etildi',
          excerpt: 'Microsoft kompaniyasi Windows 12 operatsion tizimini taqdim etdi, u AI asosidagi yangi xususiyatlar bilan jihozlangan.',
          content: `Microsoft kompaniyasi Windows 12 operatsion tizimini rasman taqdim etdi. Yangi operatsion tizim sun'iy intellekt bilan ishlashga katta e'tibor qaratgan.

Windows 12 ning asosiy yangiliklari qatoriga Copilot+, yangi tashqi ko'rinish, tezlik va xavfsizlikni oshiradigan yangiliklar kiradi. Operatsion tizimga yangilash 2025-yil oktyabr oyidan boshlab mavjud bo'ladi.`,
          image: '/images/news/windows12.jpg',
          author: 'Nodira Valiyeva',
          publishedAt: '2025-06-15',
          category: 'software',
          tags: ['Microsoft', 'Windows', 'Operating System', 'AI']
        },
        {
          id: 'news-4',
          title: 'Apple M4 protsessorli yangi MacBook modellarini taqdim etdi',
          excerpt: 'Apple yangi M4 protsessorli MacBook Air va MacBook Pro modellarini taqdim etdi.',
          content: `Apple kompaniyasi M4 protsessoriga asoslangan yangi MacBook Air va MacBook Pro modellarini taqdim etdi. M4 chipi ilgarigi M3 ga qaraganda 40% gacha tezroq va energiya samaradorligi 30% ga yaxshilangan.

Yangi MacBook Air 13.6 va 15 dyuymli displeylar bilan, MacBook Pro esa 14 va 16 dyuymli modellar bilan taqdim etildi. Narxlar MacBook Air uchun $999 dan, MacBook Pro uchun $1,599 dan boshlanadi.`,
          image: '/images/news/macbook-m4.jpg',
          author: 'Laylo Xudoyorova',
          publishedAt: '2025-06-10',
          category: 'hardware',
          tags: ['Apple', 'MacBook', 'M4', 'Laptop']
        },
        {
          id: 'news-5',
          title: 'Google Chrome 125 versiyasi chiqarildi',
          excerpt: 'Google Chrome 125 versiyasi sun'iy intellekt asosidagi yangi xususiyatlar bilan yangilandi.',
          content: `Google Chrome brauzerining 125-versiyasi chiqarildi. Yangi versiyada sun'iy intellekt asosidagi qidiruv va kontentni tahlil qilish imkoniyatlari qo'shildi.

Chrome 125 ning asosiy yangiliklari quyidagilar:
- AI asosidagi "Smart Search" funksiyasi
- Memory Saver funksiyasining yaxshilangan versiyasi
- Yangi tab guruhlash imkoniyatlari
- Xavfsizlikni oshiradigan yangiliklar`,
          image: '/images/news/chrome125.jpg',
          author: 'Bobur Alimov',
          publishedAt: '2025-06-05',
          category: 'software',
          tags: ['Google', 'Chrome', 'Browser', 'Update']
        },
        {
          id: 'news-6',
          title: 'Samsung Galaxy Z Fold 7 va Z Flip 7 modellarini taqdim etdi',
          excerpt: 'Samsung kompaniyasi yangi bukladigan smartfonlarini taqdim etdi.',
          content: `Samsung kompaniyasi bukladigan smartfonlarining yangi avlodi – Galaxy Z Fold 7 va Galaxy Z Flip 7 modellarini taqdim etdi. Yangi modellar mustahkamligi oshirilgan ekran, yangi protsessor va kamera tizimlari bilan jihozlangan.

Galaxy Z Fold 7 buklamda 6.2 dyumli, ochilganda esa 7.6 dyumli ekran bilan jihozlangan. Galaxy Z Flip 7 esa buklamda 3.4 dyumli tashqi ekran va ochilganda 6.7 dyumli asosiy ekranga ega.

Har ikki model ham Snapdragon 8 Gen 4 protsessori bilan jihozlangan va 50MP asosiy kamera sensori bilan ta'minlangan.`,
          image: '/images/news/samsung-fold7.jpg',
          author: 'Dilfuza Rahimova',
          publishedAt: '2025-05-28',
          category: 'mobile',
          tags: ['Samsung', 'Smartphone', 'Foldable', 'Galaxy']
        },
        {
          id: 'news-7',
          title: 'OpenAI GPT-6 ni taqdim etdi',
          excerpt: 'OpenAI kompaniyasi GPT-6 sun'iy intellekt modelini taqdim etdi.',
          content: `OpenAI kompaniyasi GPT-6 sun'iy intellekt modelini taqdim etdi. Yangi model ilgarigi GPT-4 dan sezilarli darajada kuchliroq va yangi imkoniyatlarga ega.

GPT-6 ning asosiy yangiliklari:
- 100 trillion parametrdan ortiq
- Video va audio kontentni real vaqtda qayta ishlash
- 1 million tokendan ortiq kontekst oynasi
- Ko'p tilli modellar soni 200 dan ortiq

Model hozirda ChatGPT va API orqali foydalanish mumkin.`,
          image: '/images/news/gpt6.jpg',
          author: 'Sardor Komilov',
          publishedAt: '2025-05-20',
          category: 'ai',
          tags: ['OpenAI', 'GPT-6', 'AI', 'Machine Learning']
        },
        {
          id: 'news-8',
          title: 'Sony PlayStation 6 ni taqdim etishi kutilmoqda',
          excerpt: 'Sony PlayStation 6 ni 2026-yilning boshida taqdim etishi kutilmoqda.',
          content: `Sony kompaniyasi PlayStation 6 konsolini 2026-yil boshida taqdim etishi kutilmoqda. Yangi konsol 8K o'yinlarni qo'llab-quvvatlashi va ilg'or ray-tracing texnologiyasi bilan jihozlanishi aytilmoqda.

Konsol AMD bilan hamkorlikda yaratilgan maxsus protsessor va grafik kartaga ega bo'ladi. Saqlash hajmi esa 2TB SSD bilan ta'minlanadi.

PlayStation 6 ning narxi taxminan $599-699 atrofida bo'lishi kutilmoqda.`,
          image: '/images/news/ps6.jpg',
          author: 'Jahongir Tursunov',
          publishedAt: '2025-05-15',
          category: 'gaming',
          tags: ['Sony', 'PlayStation', 'Console', 'Gaming']
        }
      ];

      let filteredNews = mockNews;
      if (category && category !== 'all') {
        filteredNews = mockNews.filter(news => news.category === category);
      }

      // Eng so'nggi yangiliklarga saralash
      filteredNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      
      // Limit qo'llanilishi
      setNewsItems(filteredNews.slice(0, limit));
    } catch (error) {
              // Error should be handled through proper error boundary
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('uz-UZ', options);
  };

  const getCategoryName = (category: string): string => {
    const categories: {[key: string]: string} = {
      'all': 'Barcha',
      'hardware': 'Hardware',
      'software': 'Software',
      'mobile': 'Mobil',
      'gaming': 'Gaming',
      'ai': 'Sun\'iy Intellekt'
    };
    return categories[category] || category;
  };

  return (
    <div className="tech-news-section">
      <div className="news-header">
        <h2>Texnologiya Yangiliklari</h2>
        
        <div className="news-tabs">
          <button 
            className={activeTab === 'all' ? 'active' : ''}
            onClick={() => setActiveTab('all')}
          >
            Barcha
          </button>
          <button 
            className={activeTab === 'hardware' ? 'active' : ''}
            onClick={() => setActiveTab('hardware')}
          >
            Hardware
          </button>
          <button 
            className={activeTab === 'software' ? 'active' : ''}
            onClick={() => setActiveTab('software')}
          >
            Software
          </button>
          <button 
            className={activeTab === 'ai' ? 'active' : ''}
            onClick={() => setActiveTab('ai')}
          >
            AI
          </button>
          <button 
            className={activeTab === 'gaming' ? 'active' : ''}
            onClick={() => setActiveTab('gaming')}
          >
            Gaming
          </button>
          <button 
            className={activeTab === 'mobile' ? 'active' : ''}
            onClick={() => setActiveTab('mobile')}
          >
            Mobil
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="news-loading">Yangiliklar yuklanmoqda...</div>
      ) : (
        <>
          {selectedArticle ? (
            <div className="article-detail">
              <button 
                className="back-to-news"
                onClick={() => setSelectedArticle(null)}
              >
                ← Ortga qaytish
              </button>
              
              <article>
                <h1>{selectedArticle.title}</h1>
                
                <div className="article-meta">
                  <span className="article-author">{selectedArticle.author}</span>
                  <span className="article-date">{formatDate(selectedArticle.publishedAt)}</span>
                  <span className="article-category">{getCategoryName(selectedArticle.category)}</span>
                </div>
                
                <div className="article-image">
                  <img src={selectedArticle.image} alt={selectedArticle.title} />
                </div>
                
                <div className="article-content">
                  {selectedArticle.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
                
                <div className="article-tags">
                  {selectedArticle.tags.map(tag => (
                    <span key={tag} className="tag">#{tag}</span>
                  ))}
                </div>
              </article>
            </div>
          ) : (
            <div className="news-grid">
              {newsItems.map(news => (
                <div key={news.id} className="news-card" onClick={() => setSelectedArticle(news)}>
                  <div className="news-image">
                    <img src={news.image} alt={news.title} />
                    <span className="news-category">{getCategoryName(news.category)}</span>
                  </div>
                  
                  <div className="news-content">
                    <h3>{news.title}</h3>
                    <p>{news.excerpt}</p>
                    
                    <div className="news-meta">
                      <span className="news-date">{formatDate(news.publishedAt)}</span>
                      <span className="news-author">{news.author}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TechNews;
