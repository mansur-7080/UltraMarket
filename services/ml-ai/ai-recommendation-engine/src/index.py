#!/usr/bin/env python3
"""
UltraMarket AI Recommendation Engine for Uzbekistan
===================================================

This service provides AI-powered product recommendations tailored 
specifically for the Uzbekistan market, taking into account:
- Cultural preferences and seasonal patterns
- Regional shopping behaviors
- Uzbek language processing
- Local holidays and events (Ramadan, Navruz, etc.)
- Economic factors specific to Uzbekistan
"""

import os
import json
import logging
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
import redis
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# ML Libraries
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import StandardScaler
import joblib

# Database and caching
import asyncpg
import aioredis

# Uzbekistan-specific imports
from uzbek_nlp import UzbekTextProcessor
from uzbekistan_calendar import UzbekHolidays, RamadanSchedule
from regional_preferences import UzbekRegionalPreferences

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app initialization
app = FastAPI(
    title="UltraMarket AI Recommendation Engine",
    description="AI-powered recommendations for Uzbekistan e-commerce",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
class Config:
    POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://user:pass@localhost/ultramarket")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    MODEL_UPDATE_INTERVAL = int(os.getenv("MODEL_UPDATE_INTERVAL", "3600"))  # 1 hour
    CACHE_TTL = int(os.getenv("CACHE_TTL", "1800"))  # 30 minutes
    UZBEKISTAN_TIMEZONE = "Asia/Tashkent"

config = Config()

# Pydantic models
class UserProfile(BaseModel):
    user_id: str
    region: str = Field(..., description="Uzbekistan region code (TSH, SAM, etc.)")
    language: str = Field(default="uz", description="Preferred language (uz/ru)")
    age_group: Optional[str] = Field(None, description="Age group: 18-25, 26-35, etc.")
    gender: Optional[str] = Field(None, description="Gender preference")
    income_level: Optional[str] = Field(None, description="Income level: low, medium, high")
    interests: List[str] = Field(default=[], description="User interests and hobbies")
    purchase_history: List[str] = Field(default=[], description="Recent purchase categories")

class ProductFeatures(BaseModel):
    product_id: str
    name: str
    name_ru: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    price: float
    brand: Optional[str] = None
    tags: List[str] = Field(default=[])
    description: str
    description_ru: Optional[str] = None
    vendor_id: str
    vendor_region: str
    vendor_rating: float
    is_local_product: bool = False
    cultural_relevance: float = 0.0

class RecommendationRequest(BaseModel):
    user_id: str
    context: str = Field(default="general", description="Context: homepage, category, product, cart, etc.")
    limit: int = Field(default=10, description="Number of recommendations")
    exclude_products: List[str] = Field(default=[], description="Products to exclude")
    include_explanations: bool = Field(default=True, description="Include recommendation explanations")

class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[Dict[str, Any]]
    context: str
    generated_at: datetime
    model_version: str
    uzbekistan_factors: Dict[str, Any]

# Global variables for ML models
collaborative_model = None
content_model = None
uzbek_text_processor = None
regional_preferences = None
redis_client = None
db_pool = None

class UzbekistanRecommendationEngine:
    """
    AI Recommendation Engine optimized for Uzbekistan market
    """
    
    def __init__(self):
        self.models = {}
        self.uzbek_processor = UzbekTextProcessor()
        self.regional_prefs = UzbekRegionalPreferences()
        self.holidays = UzbekHolidays()
        self.ramadan_schedule = RamadanSchedule()
        
    async def initialize(self):
        """Initialize database connections and load ML models"""
        global redis_client, db_pool
        
        # Initialize Redis connection
        redis_client = aioredis.from_url(config.REDIS_URL)
        
        # Initialize PostgreSQL connection pool
        db_pool = await asyncpg.create_pool(config.POSTGRES_URL)
        
        # Load or train ML models
        await self.load_models()
        
        logger.info("🇺🇿 Uzbekistan AI Recommendation Engine initialized")
    
    async def load_models(self):
        """Load pre-trained models or train new ones"""
        try:
            # Try to load existing models
            self.models['collaborative'] = joblib.load('models/collaborative_uzbekistan.pkl')
            self.models['content'] = joblib.load('models/content_uzbekistan.pkl')
            self.models['cultural'] = joblib.load('models/cultural_uzbekistan.pkl')
            logger.info("✅ Loaded existing ML models")
        except FileNotFoundError:
            logger.info("🔄 Training new ML models for Uzbekistan market...")
            await self.train_models()
    
    async def train_models(self):
        """Train recommendation models with Uzbekistan-specific features"""
        
        # Fetch training data
        user_interactions = await self.fetch_user_interactions()
        product_features = await self.fetch_product_features()
        cultural_data = await self.fetch_cultural_preferences()
        
        # Train collaborative filtering model
        self.models['collaborative'] = await self.train_collaborative_model(user_interactions)
        
        # Train content-based model with Uzbek text processing
        self.models['content'] = await self.train_content_model(product_features)
        
        # Train cultural preference model
        self.models['cultural'] = await self.train_cultural_model(cultural_data)
        
        # Save models
        os.makedirs('models', exist_ok=True)
        joblib.dump(self.models['collaborative'], 'models/collaborative_uzbekistan.pkl')
        joblib.dump(self.models['content'], 'models/content_uzbekistan.pkl')
        joblib.dump(self.models['cultural'], 'models/cultural_uzbekistan.pkl')
        
        logger.info("✅ ML models trained and saved")
    
    async def fetch_user_interactions(self) -> pd.DataFrame:
        """Fetch user interaction data from database"""
        query = """
        SELECT 
            user_id,
            product_id,
            interaction_type,
            rating,
            timestamp,
            region,
            language_preference
        FROM user_interactions 
        WHERE timestamp > NOW() - INTERVAL '6 months'
        AND region IN ('TSH', 'SAM', 'BUX', 'AND', 'FAR', 'NAM', 'QAS', 'SUR', 'NAV', 'JIZ', 'SIR', 'XOR', 'QOR')
        ORDER BY timestamp DESC
        """
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(query)
            return pd.DataFrame([dict(row) for row in rows])
    
    async def fetch_product_features(self) -> pd.DataFrame:
        """Fetch product features with Uzbekistan-specific attributes"""
        query = """
        SELECT 
            p.id as product_id,
            p.name,
            p.name_ru,
            p.description,
            p.description_ru,
            p.category,
            p.subcategory,
            p.price,
            p.brand,
            p.tags,
            v.region as vendor_region,
            v.rating as vendor_rating,
            CASE 
                WHEN v.region IN ('TSH', 'SAM', 'BUX', 'AND', 'FAR', 'NAM') 
                THEN true 
                ELSE false 
            END as is_local_product,
            COALESCE(p.cultural_relevance, 0.0) as cultural_relevance
        FROM products p
        JOIN vendors v ON p.vendor_id = v.id
        WHERE p.status = 'active'
        """
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(query)
            return pd.DataFrame([dict(row) for row in rows])
    
    async def fetch_cultural_preferences(self) -> Dict[str, Any]:
        """Fetch cultural and seasonal preferences specific to Uzbekistan"""
        
        # Seasonal preferences
        seasonal_prefs = {
            'spring': ['garden', 'flowers', 'cleaning', 'navruz'],
            'summer': ['cooling', 'vacation', 'fruits', 'weddings'],
            'autumn': ['harvest', 'warm_clothes', 'school'],
            'winter': ['heating', 'warm_food', 'new_year']
        }
        
        # Religious and cultural events
        cultural_events = {
            'ramadan': {
                'categories': ['food', 'religious_items', 'gifts', 'dates'],
                'peak_times': ['iftar', 'suhur'],
                'price_sensitivity': 'high'
            },
            'navruz': {
                'categories': ['traditional_clothes', 'decorations', 'sweets', 'gifts'],
                'peak_times': ['march_21'],
                'spending_increase': 1.5
            },
            'new_year': {
                'categories': ['electronics', 'toys', 'clothes', 'decorations'],
                'peak_times': ['december_january'],
                'spending_increase': 2.0
            }
        }
        
        # Regional preferences
        regional_prefs = await self.regional_prefs.get_preferences()
        
        return {
            'seasonal': seasonal_prefs,
            'cultural_events': cultural_events,
            'regional': regional_prefs
        }
    
    async def train_collaborative_model(self, interactions_df: pd.DataFrame):
        """Train collaborative filtering model with Uzbekistan market considerations"""
        
        # Create user-item interaction matrix
        user_item_matrix = interactions_df.pivot_table(
            index='user_id',
            columns='product_id',
            values='rating',
            fill_value=0
        )
        
        # Apply regional weights
        region_weights = {
            'TSH': 1.2,  # Tashkent has higher weight due to population
            'SAM': 1.0,
            'BUX': 0.9,
            'AND': 1.0,
            'FAR': 1.0,
            'NAM': 0.9,
            'QAS': 0.8,
            'SUR': 0.8,
            'NAV': 0.7,
            'JIZ': 0.7,
            'SIR': 0.7,
            'XOR': 0.8,
            'QOR': 0.7
        }
        
        # Weight interactions by region
        for idx, row in interactions_df.iterrows():
            region = row['region']
            weight = region_weights.get(region, 0.8)
            user_item_matrix.loc[row['user_id'], row['product_id']] *= weight
        
        # Apply SVD for dimensionality reduction
        svd = TruncatedSVD(n_components=50, random_state=42)
        user_factors = svd.fit_transform(user_item_matrix.fillna(0))
        item_factors = svd.components_.T
        
        return {
            'svd_model': svd,
            'user_factors': user_factors,
            'item_factors': item_factors,
            'user_index': user_item_matrix.index.tolist(),
            'item_index': user_item_matrix.columns.tolist()
        }
    
    async def train_content_model(self, products_df: pd.DataFrame):
        """Train content-based model with Uzbek language support"""
        
        # Process Uzbek and Russian text
        uzbek_texts = []
        for _, product in products_df.iterrows():
            # Combine Uzbek and Russian text
            text_uz = f"{product['name']} {product['description']}"
            text_ru = f"{product.get('name_ru', '')} {product.get('description_ru', '')}"
            
            # Process Uzbek text
            processed_uz = self.uzbek_processor.process_text(text_uz)
            processed_ru = self.uzbek_processor.process_text(text_ru, language='ru')
            
            combined_text = f"{processed_uz} {processed_ru}"
            uzbek_texts.append(combined_text)
        
        # Create TF-IDF vectors with Uzbek-specific preprocessing
        tfidf = TfidfVectorizer(
            max_features=5000,
            stop_words=self.uzbek_processor.get_stop_words(),
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.8
        )
        
        tfidf_matrix = tfidf.fit_transform(uzbek_texts)
        
        # Include numerical features
        numerical_features = products_df[['price', 'vendor_rating', 'cultural_relevance']].values
        scaler = StandardScaler()
        numerical_features_scaled = scaler.fit_transform(numerical_features)
        
        # Combine text and numerical features
        from scipy.sparse import hstack, csr_matrix
        combined_features = hstack([tfidf_matrix, csr_matrix(numerical_features_scaled)])
        
        return {
            'tfidf_vectorizer': tfidf,
            'scaler': scaler,
            'feature_matrix': combined_features,
            'product_ids': products_df['product_id'].tolist()
        }
    
    async def train_cultural_model(self, cultural_data: Dict[str, Any]):
        """Train model to understand Uzbekistan cultural preferences"""
        
        # Create cultural preference vectors
        cultural_vectors = {}
        
        # Seasonal preferences
        for season, categories in cultural_data['seasonal'].items():
            cultural_vectors[f'season_{season}'] = categories
        
        # Event-based preferences
        for event, data in cultural_data['cultural_events'].items():
            cultural_vectors[f'event_{event}'] = data['categories']
        
        # Regional preferences
        for region, prefs in cultural_data['regional'].items():
            cultural_vectors[f'region_{region}'] = prefs
        
        return {
            'cultural_vectors': cultural_vectors,
            'seasonal_multipliers': {
                'ramadan': 1.5,
                'navruz': 1.8,
                'new_year': 2.0,
                'wedding_season': 1.3
            }
        }
    
    async def get_recommendations(
        self, 
        user_profile: UserProfile, 
        context: str = "general",
        limit: int = 10,
        exclude_products: List[str] = None
    ) -> List[Dict[str, Any]]:
        """Generate personalized recommendations for Uzbekistan users"""
        
        exclude_products = exclude_products or []
        
        # Get recommendations from different models
        collaborative_recs = await self.get_collaborative_recommendations(user_profile, limit * 2)
        content_recs = await self.get_content_recommendations(user_profile, limit * 2)
        cultural_recs = await self.get_cultural_recommendations(user_profile, context, limit * 2)
        
        # Combine recommendations with Uzbekistan-specific weighting
        combined_recs = await self.combine_recommendations(
            collaborative_recs,
            content_recs,
            cultural_recs,
            user_profile,
            context
        )
        
        # Apply Uzbekistan market filters
        filtered_recs = await self.apply_uzbekistan_filters(combined_recs, user_profile)
        
        # Filter out excluded products
        filtered_recs = [rec for rec in filtered_recs if rec['product_id'] not in exclude_products]
        
        # Limit results
        return filtered_recs[:limit]
    
    async def get_collaborative_recommendations(self, user_profile: UserProfile, limit: int):
        """Get collaborative filtering recommendations"""
        if not self.models.get('collaborative'):
            return []
        
        model = self.models['collaborative']
        
        # Find similar users in the same region
        try:
            user_idx = model['user_index'].index(user_profile.user_id)
            user_vector = model['user_factors'][user_idx]
            
            # Calculate similarity with regional bias
            similarities = cosine_similarity([user_vector], model['user_factors'])[0]
            
            # Get top similar users
            similar_user_indices = np.argsort(similarities)[::-1][1:11]  # Top 10 similar users
            
            # Get recommended items
            recommendations = []
            for user_idx in similar_user_indices:
                similar_user_id = model['user_index'][user_idx]
                # Fetch this user's high-rated items
                # This would be implemented with actual database queries
                pass
            
            return recommendations[:limit]
            
        except ValueError:
            # User not in training data, return popular items
            return await self.get_popular_recommendations(user_profile, limit)
    
    async def get_content_recommendations(self, user_profile: UserProfile, limit: int):
        """Get content-based recommendations with Uzbek language processing"""
        if not self.models.get('content'):
            return []
        
        model = self.models['content']
        
        # Get user's purchase history and preferences
        user_categories = user_profile.purchase_history + user_profile.interests
        
        # Create user preference vector
        user_text = " ".join(user_categories)
        if user_profile.language == 'uz':
            user_text = self.uzbek_processor.process_text(user_text)
        
        user_vector = model['tfidf_vectorizer'].transform([user_text])
        
        # Calculate similarities
        similarities = cosine_similarity(user_vector, model['feature_matrix'])[0]
        
        # Get top recommendations
        top_indices = np.argsort(similarities)[::-1][:limit]
        
        recommendations = []
        for idx in top_indices:
            product_id = model['product_ids'][idx]
            score = similarities[idx]
            recommendations.append({
                'product_id': product_id,
                'score': score,
                'reason': 'content_similarity'
            })
        
        return recommendations
    
    async def get_cultural_recommendations(self, user_profile: UserProfile, context: str, limit: int):
        """Get recommendations based on Uzbekistan cultural factors"""
        if not self.models.get('cultural'):
            return []
        
        model = self.models['cultural']
        recommendations = []
        
        # Current time in Uzbekistan
        now = datetime.now()
        
        # Check for cultural events
        current_season = self.get_current_season()
        is_ramadan = self.ramadan_schedule.is_ramadan_period(now)
        is_navruz = self.holidays.is_navruz_period(now)
        is_new_year = self.holidays.is_new_year_period(now)
        
        # Get relevant categories based on cultural context
        relevant_categories = []
        
        if is_ramadan:
            relevant_categories.extend(['food', 'dates', 'religious_items', 'gifts'])
            multiplier = model['seasonal_multipliers']['ramadan']
        elif is_navruz:
            relevant_categories.extend(['traditional_clothes', 'decorations', 'sweets'])
            multiplier = model['seasonal_multipliers']['navruz']
        elif is_new_year:
            relevant_categories.extend(['electronics', 'toys', 'clothes', 'decorations'])
            multiplier = model['seasonal_multipliers']['new_year']
        else:
            # Regular seasonal recommendations
            seasonal_categories = model['cultural_vectors'].get(f'season_{current_season}', [])
            relevant_categories.extend(seasonal_categories)
            multiplier = 1.0
        
        # Regional preferences
        regional_categories = model['cultural_vectors'].get(f'region_{user_profile.region}', [])
        relevant_categories.extend(regional_categories)
        
        # Fetch products in relevant categories
        products_query = """
        SELECT product_id, category, price, vendor_rating, cultural_relevance
        FROM products
        WHERE category = ANY($1) AND status = 'active'
        ORDER BY (vendor_rating * cultural_relevance * $2) DESC
        LIMIT $3
        """
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(products_query, relevant_categories, multiplier, limit)
            
            for row in rows:
                recommendations.append({
                    'product_id': row['product_id'],
                    'score': row['vendor_rating'] * row['cultural_relevance'] * multiplier,
                    'reason': 'cultural_relevance',
                    'cultural_factor': self.get_cultural_explanation(is_ramadan, is_navruz, is_new_year, current_season)
                })
        
        return recommendations
    
    async def combine_recommendations(
        self,
        collaborative_recs: List[Dict],
        content_recs: List[Dict],
        cultural_recs: List[Dict],
        user_profile: UserProfile,
        context: str
    ) -> List[Dict[str, Any]]:
        """Combine recommendations using Uzbekistan-specific weights"""
        
        # Define weights based on context and user characteristics
        weights = {
            'collaborative': 0.4,
            'content': 0.3,
            'cultural': 0.3
        }
        
        # Adjust weights for Uzbekistan market
        if user_profile.region in ['TSH', 'SAM']:  # Urban areas
            weights['content'] += 0.1
            weights['cultural'] -= 0.1
        else:  # Rural areas
            weights['cultural'] += 0.1
            weights['content'] -= 0.1
        
        # Context-based adjustments
        if context == 'holiday_shopping':
            weights['cultural'] += 0.2
            weights['collaborative'] -= 0.1
            weights['content'] -= 0.1
        
        # Combine recommendations
        all_recommendations = {}
        
        # Add collaborative recommendations
        for rec in collaborative_recs:
            product_id = rec['product_id']
            if product_id not in all_recommendations:
                all_recommendations[product_id] = {
                    'product_id': product_id,
                    'scores': {},
                    'reasons': [],
                    'total_score': 0
                }
            all_recommendations[product_id]['scores']['collaborative'] = rec['score'] * weights['collaborative']
            all_recommendations[product_id]['reasons'].append(rec.get('reason', 'collaborative'))
        
        # Add content-based recommendations
        for rec in content_recs:
            product_id = rec['product_id']
            if product_id not in all_recommendations:
                all_recommendations[product_id] = {
                    'product_id': product_id,
                    'scores': {},
                    'reasons': [],
                    'total_score': 0
                }
            all_recommendations[product_id]['scores']['content'] = rec['score'] * weights['content']
            all_recommendations[product_id]['reasons'].append(rec.get('reason', 'content'))
        
        # Add cultural recommendations
        for rec in cultural_recs:
            product_id = rec['product_id']
            if product_id not in all_recommendations:
                all_recommendations[product_id] = {
                    'product_id': product_id,
                    'scores': {},
                    'reasons': [],
                    'total_score': 0
                }
            all_recommendations[product_id]['scores']['cultural'] = rec['score'] * weights['cultural']
            all_recommendations[product_id]['reasons'].append(rec.get('reason', 'cultural'))
            if 'cultural_factor' in rec:
                all_recommendations[product_id]['cultural_factor'] = rec['cultural_factor']
        
        # Calculate total scores
        for product_id, data in all_recommendations.items():
            data['total_score'] = sum(data['scores'].values())
        
        # Sort by total score
        sorted_recommendations = sorted(
            all_recommendations.values(),
            key=lambda x: x['total_score'],
            reverse=True
        )
        
        return sorted_recommendations
    
    async def apply_uzbekistan_filters(self, recommendations: List[Dict], user_profile: UserProfile):
        """Apply Uzbekistan market-specific filters"""
        
        filtered_recs = []
        
        for rec in recommendations:
            # Fetch product details
            product_query = """
            SELECT p.*, v.region as vendor_region, v.rating as vendor_rating
            FROM products p
            JOIN vendors v ON p.vendor_id = v.id
            WHERE p.id = $1
            """
            
            async with db_pool.acquire() as conn:
                product = await conn.fetchrow(product_query, rec['product_id'])
                
                if not product:
                    continue
                
                # Price filter based on region and income level
                max_price = self.get_max_price_for_user(user_profile)
                if product['price'] > max_price:
                    continue
                
                # Regional preference filter
                if self.should_prefer_local_vendor(user_profile, product['vendor_region']):
                    rec['total_score'] *= 1.2  # Boost local vendors
                
                # Language preference filter
                if user_profile.language == 'uz' and product['name_ru'] and not product['name']:
                    rec['total_score'] *= 0.8  # Prefer products with Uzbek names
                
                # Add product details to recommendation
                rec.update({
                    'product_name': product['name'],
                    'product_name_ru': product['name_ru'],
                    'price': product['price'],
                    'vendor_region': product['vendor_region'],
                    'vendor_rating': product['vendor_rating'],
                    'category': product['category']
                })
                
                filtered_recs.append(rec)
        
        return filtered_recs
    
    def get_max_price_for_user(self, user_profile: UserProfile) -> float:
        """Determine maximum recommended price based on user profile"""
        base_prices = {
            'low': 500000,    # 500k UZS
            'medium': 2000000, # 2M UZS
            'high': 10000000   # 10M UZS
        }
        
        income_level = user_profile.income_level or 'medium'
        base_price = base_prices.get(income_level, base_prices['medium'])
        
        # Adjust for region (cost of living differences)
        regional_multipliers = {
            'TSH': 1.2,  # Tashkent is more expensive
            'SAM': 1.0,
            'BUX': 0.9,
            'AND': 0.85,
            'FAR': 0.85,
            'NAM': 0.8,
            'QAS': 0.8,
            'SUR': 0.75,
            'NAV': 0.8,
            'JIZ': 0.8,
            'SIR': 0.8,
            'XOR': 0.75,
            'QOR': 0.7
        }
        
        multiplier = regional_multipliers.get(user_profile.region, 0.9)
        return base_price * multiplier
    
    def should_prefer_local_vendor(self, user_profile: UserProfile, vendor_region: str) -> bool:
        """Check if local vendor should be preferred"""
        # Same region = local
        if user_profile.region == vendor_region:
            return True
        
        # Adjacent regions for faster shipping
        adjacent_regions = {
            'TSH': ['SIR', 'JIZ'],
            'SAM': ['BUX', 'QAS', 'NAV'],
            'BUX': ['SAM', 'QAS', 'XOR'],
            'AND': ['FAR', 'NAM'],
            'FAR': ['AND', 'NAM'],
            'NAM': ['AND', 'FAR'],
            'QAS': ['SAM', 'BUX', 'SUR'],
            'SUR': ['QAS'],
            'NAV': ['SAM', 'BUX'],
            'JIZ': ['TSH', 'NAV'],
            'SIR': ['TSH'],
            'XOR': ['BUX', 'QOR'],
            'QOR': ['XOR']
        }
        
        return vendor_region in adjacent_regions.get(user_profile.region, [])
    
    def get_current_season(self) -> str:
        """Get current season in Uzbekistan"""
        month = datetime.now().month
        if month in [3, 4, 5]:
            return 'spring'
        elif month in [6, 7, 8]:
            return 'summer'
        elif month in [9, 10, 11]:
            return 'autumn'
        else:
            return 'winter'
    
    def get_cultural_explanation(self, is_ramadan: bool, is_navruz: bool, is_new_year: bool, season: str) -> str:
        """Get explanation for cultural recommendations"""
        if is_ramadan:
            return "Ramazon muborak! Ro'za tutish uchun tavsiya etilgan mahsulotlar"
        elif is_navruz:
            return "Navruz bayrami muborak! An'anaviy bayram mahsulotlari"
        elif is_new_year:
            return "Yangi yil bayrami! Bayram sovg'alari va bezaklari"
        else:
            season_explanations = {
                'spring': "Bahor mavsumi uchun tavsiya etilgan mahsulotlar",
                'summer': "Yoz mavsumi uchun tavsiya etilgan mahsulotlar", 
                'autumn': "Kuz mavsumi uchun tavsiya etilgan mahsulotlar",
                'winter': "Qish mavsumi uchun tavsiya etilgan mahsulotlar"
            }
            return season_explanations.get(season, "Sizga tavsiya etilgan mahsulotlar")
    
    async def get_popular_recommendations(self, user_profile: UserProfile, limit: int):
        """Get popular products as fallback"""
        query = """
        SELECT 
            p.id as product_id,
            COUNT(o.id) as order_count,
            AVG(pr.rating) as avg_rating
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        LEFT JOIN product_reviews pr ON p.id = pr.product_id
        WHERE p.status = 'active'
        AND o.created_at > NOW() - INTERVAL '30 days'
        GROUP BY p.id
        ORDER BY order_count DESC, avg_rating DESC
        LIMIT $1
        """
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(query, limit)
            
            recommendations = []
            for row in rows:
                recommendations.append({
                    'product_id': row['product_id'],
                    'score': row['order_count'] * (row['avg_rating'] or 3.0),
                    'reason': 'popular_in_uzbekistan'
                })
            
            return recommendations

# Initialize recommendation engine
recommendation_engine = UzbekistanRecommendationEngine()

@app.on_event("startup")
async def startup_event():
    """Initialize the recommendation engine on startup"""
    await recommendation_engine.initialize()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-recommendation-engine",
        "version": "1.0.0",
        "market": "uzbekistan",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/v1/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Get AI-powered recommendations for a user"""
    
    # Fetch user profile
    user_profile = await get_user_profile(request.user_id)
    
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    # Generate recommendations
    recommendations = await recommendation_engine.get_recommendations(
        user_profile=user_profile,
        context=request.context,
        limit=request.limit,
        exclude_products=request.exclude_products
    )
    
    # Prepare response
    response = RecommendationResponse(
        user_id=request.user_id,
        recommendations=recommendations,
        context=request.context,
        generated_at=datetime.now(),
        model_version="uzbekistan_v1.0",
        uzbekistan_factors={
            "current_season": recommendation_engine.get_current_season(),
            "is_ramadan": recommendation_engine.ramadan_schedule.is_ramadan_period(datetime.now()),
            "is_navruz": recommendation_engine.holidays.is_navruz_period(datetime.now()),
            "user_region": user_profile.region,
            "cultural_weighting_applied": True
        }
    )
    
    # Cache the response
    cache_key = f"recommendations:{request.user_id}:{request.context}"
    await redis_client.setex(
        cache_key,
        config.CACHE_TTL,
        json.dumps(response.dict(), default=str)
    )
    
    return response

@app.post("/api/v1/similar-products/{product_id}")
async def get_similar_products(product_id: str, limit: int = 10):
    """Get products similar to a given product"""
    
    if not recommendation_engine.models.get('content'):
        raise HTTPException(status_code=503, detail="Content model not available")
    
    model = recommendation_engine.models['content']
    
    try:
        product_idx = model['product_ids'].index(product_id)
        product_vector = model['feature_matrix'][product_idx]
        
        # Calculate similarities
        similarities = cosine_similarity(product_vector, model['feature_matrix'])[0]
        
        # Get top similar products (excluding the product itself)
        top_indices = np.argsort(similarities)[::-1][1:limit+1]
        
        similar_products = []
        for idx in top_indices:
            similar_product_id = model['product_ids'][idx]
            similarity_score = similarities[idx]
            
            similar_products.append({
                'product_id': similar_product_id,
                'similarity_score': float(similarity_score),
                'reason': 'content_similarity'
            })
        
        return {
            'product_id': product_id,
            'similar_products': similar_products,
            'generated_at': datetime.now().isoformat()
        }
        
    except ValueError:
        raise HTTPException(status_code=404, detail="Product not found in recommendation model")

@app.post("/api/v1/trending/{region}")
async def get_trending_products(region: str, limit: int = 20):
    """Get trending products in a specific Uzbekistan region"""
    
    # Validate region
    valid_regions = ['TSH', 'SAM', 'BUX', 'AND', 'FAR', 'NAM', 'QAS', 'SUR', 'NAV', 'JIZ', 'SIR', 'XOR', 'QOR']
    if region not in valid_regions:
        raise HTTPException(status_code=400, detail="Invalid region code")
    
    # Get trending products for the region
    query = """
    SELECT 
        p.id as product_id,
        p.name,
        p.price,
        p.category,
        COUNT(DISTINCT o.id) as recent_orders,
        COUNT(DISTINCT oi.id) as total_items_sold,
        AVG(pr.rating) as avg_rating
    FROM products p
    JOIN order_items oi ON p.id = oi.product_id
    JOIN orders o ON oi.order_id = o.id
    LEFT JOIN product_reviews pr ON p.id = pr.product_id
    WHERE o.shipping_region = $1
    AND o.created_at > NOW() - INTERVAL '7 days'
    AND p.status = 'active'
    GROUP BY p.id, p.name, p.price, p.category
    HAVING COUNT(DISTINCT o.id) >= 3
    ORDER BY recent_orders DESC, total_items_sold DESC, avg_rating DESC
    LIMIT $2
    """
    
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(query, region, limit)
        
        trending_products = []
        for row in rows:
            trending_products.append({
                'product_id': row['product_id'],
                'name': row['name'],
                'price': row['price'],
                'category': row['category'],
                'recent_orders': row['recent_orders'],
                'total_items_sold': row['total_items_sold'],
                'avg_rating': float(row['avg_rating']) if row['avg_rating'] else None,
                'trend_score': row['recent_orders'] * 2 + row['total_items_sold']
            })
    
    return {
        'region': region,
        'trending_products': trending_products,
        'generated_at': datetime.now().isoformat()
    }

@app.post("/api/v1/retrain-models")
async def retrain_models(background_tasks: BackgroundTasks):
    """Retrain recommendation models (admin endpoint)"""
    
    background_tasks.add_task(recommendation_engine.train_models)
    
    return {
        'message': 'Model retraining started in background',
        'estimated_completion': '30-60 minutes'
    }

async def get_user_profile(user_id: str) -> Optional[UserProfile]:
    """Fetch user profile from database"""
    
    # Try cache first
    cache_key = f"user_profile:{user_id}"
    cached_profile = await redis_client.get(cache_key)
    
    if cached_profile:
        return UserProfile(**json.loads(cached_profile))
    
    # Fetch from database
    query = """
    SELECT 
        u.id as user_id,
        u.region,
        u.language_preference as language,
        u.age_group,
        u.gender,
        u.income_level,
        ARRAY_AGG(DISTINCT ui.category) as interests,
        ARRAY_AGG(DISTINCT oh.category) as purchase_history
    FROM users u
    LEFT JOIN user_interests ui ON u.id = ui.user_id
    LEFT JOIN (
        SELECT DISTINCT o.user_id, p.category
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.created_at > NOW() - INTERVAL '6 months'
    ) oh ON u.id = oh.user_id
    WHERE u.id = $1
    GROUP BY u.id, u.region, u.language_preference, u.age_group, u.gender, u.income_level
    """
    
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(query, user_id)
        
        if not row:
            return None
        
        profile = UserProfile(
            user_id=row['user_id'],
            region=row['region'],
            language=row['language'] or 'uz',
            age_group=row['age_group'],
            gender=row['gender'],
            income_level=row['income_level'],
            interests=[i for i in (row['interests'] or []) if i],
            purchase_history=[p for p in (row['purchase_history'] or []) if p]
        )
        
        # Cache the profile
        await redis_client.setex(
            cache_key,
            config.CACHE_TTL,
            json.dumps(profile.dict())
        )
        
        return profile

if __name__ == "__main__":
    uvicorn.run(
        "index:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "3016")),
        reload=True
    ) 