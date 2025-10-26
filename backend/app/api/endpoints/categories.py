from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.db import get_db
from app.services.category_service import CategoryService
from app.schemas.product import (
    CategoryCreate, CategoryUpdate, CategoryResponse, 
    CategoryListResponse, ProductResponse, ProductListResponse
)

router = APIRouter(prefix="/categories", tags=["categories"])

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db)
):
    """Create a new category."""
    category_service = CategoryService(db)
    return category_service.create_category(category_data)

@router.get("/", response_model=CategoryListResponse)
async def get_categories(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    parent_id: Optional[str] = Query(None, description="Filter by parent category ID"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    active_only: bool = Query(True, description="Show only active categories"),
    db: Session = Depends(get_db)
):
    """Get categories with filtering and pagination."""
    category_service = CategoryService(db)
    
    skip = (page - 1) * page_size
    categories, total = category_service.get_categories(
        skip=skip,
        limit=page_size,
        parent_id=parent_id,
        search=search,
        active_only=active_only
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return CategoryListResponse(
        categories=categories,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: str,
    db: Session = Depends(get_db)
):
    """Get a category by ID."""
    category_service = CategoryService(db)
    return category_service.get_category(category_id)

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db)
):
    """Update a category."""
    category_service = CategoryService(db)
    return category_service.update_category(category_id, category_data)

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    db: Session = Depends(get_db)
):
    """Delete a category."""
    category_service = CategoryService(db)
    category_service.delete_category(category_id)

@router.get("/{category_id}/products", response_model=ProductListResponse)
async def get_category_products(
    category_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    db: Session = Depends(get_db)
):
    """Get products in a specific category."""
    category_service = CategoryService(db)
    
    skip = (page - 1) * page_size
    category, products, total = category_service.get_category_with_products(
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
