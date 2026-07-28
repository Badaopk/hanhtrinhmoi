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

function readEnvInt(name, fallback, min, max) {
    const parsed = Number.parseInt(process.env[name], 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
}

// Robux chỉ được xử lý dưới dạng yêu cầu đổi thưởng có kiểm duyệt.
// Máy chủ không thu thập mật khẩu/cookie Roblox và không tự ý đăng nhập tài khoản người chơi.
const ROBUX_REWARDS_ENABLED = String(process.env.ROBUX_REWARDS_ENABLED || 'false').toLowerCase() === 'true';
const ROBUX_POINTS_PER_ROBUX = readEnvInt('ROBUX_POINTS_PER_ROBUX', 100, 1, 1_000_000);
const ROBUX_MIN_REDEEM = readEnvInt('ROBUX_MIN_REDEEM', 10, 1, 100_000);
const ROBUX_MAX_DAILY = readEnvInt('ROBUX_MAX_DAILY', 100, ROBUX_MIN_REDEEM, 1_000_000);
const ROBUX_MAX_OPEN_REQUESTS = readEnvInt('ROBUX_MAX_OPEN_REQUESTS', 2, 1, 20);

if (!MONGO_URI) {
    console.error('❌ Thiếu biến môi trường MONGO_URI hoặc MONGODB_URI.');
    process.exit(1);
}

// --- 1. IMPORT DỮ LIỆU & LOGIC ---
const { tests, maths } = require('./question-data.js');
const { ensureCompleteQuestionBank } = require('./question-bank-complete.js');
const questionBankSummary = ensureCompleteQuestionBank(tests, { minQuestions: 100 });
console.log(`📚 Ngân hàng đề thi: ${questionBankSummary.totalQuestions.toLocaleString('vi-VN')} câu, đủ 6 môn × 12 lớp × 3 mức độ.`);
const { boardData } = require('./monopoly-data.js');
const MonopolyGame = require('./monopoly-logic.js');
const { PROGRAM_VERSION, PASS_SCORE, getCatalog, getSubject, getLesson, scoreLesson } = require('./curriculum-data.js');

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
    worldSettings: {
        type: Object,
        default: { theme: 'spring', weatherMode: 'auto', timeMode: 'auto' }
    },
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
    gameType: { type: String, enum: ['chess', 'caro', 'go', 'othello'], required: true },
    format: { type: String, enum: ['auto', 'knockout', 'group'], default: 'auto' },
    phase: { type: String, enum: ['registration', 'groups', 'knockout', 'completed'], default: 'registration' },
    round: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'playing', 'finished', 'cancelled'], default: 'open', index: true },
    matchDuration: { type: Number, default: 20, min: 5, max: 180 },
    registrationDeadline: { type: Date, required: true },
    dailyStartHour: { type: Number, default: 8, min: 0, max: 23 },
    dailyEndHour: { type: Number, default: 18, min: 1, max: 24 },
    durationDays: { type: Number, default: 7, min: 1, max: 30 },
    participants: { type: [String], default: [] },
    brackets: { type: Array, default: [] },
    history: { type: Array, default: [] },
    winners: { top1: String, top2: String, top3: String },
    rewardsGranted: { type: Boolean, default: false },
    startedAt: Date,
    finishedAt: Date
}, { timestamps: true });

tournamentSchema.index({ status: 1, createdAt: -1 });

const learningRecordSchema = new mongoose.Schema({
    username: { type: String, required: true, index: true },
    grade: { type: Number, required: true, min: 1, max: 12 },
    subjectId: { type: String, required: true },
    lessonId: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    lastScore: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    skillStats: { type: Object, default: {} },
    lastDetails: { type: Array, default: [] },
    completedAt: Date
}, { timestamps: true });
learningRecordSchema.index({ username: 1, grade: 1, subjectId: 1, lessonId: 1 }, { unique: true });

const learningSettingSchema = new mongoose.Schema({
    key: { type: String, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });
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

    // --- 5. CÔNG TRÌNH THẾ GIỚI (world) ---
    { id: 'world_gazebo', name: 'Chòi Nghỉ Công Viên', price: 850, type: 'w', category: 'world', icon: '🏛️' },
    { id: 'world_windmill', name: 'Cối Xay Gió', price: 1200, type: 'w', category: 'world', icon: '🌬️' },
    { id: 'world_market_stall', name: 'Quầy Chợ Làng', price: 500, type: 'w', category: 'world', icon: '🏪' },
    { id: 'world_street_lamp', name: 'Đèn Đường Phép Thuật', price: 260, type: 'w', category: 'world', icon: '💡' },
    { id: 'world_park_bench', name: 'Ghế Công Viên', price: 180, type: 'w', category: 'world', icon: '🪑' },
    { id: 'world_campfire', name: 'Lửa Trại', price: 220, type: 'w', category: 'world', icon: '🔥' },
    { id: 'world_picnic', name: 'Bàn Dã Ngoại', price: 320, type: 'w', category: 'world', icon: '🧺' },
    { id: 'world_swing', name: 'Xích Đu Sân Vườn', price: 380, type: 'w', category: 'world', icon: '🎠' },
    { id: 'world_cherry_tree', name: 'Cây Anh Đào', price: 450, type: 'w', category: 'world', icon: '🌸' },
    { id: 'world_crystal', name: 'Tinh Thể Phát Sáng', price: 700, type: 'w', category: 'world', icon: '💠' },
    { id: 'world_portal', name: 'Cổng Dịch Chuyển', price: 1500, type: 'w', category: 'world', icon: '🌀' },
    { id: 'world_sign', name: 'Biển Chỉ Dẫn', price: 90, type: 'w', category: 'world', icon: '🪧' },

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
    { id: 'build_fence', name: 'Hàng Rào', price: 80, category: 'paint', value: '#8b4513', icon: '🚧' },
    // Khối voxel mở rộng cho chế độ đào/đặt
    { id: 'voxel_coal', name: 'Quặng Than', price: 45, category: 'paint', value: '#3d3d3d', icon: '⚫' },
    { id: 'voxel_iron', name: 'Quặng Sắt', price: 65, category: 'paint', value: '#b2bec3', icon: '⛏️' },
    { id: 'voxel_copper', name: 'Quặng Đồng', price: 70, category: 'paint', value: '#c86b3c', icon: '🟠' },
    { id: 'voxel_moss', name: 'Đá Phủ Rêu', price: 55, category: 'paint', value: '#6ab04c', icon: '🌱' },
    { id: 'voxel_glow', name: 'Khối Phát Sáng', price: 120, category: 'paint', value: '#f9ca24', icon: '💡' },
    { id: 'voxel_bookshelf', name: 'Khối Kệ Sách', price: 95, category: 'paint', value: '#8e5b3a', icon: '📚' },
    { id: 'voxel_hay', name: 'Kiện Rơm', price: 35, category: 'floor', value: '#f6e58d', icon: '🌾' },
    { id: 'voxel_wool_white', name: 'Len Trắng', price: 40, category: 'floor', value: '#f5f6fa', icon: '🐑' },
    { id: 'voxel_wool_pink', name: 'Len Hồng', price: 45, category: 'floor', value: '#fd79a8', icon: '🩷' },
    { id: 'voxel_coral', name: 'San Hô', price: 85, category: 'floor', value: '#ff7675', icon: '🪸' },
    { id: 'voxel_mud', name: 'Bùn Đầm Lầy', price: 30, category: 'floor', value: '#6d4c41', icon: '🟫' },
    { id: 'voxel_cloud', name: 'Mây Xốp', price: 110, category: 'floor', value: '#ecf0f1', icon: '☁️' }
];
const SHOP_ITEMS = [...HOME_FURNITURE, ...MATERIALS, ...SEASONAL_SOUVENIRS];
const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true, maxlength: 120 },
    content: { type: String, required: true, maxlength: 2000 },
    type: { type: String, enum: ['info', 'event', 'warning'], default: 'info' },
    targetUsername: { type: String, default: null, index: true },
    date: { type: Date, default: Date.now, index: true }
});

const robuxRedemptionSchema = new mongoose.Schema({
    requestCode: { type: String, required: true, unique: true, index: true },
    gameUsername: { type: String, required: true, index: true },
    robloxUsername: { type: String, required: true, maxlength: 20 },
    robloxUserId: { type: String, default: '', maxlength: 24 },
    pointsSpent: { type: Number, required: true, min: 1 },
    robuxAmount: { type: Number, required: true, min: 1 },
    status: {
        type: String,
        enum: ['pending', 'approved', 'paid', 'rejected', 'cancelled'],
        default: 'pending',
        index: true
    },
    adminNote: { type: String, default: '', maxlength: 500 },
    processedBy: { type: String, default: '' },
    processedAt: { type: Date, default: null }
}, { timestamps: true });

robuxRedemptionSchema.index({ gameUsername: 1, createdAt: -1 });
robuxRedemptionSchema.index({ status: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
const RobuxRedemption = mongoose.model('RobuxRedemption', robuxRedemptionSchema);

// --- DANH SÁCH VẬT PHẨM NÂNG CẤP (FULL OPTION) ---
const Tournament = mongoose.model('Tournament', tournamentSchema);
const LearningRecord = mongoose.model('LearningRecord', learningRecordSchema);
const LearningSetting = mongoose.model('LearningSetting', learningSettingSchema);
const User = mongoose.model('User', userSchema);
async function syncAdminFromEnvironment() {
    const configuredPassword = process.env.ADMIN_PASSWORD || (!IS_PRODUCTION ? 'AdminDev123!' : '');
    if (!configuredPassword || configuredPassword.length < 10 || configuredPassword.length > 72) {
        throw new Error('ADMIN_PASSWORD phải dài từ 10 đến 72 ký tự.');
    }

    let admin = await User.findOne({ username: 'Admin' });
    if (!admin) {
        admin = new User({
            username: 'Admin',
            password: await bcrypt.hash(configuredPassword, 10),
            role: 'admin',
            chessLevel: 100, caroLevel: 100, memoryLevel: 100, crosswordLevel: 100,
            detectiveLevel: 100, goLevel: 100, othelloLevel: 100, storyLevel: 100,
            shapeLevel: 100, buildLevel: 100, paintingLevel: 100, monopolyLevel: 100,
            vietSpeechLevel: 100, englishSpeechLevel: 100,
            score: 9999
        });
        await admin.save();
        console.log('🚀 Đã tạo tài khoản Admin từ ADMIN_PASSWORD.');
        return;
    }

    const passwordMatches = await bcrypt.compare(configuredPassword, admin.password);
    let changed = false;
    if (!passwordMatches) {
        admin.password = await bcrypt.hash(configuredPassword, 10);
        changed = true;
    }
    if (admin.role !== 'admin') {
        admin.role = 'admin';
        changed = true;
    }
    if (changed) {
        await admin.save();
        console.log('🔐 Đã đồng bộ mật khẩu/quyền Admin theo Environment.');
    } else {
        console.log('✅ Mật khẩu Admin đã khớp với Environment.');
    }
}

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ Đã kết nối MongoDB thành công!');
        try {
            await syncAdminFromEnvironment();
        } catch (error) {
            console.error('❌ Không thể đồng bộ tài khoản Admin:', error.message);
            if (IS_PRODUCTION) process.exit(1);
        }
    })
    .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));
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
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(), payment=()');
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
        version: '5.0.0'
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
        // Bảo đảm mật khẩu Admin luôn khớp với Environment ngay cả khi
        // người dùng đăng nhập trong lúc dịch vụ vừa khởi động lại.
        if (username.toLowerCase() === 'admin') await syncAdminFromEnvironment();

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
function normalizeGameType(value) {
    const type = String(value || '').trim().toLowerCase();
    return ['chess', 'caro', 'go', 'othello'].includes(type) ? type : null;
}
function createTournamentMatchId(prefix = 'TOUR') {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
function shufflePlayers(players) {
    const output = [...players];
    for (let i = output.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [output[i], output[j]] = [output[j], output[i]];
    }
    return output;
}
function scheduleTournamentMatches(count, tourney, dayOffset = 1) {
    const result = [];
    const days = Math.max(1, Number(tourney.durationDays) || 7);
    const startHour = Math.max(0, Number(tourney.dailyStartHour) || 8);
    const endHour = Math.max(startHour + 1, Number(tourney.dailyEndHour) || 18);
    const perDay = Math.max(1, Math.ceil(count / days));
    for (let index = 0; index < count; index++) {
        const day = Math.floor(index / perDay);
        const position = index % perDay;
        const slotsToday = Math.min(perDay, count - day * perDay);
        const available = (endHour - startHour) * 60;
        const minute = Math.round(((position + 1) * available) / (slotsToday + 1));
        const date = new Date();
        date.setDate(date.getDate() + dayOffset + day);
        date.setHours(startHour, minute, 0, 0);
        result.push(date);
    }
    return result;
}
function tournamentMatches(tourney) {
    if (!Array.isArray(tourney?.brackets)) return [];
    return tourney.brackets.flatMap(entry => Array.isArray(entry?.matches) ? entry.matches : [entry]).filter(Boolean);
}
function findTournamentMatch(tourney, matchId) {
    return tournamentMatches(tourney).find(match => match.matchId === matchId);
}
function makeMatch(p1, p2, startTime, round = 1, label = '') {
    return {
        matchId: createTournamentMatchId(), p1, p2: p2 || 'BYE', winner: p2 ? null : p1,
        loser: null, status: p2 ? 'scheduled' : 'finished', startTime, round, label,
        checkIns: {}, resultSource: p2 ? null : 'bye', finishedAt: p2 ? null : new Date()
    };
}
function calculateGroupStandings(group) {
    const rows = Object.fromEntries((group.members || []).map(name => [name, { player: name, played: 0, won: 0, lost: 0, points: 0 }]));
    for (const match of group.matches || []) {
        if (!match.winner || !rows[match.p1] || !rows[match.p2]) continue;
        rows[match.p1].played += 1; rows[match.p2].played += 1;
        if (rows[match.winner]) {
            rows[match.winner].won += 1; rows[match.winner].points += 3;
            const loser = match.winner === match.p1 ? match.p2 : match.p1;
            if (rows[loser]) rows[loser].lost += 1;
        }
    }
    return Object.values(rows).sort((a, b) => b.points - a.points || b.won - a.won || a.player.localeCompare(b.player, 'vi'));
}
function createGroupStage(players, tourney) {
    const groupCount = Math.ceil(players.length / 4);
    const groups = Array.from({ length: groupCount }, (_, index) => ({ groupName: `Bảng ${String.fromCharCode(65 + index)}`, members: [], matches: [] }));
    players.forEach((player, index) => groups[index % groupCount].members.push(player));
    const pairs = [];
    groups.forEach((group, groupIndex) => {
        for (let i = 0; i < group.members.length; i++) for (let j = i + 1; j < group.members.length; j++) pairs.push({ groupIndex, p1: group.members[i], p2: group.members[j] });
    });
    const schedule = scheduleTournamentMatches(pairs.length, tourney, 1);
    pairs.forEach((pair, index) => groups[pair.groupIndex].matches.push(makeMatch(pair.p1, pair.p2, schedule[index], 0, groups[pair.groupIndex].groupName)));
    return groups;
}
function createKnockoutRound(players, tourney, round, dayOffset = 1) {
    const schedule = scheduleTournamentMatches(Math.ceil(players.length / 2), tourney, dayOffset);
    const matches = [];
    for (let i = 0; i < players.length; i += 2) matches.push(makeMatch(players[i], players[i + 1], schedule[Math.floor(i / 2)], round, `Vòng ${round}`));
    return matches;
}
async function startTournament(tourney) {
    if (!tourney || tourney.status !== 'open') throw new Error('Giải đấu không còn mở đăng ký.');
    if ((tourney.participants || []).length < 2) throw new Error('Cần ít nhất 2 người tham gia.');
    const players = shufflePlayers([...new Set(tourney.participants)]);
    const useGroups = tourney.format === 'group' || (tourney.format === 'auto' && players.length > 8);
    tourney.startedAt = new Date();
    tourney.status = 'playing';
    tourney.history = [];
    if (useGroups) {
        tourney.phase = 'groups'; tourney.round = 0; tourney.brackets = createGroupStage(players, tourney);
    } else {
        tourney.phase = 'knockout'; tourney.round = 1; tourney.brackets = createKnockoutRound(players, tourney, 1);
    }
    tourney.markModified('brackets');
    await tourney.save();
    io.emit('tournamentUpdated');
    io.emit('adminNotification', { title: '📣 GIẢI ĐẤU BẮT ĐẦU', message: `Lịch ${tourney.gameType.toUpperCase()} đã được công bố.` });
    return tourney;
}
async function grantTournamentRewards(tourney) {
    if (tourney.rewardsGranted) return;
    const rewards = [[tourney.winners?.top1, 500], [tourney.winners?.top2, 300], [tourney.winners?.top3, 100]];
    for (const [name, points] of rewards) if (name) await User.updateOne({ username: name }, { $inc: { score: points }, $push: { history: { activity: `🏆 Giải đấu ${tourney.gameType}: +${points}đ`, timestamp: new Date() } } });
    tourney.rewardsGranted = true;
}
async function advanceTournament(tourney) {
    if (!tourney || tourney.status !== 'playing') return false;
    const allDone = tournamentMatches(tourney).every(match => Boolean(match.winner));
    if (!allDone) return false;
    if (tourney.phase === 'groups') {
        const qualified = tourney.brackets.flatMap(group => calculateGroupStandings(group).slice(0, 2).map(row => row.player));
        tourney.history.push({ phase: 'groups', brackets: tourney.brackets, completedAt: new Date() });
        tourney.phase = 'knockout'; tourney.round = 1;
        tourney.brackets = createKnockoutRound(shufflePlayers(qualified), tourney, 1, 1);
    } else {
        const matches = tournamentMatches(tourney);
        const winners = matches.map(match => match.winner).filter(name => name && name !== 'BYE');
        const losers = matches.map(match => match.loser).filter(Boolean);
        tourney.history.push({ phase: 'knockout', round: tourney.round, brackets: tourney.brackets, completedAt: new Date() });
        if (winners.length <= 1) {
            tourney.status = 'finished'; tourney.phase = 'completed'; tourney.finishedAt = new Date();
            tourney.winners = { top1: winners[0] || '', top2: losers[losers.length - 1] || '', top3: losers.length > 1 ? losers[losers.length - 2] : '' };
            await grantTournamentRewards(tourney);
            io.emit('adminNotification', { title: '🏁 GIẢI ĐẤU KẾT THÚC', message: `Quán quân: ${tourney.winners.top1 || 'Chưa xác định'}` });
        } else {
            tourney.round += 1;
            tourney.brackets = createKnockoutRound(winners, tourney, tourney.round, 1);
        }
    }
    tourney.markModified('brackets'); tourney.markModified('history');
    await tourney.save(); io.emit('tournamentUpdated');
    return true;
}

app.post('/api/admin/create-tournament', async (req, res) => {
    try {
        const gameType = normalizeGameType(req.body.gameType);
        if (!gameType) return res.status(400).json({ message: 'Môn thi không hợp lệ.' });
        const existing = await Tournament.findOne({ status: { $in: ['open', 'playing'] } });
        if (existing) return res.status(409).json({ message: 'Hãy kết thúc hoặc hủy giải hiện tại trước.' });
        const deadline = new Date(Date.now() + clampInteger(req.body.regDays, 1, 30, 3) * 86400000);
        const start = clampInteger(req.body.dailyStart ?? req.body.dailyStartHour, 0, 22, 8);
        const endHour = clampInteger(req.body.dailyEnd ?? req.body.dailyEndHour, start + 1, 24, 18);
        const tourney = await Tournament.create({
            gameType, format: ['auto','knockout','group'].includes(req.body.format) ? req.body.format : 'auto',
            matchDuration: clampInteger(req.body.matchDuration, 5, 180, 20), registrationDeadline: deadline,
            dailyStartHour: start, dailyEndHour: endHour, durationDays: clampInteger(req.body.tourDays ?? req.body.durationDays, 1, 30, 7)
        });
        io.emit('tournamentUpdated');
        res.json({ message: 'Đã mở giải đấu.', tournament: tourney });
    } catch (error) { res.status(500).json({ message: error.message }); }
});
app.post('/api/admin/start-tournament', async (req, res) => {
    try {
        const tourney = await Tournament.findOne({ status: 'open' });
        await startTournament(tourney);
        res.json({ message: 'Đã chia lịch và bắt đầu giải đấu.' });
    } catch (error) { res.status(400).json({ message: error.message }); }
});
app.post('/api/admin/tournament-result', async (req, res) => {
    const matchId = String(req.body.matchId || '').trim();
    const winner = normalizeUsername(req.body.winner);
    const ok = await recordTournamentWinner(matchId, winner, { source: 'admin' });
    res.status(ok ? 200 : 400).json({ message: ok ? 'Đã ghi nhận kết quả.' : 'Không thể ghi nhận kết quả này.' });
});
app.post('/api/admin/advance-to-knockout', async (req, res) => {
    const tourney = await Tournament.findOne({ status: 'playing' });
    const advanced = await advanceTournament(tourney);
    res.status(advanced ? 200 : 400).json({ message: advanced ? 'Đã tạo vòng tiếp theo.' : 'Các trận hiện tại chưa hoàn tất.' });
});
app.post('/api/admin/finish-tournament', async (req, res) => {
    const tourney = await Tournament.findOne({ status: { $in: ['open','playing'] } });
    if (!tourney) return res.status(404).json({ message: 'Không tìm thấy giải đấu.' });
    tourney.status = 'finished'; tourney.phase = 'completed'; tourney.finishedAt = new Date();
    tourney.winners = { top1: normalizeUsername(req.body.top1), top2: normalizeUsername(req.body.top2), top3: normalizeUsername(req.body.top3) };
    await grantTournamentRewards(tourney); await tourney.save(); io.emit('tournamentUpdated');
    res.json({ message: 'Đã kết thúc và trao thưởng giải đấu.' });
});
app.post('/api/admin/cancel-tournament', async (req, res) => {
    const tourney = await Tournament.findOne({ status: { $in: ['open','playing'] } });
    if (!tourney) return res.status(404).json({ message: 'Không có giải đang hoạt động.' });
    tourney.status = 'cancelled'; tourney.finishedAt = new Date(); await tourney.save(); io.emit('tournamentUpdated');
    res.json({ message: 'Đã hủy giải đấu.' });
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

// Reset mật khẩu người dùng. Mật khẩu Admin chỉ được đồng bộ từ ADMIN_PASSWORD.
app.post('/api/admin/reset-password', async (req, res) => {
    const username = normalizeUsername(req.body.username);
    if (!username) return res.status(400).json({ message: 'Thiếu tên tài khoản.' });
    if (username.toLowerCase() === 'admin') {
        return res.status(400).json({
            message: 'Mật khẩu Admin được quản lý bằng ADMIN_PASSWORD trong Environment. Hãy đổi biến và redeploy.'
        });
    }
    const temporaryPassword = String(req.body.temporaryPassword || '123456').trim();
    if (temporaryPassword.length < 6 || temporaryPassword.length > 72) {
        return res.status(400).json({ message: 'Mật khẩu tạm phải dài từ 6 đến 72 ký tự.' });
    }
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    user.password = await bcrypt.hash(temporaryPassword, 10);
    await user.save();
    res.json({ message: `Đã đặt mật khẩu tạm cho ${username}.` });
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
function defaultLearningCalendar() {
    const schoolYear = process.env.SCHOOL_YEAR || '2026-2027';
    return {
        schoolYear,
        note: 'Mốc mặc định để lập kế hoạch. Admin cần cập nhật theo kế hoạch của Sở GDĐT/nhà trường.',
        milestones: [
            { id: 'midterm-1', name: 'Giữa học kỳ I', from: process.env.MIDTERM_1_FROM || '2026-10-19', to: process.env.MIDTERM_1_TO || '2026-10-31' },
            { id: 'final-1', name: 'Cuối học kỳ I', from: process.env.FINAL_1_FROM || '2026-12-21', to: process.env.FINAL_1_TO || '2027-01-09' },
            { id: 'midterm-2', name: 'Giữa học kỳ II', from: process.env.MIDTERM_2_FROM || '2027-03-15', to: process.env.MIDTERM_2_TO || '2027-03-27' },
            { id: 'final-2', name: 'Cuối học kỳ II', from: process.env.FINAL_2_FROM || '2027-05-03', to: process.env.FINAL_2_TO || '2027-05-22' }
        ]
    };
}
async function getLearningCalendar() {
    const setting = await LearningSetting.findOne({ key: 'school-calendar' }).lean();
    return setting?.value || defaultLearningCalendar();
}
function lessonOrder(lessonId) { return Number(String(lessonId || '').replace(/\D/g, '')) || 0; }
async function isLessonUnlocked(username, grade, subjectId, lessonId) {
    const order = lessonOrder(lessonId);
    if (order <= 1) return true;
    const previous = await LearningRecord.findOne({ username, grade, subjectId, lessonId: `lesson-${order - 1}`, passed: true }).lean();
    return Boolean(previous);
}
function buildLearningAnalytics(records) {
    const stats = {};
    for (const record of records) {
        for (const [skill, data] of Object.entries(record.skillStats || {})) {
            stats[skill] ||= { correct: 0, total: 0 };
            stats[skill].correct += Number(data.correct) || 0; stats[skill].total += Number(data.total) || 0;
        }
    }
    const skills = Object.entries(stats).map(([skill, value]) => ({ skill, percent: value.total ? Math.round(value.correct / value.total * 100) : 0 })).sort((a,b) => a.percent - b.percent);
    return { weakSkills: skills.slice(0, 3), strongSkills: [...skills].reverse().slice(0, 3), recommendation: skills[0] && skills[0].percent < 80 ? `Ưu tiên ôn kỹ năng ${skills[0].skill}.` : 'Tiếp tục học bài kế tiếp và duy trì luyện tập đều.' };
}
app.get('/api/learning/catalog', requireAuth, async (req, res) => {
    const grade = clampInteger(req.query.grade, 1, 12, 1);
    res.json(getCatalog(grade));
});
app.get('/api/learning/calendar', requireAuth, async (req, res) => res.json(await getLearningCalendar()));
app.post('/api/admin/learning-calendar', async (req, res) => {
    const value = req.body && typeof req.body === 'object' ? req.body : {};
    await LearningSetting.findOneAndUpdate({ key: 'school-calendar' }, { $set: { value } }, { upsert: true });
    res.json({ message: 'Đã cập nhật lịch học và kiểm tra.' });
});
app.get('/api/learning/progress', requireAuth, async (req, res) => {
    const grade = clampInteger(req.query.grade, 1, 12, 1);
    const records = await LearningRecord.find({ username: req.session.user.username, grade }).lean();
    const bySubject = {};
    for (const record of records) { bySubject[record.subjectId] ||= {}; bySubject[record.subjectId][record.lessonId] = { bestScore: record.bestScore, lastScore: record.lastScore, attempts: record.attempts, passed: record.passed }; }
    res.json({ grade, passScore: PASS_SCORE, records: bySubject, analytics: buildLearningAnalytics(records) });
});
app.get('/api/learning/lesson/:grade/:subjectId/:lessonId', requireAuth, async (req, res) => {
    const grade = clampInteger(req.params.grade, 1, 12, 1);
    const lessonPack = getLesson(grade, req.params.subjectId, req.params.lessonId);
    if (!lessonPack) return res.status(404).json({ message: 'Không tìm thấy bài học.' });
    const unlocked = await isLessonUnlocked(req.session.user.username, grade, req.params.subjectId, req.params.lessonId);
    if (!unlocked) return res.status(403).json({ message: `Cần đạt trên ${PASS_SCORE} điểm ở bài trước để mở khóa.` });
    const safe = JSON.parse(JSON.stringify(lessonPack));
    safe.lesson.questions = safe.lesson.questions.map(({ answer, explanation, ...question }) => question);
    res.json({ ...safe, passScore: PASS_SCORE, unlocked: true });
});
app.post('/api/learning/lesson/:grade/:subjectId/:lessonId/submit', requireAuth, async (req, res) => {
    const grade = clampInteger(req.params.grade, 1, 12, 1);
    const pack = getLesson(grade, req.params.subjectId, req.params.lessonId);
    if (!pack) return res.status(404).json({ message: 'Không tìm thấy bài học.' });
    if (!await isLessonUnlocked(req.session.user.username, grade, req.params.subjectId, req.params.lessonId)) return res.status(403).json({ message: 'Bài học đang bị khóa.' });
    const result = scoreLesson(pack.lesson, req.body.answers || {});
    const skillStats = {};
    for (const detail of result.details) { skillStats[detail.skill] ||= { correct: 0, total: 0 }; skillStats[detail.skill].total += 1; if (detail.isCorrect) skillStats[detail.skill].correct += 1; }
    const existing = await LearningRecord.findOne({ username: req.session.user.username, grade, subjectId: req.params.subjectId, lessonId: req.params.lessonId });
    const bestScore = Math.max(existing?.bestScore || 0, result.score);
    const record = await LearningRecord.findOneAndUpdate(
        { username: req.session.user.username, grade, subjectId: req.params.subjectId, lessonId: req.params.lessonId },
        { $set: { bestScore, lastScore: result.score, passed: bestScore > PASS_SCORE, skillStats, lastDetails: result.details, ...(bestScore > PASS_SCORE ? { completedAt: new Date() } : {}) }, $inc: { attempts: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ ...result, bestScore: record.bestScore, attempts: record.attempts, nextLessonUnlocked: record.passed, message: record.passed ? 'Đã đạt yêu cầu và mở bài tiếp theo.' : `Cần đạt trên ${PASS_SCORE} điểm. Hãy xem giải thích và thử lại.` });
});
function normalizeSpeech(text) { return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
app.post('/api/learning/english/speaking', requireAuth, async (req, res) => {
    const reference = normalizeSpeech(req.body.reference); const transcript = normalizeSpeech(req.body.transcript);
    if (!reference || !transcript) return res.status(400).json({ message: 'Thiếu câu mẫu hoặc bản ghi lời nói.' });
    const refWords = new Set(reference.split(' ')); const spoken = transcript.split(' ');
    const matched = spoken.filter(word => refWords.has(word)).length;
    const accuracy = Math.min(100, Math.round((matched / Math.max(refWords.size, spoken.length)) * 130));
    const confidence = Math.round(Math.max(0, Math.min(1, Number(req.body.confidence) || .6)) * 100);
    const score = Number(((accuracy * .75 + confidence * .25) / 10).toFixed(1));
    res.json({ score, accuracy, confidence, transcript: req.body.transcript, feedback: score >= 8 ? 'Phát âm và độ trôi chảy tốt.' : 'Hãy nghe lại câu mẫu, nói chậm hơn và nhấn rõ từ khóa.' });
});
async function gradeEssayWithOpenAI({ grade, subjectName, prompt, essay }) {
    if (!process.env.OPENAI_API_KEY) return null;
    const schema = { type: 'object', additionalProperties: false, properties: { score: { type: 'number' }, criteria: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { name: { type: 'string' }, score: { type: 'number' }, comment: { type: 'string' } }, required: ['name','score','comment'] } }, strengths: { type: 'array', items: { type: 'string' } }, improvements: { type: 'array', items: { type: 'string' } }, revisedExample: { type: 'string' } }, required: ['score','criteria','strengths','improvements','revisedExample'] };
    const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-5-mini', store: false, input: [{ role: 'system', content: 'Bạn là giáo viên Ngữ văn Việt Nam. Chấm hỗ trợ học tập theo thang 10, phù hợp lứa tuổi, không phán xét. Chỉ trả JSON theo schema.' }, { role: 'user', content: `Lớp ${grade}; môn ${subjectName}; đề: ${prompt}\nBài làm:\n${essay}` }], text: { format: { type: 'json_schema', name: 'essay_grade', strict: true, schema } } }) });
    if (!response.ok) throw new Error(`OpenAI API ${response.status}`);
    const data = await response.json();
    const text = data.output_text || data.output?.flatMap(item => item.content || []).find(item => item.type === 'output_text')?.text;
    return JSON.parse(text);
}
function localEssayGrade(essay) {
    const words = String(essay).trim().split(/\s+/).filter(Boolean); const sentences = String(essay).split(/[.!?]+/).filter(v => v.trim());
    const score = Math.min(8, Number((3.5 + Math.min(2.5, words.length / 100) + Math.min(1, sentences.length / 10) + (words.length >= 80 ? 1 : 0)).toFixed(1)));
    return { score, criteria: [{ name: 'Hoàn thành yêu cầu', score, comment: 'Chấm tạm bằng bộ quy tắc cục bộ vì chưa cấu hình AI.' }], strengths: ['Đã hoàn thành bài viết và có nội dung để đánh giá.'], improvements: ['Bổ sung dẫn chứng, liên kết ý và kiểm tra chính tả.'], revisedExample: '' };
}
app.post('/api/learning/literature/essay', requireAuth, async (req, res) => {
    const grade = clampInteger(req.body.grade, 1, 12, 1); const essay = String(req.body.essay || '').trim().slice(0, 12000); const prompt = String(req.body.prompt || '').trim().slice(0, 1000);
    if (essay.length < 80) return res.status(400).json({ message: 'Bài viết cần ít nhất 80 ký tự.' });
    try { const ai = await gradeEssayWithOpenAI({ grade, subjectName: grade <= 5 ? 'Tiếng Việt' : 'Ngữ văn', prompt, essay }); res.json({ ...(ai || localEssayGrade(essay)), source: ai ? 'openai' : 'local', notice: ai ? 'AI hỗ trợ chấm; giáo viên/phụ huynh nên xem lại với bài quan trọng.' : 'Chưa có OPENAI_API_KEY nên dùng chấm cục bộ.' }); }
    catch (error) { console.error('Lỗi chấm văn AI:', error.message); res.json({ ...localEssayGrade(essay), source: 'local-fallback', notice: 'AI tạm thời không khả dụng; đã dùng chấm cục bộ.' }); }
});

app.get('/api/tournament/status', async (req, res) => {
    const tourney = await Tournament.findOne({ status: { $in: ['open','playing','finished'] } }).sort({ createdAt: -1 }).lean();
    if (!tourney) return res.json({ status: 'none' });
    if (tourney.phase === 'groups') tourney.standings = Object.fromEntries((tourney.brackets || []).map(group => [group.groupName, calculateGroupStandings(group)]));
    res.setHeader('Cache-Control', 'no-store');
    res.json(tourney);
});
app.post('/api/tournament/join', requireAuth, async (req, res) => {
    const username = req.session.user.username;
    const now = new Date();
    const result = await Tournament.updateOne(
        { status: 'open', registrationDeadline: { $gt: now }, participants: { $ne: username } },
        { $addToSet: { participants: username } }
    );
    if (result.modifiedCount) { io.emit('tournamentUpdated'); return res.json({ message: 'Đăng ký thành công.' }); }
    const tourney = await Tournament.findOne({ status: 'open' }).lean();
    if (!tourney) return res.status(404).json({ message: 'Hiện không có giải mở đăng ký.' });
    if (new Date(tourney.registrationDeadline) <= now) return res.status(400).json({ message: 'Đã hết hạn đăng ký.' });
    res.json({ message: 'Bạn đã đăng ký giải này rồi.' });
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
// --- HỆ THỐNG BÀI KIỂM TRA TỔNG HỢP ---
const TEST_SUBJECT_LABELS = {
    toan: 'Toán học',
    'tieng-viet': 'Tiếng Việt',
    'tieng-anh': 'Tiếng Anh',
    'khoa-hoc': 'Khoa học',
    'lich-su': 'Lịch sử',
    'dia-ly': 'Địa lý'
};

function shuffleQuestions(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
}

app.get('/api/test/catalog', (req, res) => {
    const catalog = Object.entries(TEST_SUBJECT_LABELS).map(([subject, label]) => ({
        subject,
        label,
        grades: Array.from({ length: 12 }, (_, index) => {
            const grade = index + 1;
            const gradeKey = `grade${grade}`;
            return {
                grade,
                difficulties: {
                    easy: tests[subject]?.[gradeKey]?.easy?.length || 0,
                    medium: tests[subject]?.[gradeKey]?.medium?.length || 0,
                    hard: tests[subject]?.[gradeKey]?.hard?.length || 0
                }
            };
        })
    }));
    res.json({
        catalog,
        maxQuestionsPerTest: 30,
        totalQuestions: questionBankSummary.totalQuestions,
        updatedVersion: '5.0.0'
    });
});

// Lấy đề ngẫu nhiên và chỉ lưu đáp án ở phía máy chủ.
app.get('/api/test', (req, res) => {
    const subject = String(req.query.subject || '');
    const grade = Number.parseInt(req.query.grade, 10);
    const difficulty = String(req.query.difficulty || 'easy');
    const limit = Math.min(30, Math.max(10, Number.parseInt(req.query.limit, 10) || 10));

    if (!TEST_SUBJECT_LABELS[subject]) return res.status(404).json({ message: 'Môn học không hợp lệ.' });
    if (!Number.isInteger(grade) || grade < 1 || grade > 12) return res.status(400).json({ message: 'Lớp học phải từ 1 đến 12.' });
    if (!['easy', 'medium', 'hard'].includes(difficulty)) return res.status(400).json({ message: 'Mức độ không hợp lệ.' });

    const gradeKey = `grade${grade}`;
    const allQuestions = tests[subject]?.[gradeKey]?.[difficulty] || [];
    if (allQuestions.length < limit) {
        return res.status(404).json({ message: 'Ngân hàng câu hỏi chưa đủ cho lựa chọn này.' });
    }

    const selected = shuffleQuestions(allQuestions).slice(0, limit);
    const answerKey = {};
    selected.forEach(question => {
        answerKey[question.id] = {
            answer: question.correct,
            explanation: question.explanation || `Đáp án đúng là ${question.correct}.`
        };
    });

    req.session.currentTestAnswers = answerKey;
    req.session.currentTestMeta = { subject, grade, difficulty, limit };
    req.session.testStartTime = Date.now();
    req.session.save(error => {
        if (error) return res.status(500).json({ message: 'Không thể tạo phiên bài kiểm tra.' });
        res.json(selected.map(question => ({ id: question.id, q: question.q, a: question.a })));
    });
});

app.post('/api/submit-test', async (req, res) => {
    const startTime = req.session.testStartTime;
    const now = Date.now();
    const answerKey = req.session.currentTestAnswers;
    const meta = req.session.currentTestMeta || {};

    if (!startTime || !answerKey) {
        return res.status(400).json({ score: 0, total: 0, message: 'Phiên làm bài đã hết hạn. Hãy tạo đề mới.' });
    }

    const maxDurationMs = Math.max(20, (meta.limit || 10) * 2) * 60 * 1000;
    if ((now - startTime) > maxDurationMs) {
        delete req.session.testStartTime;
        delete req.session.currentTestAnswers;
        delete req.session.currentTestMeta;
        req.session.save();
        return res.status(400).json({ score: 0, total: Object.keys(answerKey).length, message: 'Bài thi đã quá thời gian quy định.' });
    }

    const answers = req.body?.answers && typeof req.body.answers === 'object' ? req.body.answers : {};
    let score = 0;
    const details = {};

    for (const [questionId, key] of Object.entries(answerKey)) {
        const userAnswer = String(answers[questionId] ?? '');
        const correctAnswer = typeof key === 'string' ? key : key.answer;
        const isCorrect = userAnswer === correctAnswer;
        if (isCorrect) score += 1;
        details[questionId] = {
            correct: correctAnswer,
            userChosen: userAnswer || null,
            isCorrect,
            explanation: typeof key === 'string' ? `Đáp án đúng là ${correctAnswer}.` : key.explanation
        };
    }

    const total = Object.keys(answerKey).length;
    const timeTaken = Math.max(1, Math.floor((now - startTime) / 1000));
    if (req.session.user) {
        try {
            const user = await User.findOne({ username: req.session.user.username });
            if (user) {
                user.score += score * 10;
                updateQuestProgress(user, 'Kiểm Tra', { timeTaken, isWin: score >= total / 2 });
                user.history.push({
                    activity: `Thi ${TEST_SUBJECT_LABELS[meta.subject] || 'tổng hợp'} lớp ${meta.grade || '?'}: ${score}/${total} (${timeTaken}s)`,
                    timestamp: new Date()
                });
                user.markModified('quests');
                await user.save();
            }
        } catch (dbError) {
            console.error('Lỗi cập nhật kết quả bài thi:', dbError);
        }
    }

    delete req.session.testStartTime;
    delete req.session.currentTestAnswers;
    delete req.session.currentTestMeta;
    req.session.save();

    const percent = total ? Math.round(score / total * 100) : 0;
    const message = percent === 100 ? 'Xuất sắc! Bạn đã trả lời đúng toàn bộ.'
        : percent >= 80 ? 'Rất tốt! Bạn nắm kiến thức khá chắc.'
        : percent >= 50 ? 'Đã hoàn thành. Hãy xem kỹ phần giải thích để tiến bộ.'
        : 'Hãy ôn lại phần giải thích và thử một đề mới nhé.';

    res.json({ score, total, percent, timeTaken, message, details });
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
// --- HỆ THỐNG ĐỔI ĐIỂM SANG ROBUX (YÊU CẦU CÓ KIỂM DUYỆT) ---
function getRobuxRewardConfig() {
    return {
        enabled: ROBUX_REWARDS_ENABLED,
        pointsPerRobux: ROBUX_POINTS_PER_ROBUX,
        minRobux: ROBUX_MIN_REDEEM,
        maxDailyRobux: ROBUX_MAX_DAILY,
        maxOpenRequests: ROBUX_MAX_OPEN_REQUESTS,
        payoutMode: 'manual-group-payout',
        notice: 'Hệ thống chỉ tạo yêu cầu. Admin phải chi trả bằng phương thức chính thức của Roblox. Không bao giờ nhập mật khẩu hoặc cookie Roblox.'
    };
}

function normalizeRobloxUsername(value) {
    return String(value || '').trim();
}

function isValidRobloxUsername(value) {
    return /^[A-Za-z0-9_]{3,20}$/.test(value) && !value.startsWith('_') && !value.endsWith('_');
}

function createRobuxRequestCode() {
    return `RBX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

app.get('/api/robux/config', requireAuth, async (req, res) => {
    const user = await User.findOne({ username: req.session.user.username }).select('score');
    res.json({
        ...getRobuxRewardConfig(),
        score: user?.score || 0
    });
});

app.get('/api/robux/my-requests', requireAuth, async (req, res) => {
    const requests = await RobuxRedemption.find({ gameUsername: req.session.user.username })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();
    res.json({ requests });
});

app.post('/api/robux/redeem', requireAuth, async (req, res) => {
    if (!ROBUX_REWARDS_ENABLED) {
        return res.status(503).json({ message: 'Hệ thống đổi Robux đang tạm khóa.' });
    }

    const robloxUsername = normalizeRobloxUsername(req.body.robloxUsername);
    const robloxUserId = String(req.body.robloxUserId || '').trim();
    const robuxAmount = Number.parseInt(req.body.robuxAmount, 10);

    if (!isValidRobloxUsername(robloxUsername)) {
        return res.status(400).json({ message: 'Tên Roblox phải dài 3–20 ký tự và chỉ gồm chữ, số hoặc dấu gạch dưới.' });
    }
    if (robloxUserId && !/^\d{1,24}$/.test(robloxUserId)) {
        return res.status(400).json({ message: 'Roblox User ID chỉ được chứa chữ số.' });
    }
    if (!Number.isInteger(robuxAmount) || robuxAmount < ROBUX_MIN_REDEEM || robuxAmount > ROBUX_MAX_DAILY) {
        return res.status(400).json({ message: `Mỗi yêu cầu phải từ ${ROBUX_MIN_REDEEM} đến ${ROBUX_MAX_DAILY} Robux.` });
    }

    const username = req.session.user.username;
    const openStatuses = ['pending', 'approved'];
    const openCount = await RobuxRedemption.countDocuments({
        gameUsername: username,
        status: { $in: openStatuses }
    });
    if (openCount >= ROBUX_MAX_OPEN_REQUESTS) {
        return res.status(429).json({ message: `Bạn đang có ${openCount} yêu cầu chưa hoàn tất. Hãy chờ admin xử lý.` });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const dailyRows = await RobuxRedemption.aggregate([
        {
            $match: {
                gameUsername: username,
                createdAt: { $gte: startOfDay },
                status: { $in: ['pending', 'approved', 'paid'] }
            }
        },
        { $group: { _id: null, total: { $sum: '$robuxAmount' } } }
    ]);
    const dailyUsed = dailyRows[0]?.total || 0;
    if (dailyUsed + robuxAmount > ROBUX_MAX_DAILY) {
        return res.status(400).json({
            message: `Giới hạn hôm nay là ${ROBUX_MAX_DAILY} Robux. Bạn đã dùng ${dailyUsed} Robux.`
        });
    }

    const pointsSpent = robuxAmount * ROBUX_POINTS_PER_ROBUX;
    const activity = `🎁 Giữ ${pointsSpent} điểm cho yêu cầu đổi ${robuxAmount} Robux`;
    const updatedUser = await User.findOneAndUpdate(
        {
            username,
            isSuspended: { $ne: true },
            score: { $gte: pointsSpent }
        },
        {
            $inc: { score: -pointsSpent },
            $push: { history: { activity, timestamp: new Date() } }
        },
        { new: true }
    ).select('score');

    if (!updatedUser) {
        return res.status(400).json({ message: `Không đủ điểm. Cần ${pointsSpent.toLocaleString('vi-VN')} điểm.` });
    }

    try {
        const request = await RobuxRedemption.create({
            requestCode: createRobuxRequestCode(),
            gameUsername: username,
            robloxUsername,
            robloxUserId,
            pointsSpent,
            robuxAmount,
            status: 'pending'
        });

        return res.status(201).json({
            message: `Đã gửi yêu cầu ${robuxAmount} Robux. ${pointsSpent.toLocaleString('vi-VN')} điểm đang được giữ để tránh đổi trùng.`,
            newScore: updatedUser.score,
            request
        });
    } catch (error) {
        await User.updateOne(
            { username },
            {
                $inc: { score: pointsSpent },
                $push: { history: { activity: `Hoàn ${pointsSpent} điểm vì tạo yêu cầu Robux thất bại`, timestamp: new Date() } }
            }
        );
        console.error('Lỗi tạo yêu cầu Robux:', error);
        return res.status(500).json({ message: 'Không thể tạo yêu cầu. Điểm đã được hoàn lại.' });
    }
});

app.post('/api/robux/cancel/:requestId', requireAuth, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.requestId)) {
        return res.status(400).json({ message: 'Mã yêu cầu không hợp lệ.' });
    }

    const request = await RobuxRedemption.findOneAndUpdate(
        {
            _id: req.params.requestId,
            gameUsername: req.session.user.username,
            status: 'pending'
        },
        {
            $set: {
                status: 'cancelled',
                processedAt: new Date(),
                adminNote: 'Người chơi tự hủy yêu cầu'
            }
        },
        { new: true }
    );

    if (!request) {
        return res.status(400).json({ message: 'Chỉ có thể hủy yêu cầu đang chờ duyệt.' });
    }

    const user = await User.findOneAndUpdate(
        { username: req.session.user.username },
        {
            $inc: { score: request.pointsSpent },
            $push: {
                history: {
                    activity: `↩️ Hoàn ${request.pointsSpent} điểm do hủy yêu cầu ${request.requestCode}`,
                    timestamp: new Date()
                }
            }
        },
        { new: true }
    ).select('score');

    res.json({
        message: `Đã hủy yêu cầu và hoàn ${request.pointsSpent.toLocaleString('vi-VN')} điểm.`,
        newScore: user?.score || 0,
        request
    });
});

app.get('/api/admin/robux-redemptions', requireAdmin, async (req, res) => {
    const allowedStatuses = ['all', 'pending', 'approved', 'paid', 'rejected', 'cancelled'];
    const requestedStatus = allowedStatuses.includes(req.query.status) ? req.query.status : 'pending';
    const filter = requestedStatus === 'all' ? {} : { status: requestedStatus };
    const requests = await RobuxRedemption.find(filter).sort({ createdAt: -1 }).limit(200).lean();

    const summaryRows = await RobuxRedemption.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, robux: { $sum: '$robuxAmount' } } }
    ]);
    const summary = Object.fromEntries(summaryRows.map(row => [row._id, { count: row.count, robux: row.robux }]));

    res.json({ config: getRobuxRewardConfig(), requests, summary });
});

app.post('/api/admin/robux-redemptions/:requestId/action', requireAdmin, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.requestId)) {
        return res.status(400).json({ message: 'Mã yêu cầu không hợp lệ.' });
    }

    const action = String(req.body.action || '').trim();
    const adminNote = String(req.body.adminNote || '').trim().slice(0, 500);
    const adminUsername = req.session.user.username;
    let fromStatuses;
    let nextStatus;

    if (action === 'approve') {
        fromStatuses = ['pending'];
        nextStatus = 'approved';
    } else if (action === 'mark-paid') {
        fromStatuses = ['approved'];
        nextStatus = 'paid';
    } else if (action === 'reject') {
        fromStatuses = ['pending', 'approved'];
        nextStatus = 'rejected';
    } else {
        return res.status(400).json({ message: 'Hành động không hợp lệ.' });
    }

    const request = await RobuxRedemption.findOneAndUpdate(
        { _id: req.params.requestId, status: { $in: fromStatuses } },
        {
            $set: {
                status: nextStatus,
                adminNote,
                processedBy: adminUsername,
                processedAt: new Date()
            }
        },
        { new: true }
    );

    if (!request) {
        return res.status(409).json({ message: 'Yêu cầu đã được xử lý hoặc không còn ở trạng thái phù hợp.' });
    }

    if (nextStatus === 'rejected') {
        await User.updateOne(
            { username: request.gameUsername },
            {
                $inc: { score: request.pointsSpent },
                $push: {
                    history: {
                        activity: `↩️ Hoàn ${request.pointsSpent} điểm vì yêu cầu ${request.requestCode} bị từ chối`,
                        timestamp: new Date()
                    }
                }
            }
        );
    } else if (nextStatus === 'paid') {
        await User.updateOne(
            { username: request.gameUsername },
            {
                $push: {
                    history: {
                        activity: `✅ Yêu cầu ${request.requestCode}: admin xác nhận đã chi ${request.robuxAmount} Robux`,
                        timestamp: new Date()
                    }
                }
            }
        );
    }

    res.json({
        message: nextStatus === 'approved'
            ? 'Đã duyệt yêu cầu. Hãy thanh toán bằng phương thức chính thức của Roblox rồi đánh dấu đã trả.'
            : nextStatus === 'paid'
                ? 'Đã đánh dấu yêu cầu là đã trả Robux.'
                : `Đã từ chối và hoàn ${request.pointsSpent.toLocaleString('vi-VN')} điểm.`,
        request
    });
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
            houseData: friend.houseData || [],
            worldSettings: friend.worldSettings || { theme: 'spring', weatherMode: 'auto', timeMode: 'auto' }
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
            worldSettings: user.worldSettings || { theme: 'spring', weatherMode: 'auto', timeMode: 'auto' },
            shopItems: SHOP_ITEMS // Đảm bảo biến SHOP_ITEMS đã được khai báo ở trên
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
});
// 2. Mua đồ
app.post('/api/house/buy', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Chưa đăng nhập' });

    const itemId = String(req.body.itemId || '');
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return res.status(400).json({ message: 'Vật phẩm không tồn tại' });

    // Sơn và sàn được bán theo gói 10 ô; các vật phẩm khác nhận 1 món.
    const quantity = ['paint', 'floor'].includes(item.category) ? 10 : 1;
    const inventoryItems = Array.from({ length: quantity }, () => itemId);
    const user = await User.findOneAndUpdate(
        {
            username: req.session.user.username,
            isSuspended: { $ne: true },
            score: { $gte: item.price }
        },
        {
            $inc: { score: -item.price },
            $push: {
                inventory: { $each: inventoryItems },
                history: {
                    activity: `🛍️ Mua ${quantity} x ${item.name}: -${item.price} điểm`,
                    timestamp: new Date()
                }
            }
        },
        { new: true }
    ).select('score');

    if (!user) {
        return res.status(400).json({ message: 'Không đủ điểm hoặc tài khoản đang bị tạm khóa.' });
    }

    res.json({
        message: `Đã mua ${quantity} x ${item.name}!`,
        newScore: user.score,
        quantity
    });
});

// 3. Lưu vị trí đồ đạc (ĐÃ FIX LỖI CƯỚP NHÀ)
app.post('/api/house/save', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Chưa đăng nhập' });
    const { username, hostUsername, items, inventory, chestsData, worldSettings } = req.body;    
    
    // BẢO MẬT: Chặn không cho lưu nếu tên chủ nhà (gửi từ frontend) khác với tên người đang đăng nhập
    if ((username && username !== req.session.user.username) || (hostUsername && hostUsername !== req.session.user.username)) {
        return res.status(403).json({ message: "Bạn chỉ có thể lưu khi ở thế giới của chính mình!" });
    }

    await User.updateOne(
        { username: req.session.user.username }, 
        { $set: {
            houseData: Array.isArray(items) ? items : [],
            inventory: Array.isArray(inventory) ? inventory : [],
            chestsData: chestsData || {},
            worldSettings: {
                theme: ['spring', 'sunset', 'winter', 'fantasy'].includes(worldSettings?.theme) ? worldSettings.theme : 'spring',
                weatherMode: ['auto', 'clear', 'rain', 'snow', 'fog'].includes(worldSettings?.weatherMode) ? worldSettings.weatherMode : 'auto',
                timeMode: ['auto', 'day', 'sunset', 'night'].includes(worldSettings?.timeMode) ? worldSettings.timeMode : 'auto'
            }
        } } 
    );
    res.json({ message: "Đã lưu ngôi nhà và kho đồ!" });
});
// =================================================================
// --- 8. SOCKET.IO (KHÔI PHỤC LOGIC CARO/CHESS CHI TIẾT) ---
// =================================================================

function normalizeRoomId(value) {
    return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40);
}
async function ensureTournamentSocketRoom(roomId, gameType, username) {
    if (!roomId.startsWith('TOUR-')) return gameRooms[roomId] || null;
    const tourney = await Tournament.findOne({ status: 'playing', gameType });
    if (!tourney) return null;
    const match = findTournamentMatch(tourney, roomId);
    if (!match || match.winner || ![match.p1, match.p2].includes(username)) return null;
    const start = new Date(match.startTime || Date.now());
    const earliest = start.getTime() - 30 * 60 * 1000;
    const latest = start.getTime() + (Number(tourney.matchDuration) + 90) * 60 * 1000;
    if (Date.now() < earliest || Date.now() > latest) return null;
    match.checkIns ||= {};
    match.checkIns[username] = new Date();
    if (match.status === 'scheduled') match.status = 'checking-in';
    tourney.markModified('brackets'); await tourney.save();
    if (!gameRooms[roomId]) {
        gameRooms[roomId] = {
            gameType, players: [], playerNames: {}, turn: null, tournament: true,
            expectedPlayers: [match.p1, match.p2], matchId: roomId,
            matchDuration: tourney.matchDuration, size: gameType === 'caro' ? 20 : 13,
            board: gameType === 'caro' ? Array.from({ length: 20 }, () => Array(20).fill(null)) : null
        };
    }
    return gameRooms[roomId];
}
async function joinTwoPlayerRoom({ socket, rawRoomId, gameType, username, roles, createdEvent = 'matchFound' }) {
    const roomId = normalizeRoomId(rawRoomId);
    let room = gameRooms[roomId];
    if (!room && roomId.startsWith('TOUR-')) room = await ensureTournamentSocketRoom(roomId, gameType, username);
    if (!room || room.gameType !== gameType) {
        socket.emit('notification', '❌ Phòng không tồn tại, sai môn thi hoặc chưa đến giờ vào trận.');
        return null;
    }
    const duplicateId = Object.keys(room.playerNames || {}).find(id => room.playerNames[id] === username && id !== socket.id);
    if (duplicateId) {
        const oldSocket = io.sockets.sockets.get(duplicateId);
        if (oldSocket?.connected) { socket.emit('notification', '❌ Tài khoản đang ở trong phòng trên thiết bị khác.'); return null; }
        room.players = room.players.filter(id => id !== duplicateId); delete room.playerNames[duplicateId];
    }
    if (room.expectedPlayers && !room.expectedPlayers.includes(username)) {
        socket.emit('notification', '❌ Bạn không nằm trong cặp đấu này.'); return null;
    }
    if (!room.players.includes(socket.id)) {
        if (room.players.length >= 2) { socket.emit('notification', '❌ Phòng đã đủ hai người.'); return null; }
        room.players.push(socket.id); room.playerNames[socket.id] = username; socket.join(roomId);
    }
    if (room.players.length < 2) {
        socket.emit('waiting', { message: 'Đã vào phòng. Đang chờ đối thủ...', room: roomId });
        return room;
    }
    if (room.expectedPlayers) {
        room.players.sort((a, b) => room.expectedPlayers.indexOf(room.playerNames[a]) - room.expectedPlayers.indexOf(room.playerNames[b]));
    }
    const [firstId, secondId] = room.players;
    room.turn = firstId;
    if (gameType === 'caro' && !room.board) room.board = Array.from({ length: 20 }, () => Array(20).fill(null));
    const payloadBase = { room: roomId, isTournament: Boolean(room.tournament), matchDuration: room.matchDuration || 20, size: room.size };
    io.to(firstId).emit(createdEvent, { ...payloadBase, role: roles[0], opponent: room.playerNames[secondId], yourTurn: true });
    io.to(secondId).emit(createdEvent, { ...payloadBase, role: roles[1], opponent: room.playerNames[firstId], yourTurn: false });
    if (room.tournament) {
        const tourney = await Tournament.findOne({ status: 'playing', gameType });
        const match = tourney && findTournamentMatch(tourney, roomId);
        if (match) { match.status = 'live'; match.actualStartTime ||= new Date(); tourney.markModified('brackets'); await tourney.save(); io.emit('tournamentUpdated'); }
    }
    return room;
}
function hasCaroFive(board, row, col, symbol) {
    const dirs = [[1,0],[0,1],[1,1],[1,-1]];
    return dirs.some(([dr,dc]) => {
        let count = 1;
        for (const sign of [-1, 1]) for (let step = 1; step < 6; step++) {
            const r = row + dr * step * sign, c = col + dc * step * sign;
            if (r < 0 || c < 0 || r >= board.length || c >= board.length || board[r][c] !== symbol) break;
            count += 1;
        }
        return count >= 5;
    });
}

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
socket.on('findMatch', (rawGameType) => {
    const gameType = normalizeGameType(rawGameType);
    if (!gameType) return socket.emit('notification', '❌ Trò chơi không hợp lệ.');
    const queued = waitingPlayers[gameType];
    if (queued && queued.connected && queued.id !== socket.id) {
        delete waitingPlayers[gameType];
        const opponentName = queued.request.session?.user?.username || `Khách-${queued.id.slice(0,4)}`;
        const roomId = normalizeRoomId(`ROOM-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`);
        gameRooms[roomId] = { gameType, players: [queued.id, socket.id], playerNames: { [queued.id]: opponentName, [socket.id]: username }, turn: queued.id, size: gameType === 'caro' ? 20 : 13, board: gameType === 'caro' ? Array.from({ length: 20 }, () => Array(20).fill(null)) : null };
        queued.join(roomId); socket.join(roomId);
        const roles = gameType === 'caro' ? ['X','O'] : ['b','w'];
        queued.emit('matchFound', { room: roomId, role: roles[0], opponent: username, yourTurn: true, size: gameRooms[roomId].size });
        socket.emit('matchFound', { room: roomId, role: roles[1], opponent: opponentName, yourTurn: false, size: gameRooms[roomId].size });
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
    // --- PHÒNG CỜ VUA VÀ CARO: PHÒNG HỢP LỆ + SERVER XÁC THỰC ---
    socket.on('createChessRoom', () => {
        const roomId = Math.random().toString(36).slice(2, 7).toUpperCase();
        gameRooms[roomId] = { gameType: 'chess', players: [socket.id], playerNames: { [socket.id]: username }, turn: null };
        socket.join(roomId); socket.emit('roomCreated', roomId);
    });
    socket.on('joinChessRoom', async roomId => { await joinTwoPlayerRoom({ socket, rawRoomId: roomId, gameType: 'chess', username, roles: ['w','b'] }); });

    socket.on('createCaroRoom', () => {
        const roomId = Math.random().toString(36).slice(2, 7).toUpperCase();
        gameRooms[roomId] = { gameType: 'caro', players: [socket.id], playerNames: { [socket.id]: username }, turn: null, size: 20, board: Array.from({ length: 20 }, () => Array(20).fill(null)) };
        socket.join(roomId); socket.emit('roomCreated', roomId);
    });
    socket.on('joinCaroRoom', async roomId => { await joinTwoPlayerRoom({ socket, rawRoomId: roomId, gameType: 'caro', username, roles: ['X','O'] }); });
    socket.on('caroMove', async payload => {
        const roomId = normalizeRoomId(payload?.room);
        const room = gameRooms[roomId];
        const r = Number(payload?.r), c = Number(payload?.c);
        if (!room || room.gameType !== 'caro' || !room.players.includes(socket.id)) return;
        if (room.turn !== socket.id) return socket.emit('notification', '⏳ Chưa đến lượt của bạn.');
        if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || c < 0 || r >= 20 || c >= 20 || room.board[r][c]) return socket.emit('notification', '❌ Nước đi không hợp lệ.');
        const playerIndex = room.players.indexOf(socket.id); const symbol = playerIndex === 0 ? 'X' : 'O';
        room.board[r][c] = symbol;
        io.to(roomId).emit('caroMoveAccepted', { r, c, symbol, playerId: socket.id });
        if (hasCaroFive(room.board, r, c, symbol)) {
            const winnerName = room.playerNames[socket.id];
            if (room.tournament) await recordTournamentWinner(room.matchId || roomId, winnerName, { source: 'caro-server' });
            await User.updateOne({ username: winnerName }, { $inc: { score: 20 }, $push: { history: { activity: '🏆 Thắng Caro online: +20đ', timestamp: new Date() } } });
            io.to(roomId).emit('caroGameOver', { winnerId: socket.id, winnerName, reason: 'five-in-row' }); delete gameRooms[roomId]; return;
        }
        if (room.board.every(row => row.every(Boolean))) { io.to(roomId).emit('caroGameOver', { winnerId: null, winnerName: null, reason: 'draw' }); delete gameRooms[roomId]; return; }
        room.turn = room.players[playerIndex === 0 ? 1 : 0];
        io.to(roomId).emit('turnUpdate', { nextTurnId: room.turn });
    });
    socket.on('caroWinCustom', () => socket.emit('notification', 'Kết quả Caro được máy chủ tự xác thực.'));
    socket.on('move', data => {
        const roomId = normalizeRoomId(data?.room); const room = gameRooms[roomId];
        if (!room || !room.players.includes(socket.id) || !data?.move) return;
        socket.to(roomId).emit('move', data.move);
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
    socket.on('joinGoRoom', async roomId => { await joinTwoPlayerRoom({ socket, rawRoomId: roomId, gameType: 'go', username, roles: ['b','w'] }); });

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

        // Cờ Tỷ Phú: không hủy toàn bộ ván ngay khi một người rời phòng.
        for (const [roomId, room] of Object.entries(monopolyGames)) {
            const pIdx = room.players.findIndex(player => player.id === socket.id);
            if (pIdx === -1) continue;
            if (room.state === 'waiting') {
                room.players.splice(pIdx, 1);
                if (!room.players.length) { delete monopolyGames[roomId]; continue; }
                if (room.hostId === socket.id) room.hostId = room.players[0].id;
                room.players.forEach(player => { player.isHost = player.id === room.hostId; });
                io.to(roomId).emit('lobbyUpdate', { roomId, players: room.players, hostId: room.hostId });
                continue;
            }
            if (room.state === 'playing' && room.gameLogic) {
                const player = room.gameLogic.players.find(item => item.id === socket.id);
                if (player) { player.isBankrupt = true; player.money = 0; room.gameLogic.log(`🚪 ${player.username} đã rời ván và được tính là phá sản.`); }
                if (room.auctionInterval) { clearInterval(room.auctionInterval); room.auctionInterval = null; delete room.auction; }
                room.awaitingDecision = null;
                const current = room.gameLogic.getCurrentPlayer();
                if (current?.id === socket.id) room.gameLogic.nextTurn();
                room.players = room.gameLogic.players;
                io.to(roomId).emit('monopolyUpdate', { players: room.players, turnIndex: room.gameLogic.turnIndex, propertyHouses: room.gameLogic.propertyHouses, logs: room.gameLogic.logs.slice(-3) });
                const next = room.gameLogic.getCurrentPlayer(); if (next) io.to(roomId).emit('turnChanged', { turn: next.id });
                await finishMonopolyGame(roomId);
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
    socket.on('joinOthelloRoom', async roomId => { await joinTwoPlayerRoom({ socket, rawRoomId: roomId, gameType: 'othello', username, roles: ['b','w'] }); });

    socket.on('reportGameResult', async ({ roomId: rawRoomId, winner }) => {
        const roomId = normalizeRoomId(rawRoomId); const room = gameRooms[roomId];
        if (!room || !room.players.includes(socket.id) || !room.tournament) return;
        const claimed = normalizeUsername(winner);
        if (claimed !== room.playerNames[socket.id]) return socket.emit('notification', '❌ Kết quả không hợp lệ.');
        await recordTournamentWinner(room.matchId || roomId, claimed, { source: `${room.gameType}-client` });
        io.to(roomId).emit('gameOver', { winner: claimed, reason: 'reported' }); delete gameRooms[roomId];
    });

});
// --- CỖ MÁY GIẢI ĐẤU THỐNG NHẤT ---
async function recordTournamentWinner(matchId, winnerUsername, options = {}) {
    if (!matchId || !winnerUsername) return false;
    const tourney = await Tournament.findOne({ status: 'playing', $or: [{ 'brackets.matchId': matchId }, { 'brackets.matches.matchId': matchId }] });
    if (!tourney) return false;
    const match = findTournamentMatch(tourney, matchId);
    if (!match || match.winner || ![match.p1, match.p2].includes(winnerUsername)) return false;
    match.winner = winnerUsername;
    match.loser = winnerUsername === match.p1 ? match.p2 : match.p1;
    match.status = 'finished'; match.finishedAt = new Date(); match.resultSource = options.source || 'game';
    tourney.markModified('brackets'); await tourney.save();
    await advanceTournament(tourney); io.emit('tournamentUpdated');
    return true;
}
async function tournamentMaintenance() {
    try {
        const now = new Date();
        const open = await Tournament.findOne({ status: 'open', registrationDeadline: { $lte: now } });
        if (open) {
            if ((open.participants || []).length < 2) { open.status = 'cancelled'; open.finishedAt = now; await open.save(); io.emit('tournamentUpdated'); }
            else await startTournament(open);
        }
        const tourney = await Tournament.findOne({ status: 'playing' });
        if (!tourney) return;
        let changed = false;
        for (const match of tournamentMatches(tourney)) {
            if (match.winner || !match.startTime) continue;
            const start = new Date(match.startTime);
            const elapsed = (now - start) / 60000;
            const checkIns = match.checkIns || {};
            if (elapsed >= -5 && elapsed < 1 && !match.reminderSent) {
                for (const player of [match.p1, match.p2]) {
                    const id = onlineUsers[player]; if (id) io.to(id).emit('matchNotice', { title: '🔔 Sắp thi đấu', message: `Trận bắt đầu lúc ${start.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })}. Mã phòng: ${match.matchId}`, type: 'warning' });
                }
                match.reminderSent = true; changed = true;
            }
            if (elapsed > Number(tourney.matchDuration || 20) + 10) {
                const p1In = Boolean(checkIns[match.p1]), p2In = Boolean(checkIns[match.p2]);
                if (p1In !== p2In) { match.winner = p1In ? match.p1 : match.p2; match.loser = p1In ? match.p2 : match.p1; match.resultSource = 'forfeit'; }
                else { match.status = 'review'; match.resultSource = 'timeout-review'; }
                match.finishedAt = now; if (match.winner) match.status = 'finished'; changed = true;
            }
        }
        if (changed) { tourney.markModified('brackets'); await tourney.save(); if (tournamentMatches(tourney).every(match => match.winner)) await advanceTournament(tourney); io.emit('tournamentUpdated'); }
    } catch (error) { console.error('Lỗi bảo trì giải đấu:', error); }
}
setInterval(tournamentMaintenance, 60000);

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
