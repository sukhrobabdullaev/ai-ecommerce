#!/usr/bin/env python3
"""
Seed script to populate the database with sample data for products and categories.
Run this script to add realistic e-commerce data to your database.
"""

import asyncio
import uuid
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.models.orm_models import Base, Category, Product
from app.core.config import settings

# Create database engine
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_categories():
    """Create sample categories"""
    categories_data = [
        {
            "id": str(uuid.uuid4()),
            "name": "Electronics",
            "description": "Electronic devices and gadgets",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Clothing & Fashion",
            "description": "Fashion and clothing items",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Home & Garden",
            "description": "Home improvement and garden supplies",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sports & Outdoors",
            "description": "Sports equipment and outdoor gear",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Books & Media",
            "description": "Books, movies, and media",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Health & Beauty",
            "description": "Health and beauty products",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Toys & Games",
            "description": "Toys and gaming products",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Automotive",
            "description": "Car parts and automotive accessories",
            "is_active": True
        }
    ]
    return categories_data

def create_products(category_map):
    """Create sample products"""
    products_data = [
        # Electronics
        {
            "id": str(uuid.uuid4()),
            "name": "iPhone 15 Pro",
            "description": "Latest iPhone with advanced camera system and A17 Pro chip",
            "price": Decimal("999.99"),
            "category_id": category_map["Electronics"],
            "brand": "Apple",
            "images": [
                "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=500&fit=crop",
                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop"
            ],
            "tags": ["smartphone", "apple", "5g", "camera"],
            "stock": 50
        },
        {
            "id": str(uuid.uuid4()),
            "name": "MacBook Air M2",
            "description": "Ultra-thin laptop with M2 chip for maximum performance",
            "price": Decimal("1199.99"),
            "category_id": category_map["Electronics"],
            "brand": "Apple",
            "images": ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop"],
            "tags": ["laptop", "apple", "m2", "portable"],
            "stock": 25
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Samsung Galaxy S24",
            "description": "Premium Android smartphone with AI features",
            "price": Decimal("799.99"),
            "category_id": category_map["Electronics"],
            "brand": "Samsung",
            "images": ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop"],
            "tags": ["smartphone", "android", "ai", "camera"],
            "stock": 40
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sony WH-1000XM5 Headphones",
            "description": "Industry-leading noise canceling wireless headphones",
            "price": Decimal("399.99"),
            "category_id": category_map["Electronics"],
            "brand": "Sony",
            "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop"],
            "tags": ["headphones", "wireless", "noise-canceling", "audio"],
            "stock": 30
        },
        
        # Clothing & Fashion
        {
            "id": str(uuid.uuid4()),
            "name": "Nike Air Max 270",
            "description": "Comfortable running shoes with Air Max technology",
            "price": Decimal("150.00"),
            "category_id": category_map["Clothing & Fashion"],
            "brand": "Nike",
            "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop"],
            "tags": ["shoes", "running", "sports", "nike"],
            "stock": 100
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Levi's 501 Original Jeans",
            "description": "Classic straight-fit jeans in blue denim",
            "price": Decimal("89.99"),
            "category_id": category_map["Clothing & Fashion"],
            "brand": "Levi's",
            "images": ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=500&fit=crop"],
            "tags": ["jeans", "denim", "classic", "casual"],
            "stock": 75
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Adidas Ultraboost 22",
            "description": "High-performance running shoes with Boost technology",
            "price": Decimal("180.00"),
            "category_id": category_map["Clothing & Fashion"],
            "brand": "Adidas",
            "images": ["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&h=500&fit=crop"],
            "tags": ["shoes", "running", "boost", "performance"],
            "stock": 60
        },
        
        # Home & Garden
        {
            "id": str(uuid.uuid4()),
            "name": "Dyson V15 Detect Vacuum",
            "description": "Cordless vacuum with laser dust detection",
            "price": Decimal("649.99"),
            "category_id": category_map["Home & Garden"],
            "brand": "Dyson",
            "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop"],
            "tags": ["vacuum", "cordless", "cleaning", "home"],
            "stock": 20
        },
        {
            "id": str(uuid.uuid4()),
            "name": "KitchenAid Stand Mixer",
            "description": "Professional-grade stand mixer for baking",
            "price": Decimal("329.99"),
            "category_id": category_map["Home & Garden"],
            "brand": "KitchenAid",
            "images": ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=500&fit=crop"],
            "tags": ["mixer", "kitchen", "baking", "appliance"],
            "stock": 15
        },
        
        # Sports & Outdoors
        {
            "id": str(uuid.uuid4()),
            "name": "Yeti Rambler 30oz Tumbler",
            "description": "Insulated stainless steel tumbler keeps drinks cold",
            "price": Decimal("45.00"),
            "category_id": category_map["Sports & Outdoors"],
            "brand": "Yeti",
            "images": ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=500&fit=crop"],
            "tags": ["tumbler", "insulated", "outdoor", "drinkware"],
            "stock": 200
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Patagonia Better Sweater Jacket",
            "description": "Fleece jacket made from recycled polyester",
            "price": Decimal("99.00"),
            "category_id": category_map["Sports & Outdoors"],
            "brand": "Patagonia",
            "images": ["https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=500&fit=crop"],
            "tags": ["jacket", "fleece", "outdoor", "sustainable"],
            "stock": 50
        },
        
        # Books & Media
        {
            "id": str(uuid.uuid4()),
            "name": "The Psychology of Money",
            "description": "Timeless lessons on wealth, greed, and happiness",
            "price": Decimal("16.99"),
            "category_id": category_map["Books & Media"],
            "brand": "Harriman House",
            "images": ["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=500&fit=crop"],
            "tags": ["book", "finance", "psychology", "money"],
            "stock": 100
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Atomic Habits",
            "description": "An Easy & Proven Way to Build Good Habits & Break Bad Ones",
            "price": Decimal("18.99"),
            "category_id": category_map["Books & Media"],
            "brand": "Avery",
            "images": ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop"],
            "tags": ["book", "self-help", "habits", "productivity"],
            "stock": 150
        },
        
        # Health & Beauty
        {
            "id": str(uuid.uuid4()),
            "name": "The Ordinary Niacinamide 10% + Zinc 1%",
            "description": "Serum for blemish-prone skin and enlarged pores",
            "price": Decimal("12.90"),
            "category_id": category_map["Health & Beauty"],
            "brand": "The Ordinary",
            "images": ["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&h=500&fit=crop"],
            "tags": ["skincare", "serum", "niacinamide", "beauty"],
            "stock": 80
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Oral-B Pro 1000 Electric Toothbrush",
            "description": "3D cleaning action removes up to 300% more plaque",
            "price": Decimal("39.99"),
            "category_id": category_map["Health & Beauty"],
            "brand": "Oral-B",
            "images": ["https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=500&h=500&fit=crop"],
            "tags": ["toothbrush", "electric", "oral-care", "health"],
            "stock": 120
        },
        
        # Toys & Games
        {
            "id": str(uuid.uuid4()),
            "name": "LEGO Creator Expert Assembly Square",
            "description": "Detailed modular building set with 4002 pieces",
            "price": Decimal("279.99"),
            "category_id": category_map["Toys & Games"],
            "brand": "LEGO",
            "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop"],
            "tags": ["lego", "building", "creative", "collector"],
            "stock": 25
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Nintendo Switch Console",
            "description": "Hybrid gaming console for home and portable play",
            "price": Decimal("299.99"),
            "category_id": category_map["Toys & Games"],
            "brand": "Nintendo",
            "images": ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&h=500&fit=crop"],
            "tags": ["gaming", "console", "portable", "nintendo"],
            "stock": 35
        },
        
        # Automotive
        {
            "id": str(uuid.uuid4()),
            "name": "WeatherTech Floor Mats",
            "description": "Custom-fit all-weather floor mats for your vehicle",
            "price": Decimal("149.99"),
            "category_id": category_map["Automotive"],
            "brand": "WeatherTech",
            "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop"],
            "tags": ["floor-mats", "automotive", "protection", "custom-fit"],
            "stock": 40
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Dash Cam Front and Rear",
            "description": "Dual-channel dash cam with night vision and GPS",
            "price": Decimal("199.99"),
            "category_id": category_map["Automotive"],
            "brand": "Garmin",
            "images": ["https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500&h=500&fit=crop"],
            "tags": ["dash-cam", "safety", "recording", "gps"],
            "stock": 20
        }
    ]
    return products_data

def seed_database():
    """Seed the database with sample data"""
    db = SessionLocal()
    
    try:
        print("🌱 Starting database seeding...")
        
        # Get or create categories
        print("📁 Setting up categories...")
        categories_data = create_categories()
        category_map = {}
        
        for cat_data in categories_data:
            # Check if category already exists
            existing_category = db.query(Category).filter(Category.name == cat_data["name"]).first()
            if existing_category:
                category_map[cat_data["name"]] = existing_category.id
                print(f"  ✓ Found existing category: {cat_data['name']}")
            else:
                category = Category(**cat_data)
                db.add(category)
                db.flush()  # Flush to get the ID
                category_map[cat_data["name"]] = category.id
                print(f"  ✓ Created new category: {cat_data['name']}")
        
        db.commit()
        print(f"✅ Processed {len(categories_data)} categories")
        
        # Create products
        print("🛍️ Creating products...")
        products_data = create_products(category_map)
        for prod_data in products_data:
            product = Product(**prod_data)
            db.add(product)
        
        db.commit()
        print(f"✅ Created {len(products_data)} products")
        
        print("🎉 Database seeding completed successfully!")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
