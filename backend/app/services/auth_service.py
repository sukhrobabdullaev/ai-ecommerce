from sqlalchemy.orm import Session
from app.models.orm_models import User, Credential, Session as UserSession, Token as UserToken, TokenType
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from fastapi import HTTPException, status
from datetime import datetime, timedelta
import uuid

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register_user(self, email: str, password: str, name: str = None) -> User:
        """Register a new user."""
        # Check if user already exists
        existing_user = self.db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            email=email,
            name=name
        )
        self.db.add(user)
        
        # Create credential
        credential = Credential(
            id=str(uuid.uuid4()),
            user_id=user_id,
            password=get_password_hash(password)
        )
        self.db.add(credential)
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def authenticate_user(self, email: str, password: str) -> User:
        """Authenticate user with email and password."""
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        credential = self.db.query(Credential).filter(Credential.user_id == user.id).first()
        if not credential or not verify_password(password, credential.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        return user

    def create_session(self, user: User) -> tuple[str, str]:
        """Create user session and tokens."""
        # Create session
        session_id = str(uuid.uuid4())
        session = UserSession(
            id=session_id,
            user_id=user.id,
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        self.db.add(session)
        
        # Create tokens
        access_token = create_access_token(data={"sub": user.id})
        refresh_token = create_refresh_token(data={"sub": user.id})
        
        # Store tokens
        access_token_record = UserToken(
            id=str(uuid.uuid4()),
            session_id=session_id,
            type=TokenType.ACCESS,
            token=access_token,
            expires_at=datetime.utcnow() + timedelta(minutes=30)
        )
        
        refresh_token_record = UserToken(
            id=str(uuid.uuid4()),
            session_id=session_id,
            type=TokenType.REFRESH,
            token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        
        self.db.add(access_token_record)
        self.db.add(refresh_token_record)
        self.db.commit()
        
        return access_token, refresh_token

    def refresh_access_token(self, refresh_token: str) -> str:
        """Refresh access token using refresh token."""
        from app.core.security import verify_token
        
        payload = verify_token(refresh_token, "refresh")
        user_id = payload.get("sub")
        
        # Find active session
        token_record = self.db.query(UserToken).filter(
            UserToken.token == refresh_token,
            UserToken.type == TokenType.REFRESH,
            UserToken.expires_at > datetime.utcnow()
        ).first()
        
        if not token_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Create new access token
        new_access_token = create_access_token(data={"sub": user_id})
        
        # Update token record
        token_record.token = new_access_token
        token_record.expires_at = datetime.utcnow() + timedelta(minutes=30)
        self.db.commit()
        
        return new_access_token

    def logout_user(self, user: User):
        """Logout user by revoking all sessions."""
        # Revoke all user sessions
        self.db.query(UserSession).filter(UserSession.user_id == user.id).update({
            "revoked_at": datetime.utcnow()
        })
        
        # Revoke all tokens
        self.db.query(UserToken).join(UserSession).filter(
            UserSession.user_id == user.id
        ).update({
            "revoked_at": datetime.utcnow()
        })
        
        self.db.commit()

    def update_user(self, user: User, name: str = None, email: str = None) -> User:
        """Update user profile."""
        if name is not None:
            user.name = name
        if email is not None:
            # Check if email is already taken
            existing_user = self.db.query(User).filter(
                User.email == email,
                User.id != user.id
            ).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use"
                )
            user.email = email
        
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete_user(self, user: User):
        """Delete user account."""
        # Delete user (cascade will handle related records)
        self.db.delete(user)
        self.db.commit()