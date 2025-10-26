from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.db import get_db
from app.services.product_service import ProductService
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, 
    ProductListResponse
)

router = APIRouter(prefix="/products", tags=["products"])

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db)
):
    """Create a new product."""
    product_service = ProductService(db)
    return product_service.create_product(product_data)

@router.get("/", response_model=ProductListResponse)
async def get_products(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    limit: Optional[int] = Query(None, ge=1, le=100, description="Number of items per page"),
    skip: Optional[int] = Query(None, ge=0, description="Skip number of items"),
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    search: Optional[str] = Query(None, description="Search in name, description, and brand"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    in_stock_only: bool = Query(False, description="Show only products in stock"),
    db: Session = Depends(get_db)
):
    """Get products with filtering and pagination."""
    product_service = ProductService(db)
    if limit is None:
        limit = page_size
    products, total = product_service.get_products(
        skip=skip,
        limit=limit,
        category_id=category_id,
        search=search,
        min_price=min_price,
        max_price=max_price,
        brand=brand,
        in_stock_only=in_stock_only
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return ProductListResponse(
        products=products,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    db: Session = Depends(get_db)
):
    """Get a product by ID."""
    product_service = ProductService(db)
    return product_service.get_product(product_id)

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_data: ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update a product."""
    product_service = ProductService(db)
    return product_service.update_product(product_id, product_data)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    db: Session = Depends(get_db)
):
    """Delete a product."""
    product_service = ProductService(db)
    product_service.delete_product(product_id)

@router.get("/category/{category_id}", response_model=ProductListResponse)
async def get_products_by_category(
    category_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    db: Session = Depends(get_db)
):
    """Get products by category."""
    product_service = ProductService(db)
    
    skip = (page - 1) * page_size
    products, total = product_service.get_products_by_category(
        category_id=category_id,
        skip=skip,
        limit=page_size
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return ProductListResponse(
        products=products,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/search/{search_term}", response_model=ProductListResponse)
async def search_products(
    search_term: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    db: Session = Depends(get_db)
):
    """Search products by name, description, or brand."""
    product_service = ProductService(db)
    
    skip = (page - 1) * page_size
    products, total = product_service.search_products(
        search_term=search_term,
        skip=skip,
        limit=page_size
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return ProductListResponse(
        products=products,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )
