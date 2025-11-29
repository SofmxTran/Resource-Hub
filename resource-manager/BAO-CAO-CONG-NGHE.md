# BÁO CÁO CÔNG NGHỆ VÀ PHƯƠNG THỨC HOẠT ĐỘNG
## WebHub - Resource Management System

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1. Mô tả
WebHub là một hệ thống quản lý tài nguyên (Resource Management System) cho phép người dùng chia sẻ và quản lý các tài nguyên học tập như file, link, và bài viết. Hệ thống hỗ trợ đa người dùng với phân quyền admin, quản lý domain, và hệ thống trust score.

### 1.2. Kiến trúc tổng quan
- **Mô hình**: MVC (Model-View-Controller)
- **Kiến trúc**: Server-side rendering với Express.js
- **Database**: MongoDB (NoSQL)
- **File Storage**: Cloudinary (Cloud-based)
- **Authentication**: Session-based với bcrypt

---

## 2. CÔNG NGHỆ SỬ DỤNG

### 2.1. Backend Technologies

#### **Node.js**
- **Phiên bản**: LTS (Long Term Support)
- **Vai trò**: Runtime environment cho JavaScript server-side
- **Lý do chọn**: 
  - Non-blocking I/O, hiệu năng cao
  - Ecosystem phong phú (npm)
  - Dễ dàng tích hợp với MongoDB

#### **Express.js v5.1.0**
- **Vai trò**: Web framework cho Node.js
- **Tính năng sử dụng**:
  - Routing: Định tuyến URL đến các controller
  - Middleware: Xử lý request/response
  - Template engine: Render EJS views
  - Static files: Phục vụ CSS, JS, images

#### **MongoDB + Mongoose v8.0.0**
- **Database**: MongoDB (NoSQL Document Database)
- **ODM**: Mongoose (Object Data Modeling)
- **Lý do chọn**:
  - Schema linh hoạt, dễ mở rộng
  - Hỗ trợ relationships (populate)
  - Indexing cho hiệu năng
  - Cloud deployment dễ dàng (MongoDB Atlas)

**Cấu trúc Collections**:
- `users`: Thông tin người dùng
- `resources`: Tài nguyên (file, link, post)
- `domains`: Danh mục/chủ đề
- `comments`: Bình luận
- `resourcevotes`: Đánh giá trust score

#### **Express-Session v1.18.2**
- **Vai trò**: Quản lý session cho authentication
- **Cơ chế**: 
  - Lưu session ID trong cookie
  - Session data lưu trong memory (có thể dùng Redis cho production)
  - Secure session với secret key

#### **Bcrypt v6.0.0**
- **Vai trò**: Hash mật khẩu
- **Cơ chế**: 
  - Salt rounds: 10
  - One-way hashing, không thể reverse
  - So sánh password với hash khi login

#### **Multer v2.0.2**
- **Vai trò**: Xử lý file upload
- **Cấu hình**: Memory storage (buffer)
- **Lý do**: Upload trực tiếp lên Cloudinary, không lưu local

#### **Cloudinary v1.41.0**
- **Vai trò**: Cloud storage cho files và images
- **Tính năng**:
  - Upload files/images
  - CDN delivery
  - Image optimization
  - Automatic format conversion

### 2.2. Frontend Technologies

#### **EJS (Embedded JavaScript) v3.1.10**
- **Vai trò**: Template engine
- **Tính năng**:
  - Server-side rendering
  - Dynamic content injection
  - Partial templates (navbar, footer, head)
  - Conditional rendering

#### **Bootstrap 5.3.3**
- **Vai trò**: CSS framework
- **Tính năng**: 
  - Responsive grid system
  - Pre-built components (cards, buttons, forms)
  - Utility classes

#### **Font Awesome 6.4.0**
- **Vai trò**: Icon library
- **Sử dụng**: Icons cho UI elements

#### **AOS (Animate On Scroll)**
- **Vai trò**: Animation library
- **Tính năng**: Scroll-triggered animations

### 2.3. Development Tools

#### **Nodemon v3.1.11**
- **Vai trò**: Auto-restart server khi code thay đổi
- **Sử dụng**: Development mode

#### **dotenv v17.2.3**
- **Vai trò**: Quản lý environment variables
- **File**: `.env`
- **Variables**:
  - `MONGODB_URI`: Connection string MongoDB
  - `CLOUDINARY_URL`: Cloudinary credentials
  - `SESSION_SECRET`: Secret key cho session
  - `PORT`: Server port

---

## 3. KIẾN TRÚC VÀ CẤU TRÚC DỰ ÁN

### 3.1. Cấu trúc thư mục

```
resource-manager/
├── config/           # Cấu hình (Cloudinary)
├── controllers/      # Business logic (MVC - Controller)
├── db/              # Database connection & seeding
├── middleware/       # Custom middleware (auth)
├── models/          # Database models & schemas (MVC - Model)
├── routes/          # Route definitions
├── public/          # Static files (CSS, JS, images)
├── utils/           # Utility functions
├── views/           # EJS templates (MVC - View)
└── server.js        # Entry point
```

### 3.2. Mô hình MVC

#### **Model** (`models/`)
- **Schema Definition**: Mongoose schemas (`User.js`, `Resource.js`, `Domain.js`)
- **Data Access Layer**: Model functions (`userModel.js`, `resourceModel.js`)
- **Chức năng**:
  - CRUD operations
  - Data validation
  - Relationships (populate)
  - Data transformation (snake_case ↔ camelCase)

#### **View** (`views/`)
- **Template Files**: `.ejs` files
- **Partials**: Reusable components (`navbar.ejs`, `footer.ejs`, `head.ejs`)
- **Chức năng**:
  - Render HTML từ server
  - Dynamic content với EJS syntax
  - Form handling
  - Error/success messages

#### **Controller** (`controllers/`)
- **Request Handling**: Process HTTP requests
- **Business Logic**: Validate, transform data
- **Response**: Render views hoặc redirect
- **Ví dụ**: `resourceController.js`, `authController.js`

### 3.3. Routing System

**Cấu trúc Routes**:
```javascript
/                    → pageController.showHome
/dashboard           → pageController.showDashboard (protected)
/login               → authController.renderLogin
/register            → authController.register
/resources           → resourceController.listResources
/resources/new       → resourceController.renderNewResource
/resources/:id       → resourceController.showResource
/admin               → adminController (admin only)
/settings            → settingsController
```

**Middleware Chain**:
1. `express.urlencoded()` - Parse form data
2. `express.static()` - Serve static files
3. `express-session()` - Session management
4. Custom middleware - Refresh user session
5. Route handlers - Process request
6. Error handler - 404 page

---

## 4. PHƯƠNG THỨC HOẠT ĐỘNG

### 4.1. Luồng xử lý Request

```
1. Client Request (HTTP)
   ↓
2. Express Server nhận request
   ↓
3. Middleware Chain xử lý:
   - Parse body (form data)
   - Check session
   - Refresh user info
   ↓
4. Route Handler xác định route
   ↓
5. Controller xử lý business logic:
   - Validate input
   - Query database (Model)
   - Process data
   ↓
6. Render View (EJS) với data
   ↓
7. Response HTML về client
```

### 4.2. Authentication Flow

#### **Đăng ký (Register)**
```
1. User submit form (email, password, username)
   ↓
2. Controller validate input
   ↓
3. Check email/username exists
   ↓
4. Hash password với bcrypt (10 rounds)
   ↓
5. Create user trong MongoDB
   ↓
6. Redirect to login
```

#### **Đăng nhập (Login)**
```
1. User submit credentials (email, password)
   ↓
2. Find user by email trong database
   ↓
3. Compare password với hash (bcrypt.compare)
   ↓
4. Nếu match:
   - Create session
   - Store user info trong req.session.user
   - Set cookie với session ID
   ↓
5. Redirect to dashboard
```

#### **Session Management**
- **Session Storage**: Memory (development) hoặc Redis (production)
- **Session ID**: Lưu trong cookie (httpOnly, secure)
- **Session Refresh**: Mỗi request, refresh user info từ DB
- **Logout**: Destroy session và clear cookie

### 4.3. File Upload Flow

#### **Upload Process**
```
1. User chọn file trong form (multipart/form-data)
   ↓
2. Multer middleware nhận file:
   - Memory storage (buffer)
   - Validate file type/size
   ↓
3. Controller nhận file buffer
   ↓
4. Upload to Cloudinary:
   - Stream buffer to Cloudinary API
   - Get secure URL
   ↓
5. Save URL vào MongoDB (không lưu file local)
   ↓
6. Response với Cloudinary URL
```

#### **Cloudinary Integration**
- **Upload**: Stream buffer từ Multer
- **Storage**: Cloudinary cloud storage
- **URL Format**: `https://res.cloudinary.com/...`
- **Delete**: Extract public_id từ URL và delete

### 4.4. Database Operations

#### **Mongoose Schema**
```javascript
// Example: Resource Schema
{
  userId: ObjectId (ref: User),
  domainId: ObjectId (ref: Domain),
  title: String,
  type: Enum ['FILE', 'LINK', 'POST'],
  filePath: String (Cloudinary URL),
  url: String,
  content: String (for POST type),
  isPublic: Boolean,
  status: Enum ['PENDING', 'APPROVED', 'REJECTED'],
  timestamps: true (auto createdAt, updatedAt)
}
```

#### **Query Patterns**
- **Find**: `Resource.find({ userId, status: 'APPROVED' })`
- **Populate**: `.populate('userId', 'username email')`
- **Aggregation**: Trust score calculation
- **Indexes**: Performance optimization
  - `userId: 1`
  - `domainId: 1`
  - `status: 1, isPublic: 1`
  - `createdAt: -1`

### 4.5. Trust Score System

**Cơ chế tính điểm**:
```
Trust Score = Số lượng votes / Tổng số resources của user
```

**Implementation**:
- Collection `resourcevotes`: Lưu user_id và resource_id
- Aggregation pipeline: Count votes per resource
- Cache trong memory hoặc tính real-time

---

## 5. TÍNH NĂNG CHÍNH

### 5.1. User Management
- Đăng ký/Đăng nhập với bcrypt
- Profile management (avatar, bio, website)
- Public profile pages
- Leaderboard (top users by trust score)

### 5.2. Resource Management
- **3 loại resources**:
  - **FILE**: Upload file lên Cloudinary
  - **LINK**: Lưu URL
  - **POST**: Bài viết với HTML content
- CRUD operations (Create, Read, Update, Delete)
- Public/Private visibility
- Status workflow: PENDING → APPROVED/REJECTED
- Trust voting system

### 5.3. Domain Management
- Tạo/quản lý domains (categories)
- Assign resources to domains
- Filter by domain

### 5.4. Admin Features
- Approve/Reject public resources
- View all resources
- User management (future)

### 5.5. Search & Filter
- Search by title/description
- Filter by type (FILE/LINK/POST)
- Filter by domain
- Filter by purpose

---

## 6. BẢO MẬT

### 6.1. Authentication Security
- **Password Hashing**: bcrypt với salt rounds
- **Session Security**: 
  - Secret key từ environment variable
  - HttpOnly cookies
  - Secure flag (HTTPS)
- **Middleware Protection**: `ensureAuthenticated`, `ensureAdmin`

### 6.2. Input Validation
- Server-side validation
- Sanitize user input
- SQL Injection prevention (MongoDB NoSQL injection protection)
- XSS prevention (EJS auto-escape)

### 6.3. File Upload Security
- File type validation
- Size limits
- Cloudinary secure URLs
- No local file storage (tránh path traversal)

### 6.4. Authorization
- Role-based access (User vs Admin)
- Resource ownership check
- Public/Private visibility control

---

## 7. DEPLOYMENT

### 7.1. Environment Setup
- **Development**: Local MongoDB, local file storage
- **Production**: MongoDB Atlas, Cloudinary

### 7.2. Environment Variables
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/webhub
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
SESSION_SECRET=your-secret-key
PORT=3000
```

### 7.3. Deployment Platforms
- **Render.com**: Free tier cho Node.js apps
- **MongoDB Atlas**: Free tier cho database
- **Cloudinary**: Free tier cho file storage

### 7.4. Build & Start
```bash
npm install          # Install dependencies
npm run seed        # Seed database (optional)
npm start           # Start server
```

---

## 8. TỔNG KẾT

### 8.1. Công nghệ chính
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Template**: EJS
- **Storage**: Cloudinary
- **Security**: bcrypt + express-session

### 8.2. Kiến trúc
- **Pattern**: MVC (Model-View-Controller)
- **Rendering**: Server-side rendering (SSR)
- **API Style**: RESTful routes

### 8.3. Điểm mạnh
- ✅ Dễ mở rộng với MongoDB
- ✅ Cloud storage (không lo filesystem)
- ✅ Session-based auth đơn giản
- ✅ SSR tốt cho SEO
- ✅ Code structure rõ ràng (MVC)

### 8.4. Hạn chế & Cải thiện
- ⚠️ Session lưu memory (nên dùng Redis)
- ⚠️ Chưa có API REST (chỉ SSR)
- ⚠️ Chưa có real-time features (WebSocket)
- ⚠️ Chưa có caching layer

---

## 9. TÀI LIỆU THAM KHẢO

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [EJS Documentation](https://ejs.co/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Tác giả**: Trần Hoàng Sơn (SofmxTran)  
**Email**: sonth.24ce@vku.udn.vn  
**GitHub**: https://github.com/SofmxTran  
**Năm**: 2025

