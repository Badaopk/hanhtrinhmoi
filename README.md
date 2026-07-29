# Hành Tinh Mơ Ước 11.0

Game web học tập, sáng tạo và thi đấu trực tuyến dành cho trẻ em. Backend dùng Node.js, Express, Socket.IO và MongoDB.

## Nâng cấp chính trong bản 4.0

- Đồng bộ giao diện hiện đại trên toàn bộ 38 trang, có dark mode, thanh điều hướng nhanh và responsive tốt hơn.
- Thiết kế lại Phòng Kiểm Tra, hỗ trợ 10/20/30 câu, tiến độ, điều hướng câu, chấm và giải thích từng đáp án.
- Chuẩn hóa ngân hàng 21.600 câu: 6 môn × 12 lớp × 3 mức độ × tối thiểu 100 câu.
- Mật khẩu Admin tự đồng bộ theo `ADMIN_PASSWORD` mỗi lần Render khởi động lại và trước khi Admin đăng nhập.
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
- `ADMIN_PASSWORD`: mật khẩu Admin từ 10 đến 72 ký tự. Mỗi lần đổi biến và redeploy, tài khoản `Admin` tự dùng mật khẩu mới.
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


## Nâng cấp 5.0

Xem [UPGRADE_V5.md](UPGRADE_V5.md) để cấu hình lộ trình học, AI chấm bài, giải đấu, Caro, Cờ Tỷ Phú, thế giới voxel và AdSense.


## Nâng cấp 6.0

- Xây 12 hồ sơ chương trình riêng cho lớp 1 đến lớp 12; tên môn hiển thị theo lớp và bài học không còn dùng chung mẫu giữa các lớp.
- Sửa cấu trúc tiểu học: Tiếng Anh lớp 1–2 là chương trình làm quen tự chọn; từ lớp 3 là bắt buộc; lớp 3–5 dùng môn Tin học và Công nghệ.
- 144 lộ trình môn, 2.980 bài học và 35.760 câu hỏi theo bài.
- Kế hoạch học hôm nay tự chọn bài tiếp theo theo mục tiêu phút/ngày và kết quả yếu.
- Thêm XP, chuỗi ngày học, huy hiệu, phân tích kỹ năng, ôn lỗi sai, chữa bài chi tiết và ghi chú đồng bộ máy chủ.
- Bài tiếp theo chỉ mở khi điểm lớn hơn 8/10.

Xem [UPGRADE_V6.md](UPGRADE_V6.md) để biết chi tiết và cách triển khai.

## Nâng cấp 7.0

- Lộ trình 7 ngày tự xây theo mục tiêu phút/ngày và số ngày học/tuần.
- Bài học chia thành chặng 4 bài, có mốc kiểm tra, độ khó, 5 bước học và nhiệm vụ luyện tập không tính điểm.
- Thêm mức `Đang luyện`, `Đã đạt`, `Thành thạo`; chỉ thưởng XP lớn ở lần vượt bài đầu tiên để hạn chế cày điểm bằng cách làm lại.
- Tạo bài ôn nhanh 5 lỗi sai và chấm lại trên máy chủ.
- Thêm quặng vàng, đá đỏ, ngọc lục bảo, kim cương và thạch anh tím.
- Mỏ Pha Lê tái sinh liên tục, không giới hạn số quặng theo ngày; quặng được lưu trực tiếp vào MongoDB.
- Sửa và tăng kiểm tra tự động cho API học tập, dữ liệu chặng học và mỏ vô tận.

Xem [UPGRADE_V7.md](UPGRADE_V7.md) để biết chi tiết.


## Nâng cấp 8.0

- Bổ sung hồ sơ giáo dục theo năm học, học kỳ và cấp học, định hướng Chương trình GDPT 2018.
- Mỗi bài có yêu cầu cần đạt, năng lực chung, năng lực đặc thù, phẩm chất và minh chứng đánh giá.
- Thêm bảng kết quả môn học, 5 phẩm chất chủ yếu, 3 năng lực chung và tự đánh giá học kỳ.
- Phân loại kết quả theo cấp học chỉ dùng làm chỉ báo hỗ trợ; không thay thế học bạ chính thức của nhà trường.
- Làm lại Trung tâm Giải đấu với màu tương phản cao, lịch cá nhân, bảng xếp hạng, cây đấu cuộn ngang và bảng vinh danh.
- Sửa bố cục Đấu trường cờ, thêm giao diện responsive/toàn màn hình cho Caro, Cờ Vua, Cờ Vây, Othello và Cờ Tỷ Phú.
- Vá lỗi Othello hiện bàn trống; nước đi online, đổi lượt, bỏ lượt và kết quả được máy chủ xác thực.
- Trình kiểm tra dự án nay biên dịch cả JavaScript nội tuyến trong 39 trang HTML.

Xem [UPGRADE_V8.md](UPGRADE_V8.md) để biết chi tiết.


## Nâng cấp 9.1

- Thêm học tập thích ứng, lịch ôn giãn cách, biểu đồ tuần, nhật ký hoạt động và thành tựu.
- Người chơi có thể tự tạo giải Cờ Vua, Caro, Cờ Vây và Othello.
- Giải cộng đồng dùng **Điểm Đấu Trường riêng không quy đổi tiền/Robux**, có quỹ ký gửi và tự hoàn khi hủy.
- Hỗ trợ giải công khai/riêng tư, mã mời, giới hạn người, tự bắt đầu, rời giải và chia thưởng 70/20/10.
- Sửa cây đấu cho số người không phải lũy thừa hai, tranh hạng ba và nhiều giải chạy đồng thời.
- Cờ Vua/Cờ Vây xác nhận kết quả từ cả hai người chơi; Caro/Othello tiếp tục xác thực trên máy chủ.
- Thêm bảo vệ API, giới hạn tốc độ, giới hạn tạo giải và tối ưu tác vụ nền.

Xem [UPGRADE_V9.md](UPGRADE_V9.md) để biết chi tiết.

## Nâng cấp 11.0

- Thêm khu sinh tồn khối vuông có thể đào cỏ, đất, đá, quặng và nền/móng đến lớp đá nền cuối cùng.
- Lưu từng khối đã đào trên máy chủ, có máu, đói, thể lực, XP, cấp, hồi sinh, công cụ và chế tạo.
- Máy chủ kiểm tra khai thác/chế tạo/ăn uống để hạn chế nhân đôi tài nguyên.
- Nâng trung tâm học tập với lựa chọn bộ sách theo lớp, lộ trình 35 tuần, bộ đếm tập trung và hỗ trợ đọc.
- Âm nhạc/Mĩ thuật/Nghệ thuật có thực hành hát hoặc vẽ bắt buộc và được tính lại điểm trên máy chủ.
- Thêm lớp sửa giao diện responsive cho toàn bộ 39 trang, đặc biệt tab, bảng và hộp thoại trên điện thoại.
- Tách mã mới thành mô-đun `assets/room`, `assets/learning`, `assets/ui` và `server/modules`.

Xem [UPGRADE_V11.md](UPGRADE_V11.md) và [docs/ARCHITECTURE_V11.md](docs/ARCHITECTURE_V11.md).
