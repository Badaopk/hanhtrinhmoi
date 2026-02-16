// =================================================================
// --- SERVER TRUNG TÂM: HÀNH TINH MƠ ƯỚC (DATABASE + FULL FEATURES) ---
// =================================================================
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const session = require('express-session');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
// --- CẤU HÌNH DATABASE (THAY CHUỖI KẾT NỐI CỦA BẠN VÀO ĐÂY) ---
const MONGO_URI = 'mongodb+srv://admin:Quoc2007%40@cluster0.fme5rgw.mongodb.net/?appName=Cluster0'; 

// --- 1. IMPORT DỮ LIỆU & LOGIC ---
const { tests, maths } = require('./question-data.js'); 
const MonopolyGame = require('./monopoly-logic.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// --- 2. KẾT NỐI MONGODB ---
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("✅ Đã kết nối MongoDB thành công!");

        // --- TỰ ĐỘNG KHỞI TẠO ADMIN NẾU CHƯA CÓ ---
        try {
            const adminExists = await User.findOne({ username: 'Admin' });
            if (!adminExists) {
                const hashedPassword = await bcrypt.hash('Quoc2007@', 10);
                const admin = new User({
                    username: 'Admin',
                    password: hashedPassword,
                    role: 'admin'
                });
                await admin.save();
                console.log("🚀 Đã tự động tạo tài khoản Admin mặc định (Quoc2007@).");
            }
        } catch (error) {
            console.error("❌ Lỗi khi kiểm tra/tạo Admin:", error);
        }
    })
    .catch(err => console.error("❌ Lỗi kết nối MongoDB:", err));
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
    // --- DANH SÁCH 14 CẤP ĐỘ GAME ---
    paintingLevel: { type: Number, default: 1 },      // Xưởng vẽ
    memoryLevel: { type: Number, default: 1 },        // Ghép hình
    shapeLevel: { type: Number, default: 1 },         // Tạo hình vui nhộn
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
    status: { type: String, default: 'open' }, // open (đăng ký), playing (đang đấu), finished
    matchDuration: Number, // Số phút mỗi trận
    participants: [String], // Danh sách tên các bé tham gia
    brackets: { type: Array, default: [] }, // Sơ đồ trận đấu/bảng đấu
    winners: { top1: String, top2: String, top3: String }
});
const SHOP_ITEMS = [
    { id: 'bed_red', name: 'Giường Đỏ', price: 200, type: 'furniture', icon: '🛏️' },
    { id: 'sofa_blue', name: 'Sofa Xanh', price: 150, type: 'furniture', icon: '🛋️' },
    { id: 'plant_1', name: 'Cây Cảnh', price: 50, type: 'decor', icon: '🪴' },
    { id: 'tv_set', name: 'Tivi Xịn', price: 300, type: 'electronic', icon: '📺' },
    { id: 'rug_bear', name: 'Thảm Gấu', price: 80, type: 'floor', icon: '🐻' },
    { id: 'lamp_stand', name: 'Đèn Ngủ', price: 60, type: 'decor', icon: '💡' },
    { id: 'bookshelf', name: 'Kệ Sách', price: 120, type: 'furniture', icon: '📚' }
];
const Tournament = mongoose.model('Tournament', tournamentSchema);
const User = mongoose.model('User', userSchema);
// --- 3. CẤU HÌNH MIDDLEWARE ---
const sessionMiddleware = session({
    secret: 'hanh-tinh-mo-uoc-vinh-cuu-merged-2026',
    resave: false,
    saveUninitialized: false, // Đổi thành false để tiết kiệm database
    store: MongoStore.create({ mongoUrl: MONGO_URI }), // <--- QUAN TRỌNG: Dòng này giúp lưu phiên đăng nhập vào MongoDB
    cookie: { 
        secure: false, // Nếu sau này bạn có https xịn thì đổi thành true
        maxAge: 24 * 60 * 60 * 1000 // Lưu đăng nhập trong 24 giờ
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
const monopolyGames = {};   
let maintenanceMode = false; // Đã khôi phục biến bảo trì

// --- 5. API HỆ THỐNG (AUTH) ---
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
    await refreshDailyQuests(user);
    res.json(user);
});

// --- 6. API ADMIN (ĐÃ KHÔI PHỤC ĐẦY ĐỦ) ---
app.post('/api/admin/create-tournament', async (req, res) => {
    const { gameType, format, matchDuration } = req.body;
    await Tournament.deleteMany({ status: { $ne: 'finished' } }); // Xóa giải cũ chưa xong
    const newTourney = new Tournament({ gameType, format, matchDuration });
    await newTourney.save();
    io.emit('adminNotification', { title: '🏆 GIẢI ĐẤU MỚI', message: `Môn ${gameType.toUpperCase()} đã mở đăng ký!` });
    res.json({ message: "Đã mở giải thành công!" });
});
app.post('/api/admin/finish-tournament', async (req, res) => {
    const { top1, top2, top3 } = req.body;
    if (top1) await User.updateOne({ username: top1 }, { $inc: { score: 500 } }); // Nhất: 500đ
    if (top2) await User.updateOne({ username: top2 }, { $inc: { score: 300 } }); // Nhì: 300đ
    if (top3) await User.updateOne({ username: top3 }, { $inc: { score: 100 } }); // Ba: 100đ
    
    await Tournament.updateOne({ status: 'playing' }, { $set: { status: 'finished', winners: { top1, top2, top3 } } });
    io.emit('adminNotification', { title: '🏁 GIẢI KẾT THÚC', message: `Chúc mừng quán quân: ${top1}!` });
    res.json({ message: "Đã trao thưởng thành công!" });
});
// Admin chốt danh sách và chia bảng
app.post('/api/admin/start-tournament', async (req, res) => {
    const tourney = await Tournament.findOne({ status: 'open' });
    if (!tourney || tourney.participants.length < 2) return res.status(400).json({ message: "Không đủ người thi đấu!" });

    const players = [...tourney.participants].sort(() => Math.random() - 0.5);
    let brackets = [];

    if (tourney.format === 'knockout') {
        // Chia cặp loại trực tiếp
        for (let i = 0; i < players.length; i += 2) {
            brackets.push({ 
                matchId: 'TOUR-' + Math.random().toString(36).substr(2, 5), // Tạo mã phòng ngẫu nhiên
                p1: players[i], 
                p2: players[i+1] || "BYE (Miễn đấu)", 
                winner: players[i+1] ? null : players[i] 
            });
        }
    } else {
        // CHIA VÒNG BẢNG (Mỗi bảng 4 người, đấu vòng tròn)
        let groupCount = Math.ceil(players.length / 4);
        for (let g = 0; g < groupCount; g++) {
            let members = players.slice(g * 4, (g + 1) * 4);
            let groupMatches = [];
            
            // Thuật toán tạo cặp đấu vòng tròn (Round-robin)
            for (let i = 0; i < members.length; i++) {
                for (let j = i + 1; j < members.length; j++) {
                    groupMatches.push({
                        matchId: `TOUR-G-${g}-${i}-${j}-` + Math.random().toString(36).substr(2, 3),
                        p1: members[i],
                        p2: members[j],
                        winner: null
                    });
                }
            }
            brackets.push({ 
                groupName: `Bảng ${String.fromCharCode(65 + g)}`, 
                members: members, 
                matches: groupMatches 
            });
        }
    }
    tourney.brackets = brackets;
    tourney.status = 'playing';
    await tourney.save();
    io.emit('tournamentStarted', tourney);
    res.json({ message: "Đã chia bảng và bắt đầu giải đấu!" });
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
    
    if (!tourney.participants.includes(req.session.user.username)) {
        tourney.participants.push(req.session.user.username);
        await tourney.save();
        res.json({ message: "Đăng ký thành công! Hãy đợi Admin chia bảng." });
    } else {
        res.json({ message: "Bé đã đăng ký rồi mà!" });
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
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        // --- MẢNH VÁ GIẢI ĐẤU ---
        const tourRoomId = req.body.tournamentRoomId; // Client phải gửi kèm mã này lên
        if (tourRoomId && tourRoomId.startsWith('TOUR-')) {
            await Tournament.updateOne(
                { $or: [ { "brackets.matchId": tourRoomId }, { "brackets.matches.matchId": tourRoomId } ] },
                { 
                    $set: { 
                        "brackets.$.winner": user.username,
                        "brackets.$[].matches.$[m].winner": user.username 
                    } 
                },
                { arrayFilters: [{ "m.matchId": tourRoomId }] }
            );
        }
        // 1. Cộng điểm & Tăng cấp độ
        user.score += points;
        user[gameKey] = (user[gameKey] || 1) + 1;

        // 2. Cập nhật tiến độ nhiệm vụ (Daily + Admin assign)
        // Lưu ý: performance cần cả isWin: true
        updateQuestProgress(user, taskName, { timeTaken: req.body.timeTaken || 0, isWin: true });
        // 3. Lưu vào Database
        user.markModified('quests');
        await user.save();

        // 4. Trả về kết quả cho Client
        res.json({ 
            message: 'Chiến thắng!', 
            newScore: user.score, 
            newLevel: user[gameKey],
            taskHandled: taskName 
        });

    } catch (e) { 
        console.error("Lỗi tại handleWin:", e);
        res.status(500).send("Lỗi hệ thống: " + e.message); 
    }
}
// Cập nhật các dòng gọi API để truyền thêm Tên Nhiệm Vụ (Tham số thứ 3)
app.post('/api/game/detective-win', (req, res) => handleWin(req, res, 'detectiveLevel', 20, 'Thám tử'));
app.post('/api/game/crossword-win', (req, res) => handleWin(req, res, 'crosswordLevel', 15, 'Ô Chữ'));
app.post('/api/game/story-win', (req, res) => handleWin(req, res, 'storyLevel', 30, 'Sáng Tác'));
app.post('/api/game/english-speech-win', (req, res) => handleWin(req, res, 'englishSpeechLevel', 10, 'Tiếng Anh'));
app.post('/api/game/othello-win', (req, res) => handleWin(req, res, 'othelloLevel', 25, 'Phục Kích'));
app.post('/api/game/shape-win', (req, res) => handleWin(req, res, 'shapeLevel', 20, 'Ghép Hình'));
app.post('/api/game/build-win', (req, res) => handleWin(req, res, 'buildLevel', 30, 'Xây Dựng'));
app.post('/api/game/chess-win-level', (req, res) => handleWin(req, res, 'chessLevel', 50, 'Cờ Vua'));
app.post('/api/game/caro-win', (req, res) => handleWin(req, res, 'caroLevel', 20, 'Cờ Caro')); 
app.post('/api/game/go-win', (req, res) => handleWin(req, res, 'goLevel', 30, 'Cờ Vây'));
app.post('/api/game/memory-win', (req, res) => handleWin(req, res, 'memoryLevel', 15, 'Ghép Hình'));
app.post('/api/game/viet-speech-win', (req, res) => handleWin(req, res, 'vietSpeechLevel', 10, 'Luyện Nói Việt'));
app.post('/api/submit-test', async (req, res) => {
    const { answers } = req.body; 
    let score = Math.floor(Math.random() * 10) + 1; 
    if (req.session.user) {
        const user = await User.findOne({ username: req.session.user.username });
        if(user) {
            user.score += score * 10;
            user.history.push({ activity: `Làm bài kiểm tra: ${score} điểm`, timestamp: new Date() });
            await user.save();
        }
    }
    res.json({ score, message: score > 5 ? 'Làm tốt lắm!' : 'Cố gắng hơn nhé!' });
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
    const { items, inventory } = req.body; // Nhận thêm inventory từ client gửi lên
    
    await User.updateOne(
        { username: req.session.user.username }, 
        { $set: { houseData: items, inventory: inventory } } // Lưu cả 2 cùng lúc
    );
    res.json({ message: "Đã lưu ngôi nhà và kho đồ!" });
});
// =================================================================
// --- 8. SOCKET.IO (KHÔI PHỤC LOGIC CARO/CHESS CHI TIẾT) ---
// =================================================================

io.on('connection', (socket) => {
    const sessionUser = socket.request.session.user;
    const username = sessionUser ? sessionUser.username : `Khách-${socket.id.substr(0,4)}`;

    // Kiểm tra bảo trì khi vừa connect
    if (maintenanceMode && (!sessionUser || sessionUser.role !== 'admin')) {
        socket.emit('maintenanceModeOn', { message: 'Server đang bảo trì' });
        socket.disconnect();
        return;
    }

    // --- GAME TÌM TRẬN ---
    socket.on('findMatch', (gameType) => {
        if (waitingPlayers[gameType]) {
            const opponent = waitingPlayers[gameType];
            const roomId = `room-${opponent.id}-${socket.id}`;
            delete waitingPlayers[gameType];
            
            socket.join(roomId); opponent.join(roomId);

            gameRooms[roomId] = {
                gameType,
                players: [opponent.id, socket.id],
                playerNames: { [opponent.id]: sessionUser?.username || 'P1', [socket.id]: username },
                turn: opponent.id 
            };

            // Gửi thông tin chi tiết (QUAN TRỌNG: để Client vẽ bàn cờ đúng)
            io.to(roomId).emit('matchFound', { 
                room: roomId, 
                role: 'O', // Người đợi trước đánh trước
                opponent: username,
                yourTurn: true // P1 đi trước
            });
            opponent.emit('matchFound', { 
                room: roomId, 
                role: 'X', 
                opponent: sessionUser?.username || 'P2',
                yourTurn: false
            });
        } else {
            waitingPlayers[gameType] = socket;
            socket.emit('waiting', { message: 'Đang tìm đối thủ...' });
        }
    });
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
    function addPlayerToMonopolyRoom(roomId, socket, username) {
        const room = monopolyGames[roomId];
        const colors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];
        
        const player = {
            id: socket.id,
            username: username,
            color: colors[room.players.length % colors.length], // Gán màu
            money: 1000, // Tiền khởi điểm
            position: 0,
            isHost: socket.id === room.hostId
        };

        room.players.push(player);
        socket.join(roomId);

        // Gửi cập nhật sảnh chờ cho tất cả người trong phòng
        io.to(roomId).emit('lobbyUpdate', {
            roomId: roomId,
            players: room.players,
            isHost: socket.id === room.hostId
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
            
            // Logic di chuyển trong monopoly-logic.js
            const moveRes = game.movePlayer(d1 + d2);
            
            // Gửi cập nhật vị trí
            io.to(roomId).emit('monopolyUpdate', {
                roomId: roomId,
                gameState: 'playing',
                players: game.players, // Gửi lại toàn bộ danh sách để cập nhật vị trí/tiền
                turnIndex: game.turnIndex,
                logs: [moveRes.message]
            });

            if (moveRes.action === 'buy') {
                socket.emit('askBuyProperty', moveRes.data);
            } else if (moveRes.action === 'payRent') {
                // Tiền đã trừ trong logic movePlayer, chỉ cần cập nhật UI
                io.to(roomId).emit('enableEndTurn');
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
server.listen(PORT, () => {
    console.log(`🚀 Server Database đang chạy tại: http://localhost:${PORT}`);
});