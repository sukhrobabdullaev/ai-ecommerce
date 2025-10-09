# AI E-commerce Project - Complete Data Models

This document outlines all the data models required for the AI-powered e-commerce platform.

## 🗄️ Database Models (Prisma Schema)

### Core User Management

```prisma
model User {
  id             String           @id @default(cuid())
  email          String           @unique
  name           String?
  password       String?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  // Relations
  credentials    Credential?
  oauthAccounts  OAuthAccount[]
  sessions       Session[]
  passwordResets PasswordReset[]
}

model Credential {
  id        String   @id @default(cuid())
  userId    String   @unique
  password  String   // hashed password
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model OAuthAccount {
  id             String   @id @default(cuid())
  userId         String
  provider       String   // e.g. "google", "github", "kakao"
  providerUserId String
  createdAt      DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerUserId])
}

model Session {
  id         String   @id @default(cuid())
  userId     String
  userAgent  String?
  ip         String?
  refreshId  String?   // used to group refresh token rotations
  expiresAt  DateTime
  revokedAt  DateTime?
  createdAt  DateTime @default(now())

  // relations
  tokens Token[]
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model Token {
  id            String   @id @default(cuid())
  sessionId     String
  type          TokenType // ACCESS or REFRESH
  token         String    @unique // hashed token string
  expiresAt     DateTime
  createdAt     DateTime @default(now())
  revokedAt     DateTime?

  session Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([type])
  @@index([expiresAt])
}

enum TokenType {
  ACCESS
  REFRESH
}

model PasswordReset {
  id          String   @id @default(cuid())
  userId      String
  token       String   @unique
  expiresAt   DateTime
  used        Boolean  @default(false)
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Product Catalog

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String
  price       Decimal  @db.Decimal(10, 2)
  category    String
  brand       String?
  images      String[] // Array of image URLs
  tags        String[]
  stock       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  orderItems    OrderItem[]
  reviews       Review[]
  wishlistItems WishlistItem[]
  cartItems     CartItem[]

  @@map("products")
}

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  parentId    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")
  products Product[]

  @@map("categories")
}
```

### Shopping & Orders

```prisma
model Cart {
  id        String   @id @default(cuid())
  userId    String?  // Nullable for guest carts
  sessionId String?  // For guest carts
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user  User?       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items CartItem[]

  @@map("carts")
}

model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  productId String
  quantity  Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  cart    Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([cartId, productId])
  @@map("cart_items")
}

model Order {
  id            String      @id @default(cuid())
  userId        String
  orderNumber   String      @unique
  status        OrderStatus @default(PENDING)
  subtotal      Decimal     @db.Decimal(10, 2)
  tax           Decimal     @db.Decimal(10, 2)
  shipping      Decimal     @db.Decimal(10, 2)
  total         Decimal     @db.Decimal(10, 2)
  shippingAddress Json
  billingAddress  Json
  paymentMethod   String
  paymentStatus   PaymentStatus @default(PENDING)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  user  User        @relation(fields: [userId], references: [id])
  items OrderItem[]

  @@map("orders")
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Decimal @db.Decimal(10, 2) // Price at time of purchase
  createdAt DateTime @default(now())

  // Relations
  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
```

### User Interactions

```prisma
model Review {
  id        String   @id @default(cuid())
  userId    String
  productId String
  rating    Int    // 1-5 stars
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
  @@map("reviews")
}

model WishlistItem {
  id        String   @id @default(cuid())
  userId    String
  productId String
  createdAt DateTime @default(now())

  // Relations
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
  @@map("wishlist_items")
}
```

### AI & Research System

```prisma

model ChatSession {
  id             String              @id @default(cuid())
  userId         String?             // Nullable for guest sessions
  systemType     AISystemType        @default(GENERAL_LLM)
  chatType       ChatType            @default(TEXT)
  sessionName    String?             // For users to name their chat sessions
  llmPreference  LLMProvider?        // e.g., GPT, Gemini, Claude
  deviceInfo     Json?               // Store device information
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt
  lastUsedAt     DateTime            @default(now())

  // Relations
  user           User?               @relation(fields: [userId], references: [id], onDelete: SetNull)
  messages       ChatMessage[]
  feedback       UserFeedback[]      // User feedback after satisfaction
  transactions   SessionTransaction[]

  @@index([userId])
  @@index([lastUsedAt])
  @@map("chat_sessions")
}

model ChatMessage {
  id              String         @id @default(cuid())
  sessionId       String
  role            MessageRole    // USER or SYSTEM
  content         String         // Message text
  contentType     ContentType    @default(TEXT)
  inputAudioUrl   String?        // User audio input
  outputAudioUrl  String?        // AI audio output
  transcription   String?        // For voice input
  inputData       Json?          // Raw input data
  outputData      Json?          // Raw output data
  modelUsed       String?        // e.g., GPT-4, Gemini 1.5 Pro
  actionType      ActionType?    // e.g., SEARCH, ADD_TO_CART
  actionData      Json?          // Details of action
  responseTime    Int?           // in ms
  tokenCount      Int?
  cost            Decimal?       @db.Decimal(10, 6)
  feedbackRating  Int?           // User rating per message
  feedbackNote    String?
  isProcessed     Boolean        @default(true)
  createdAt       DateTime       @default(now())

  // Relations
  session         ChatSession    @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@index([createdAt])
  @@map("chat_messages")
}

model SessionTransaction {
  id          String             @id @default(cuid())
  sessionId   String
  type        TransactionType
  productId   String?
  amount      Decimal?           @db.Decimal(10, 2)
  status      TransactionStatus  @default(COMPLETED)
  metadata    Json?
  createdAt   DateTime           @default(now())

  // Relations
  session     ChatSession        @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  product     Product?           @relation(fields: [productId], references: [id])

  @@map("session_transactions")
}

model UserFeedback {
  id          String        @id @default(cuid())
  sessionId   String
  rating      Int           // 1–5 rating
  comment     String?
  category    FeedbackType? // Which aspect user rated
  createdAt   DateTime      @default(now())

  // Relations
  session     ChatSession   @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@map("user_feedback")
}

enum ChatType {
  TEXT
  AUDIO
  IMAGE
  MIXED
}

enum ContentType {
  TEXT
  AUDIO
  IMAGE
  DOCUMENT
  MIXED
}

enum ActionType {
  SEARCH
  PRODUCT_INFO
  ADD_TO_CART
  REMOVE_FROM_CART
  ADD_TO_WISHLIST
  REMOVE_FROM_WISHLIST
  CHECKOUT
  RECOMMENDATION
  GENERAL_QUERY
}

enum TransactionType {
  PRODUCT_VIEW
  ADD_TO_CART
  CHECKOUT
  PURCHASE
  REFUND
  RETURN
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
}

enum AISystemType {
  GENERAL_LLM
  DOMAIN_SPECIFIC_ML
}

enum LLMProvider {
  GPT
  GEMINI
  CLAUDE
  LLAMA
  OTHER
}

enum MessageRole {
  USER
  SYSTEM // Only AI agent (system) sends these messages
}

enum FeedbackType {
  ACCURACY
  CLARITY
  RESPONSE_TIME
  OVERALL_EXPERIENCE
}
```
