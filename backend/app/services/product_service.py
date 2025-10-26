from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.orm_models import Product, Category
from app.schemas.product import ProductCreate, ProductUpdate
from fastapi import HTTPException, status
from typing import List, Optional
import uuid

class ProductService:
    def __init__(self, db: Session):
        self.db = db

    def create_product(self, product_data: ProductCreate) -> Product:
        """Create a new product."""
        # Validate category exists if provided
        if product_data.category_id:
            category = self.db.query(Category).filter(Category.id == product_data.category_id).first()
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category not found"
                )
        
        # Check if product with same name already exists
        existing_product = self.db.query(Product).filter(Product.name == product_data.name).first()
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with this name already exists"
            )
        
        product = Product(
            id=str(uuid.uuid4()),
            **product_data.dict()
        )
        
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def get_product(self, product_id: str) -> Product:
        """Get a product by ID."""
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        return product

    def get_products(
        self, 
        skip: int = 0, 
        limit: int = 20,
        category_id: Optional[str] = None,
        search: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        brand: Optional[str] = None,
        in_stock_only: bool = False
    ) -> tuple[List[Product], int]:
        """Get products with filtering and pagination."""
        query = self.db.query(Product)
        
        # Apply filters
        if category_id:
            query = query.filter(Product.category_id == category_id)
        
        if search:
            search_filter = or_(
                Product.name.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
                Product.brand.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        if min_price is not None:
            query = query.filter(Product.price >= min_price)
        
        if max_price is not None:
            query = query.filter(Product.price <= max_price)
        
        if brand:
            query = query.filter(Product.brand.ilike(f"%{brand}%"))
        
        if in_stock_only:
            query = query.filter(Product.stock > 0)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        products = query.offset(skip).limit(limit).all()
        
        return products, total

    def update_product(self, product_id: str, product_data: ProductUpdate) -> Product:
        """Update a product."""
        product = self.get_product(product_id)
        
        # Validate category if provided
        if product_data.category_id:
            category = self.db.query(Category).filter(Category.id == product_data.category_id).first()
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category not found"
                )
        
        # Check name uniqueness if name is being updated
        if product_data.name and product_data.name != product.name:
            existing_product = self.db.query(Product).filter(
                and_(Product.name == product_data.name, Product.id != product_id)
            ).first()
            if existing_product:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Product with this name already exists"
                )
        
        # Update fields
        update_data = product_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(product, field, value)
        
        self.db.commit()
        self.db.refresh(product)
        return product

    def delete_product(self, product_id: str) -> bool:
        """Delete a product."""
        product = self.get_product(product_id)
        self.db.delete(product)
        self.db.commit()
        return True

    def get_products_by_category(self, category_id: str, skip: int = 0, limit: int = 20) -> tuple[List[Product], int]:
        """Get products by category."""
        return self.get_products(skip=skip, limit=limit, category_id=category_id)

    def search_products(self, search_term: str, skip: int = 0, limit: int = 20) -> tuple[List[Product], int]:
        """Search products by name, description, or brand."""
        return self.get_products(skip=skip, limit=limit, search=search_term)
