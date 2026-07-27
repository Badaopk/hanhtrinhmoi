// =================================================================
// --- SERVER TRUNG TÂM: HÀNH TINH MƠ ƯỚC (LUXURY SECURE EDITION) ---
// =================================================================
// 1. Kích hoạt chế độ bảo mật (ĐỌC FILE .env NGAY DÒNG ĐẦU TIÊN)
require('dotenv').config(); 

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const session = require('express-session');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const onlineUsers = {};
const monopolyGames = {};
const MongoStore = require('connect-mongo');

// 2. LẤY CẤU HÌNH TỪ BIẾN MÔI TRƯỜNG (KHÔNG CÒN LỘ MẬT KHẨU)
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (!MONGO_URI) {
    console.error('❌ Thiếu biến môi trường MONGO_URI hoặc MONGODB_URI.');
    process.exit(1);
}

// --- 1. IMPORT DỮ LIỆU & LOGIC ---
const { tests, maths } = require('./question-data.js'); 
const { boardData } = require('./monopoly-data.js');
const MonopolyGame = require('./monopoly-logic.js');

const app = express();
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: IS_PRODUCTION ? false : true,
        credentials: true
    },
    maxHttpBufferSize: 1e6
});
// --- 2. KẾT NỐI MONGODB ---
// Schema User (Đầy đủ trường dữ liệu cũ)
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    parentCode: String,
    score: { type: Number, default: 0 },
    isSuspended: { type: Boolean, default: false },
    children: [String], 
    history: [{ activity: String, timestamp: { type: Date, default: Date.now } }], 
    quests: { type: Array, default: [] }, 
    playtimeLimitMinutes: { type: Number, default: 0 },
    playtimeUsedToday: { type: Number, default: 0 },
    playtimeDate: { type: String, default: '' },
    lastHeartbeatAt: { type: Date, default: null },
    lastActiveAt: { type: Date, default: Date.now },
    loginStreak: { type: Number, default: 0 },
    lastLoginDate: { type: String, default: '' },
    inventory: { type: Array, default: [] }, // Danh sách ID đồ đã mua: ['bed_1', 'table_2']
    houseData: { type: Array, default: [] },
    chestsData: { type: Object, default: {} },
    colors: { type: Object, default: { wall: '#b2bec3', floor: '#f5f6fa' } },
    // --- DANH SÁCH 14 CẤP ĐỘ GAME ---
    musicLevel: { type: Number, default: 1 }, // Thêm vào danh sách các cấp độ game
    paintingLevel: { type: Number, default: 1 },      // Xưởng vẽ
    memoryLevel: { type: Number, default: 1 },        // Ghép hình
    shapeLevel: { type: Number, default: 1 },         // Tạo hình vui nhộn
    galleryDrawings: { type: Array, default: [] },
    buildLevel: { type: Number, default: 1 },         // Xây dựng ước mơ
    crosswordLevel: { type: Number, default: 1 },     // Ô chữ
    detectiveLevel: { type: Number, default: 1 },     // Tìm điểm khác biệt
    storyLevel: { type: Number, default: 1 },         // Sáng tác truyện
    vietSpeechLevel: { type: Number, default: 1 },    // Luyện nói Tiếng Việt
    englishSpeechLevel: { type: Number, default: 1 }, // Luyện nói Tiếng Anh
    chessLevel: { type: Number, default: 1 },         // Cờ Vua
    caroLevel: { type: Number, default: 1 },          // Caro
    goLevel: { type: Number, default: 1 },            // Cờ Vây
    monopolyLevel: { type: Number, default: 1 },      // Cờ Tỷ Phú
    othelloLevel: { type: Number, default: 1 }        // Othello
});
const tournamentSchema = new mongoose.Schema({
    gameType: String, // 'chess', 'caro', 'go', 'othello'
    format: String,   // 'knockout' (loại trực tiếp) hoặc 'group' (vòng bảng)
    phase: { type: String, default: 'registration' },
    status: { type: String, default: 'open' }, // open (đăng ký), playing (đang đấu), finished
    matchDuration: Number, // Số phút mỗi trận
    registrationDeadline: Date, // Thời điểm tự động đóng đơn
    dailyStartHour: { type: Number, default: 8 },
    dailyEndHour: { type: Number, default: 18 },
    durationDays: { type: Number, default: 7 },
    participants: [String], // Danh sách tên các bé tham gia
    brackets: { type: Array, default: [] }, // Sơ đồ trận đấu/bảng đấu
    winners: { top1: String, top2: String, top3: String }
});
// ============================================================
// --- 3. NHÓM QUÀ LƯU NIỆM (MỞ RỘNG ĐA DẠNG SỰ KIỆN) ---
// ============================================================
const SEASONAL_SOUVENIRS = [
    // 🌸 TẾT NGUYÊN ĐÁN (Tet)
    { id: 'sov_tet_mai', name: 'Cây Mai Vàng', price: 1000, type: 'd', category: 'souvenir', event: 'Tet', icon: '🌼' },
    { id: 'sov_tet_dao', name: 'Cây Đào Phai', price: 1000, type: 'd', category: 'souvenir', event: 'Tet', icon: '🌸' },
    { id: 'sov_tet_lan', name: 'Đầu Lân Sư Rồng', price: 1500, type: 'd', category: 'souvenir', event: 'Tet', icon: '🐲' },
    { id: 'sov_tet_lixi', name: 'Bao Lì Xì Lớn', price: 200, type: 'd', category: 'souvenir', event: 'Tet', icon: '🧧' },
    { id: 'sov_tet_banhchung', name: 'Bánh Chưng Xanh', price: 400, type: 'd', category: 'souvenir', event: 'Tet', icon: '🟩' },
    { id: 'sov_tet_mamnguqua', name: 'Mâm Ngũ Quả', price: 600, type: 'd', category: 'souvenir', event: 'Tet', icon: '🍎' },
    { id: 'sov_tet_phao', name: 'Tràng Pháo Đỏ', price: 300, type: 'd', category: 'souvenir', event: 'Tet', icon: '🧨' },
    { id: 'sov_tet_caudoi', name: 'Câu Đối Đỏ', price: 500, type: 'd', category: 'souvenir', event: 'Tet', icon: '📜' },

    // 🎄 GIÁNG SINH (Noel)
    { id: 'sov_noel_tree', name: 'Thông Noel', price: 1200, type: 'd', category: 'souvenir', event: 'Noel', icon: '🎄' },
    { id: 'sov_noel_santa', name: 'Ông Già Noel', price: 1500, type: 'd', category: 'souvenir', event: 'Noel', icon: '🎅' },
    { id: 'sov_noel_snow', name: 'Người Tuyết', price: 800, type: 'd', category: 'souvenir', event: 'Noel', icon: '⛄' },
    { id: 'sov_noel_gift', name: 'Hộp Quà Khổng Lồ', price: 400, type: 'd', category: 'souvenir', event: 'Noel', icon: '🎁' },
    { id: 'sov_noel_bell', name: 'Chuông Vàng Ngân Nga', price: 300, type: 'd', category: 'souvenir', event: 'Noel', icon: '🔔' },
    { id: 'sov_noel_sock', name: 'Vớ Đựng Quà', price: 150, type: 'd', category: 'souvenir', event: 'Noel', icon: '🧦' },
    { id: 'sov_noel_reindeer', name: 'Tuần Lộc Nhỏ', price: 2000, type: 'd', category: 'souvenir', event: 'Noel', icon: '🦌' },
    { id: 'sov_noel_candy', name: 'Kẹo Gậy Giáng Sinh', price: 100, type: 'd', category: 'souvenir', event: 'Noel', icon: '🦯' },

    // 🎃 HALLOWEEN (Halloween)
    { id: 'sov_hal_pump', name: 'Bí Ngô Ma Quái', price: 600, type: 'd', category: 'souvenir', event: 'Halloween', icon: '🎃' },
    { id: 'sov_hal_ghost', name: 'Bóng Ma Cute', price: 700, type: 'd', category: 'souvenir', event: 'Halloween', icon: '👻' },
    { id: 'sov_hal_witch_hat', name: 'Mũ Phù Thủy', price: 400, type: 'd', category: 'souvenir', event: 'Halloween', icon: '🧙' },
    { id: 'sov_hal_bat', name: 'Dơi Treo Tường', price: 300, type: 'd', category: 'souvenir', event: 'Halloween', icon: '🦇' },
    { id: 'sov_hal_spider', name: 'Mạng Nhện Khổng Lồ', price: 250, type: 'd', category: 'souvenir', event: 'Halloween', icon: '🕸️' },
    { id: 'sov_hal_skul', name: 'Đầu Lâu Cổ Đại', price: 900, type: 'd', category: 'souvenir', event: 'Halloween', icon: '💀' },

    // 🏮 TRUNG THU (MidAutumn)
    { id: 'sov_mid_star', name: 'Đèn Ông Sao', price: 300, type: 'd', category: 'souvenir', event: 'MidAutumn', icon: '🌟' },
    { id: 'sov_mid_rabbit', name: 'Thỏ Ngọc', price: 2000, type: 'd', category: 'souvenir', event: 'MidAutumn', icon: '🐇' },
    { id: 'sov_mid_mooncake', name: 'Bánh Trung Thu Thập Cẩm', price: 400, type: 'd', category: 'souvenir', event: 'MidAutumn', icon: '🥮' },
    { id: 'sov_mid_lion', name: 'Đầu Lân Nhỏ', price: 1200, type: 'd', category: 'souvenir', event: 'MidAutumn', icon: '🎭' },
    { id: 'sov_mid_lamp', name: 'Lồng Đèn Cá Chép', price: 500, type: 'd', category: 'souvenir', event: 'MidAutumn', icon: '🐟' },
    { id: 'sov_mid_tree', name: 'Cây Đa Chú Cuội', price: 1500, type: 'd', category: 'souvenir', event: 'MidAutumn', icon: '🌳' },

    // ❤️ VALENTINE - LỄ TÌNH NHÂN (Valentine)
    { id: 'sov_val_heart', name: 'Trái Tim Pha Lê', price: 500, type: 'd', category: 'souvenir', event: 'Valentine', icon: '💎' },
    { id: 'sov_val_rose', name: 'Bó Hoa Hồng Thắm', price: 300, type: 'd', category: 'souvenir', event: 'Valentine', icon: '🌹' },
    { id: 'sov_val_choco', name: 'Hộp Socola Ngọt Ngào', price: 450, type: 'd', category: 'souvenir', event: 'Valentine', icon: '🍫' },
    { id: 'sov_val_bear', name: 'Gấu Bông Ôm Tim', price: 800, type: 'd', category: 'souvenir', event: 'Valentine', icon: '🧸' },
    { id: 'sov_val_cupid', name: 'Cung Tên Cupid', price: 2500, type: 'd', category: 'souvenir', event: 'Valentine', icon: '🏹' },

    // ⛱️ MÙA HÈ RỰC RỠ (Summer)
    { id: 'sov_sum_castle', name: 'Lâu Đài Cát', price: 600, type: 'd', category: 'souvenir', event: 'Summer', icon: '🏰' },
    { id: 'sov_sum_surf', name: 'Ván Lướt Sóng', price: 700, type: 'd', category: 'souvenir', event: 'Summer', icon: '🏄' },
    { id: 'sov_sum_duck', name: 'Phao Vịt Vàng Siêu Cấp', price: 1200, type: 'd', category: 'souvenir', event: 'Summer', icon: '🐥' },
    { id: 'sov_sum_coconut', name: 'Ly Nước Dừa Mát Lạnh', price: 150, type: 'd', category: 'souvenir', event: 'Summer', icon: '🥥' },
    { id: 'sov_sum_tree', name: 'Cây Dừa Kiểng', price: 900, type: 'd', category: 'souvenir', event: 'Summer', icon: '🌴' },

    // 🎂 TIỆC SINH NHẬT (Birthday)
    { id: 'sov_bd_cake', name: 'Bánh Kem 3 Tầng', price: 2000, type: 'd', category: 'souvenir', event: 'Birthday', icon: '🎂' },
    { id: 'sov_bd_balloon', name: 'Chùm Bóng Bay Cầu Vồng', price: 300, type: 'd', category: 'souvenir', event: 'Birthday', icon: '🎈' },
    { id: 'sov_bd_hat', name: 'Nón Chóp Tiệc Tùng', price: 100, type: 'd', category: 'souvenir', event: 'Birthday', icon: '🥳' },
    { id: 'sov_bd_confetti', name: 'Máy Bắn Pháo Giấy', price: 500, type: 'd', category: 'souvenir', event: 'Birthday', icon: '🎉' }
];
const HOME_FURNITURE = [
    // --- 1. NỘI THẤT CƠ BẢN (furniture) ---
    { id: 'bed_lux', name: 'Giường Hoàng Gia', price: 500, type: 'f', category: 'furniture', icon: '🛌' },
    { id: 'bed_bunk', name: 'Giường Tầng', price: 600, type: 'f', category: 'furniture', icon: '🛏️' },
    { id: 'sofa_pro', name: 'Sofa Cao Cấp', price: 400, type: 'f', category: 'furniture', icon: '🛋️' },
    { id: 'wardrobe_big', name: 'Tủ Quần Áo', price: 450, type: 'f', category: 'furniture', icon: '👗' },
    { id: 'bookshelf', name: 'Kệ Sách Lớn', price: 350, type: 'f', category: 'furniture', icon: '📚' },
    { id: 'desk_study', name: 'Bàn Học Tập', price: 300, type: 'f', category: 'furniture', icon: '📝' },
    { id: 'table_wood', name: 'Bàn Ăn Bằng Gỗ', price: 250, type: 'f', category: 'furniture', icon: '🪑' },
    { id: 'chair_wood', name: 'Ghế Tựa Gỗ', price: 100, type: 'f', category: 'furniture', icon: '🪑' },
    
    // --- 2. NHÀ TẮM & NHÀ BẾP (furniture) ---
    { id: 'kit_fridge_1', name: 'Tủ Lạnh', price: 450, type: 'f', category: 'furniture', icon: '🧊' },
    { id: 'kit_fridge_2', name: 'Tủ Lạnh 2 Cánh', price: 650, type: 'f', category: 'furniture', icon: '🧊' },
    { id: 'kit_stove', name: 'Bếp Nấu Ăn', price: 300, type: 'f', category: 'furniture', icon: '🍳' },
    { id: 'kit_pot', name: 'Nồi Súp Ngon', price: 50, type: 'f', category: 'furniture', icon: '🍲' },
    { id: 'bath_tub_1', name: 'Bồn Tắm', price: 550, type: 'f', category: 'furniture', icon: '🛁' },
    { id: 'bath_tub_2', name: 'Bồn Tắm Sục', price: 750, type: 'f', category: 'furniture', icon: '🛁' },
    { id: 'bath_toilet', name: 'Bồn Cầu Vàng', price: 250, type: 'f', category: 'furniture', icon: '🚽' },
    { id: 'bath_duck', name: 'Vịt Tắm', price: 20, type: 'f', category: 'furniture', icon: '🦆' },

    // --- 3. ĐIỆN TỬ & CÔNG NGHỆ (electronics) ---
    { id: 'tv_8k_1', name: 'Tivi 8K', price: 600, type: 'e', category: 'electronics', icon: '📺' },
    { id: 'tv_8k_slim', name: 'Tivi 8K Siêu Mỏng', price: 800, type: 'e', category: 'electronics', icon: '📺' },
    { id: 'pc_super_1', name: 'Siêu Máy Tính', price: 700, type: 'e', category: 'electronics', icon: '🖥️' },
    { id: 'pc_super_2', name: 'PC Gaming Pro', price: 900, type: 'e', category: 'electronics', icon: '🖥️' },
    { id: 'laptop_pro', name: 'Laptop Mỏng Nhẹ', price: 500, type: 'e', category: 'electronics', icon: '💻' },
    { id: 'speaker_hiend', name: 'Loa Âm Thanh Vòm', price: 300, type: 'e', category: 'electronics', icon: '🔊' },
    { id: 'robot_clean', name: 'Robot Hút Bụi', price: 200, type: 'e', category: 'electronics', icon: '🤖' },
    { id: 'camera_sec', name: 'Camera An Ninh', price: 150, type: 'e', category: 'electronics', icon: '📹' },
    { id: 'lamp_modern', name: 'Đèn Ngủ Cảm Ứng', price: 150, type: 'e', category: 'electronics', icon: '🏮' },
    { id: 'ac_unit', name: 'Điều Hòa Nhiệt Độ', price: 400, type: 'e', category: 'electronics', icon: '❄️' },
    { id: 'game_console', name: 'Máy Chơi Game PS5', price: 800, type: 'e', category: 'electronics', icon: '🎮' },
    { id: 'microwave', name: 'Lò Vi Sóng', price: 250, type: 'e', category: 'electronics', icon: '🍱' },

    // --- 4. TRANG TRÍ & SÂN VƯỜN (decor) ---
    { id: 'piano_grand', name: 'Đàn Piano Cơ', price: 1000, type: 'd', category: 'decor', icon: '🎹' },
    { id: 'guitar_elec', name: 'Đàn Guitar Điện', price: 450, type: 'd', category: 'decor', icon: '🎸' },
    { id: 'drum_set', name: 'Dàn Trống Xịn', price: 600, type: 'd', category: 'decor', icon: '🥁' },
    { id: 'aquarium_pro', name: 'Bể Cá Thủy Sinh', price: 550, type: 'd', category: 'decor', icon: '🐠' },
    { id: 'bonsai_tree', name: 'Cây Cảnh Nghệ Thuật', price: 180, type: 'd', category: 'decor', icon: '🪴' },
    { id: 'plant_cactus', name: 'Chậu Xương Rồng', price: 80, type: 'd', category: 'decor', icon: '🌵' },
    { id: 'xmas_tree', name: 'Cây Thông Noel', price: 300, type: 'd', category: 'decor', icon: '🎄' },
    { id: 'fountain', name: 'Đài Phun Nước', price: 800, type: 'd', category: 'decor', icon: '⛲' },
    { id: 'flower_sun', name: 'Hoa Hướng Dương', price: 50, type: 'd', category: 'decor', icon: '🌻' },
    { id: 'statue_moai', name: 'Tượng Moai', price: 400, type: 'd', category: 'decor', icon: '🗿' },
    { id: 'bear_huge', name: 'Gấu Bông Khổng Lồ', price: 120, type: 'd', category: 'decor', icon: '🧸' },
    { id: 'telescope_v2', name: 'Kính Thiên Văn', price: 400, type: 'd', category: 'decor', icon: '🔭' },
    { id: 'painting_art', name: 'Tranh Triển Lãm', price: 300, type: 'd', category: 'decor', icon: '🖼️' },
    { id: 'clock_gold', name: 'Đồng Hồ Quả Lắc', price: 220, type: 'd', category: 'decor', icon: '⏰' },
    { id: 'safe_box', name: 'Két Sắt', price: 600, type: 'd', category: 'decor', icon: '🔐' },
    { id: 'magic_ball', name: 'Quả Cầu Pha Lê', price: 500, type: 'd', category: 'decor', icon: '🔮' },
    { id: 'trophy_gold', name: 'Cúp Vô Địch', price: 900, type: 'd', category: 'decor', icon: '🏆' },

    // --- 5. THÚ CƯNG ĐI DẠO (pet) - TỰ ĐỘNG CHẠY NHẢY TRONG GAME ---
    { id: 'pet_cat', name: 'Mèo Lười', price: 500, type: 'p', category: 'pet', icon: '🐱' },
    { id: 'pet_dog', name: 'Cún Corgi', price: 260, type: 'p', category: 'pet', icon: '🐶' },
    { id: 'pet_hamster', name: 'Hamster Chạy Bộ', price: 100, type: 'p', category: 'pet', icon: '🐹' },
    { id: 'pet_parrot', name: 'Vẹt Nhại Tiếng', price: 350, type: 'p', category: 'pet', icon: '🦜' },
    { id: 'pet_rabbit', name: 'Thỏ Trắng Nhảy', price: 300, type: 'p', category: 'pet', icon: '🐰' },
    { id: 'pet_piglet', name: 'Heo Con Bụ Bẫm', price: 200, type: 'p', category: 'pet', icon: '🐷' },
    { id: 'pet_monkey', name: 'Khỉ Quậy Phá', price: 400, type: 'p', category: 'pet', icon: '🐵' },
    { id: 'pet_turtle', name: 'Rùa Biển Cụ', price: 250, type: 'p', category: 'pet', icon: '🐢' },
    { id: 'pet_penguin', name: 'Chim Cánh Cụt', price: 450, type: 'p', category: 'pet', icon: '🐧' },
    { id: 'pet_unicorn', name: 'Kỳ Lân (Cực Hiếm)', price: 5000, type: 'p', category: 'pet', icon: '🦄' },
    { id: 'pet_dragon', name: 'Rồng Lửa (Huyền Thoại)', price: 9999, type: 'p', category: 'pet', icon: '🐉' },
];

const MATERIALS = [
    // =======================================================
    // --- 1. KHỐI XÂY DỰNG: TƯỜNG & GẠCH (20 LOẠI - 'paint') ---
    // =======================================================
    { id: 'wall_white', name: 'Tường Trắng Sứ', price: 50, category: 'paint', value: '#ffffff', icon: '🧱' },
    { id: 'wall_black', name: 'Tường Đen Nhám', price: 60, category: 'paint', value: '#2c3e50', icon: '⬛' },
    { id: 'wall_red_brick', name: 'Khối Gạch Đỏ', price: 60, category: 'paint', value: '#c0392b', icon: '🧱' },
    { id: 'wall_stone_brick', name: 'Khối Gạch Đá Xám', price: 70, category: 'paint', value: '#7f8c8d', icon: '🪨' },
    { id: 'wall_wood_plank', name: 'Ván Gỗ Sồi', price: 80, category: 'paint', value: '#e67e22', icon: '🪵' },
    { id: 'wall_pink', name: 'Sơn Hồng Nhạt', price: 50, category: 'paint', value: '#fd79a8', icon: '🎨' },
    { id: 'wall_blue', name: 'Sơn Xanh Nước Biển', price: 50, category: 'paint', value: '#0984e3', icon: '🎨' },
    { id: 'wall_yellow', name: 'Sơn Vàng Chanh', price: 50, category: 'paint', value: '#f1c40f', icon: '🎨' },
    { id: 'wall_green', name: 'Sơn Xanh Lá', price: 50, category: 'paint', value: '#2ecc71', icon: '🎨' },
    { id: 'wall_glass', name: 'Kính Trong Suốt', price: 100, category: 'paint', value: '#81ecec', icon: '🧊' },
    // --- MỚI BỔ SUNG ---
    { id: 'wall_diamond', name: 'Khối Kim Cương', price: 500, category: 'paint', value: '#00cec9', icon: '💎' },
    { id: 'wall_gold', name: 'Khối Vàng Ròng', price: 400, category: 'paint', value: '#f39c12', icon: '👑' },
    { id: 'wall_emerald', name: 'Khối Lục Bảo', price: 450, category: 'paint', value: '#00b894', icon: '❇️' },
    { id: 'wall_amethyst', name: 'Khối Thạch Anh Tím', price: 300, category: 'paint', value: '#a29bfe', icon: '🔮' },
    { id: 'wall_quartz', name: 'Khối Thạch Anh Trắng', price: 200, category: 'paint', value: '#f5f6fa', icon: '🏛️' },
    { id: 'wall_dark_oak', name: 'Ván Gỗ Sồi Sẫm', price: 90, category: 'paint', value: '#5c2c16', icon: '🪵' },
    { id: 'wall_birch', name: 'Ván Gỗ Bạch Dương', price: 90, category: 'paint', value: '#f5cd79', icon: '🪵' },
    { id: 'wall_magma', name: 'Khối Magma Phun Trào', price: 350, category: 'paint', value: '#e15f41', icon: '🌋' },
    { id: 'wall_ice', name: 'Khối Băng Giá', price: 150, category: 'paint', value: '#74b9ff', icon: '❄️' },
    { id: 'wall_prismarine', name: 'Gạch Lăng Kính Biển', price: 250, category: 'paint', value: '#00cec9', icon: '🧜‍♂️' },

    // ========================================================
    // --- 2. KHỐI XÂY DỰNG: SÀN NHÀ & ĐỊA HÌNH (20 LOẠI - 'floor') ---
    // ========================================================
    { id: 'floor_wood', name: 'Sàn Gỗ Cổ Điển', price: 100, category: 'floor', value: '#d35400', icon: '🪵' },
    { id: 'floor_grass', name: 'Khối Cỏ Xanh', price: 150, category: 'floor', value: '#27ae60', icon: '🌿' },
    { id: 'floor_dirt', name: 'Khối Đất Nâu', price: 80, category: 'floor', value: '#6e2c00', icon: '🟤' },
    { id: 'floor_stone', name: 'Đá Cuội', price: 120, category: 'floor', value: '#95a5a6', icon: '🪨' },
    { id: 'floor_sand', name: 'Cát Sa Mạc', price: 80, category: 'floor', value: '#f1c40f', icon: '🏜️' },
    { id: 'floor_water', name: 'Khối Nước Biển', price: 200, category: 'floor', value: '#3498db', icon: '🌊' },
    { id: 'floor_lava', name: 'Khối Dung Nham', price: 300, category: 'floor', value: '#e74c3c', icon: '🔥' },
    { id: 'floor_snow', name: 'Khối Tuyết', price: 120, category: 'floor', value: '#dfe6e9', icon: '❄️' },
    { id: 'floor_tile', name: 'Gạch Men Lát Sàn', price: 150, category: 'floor', value: '#ecf0f1', icon: '⬜' },
    { id: 'floor_obsidian', name: 'Hắc Diện Thạch', price: 500, category: 'floor', value: '#2f3640', icon: '⬛' },
    // --- MỚI BỔ SUNG ---
    { id: 'floor_red_sand', name: 'Cát Đỏ Khô Cằn', price: 90, category: 'floor', value: '#d35400', icon: '🏜️' },
    { id: 'floor_clay', name: 'Đất Sét Xám', price: 100, category: 'floor', value: '#d1d8e0', icon: '🧱' },
    { id: 'floor_packed_ice', name: 'Băng Trơn Trượt', price: 180, category: 'floor', value: '#81ecec', icon: '🧊' },
    { id: 'floor_red_carpet', name: 'Thảm Đỏ Trải Sàn', price: 130, category: 'floor', value: '#c0392b', icon: '🟥' },
    { id: 'floor_blue_carpet', name: 'Thảm Xanh Trải Sàn', price: 130, category: 'floor', value: '#0984e3', icon: '🟦' },
    { id: 'floor_warped_nylium', name: 'Thảm Nấm Xanh Lạ', price: 250, category: 'floor', value: '#008b8b', icon: '🦠' },
    { id: 'floor_crimson_nylium', name: 'Thảm Nấm Đỏ Lạ', price: 250, category: 'floor', value: '#8b0000', icon: '🍄' },
    { id: 'floor_gravel', name: 'Sỏi Rải Đường', price: 70, category: 'floor', value: '#a4b0be', icon: '⚪' },
    { id: 'floor_concrete_gray', name: 'Bê Tông Đổ Đường', price: 110, category: 'floor', value: '#7f8c8d', icon: '🛣️' },
    { id: 'floor_slime', name: 'Khối Nhầy Tưng Tưng', price: 400, category: 'floor', value: '#55efc4', icon: '🟩' },
    { id: 'build_door', name: 'Cửa Gỗ', price: 120, category: 'furniture', icon: '🚪' },
    { id: 'build_window', name: 'Cửa Sổ Kính', price: 200, category: 'paint', value: 'rgba(129, 236, 236, 0.4)', icon: '🪟' },
    { id: 'build_stair', name: 'Cầu Thang', price: 150, category: 'paint', value: '#95a5a6', icon: '🪜' },
    { id: 'build_fence', name: 'Hàng Rào', price: 80, category: 'paint', value: '#8b4513', icon: '🚧' }
];
const SHOP_ITEMS = [...HOME_FURNITURE, ...MATERIALS, ...SEASONAL_SOUVENIRS];
const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true, maxlength: 120 },
    content: { type: String, required: true, maxlength: 2000 },
    type: { type: String, enum: ['info', 'event', 'warning'], default: 'info' },
    targetUsername: { type: String, default: null, index: true },
    date: { type: Date, default: Date.now, index: true }
});

const Notification = mongoose.model('Notification', notificationSchema);

// --- DANH SÁCH VẬT PHẨM NÂNG CẤP (FULL OPTION) ---
const Tournament = mongoose.model('Tournament', tournamentSchema);
const User = mongoose.model('User', userSchema);
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("✅ Đã kết nối MongoDB thành công!");

        // --- TỰ ĐỘNG KHỞI TẠO ADMIN NẾU CHƯA CÓ ---
        try {
            const adminExists = await User.findOne({ username: 'Admin' });
            if (!adminExists) {
                const adminPass = process.env.ADMIN_PASSWORD || (!IS_PRODUCTION ? 'AdminDev123!' : null);
                if (!adminPass || adminPass.length < 10) {
                    throw new Error('Thiếu ADMIN_PASSWORD hoặc mật khẩu Admin ngắn hơn 10 ký tự.');
                }
                const hashedPassword = await bcrypt.hash(adminPass, 10);
                
                const admin = new User({
                    username: 'Admin',
                    password: hashedPassword,
                    role: 'admin',
                    // Cấp ngay 100 cấp độ cho Admin để test toàn bộ tính năng
                    chessLevel: 100, caroLevel: 100, memoryLevel: 100, crosswordLevel: 100,
                    detectiveLevel: 100, goLevel: 100, othelloLevel: 100, storyLevel: 100,
                    shapeLevel: 100, buildLevel: 100, paintingLevel: 100, monopolyLevel: 100,
                    vietSpeechLevel: 100, englishSpeechLevel: 100,
                    score: 9999
                });
                await admin.save();
                console.log("🚀 Đã tự động tạo tài khoản Admin từ cấu hình bảo mật.");
            }
        } catch (error) {
            console.error("❌ Lỗi khi kiểm tra/tạo Admin:", error);
        }
    })
    .catch(err => console.error("❌ Lỗi kết nối MongoDB:", err));
// --- 3. CẤU HÌNH MIDDLEWARE ---
const sessionSecret = process.env.SESSION_SECRET;
if (IS_PRODUCTION && (!sessionSecret || sessionSecret.length < 32)) {
    console.error('❌ SESSION_SECRET phải được cấu hình và dài tối thiểu 32 ký tự trên production.');
    process.exit(1);
}

const sessionMiddleware = session({
    name: 'hanhtrinh.sid',
    secret: sessionSecret || 'dev-only-session-secret-change-before-production',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: MongoStore.create({
        mongoUrl: MONGO_URI,
        ttl: 24 * 60 * 60,
        autoRemove: 'native'
    }),
    cookie: {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
});
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), payment=()');
    next();
});
app.use((req, res, next) => {
    if (req.path === '/admin-panel.html' && req.session?.user?.role !== 'admin') {
        return res.redirect('/login.html');
    }
    if (req.path === '/phu-huynh.html' && req.session?.user?.role !== 'parent') {
        return res.redirect('/login.html');
    }
    next();
});
app.use(express.static(__dirname, {
    etag: true,
    maxAge: IS_PRODUCTION ? '1h' : 0
}));

// --- 4. TRẠNG THÁI SERVER (IN-MEMORY) ---
const gameRooms = {};
const waitingPlayers = {};
const monopolyQueue = [];
let maintenanceMode = false;

function requireAuth(req, res, next) {
    if (!req.session?.user) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Bạn không có quyền quản trị.' });
    }
    next();
}

function requireParent(req, res, next) {
    if (!req.session?.user || req.session.user.role !== 'parent') {
        return res.status(403).json({ message: 'Chỉ tài khoản phụ huynh mới được truy cập.' });
    }
    next();
}

function clampInteger(value, min, max, fallback = min) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
}

function normalizeUsername(value) {
    return String(value || '').trim();
}

function getVietnamDateKey(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

function isPreviousDate(previousKey, currentKey) {
    if (!previousKey) return false;
    const previous = new Date(`${previousKey}T00:00:00+07:00`);
    const current = new Date(`${currentKey}T00:00:00+07:00`);
    return current - previous === 24 * 60 * 60 * 1000;
}

function isValidUsername(username) {
    return /^[A-Za-z0-9_À-ỹ]{3,24}$/u.test(username);
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createRateLimiter({ windowMs, max, message }) {
    const buckets = new Map();
    return (req, res, next) => {
        const now = Date.now();
        const key = req.ip || req.socket.remoteAddress || 'unknown';
        const entry = buckets.get(key);
        if (!entry || now >= entry.resetAt) {
            buckets.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }
        entry.count += 1;
        if (entry.count > max) {
            const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
            res.setHeader('Retry-After', String(retryAfter));
            return res.status(429).json({ message });
        }
        next();
    };
}

const authRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Bạn thao tác đăng nhập quá nhiều lần. Vui lòng thử lại sau.'
});

app.get('/api/health', (req, res) => {
    const mongoReady = mongoose.connection.readyState === 1;
    res.status(mongoReady ? 200 : 503).json({
        status: mongoReady ? 'ok' : 'degraded',
        database: mongoReady ? 'connected' : 'disconnected',
        uptimeSeconds: Math.floor(process.uptime()),
        version: '2.0.0'
    });
});

// Bảo vệ toàn bộ API quản trị, tránh người chơi gọi trực tiếp từ trình duyệt.
app.use('/api/admin', requireAdmin);

// --- 5. API HỆ THỐNG (AUTH) ---
app.post('/api/house/save-drawing', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Chưa đăng nhập' });
    const { level, image } = req.body;
    
    // 1. Tìm user trong cơ sở dữ liệu
    const user = await User.findOne({ username: req.session.user.username });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });

    // 2. Lưu bức tranh
    user.galleryDrawings.push({ level, image, date: new Date() });
    
    // 3. KÍCH HOẠT NHIỆM VỤ "Vẽ Tranh"
    updateQuestProgress(user, 'Vẽ Tranh', { timeTaken: 0, isWin: true });
    
    // 4. Lưu lại toàn bộ vào Database
    user.markModified('galleryDrawings');
    user.markModified('quests');
    await user.save();
    
    res.json({ message: "Bức tranh đã được đưa vào triển lãm và nhiệm vụ đã hoàn thành!" });
});

// 1. Kho nhiệm vụ đa dạng (Đã được căn chỉnh khớp 100% với tên API)
const QUEST_POOL = [
    // --- 1. Nhóm Tư Duy & Logic ---
    { taskType: 'Cờ Vua', levelKey: 'chessLevel', targetBase: 1, rewardBase: 50, penaltyBase: 20, timeLimitBase: 86400 },
    { taskType: 'Cờ Vây', levelKey: 'goLevel', targetBase: 1, rewardBase: 100, penaltyBase: 50, timeLimitBase: 86400 },
    { taskType: 'Phục Kích', levelKey: 'othelloLevel', targetBase: 1, rewardBase: 50, penaltyBase: 20, timeLimitBase: 86400 },
    { taskType: 'Cờ Caro', levelKey: 'caroLevel', targetBase: 2, rewardBase: 50, penaltyBase: 15, timeLimitBase: 86400 },

    // --- 2. Nhóm Sáng Tạo & Ngôn Ngữ ---
    { taskType: 'Sáng Tác', levelKey: 'storyLevel', targetBase: 1, rewardBase: 80, penaltyBase: 20, timeLimitBase: 86400 },
    { taskType: 'Tiếng Anh', levelKey: 'englishSpeechLevel', targetBase: 2, rewardBase: 40, penaltyBase: 15, timeLimitBase: 86400 },
    { taskType: 'Luyện Nói Việt', levelKey: 'vietSpeechLevel', targetBase: 2, rewardBase: 40, penaltyBase: 15, timeLimitBase: 86400 },

    // --- 3. Nhóm Giải Trí & Kỹ Năng ---
    { taskType: 'Âm Nhạc', levelKey: 'musicLevel', targetBase: 1, rewardBase: 40, penaltyBase: 10, timeLimitBase: 86400 },
    { taskType: 'Thám tử', levelKey: 'detectiveLevel', targetBase: 1, rewardBase: 60, penaltyBase: 25, timeLimitBase: 86400 },
    { taskType: 'Ghép Hình', levelKey: 'shapeLevel', targetBase: 2, rewardBase: 40, penaltyBase: 15, timeLimitBase: 86400 }, // shapeLevel -> Ghép Hình
    { taskType: 'Xây Dựng', levelKey: 'buildLevel', targetBase: 1, rewardBase: 50, penaltyBase: 20, timeLimitBase: 86400 },
    { taskType: 'Trí Nhớ', levelKey: 'memoryLevel', targetBase: 2, rewardBase: 30, penaltyBase: 10, timeLimitBase: 86400 }, // memoryLevel -> Trí Nhớ
    { taskType: 'Ô Chữ', levelKey: 'crosswordLevel', targetBase: 1, rewardBase: 40, penaltyBase: 15, timeLimitBase: 86400 },

    // --- 4. Các môn đặc biệt (Vẽ tranh, Bài kiểm tra) ---
    { taskType: 'Kiểm Tra', levelKey: 'testLevel', targetBase: 1, rewardBase: 100, penaltyBase: 30, timeLimitBase: 86400 },
    { taskType: 'Vẽ Tranh', levelKey: 'paintingLevel', targetBase: 1, rewardBase: 50, penaltyBase: 10, timeLimitBase: 86400 }
];
// 2. Hàm tự động cấp 4 nhiệm vụ "hợp trình độ" mỗi ngày
async function refreshDailyQuests(user) {
    const today = new Date().toDateString();
    const hasDailyToday = user.quests.some(q => q.isDaily && q.date === today);

    if (!hasDailyToday) {
        // Xóa nhiệm vụ cũ của ngày hôm trước
        user.quests = user.quests.filter(q => !q.isDaily);
        
        const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 4);

        selected.forEach(q => {
            const currentLvl = user[q.levelKey] || 1;
            const dynamicTarget = q.targetBase + Math.floor(currentLvl / 5); 
            const dynamicReward = q.rewardBase + (currentLvl * 5);

            user.quests.push({
                id: 'd-' + Math.random().toString(36).substr(2, 5),
                startTime: Date.now(), // <--- QUAN TRỌNG: Để đồng hồ ở nhiem-vu.html có thể chạy
                taskType: q.taskType,
                target: dynamicTarget,
                reward: dynamicReward,
                penalty: q.penaltyBase || 20,    // Nạp điểm phạt từ kho nhiệm vụ
                timeLimit: q.timeLimitBase || 0, // Nạp thời gian giới hạn từ kho nhiệm vụ
                progress: 0,
                isDaily: true,
                date: today
            });
        });
        
        user.markModified('quests');
        await user.save();
    }
}
// --- API LẤY BẢNG XẾP HẠNG (BXH) ---
app.get('/api/leaderboard', async (req, res) => {
    try {
        // Lấy top 10 người dùng có điểm cao nhất, chỉ lấy các tài khoản là 'child'
        const topPlayers = await User.find({ role: 'child' })
            .sort({ score: -1 }) // Sắp xếp điểm giảm dần
            .limit(10)           // Chỉ lấy 10 người đứng đầu
            .select('username score chessLevel'); // Chỉ lấy tên và điểm để bảo mật
        res.json(topPlayers);
    } catch (e) {
        res.status(500).json({ message: 'Lỗi khi tải bảng xếp hạng' });
    }
});
// --- API ĐĂNG KÝ / ĐĂNG NHẬP ---
app.post('/api/register', authRateLimit, async (req, res) => {
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || '');

    if (!isValidUsername(username)) {
        return res.status(400).json({
            message: 'Tên đăng nhập phải dài 3–24 ký tự và chỉ gồm chữ, số hoặc dấu gạch dưới.'
        });
    }
    if (username.toLowerCase() === 'admin') {
        return res.status(400).json({ message: 'Tên đăng nhập này đã được dành riêng.' });
    }
    if (password.length < 6 || password.length > 72) {
        return res.status(400).json({ message: 'Mật khẩu phải dài từ 6 đến 72 ký tự.' });
    }

    try {
        const existingUser = await User.findOne({
            username: { $regex: new RegExp(`^${escapeRegExp(username)}$`, 'i') }
        }).lean();

        if (existingUser) {
            return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            username,
            password: hashedPassword,
            role: 'child',
            parentCode: null,
            lastActiveAt: new Date()
        });

        res.status(201).json({
            message: 'Đăng ký thành công! Hãy đăng nhập để chơi nhé.',
            user: { username: newUser.username, role: newUser.role }
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại!' });
        }
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({ message: 'Không thể đăng ký lúc này. Vui lòng thử lại.' });
    }
});

app.post('/api/login', authRateLimit, async (req, res) => {
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || '');

    if (!username || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' });
    }

    try {
        const user = await User.findOne({
            username: { $regex: new RegExp(`^${escapeRegExp(username)}$`, 'i') }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Sai tên đăng nhập hoặc mật khẩu!' });
        }
        if (user.isSuspended) {
            return res.status(403).json({ message: 'Tài khoản đã bị khóa!' });
        }
        if (maintenanceMode && user.role !== 'admin') {
            return res.status(503).json({ message: 'Hệ thống đang bảo trì. Vui lòng quay lại sau.' });
        }

        const today = getVietnamDateKey();
        if (user.lastLoginDate !== today) {
            user.loginStreak = isPreviousDate(user.lastLoginDate, today)
                ? Math.max(1, user.loginStreak || 0) + 1
                : 1;
            user.lastLoginDate = today;
        }
        user.lastActiveAt = new Date();
        await user.save();

        await new Promise((resolve, reject) => {
            req.session.regenerate(error => {
                if (error) return reject(error);
                req.session.user = { username: user.username, role: user.role };
                req.session.save(saveError => saveError ? reject(saveError) : resolve());
            });
        });

        res.json({
            message: 'Đăng nhập thành công!',
            user: {
                username: user.username,
                role: user.role,
                parentCode: user.parentCode,
                children: user.children,
                loginStreak: user.loginStreak
            }
        });
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi đăng nhập. Vui lòng thử lại.' });
    }
});

app.post('/api/logout', (req, res) => {
    if (!req.session) return res.json({ message: 'Đăng xuất thành công' });
    req.session.destroy(error => {
        res.clearCookie('hanhtrinh.sid');
        if (error) {
            return res.status(500).json({ message: 'Không thể đăng xuất. Vui lòng thử lại.' });
        }
        res.json({ message: 'Đăng xuất thành công' });
    });
});

app.get('/api/user/progress', requireAuth, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.session.user.username }).select('-password');
        if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
        if (user.role === 'admin') {
            const levels = ['chessLevel', 'caroLevel', 'memoryLevel', 'crosswordLevel', 'detectiveLevel', 'goLevel', 'othelloLevel', 'storyLevel', 'shapeLevel', 'buildLevel', 'paintingLevel', 'monopolyLevel', 'vietSpeechLevel', 'englishSpeechLevel'];
            levels.forEach(levelKey => {
                if ((user[levelKey] || 1) < 100) user[levelKey] = 100;
            });
        }
        user.lastActiveAt = new Date();
        await refreshDailyQuests(user);
        res.setHeader('Cache-Control', 'no-store');
        res.json(user);
    } catch (error) {
        console.error('Lỗi tải tiến trình:', error);
        res.status(500).json({ message: 'Không thể tải tiến trình người chơi.' });
    }
});

app.post('/api/user/heartbeat', requireAuth, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.session.user.username });
        if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
        if (user.isSuspended) {
            return res.status(403).json({ code: 'ACCOUNT_SUSPENDED', message: 'Tài khoản đã bị khóa.' });
        }
        if (maintenanceMode && user.role !== 'admin') {
            return res.status(503).json({ code: 'MAINTENANCE', message: 'Hệ thống đang bảo trì.' });
        }

        const now = new Date();
        const today = getVietnamDateKey(now);
        if (user.playtimeDate !== today) {
            user.playtimeDate = today;
            user.playtimeUsedToday = 0;
            user.lastHeartbeatAt = now;
        } else if (user.lastHeartbeatAt) {
            const elapsedMinutes = Math.max(
                0,
                Math.min(2, (now.getTime() - new Date(user.lastHeartbeatAt).getTime()) / 60000)
            );
            user.playtimeUsedToday = Number((Number(user.playtimeUsedToday || 0) + elapsedMinutes).toFixed(2));
            user.lastHeartbeatAt = now;
        } else {
            user.lastHeartbeatAt = now;
        }

        user.lastActiveAt = now;
        const limit = Math.max(0, user.playtimeLimitMinutes || 0);
        if (user.role !== 'admin' && limit > 0 && user.playtimeUsedToday >= limit) {
            await user.save();
            const socketId = onlineUsers[user.username];
            if (socketId) io.to(socketId).emit('playtimeLimitExceeded');
            return res.status(403).json({
                code: 'PLAYTIME_LIMIT_EXCEEDED',
                status: 'limit_exceeded',
                usedMinutes: Math.ceil(user.playtimeUsedToday),
                limitMinutes: limit
            });
        }

        await user.save();
        res.json({
            status: 'ok',
            usedMinutes: Math.ceil(user.playtimeUsedToday),
            limitMinutes: limit,
            remainingMinutes: limit > 0 ? Math.max(0, Math.ceil(limit - user.playtimeUsedToday)) : null
        });
    } catch (error) {
        console.error('Heartbeat error:', error);
        res.status(500).json({ message: 'Không thể cập nhật thời gian chơi.' });
    }
});

app.get('/api/parent/dashboard', requireParent, async (req, res) => {
    try {
        const parent = await User.findOne({ username: req.session.user.username }).select('-password');
        if (!parent) return res.status(404).json({ message: 'Không tìm thấy tài khoản phụ huynh.' });

        const childQuery = {
            role: 'child',
            $or: [
                { username: { $in: parent.children || [] } },
                ...(parent.parentCode ? [{ parentCode: parent.parentCode }] : [])
            ]
        };
        const children = await User.find(childQuery)
            .select('username score history playtimeLimitMinutes playtimeUsedToday lastActiveAt')
            .lean();

        const safeChildren = children.map(child => ({
            ...child,
            history: (child.history || []).slice(-30).reverse()
        }));

        res.json({
            parentCode: parent.parentCode,
            children: safeChildren
        });
    } catch (error) {
        console.error('Lỗi dashboard phụ huynh:', error);
        res.status(500).json({ message: 'Không thể tải bảng điều khiển phụ huynh.' });
    }
});

// --- 6. API ADMIN (ĐÃ KHÔI PHỤC ĐẦY ĐỦ) ---
// 1. Admin gửi thông báo chính thức (Lưu vào DB)
app.post('/api/admin/post-notification', async (req, res) => {
    try {
        const title = String(req.body.title || '').trim();
        const content = String(req.body.content || '').trim();
        const type = ['info', 'event', 'warning'].includes(req.body.type) ? req.body.type : 'info';

        if (!title || !content) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tiêu đề và nội dung.' });
        }

        const newNotify = await Notification.create({ title, content, type });
        io.emit('adminNotification', { title: newNotify.title, message: newNotify.content, type });
        res.status(201).json({ message: 'Đã đăng thông báo thành công!' });
    } catch (error) {
        console.error('Lỗi đăng thông báo:', error);
        res.status(500).json({ message: 'Không thể đăng thông báo.' });
    }
});

app.get('/api/notifications', async (req, res) => {
    try {
        const username = req.session?.user?.username || null;
        const query = username
            ? { $or: [{ targetUsername: null }, { targetUsername: username }] }
            : { targetUsername: null };

        const list = await Notification.find(query)
            .sort({ date: -1 })
            .limit(20)
            .lean();

        res.setHeader('Cache-Control', 'no-store');
        res.json(list);
    } catch (error) {
        console.error('Lỗi tải thông báo:', error);
        res.status(500).json({ message: 'Không thể tải thông báo.' });
    }
});
app.post('/api/admin/create-tournament', async (req, res) => {
    const { gameType, matchDuration, regDays, dailyStart, dailyEnd, tourDays } = req.body;
    
    // Xóa giải cũ
    await Tournament.deleteMany({ status: { $ne: 'finished' } });

    // Tính toán hạn chót: Hiện tại + số ngày Admin chọn
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + parseInt(regDays));

    const newTourney = new Tournament({ 
        gameType, 
        matchDuration: parseInt(matchDuration),
        registrationDeadline: deadline,
        dailyStartHour: parseInt(dailyStart),
        dailyEndHour: parseInt(dailyEnd),
        durationDays: parseInt(tourDays),
        status: 'open'
    });

    await newTourney.save();
    
    io.emit('adminNotification', { 
        title: '🏆 GIẢI ĐẤU MỚI', 
        message: `Môn ${gameType.toUpperCase()} mở đăng ký trong ${regDays} ngày!` 
    });
    res.json({ message: `Đã mở giải! Hạn chót đăng ký: ${deadline.toLocaleString()}` });
});
// Admin chốt danh sách và chia bảng
// (Code Mới - Đã sửa lỗi)
app.post('/api/admin/finish-tournament', async (req, res) => {
    const { top1, top2, top3 } = req.body;
    
    // Cộng điểm cho người thắng
    if (top1) await User.updateOne({ username: top1 }, { $inc: { score: 500 } }); 
    if (top2) await User.updateOne({ username: top2 }, { $inc: { score: 300 } }); 
    if (top3) await User.updateOne({ username: top3 }, { $inc: { score: 100 } }); 
    
    // --- SỬA Ở DÒNG DƯỚI ĐÂY ---
    // Cập nhật trạng thái thành 'finished' cho bất kỳ giải nào chưa kết thúc (đang open hoặc playing)
    await Tournament.updateOne(
        { status: { $ne: 'finished' } }, 
        { $set: { status: 'finished', winners: { top1, top2, top3 } } }
    );
    
    // Gửi thông báo
    io.emit('adminNotification', { title: '🏁 GIẢI KẾT THÚC', message: `Chúc mừng quán quân: ${top1 || 'Ẩn danh'}!` });
    
    // Gửi tín hiệu cập nhật giao diện ngay lập tức
    io.emit('tournamentUpdated');

    res.json({ message: "Đã trao thưởng và đóng giải đấu thành công!" });
});
// Admin chốt danh sách - Hệ thống tự chọn thể thức thông minh
// --- LOGIC CHỐT GIẢI & LẬP LỊCH THÔNG MINH (CÓ GIỚI HẠN GIỜ) ---
app.post('/api/admin/start-tournament', async (req, res) => {
    const tourney = await Tournament.findOne({ status: 'open' });
    if (!tourney || tourney.participants.length < 2) return res.status(400).json({ message: "Không đủ người!" });

    // Nhận thêm tham số giờ bắt đầu/kết thúc trong ngày
    const { durationDays, dailyStartHour, dailyEndHour } = req.body;
    
    const startH = dailyStartHour || 8;  // Mặc định 8h sáng
    const endH = dailyEndHour || 18;    // Mặc định 18h tối
    const days = durationDays || 7;

    const players = [...tourney.participants].sort(() => Math.random() - 0.5);
    const count = players.length;
    
    // --- HÀM PHỤ TRỢ TÍNH GIỜ ĐẤU ---
    // matchIndex: Trận thứ mấy (0, 1, 2...)
    // totalMatches: Tổng số trận cần tổ chức
    function getSmartSchedule(matchIndex, totalMatches) {
        // 1. Mỗi ngày tổ chức bao nhiêu trận?
        const matchesPerDay = Math.ceil(totalMatches / days);
        
        // 2. Trận này rơi vào ngày thứ mấy (0, 1, 2...)?
        const dayIndex = Math.floor(matchIndex / matchesPerDay);
        
        // 3. Trận này là trận thứ mấy trong ngày đó?
        const matchInDayIndex = matchIndex % matchesPerDay;

        // 4. Tính khoảng cách giữa các trận trong khung giờ cho phép
        // Ví dụ: 8h-18h = 10 tiếng = 600 phút. Có 10 trận => Cách nhau 60 phút.
        const availableMinutes = (endH - startH) * 60;
        const intervalMinutes = availableMinutes / (matchesPerDay + 1); // +1 để thưa ra chút

        // 5. Tạo thời gian
        let scheduleDate = new Date();
        scheduleDate.setDate(scheduleDate.getDate() + dayIndex + 1); // Bắt đầu từ ngày mai
        scheduleDate.setHours(startH, 0, 0, 0); // Đặt giờ về mốc bắt đầu (ví dụ 8:00:00)
        
        // Cộng thêm phút
        scheduleDate.setMinutes(scheduleDate.getMinutes() + (matchInDayIndex + 1) * intervalMinutes);

        return scheduleDate;
    }

    let allMatches = [];

    if (count > 8) {
        // --- THỂ THỨC VÒNG BẢNG ---
        tourney.phase = 'groups';
        let groupCount = Math.ceil(count / 4);
        let brackets = [];
        let allGroupMatchesList = [];

        // Bước 1: Tạo trước danh sách tất cả các cặp đấu để đếm tổng số trận
        for (let g = 0; g < groupCount; g++) {
            let members = players.slice(g * 4, (g + 1) * 4);
            for (let i = 0; i < members.length; i++) {
                for (let j = i + 1; j < members.length; j++) {
                    allGroupMatchesList.push({ g: g, p1: members[i], p2: members[j] });
                }
            }
        }

        // Bước 2: Gán giờ cho từng trận
        let matchCounter = 0;
        const totalMatches = allGroupMatchesList.length;

        for (let g = 0; g < groupCount; g++) {
            let members = players.slice(g * 4, (g + 1) * 4);
            // Lọc ra các trận của bảng này
            let matchesInThisGroup = allGroupMatchesList.filter(m => m.g === g).map(m => {
                const scheduledTime = getSmartSchedule(matchCounter++, totalMatches);
                return {
                    matchId: `G-${matchCounter}`,
                    p1: m.p1, p2: m.p2, winner: null,
                    startTime: scheduledTime
                };
            });
            brackets.push({ groupName: `Bảng ${String.fromCharCode(65 + g)}`, members, matches: matchesInThisGroup });
        }
        tourney.brackets = brackets;

    } else {
        // --- THỂ THỨC KNOCKOUT ---
        tourney.phase = 'knockout';
        const totalMatches = Math.floor(count / 2); // Tổng số trận vòng này

        for (let i = 0; i < count; i += 2) {
            const matchIndex = i / 2;
            const scheduledTime = getSmartSchedule(matchIndex, totalMatches);
            
            allMatches.push({
                matchId: `KO-${i}`,
                p1: players[i],
                p2: players[i+1] || "BYE",
                winner: players[i+1] ? null : players[i],
                startTime: scheduledTime
            });
        }
        tourney.brackets = allMatches;
    }

    tourney.status = 'playing';
    tourney.durationDays = days; // Lưu lại để dùng nếu cần
    await tourney.save();
    
    // Gửi thông báo cho toàn server
    io.emit('adminNotification', { title: '📣 GIẢI ĐẤU BẮT ĐẦU', message: 'Lịch thi đấu đã được công bố! Hãy kiểm tra giờ thi đấu của bạn.' });
    
    res.json({ message: `Đã lập lịch thành công! Khung giờ: ${startH}h - ${endH}h trong ${days} ngày.` });
});
app.post('/api/admin/advance-to-knockout', async (req, res) => {
    const tourney = await Tournament.findOne({ status: 'playing', phase: 'groups' });
    if (!tourney) return res.status(400).json({ message: "Không tìm thấy vòng bảng đang đấu!" });

    // 1. Tìm người nhất mỗi bảng
    let winners = [];
    tourney.brackets.forEach(group => {
        let scores = {};
        group.members.forEach(m => scores[m] = 0);
        group.matches.forEach(m => { if(m.winner) scores[m.winner] += 3; });
        let topPlayer = Object.entries(scores).sort((a,b) => b[1] - a[1])[0][0];
        winners.push(topPlayer);
    });

    // 2. Tạo vòng Loại trực tiếp (Knockout)
    let koBrackets = [];
    for (let i = 0; i < winners.length; i += 2) {
        koBrackets.push({ matchId: `FINAL-${i}`, p1: winners[i], p2: winners[i+1] || "BYE", winner: winners[i+1] ? null : winners[i] });
    }

    tourney.phase = 'knockout';
    tourney.brackets = koBrackets;
    await tourney.save();
    io.emit('adminNotification', { title: '⚡ VÒNG LOẠI TRỰC TIẾP', message: 'Các bé xuất sắc nhất đã vào vòng trong!' });
    res.json({ message: "Đã tiến vào vòng Loại trực tiếp!" });
});
app.post('/api/admin/update-user', async (req, res) => {
    const username = normalizeUsername(req.body.username);
    const editableFields = [
        'score', 'chessLevel', 'caroLevel', 'memoryLevel', 'crosswordLevel',
        'englishSpeechLevel', 'detectiveLevel', 'goLevel', 'othelloLevel',
        'storyLevel', 'shapeLevel', 'buildLevel', 'paintingLevel',
        'monopolyLevel', 'vietSpeechLevel', 'musicLevel', 'playtimeLimitMinutes'
    ];

    const updateData = {};
    for (const key of editableFields) {
        if (req.body[key] !== undefined) {
            const max = key === 'score' ? 1_000_000_000 : key === 'playtimeLimitMinutes' ? 1440 : 1000;
            updateData[key] = clampInteger(req.body[key], 0, max, 0);
        }
    }

    try {
        const result = await User.updateOne({ username }, { $set: updateData });
        if (!result.matchedCount) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
        res.json({ message: `Đã cập nhật dữ liệu cho ${username}.` });
    } catch (error) {
        console.error('Lỗi cập nhật user:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật dữ liệu.' });
    }
});
// Lấy danh sách user
app.get('/api/admin/all-users', async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
});
// Tạo user nhanh
app.post('/api/admin/create-user', async (req, res) => {
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || '');
    const role = ['parent', 'child'].includes(req.body.role) ? req.body.role : 'child';
    const requestedParentCode = String(req.body.parentCode || '').trim();

    if (!isValidUsername(username) || username.toLowerCase() === 'admin') {
        return res.status(400).json({ message: 'Tên tài khoản không hợp lệ hoặc đã được dành riêng.' });
    }
    if (password.length < 6 || password.length > 72) {
        return res.status(400).json({ message: 'Mật khẩu phải dài từ 6 đến 72 ký tự.' });
    }

    try {
        const exists = await User.findOne({
            username: { $regex: new RegExp(`^${escapeRegExp(username)}$`, 'i') }
        }).lean();
        if (exists) return res.status(409).json({ message: 'Tên tài khoản đã tồn tại.' });

        let parent = null;
        let parentCode = null;
        if (role === 'parent') {
            parentCode = `P-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        } else if (requestedParentCode) {
            parent = await User.findOne({ role: 'parent', parentCode: requestedParentCode });
            if (!parent) return res.status(400).json({ message: 'Mã phụ huynh không tồn tại.' });
            parentCode = parent.parentCode;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ username, password: hashedPassword, role, parentCode });

        if (parent) {
            await User.updateOne({ _id: parent._id }, { $addToSet: { children: newUser.username } });
        }

        res.status(201).json({
            message: role === 'parent'
                ? `Tạo phụ huynh thành công. Mã liên kết: ${parentCode}`
                : 'Tạo tài khoản trẻ em thành công.'
        });
    } catch (error) {
        console.error('Lỗi tạo user:', error);
        res.status(error?.code === 11000 ? 409 : 500).json({ message: 'Không thể tạo tài khoản.' });
    }
});

// Xóa user
app.post('/api/admin/delete-user', async (req, res) => {
    const username = normalizeUsername(req.body.username);
    if (!username || username.toLowerCase() === 'admin' || username === req.session.user.username) {
        return res.status(400).json({ message: 'Không thể xóa tài khoản quản trị đang dùng.' });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại.' });

    if (user.role === 'parent' && user.parentCode) {
        await User.updateMany({ parentCode: user.parentCode }, { $set: { parentCode: null } });
    }
    await User.updateMany({ children: username }, { $pull: { children: username } });
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'Đã xóa user.' });
});

// Khóa/Mở khóa
app.post('/api/admin/toggle-suspend', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if(user) {
        user.isSuspended = !user.isSuspended;
        await user.save();
        // Nếu khóa, đá socket ra
        if(user.isSuspended) {
             const socketId = Object.keys(io.sockets.sockets).find(id => {
                const s = io.sockets.sockets[id];
                return s.request.session.user?.username === user.username;
            });
            if(socketId) io.to(socketId).emit('accountSuspended', { message: 'Tài khoản bạn đã bị khóa.' });
        }
        res.json({ message: user.isSuspended ? 'Đã khóa' : 'Đã mở khóa' });
    } else res.status(404).json({ message: 'User không tồn tại' });
});

// Reset mật khẩu
app.post('/api/admin/reset-password', async (req, res) => {
    const hashedPassword = await bcrypt.hash("123456", 10);
    await User.updateOne({ username: req.body.username }, { password: hashedPassword });
    res.json({ message: 'Đã reset mật khẩu về 123456' });
});

// Broadcast thông báo
app.post('/api/admin/broadcast', async (req, res) => {
    const message = String(req.body.message || '').trim();
    if (!message) return res.status(400).json({ message: 'Nội dung thông báo không được để trống.' });

    const notification = await Notification.create({
        title: 'Thông Báo Từ Admin',
        content: message,
        type: 'info'
    });
    io.emit('adminNotification', { title: notification.title, message: notification.content, type: notification.type });
    res.json({ message: 'Đã gửi broadcast.' });
});

app.post('/api/admin/send-notification', async (req, res) => {
    const username = normalizeUsername(req.body.username);
    const message = String(req.body.message || '').trim();
    if (!username || !message) {
        return res.status(400).json({ message: 'Thiếu người nhận hoặc nội dung.' });
    }

    const user = await User.findOne({ username }).lean();
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người nhận.' });

    const notification = await Notification.create({
        title: 'Thông báo riêng từ Admin',
        content: message,
        type: 'info',
        targetUsername: username
    });

    const socketId = onlineUsers[username];
    if (socketId) {
        io.to(socketId).emit('adminNotification', {
            title: notification.title,
            message: notification.content,
            type: notification.type
        });
    }
    res.json({ message: socketId ? 'Đã gửi thông báo trực tiếp.' : 'Đã lưu thông báo; người chơi sẽ thấy khi đăng nhập.' });
});

app.post('/api/admin/create-random-batch', async (req, res) => {
    const count = clampInteger(req.body.count, 1, 100, 1);
    const password = 'BotPassword123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const stamp = Date.now().toString(36).toUpperCase();
    const created = [];

    try {
        for (let index = 1; index <= count; index += 1) {
            const suffix = `${stamp}${String(index).padStart(3, '0')}`;
            const parentUsername = `ParentBot_${suffix}`;
            const childUsername = `ChildBot_${suffix}`;
            const parentCode = `P-${suffix}`;

            await User.create({
                username: parentUsername,
                password: hashedPassword,
                role: 'parent',
                parentCode,
                children: [childUsername]
            });
            await User.create({
                username: childUsername,
                password: hashedPassword,
                role: 'child',
                parentCode
            });
            created.push({ parentUsername, childUsername, parentCode });
        }

        res.status(201).json({
            message: `Đã tạo ${created.length} cặp bot. Mật khẩu chung: ${password}`,
            created
        });
    } catch (error) {
        console.error('Lỗi tạo bot hàng loạt:', error);
        res.status(500).json({
            message: `Đã tạo ${created.length}/${count} cặp trước khi gặp lỗi.`
        });
    }
});

app.post('/api/admin/transfer-child', async (req, res) => {
    const childUsername = normalizeUsername(req.body.childUsername);
    const newParentCode = String(req.body.newParentCode || '').trim();

    const [child, newParent] = await Promise.all([
        User.findOne({ username: childUsername, role: 'child' }),
        User.findOne({ parentCode: newParentCode, role: 'parent' })
    ]);

    if (!child) return res.status(404).json({ message: 'Không tìm thấy tài khoản trẻ em.' });
    if (!newParent) return res.status(404).json({ message: 'Không tìm thấy phụ huynh mới.' });

    if (child.parentCode) {
        await User.updateMany(
            { role: 'parent', parentCode: child.parentCode },
            { $pull: { children: child.username } }
        );
    }

    child.parentCode = newParent.parentCode;
    await child.save();
    await User.updateOne({ _id: newParent._id }, { $addToSet: { children: child.username } });

    res.json({ message: `Đã chuyển ${child.username} sang phụ huynh mới.` });
});

// Giao nhiệm vụ (Quest) - Đã khôi phục logic lưu vào DB
// Giao nhiệm vụ (Quest) - Đã sửa lỗi biến timeLimit
app.post('/api/admin/assign-quest', async (req, res) => {
    const { username, taskType, target, reward, penalty, timeLimit } = req.body;
    const user = await User.findOne({ username });

    if (user) {
        // Thêm nhiệm vụ mới vào mảng quests của người dùng
        user.quests.push({
            id: 'q' + Date.now(), 
            startTime: Date.now(),
            taskType, 
            target: parseInt(target), 
            reward: parseInt(reward), 
            penalty: parseInt(penalty || 0), 
            timeLimit: parseInt(timeLimit || 0), 
            progress: 0,
            // --- DÒNG QUAN TRỌNG NHẤT: Đánh dấu đây KHÔNG PHẢI nhiệm vụ hàng ngày ---
            isDaily: false 
        });

        // Báo cho Mongoose biết mảng đã thay đổi để nó thực hiện lưu
        user.markModified('quests');
        await user.save();

        res.json({ message: 'Giao nhiệm vụ thành công!' });
    } else {
        res.status(404).json({ message: 'Không tìm thấy người chơi!' });
    }
});
app.get('/api/admin/maintenance-status', (req, res) => res.json({ maintenanceMode }));
app.post('/api/admin/maintenance-toggle', (req, res) => {
    maintenanceMode = !maintenanceMode;
    if(maintenanceMode) {
        io.emit('maintenanceModeOn', { message: 'Server đang bảo trì!' });
    } else {
        io.emit('maintenanceModeOff', { message: 'Server đã mở lại!' });
    }
    res.json({ maintenanceMode });
});
// 1. Lấy thông tin giải đấu hiện tại
app.get('/api/tournament/status', async (req, res) => {
    const tourney = await Tournament.findOne({ status: { $ne: 'finished' } });
    res.json(tourney || { status: 'none' });
});

// 2. Bé đăng ký tham gia
app.post('/api/tournament/join', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: "Bé cần đăng nhập nhé!" });
    const tourney = await Tournament.findOne({ status: 'open' });
    if (!tourney) return res.status(404).json({ message: "Hiện không có giải nào mở đăng ký." });
    const result = await Tournament.updateOne(
    { status: 'open', participants: { $ne: req.session.user.username } }, // Chỉ update nếu chưa có tên trong mảng
    { $addToSet: { participants: req.session.user.username } }            // Thêm vào mảng và đảm bảo không trùng
);

if (result.modifiedCount > 0) {
    res.json({ message: "Đăng ký thành công! Hãy đợi Admin chia bảng." });
} else {
    res.json({ message: "Bé đã đăng ký giải này rồi nhé!" });
}
    });
// --- LOGIC NHIỆM VỤ (Đã sửa để khớp với Database) ---
// --- 7. API GAME WIN (LƯU ĐIỂM VÀO DB) ---
function updateQuestProgress(user, taskType, performance = { timeTaken: 0, isWin: true }) {
    if (!user.quests || user.quests.length === 0) return;

    // Duyệt ngược mảng từ cuối lên đầu để xóa phần tử an toàn
    for (let i = user.quests.length - 1; i >= 0; i--) {
        let q = user.quests[i];

        // So khớp tên nhiệm vụ (Ví dụ: "Kiểm Tra" hoặc "Cờ Vua")
        if (q.taskType === taskType || taskType.includes(q.taskType)) {
            
            // 1. XỬ LÝ PHẠT ĐIỂM (Nếu nhiệm vụ có giới hạn thời gian và bé làm quá giờ)
            if (q.timeLimit > 0 && performance.timeTaken > q.timeLimit) {
                const p = parseInt(q.penalty || 20);
                
                // Trừ điểm nhưng đảm bảo không bao giờ bị âm dưới 0
                user.score = Math.max(0, user.score - p); 
                
                user.history.push({ 
                    activity: `⚠️ Thất bại NV ${q.taskType}: Làm quá giờ quy định (-${p}đ)`,
                    timestamp: new Date()
                });

                // Xóa nhiệm vụ này đi vì bé đã thất bại (phải giao lại nhiệm vụ mới)
                user.quests.splice(i, 1);
                continue; // Chuyển sang nhiệm vụ tiếp theo
            }

            // 2. XỬ LÝ CỘNG TIẾN ĐỘ (Nếu bé đạt điều kiện thắng/qua bài)
            if (performance.isWin) {
                q.progress += 1;

                // Kiểm tra xem bé đã làm đủ số lần mục tiêu chưa (Ví dụ: cần làm 1 lần)
                if (q.progress >= q.target) {
                    const r = parseInt(q.reward || 0);
                    
                    // Cộng điểm thưởng hoàn thành nhiệm vụ
                    user.score += r;
                    
                    user.history.push({ 
                        activity: `🎉 Hoàn thành xuất sắc NV ${q.taskType}: Thưởng +${r}đ`,
                        timestamp: new Date() 
                    });

                    // Hoàn thành xong thì xóa nhiệm vụ khỏi danh sách cho sạch ba lô
                    user.quests.splice(i, 1);
                }
            }
        }
    }
}
async function handleWin(req, res, gameKey, points = 10, taskName = '') {
    if (!req.session.user) return res.status(401).json({ message: 'Chưa đăng nhập.' });

    try {
        const user = await User.findOne({ username: req.session.user.username });
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người chơi.' });
        if (user.isSuspended) return res.status(403).json({ message: 'Tài khoản đã bị khóa.' });

        const finishedLevel = clampInteger(req.body.level, 1, 1000, 1);
        const currentMaxLevel = Math.max(1, user[gameKey] || 1);

        if (finishedLevel > currentMaxLevel) {
            return res.status(400).json({
                message: `Tiến trình không hợp lệ. Hãy hoàn thành cấp ${currentMaxLevel} trước.`
            });
        }

        let addedScore = 0;
        let isNewLevel = false;

        if (finishedLevel === currentMaxLevel) {
            user.score = Math.max(0, user.score || 0) + points;
            user[gameKey] = currentMaxLevel + 1;
            addedScore = points;
            isNewLevel = true;
            user.history.push({
                activity: `🎮 Hoàn thành ${taskName || gameKey} cấp ${finishedLevel}: +${points}đ`,
                timestamp: new Date()
            });
        }

        updateQuestProgress(user, taskName, {
            timeTaken: clampInteger(req.body.timeTaken, 0, 24 * 60 * 60, 0),
            isWin: true
        });

        if (user.history.length > 300) {
            user.history = user.history.slice(-300);
        }

        user.lastActiveAt = new Date();
        user.markModified('quests');
        await user.save();

        res.json({
            message: isNewLevel ? `Chúc mừng! +${points}💎` : 'Bạn đã hoàn thành cấp này trước đó rồi!',
            newScore: user.score,
            addedPoints: addedScore,
            newLevel: user[gameKey]
        });
    } catch (error) {
        console.error(`Lỗi lưu chiến thắng ${gameKey}:`, error);
        res.status(500).json({ message: 'Không thể lưu kết quả trận đấu.' });
    }
}
// --- HÀM TÍNH ĐIỂM THÔNG MINH (CÀNG KHÓ CÀNG NHIỀU QUÀ) ---
// basePoints: Điểm cơ bản của game đó (ví dụ Cờ Vua là 50, Caro là 20)
function getDynamicScore(level, basePoints) {
    if (level <= 20) return basePoints;             // Cấp 1-20: Giữ nguyên
    if (level <= 50) return Math.floor(basePoints * 1.5); // Cấp 21-50: Tăng 50%
    if (level <= 80) return basePoints * 2;   
    if (level <= 100) return basePoints * 3; 
    if (level <= 150) return basePoints * 4;
    if (level <= 200) return basePoints * 5;
    if (level <= 300) return basePoints * 6;
    if (level <= 400) return basePoints * 7;
    if (level <= 500) return basePoints * 8; 
    if (level <= 600) return basePoints * 9;
    return basePoints *10 ;                          // Cấp 81-100: Nhân ba
}

// Hàm xử lý chung để code gọn gàng
const handleGameWin = (req, res, gameKey, basePoints, taskName) => {
    const level = parseInt(req.body.level) || 1;
    const finalScore = getDynamicScore(level, basePoints);
    handleWin(req, res, gameKey, finalScore, taskName);
};
// Cập nhật các dòng gọi API để truyền thêm Tên Nhiệm Vụ (Tham số thứ 3)
// --- DANH SÁCH API GAME (ĐÃ ÁP DỤNG TĂNG ĐIỂM THEO CẤP) ---

// 1. Nhóm Tư Duy & Logic
app.post('/api/game/chess-win-level', (req, res) => handleGameWin(req, res, 'chessLevel', 50, 'Cờ Vua'));     // 50 -> 150đ
app.post('/api/game/go-win', (req, res) => handleGameWin(req, res, 'goLevel', 30, 'Cờ Vây'));                // 30 -> 90đ
app.post('/api/game/othello-win', (req, res) => handleGameWin(req, res, 'othelloLevel', 25, 'Phục Kích'));   // 25 -> 75đ
app.post('/api/game/caro-win', (req, res) => handleGameWin(req, res, 'caroLevel', 20, 'Cờ Caro'));           // 20 -> 60đ

// 2. Nhóm Sáng Tạo & Ngôn Ngữ
app.post('/api/game/story-win', (req, res) => handleGameWin(req, res, 'storyLevel', 30, 'Sáng Tác'));        // 30 -> 90đ
app.post('/api/game/english-speech-win', (req, res) => handleGameWin(req, res, 'englishSpeechLevel', 15, 'Tiếng Anh')); 
app.post('/api/game/viet-speech-win', (req, res) => handleGameWin(req, res, 'vietSpeechLevel', 15, 'Luyện Nói Việt'));

// 3. Nhóm Giải Trí & Kỹ Năng
app.post('/api/game/music-win', (req, res) => handleGameWin(req, res, 'musicLevel', 20, 'Âm Nhạc'));
app.post('/api/game/detective-win', (req, res) => handleGameWin(req, res, 'detectiveLevel', 20, 'Thám tử'));
app.post('/api/game/shape-win', (req, res) => handleGameWin(req, res, 'shapeLevel', 20, 'Ghép Hình'));
app.post('/api/game/build-win', (req, res) => handleGameWin(req, res, 'buildLevel', 30, 'Xây Dựng'));
app.post('/api/game/memory-win', (req, res) => handleGameWin(req, res, 'memoryLevel', 15, 'Trí Nhớ'));
app.post('/api/game/crossword-win', (req, res) => handleGameWin(req, res, 'crosswordLevel', 15, 'Ô Chữ'));
//--- API MỚI: LẤY ĐỀ THI TRẮC NGHIỆM ---
// --- 1. API LẤY ĐỀ THI (Lấy 10 câu ngẫu nhiên & Lưu đáp án vào Session) ---
app.get('/api/test', (req, res) => {
    const { subject, grade, difficulty } = req.query;

    // Kiểm tra dữ liệu
    if (!tests[subject]) return res.status(404).json({ message: "Chưa có môn này." });
    const gradeKey = 'grade' + grade;
    if (!tests[subject][gradeKey]) return res.status(404).json({ message: `Chưa có lớp ${grade} cho môn này.` });
    
    // Lấy ngân hàng câu hỏi gốc
    const allQuestions = tests[subject][gradeKey][difficulty];
    if (!allQuestions || allQuestions.length === 0) {
        return res.status(404).json({ message: "Chưa có câu hỏi ở mức độ này." });
    }

    // TRỘN NGẪU NHIÊN VÀ LẤY 10 CÂU
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 10);

    // --- QUAN TRỌNG: Lưu đáp án đúng vào Session của người dùng ---
    // Để lát nữa chấm điểm mà không cần gửi đáp án về máy khách (chống gian lận)
    const answerKey = {};
    shuffled.forEach(q => {
        answerKey[q.id] = q.correct;
    });
    req.session.currentTestAnswers = answerKey;
    req.session.testStartTime = Date.now();
    req.session.save(); // Lưu session ngay lập tức

    // Gửi câu hỏi về cho người dùng (Ẩn đáp án đúng đi)
    const questionsForClient = shuffled.map(q => ({
        id: q.id,
        q: q.q,
        a: q.a
    }));

    res.json(questionsForClient);
});

// --- 2. API CHẤM ĐIỂM (So sánh với Session & Trả về kết quả chi tiết) ---
app.post('/api/submit-test', async (req, res) => {
    const startTime = req.session.testStartTime;
    const now = Date.now();
    
    // Kiểm tra thời gian (cho phép tối đa 16 phút để trừ hao lag mạng nếu bé làm bài 15 phút)
    if (!startTime || (now - startTime) > 16 * 60 * 1000) { 
        return res.status(400).json({ 
            score: 0, 
            message: "Bài thi không hợp lệ do quá thời gian quy định!" 
        });
    }

    const { answers } = req.body; 
    const correctKeys = req.session.currentTestAnswers; 

    if (!correctKeys) {
        return res.status(400).json({ score: 0, total: 0, message: "Lỗi phiên làm việc. Hãy tải lại trang!" });
    }

    let score = 0;
    let total = Object.keys(correctKeys).length;
    let details = {}; 

    // 1. Duyệt chấm điểm từng câu
    for (let [questionId, correctAnswer] of Object.entries(correctKeys)) {
        const userAnswer = answers[questionId];
        const isCorrect = userAnswer === correctAnswer;
        if (isCorrect) score += 1;
        
        details[questionId] = {
            correct: correctAnswer,
            userChosen: userAnswer,
            isCorrect: isCorrect
        };
    }

    // 2. Xử lý cộng điểm và Cập nhật Nhiệm vụ (Nếu đã đăng nhập)
    if (req.session.user) {
        try {
            const user = await User.findOne({ username: req.session.user.username });
            if(user) {
                // Tính thời gian làm bài thực tế (đổi ra giây)
                const timeTaken = Math.floor((now - startTime) / 1000);

                // Cộng điểm bài thi gốc (Mỗi câu đúng 10 điểm)
                user.score += score * 10; 

                // --- CẬP NHẬT NHIỆM VỤ "Kiểm Tra" ---
                // Điều kiện tính là hoàn thành 1 lần: Đúng từ 5 câu trở lên (>= 50%)
                const isPassed = score >= (total / 2); 
                
                // Gọi hàm cập nhật nhiệm vụ (Tự động cộng thưởng hoặc phạt nếu quá giờ)
                updateQuestProgress(user, 'Kiểm Tra', { timeTaken: timeTaken, isWin: isPassed });

                // Lưu lịch sử
                user.history.push({ 
                    activity: `Thi trắc nghiệm: ${score}/${total} câu đúng (${timeTaken}s)`, 
                    timestamp: new Date() 
                });

                // Quan trọng: Đánh dấu mảng quests đã thay đổi để MongoDB lưu được
                user.markModified('quests'); 
                await user.save();
            }
        } catch (dbError) {
            console.error("Lỗi cập nhật nhiệm vụ khi thi:", dbError);
        }
    }

    // 3. Phản hồi kết quả về máy bé
    let msg = score === total ? "Xuất sắc! 🌟" : (score >= total/2 ? "Làm tốt lắm! 👍" : "Cố gắng lần sau nhé! 💪");
    
    // Dọn dẹp session bài thi
    delete req.session.testStartTime;
    delete req.session.currentTestAnswers;
    req.session.save();

    res.json({ 
        score: score, 
        total: total, 
        message: msg,
        details: details 
    });
});
// --- API MỚI: RESET TOÀN BỘ LEVEL ---
app.post('/api/admin/reset-all-levels', async (req, res) => {
    // 1. Chặn nếu không phải admin
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Không có quyền truy cập!' });
    }

    try {
        // 2. Cập nhật tất cả user có vai trò là 'child'
        await User.updateMany({ role: 'child' }, { 
            $set: {
                chessLevel: 1, caroLevel: 1, goLevel: 1, othelloLevel: 1, monopolyLevel: 1,
                memoryLevel: 1, crosswordLevel: 1, detectiveLevel: 1, shapeLevel: 1,
                buildLevel: 1, storyLevel: 1, paintingLevel: 1,
                vietSpeechLevel: 1, englishSpeechLevel: 1
            }
        });
        res.json({ message: '✅ Đã reset cấp độ của tất cả các bé về 1!' });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi hệ thống: ' + e.message });
    }
});
// --- API NGÔI NHÀ CỦA BÉ ---
// --- API MỚI: TẢI NHÀ CỦA BẠN BÈ ĐỂ ĐI THĂM ---
app.get('/api/house/visit/:friendUsername', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Chưa đăng nhập' });
    try {
        const friend = await User.findOne({ username: req.params.friendUsername });
        if (!friend) return res.status(404).json({ message: 'Không tìm thấy người bạn này!' });

        res.json({ 
            friendName: friend.username,
            houseData: friend.houseData || []
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});
// 1. Lấy thông tin nhà và Shop
app.get('/api/house/info', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Chưa đăng nhập' });
    
    try {
        const user = await User.findOne({ username: req.session.user.username });
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        res.json({ 
            // Bổ sung || để đảm bảo luôn có dữ liệu trả về, không bị undefined
            username: user.username,
            score: user.score || 0,
            inventory: user.inventory || [],
            houseData: user.houseData || [],
            chestsData: user.chestsData || {},
            shopItems: SHOP_ITEMS // Đảm bảo biến SHOP_ITEMS đã được khai báo ở trên
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
});
// 2. Mua đồ
app.post('/api/house/buy', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Chưa đăng nhập' });
    const { itemId } = req.body;
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    const user = await User.findOne({ username: req.session.user.username });

    if (!item) return res.status(400).json({ message: "Vật phẩm không tồn tại" });
    if (user.score < item.price) return res.status(400).json({ message: "Bé không đủ điểm rồi!" });
    
    // Trừ điểm và thêm vào kho
    user.score -= item.price;
    user.inventory.push(itemId);
    await user.save();

    res.json({ message: `Đã mua ${item.name}!`, newScore: user.score });
});

// 3. Lưu vị trí đồ đạc (ĐÃ FIX LỖI CƯỚP NHÀ)
app.post('/api/house/save', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Chưa đăng nhập' });
    const { username, items, inventory, chestsData } = req.body;    
    
    // BẢO MẬT: Chặn không cho lưu nếu tên chủ nhà (gửi từ frontend) khác với tên người đang đăng nhập
    if (username && username !== req.session.user.username) {
        return res.status(403).json({ message: "Bạn chỉ có thể lưu khi ở nhà của chính mình!" });
    }

    await User.updateOne(
        { username: req.session.user.username }, 
        { $set: { houseData: items, inventory: inventory, chestsData: chestsData || {} } } 
    );
    res.json({ message: "Đã lưu ngôi nhà và kho đồ!" });
});
// =================================================================
// --- 8. SOCKET.IO (KHÔI PHỤC LOGIC CARO/CHESS CHI TIẾT) ---
// =================================================================

io.on('connection', (socket) => {
    const sessionUser = socket.request.session.user;
    if (sessionUser) {
        onlineUsers[sessionUser.username] = socket.id; // Lưu lại socketId của bé
    }

    socket.on('disconnect', () => {
        if (sessionUser) delete onlineUsers[sessionUser.username]; // Xóa khi bé thoát
    });
    const username = sessionUser ? sessionUser.username : `Khách-${socket.id.substr(0,4)}`;

    // Kiểm tra bảo trì khi vừa connect
    if (maintenanceMode && (!sessionUser || sessionUser.role !== 'admin')) {
        socket.emit('maintenanceModeOn', { message: 'Server đang bảo trì' });
        socket.disconnect();
        return;
    }
socket.on('join3DHouse', (hostUsername) => {
        // Rời phòng cũ nếu có
        if (socket.houseRoom) {
            socket.leave(socket.houseRoom);
            socket.to(socket.houseRoom).emit('playerLeftHouse', socket.id);
        }
        
        const roomId = `house-${hostUsername}`;
        socket.join(roomId);
        socket.houseRoom = roomId;

        // Báo cho những người trong phòng biết có người mới vào
        socket.to(roomId).emit('playerJoinedHouse', { 
            id: socket.id, 
            username: sessionUser?.username || 'Khách' 
        });
    });

    // 2. Đồng bộ vị trí di chuyển
    socket.on('move3DPlayer', (posData) => {
        if(socket.houseRoom) {
            socket.to(socket.houseRoom).emit('updatePlayerPos', { id: socket.id, pos: posData });
        }
    });

    // 3. Đồng bộ Đặt gạch (Xây)
    socket.on('build3DBlock', (data) => {
        if(socket.houseRoom) socket.to(socket.houseRoom).emit('syncBuild', data);
    });

    // 4. Đồng bộ Đập gạch (Phá)
    socket.on('break3DBlock', (uniqueId) => {
        if(socket.houseRoom) socket.to(socket.houseRoom).emit('syncBreak', uniqueId);
    });
// 5. Đồng bộ Đóng/Mở cửa
    socket.on('toggle3DDoor', (data) => {
        if(socket.houseRoom) {
            socket.to(socket.houseRoom).emit('syncDoor', data);
        }
    });
    // --- GAME TÌM TRẬN ---
// --- GAME TÌM TRẬN (SỬA LỖI ĐI TRƯỚC/SAU) ---
socket.on('findMatch', (gameType) => {
    if (waitingPlayers[gameType]) {
        const opponent = waitingPlayers[gameType];
        const roomId = `room-${opponent.id}-${socket.id}`;
        delete waitingPlayers[gameType];
        
        socket.join(roomId); opponent.join(roomId);

        // Tạo phòng: opponent là người tạo (Trắng), socket là người vào (Đen)
        gameRooms[roomId] = {
            gameType,
            players: [opponent.id, socket.id],
            playerNames: { [opponent.id]: sessionUser?.username || 'P1', [socket.id]: username },
            turn: opponent.id // Lượt đầu tiên là của người tạo phòng
        };

        // Gửi cho người tạo phòng (Trắng - Đi trước)
        opponent.emit('matchFound', { 
            room: roomId, 
            role: 'w', // w = White
            opponent: username,
            yourTurn: true // CHÍNH XÁC: Trắng đi trước
        });

        // Gửi cho người vào sau (Đen - Đi sau)
        io.to(socket.id).emit('matchFound', { 
            room: roomId, 
            role: 'b', // b = Black
            opponent: sessionUser?.username || 'P2',
            yourTurn: false // CHÍNH XÁC: Đen đi sau
        });

    } else {
        waitingPlayers[gameType] = socket;
        socket.emit('waiting', { message: 'Đang tìm đối thủ...' });
    }
});
// --- LOGIC ĐẤU TOÁN PVP ---
const mathWaitingPlayers = {}; // Lưu danh sách chờ theo khối lớp { 1: socket, 2: socket }

socket.on('findMathMatch', async (data = {}) => {
    if (!sessionUser) {
        return socket.emit('statusUpdate', { message: '❌ Vui lòng đăng nhập trước khi tìm trận.' });
    }

    const grade = clampInteger(data.grade, 1, 12, 1);
    const gradeKey = `grade${grade}`;
    if (!tests.toan?.[gradeKey]?.easy?.length) {
        return socket.emit('statusUpdate', { message: `❌ Chưa có bộ câu hỏi Toán lớp ${grade}.` });
    }

    try {
        const user = await User.findOne({ username: sessionUser.username }).select('score isSuspended');
        if (!user || user.isSuspended) {
            return socket.emit('statusUpdate', { message: '❌ Tài khoản không thể tham gia lúc này.' });
        }
        if (user.score < 100) {
            return socket.emit('statusUpdate', { message: '❌ Bạn không đủ 100 điểm để tham gia cược!' });
        }

        const queuedOpponent = mathWaitingPlayers[grade];
        const opponentSession = queuedOpponent?.request?.session?.user;
        if (queuedOpponent && queuedOpponent.connected && opponentSession && queuedOpponent.id !== socket.id) {
            delete mathWaitingPlayers[grade];

            const opponentUser = await User.findOne({
                username: opponentSession.username,
                score: { $gte: 100 },
                isSuspended: false
            }).select('score');

            if (!opponentUser) {
                queuedOpponent.emit('statusUpdate', { message: '❌ Không còn đủ điểm để tham gia trận.' });
                mathWaitingPlayers[grade] = socket;
                return socket.emit('statusUpdate', { message: `🔍 Đang tìm đối thủ lớp ${grade}...` });
            }

            const debitCurrent = await User.updateOne(
                { username: sessionUser.username, score: { $gte: 100 } },
                {
                    $inc: { score: -100 },
                    $push: { history: { activity: `Cược 100đ tham gia Đấu Toán lớp ${grade}`, timestamp: new Date() } }
                }
            );
            if (!debitCurrent.modifiedCount) {
                return socket.emit('statusUpdate', { message: '❌ Số điểm vừa thay đổi, vui lòng thử lại.' });
            }

            const debitOpponent = await User.updateOne(
                { username: opponentSession.username, score: { $gte: 100 } },
                {
                    $inc: { score: -100 },
                    $push: { history: { activity: `Cược 100đ tham gia Đấu Toán lớp ${grade}`, timestamp: new Date() } }
                }
            );
            if (!debitOpponent.modifiedCount) {
                await User.updateOne(
                    { username: sessionUser.username },
                    { $inc: { score: 100 }, $push: { history: { activity: 'Hoàn lại 100đ do đối thủ không đủ điều kiện', timestamp: new Date() } } }
                );
                mathWaitingPlayers[grade] = socket;
                return socket.emit('statusUpdate', { message: `🔍 Đối thủ rời hàng chờ, đang tìm người khác...` });
            }

            const roomId = `math-${queuedOpponent.id}-${socket.id}`;
            socket.join(roomId);
            queuedOpponent.join(roomId);

            gameRooms[roomId] = {
                gameType: 'math',
                players: {
                    [queuedOpponent.id]: { username: opponentSession.username, score: 0, answers: [] },
                    [socket.id]: { username: sessionUser.username, score: 0, answers: [] }
                },
                round: 1,
                maxRounds: 10,
                grade,
                roundResolved: false
            };

            io.to(roomId).emit('matchFound', {
                room: roomId,
                players: gameRooms[roomId].players,
                stake: 100
            });
            sendNextQuestion(roomId);
        } else {
            mathWaitingPlayers[grade] = socket;
            socket.emit('statusUpdate', { message: `🔍 Đang tìm đối thủ lớp ${grade}...` });
        }
    } catch (error) {
        console.error('Lỗi tìm trận Toán:', error);
        socket.emit('statusUpdate', { message: '❌ Không thể tìm trận lúc này.' });
    }
});

function sendNextQuestion(roomId) {
    const room = gameRooms[roomId];
    if (!room || room.gameType !== 'math') return;

    const gradeKey = `grade${room.grade}`;
    const questions = tests.toan?.[gradeKey]?.easy || [];
    if (!questions.length) {
        io.to(roomId).emit('gameError', { message: 'Không có câu hỏi phù hợp.' });
        return handleMathGameOver(roomId, 'question_error');
    }

    const qData = questions[Math.floor(Math.random() * questions.length)];
    room.currentCorrectAnswer = qData.correct;
    room.roundResolved = false;

    io.to(roomId).emit('newQuestion', {
        question: qData.q,
        options: qData.a,
        round: room.round,
        totalRounds: room.maxRounds
    });
}

socket.on('submitAnswer', async (data = {}) => {
    const room = gameRooms[data.room];
    if (!room || room.gameType !== 'math' || room.roundResolved) return;

    const player = room.players[socket.id];
    if (!player) return;

    const alreadyAnswered = player.answers.some(answer => answer.round === room.round);
    if (alreadyAnswered) return;

    const isCorrect = data.answer === room.currentCorrectAnswer;
    player.answers.push({ round: room.round, answer: data.answer, isCorrect });
    if (isCorrect) player.score += 10;

    const allAnswered = Object.values(room.players).every(p =>
        p.answers.some(answer => answer.round === room.round)
    );

    io.to(data.room).emit('answerProgress', {
        answered: Object.values(room.players).filter(p =>
            p.answers.some(answer => answer.round === room.round)
        ).length,
        total: Object.keys(room.players).length
    });

    if (!allAnswered) return;

    room.roundResolved = true;
    io.to(data.room).emit('roundResult', {
        round: room.round,
        correctAnswer: room.currentCorrectAnswer,
        players: room.players
    });

    setTimeout(() => {
        const latestRoom = gameRooms[data.room];
        if (!latestRoom) return;
        if (latestRoom.round < latestRoom.maxRounds) {
            latestRoom.round += 1;
            sendNextQuestion(data.room);
        } else {
            handleMathGameOver(data.room);
        }
    }, 800);
});

async function handleMathGameOver(roomId, reason = 'completed') {
    const room = gameRooms[roomId];
    if (!room || room.gameType !== 'math') return;

    const playerIds = Object.keys(room.players);
    if (playerIds.length < 2) {
        for (const player of Object.values(room.players)) {
            await User.updateOne(
                { username: player.username },
                { $inc: { score: 100 }, $push: { history: { activity: 'Hoàn lại 100đ do trận Toán bị hủy', timestamp: new Date() } } }
            );
        }
        io.to(roomId).emit('gameOver', { players: room.players, reason });
        delete gameRooms[roomId];
        return;
    }

    const p1 = room.players[playerIds[0]];
    const p2 = room.players[playerIds[1]];

    if (p1.score > p2.score) {
        await User.updateOne(
            { username: p1.username },
            { $inc: { score: 200 }, $push: { history: { activity: '🏆 Thắng Đấu Toán: nhận 200đ', timestamp: new Date() } } }
        );
    } else if (p2.score > p1.score) {
        await User.updateOne(
            { username: p2.username },
            { $inc: { score: 200 }, $push: { history: { activity: '🏆 Thắng Đấu Toán: nhận 200đ', timestamp: new Date() } } }
        );
    } else {
        await User.updateMany(
            { username: { $in: [p1.username, p2.username] } },
            { $inc: { score: 50 }, $push: { history: { activity: '🤝 Hòa Đấu Toán: nhận lại 50đ', timestamp: new Date() } } }
        );
    }

    io.to(roomId).emit('gameOver', { players: room.players, reason });
    delete gameRooms[roomId];
}
socket.on('timeoutLoss', async ({ room, loserUsername }) => {
    const roomData = gameRooms[room];
    if (!roomData || !Array.isArray(roomData.players)) return;

    const winnerId = roomData.players.find(id => id !== socket.id);
    const winnerUsername = roomData.playerNames?.[winnerId];
    if (!winnerUsername) return;

    if (room.startsWith('TOUR-')) {
        await recordTournamentWinner(room, winnerUsername);
    }

    io.to(room).emit('gameOver', {
        winner: winnerUsername,
        reason: 'timeout',
        loser: loserUsername
    });
    await User.updateOne(
        { username: winnerUsername },
        {
            $inc: { score: 20 },
            $push: { history: { activity: '🏆 Thắng do đối thủ hết giờ: +20đ', timestamp: new Date() } }
        }
    );
    delete gameRooms[room];
});
    // --- BỔ SUNG: LOGIC TẠO PHÒNG & VÀO PHÒNG CỜ VUA ---
    
    // 1. Tạo phòng riêng
    socket.on('createChessRoom', () => {
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase(); // Tạo mã 5 ký tự (VD: X7Z9A)
        
        // Lưu thông tin phòng vào bộ nhớ server
        gameRooms[roomId] = {
            gameType: 'chess',
            players: [socket.id],
            playerNames: { [socket.id]: username },
            turn: null // Chưa bắt đầu thì chưa có lượt
        };
        
        socket.join(roomId);
        socket.emit('roomCreated', roomId); // Gửi mã phòng về cho người tạo
    });

    // 2. Vào phòng bằng mã
    socket.on('joinChessRoom', (roomId) => {
        const room = gameRooms[roomId];
    if (!gameRooms[roomId]) {
            gameRooms[roomId] = {
                gameType: 'chess',
                players: [],
                playerNames: {},
                turn: null
            };
        }
        // Kiểm tra phòng có tồn tại và chưa đầy không
        if (room && room.players.length < 2 && room.gameType === 'chess') {
            const opponentId = room.players[0];
            
            // Cập nhật thông tin phòng
            room.players.push(socket.id);
            room.playerNames[socket.id] = username;
            room.turn = opponentId; // Chủ phòng đi trước
            
            socket.join(roomId);

            // Bắt đầu game cho cả 2 người
            // Gửi cho người mới vào (Đi sau - Đen)
            socket.emit('matchFound', { 
                room: roomId, 
                role: 'b', // Black
                opponent: room.playerNames[opponentId],
                yourTurn: false
            });

            // Gửi cho chủ phòng (Đi trước - Trắng)
            io.to(opponentId).emit('matchFound', { 
                room: roomId, 
                role: 'w', // White
                opponent: username,
                yourTurn: true
            });
            
        } else {
            // Gửi thông báo lỗi nếu phòng sai
            socket.emit('notification', '❌ Phòng không tồn tại hoặc đã đầy!');
        }
    });
    // --- LOGIC TẠO PHÒNG & VÀO PHÒNG CARO (MỚI) ---
    
    // 1. Tạo phòng Caro
    socket.on('createCaroRoom', () => {
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase(); 
        gameRooms[roomId] = {
            gameType: 'caro',
            players: [socket.id],
            playerNames: { [socket.id]: username },
            turn: null 
        };
        socket.join(roomId);
        socket.emit('roomCreated', roomId); 
    });

    // 2. Vào phòng Caro
    socket.on('joinCaroRoom', (roomId) => {
if (!gameRooms[roomId]) { // THÊM ĐOẠN NÀY
            gameRooms[roomId] = { gameType: 'caro', players: [], playerNames: {}, turn: null };
        }
        const room = gameRooms[roomId];
        if (room && room.players.length < 2 && room.gameType === 'caro') {
            const opponentId = room.players[0];
            room.players.push(socket.id);
            room.playerNames[socket.id] = username;
            room.turn = opponentId; 
            
            socket.join(roomId);

            // Bắt đầu game: Người tạo đi X (White), Người vào đi O (Black)
            socket.emit('matchFound', { room: roomId, role: 'O', opponent: room.playerNames[opponentId] });
            io.to(opponentId).emit('matchFound', { room: roomId, role: 'X', opponent: username });
        } else {
            socket.emit('notification', '❌ Phòng không tồn tại hoặc đã đầy!');
        }
    });
    // --- LOGIC CARO (KHÔI PHỤC CHI TIẾT) ---
    socket.on('caroMove', ({ room, r, c }) => {
        const gameRoom = gameRooms[room];
        if (gameRoom) {
            // Chuyển lượt
            const nextTurnId = gameRoom.players.find(id => id !== socket.id);
            gameRoom.turn = nextTurnId;
            
            // Gửi nước đi cho cả 2 để update giao diện
            io.to(room).emit('opponentMove', { r, c }); 
            // Cập nhật lượt đi
            io.to(room).emit('turnUpdate', { nextTurnId });
        }
    });

    socket.on('caroWinCustom', ({ roomId }) => {
        const room = gameRooms[roomId];
        if (room) {
            io.to(roomId).emit('caroGameOver', { winnerId: socket.id, winnerName: room.playerNames[socket.id] });
            delete gameRooms[roomId];
        }
    });
    // --- LOGIC CHUYỂN TIẾP NƯỚC ĐI (BẮT BUỘC CHO OTHELLO & CỜ VUA) ---
    socket.on('move', (data) => {
        if (data && data.room && data.move) {
            socket.to(data.room).emit('move', data.move);
        }
    });
    // =========================================================
    // --- LOGIC CỜ VÂY (GO) - MỚI ---
    // =========================================================

    // 1. Tạo phòng Cờ Vây (Lưu kích thước bàn)
    socket.on('createGoRoom', ({ size }) => {
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
        gameRooms[roomId] = {
            gameType: 'go',
            players: [socket.id],
            playerNames: { [socket.id]: username },
            turn: null,
            size: parseInt(size) || 13 // Lưu kích thước bàn
        };
        socket.join(roomId);
        socket.emit('goRoomCreated', roomId);
    });

    // 2. Vào phòng Cờ Vây
    socket.on('joinGoRoom', (roomId) => {
if (!gameRooms[roomId]) { // THÊM ĐOẠN NÀY
            gameRooms[roomId] = { gameType: 'go', players: [], playerNames: {}, turn: null, size: 13 };
        }
        const room = gameRooms[roomId];
        if (room && room.players.length < 2 && room.gameType === 'go') {
            const opponentId = room.players[0];
            room.players.push(socket.id);
            room.playerNames[socket.id] = username;
            room.turn = opponentId; // Chủ phòng đi trước (Đen)
            
            socket.join(roomId);

            // Gửi thông tin bắt đầu (Kèm kích thước bàn của chủ phòng)
            socket.emit('matchFound', { 
                room: roomId, role: 'w', // Người vào là Trắng
                size: room.size,
                opponent: room.playerNames[opponentId] 
            });
            
            io.to(opponentId).emit('matchFound', { 
                room: roomId, role: 'b', // Chủ phòng là Đen
                size: room.size,
                opponent: username 
            });
        } else {
            socket.emit('notification', '❌ Phòng không tồn tại hoặc đã đầy!');
        }
    });

    // 3. Xử lý bỏ lượt (Pass)
    socket.on('goPass', ({ room }) => {
        socket.to(room).emit('opponentPassed');
    });

    // (Giữ nguyên logic move cũ)
    socket.on('goMove', (data) => socket.to(data.room).emit('opponentGoMove', data.move));
    // =========================================================
    // --- LOGIC MONOPOLY (CỜ TỶ PHÚ) - HỖ TRỢ 2-8 NGƯỜI ---
    // =========================================================

    // Hàm phụ trợ: Thêm người chơi vào phòng
    // Đưa mảng màu ra ngoài để dùng chung cho toàn server
const MONOPOLY_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];

function addPlayerToMonopolyRoom(roomId, socket, username) {
    const room = monopolyGames[roomId];
    if (!room) return;
    if (room.players.some(player => player.id === socket.id)) {
        socket.emit('errorMsg', 'Bé đã ở trong phòng này rồi!');
        return;
    }
    if (room.players.some(player => player.username.toLowerCase() === String(username).toLowerCase())) {
        socket.emit('errorMsg', 'Tài khoản này đã tham gia phòng ở một thiết bị khác.');
        return;
    }

    // Lấy màu dựa trên số thứ tự người vào (0 đến 7)
    const colorIndex = room.players.length;
    const assignedColor = MONOPOLY_COLORS[colorIndex] || '#ffffff';

    const player = {
        id: socket.id,
        username: username,
        color: assignedColor,
        money: 1500, // Số tiền chuẩn của cờ tỷ phú thường là 1500
        position: 0,
        isHost: socket.id === room.hostId,
        inJail: false
    };

    room.players.push(player);
    socket.join(roomId);

    // Gửi thông tin sảnh chờ về cho cả phòng
    io.to(roomId).emit('lobbyUpdate', {
        roomId: roomId,
        players: room.players,
        hostId: room.hostId
    });
}
    // 1. Tạo phòng riêng
    socket.on('createMonopolyRoom', () => {
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
        monopolyGames[roomId] = {
            id: roomId,
            hostId: socket.id,
            players: [],
            state: 'waiting', // Trạng thái: đang đợi
            gameLogic: null
        };
        addPlayerToMonopolyRoom(roomId, socket, username);
        socket.emit('roomCreated', roomId);
    });

    // 2. Vào phòng bằng mã
    socket.on('joinMonopolyRoom', (rawRoomId) => {
        const roomId = String(rawRoomId || '').trim().toUpperCase();
        const room = monopolyGames[roomId];
        if (room && room.state === 'waiting') {
            if (room.players.length >= 8) {
                socket.emit('errorMsg', '❌ Phòng đã đầy (Tối đa 8 người)!');
            } else {
                addPlayerToMonopolyRoom(roomId, socket, username);
            }
        } else {
            socket.emit('errorMsg', '❌ Phòng không tồn tại hoặc đang chơi!');
        }
    });

    // 3. Ghép ngẫu nhiên (Tìm phòng đang chờ còn trống)
    socket.on('findMonopolyMatch', () => {
        let foundRoom = null;
        for (const [id, room] of Object.entries(monopolyGames)) {
            if (room.state === 'waiting' && room.players.length < 8) {
                foundRoom = id;
                break;
            }
        }

        if (foundRoom) {
            addPlayerToMonopolyRoom(foundRoom, socket, username);
        } else {
            // Không có phòng nào, tạo phòng mới
            const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
            monopolyGames[roomId] = {
                id: roomId,
                hostId: socket.id,
                players: [],
                state: 'waiting',
                gameLogic: null
            };
            addPlayerToMonopolyRoom(roomId, socket, username);
            socket.emit('statusMsg', 'Đã tạo phòng mới, đang đợi người chơi...');
        }
    });

    async function finishMonopolyGame(roomId, requestedWinnerId = null) {
        const room = monopolyGames[roomId];
        if (!room || room.finishing || room.state !== 'playing' || !room.gameLogic) return false;

        const activePlayers = typeof room.gameLogic.getActivePlayers === 'function'
            ? room.gameLogic.getActivePlayers()
            : room.gameLogic.players.filter(player => !player.isBankrupt && player.money > 0);

        if (activePlayers.length !== 1) return false;
        const winner = activePlayers[0];
        if (requestedWinnerId && winner.id !== requestedWinnerId) return false;

        room.finishing = true;
        room.state = 'finished';
        if (room.auctionInterval) clearInterval(room.auctionInterval);

        let newScore = null;
        let newLevel = null;
        try {
            const user = await User.findOne({
                username: { $regex: `^${escapeRegExp(winner.username)}$`, $options: 'i' }
            });
            if (user) {
                user.score = Math.max(0, Number(user.score) || 0) + 200;
                user.monopolyLevel = Math.max(1, Number(user.monopolyLevel) || 1) + 1;
                user.history.push({
                    activity: `Vô địch Cờ Tỷ Phú - Cấp ${user.monopolyLevel}`,
                    timestamp: new Date()
                });
                if (user.history.length > 200) user.history = user.history.slice(-200);
                await user.save();
                newScore = user.score;
                newLevel = user.monopolyLevel;
            }
        } catch (error) {
            console.error('Không thể lưu thưởng Cờ Tỷ Phú:', error);
        }

        io.to(roomId).emit('monopolyGameOver', {
            winner: winner.username,
            reward: newScore === null ? 0 : 200,
            newScore,
            newLevel
        });
        delete monopolyGames[roomId];
        return true;
    }

    // 4. Chủ phòng BẮT ĐẦU GAME
    socket.on('startMonopoly', (roomId) => {
        const room = monopolyGames[String(roomId || '').trim().toUpperCase()];
        if (!room || room.hostId !== socket.id || room.state !== 'waiting') return;
        if (room.players.length < 2) {
            socket.emit('errorMsg', 'Cần ít nhất 2 người để chơi!');
            return;
        }

        room.state = 'playing';
        room.hasRolled = false;
        room.awaitingDecision = null;
        room.gameLogic = new MonopolyGame(room.id);
        room.gameLogic.players = room.players.map(player => ({
            ...player,
            properties: Array.isArray(player.properties) ? player.properties : [],
            isJailed: Boolean(player.isJailed || player.inJail),
            jailTurns: Number(player.jailTurns) || 0,
            isBankrupt: false
        }));
        room.players = room.gameLogic.players;
        room.gameLogic.state = 'playing';

        io.to(room.id).emit('monopolyUpdate', {
            gameState: 'playing',
            players: room.players,
            turnIndex: 0,
            propertyHouses: {},
            logs: ['🏁 Trận đấu bắt đầu!']
        });
        io.to(room.id).emit('turnChanged', { turn: room.players[0].id });
    });

    // 5. Tung xúc xắc: máy chủ kiểm tra đúng lượt và chỉ cho tung một lần.
    socket.on('rollDice', async (rawRoomId) => {
        const roomId = String(rawRoomId || '').trim().toUpperCase();
        const room = monopolyGames[roomId];
        if (!room || room.state !== 'playing' || !room.gameLogic) return;

        const game = room.gameLogic;
        const player = game.getCurrentPlayer();
        if (!player || player.id !== socket.id) {
            socket.emit('errorMsg', 'Chưa đến lượt của bé!');
            return;
        }
        if (player.isBankrupt) {
            socket.emit('errorMsg', 'Bé đã phá sản trong ván này.');
            return;
        }
        if (room.hasRolled || room.awaitingDecision || room.auction) {
            socket.emit('errorMsg', 'Bé đã tung xúc xắc hoặc đang xử lý một hành động khác.');
            return;
        }

        room.hasRolled = true;
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        io.to(roomId).emit('diceRolled', { d1, d2 });

        const moveRes = game.movePlayer(d1 + d2);
        room.players = game.players;
        io.to(roomId).emit('monopolyUpdate', {
            players: game.players,
            turnIndex: game.turnIndex,
            propertyHouses: game.propertyHouses,
            logs: [moveRes.message]
        });

        if (await finishMonopolyGame(roomId)) return;

        if (moveRes.action === 'buy') {
            room.awaitingDecision = { type: 'buy', playerId: socket.id, tileId: moveRes.player.position };
            socket.emit('askBuyProperty', moveRes.player.position);
        } else {
            io.to(roomId).emit('enableEndTurn');
        }
    });

    // 6. Xử lý mua đất
    socket.on('buyProperty', ({ roomId: rawRoomId, choice }) => {
        const roomId = String(rawRoomId || '').trim().toUpperCase();
        const room = monopolyGames[roomId];
        if (!room || room.state !== 'playing' || !room.gameLogic) return;

        const game = room.gameLogic;
        const player = game.getCurrentPlayer();
        const decision = room.awaitingDecision;
        if (!player || player.id !== socket.id || !room.hasRolled || decision?.type !== 'buy' || decision.playerId !== socket.id) {
            socket.emit('errorMsg', 'Yêu cầu mua đất không hợp lệ.');
            return;
        }

        if (choice === true) {
            const bought = game.buyProperty(decision.tileId);
            if (!bought) {
                socket.emit('errorMsg', 'Không thể mua ô đất này.');
            } else {
                io.to(roomId).emit('monopolyUpdate', {
                    players: game.players,
                    propertyHouses: game.propertyHouses,
                    logs: [`💰 ${player.username} đã mua ${boardData[decision.tileId].name}!`]
                });
            }
        }
        room.awaitingDecision = null;
        socket.emit('enableEndTurn');
    });

    // 7. Kết thúc lượt
    socket.on('endTurn', (rawRoomId) => {
        const roomId = String(rawRoomId || '').trim().toUpperCase();
        const room = monopolyGames[roomId];
        if (!room || room.state !== 'playing' || !room.gameLogic) return;

        const game = room.gameLogic;
        const currentPlayer = game.getCurrentPlayer();
        if (!currentPlayer || currentPlayer.id !== socket.id) {
            socket.emit('errorMsg', 'Chưa đến lượt của bé!');
            return;
        }
        if (!room.hasRolled || room.awaitingDecision || room.auction) {
            socket.emit('errorMsg', 'Bé cần hoàn tất hành động hiện tại trước khi kết thúc lượt.');
            return;
        }

        const nextPlayer = game.nextTurn();
        if (!nextPlayer) return;
        room.hasRolled = false;
        room.awaitingDecision = null;
        io.to(roomId).emit('monopolyUpdate', {
            turnIndex: game.turnIndex,
            players: game.players,
            gameState: 'playing',
            logs: [`👉 Lượt của ${nextPlayer.username}`]
        });
        io.to(roomId).emit('turnChanged', { turn: nextPlayer.id });
    });

    // 8. Client chỉ được yêu cầu xác nhận; máy chủ tự kiểm tra người thắng thật.
    socket.on('monopolyWin', async ({ roomId: rawRoomId, winnerId }) => {
        const roomId = String(rawRoomId || '').trim().toUpperCase();
        if (winnerId !== socket.id || !(await finishMonopolyGame(roomId, socket.id))) {
            socket.emit('errorMsg', 'Chưa đủ điều kiện kết thúc ván đấu.');
        }
    });

    socket.on('buildHouse', ({ roomId: rawRoomId, tileId }) => {
        const roomId = String(rawRoomId || '').trim().toUpperCase();
        const room = monopolyGames[roomId];
        if (!room || room.state !== 'playing' || !room.gameLogic || room.auction) return;

        const game = room.gameLogic;
        const player = game.getCurrentPlayer();
        const safeTileId = clampInteger(tileId, 0, boardData.length - 1, -1);
        if (!player || player.id !== socket.id || safeTileId < 0) {
            socket.emit('errorMsg', 'Yêu cầu xây nhà không hợp lệ.');
            return;
        }

        if (game.buildHouse(safeTileId)) {
            io.to(roomId).emit('monopolyUpdate', {
                players: game.players,
                propertyHouses: game.propertyHouses,
                logs: [`🏗️ ${player.username} đã xây nhà tại ${boardData[safeTileId].name}`]
            });
            socket.emit('buildSuccess', 'Xây nhà thành công!');
        } else {
            socket.emit('errorMsg', 'Bé chưa đủ điều kiện xây nhà ở đây!');
        }
    });

    // --- BỘ MÁY ĐẤU GIÁ ---
    socket.on('startAuction', ({ roomId: rawRoomId, tileId }) => {
        const roomId = String(rawRoomId || '').trim().toUpperCase();
        const room = monopolyGames[roomId];
        if (!room || room.state !== 'playing' || !room.gameLogic || room.auction) return;

        const game = room.gameLogic;
        const player = game.getCurrentPlayer();
        const safeTileId = clampInteger(tileId, 0, boardData.length - 1, -1);
        const tile = boardData[safeTileId];
        const decision = room.awaitingDecision;
        if (!player || player.id !== socket.id || !tile || !['property', 'railroad', 'utility'].includes(tile.type)
            || game.boardState[safeTileId] || decision?.type !== 'buy' || decision.tileId !== safeTileId) {
            socket.emit('errorMsg', 'Không thể mở đấu giá cho ô này.');
            return;
        }

        room.awaitingDecision = null;
        room.auction = {
            tileId: safeTileId,
            highestBid: 10,
            highestBidderId: null,
            highestBidder: null,
            timer: 10
        };
        io.to(roomId).emit('auctionStarted', { tile, auction: room.auction });

        room.auctionInterval = setInterval(() => {
            const liveRoom = monopolyGames[roomId];
            if (!liveRoom?.auction) {
                clearInterval(room.auctionInterval);
                return;
            }
            liveRoom.auction.timer -= 1;
            io.to(roomId).emit('auctionTimer', liveRoom.auction.timer);
            if (liveRoom.auction.timer <= 0) {
                clearInterval(liveRoom.auctionInterval);
                liveRoom.auctionInterval = null;
                endAuction(roomId).catch(error => console.error('Lỗi kết thúc đấu giá:', error));
            }
        }, 1000);
    });

    socket.on('placeBid', ({ roomId: rawRoomId, bidAmount }) => {
        const roomId = String(rawRoomId || '').trim().toUpperCase();
        const room = monopolyGames[roomId];
        if (!room?.auction || room.state !== 'playing' || !room.gameLogic) return;

        const bidder = room.gameLogic.players.find(player => player.id === socket.id && !player.isBankrupt);
        const safeBid = clampInteger(bidAmount, 11, 1000000, 0);
        if (!bidder || safeBid <= room.auction.highestBid || bidder.money < safeBid) {
            socket.emit('errorMsg', 'Mức trả giá không hợp lệ hoặc bé không đủ tiền.');
            return;
        }

        room.auction.highestBid = safeBid;
        room.auction.highestBidderId = bidder.id;
        room.auction.highestBidder = bidder.username;
        room.auction.timer = 6;
        io.to(roomId).emit('auctionUpdate', room.auction);
    });

    async function endAuction(roomId) {
        const room = monopolyGames[roomId];
        if (!room?.auction || !room.gameLogic) return;

        const { tileId, highestBid, highestBidderId, highestBidder } = room.auction;
        const game = room.gameLogic;
        const winner = game.players.find(player => player.id === highestBidderId && !player.isBankrupt);
        const tile = boardData[tileId];

        if (winner && tile && !game.boardState[tileId] && winner.money >= highestBid) {
            winner.money -= highestBid;
            game.boardState[tileId] = winner.id;
            winner.properties = Array.isArray(winner.properties) ? winner.properties : [];
            winner.properties.push(tileId);
            game.log(`🔨 Đấu giá: ${highestBidder} đã mua ${tile.name} với giá $${highestBid}`);
            io.to(roomId).emit('monopolyUpdate', {
                players: game.players,
                propertyHouses: game.propertyHouses,
                logs: game.logs.slice(-3)
            });
        }

        io.to(roomId).emit('auctionEnded');
        delete room.auction;
        room.awaitingDecision = null;
        io.to(roomId).emit('enableEndTurn');
        await finishMonopolyGame(roomId);
    }
    // --- DISCONNECT ---
    socket.on('disconnecting', async () => {
        // Xóa khỏi hàng chờ
        Object.keys(waitingPlayers).forEach(key => {
            if (waitingPlayers[key] === socket) delete waitingPlayers[key];
        });
        Object.keys(mathWaitingPlayers).forEach(key => {
            if (mathWaitingPlayers[key] === socket) delete mathWaitingPlayers[key];
        });
        const idx = monopolyQueue.indexOf(socket.id);
        if(socket.houseRoom) socket.to(socket.houseRoom).emit('playerLeftHouse', socket.id);
        if (idx > -1) monopolyQueue.splice(idx, 1);

        // Xóa khỏi phòng chơi 1vs1 (Caro, Chess...)
        for (const roomId of socket.rooms) {
            if (roomId !== socket.id) {
                const room = gameRooms[roomId];
                if (room) {
                    if (room.gameType === 'math') {
                        const usernames = Object.values(room.players || {}).map(player => player.username);
                        if (usernames.length) {
                            await User.updateMany(
                                { username: { $in: usernames } },
                                {
                                    $inc: { score: 100 },
                                    $push: { history: { activity: 'Hoàn lại 100đ do đối thủ rời trận Đấu Toán', timestamp: new Date() } }
                                }
                            );
                        }
                        io.to(roomId).emit('gameOver', { players: room.players, reason: 'disconnect_refund' });
                    } else if (room.gameType === 'caro') {
                        io.to(roomId).emit('playerLeft', { name: room.playerNames[socket.id] });
                    } else {
                        io.to(roomId).emit('opponentLeft');
                    }
                    delete gameRooms[roomId];
                }
            }
        }

        // Fix lỗi treo phòng Monopoly
        for (const [roomId, game] of Object.entries(monopolyGames)) {
            const pIdx = game.players.findIndex(p => p.id === socket.id);
            if (pIdx !== -1) {
                if (game.auctionInterval) clearInterval(game.auctionInterval);
                io.to(roomId).emit('notification', 'Người chơi đã thoát. Ván game hủy!');
                io.to(roomId).emit('monopolyGameOver', { reason: 'disconnect' });
                delete monopolyGames[roomId];
            }
        }
    });
// =========================================================
    // --- LOGIC OTHELLO (PHỤC KÍCH) - MỚI ---
    // =========================================================

    // 1. Tạo phòng Othello
    socket.on('createOthelloRoom', () => {
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
        gameRooms[roomId] = {
            gameType: 'othello',
            players: [socket.id],
            playerNames: { [socket.id]: username },
            turn: null
        };
        socket.join(roomId);
        socket.emit('othelloRoomCreated', roomId);
    });

    // 2. Vào phòng Othello
    socket.on('joinOthelloRoom', (roomId) => {
if (!gameRooms[roomId]) { // THÊM ĐOẠN NÀY
            gameRooms[roomId] = { gameType: 'othello', players: [], playerNames: {}, turn: null };
        }
        const room = gameRooms[roomId];
        if (room && room.players.length < 2 && room.gameType === 'othello') {
            const opponentId = room.players[0];
            room.players.push(socket.id);
            room.playerNames[socket.id] = username;
            room.turn = opponentId; // Chủ phòng đi trước (Đen)
            
            socket.join(roomId);

            // Gửi thông tin bắt đầu
            // w = Trắng (Người vào sau), b = Đen (Chủ phòng)
            socket.emit('matchFound', { 
                room: roomId, role: 'w', 
                opponent: room.playerNames[opponentId] 
            });
            
            io.to(opponentId).emit('matchFound', { 
                room: roomId, role: 'b', 
                opponent: username 
            });
        } else {
            socket.emit('notification', '❌ Phòng không tồn tại hoặc đã đầy!');
        }
    });

});
// --- HÀM TỰ ĐỘNG QUÉT VÀ XỬ THUA ---
function getTournamentMatches(tourney) {
    if (!Array.isArray(tourney?.brackets)) return [];
    return tourney.brackets.flatMap(entry =>
        Array.isArray(entry?.matches) ? entry.matches : [entry]
    ).filter(Boolean);
}

async function recordTournamentWinner(matchId, winnerUsername) {
    if (!matchId || !winnerUsername) return false;
    const tourney = await Tournament.findOne({
        status: 'playing',
        $or: [
            { 'brackets.matchId': matchId },
            { 'brackets.matches.matchId': matchId }
        ]
    });
    if (!tourney) return false;

    let updated = false;
    for (const entry of tourney.brackets) {
        if (Array.isArray(entry?.matches)) {
            const match = entry.matches.find(item => item.matchId === matchId);
            if (match && !match.winner) {
                match.winner = winnerUsername;
                updated = true;
                break;
            }
        } else if (entry?.matchId === matchId && !entry.winner) {
            entry.winner = winnerUsername;
            updated = true;
            break;
        }
    }

    if (updated) {
        tourney.markModified('brackets');
        await tourney.save();
        io.emit('tournamentUpdated');
    }
    return updated;
}

async function autoCheckForfeit() {
    try {
        const now = new Date();
        const tourney = await Tournament.findOne({ status: 'playing' });
        if (!tourney) return;

        let hasChange = false;
        for (const match of getTournamentMatches(tourney)) {
            if (!match.winner && match.startTime) {
                const startTime = new Date(match.startTime);
                const diffInMinutes = (now - startTime) / (1000 * 60);
                if (diffInMinutes > 10) {
                    match.winner = 'Hòa (Cùng vắng mặt)';
                    hasChange = true;
                    console.log(`[Tournament] Tự động đóng trận ${match.matchId} do quá giờ.`);
                }
            }
        }

        if (hasChange) {
            tourney.markModified('brackets');
            await tourney.save();
            io.emit('tournamentUpdated');
        }
    } catch (error) {
        console.error('Lỗi tự động xử lý bỏ trận:', error);
    }
}

async function sendMatchReminders() {
    try {
        const now = new Date();
        const tourney = await Tournament.findOne({ status: 'playing' });
        if (!tourney) return;

        for (const match of getTournamentMatches(tourney)) {
            if (!match.winner && match.startTime) {
                const startTime = new Date(match.startTime);
                const diffInMinutes = (startTime - now) / (1000 * 60);
                if (diffInMinutes > 4 && diffInMinutes <= 5) {
                    const timeText = startTime.toLocaleTimeString('vi-VN', {
                        timeZone: 'Asia/Ho_Chi_Minh',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    for (const playerUsername of [match.p1, match.p2]) {
                        const socketId = onlineUsers[playerUsername];
                        if (socketId) {
                            io.to(socketId).emit('matchNotice', {
                                title: '🔔 NHẮC HẸN THI ĐẤU',
                                message: `Trận ${tourney.gameType.toUpperCase()} sắp bắt đầu lúc ${timeText}!`,
                                type: 'warning'
                            });
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Lỗi gửi nhắc lịch thi đấu:', error);
    }
}
setInterval(sendMatchReminders, 60000);
setInterval(autoCheckForfeit, 60000);
function calculateAutoSchedule(matchIndex, totalMatches, startH, endH, days) {
    const matchesPerDay = Math.ceil(totalMatches / days);
    const dayIndex = Math.floor(matchIndex / matchesPerDay);
    const matchInDayIndex = matchIndex % matchesPerDay;

    // Tính khoảng cách giữa các trận trong khung giờ (đổi ra phút)
    const availableMinutes = (endH - startH) * 60;
    const intervalMinutes = availableMinutes / (matchesPerDay + 1);

    let scheduleDate = new Date();
    // Bắt đầu từ ngày mai để các bé có thời gian chuẩn bị
    scheduleDate.setDate(scheduleDate.getDate() + dayIndex + 1); 
    scheduleDate.setHours(startH, 0, 0, 0);
    scheduleDate.setMinutes((matchInDayIndex + 1) * intervalMinutes);

    return scheduleDate;
}

async function autoStartTourneyLogic() {
    try {
        const now = new Date();
        // 1. Tìm giải đấu đang mở đăng ký mà đã đến/quá hạn chót
        const tourney = await Tournament.findOne({ 
            status: 'open', 
            registrationDeadline: { $lte: now } 
        });

        if (!tourney) return; // Không có giải nào hết hạn thì thoát

        // 2. Kiểm tra số lượng người tham gia
        if (tourney.participants.length < 2) {
            console.log(`[System] Giải ${tourney.gameType} không đủ người ( < 2). Tự động hủy.`);
            tourney.status = 'finished';
            await tourney.save();
            io.emit('adminNotification', { title: '❌ HỦY GIẢI ĐẤU', message: `Môn ${tourney.gameType.toUpperCase()} bị hủy do không đủ người tham gia.` });
            return;
        }

        console.log(`[System] Đang tự động lập lịch cho giải: ${tourney.gameType}`);
        
        // Trộn ngẫu nhiên danh sách thí sinh
        const players = [...tourney.participants].sort(() => Math.random() - 0.5);
        const count = players.length;
        const { dailyStartHour, dailyEndHour, durationDays } = tourney;

        // 3. CHIA BẢNG DỰA TRÊN SỐ NGƯỜI
        if (count > 8) {
            // --- THỂ THỨC VÒNG BẢNG (Groups) ---
            tourney.phase = 'groups';
            let groupCount = Math.ceil(count / 4);
            let brackets = [];
            let allGroupMatchesList = [];

            // Bước A: Tạo danh sách cặp đấu thô
            for (let g = 0; g < groupCount; g++) {
                let members = players.slice(g * 4, (g + 1) * 4);
                for (let i = 0; i < members.length; i++) {
                    for (let j = i + 1; j < members.length; j++) {
                        allGroupMatchesList.push({ g: g, p1: members[i], p2: members[j] });
                    }
                }
            }

            // Bước B: Gán thời gian cho từng trận và phân vào bảng
            const totalMatches = allGroupMatchesList.length;
            for (let g = 0; g < groupCount; g++) {
                let members = players.slice(g * 4, (g + 1) * 4);
                let matchesInThisGroup = allGroupMatchesList
                    .filter(m => m.g === g)
                    .map((m, idx) => {
                        // Tìm vị trí thực tế của trận này trong danh sách tổng để lấy giờ
                        const globalIdx = allGroupMatchesList.indexOf(m);
                        return {
                            matchId: `TOUR-${Math.random().toString(36).substr(2, 9)}`,
                            p1: m.p1, p2: m.p2, winner: null,
                            startTime: calculateAutoSchedule(globalIdx, totalMatches, dailyStartHour, dailyEndHour, durationDays)
                        };
                    });
                
                brackets.push({ 
                    groupName: `Bảng ${String.fromCharCode(65 + g)}`, 
                    members, 
                    matches: matchesInThisGroup 
                });
            }
            tourney.brackets = brackets;

        } else {
            // --- THỂ THỨC LOẠI TRỰC TIẾP (Knockout) ---
            tourney.phase = 'knockout';
            let knockoutMatches = [];
            const totalMatches = Math.floor(count / 2);

            for (let i = 0; i < count; i += 2) {
                if (players[i+1]) {
                    const matchIdx = i / 2;
                    knockoutMatches.push({
                        matchId: `TOUR-${Math.random().toString(36).substr(2, 9)}`,
                        p1: players[i],
                        p2: players[i+1],
                        winner: null,
                        startTime: calculateAutoSchedule(matchIdx, totalMatches, dailyStartHour, dailyEndHour, durationDays)
                    });
                } else {
                    // Nếu lẻ người, người cuối cùng được đặc cách (BYE)
                    knockoutMatches.push({
                        matchId: `BYE-${Math.random().toString(36).substr(2, 5)}`,
                        p1: players[i],
                        p2: "Đặc Cách",
                        winner: players[i],
                        startTime: now
                    });
                }
            }
            tourney.brackets = knockoutMatches;
        }

        // 4. CẬP NHẬT TRẠNG THÁI VÀ GỬI THÔNG BÁO
        tourney.status = 'playing';
        tourney.markModified('brackets'); // Báo cho Mongoose biết mảng brackets đã thay đổi
        await tourney.save();

        io.emit('adminNotification', { 
            title: '📣 ĐÃ CHIA BẢNG ĐẤU', 
            message: `Giải ${tourney.gameType.toUpperCase()} đã bắt đầu! Bé hãy vào xem lịch thi đấu của mình.` 
        });
        io.emit('tournamentUpdated'); // Lệnh để các máy khách (Client) load lại dữ liệu giải đấu
        console.log(`[System] Tự động kích hoạt giải đấu ${tourney.gameType} thành công.`);

    } catch (error) {
        console.error("❌ Lỗi hệ thống tự động chia bảng:", error);
    }
}

// Cứ mỗi 1 phút (60000ms), hệ thống sẽ tự quét xem có giải nào đến hạn không
setInterval(autoStartTourneyLogic, 60000);
// Thêm tham số '0.0.0.0' để lắng nghe trên mọi giao diện mạng
// Nếu có cổng do Render cấp thì dùng, không thì mặc định là 3000
// --- CỖ MÁY TỰ ĐỘNG PHẠT NHIỆM VỤ QUÁ HẠN ---
setInterval(async () => {
    const now = Date.now();
    // Tìm tất cả các bé có nhiệm vụ
    const users = await User.find({ "quests.0": { $exists: true } });

    for (let user of users) {
        let hasChange = false;
        // Duyệt ngược mảng nhiệm vụ để xóa nếu cần
        for (let i = user.quests.length - 1; i >= 0; i--) {
            let q = user.quests[i];
            
            // Nếu có đặt thời gian (timeLimit > 0)
            if (q.timeLimit > 0 && q.startTime) {
                const deadline = q.startTime + (q.timeLimit * 1000);
                
                if (now > deadline) {
                    const p = parseInt(q.penalty || 0);
                    user.score = Math.max(0, user.score - p); // Trừ điểm
                    user.history.push({ 
                        activity: `⏰ Hệ thống tự động phạt NV ${q.taskType}: Hết thời gian (-${p}đ)`,
                        timestamp: new Date() 
                    });
                    user.quests.splice(i, 1); // Xóa nhiệm vụ đã hỏng
                    hasChange = true;
                }
            }
        }
        if (hasChange) {
            user.markModified('quests');
            await user.save();
            // Gửi thông báo real-time nếu bé đang online (tùy chọn)
            if (onlineUsers[user.username]) {
                io.to(onlineUsers[user.username]).emit('adminNotification', {
                    title: "⚠️ NHIỆM VỤ THẤT BẠI",
                    message: "Bé đã để hết thời gian nhiệm vụ và bị trừ điểm rồi!"
                });
            }
        }
    }
}, 10000); // Quét mỗi 10 giây
const HOST = '0.0.0.0'; 
server.listen(PORT, HOST, () => {
    console.log(`🚀 Server đang chạy!`);
    console.log(`🏠 Local: http://localhost:3000`);
    console.log(`🌐 Render: Cổng ${PORT}`);
});
