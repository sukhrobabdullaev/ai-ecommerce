from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.schemas.auth import (
    UserRegister, UserLogin, Token, TokenRefresh, 
    UserResponse, UserUpdate
)
from app.services.auth_service import AuthService
from app.models.orm_models import User

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """Register a new user."""
    auth_service = AuthService(db)
    user = auth_service.register_user(
        email=user_data.email,
        password=user_data.password,
        name=user_data.name
    )
    return user

@router.post("/login", response_model=Token)
async def login(
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Login user with email and password."""
    auth_service = AuthService(db)
    
    # Authenticate user
    user = auth_service.authenticate_user(
        email=user_credentials.email,
        password=user_credentials.password
    )
    
    # Create session and tokens
    access_token, refresh_token = auth_service.create_session(user)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout current user."""
    auth_service = AuthService(db)
    auth_service.logout_user(current_user)
    return {"message": "Successfully logged out"}

@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_data: TokenRefresh,
    db: Session = Depends(get_db)
):
    """Refresh access token."""
    auth_service = AuthService(db)
    new_access_token = auth_service.refresh_access_token(token_data.refresh_token)
    
    return {
        "access_token": new_access_token,
        "refresh_token": token_data.refresh_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information."""
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile."""
    auth_service = AuthService(db)
    updated_user = auth_service.update_user(
        user=current_user,
        name=user_update.name,
        email=user_update.email
    )
    return updated_user

@router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_current_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete current user account."""
    auth_service = AuthService(db)
    auth_service.delete_user(current_user)
    return {"message": "Account successfully deleted"}