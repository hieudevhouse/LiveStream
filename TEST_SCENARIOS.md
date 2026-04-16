# Kịch Bản Kiểm Thử (Test Scenarios) Dành Cho Hệ Thống TVAD Form API

Tài liệu này cung cấp các kịch bản kiểm thử chi tiết (Test Scenarios/Test Cases) cho hệ thống API của dự án TVAD Form. Các kịch bản được phân chia theo từng module tương ứng với các routes hiện có trong hệ thống.

---

## 1. Module Xác Thực (Auth) - `routes/auth.js`

### 1.1 Kiểm thử đăng ký tự động (đăng ký không yêu cầu nhập mật khẩu/thông tin chi tiết)
*   **Endpoint:** `POST /api/auth/register-auto`
*   **Test Case 1.1.1 (Thành công):** Gửi một UUID hoặc thông tin định danh hợp lệ. Kiểm tra phản hồi (response) trả về mã trạng thái 200/201 kèm thông tin user và access token.
*   **Test Case 1.1.2 (Lỗi trùng lặp):** Gửi lại trường thông tin đã được sử dụng ở Test Case 1.1.1. Hệ thống cần trả về lỗi báo người dùng/thông tin đã tồn tại.
*   **Test Case 1.1.3 (Dữ liệu không hợp lệ):** Gửi payload (body) rỗng hoặc thiếu trường bắt buộc. Hệ thống trả về lỗi 400 Bad Request.

### 1.2 Kiểm thử đăng ký tài khoản thủ công
*   **Endpoint:** `POST /api/auth/register`
*   **Test Case 1.2.1 (Thành công):** Điền đầy đủ thông tin bắt buộc (ví dụ: email/username, password, tên). Kiểm tra kết quả trả về mã thành công. Cơ sở dữ liệu ghi nhận user mới, mật khẩu đã được mã hoá (hashed).
*   **Test Case 1.2.2 (Thiếu dữ liệu):** Không nhập mật khẩu hoặc username. Hệ thống báo lỗi Validation (400).
*   **Test Case 1.2.3 (Trùng tài khoản):** Đăng ký email/username đã tồn tại. Hệ thống thông báo lỗi 409 Conflict hoặc lỗi validation.
*   **Test Case 1.2.4 (Password quá ngắn/yếu):** Nhập mật khẩu không đạt yêu cầu bảo mật (nếu có validation).

### 1.3 Kiểm thử đăng nhập
*   **Endpoint:** `POST /api/auth/login`
*   **Test Case 1.3.1 (Thành công):** Nhập đúng tên đăng nhập (email/username) và mật khẩu ở Test Case 1.2.1. Nhận lại chuỗi JWT/Token và thông tin phiên đăng nhập với mã 200 OK.
*   **Test Case 1.3.2 (Sai mật khẩu):** Cung cấp đúng tên đăng nhập nhưng sai mật khẩu. Hệ thống trả về 401 Unauthorized.
*   **Test Case 1.3.3 (Tài khoản không tồn tại):** Cung cấp tên đăng nhập chưa từng được đăng ký. API trả về lỗi 401 hoặc 404.
*   **Test Case 1.3.4 (Không cung cấp dữ liệu):** Truyền body trống, nhận lỗi 400 Bad Request.

---

## 2. Module Đại Diện Doanh Nghiệp (Business Owners) - `routes/businessOwners.js`

### 2.1 Kiểm tra Mã số Thuế (Tax Code)
*   **Endpoint:** `POST /api/business-owners/check-tax`
*   **Test Case 2.1.1 (Mã số thuế chưa tồn tại):** Nhập mã số thuế hoàn toàn mới (VD: "0182746193"). Hệ thống trả về trạng thái hợp lệ, có thể tiếp tục.
*   **Test Case 2.1.2 (Mã số thuế đã tồn tại):** Nhập một mã số thuế đã có trong CSDL (của doanh nghiệp khác). API báo lỗi trùng mã số thuế.
*   **Test Case 2.1.3 (Sai định dạng):** Nhập mã số thuế chứa ký tự đặc biệt hoặc quá ngắn/quá dài. Trả về lỗi Validation định dạng.

### 2.2 Kiểm tra Email Doanh Nghiệp
*   **Endpoint:** `POST /api/business-owners/check-email`
*   **Test Case 2.2.1 (Email hợp lệ và chưa tồn tại):** Nhập `newcompany@abc.com`. Hệ thống cho phép đi tiếp.
*   **Test Case 2.2.2 (Email bị trùng lặp):** Nhập email của một Business Owner đã lưu từ trước. Báo lỗi email đã sử dụng.
*   **Test Case 2.2.3 (Email sai định dạng):** Nhập `"invalid_email"`. Báo lỗi 400.

### 2.3 Thêm mới / Cập nhật thông tin Doanh Nghiệp (Upsert)
*   **Endpoint:** `POST /api/business-owners/upsert`
*   **Test Case 2.3.1 (Tạo mới thành công):** Trường hợp chưa có bản ghi, gửi payload đẩy đủ các trường bắt buộc (`userId`, `taxCode`, `email`, `companyName`,...). Bản ghi mới được tạo ra.
*   **Test Case 2.3.2 (Cập nhật thành công):** Doanh nghiệp đã tồn tại (dựa vào _id hoặc userId). Thay đổi trường `companyName` và tiến hành gửi lên. Hệ thống cập nhật thành công bản ghi thay vì sinh mới.
*   **Test Case 2.3.3 (Thiếu trường bắt buộc):** Gửi data thiếu `userId` hoặc `taxCode`. Nhận lỗi thiếu Validation.
*   **Test Case 2.3.4 (Cập nhật với Mã số thuế của công ty khác):** Nếu update sửa `taxCode` thành của công ty khác đang bị trùng. Hệ thống phải quăng lỗi DB/Conflict (dựa vào chỉ mục unique).

### 2.4 Lấy thông tin Doanh Nghiệp theo Người Dùng
*   **Endpoint:** `GET /api/business-owners/:userId`
*   **Test Case 2.4.1 (Có thông tin):** Gửi ID một user đã có thông tin doanh nghiệp. Hệ thống trả về object BusinessOwner.
*   **Test Case 2.4.2 (Không có thông tin):** Gửi ID user chưa tạo doạnh nghiệp hoặc sai định dạng. Hệ thống trả về `null` hoặc lỗi 404 kèm thông báo tương ứng.

---

## 3. Module Sản Phẩm & Dịch Vụ (Products & Services) - `routes/productsServices.js`
*Lưu ý: Route này tích hợp gửi file ảnh, PDF giới hạn (10MB)*

### 3.1 Tạo hồ sơ sản phẩm/dịch vụ mới
*   **Endpoint:** `POST /api/products-services/`
*   **Test Case 3.1.1 (Tạo thành công - Payload Không có Files):** Gửi FormData chứa thông tin về tên sản phẩm, danh mục, `businessOwnerId`... Không đính kèm thư mục/file. API phải trả về mã tạo mới 201 Created.
*   **Test Case 3.1.2 (Tạo thành công - Đầy đủ Files):** Truyền đầy đủ FormData gồm text và các file theo các field: `descriptionImages` (ảnh.jpg, <= 10 files), `descriptionDocuments` (pdf, <= 10 files), `intellectualPropertyCertificate` (1 file), `operatingLicense` (1 file), `certificationFiles` (<= 10 files). Trả về 201, kèm URL hoặc đường dẫn file đã upload chuẩn.
*   **Test Case 3.1.3 (Sai đuôi File tải lên):** Đính kèm file có đuôi `.exe` tải lên qua field `descriptionDocuments`. Multer chặn lại và quăng lỗi (`"Only images (JPG, PNG) and PDF files are allowed"`).
*   **Test Case 3.1.4 (File cấu hình lớn hơn giới hạn):** Tải lên một file PDF có kích thước lớn hơn 10MB. API bắn lỗi do giới hạn cấu hình file size (Limit error file size: 10 * 1024 * 1024 bytes).
*   **Test Case 3.1.5 (Vượt quá số lượng file):** Tải lên 11 ảnh trong mục `descriptionImages`. Gây ra lỗi vượt tải lượng maxCount (10) cho phép của Multer.

### 3.2 Lấy danh sách Sản phẩm theo Doanh Nghiệp
*   **Endpoint:** `GET /api/products-services/business/:businessOwnerId`
*   **Test Case 3.2.1 (Có dữ liệu):** Nhập `businessOwnerId` hợp lệ. Lấy ra một mảng chứa các sản phẩm của Owner đó.
*   **Test Case 3.2.2 (Không có dữ liệu):** Nhập một id rỗng/sai. Nhận danh sách rỗng `[]` hoặc 404 (tuỳ thiết kế chuẩn).

### 3.3 Lấy 1 Sản phẩm chi tiết
*   **Endpoint:** `GET /api/products-services/:id`
*   **Test Case 3.3.1 (Hợp lệ):** Nhập đúng string ObjectID MongoDB (`id` của một sản phẩm). Trả về object chứa toàn bộ chi tiết và đường dẫn tài liệu đính kèm.
*   **Test Case 3.3.2 (ID không tồn tại):** Gửi chuỗi không phản ánh document hợp lệ. Hệ thống trả ra lỗi 404 Product Not Found hoặc 400 Bad ObjectID.

### 3.4 Cập nhật Sản phẩm & Các tài liệu đính kèm
*   **Endpoint:** `PUT /api/products-services/:id`
*   **Test Case 3.4.1 (Cập nhật text field):** Sửa đổi tên, giá hiển thị. Không gửi file mới. Thông tin cập nhật thành công, thông tin URL file cũ vẫn giữ nguyên.
*   **Test Case 3.4.2 (Gửi đè file mới):** Gửi lại 1 ảnh vào thẻ `descriptionImages`. Cập nhật Database thay thế đường link trong Array.
*   **Test Case 3.4.3 (Cập nhật bản ghi không tồn tại):** Thay `id` thành objectID mạo danh. API nhận file tải lên nhưng có thể bị xóa ngay đi do lỗi document không tìm thấy trong DB, hoặc controller từ chối thực hiện update.

---

## 4. Module Nhu Cầu Hợp Tác (Collaboration Needs) - `routes/collaborationNeeds.js`

### 4.1 Thêm / Cập nhật Nhu cầu (Create/Update)
*   **Endpoint:** `POST /api/collaboration-needs/`
*   **Test Case 4.1.1 (Tạo mới Nhu cầu):** Truyền tham số thiếu ID (hoặc id = null/undefine). Có thông tin `businessOwnerId` và các mảng nhu cầu kinh doanh, sản xuất, hợp tác marketing. Ghi nhận Insert mới vào DB.
*   **Test Case 4.1.2 (Cập nhật Nhu cầu đã tồn tại):** Gửi kèm id trong body ứng với Object Need đã có. Phương thức sẽ sử dụng logic Update đè các trường thông tin.
*   **Test Case 4.1.3 (Ràng buộc dữ liệu thiếu):** Truyền nhu cầu rỗng nhưng bỏ quên trường reference đến `businessOwnerId`. Gây ra lỗi DB/Validation.

### 4.2 Lấy nhu cầu chi tiết qua ID
*   **Endpoint:** `GET /api/collaboration-needs/:id`
*   **Test Case 4.2.1:** Truyền valid ID. DB trả về các thông tin được format.
*   **Test Case 4.2.2:** Truyền invalid ID hoặc không tồn tại (Lỗi 404, 400).

### 4.3 Xem danh sách nhu cầu theo Đại Diện Doanh Nghiệp
*   **Endpoint:** `GET /api/collaboration-needs/business-owner/:businessOwnerId`
*   **Test Case 4.3.1:** Chạy query lấy danh sách khi BusinessOwner có tồn tại hợp lệ. Kiểm tra phản hồi array.
*   **Test Case 4.3.2:** Nếu ID sai hoặc doanh nghiệp không có nhu cầu hợp tác nào. Array rỗng.

---

## 5. Middleware Auth & Role Authorization (Các bước dùng chung cần chú ý)
Trong trường hợp các route như `/upsert` hay `productServices` bị bọc bằng Middleware xác thực `auth.js` (Như Bearer Token JWT), bạn cần thêm Test Case chạy song song:
*   **Test Token Hết Hạn:** Gọi api sửa chữa (PUT/POST) với Token quá hạn -> kì vọng báo lỗi `Token Expired (401)`.
*   **Test Không Gửi Token:** Request bị chặn và báo lỗi truy cập Unauthorized.
*   **Test Chữ ký sai (Invalid Token):** Báo lỗi Token không hợp lệ.
*   Nếu dùng Cors, check cross domain header (chỉ gọi bằng Postman / ThunderClient vs Browser Fetch).

---
**Tổng quan về môi trường Postman Collection (Mẫu để QA/Tester dùng)**: Môi trường (Environment) nên cung cấp các biến `base_url`, `token`, `registered_user_id`, `business_owner_id`, `product_id` sinh ra từ Collection Variable để liên kết trực tiếp các Test Case khi chạy (Run Flow).
