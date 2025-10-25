"""
Configuration settings for the application.
"""
import os
from typing import Optional


class Settings:
    """Application settings."""
    
    def __init__(self):
        # Database configuration
        self.database_url: str = self._get_database_url()
        
        # Application settings
        self.app_name: str = "AI E-commerce Backend"
        self.debug: bool = os.getenv("DEBUG", "False").lower() == "true"
        
        # Security settings
        self.secret_key: str = os.getenv("SECRET_KEY", "something-secret")
        self.jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
        self.jwt_access_token_expire_minutes: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        self.jwt_refresh_token_expire_days: int = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))
        
        # CORS settings
        self.cors_origins: list = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    
    def _get_database_url(self) -> str:
        """Get database URL from environment or use default."""
        # Try to get from environment first
        database_url = os.getenv("DATABASE_URL")
        
        if database_url:
            return database_url
        
        # Fallback to the URL from alembic.ini
        return "postgresql://neondb_owner:npg_1M6bGARKvePo@ep-dry-band-ado834mv-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"


# Create a global settings instance
settings = Settings()
