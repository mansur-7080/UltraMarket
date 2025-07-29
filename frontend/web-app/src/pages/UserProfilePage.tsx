import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './UserProfilePage.css';

interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  fullNameUz: string;
  avatar: string;
  coverImage: string;
  location: string;
  locationUz: string;
  bio: string;
  bioUz: string;
  verified: boolean;
  level: number;
  experiencePoints: number;
  nextLevelXP: number;
  joinDate: Date;
  lastActive: Date;
  badges: Badge[];
  stats: UserStats;
  preferences: UserPreferences;
}

interface Badge {
  id: string;
  name: string;
  nameUz: string;
  description: string;
  descriptionUz: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
}

interface UserStats {
  totalBuilds: number;
  publicBuilds: number;
  totalLikes: number;
  totalViews: number;
  completedBuilds: number;
  averageRating: number;
  totalSpent: number;
  favoriteCategory: string;
  buildingStreak: number;
  helpfulReviews: number;
}

interface UserPreferences {
  preferredBrands: string[];
  budgetRange: [number, number];
  primaryUseCase: string[];
  notifications: {
    priceDrops: boolean;
    newProducts: boolean;
    buildUpdates: boolean;
    community: boolean;
  };
  privacy: {
    showSpending: boolean;
    showBuilds: boolean;
    showActivity: boolean;
  };
}

interface PCBuild {
  id: string;
  name: string;
  nameUz: string;
  description: string;
  descriptionUz: string;
  thumbnail: string;
  gallery: string[];
  components: BuildComponent[];
  totalPrice: number;
  purpose: string[];
  status: 'planning' | 'in-progress' | 'completed' | 'archived';
  visibility: 'public' | 'private' | 'friends';
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  views: number;
  rating: number;
  tags: string[];
  performance: {
    gaming4k: number;
    productivity: number;
    powerEfficiency: number;
    quietness: number;
  };
}

interface BuildComponent {
  id: string;
  category: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  image: string;
  specs: any;
  selected: boolean;
  alternatives: string[];
}

const UserProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [builds, setBuilds] = useState<PCBuild[]>([]);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'builds' | 'activity' | 'achievements' | 'settings'
  >('overview');
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
    loadUserBuilds();
  }, []);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      // Mock data - in real app, fetch from API
      const mockUser: UserProfile = {
        id: 'user123',
        username: 'TechMaster_UZ',
        fullName: 'Anvar Karimov',
        fullNameUz: 'Анвар Каримов',
        avatar: '/images/users/anvar-avatar.jpg',
        coverImage: '/images/users/anvar-cover.jpg',
        location: 'Tashkent, Uzbekistan',
        locationUz: "Toshkent, O'zbekiston",
        bio: 'Professional PC builder and tech enthusiast. Specialized in gaming and workstation builds.',
        bioUz:
          'Professional PC builder va tech enthusiast. Gaming va workstation buildlarida mutaxassis.',
        verified: true,
        level: 15,
        experiencePoints: 8750,
        nextLevelXP: 10000,
        joinDate: new Date('2022-05-15'),
        lastActive: new Date(),
        badges: [
          {
            id: 'master-builder',
            name: 'Master Builder',
            nameUz: 'Master Builder',
            description: 'Built 25+ complete systems',
            descriptionUz: "25+ to'liq sistema qurdi",
            icon: '🏗️',
            color: '#FFD700',
            rarity: 'legendary',
            unlockedAt: new Date('2023-08-20'),
          },
          {
            id: 'tech-guru',
            name: 'Tech Guru',
            nameUz: 'Tech Guru',
            description: 'Expert knowledge in all components',
            descriptionUz: 'Barcha komponentlarda expert bilim',
            icon: '🧠',
            color: '#9966CC',
            rarity: 'epic',
            unlockedAt: new Date('2023-06-15'),
          },
          {
            id: 'budget-master',
            name: 'Budget Master',
            nameUz: 'Byudjet Master',
            description: 'Created 10 budget builds under $500',
            descriptionUz: '$500 dan kam 10 ta byudjet build yaratdi',
            icon: '💰',
            color: '#32CD32',
            rarity: 'rare',
            unlockedAt: new Date('2023-03-10'),
          },
        ],
        stats: {
          totalBuilds: 28,
          publicBuilds: 23,
          totalLikes: 456,
          totalViews: 12800,
          completedBuilds: 18,
          averageRating: 4.8,
          totalSpent: 45000000, // UZS
          favoriteCategory: 'Gaming',
          buildingStreak: 7,
          helpfulReviews: 34,
        },
        preferences: {
          preferredBrands: ['NVIDIA', 'AMD', 'Intel', 'ASUS'],
          budgetRange: [2000000, 15000000],
          primaryUseCase: ['Gaming', 'Content Creation'],
          notifications: {
            priceDrops: true,
            newProducts: true,
            buildUpdates: true,
            community: false,
          },
          privacy: {
            showSpending: false,
            showBuilds: true,
            showActivity: true,
          },
        },
      };

      setUser(mockUser);
    } catch (error) {
      // Error should be handled through proper error boundary
    } finally {
      setLoading(false);
    }
  };

  const loadUserBuilds = async () => {
    try {
      // Mock data
      const mockBuilds: PCBuild[] = [
        {
          id: 'build1',
          name: 'Ultimate Gaming Beast 2024',
          nameUz: 'Ultimate Gaming Beast 2024',
          description: 'High-end gaming build for 4K gaming and streaming',
          descriptionUz: '4K gaming va streaming uchun high-end gaming build',
          thumbnail: '/images/builds/gaming-beast-thumb.jpg',
          gallery: [
            '/images/builds/gaming-beast-1.jpg',
            '/images/builds/gaming-beast-2.jpg',
            '/images/builds/gaming-beast-3.jpg',
          ],
          components: [
            {
              id: 'cpu1',
              category: 'CPU',
              name: 'AMD Ryzen 9 7950X',
              brand: 'AMD',
              model: '7950X',
              price: 8500000,
              image: '/images/components/ryzen-7950x.jpg',
              specs: { cores: 16, threads: 32, baseClock: '4.5 GHz', boostClock: '5.7 GHz' },
              selected: true,
              alternatives: ['intel-i9-13900k', 'amd-7900x'],
            },
            {
              id: 'gpu1',
              category: 'GPU',
              name: 'NVIDIA RTX 4090',
              brand: 'NVIDIA',
              model: 'RTX 4090',
              price: 22000000,
              image: '/images/components/rtx-4090.jpg',
              specs: { memory: '24GB GDDR6X', coreClock: '2230 MHz', boost: '2520 MHz' },
              selected: true,
              alternatives: ['rtx-4080', 'amd-7900xtx'],
            },
          ],
          totalPrice: 45000000,
          purpose: ['4K Gaming', 'Streaming', 'Content Creation'],
          status: 'completed',
          visibility: 'public',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-15'),
          likes: 89,
          views: 1250,
          rating: 4.9,
          tags: ['High-End', '4K Gaming', 'RGB'],
          performance: {
            gaming4k: 95,
            productivity: 88,
            powerEfficiency: 70,
            quietness: 75,
          },
        },
        {
          id: 'build2',
          name: 'Budget Gaming Starter',
          nameUz: 'Budget Gaming Starter',
          description: 'Affordable 1080p gaming build for beginners',
          descriptionUz: 'Yangi boshlovchilar uchun arzon 1080p gaming build',
          thumbnail: '/images/builds/budget-starter-thumb.jpg',
          gallery: ['/images/builds/budget-starter-1.jpg'],
          components: [],
          totalPrice: 6500000,
          purpose: ['1080p Gaming', 'eSports'],
          status: 'planning',
          visibility: 'public',
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-22'),
          likes: 45,
          views: 680,
          rating: 4.6,
          tags: ['Budget', '1080p', 'eSports'],
          performance: {
            gaming4k: 40,
            productivity: 65,
            powerEfficiency: 85,
            quietness: 90,
          },
        },
      ];

      setBuilds(mockBuilds);
    } catch (error) {
      // Error should be handled through proper error boundary
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M so'm`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K so'm`;
    }
    return `${price} so'm`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const getProgressPercentage = () => {
    if (!user) return 0;
    return (user.experiencePoints / user.nextLevelXP) * 100;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#9966CC';
      case 'rare':
        return '#0099FF';
      default:
        return '#888888';
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Profil yuklanmoqda...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-error">
        <h2>Foydalanuvchi topilmadi</h2>
        <p>Kechirasiz, ushbu profil mavjud emas.</p>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="cover-image">
          <img src={user.coverImage} alt="Cover" />
          <div className="cover-overlay"></div>
        </div>

        <div className="profile-info">
          <div className="container">
            <div className="profile-main">
              <div className="avatar-section">
                <img src={user.avatar} alt={user.fullName} className="avatar" />
                {user.verified && <span className="verified-badge">✓</span>}
              </div>

              <div className="user-details">
                <h1>
                  {user.fullNameUz}
                  <span className="username">@{user.username}</span>
                </h1>
                <p className="location">📍 {user.locationUz}</p>
                <p className="bio">{user.bioUz}</p>

                <div className="user-meta">
                  <span>📅 {formatDate(user.joinDate)} dan beri</span>
                  <span>⚡ Oxirgi faollik: {formatDate(user.lastActive)}</span>
                </div>
              </div>

              <div className="level-section">
                <div className="level-badge">
                  <span className="level-number">{user.level}</span>
                  <span className="level-text">Level</span>
                </div>
                <div className="xp-progress">
                  <div className="xp-bar">
                    <div className="xp-fill" style={{ width: `${getProgressPercentage()}%` }}></div>
                  </div>
                  <span className="xp-text">
                    {user.experiencePoints} / {user.nextLevelXP} XP
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-nav">
        <div className="container">
          <div className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Umumiy
            </button>
            <button
              className={`nav-tab ${activeTab === 'builds' ? 'active' : ''}`}
              onClick={() => setActiveTab('builds')}
            >
              🖥️ Buildlar ({user.stats.publicBuilds})
            </button>
            <button
              className={`nav-tab ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              🏆 Yutuqlar ({user.badges.length})
            </button>
            <button
              className={`nav-tab ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              📈 Faollik
            </button>
            {isOwnProfile && (
              <button
                className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                ⚙️ Sozlamalar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        <div className="container">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="overview-grid">
                {/* Stats Cards */}
                <div className="stats-section">
                  <h3>📊 Statistika</h3>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <span className="stat-icon">🏗️</span>
                      <div className="stat-content">
                        <span className="stat-number">{user.stats.totalBuilds}</span>
                        <span className="stat-label">Jami buildlar</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <span className="stat-icon">❤️</span>
                      <div className="stat-content">
                        <span className="stat-number">{user.stats.totalLikes}</span>
                        <span className="stat-label">Yoqishlar</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <span className="stat-icon">👁️</span>
                      <div className="stat-content">
                        <span className="stat-number">
                          {user.stats.totalViews.toLocaleString()}
                        </span>
                        <span className="stat-label">Ko'rishlar</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <span className="stat-icon">⭐</span>
                      <div className="stat-content">
                        <span className="stat-number">{user.stats.averageRating}</span>
                        <span className="stat-label">O'rtacha reyting</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <span className="stat-icon">🔥</span>
                      <div className="stat-content">
                        <span className="stat-number">{user.stats.buildingStreak}</span>
                        <span className="stat-label">Kun ketma-ket</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <span className="stat-icon">🎮</span>
                      <div className="stat-content">
                        <span className="stat-number">{user.stats.favoriteCategory}</span>
                        <span className="stat-label">Sevimli kategoriya</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Builds */}
                <div className="recent-builds">
                  <h3>🖥️ So'nggi Buildlar</h3>
                  <div className="builds-preview">
                    {builds.slice(0, 3).map((build) => (
                      <div key={build.id} className="build-preview-card">
                        <img src={build.thumbnail} alt={build.name} />
                        <div className="build-preview-content">
                          <h4>{build.nameUz}</h4>
                          <p>{formatPrice(build.totalPrice)}</p>
                          <div className="build-meta">
                            <span>❤️ {build.likes}</span>
                            <span>👁️ {build.views}</span>
                            <span className={`status ${build.status}`}>
                              {build.status === 'completed'
                                ? '✅ Tugallangan'
                                : build.status === 'in-progress'
                                  ? '🔄 Jarayonda'
                                  : '📝 Rejalashtirilgan'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link to="/profile/builds" className="view-all-builds">
                    Barcha buildlarni ko'rish →
                  </Link>
                </div>

                {/* Recent Badges */}
                <div className="recent-badges">
                  <h3>🏆 So'nggi Yutuqlar</h3>
                  <div className="badges-preview">
                    {user.badges.slice(0, 4).map((badge) => (
                      <div
                        key={badge.id}
                        className="badge-card"
                        style={{ borderColor: getRarityColor(badge.rarity) }}
                      >
                        <span className="badge-icon">{badge.icon}</span>
                        <div className="badge-content">
                          <h4>{badge.nameUz}</h4>
                          <p>{badge.descriptionUz}</p>
                          <span className="badge-date">{formatDate(badge.unlockedAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'builds' && (
            <div className="builds-tab">
              <div className="builds-header">
                <h3>🖥️ Mening Buildlarim</h3>
                {isOwnProfile && (
                  <Link to="/pc-builder" className="new-build-btn">
                    + Yangi Build
                  </Link>
                )}
              </div>

              <div className="builds-grid">
                {builds.map((build) => (
                  <div key={build.id} className="build-card">
                    <div className="build-image">
                      <img src={build.thumbnail} alt={build.name} />
                      <div className="build-overlay">
                        <div className="build-actions">
                          <button className="action-btn">👁️ Ko'rish</button>
                          <button className="action-btn">❤️ {build.likes}</button>
                        </div>
                      </div>
                    </div>

                    <div className="build-content">
                      <h4>{build.nameUz}</h4>
                      <p>{build.descriptionUz}</p>

                      <div className="build-tags">
                        {build.tags.map((tag) => (
                          <span key={tag} className="build-tag">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="build-performance">
                        <div className="performance-bar">
                          <span>🎮 Gaming</span>
                          <div
                            className="performance-fill"
                            style={{ width: `${build.performance.gaming4k}%` }}
                          ></div>
                          <span>{build.performance.gaming4k}%</span>
                        </div>
                        <div className="performance-bar">
                          <span>💼 Productivity</span>
                          <div
                            className="performance-fill"
                            style={{ width: `${build.performance.productivity}%` }}
                          ></div>
                          <span>{build.performance.productivity}%</span>
                        </div>
                      </div>

                      <div className="build-footer">
                        <span className="build-price">{formatPrice(build.totalPrice)}</span>
                        <span className="build-rating">⭐ {build.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="achievements-tab">
              <h3>🏆 Yutuqlar va Badgelar</h3>
              <div className="achievements-grid">
                {user.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="achievement-card"
                    style={{ borderColor: getRarityColor(badge.rarity) }}
                  >
                    <div
                      className="achievement-icon"
                      style={{ backgroundColor: getRarityColor(badge.rarity) }}
                    >
                      {badge.icon}
                    </div>
                    <div className="achievement-content">
                      <h4>{badge.nameUz}</h4>
                      <p>{badge.descriptionUz}</p>
                      <div className="achievement-meta">
                        <span className={`rarity ${badge.rarity}`}>{badge.rarity}</span>
                        <span className="unlock-date">{formatDate(badge.unlockedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-tab">
              <h3>📈 Faollik Tarixi</h3>
              <div className="activity-timeline">
                <div className="activity-item">
                  <div className="activity-icon">🏗️</div>
                  <div className="activity-content">
                    <h4>Yangi build yaratildi</h4>
                    <p>"Ultimate Gaming Beast 2024" build ommaga e'lon qilindi</p>
                    <span className="activity-time">2 soat oldin</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">🏆</div>
                  <div className="activity-content">
                    <h4>Yangi badge olindi</h4>
                    <p>"Master Builder" badge olindi</p>
                    <span className="activity-time">1 kun oldin</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">❤️</div>
                  <div className="activity-content">
                    <h4>Build yoqtirildi</h4>
                    <p>"Budget Gaming Starter" build 50 ta like oldi</p>
                    <span className="activity-time">3 kun oldin</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && isOwnProfile && (
            <div className="settings-tab">
              <h3>⚙️ Profil Sozlamalari</h3>
              <div className="settings-sections">
                <div className="settings-section">
                  <h4>👤 Shaxsiy Ma'lumotlar</h4>
                  <form className="settings-form">
                    <div className="form-group">
                      <label>To'liq ism</label>
                      <input type="text" defaultValue={user.fullNameUz} />
                    </div>
                    <div className="form-group">
                      <label>Bio</label>
                      <textarea defaultValue={user.bioUz}></textarea>
                    </div>
                    <div className="form-group">
                      <label>Joylashuv</label>
                      <input type="text" defaultValue={user.locationUz} />
                    </div>
                  </form>
                </div>

                <div className="settings-section">
                  <h4>🔔 Bildirishnomalar</h4>
                  <div className="toggle-settings">
                    <div className="toggle-item">
                      <span>Narx tushishi</span>
                      <input
                        type="checkbox"
                        defaultChecked={user.preferences.notifications.priceDrops}
                      />
                    </div>
                    <div className="toggle-item">
                      <span>Yangi mahsulotlar</span>
                      <input
                        type="checkbox"
                        defaultChecked={user.preferences.notifications.newProducts}
                      />
                    </div>
                    <div className="toggle-item">
                      <span>Build yangilanishlari</span>
                      <input
                        type="checkbox"
                        defaultChecked={user.preferences.notifications.buildUpdates}
                      />
                    </div>
                  </div>
                </div>

                <div className="settings-section">
                  <h4>🔒 Maxfiylik</h4>
                  <div className="toggle-settings">
                    <div className="toggle-item">
                      <span>Xarajatlarni ko'rsatish</span>
                      <input
                        type="checkbox"
                        defaultChecked={user.preferences.privacy.showSpending}
                      />
                    </div>
                    <div className="toggle-item">
                      <span>Buildlarni ko'rsatish</span>
                      <input type="checkbox" defaultChecked={user.preferences.privacy.showBuilds} />
                    </div>
                    <div className="toggle-item">
                      <span>Faollikni ko'rsatish</span>
                      <input
                        type="checkbox"
                        defaultChecked={user.preferences.privacy.showActivity}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
