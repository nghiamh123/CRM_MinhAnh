# Camera Equipment Rental CRM

Hệ thống quản lý khách hàng và thiết bị thuê máy ảnh chuyên nghiệp.

## Công nghệ sử dụng
- **Backend**: Node.js, Express, JSON database
- **Frontend**: React (Vite), Vanilla CSS, Lucide Icons

## Cấu trúc thư mục
- `/backend`: API server và dữ liệu JSON
- `/frontend`: Giao diện người dùng React
- `package.json`: Script quản lý chạy cả 2 project

## Hướng dẫn cài đặt và chạy

1. **Cài đặt dependencies**:
   Mở terminal tại thư mục gốc của project và chạy:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

2. **Chạy ứng dụng**:
   Tại thư mục gốc, chạy lệnh:
   ```bash
   npm start
   ```
   Ứng dụng sẽ khởi động:
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:5000

## Các chức năng chính
- **Dashboard**: Thống kê nhanh tình hình kinh doanh.
- **Quản lý khách hàng**: Thêm, sửa, xóa thông tin khách hàng.
- **Quản lý thiết bị**: Theo dõi tình trạng máy (Sẵn sàng, Đang thuê, Bảo trì).
- **Quản lý đơn thuê**:
  - Tạo đơn thuê mới (tự động chuyển trạng thái thiết bị sang "Đang thuê").
  - Trả thiết bị (tự động chuyển trạng thái thiết bị về "Sẵn sàng").
  - Tự động phát hiện đơn hàng trễ hạn.

---
Phát triển bởi Antigravity.
