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
const MONGO_URI = process.env.MONGO_URI; 
const PORT = process.env.PORT || 3000;

// --- 1. IMPORT DỮ LIỆU & LOGIC ---
const { tests, maths } = require('./question-data.js'); 
const { boardData } = require('./monopoly-data.js');
const MonopolyGame = require('./monopoly-logic.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
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
    inventory: { type: Array, default: [] }, // Danh sách ID đồ đã mua: ['bed_1', 'table_2']
    houseData: { type: Array, default: [] },
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
    { id: 'bed_lux', name: 'Giường Hoàng Gia', price: 500, type: 'f', category: 'furniture', icon: '🛌' },
    { id: 'sofa_pro', name: 'Sofa Cao Cấp', price: 400, type: 'f', category: 'furniture', icon: '🛋️' },
    { id: 'wardrobe_big', name: 'Tủ Quần Áo', price: 450, type: 'f', category: 'furniture', icon: '👗' },
    { id: 'kit_fridge', name: 'Tủ Lạnh', price: 450, type: 'f', category: 'furniture', icon: '🧊' },
    { id: 'bath_tub', name: 'Bồn Tắm', price: 550, type: 'f', category: 'furniture', icon: '🛁' },
    { id: 'tv_8k', name: 'Tivi 8K', price: 600, type: 'e', category: 'furniture', icon: '📺' },
    { id: 'pc_super', name: 'Siêu Máy Tính', price: 700, type: 'e', category: 'furniture', icon: '🖥️' },
    { id: 'kit_fridge', name: 'Tủ Lạnh 2 Cánh', price: 450, type: 'f', icon: '🧊' },
    { id: 'kit_stove', name: 'Bếp Nấu Ăn', price: 300, type: 'f', icon: '🍳' },
    { id: 'kit_pot', name: 'Nồi Súp Ngon', price: 50, type: 'f', icon: '🍲' },
    { id: 'bath_tub', name: 'Bồn Tắm Sục', price: 550, type: 'f', icon: '🛁' },
    { id: 'bath_toilet', name: 'Bồn Cầu Vàng', price: 250, type: 'f', icon: '🚽' },
    { id: 'bath_duck', name: 'Vịt Tắm', price: 20, type: 'f', icon: '🦆' },

    // --- 3. ĐIỆN TỬ & CÔNG NGHỆ (e) ---
    { id: 'tv_8k', name: 'Tivi 8K Siêu Mỏng', price: 600, type: 'e', icon: '📺' },
    { id: 'pc_super', name: 'Siêu Máy Tính', price: 700, type: 'e', icon: '🖥️' },
    { id: 'laptop_pro', name: 'Laptop Mỏng Nhẹ', price: 500, type: 'e', icon: '💻' },
    { id: 'speaker_hiend', name: 'Loa Âm Thanh Vòm', price: 300, type: 'e', icon: '🔊' },
    { id: 'robot_clean', name: 'Robot Hút Bụi', price: 200, type: 'e', icon: '🤖' },
    { id: 'camera_sec', name: 'Camera An Ninh', price: 150, type: 'e', icon: '📹' },
    { id: 'lamp_modern', name: 'Đèn Ngủ Cảm Ứng', price: 150, type: 'e', icon: '🏮' },

    // --- 4. TRANG TRÍ & SÂN VƯỜN (d) ---
    { id: 'piano_grand', name: 'Đàn Piano Cơ', price: 1000, type: 'd', icon: '🎹' },
    { id: 'aquarium_pro', name: 'Bể Cá Thủy Sinh', price: 550, type: 'd', icon: '🐠' },
    { id: 'bonsai_tree', name: 'Cây Cảnh Nghệ Thuật', price: 180, type: 'd', icon: '🪴' },
    { id: 'xmas_tree', name: 'Cây Thông Noel', price: 300, type: 'd', icon: '🎄' },
    { id: 'fountain', name: 'Đài Phun Nước', price: 800, type: 'd', icon: '⛲' },
    { id: 'flower_sun', name: 'Hoa Hướng Dương', price: 50, type: 'd', icon: '🌻' },
    { id: 'statue_moai', name: 'Tượng Moai', price: 400, type: 'd', icon: '🗿' },
    { id: 'bear_huge', name: 'Gấu Bông Khổng Lồ', price: 120, type: 'd', icon: '🧸' },
    { id: 'telescope_v2', name: 'Kính Thiên Văn', price: 400, type: 'd', icon: '🔭' },
    { id: 'painting_art', name: 'Tranh Triển Lãm', price: 300, type: 'd', icon: '🖼️' },
    { id: 'clock_gold', name: 'Đồng Hồ Quả Lắc', price: 220, type: 'd', icon: '⏰' },
    { id: 'safe_box', name: 'Két Sắt', price: 600, type: 'd', icon: '🔐' },
    { id: 'trophy_gold', name: 'Cúp Vô Địch', price: 900, type: 'd', icon: '🏆' },

    // --- 5. THÚ CƯNG (p) ---
    { id: 'cat_tree_v2', name: 'Tháp Cho Mèo', price: 280, type: 'p', icon: '🐱' },
    { id: 'dog_house', name: 'Nhà Cho Cún Con', price: 260, type: 'p', icon: '🐶' },
    { id: 'hamster', name: 'Hamster', price: 100, type: 'p', icon: '🐹' },
    { id: 'parrot', name: 'Vẹt Biết Nói', price: 350, type: 'p', icon: '🦜' },
    { id: 'unicorn', name: 'Kỳ Lân (Hiếm)', price: 5000, type: 'p', icon: '🦄' },

];

const MATERIALS = [
    { id: 'wall_pink', name: 'Sơn Hồng', price: 50, category: 'paint', value: '#fd79a8', icon: '🎨' },
    { id: 'wall_blue', name: 'Sơn Xanh', price: 50, category: 'paint', value: '#0984e3', icon: '🎨' },
    { id: 'floor_wood', name: 'Sàn Gỗ', price: 100, category: 'floor', value: '#d35400', icon: '🪵' },
    { id: 'floor_grass', name: 'Thảm Cỏ', price: 150, category: 'floor', value: '#2ecc71', icon: '🌿' }
];

const SHOP_ITEMS = [...HOME_FURNITURE, ...MATERIALS, ...SEASONAL_SOUVENIRS];
const notificationSchema = new mongoose.Schema({
    title: String,
    content: String,
    type: { type: String, default: 'info' }, // 'info' (xanh), 'event' (vàng), 'warning' (đỏ)
    date: { type: Date, default: Date.now }
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
                // Lấy mật khẩu từ file .env cho an toàn
                // Nếu chưa cấu hình .env thì mới dùng mật khẩu dự phòng bên phải
                const adminPass = process.env.ADMIN_PASSWORD || 'MatKhauDuPhongAnToan123';                
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
const sessionMiddleware = session({
    // Lấy secret từ file .env, nếu không có thì dùng chuỗi dự phòng
    secret: process.env.SESSION_SECRET || 'hanh-tinh-mo-uoc-vinh-cuu-merged-2026',
    resave: false,
    saveUninitialized: false, 
    store: MongoStore.create({ mongoUrl: MONGO_URI }), 
    cookie: { 
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000 
    } 
});
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);
app.use(express.json());
app.use(express.static(__dirname));

// --- 4. TRẠNG THÁI SERVER (IN-MEMORY) ---
const gameRooms = {};       
const waitingPlayers = {};  
const monopolyQueue = [];   
let maintenanceMode = false; // Đã khôi phục biến bảo trì

// --- 5. API HỆ THỐNG (AUTH) ---
app.post('/api/house/save-drawing', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Chưa đăng nhập' });
    const { level, image } = req.body;
    await User.updateOne(
        { username: req.session.user.username },
        { $push: { galleryDrawings: { level, image, date: new Date() } } }
    );
    res.json({ message: "Bức tranh đã được đưa vào triển lãm!" });
});
// 1. Kho nhiệm vụ đa dạng (Càng lên cấp cao nhiệm vụ càng khó)
const QUEST_POOL = [
    { taskType: 'Cờ Vua', levelKey: 'chessLevel', targetBase: 1, rewardBase: 50 },
    { taskType: 'Ghép Hình', levelKey: 'memoryLevel', targetBase: 2, rewardBase: 30 },
    { taskType: 'Ô Chữ', levelKey: 'crosswordLevel', targetBase: 1, rewardBase: 40 },
    { taskType: 'Thám tử', levelKey: 'detectiveLevel', targetBase: 1, rewardBase: 60 },
    { taskType: 'Cờ Caro', levelKey: 'caroLevel', targetBase: 2, rewardBase: 50 },
    { taskType: 'Cờ Vây', levelKey: 'goLevel', targetBase: 1, rewardBase: 100 }
];

// 2. Hàm tự động cấp 4 nhiệm vụ "hợp trình độ" mỗi ngày
async function refreshDailyQuests(user) {
    const today = new Date().toDateString();
    // Lọc các nhiệm vụ hàng ngày của hôm nay
    const hasDailyToday = user.quests.some(q => q.isDaily && q.date === today);

    if (!hasDailyToday) {
        // Xóa nhiệm vụ hàng ngày cũ của hôm qua (giữ lại nhiệm vụ Admin giao riêng)
        user.quests = user.quests.filter(q => !q.isDaily);

        // Trộn kho nhiệm vụ và lấy 4 cái ngẫu nhiên
        const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 4);

        selected.forEach(q => {
            const currentLvl = user[q.levelKey] || 1;
            // Tiến độ yêu cầu tăng theo cấp độ (VD: Cấp 10 yêu cầu thắng nhiều ván hơn)
            const dynamicTarget = q.targetBase + Math.floor(currentLvl / 5); 
            const dynamicReward = q.rewardBase + (currentLvl * 5);

            user.quests.push({
                id: 'd-' + Math.random().toString(36).substr(2, 5),
                taskType: q.taskType,
                target: dynamicTarget,
                reward: dynamicReward,
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
app.post('/api/register/:role', async (req, res) => {
    const { username, password, parentCode } = req.body;
    const role = req.params.role;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại!' });

        let linkedParent = null;
        if (role === 'child') {
            linkedParent = await User.findOne({ role: 'parent', parentCode: parentCode });
            if (!linkedParent && parentCode) {
                return res.status(400).json({ message: 'Mã phụ huynh không tồn tại!' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            password: hashedPassword,
            role: username === 'Admin' ? 'admin' : role,
            parentCode: role === 'parent' ? Math.random().toString(36).substring(7).toUpperCase() : null,
        });

        await newUser.save();

        if (role === 'child' && linkedParent) {
            linkedParent.children.push(username);
            await linkedParent.save();
        }

       // Thay đoạn cũ bằng đoạn này:
res.json({ 
    message: 'Đăng ký thành công!', 
    user: { 
        username, 
        role: newUser.role, 
        parentCode: newUser.parentCode // Thêm dòng này để hiện mã cho phụ huynh
    } 
});
    } catch (e) {
        res.status(500).json({ message: 'Lỗi server: ' + e.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Sai tên đăng nhập hoặc mật khẩu!' });
        }
        if (user.isSuspended) return res.status(403).json({ message: 'Tài khoản đã bị khóa!' });

        req.session.user = { username: user.username, role: user.role };
        req.session.save();

        res.json({ 
    message: 'Đăng nhập thành công!', 
    user: { 
        username: user.username, 
        role: user.role, 
        parentCode: user.parentCode,
        children: user.children // Thêm dòng này để hiện danh sách các bé
    } 
});       
    } catch (e) {
        res.status(500).json({ message: 'Lỗi đăng nhập' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Đăng xuất thành công' });
});

app.get('/api/user/progress', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Chưa đăng nhập' });
    const user = await User.findOne({ username: req.session.user.username }).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
    if (user.role === 'admin') {
        const levels = ['chessLevel', 'caroLevel', 'memoryLevel', 'crosswordLevel', 'detectiveLevel', 'goLevel', 'othelloLevel', 'storyLevel', 'shapeLevel', 'buildLevel', 'paintingLevel', 'monopolyLevel', 'vietSpeechLevel', 'englishSpeechLevel'];
        levels.forEach(l => user[l] = 100); // Ép hiển thị 100 cấp độ trên giao diện
    }
    await refreshDailyQuests(user);
    res.json(user);
});

// --- 6. API ADMIN (ĐÃ KHÔI PHỤC ĐẦY ĐỦ) ---
// 1. Admin gửi thông báo chính thức (Lưu vào DB)
app.post('/api/admin/post-notification', async (req, res) => {
    const { title, content, type } = req.body;
    const newNotify = new Notification({ title, content, type });
    await newNotify.save();

    // Vừa lưu vào DB, vừa gửi thông báo trực tiếp (real-time) cho những bé đang online
    io.emit('adminNotification', { title, message: content });
    res.json({ message: "Đã đăng thông báo thành công!" });
});

// 2. Bé lấy danh sách thông báo để xem
app.get('/api/notifications', async (req, res) => {
    // Lấy 20 thông báo mới nhất
    const list = await Notification.find().sort({ date: -1 }).limit(20);
    res.json(list);
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
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền' });
    
    const { username, ...updateData } = req.body; 
    
    try {
        // Chuyển đổi các giá trị sang số để đảm bảo tính toán đúng
        for (let key in updateData) {
            if (key !== 'username' && !Array.isArray(updateData[key])) {
               updateData[key] = parseInt(updateData[key]);
            }
        }
        await User.updateOne({ username }, { $set: updateData });
        res.json({ message: 'Đã cập nhật đầy đủ 11 cấp độ cho ' + username });
    } catch(e) {
        res.status(500).json({ message: 'Lỗi khi cập nhật dữ liệu' });
    }
});
// Lấy danh sách user
app.get('/api/admin/all-users', async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
});
// Tạo user nhanh
app.post('/api/admin/create-user', async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username, password: hashedPassword, role,
            parentCode: role === 'parent' ? 'P-' + Date.now() : null
        });
        await newUser.save();
        res.json({ message: 'Tạo thành công' });
    } catch(e) { res.status(400).json({ message: 'Lỗi tạo user' }); }
});

// Xóa user
app.post('/api/admin/delete-user', async (req, res) => {
    await User.deleteOne({ username: req.body.username });
    res.json({ message: 'Đã xóa user' });
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
app.post('/api/admin/broadcast', (req, res) => {
    io.emit('adminNotification', { title: 'Thông Báo Từ Admin', message: req.body.message });
    res.json({ message: 'Đã gửi broadcast' });
});

// Giao nhiệm vụ (Quest) - Đã khôi phục logic lưu vào DB
// Giao nhiệm vụ (Quest) - Đã sửa lỗi biến timeLimit
app.post('/api/admin/assign-quest', async (req, res) => {
    const { username, taskType, target, reward, penalty, timeLimit } = req.body;
    const user = await User.findOne({ username });
    if (user) {
        user.quests.push({
            id: 'q' + Date.now(), taskType, target: parseInt(target), 
            reward: parseInt(reward), penalty: parseInt(penalty || 0), 
            timeLimit: parseInt(timeLimit || 0), progress: 0
        });
        user.markModified('quests');
        await user.save();
        res.json({ message: 'Giao nhiệm vụ thành công!' });
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
    for (let i = user.quests.length - 1; i >= 0; i--) {
        let q = user.quests[i];
        if (q.taskType === taskType || taskType.includes(q.taskType)) {
            // 1. Phạt điểm nếu quá giờ
            if (q.timeLimit > 0 && performance.timeTaken > q.timeLimit) {
                const p = parseInt(q.penalty || 20);
                user.score = Math.max(0, user.score - p); 
                user.history.push({ activity: `Thất bại NV ${q.taskType}: Quá giờ (-${p}đ)` });
                user.quests.splice(i, 1);
                continue;
            }
            // 2. Cộng tiến độ
            if (performance.isWin) {
                q.progress += 1;
                if (q.progress >= q.target) {
                    user.score += q.reward;
                    user.history.push({ activity: `🎉 Xong NV ${q.taskType}: +${q.reward}đ` });
                    user.quests.splice(i, 1);
                }
            }
        }
    }
}
async function handleWin(req, res, gameKey, points = 10, taskName = '') {
    if (!req.session.user) return res.status(401).json({ message: 'Chưa login' });
    
    try {
        const user = await User.findOne({ username: req.session.user.username });
        
        // 1. Lấy cấp độ bé vừa chơi xong (Gửi từ máy bé lên)
        const finishedLevel = parseInt(req.body.level) || 1; 
        // 2. Lấy cấp độ cao nhất bé đang có trong Database
        const currentMaxLevel = user[gameKey] || 1;

        let addedScore = 0;
        let isNewLevel = false;

        // 3. CHỈ TẶNG ĐIỂM NẾU BÉ VƯỢT QUA CẤP ĐỘ MỚI
        if (finishedLevel >= currentMaxLevel) {
            user.score += points;
            user[gameKey] = finishedLevel + 1; // Tăng mốc level mới trong DB
            addedScore = points;
            isNewLevel = true;
        }

        // Cập nhật nhiệm vụ (Nếu có)
        updateQuestProgress(user, taskName, { timeTaken: req.body.timeTaken || 0, isWin: true });

        user.markModified('quests');
        await user.save();

        res.json({ 
            message: isNewLevel ? `Chúc mừng! +${points}💎` : 'Bé đã hoàn thành cấp này trước đó rồi!', 
            newScore: user.score, 
            addedPoints: addedScore, // Sẽ trả về 0 nếu chơi lại cấp cũ
            newLevel: user[gameKey]
        });

    } catch (e) { 
        res.status(500).send("Lỗi: " + e.message); 
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
    
    // Kiểm tra nếu nộp bài sau 11 phút (cho dư 1 phút bù trừ lag mạng)
    if (!startTime || (now - startTime) > 11 * 60 * 1000) {
        return res.status(400).json({ 
            score: 0, 
            message: "Bài thi không hợp lệ do quá thời gian quy định!" 
        });
    }
    const { answers } = req.body; // Đáp án người dùng gửi lên: { 't1_1': '6', ... }
    const correctKeys = req.session.currentTestAnswers; // Đáp án đúng lấy từ Session

    if (!correctKeys) {
        return res.status(400).json({ score: 0, total: 0, message: "Lỗi phiên làm việc. Hãy tải lại trang!" });
    }

    let score = 0;
    let total = Object.keys(correctKeys).length;
    let details = {}; // Chứa thông tin đúng/sai để hiển thị lại

    // Duyệt qua từng câu hỏi trong đề thi
    for (let [questionId, correctAnswer] of Object.entries(correctKeys)) {
        const userAnswer = answers[questionId];
        
        if (userAnswer === correctAnswer) {
            score += 1; // Cộng 1 điểm mỗi câu đúng (Tổng 10 điểm)
        }
        
        // Gửi kèm đáp án đúng về để hiện ra
        details[questionId] = {
            correct: correctAnswer,
            userChosen: userAnswer,
            isCorrect: userAnswer === correctAnswer
        };
    }

    // Cộng điểm vào tài khoản (Nếu đã đăng nhập)
    if (req.session.user) {
        const user = await User.findOne({ username: req.session.user.username });
        if(user) {
            user.score += score * 10; // Mỗi câu 10 điểm
            user.history.push({ 
                activity: `Thi trắc nghiệm: ${score}/${total} câu đúng`, 
                timestamp: new Date() 
            });
            await user.save();
        }
    }

    // Phản hồi kết quả
    let msg = score === total ? "Xuất sắc! 🌟" : (score >= total/2 ? "Làm tốt lắm! 👍" : "Cố gắng lần sau nhé! 💪");
    delete req.session.testStartTime;
    delete req.session.currentTestAnswers;
    req.session.save();
    res.json({ 
        score: score, 
        total: total, 
        message: msg,
        details: details // Gửi chi tiết để client tô màu
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

// 1. Lấy thông tin nhà và Shop
app.get('/api/house/info', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Chưa đăng nhập' });
    
    try {
        const user = await User.findOne({ username: req.session.user.username });
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        res.json({ 
            // Bổ sung || để đảm bảo luôn có dữ liệu trả về, không bị undefined
            score: user.score || 0,
            inventory: user.inventory || [],
            houseData: user.houseData || [],
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

// 3. Lưu vị trí đồ đạc
app.post('/api/house/save', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Chưa đăng nhập' });
    const { items, inventory, colors } = req.body;    
    await User.updateOne(
        { username: req.session.user.username }, 
        { $set: { houseData: items, inventory: inventory,colors: colors } } // Lưu cả 2 cùng lúc
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

socket.on('findMathMatch', async (data) => {
    const grade = data.grade;
    const user = await User.findOne({ username: sessionUser.username });

    // 1. Kiểm tra bé có đủ 100 điểm để cược không
    if (!user || user.score < 100) {
        return socket.emit('statusUpdate', { message: "❌ Bé không đủ 100 điểm để tham gia cược!" });
    }

    if (mathWaitingPlayers[grade]) {
        const opponent = mathWaitingPlayers[grade];
        const roomId = `math-${opponent.id}-${socket.id}`;
        delete mathWaitingPlayers[grade];

        socket.join(roomId);
        opponent.join(roomId);

        // 2. Trừ 100 điểm cược của cả 2 bé ngay khi bắt đầu
        await User.updateMany(
            { username: { $in: [sessionUser.username, opponent.request.session.user.username] } },
            { $inc: { score: -100 }, $push: { history: { activity: `Cược 100đ tham gia Đấu Toán lớp ${grade}` } } }
        );

        gameRooms[roomId] = {
            gameType: 'math',
            players: {
                [opponent.id]: { username: opponent.request.session.user.username, score: 0, answers: [] },
                [socket.id]: { username: sessionUser.username, score: 0, answers: [] }
            },
            round: 1,
            grade: grade
        };

        io.to(roomId).emit('matchFound', { room: roomId, players: gameRooms[roomId].players });
        sendNextQuestion(roomId);

    } else {
        mathWaitingPlayers[grade] = socket;
        socket.emit('statusUpdate', { message: `🔍 Đang tìm đối thủ lớp ${grade}...` });
    }
});

// Hàm lấy câu hỏi ngẫu nhiên và gửi cho 2 bé
function sendNextQuestion(roomId) {
    const room = gameRooms[roomId];
    const gradeKey = 'grade' + room.grade;
    const questions = tests['toan'][gradeKey]['easy']; // Lấy từ question-data.js
    const qData = questions[Math.floor(Math.random() * questions.length)];

    io.to(roomId).emit('newQuestion', {
        question: qData.q,
        options: qData.a,
        round: room.round
    });
    room.currentCorrectAnswer = qData.correct;
}

socket.on('submitAnswer', async (data) => {
    const room = gameRooms[data.room];
    if (!room) return;

    const player = room.players[socket.id];
    if (data.answer === room.currentCorrectAnswer) {
        player.score += 10; // Cộng điểm tạm thời trong trận
    }

    // Kiểm tra xem cả 2 đã trả lời chưa
    const allAnswered = Object.values(room.players).every(p => p.answers.length === room.round);
    // (Lưu ý: Bạn cần thêm logic lưu câu trả lời vào mảng answers để kiểm tra)

    if (room.round < 10) {
        room.round++;
        sendNextQuestion(data.room);
    } else {
        handleMathGameOver(data.room);
    }
});

async function handleMathGameOver(roomId) {
    const room = gameRooms[roomId];
    const pIds = Object.keys(room.players);
    const p1 = room.players[pIds[0]];
    const p2 = room.players[pIds[1]];

    let resultMsg = "";

    // 3. TÍNH ĐIỂM THƯỞNG CUỐI TRẬN THEO YÊU CẦU
    if (p1.score > p2.score) {
        // P1 Thắng: Nhận 200 (đã trừ 100 lúc đầu -> lãi 100)
        await User.updateOne({ username: p1.username }, { $inc: { score: 200 } });
        // P2 Thua: Không nhận gì (mất 100 đã cược)
    } else if (p2.score > p1.score) {
        await User.updateOne({ username: p2.username }, { $inc: { score: 200 } });
    } else {
        // Hòa: Mỗi bé nhận lại 50 (mất 50 so với lúc đầu)
        await User.updateMany(
            { username: { $in: [p1.username, p2.username] } },
            { $inc: { score: 50 } }
        );
    }

    io.to(roomId).emit('gameOver', { players: room.players });
    delete gameRooms[roomId];
}
    // Tìm đoạn socket.on('timeoutLoss'...) và sửa lại thứ tự như sau:
socket.on('timeoutLoss', async ({ room, loserUsername, gameType }) => {
    const roomData = gameRooms[room];
    if (roomData) {
        const winnerId = roomData.players.find(id => id !== socket.id);
        const winnerUsername = roomData.playerNames[winnerId];

        // 1. Cập nhật kết quả Giải đấu (Lấy winnerUsername đã định nghĩa ở trên)
        if (room.startsWith('TOUR-')) {
    await Tournament.updateOne(
        { $or: [ { "brackets.matchId": room }, { "brackets.matches.matchId": room } ] },
        { 
            $set: { 
                "brackets.$.winner": winnerUsername, // Dành cho Knockout
                "brackets.$[].matches.$[m].winner": winnerUsername // Dành cho Vòng Bảng
            } 
        },
        { arrayFilters: [{ "m.matchId": room }] }
    );
}
        // 2. Thông báo và cộng điểm như cũ
        io.to(room).emit('gameOver', { winner: winnerUsername, reason: 'timeout', loser: loserUsername });
        await User.updateOne({ username: winnerUsername }, { $inc: { score: 20 } });
        delete gameRooms[room];
    }
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
    socket.on('joinMonopolyRoom', (roomId) => {
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

    // 4. Chủ phòng BẮT ĐẦU GAME
    socket.on('startMonopoly', (roomId) => {
        const room = monopolyGames[roomId];
        if (room && room.hostId === socket.id) {
            if (room.players.length < 2) {
                socket.emit('errorMsg', 'Cần ít nhất 2 người để chơi!');
                return;
            }

            room.state = 'playing';
            // Khởi tạo Logic Game từ file monopoly-logic.js
            // Lưu ý: Cần đảm bảo file monopoly-logic.js hỗ trợ nạp danh sách players
            room.gameLogic = new MonopolyGame(roomId); 
            room.gameLogic.players = room.players; // Gán danh sách người chơi từ sảnh vào game logic
            
            // Broadcast bắt đầu
            io.to(roomId).emit('monopolyUpdate', {
                gameState: 'playing',
                players: room.players,
                turnIndex: 0,
                logs: ['🏁 Trận đấu bắt đầu!']
            });
            
            io.to(roomId).emit('turnChanged', { turn: room.players[0].id });
        }
    });

    // 5. Xử lý tung xúc xắc (Đã nâng cấp)
    socket.on('rollDice', (roomId) => {
        const room = monopolyGames[roomId];
        if (room && room.state === 'playing') {
            const game = room.gameLogic;
            const player = game.players[game.turnIndex];
            
            if (player.id !== socket.id) return;

            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;
            
            io.to(roomId).emit('diceRolled', { d1, d2 });
                                   
            // Gửi cập nhật vị trí
            const moveRes = game.movePlayer(d1 + d2); 

        io.to(roomId).emit('monopolyUpdate', {
            players: game.players,
            turnIndex: game.turnIndex,
            propertyHouses: game.propertyHouses,
            logs: [moveRes.message] // Giờ đây message đã có dữ liệu
        });

        if (moveRes.action === 'buy') {
            socket.emit('askBuyProperty', moveRes.player.position); // Gửi vị trí ô đất
        } else {
            io.to(roomId).emit('enableEndTurn');
        }
        }
    });

    // 6. Xử lý mua đất
    socket.on('buyProperty', ({ roomId, choice }) => {
        const room = monopolyGames[roomId];
        if (room && room.state === 'playing') {
            const game = room.gameLogic;
            if (choice) {
                // Gọi hàm mua đất trong logic
                const buyRes = game.buyProperty(game.players[game.turnIndex].position);
                if (buyRes) {
                    io.to(roomId).emit('monopolyUpdate', {
                        players: game.players,
                        logs: [`💰 ${game.getCurrentPlayer().username} đã mua đất!`]
                    });
                }
            }
            socket.emit('enableEndTurn');
        }
    });

    // 7. Kết thúc lượt
    socket.on('endTurn', (roomId) => {
        const room = monopolyGames[roomId];
        if (room && room.state === 'playing') {
            const nextP = room.gameLogic.nextTurn();
            io.to(roomId).emit('monopolyUpdate', {
                turnIndex: room.gameLogic.turnIndex,
                players: room.gameLogic.players,
                gameState: 'playing',
                logs: [`👉 Lượt của ${nextP.username}`]
            });
            io.to(roomId).emit('turnChanged', { turn: nextP.id });
        }
    });

    // 8. Xử lý thắng game
    socket.on('monopolyWin', async ({ roomId, winnerId }) => {
        const room = monopolyGames[roomId];
        if (room && socket.id === winnerId) {
            try {
                const user = await User.findOne({ username: socket.request.session.user.username });
                if (user) {
                    user.score += 200; // Thắng game lớn thưởng nhiều hơn
                    user.monopolyLevel = (user.monopolyLevel || 1) + 1;
                    user.history.push({ activity: `Vô địch Cờ Tỷ Phú - Cấp ${user.monopolyLevel}`, timestamp: new Date() });
                    await user.save();
                    
                    io.to(roomId).emit('monopolyGameOver', { 
                        winner: user.username, 
                        newScore: user.score, 
                        newLevel: user.monopolyLevel 
                    });
                }
            } catch (e) { console.error(e); }
            delete monopolyGames[roomId];
        }
    });
socket.on('buildHouse', ({ roomId, tileId }) => {
        const room = monopolyGames[roomId];
        if (room && room.gameLogic) {
            const game = room.gameLogic;
            if (game.buildHouse(tileId)) {
                io.to(roomId).emit('monopolyUpdate', { 
                    players: game.players, 
                    propertyHouses: game.propertyHouses,
                    logs: [`🏗️ ${game.getCurrentPlayer().username} đã xây nhà tại ô ${tileId}`]
                });
                socket.emit('buildSuccess', "Xây nhà thành công!");
            } else {
                socket.emit('errorMsg', "Bé chưa đủ điều kiện xây nhà ở đây!");
            }
        }
    });
// --- BỘ MÁY ĐẤU GIÁ ---
    socket.on('startAuction', ({ roomId, tileId }) => {
        const room = monopolyGames[roomId];
        const tile = boardData[tileId];
        room.auction = {
            tileId,
            highestBid: 10, // Giá khởi điểm
            highestBidder: null,
            timer: 10 // 10 giây đếm ngược
        };
        io.to(roomId).emit('auctionStarted', { tile, auction: room.auction });
        
        // Chạy bộ đếm ngược đấu giá
        const auctionInt = setInterval(() => {
            room.auction.timer--;
            io.to(roomId).emit('auctionTimer', room.auction.timer);

            if (room.auction.timer <= 0) {
                clearInterval(auctionInt);
                endAuction(roomId);
            }
        }, 1000);
    });

    socket.on('placeBid', ({ roomId, bidAmount }) => {
        const room = monopolyGames[roomId];
        if (bidAmount > room.auction.highestBid) {
            room.auction.highestBid = bidAmount;
            room.auction.highestBidder = socket.request.session.user.username;
            room.auction.timer = 6; // Reset lại 6 giây mỗi khi có người trả giá mới
            io.to(roomId).emit('auctionUpdate', room.auction);
        }
    });

    async function endAuction(roomId) {
        const room = monopolyGames[roomId];
        const { tileId, highestBid, highestBidder } = room.auction;
        if (highestBidder) {
            const game = room.gameLogic;
            const winner = game.players.find(p => p.username === highestBidder);
            if (winner && winner.money >= highestBid) {
                winner.money -= highestBid;
                game.boardState[tileId] = winner.id;
                game.log(`🔨 Đấu giá: ${highestBidder} đã mua ${boardData[tileId].name} với giá $${highestBid}`);
                io.to(roomId).emit('monopolyUpdate', { players: game.players, logs: game.logs });
            }
        }
        io.to(roomId).emit('auctionEnded');
        delete room.auction;
    }
    // --- DISCONNECT ---
    socket.on('disconnecting', () => {
        // Xóa khỏi hàng chờ
        Object.keys(waitingPlayers).forEach(key => { if (waitingPlayers[key] === socket) delete waitingPlayers[key]; });
        const idx = monopolyQueue.indexOf(socket.id);
        if (idx > -1) monopolyQueue.splice(idx, 1);

        // Xóa khỏi phòng chơi 1vs1 (Caro, Chess...)
        for (const roomId of socket.rooms) {
            if (roomId !== socket.id) {
                const room = gameRooms[roomId];
                if(room) {
                    if (room.gameType === 'caro') {
                        // Logic đặc biệt cho Caro
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
                io.to(roomId).emit('notification', `Người chơi đã thoát. Ván game hủy!`);
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
async function autoCheckForfeit() {
    const now = new Date();
    // Tìm giải đấu đang diễn ra
    const tourney = await Tournament.findOne({ status: 'playing' });
    if (!tourney) return;

    let hasChange = false;

    // Duyệt qua tất cả các trận đấu
    tourney.brackets.forEach(match => {
        // Nếu trận chưa có người thắng và đã có lịch bắt đầu
        if (!match.winner && match.startTime) {
            const startTime = new Date(match.startTime);
            const diffInMinutes = (now - startTime) / (1000 * 60);

            // LUẬT 10 PHÚT: Nếu quá 10 phút mà chưa ai vào đấu để có winner
            if (diffInMinutes > 10) {
                match.winner = "Hòa (Cùng vắng mặt)"; // Hoặc "Xử thua" tùy bạn quy định
                hasChange = true;
                console.log(`[Tournament] Tự động đóng trận ${match.matchId} do quá giờ.`);
            }
        }
    });

    if (hasChange) {
        tourney.markModified('brackets');
        await tourney.save();
        // Gửi tín hiệu để tất cả các máy bé đang mở trang giải đấu tự tải lại lịch mới
        io.emit('tournamentUpdated'); 
    }
}
async function sendMatchReminders() {
    const now = new Date();
    const tourney = await Tournament.findOne({ status: 'playing' });
    if (!tourney) return;

    tourney.brackets.forEach(match => {
        if (!match.winner && match.startTime) {
            const startTime = new Date(match.startTime);
            const diffInMinutes = (startTime - now) / (1000 * 60);

            // Nếu còn đúng 5 phút nữa là bắt đầu
            if (diffInMinutes > 4 && diffInMinutes <= 5) {
                [match.p1, match.p2].forEach(username => {
                    const socketId = onlineUsers[username];
                    if (socketId) {
                        io.to(socketId).emit('matchNotice', {
                            title: "🔔 NHẮC HẸN THI ĐẤU",
                            message: `Trận đấu môn ${tourney.gameType.toUpperCase()} của bé sắp bắt đầu vào lúc ${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}!`,
                            type: 'warning'
                        });
                    }
                });
            }
        }
    });
}
setInterval(sendMatchReminders, 60000); // Kiểm tra mỗi phút
// Cứ mỗi 1 phút, Server sẽ tự thực hiện kiểm tra 1 lần
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
const HOST = '0.0.0.0'; 
server.listen(PORT, HOST, () => {
    console.log(`🚀 Server đang chạy!`);
    console.log(`🏠 Local: http://localhost:3000`);
    console.log(`🌐 Render: Cổng ${PORT}`);
});