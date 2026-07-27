# Hành Tinh Mơ Ước 3.0

Game web học tập, sáng tạo và thi đấu trực tuyến dành cho trẻ em. Backend dùng Node.js, Express, Socket.IO và MongoDB.

## Nâng cấp chính trong bản 3.0

- Trang chủ mới, responsive cho máy tính và điện thoại, có tìm kiếm và lọc hoạt động.
- Hiển thị điểm, cấp trung bình, nhiệm vụ, chuỗi đăng nhập, giải đấu và bảng vàng.
- Sửa các API bị thiếu của Admin, phụ huynh và theo dõi thời gian chơi.
- Vá lỗ hổng tự đăng ký quyền Admin, bảo vệ toàn bộ API quản trị và chống spam đăng nhập.
- Chống gian lận gửi cấp độ lớn từ trình duyệt để nhận điểm hoặc mở khóa cấp.
- Sửa Đấu Toán PvP: mỗi người chỉ trả lời một lần mỗi vòng, chờ đủ hai người rồi mới sang câu mới, hoàn điểm khi trận bị hủy.
- Sửa lịch giải đấu vòng bảng, nhắc giờ và tự xử lý trận vắng mặt.
- Thông báo Socket.IO an toàn hơn, không chèn trực tiếp nội dung server bằng `innerHTML`.
- Bổ sung `/api/health`, cấu hình Render, kiểm tra tự động và Node.js 20.
- Nâng cấp Trang Trí Phòng thành thế giới 3D có bản đồ lớn/nhỏ, dịch chuyển địa danh, cầu qua sông, chủ đề mùa, ngày đêm, thời tiết và công trình thế giới.
- Thêm hệ thống gửi yêu cầu đổi điểm sang Robux có giới hạn, giữ điểm chống đổi trùng, lịch sử trạng thái và trang Admin duyệt/hoàn điểm/đánh dấu đã trả.

## Chạy trên máy

1. Sao chép `.env.example` thành `.env`.
2. Điền `MONGO_URI`, `SESSION_SECRET` và `ADMIN_PASSWORD`.
3. Cài và chạy:

```bash
npm ci
npm test
npm start
```

Mở `http://localhost:3000`.

## Biến môi trường bắt buộc trên Render

- `MONGO_URI` hoặc `MONGODB_URI`: chuỗi kết nối MongoDB Atlas.
- `SESSION_SECRET`: chuỗi ngẫu nhiên tối thiểu 32 ký tự.
- `ADMIN_PASSWORD`: mật khẩu Admin tối thiểu 10 ký tự.
- `NODE_ENV=production`.

### Biến môi trường đổi thưởng Robux

- `ROBUX_REWARDS_ENABLED=false` (đổi thành `true` sau khi đã chuẩn bị quy trình chi trả chính thức): bật/tắt gửi yêu cầu.
- `ROBUX_POINTS_PER_ROBUX=100`: số điểm cần cho 1 Robux.
- `ROBUX_MIN_REDEEM=10`: số Robux tối thiểu mỗi yêu cầu.
- `ROBUX_MAX_DAILY=100`: giới hạn Robux mỗi người mỗi ngày.
- `ROBUX_MAX_OPEN_REQUESTS=2`: số yêu cầu đang chờ tối đa.

Hệ thống không thu thập mật khẩu/cookie Roblox và không chuyển Robux tự động. Admin xử lý bằng phương thức chính thức của Roblox rồi đánh dấu trạng thái trong Admin Panel.

Khi dùng Blueprint, Render đọc trực tiếp file `render.yaml`.

## Kiểm tra dự án

```bash
npm test
```

Lệnh này kiểm tra cú pháp JavaScript, tệp HTML tham chiếu bị thiếu và API frontend gọi nhưng backend chưa khai báo.
