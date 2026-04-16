
# Dreamax – TVAd Agency Portal (Backend)

Backend server cho Dreamax – TVAd Customer Portal, xây dựng bằng Node.js/Express, cho phép thương hiệu đăng ký **product/service** phục vụ quảng cáo và PR. Gồm **Next.js frontend** và **Express backend**.


## 1. Công nghệ chính

### Frontend
- Next.js 14 (App Router), React 18 + TypeScript  
- Tailwind CSS, Lucide React  
- React Hook Form, React Hot Toast  

### Backend
- Node.js + Express  
- MongoDB + Mongoose  
- Multer, JWT, bcryptjs  


## 2. Cấu trúc dự án

```

marketing-agency-portal/
├── client/       # Next.js frontend
├── server/       # Express backend
└── package.json

````


## 3. Data Models

### User
- email, password, role, verification status

### BusinessOwner
- ownershipType: individual / business / other  
- thông tin doanh nghiệp/cá nhân  
- legal representative  
- verification documents  

### ProductService
- thông tin cơ bản + media  
- social channels  
- GTIN, IP, geographical indications  
- licenses, certifications, awards  

### CollaborationNeed
- loại nhu cầu hợp tác

## 4. Vector Search APIs

Hệ thống sử dụng vector embeddings để tìm kiếm semantic (nghĩa) thay vì text matching chính xác.

### Endpoints chính:

#### `GET /vector/search?q={query}`
- **Mô tả**: Tìm kiếm vector chính với fallback
- **Logic**: 
  1. Tìm trực tiếp trong lakehouse database (datalake)
  2. Nếu không có kết quả, fallback sang vectorDocument
  3. Cuối cùng fallback sang text search
- **Response**: Kết quả với similarity score

#### `GET /vector/search-lakehouse?q={query}`
- **Mô tả**: Tìm kiếm trực tiếp từ lakehouse (không fallback)
- **Logic**: Scan các collection `Ingest_Bronze_*` (ProductService, CollaborationNeed, BusinessOwner) và tính similarity real-time
- **Ưu điểm**: Luôn có data mới nhất từ datalake, search trên tất cả loại documents

#### `GET /vector/compare?q={query}`
- **Mô tả**: So sánh similarity với tất cả documents
- **Response**: List tất cả documents với similarity scores

#### `GET /vector/status`
- **Mô tả**: Kiểm tra trạng thái hệ thống
- **Response**: Thống kê vector docs, products, lakehouse connection

#### `GET /vector/lakehouse-collections`
- **Mô tả**: Liệt kê các collections trong lakehouse
- **Response**: Chi tiết collections ProductService và sample data

### Cách hoạt động:

1. **Query Processing**: Tạo embedding vector cho text query
2. **Data Retrieval**: Lấy data từ lakehouse collections (5 collection gần nhất của tất cả types)
3. **Document Processing**: Xử lý từng loại document (ProductService, CollaborationNeed, BusinessOwner)
4. **Embedding Generation**: Tạo embedding cho từng document
5. **Similarity Calculation**: Tính cosine similarity
6. **Deduplication**: Loại bỏ records trùng lặp theo refId, giữ lại phiên bản mới nhất
7. **Ranking**: Filter (threshold > 0.3) → Sort by similarity → Return Top 10
8. **Response**: Trả về kết quả từ tất cả các loại documents

### Tính năng chống trùng lặp (Deduplication):

- **Vấn đề**: Lakehouse có thể chứa cùng 1 record từ nhiều ingestion khác nhau
- **Giải pháp**: Group theo `refId`, chỉ giữ lại record có `ingestedAt` mới nhất
- **Kết quả**: Mỗi entity chỉ xuất hiện 1 lần trong kết quả search

### Các loại documents được search:

- **ProductService**: Sản phẩm/dịch vụ với name, description, keywords
- **CollaborationNeed**: Nhu cầu hợp tác với business owner, product service, needs
- **BusinessOwner**: Chủ doanh nghiệp với thông tin kinh doanh/cá nhân

### Performance Notes:
- Batch processing (5 docs/batch) để tránh overload embedding service
- Scan 5 collections gần nhất (tất cả types) để tối ưu tốc độ
- Threshold similarity = 0.3 (30%)
- **Deduplication**: Loại bỏ records trùng lặp, chỉ hiển thị phiên bản mới nhất
- Support search trên 3 loại documents: ProductService, CollaborationNeed, BusinessOwner  
- mô tả chi tiết  
- trạng thái  


## 4. Getting Started

### Docker (khuyến nghị)
```bash
make up        # production
make dev       # development
````

Truy cập:

- Local (development):
	- Frontend: `http://localhost:3000`
	- Backend: `http://localhost:5000`

- Production (example):
	- Frontend: `https://form-api.tvad-sme.com.vn`
	- Backend API: `https://form-api.tvad-sme.com.vn/api`

### Local Development

```bash
npm install
cd client && npm install
cd ../server && npm install
mongod
npm run dev
```


## 5. Environment Variables

### Backend

```
MONGODB_URI=mongodb://localhost:27017/marketing-agency-portal
JWT_SECRET=your_secret
PORT=5000
```

### Frontend

```
NEXT_PUBLIC_API_URL=https://form-api.tvad-sme.com.vn
```


## 6. API Endpoints (Tóm tắt)

### Auth

* POST `/api/auth/register`
* POST `/api/auth/login`

### BusinessOwner

* GET `/api/business-owners/:userId`
* POST `/api/business-owners`

### ProductService

* GET `/api/products-services/business-owner/:businessOwnerId`
* GET `/api/products-services/:id`
* POST `/api/products-services`
* PUT `/api/products-services/:id`

### CollaborationNeed

* GET `/api/collaboration-needs/business-owner/:businessOwnerId`
* GET `/api/collaboration-needs/:id`
* POST `/api/collaboration-needs`
* PUT `/api/collaboration-needs/:id`


## 7. File Upload

Hỗ trợ:

* PDF documents
* JPG/PNG images

Lưu tại: `server/uploads/` với tên file unique.


## 8. Development Notes

* Components, Forms: React reusable
* Models: Mongoose schemas
* Routes: REST API
* UI: Tailwind, responsive, dark/light mode

```markdown
```
=======
# tvad-form-api