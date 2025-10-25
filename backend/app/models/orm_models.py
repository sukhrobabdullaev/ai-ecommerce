from datetime import datetime
from enum import Enum
from decimal import Decimal
from sqlalchemy import (
    Column, String, Integer, DateTime, ForeignKey, Boolean,
    Enum as PgEnum, JSON, Numeric, UniqueConstraint, Index, ARRAY
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()
# 🧱 SQLAlchemy ORM Schema — AI E-commerce System


# ======================================================
# ENUM DEFINITIONS
# ======================================================

class TokenType(str, Enum):
    ACCESS = "ACCESS"
    REFRESH = "REFRESH"

class OrderStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PROCESSING = "PROCESSING"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"

class ChatType(str, Enum):
    TEXT = "TEXT"
    AUDIO = "AUDIO"
    IMAGE = "IMAGE"
    MIXED = "MIXED"

class ContentType(str, Enum):
    TEXT = "TEXT"
    AUDIO = "AUDIO"
    IMAGE = "IMAGE"
    DOCUMENT = "DOCUMENT"
    MIXED = "MIXED"

class ActionType(str, Enum):
    SEARCH = "SEARCH"
    PRODUCT_INFO = "PRODUCT_INFO"
    ADD_TO_CART = "ADD_TO_CART"
    REMOVE_FROM_CART = "REMOVE_FROM_CART"
    ADD_TO_WISHLIST = "ADD_TO_WISHLIST"
    REMOVE_FROM_WISHLIST = "REMOVE_FROM_WISHLIST"
    CHECKOUT = "CHECKOUT"
    RECOMMENDATION = "RECOMMENDATION"
    GENERAL_QUERY = "GENERAL_QUERY"

class TransactionType(str, Enum):
    PRODUCT_VIEW = "PRODUCT_VIEW"
    ADD_TO_CART = "ADD_TO_CART"
    CHECKOUT = "CHECKOUT"
    PURCHASE = "PURCHASE"
    REFUND = "REFUND"
    RETURN = "RETURN"

class TransactionStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class AISystemType(str, Enum):
    GENERAL_LLM = "GENERAL_LLM"
    DOMAIN_SPECIFIC_ML = "DOMAIN_SPECIFIC_ML"

class LLMProvider(str, Enum):
    GPT = "GPT"
    GEMINI = "GEMINI"
    CLAUDE = "CLAUDE"
    LLAMA = "LLAMA"
    OTHER = "OTHER"

class MessageRole(str, Enum):
    USER = "USER"
    SYSTEM = "SYSTEM"

class FeedbackType(str, Enum):
    ACCURACY = "ACCURACY"
    CLARITY = "CLARITY"
    RESPONSE_TIME = "RESPONSE_TIME"
    OVERALL_EXPERIENCE = "OVERALL_EXPERIENCE"


# ======================================================
# USER MANAGEMENT
# ======================================================

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    credential = relationship("Credential", back_populates="user", uselist=False)
    oauth_accounts = relationship("OAuthAccount", back_populates="user", cascade="all, delete")
    sessions = relationship("Session", back_populates="user", cascade="all, delete")
    password_resets = relationship("PasswordReset", back_populates="user", cascade="all, delete")

    reviews = relationship("Review", back_populates="user", cascade="all, delete")
    wishlist_items = relationship("WishlistItem", back_populates="user", cascade="all, delete")
    orders = relationship("Order", back_populates="user")
    carts = relationship("Cart", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")


class Credential(Base):
    __tablename__ = "credentials"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    password = Column(String, nullable=False)

    user = relationship("User", back_populates="credential")


class OAuthAccount(Base):
    __tablename__ = "oauth_accounts"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    provider = Column(String, nullable=False)
    provider_user_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="oauth_accounts")

    __table_args__ = (UniqueConstraint("provider", "provider_user_id"),)


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    user_agent = Column(String)
    ip = Column(String)
    refresh_id = Column(String)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sessions")
    tokens = relationship("Token", back_populates="session", cascade="all, delete")

    __table_args__ = (
        Index("idx_user_id", "user_id"),
        Index("idx_expires_at", "expires_at"),
    )


class Token(Base):
    __tablename__ = "tokens"

    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"))
    type = Column(PgEnum(TokenType))
    token = Column(String, unique=True)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    revoked_at = Column(DateTime)

    session = relationship("Session", back_populates="tokens")

    __table_args__ = (
        Index("idx_token_type", "type"),
        Index("idx_token_expiry", "expires_at"),
    )


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    token = Column(String, unique=True)
    expires_at = Column(DateTime)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="password_resets")


# ======================================================
# PRODUCT CATALOG
# ======================================================

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String)
    parent_id = Column(String, ForeignKey("categories.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    parent = relationship("Category", remote_side=[id], back_populates="children")
    children = relationship("Category", back_populates="parent")
    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Numeric(10, 2))
    category_id = Column(String, ForeignKey("categories.id"))
    brand = Column(String)
    images = Column(ARRAY(String))
    tags = Column(ARRAY(String))
    stock = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    order_items = relationship("OrderItem", back_populates="product")
    reviews = relationship("Review", back_populates="product")
    wishlist_items = relationship("WishlistItem", back_populates="product")
    cart_items = relationship("CartItem", back_populates="product")
    category = relationship("Category", back_populates="products")


# ======================================================
# SHOPPING & ORDERS
# ======================================================

class Cart(Base):
    __tablename__ = "carts"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    session_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="carts")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete")


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(String, primary_key=True)
    cart_id = Column(String, ForeignKey("carts.id", ondelete="CASCADE"))
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"))
    quantity = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    cart = relationship("Cart", back_populates="items")
    product = relationship("Product", back_populates="cart_items")

    __table_args__ = (UniqueConstraint("cart_id", "product_id"),)


class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    order_number = Column(String, unique=True)
    status = Column(PgEnum(OrderStatus), default=OrderStatus.PENDING)
    subtotal = Column(Numeric(10, 2))
    tax = Column(Numeric(10, 2))
    shipping = Column(Numeric(10, 2))
    total = Column(Numeric(10, 2))
    shipping_address = Column(JSON)
    billing_address = Column(JSON)
    payment_method = Column(String)
    payment_status = Column(PgEnum(PaymentStatus), default=PaymentStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True)
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"))
    product_id = Column(String, ForeignKey("products.id"))
    quantity = Column(Integer)
    price = Column(Numeric(10, 2))
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


# ======================================================
# USER INTERACTIONS
# ======================================================

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"))
    rating = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")

    __table_args__ = (UniqueConstraint("user_id", "product_id"),)


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="wishlist_items")
    product = relationship("Product", back_populates="wishlist_items")

    __table_args__ = (UniqueConstraint("user_id", "product_id"),)


# ======================================================
# AI & RESEARCH SYSTEM
# ======================================================

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    system_type = Column(PgEnum(AISystemType), default=AISystemType.GENERAL_LLM)
    chat_type = Column(PgEnum(ChatType), default=ChatType.TEXT)
    session_name = Column(String)
    llm_preference = Column(PgEnum(LLMProvider))
    device_info = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_used_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete")
    feedback = relationship("UserFeedback", back_populates="session", cascade="all, delete")
    transactions = relationship("SessionTransaction", back_populates="session", cascade="all, delete")

    __table_args__ = (
        Index("idx_chat_user", "user_id"),
        Index("idx_chat_last_used", "last_used_at"),
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("chat_sessions.id", ondelete="CASCADE"))
    role = Column(PgEnum(MessageRole))
    content = Column(String)
    content_type = Column(PgEnum(ContentType), default=ContentType.TEXT)
    input_audio_url = Column(String)
    output_audio_url = Column(String)
    transcription = Column(String)
    input_data = Column(JSON)
    output_data = Column(JSON)
    model_used = Column(String)
    action_type = Column(PgEnum(ActionType))
    action_data = Column(JSON)
    response_time = Column(Integer)
    token_count = Column(Integer)
    cost = Column(Numeric(10, 6))
    feedback_rating = Column(Integer)
    feedback_note = Column(String)
    is_processed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")

    __table_args__ = (
        Index("idx_msg_session", "session_id"),
        Index("idx_msg_created", "created_at"),
    )


class SessionTransaction(Base):
    __tablename__ = "session_transactions"

    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("chat_sessions.id", ondelete="CASCADE"))
    product_id = Column(String, ForeignKey("products.id"), nullable=True)
    type = Column(PgEnum(TransactionType))
    amount = Column(Numeric(10, 2))
    status = Column(PgEnum(TransactionStatus), default=TransactionStatus.COMPLETED)
    tx_metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="transactions")
    product = relationship("Product")


class UserFeedback(Base):
    __tablename__ = "user_feedback"

    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("chat_sessions.id", ondelete="CASCADE"))
    rating = Column(Integer)
    comment = Column(String)
    category = Column(PgEnum(FeedbackType))
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="feedback")