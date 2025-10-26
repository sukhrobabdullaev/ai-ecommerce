from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.orm_models import Category, Product
from app.schemas.product import CategoryCreate, CategoryUpdate
from fastapi import HTTPException, status
from typing import List, Optional
import uuid

class CategoryService:
    def __init__(self, db: Session):
        self.db = db

    def create_category(self, category_data: CategoryCreate) -> Category:
        """Create a new category."""
        # Validate parent category exists if provided
        if category_data.parent_id:
            parent_category = self.db.query(Category).filter(Category.id == category_data.parent_id).first()
            if not parent_category:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent category not found"
                )
        
        # Check if category with same name already exists
        existing_category = self.db.query(Category).filter(Category.name == category_data.name).first()
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name already exists"
            )
        
        category = Category(
            id=str(uuid.uuid4()),
            **category_data.dict()
        )
        
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def get_category(self, category_id: str) -> Category:
        """Get a category by ID."""
        category = self.db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        return category

    def get_categories(
        self, 
        skip: int = 0, 
        limit: int = 20,
        parent_id: Optional[str] = None,
        search: Optional[str] = None,
        active_only: bool = True
    ) -> tuple[List[Category], int]:
        """Get categories with filtering and pagination."""
        query = self.db.query(Category)
        
        # Apply filters
        if parent_id is not None:
            query = query.filter(Category.parent_id == parent_id)
        
        if search:
            search_filter = or_(
                Category.name.ilike(f"%{search}%"),
                Category.description.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        if active_only:
            query = query.filter(Category.is_active == True)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        categories = query.offset(skip).limit(limit).all()
        
        return categories, total
        
    def update_category(self, category_id: str, category_data: CategoryUpdate) -> Category:
        """Update a category."""
        category = self.get_category(category_id)
        
        # Validate parent category if provided
        if category_data.parent_id:
            if category_data.parent_id == category_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category cannot be its own parent"
                )
            
            parent_category = self.db.query(Category).filter(Category.id == category_data.parent_id).first()
            if not parent_category:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent category not found"
                )
        
        # Check name uniqueness if name is being updated
        if category_data.name and category_data.name != category.name:
            existing_category = self.db.query(Category).filter(
                and_(Category.name == category_data.name, Category.id != category_id)
            ).first()
            if existing_category:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category with this name already exists"
                )
        
        # Update fields
        update_data = category_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(category, field, value)
        
        self.db.commit()
        self.db.refresh(category)
        return category

    def delete_category(self, category_id: str) -> bool:
        """Delete a category."""
        category = self.get_category(category_id)
        
        # Check if category has products
        product_count = self.db.query(Product).filter(Product.category_id == category_id).count()
        if product_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete category with {product_count} products. Move or delete products first."
            )
        
        # Check if category has subcategories
        subcategory_count = self.db.query(Category).filter(Category.parent_id == category_id).count()
        if subcategory_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete category with {subcategory_count} subcategories. Delete subcategories first."
            )
        
        self.db.delete(category)
        self.db.commit()
        return True

    def get_category_with_products(self, category_id: str, skip: int = 0, limit: int = 20) -> tuple[Category, List[Product], int]:
        """Get category with its products."""
        category = self.get_category(category_id)
        
        # Get products in this category
        products_query = self.db.query(Product).filter(Product.category_id == category_id)
        total_products = products_query.count()
        products = products_query.offset(skip).limit(limit).all()
        
        return category, products, total_products
