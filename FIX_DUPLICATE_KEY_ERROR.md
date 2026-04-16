# 🔧 Hướng dẫn sửa lỗi Duplicate Key Error

## Lỗi:
```
index: businessOwnerId_1 dup key: { businessOwnerId: ObjectId('69df60c4926b6460583a6dc2') }
code: 11000
```

## 🎯 Nguyên nhân:
- Có một **unique index** trùng lặp trên trường `businessOwnerId` 
- Khi tạo **nhiều sản phẩm cho cùng 1 nhãn hàng**, MongoDB reject vì index này
- Đây là lỗi từ một phiên bản schema cũ

## ✅ Cách sửa:

### Cách 1: Chạy Script Tự Động (Khuyến nghị)
```bash
node scripts/fix-duplicate-index.js
```

Script sẽ:
- ✓ Tìm unique index không cần thiết trên `businessOwnerId`
- ✓ Xóa chúng khỏi database
- ✓ Giữ các index hợp lệ

### Cách 2: Xóa Index Thủ Công (MongoDB Shell)

**Kiểm tra index hiện tại:**
```javascript
// Trong MongoDB shell
db.productservices.getIndexes()
db.collaborationneeds.getIndexes()
```

**Xóa unique index nếu tìm thấy:**
```javascript
// Nếu thấy index tên "businessOwnerId_1"
db.productservices.dropIndex("businessOwnerId_1")
db.collaborationneeds.dropIndex("businessOwnerId_1")
```

### Cách 3: Xóa và Tạo Lại Database (Nếu test)
```javascript
// ⚠️ Chỉ dùng for development - sẽ mất tất cả dữ liệu!
db.dropDatabase()
```

## 📝 Schema hiện tại (đúng):

**ProductService:**
```javascript
businessOwnerId: {
  type: mongoose.Schema.Types.ObjectId,
  required: true,
  index: true  // ✓ Non-unique index (cho phép nhiều docs)
}
```

**CollaborationNeed:**
```javascript
// ✓ Composite unique index (chỉ duy nhất theo cặp)
collaborationNeedSchema.index(
  { businessOwnerId: 1, productServiceId: 1 },
  { unique: true }
);
```

## 🧪 Kiểm tra sau khi sửa:

```bash
# Test đăng ký với 2 sản phẩm cho 1 businessOwner
curl -X POST http://localhost:3000/api/register/submit \
  -H "Content-Type: application/json" \
  -d '{
    "businessInfo": {...},
    "productServices": [
      { "productName": "Sản phẩm 1", ... },
      { "productName": "Sản phẩm 2", ... }
    ]
  }'
```

## 📞 Cần giúp?
Nếu sau khi chạy script lỗi vẫn xuất hiện:
1. Kiểm tra `MONGODB_URI` trong `.env`
2. Chạy lại script
3. Restart MongoDB service

---

**Status:** ✓ Lỗi đã được xác định và có cách sửa
