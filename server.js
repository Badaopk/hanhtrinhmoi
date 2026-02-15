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
    .then(() => console.log("✅ Đã kết nối MongoDB thành công!"))
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
    // Đầy đủ 11 loại cấp độ game
    chessLevel: { type: Number, default: 1 },
    caroLevel: { type: Number, default: 1 },
    memoryLevel: { type: Number, default: 1 },
    crosswordLevel: { type: Number, default: 1 },
    englishSpeechLevel: { type: Number, default: 1 },
    detectiveLevel: { type: Number, default: 1 },
    goLevel: { type: Number, default: 1 },
    othelloLevel: { type: Number, default: 1 },
    storyLevel: { type: Number, default: 1 },
    shapeLevel: { type: Number, default: 1 },
    buildLevel: { type: Number, default: 1 }
});
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
app.post('/api/admin/update-user', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền' });
    
    const { username, ...updateData } = req.body; 
    
    try {
        // Chuyển đổi các giá trị sang số để đảm bảo tính toán đúng
        for (let key in updateData) {
            if (key !== 'username') updateData[key] = parseInt(updateData[key]);
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
        
        // CHỖ CẦN SỬA: Kiểm tra nếu không tìm thấy user
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

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

    // --- LOGIC CỜ VUA / CỜ VÂY (Chuyển tiếp) ---
    socket.on('move', (data) => socket.to(data.room).emit('move', data.move));
    socket.on('goMove', (data) => socket.to(data.room).emit('opponentGoMove', data.move));

    // --- MONOPOLY ---
    socket.on('joinMonopoly', () => {
        if (monopolyQueue.includes(socket.id)) return;
        monopolyQueue.push(socket.id);
        
        if (monopolyQueue.length >= 2) {
            const p1 = monopolyQueue.shift();
            const p2 = monopolyQueue.shift();
            const s1 = io.sockets.sockets.get(p1);
            const s2 = io.sockets.sockets.get(p2);

            if (s1 && s2) {
                const roomId = `monopoly-${Date.now()}`;
                s1.join(roomId); s2.join(roomId);
                const game = new MonopolyGame(roomId);
                game.addPlayer(s1.id, s1.request.session.user?.username || 'Người 1');
                game.addPlayer(s2.id, s2.request.session.user?.username || 'Người 2');
                monopolyGames[roomId] = game;
                io.to(roomId).emit('monopolyMatchFound', { roomId, players: game.players });
            }
        } else {
            socket.emit('waitingMonopoly', { count: monopolyQueue.length });
        }
    });

    socket.on('startMonopoly', (roomId) => {
        const game = monopolyGames[roomId];
        if (game && game.startGame()) {
            io.to(roomId).emit('monopolyStarted', { players: game.players, turn: game.players[game.turnIndex].id });
            io.to(roomId).emit('gameLog', [`🏁 Bắt đầu game! Lượt của ${game.players[0].username}`]);
        }
    });

    socket.on('rollDice', (roomId) => {
        const game = monopolyGames[roomId];
        if (game) {
            const player = game.getCurrentPlayer();
            if (player.id !== socket.id) return;
            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;
            io.to(roomId).emit('diceRolled', { d1, d2 });
            const moveRes = game.movePlayer(d1 + d2);
            io.to(roomId).emit('playerMoved', moveRes);
            io.to(roomId).emit('gameLog', [moveRes.message]);
            if (moveRes.action === 'buy') socket.emit('askBuyProperty', moveRes.data);
            else if (moveRes.action === 'payRent') {
                io.to(roomId).emit('moneyChanged', game.getAllMoney());
                io.to(roomId).emit('enableEndTurn'); 
            } else io.to(roomId).emit('enableEndTurn');
        }
    });

    socket.on('buyProperty', ({ roomId, choice }) => {
        const game = monopolyGames[roomId];
        if (game && choice) {
            if (game.buyProperty(game.players[game.turnIndex].position)) {
                io.to(roomId).emit('propertyBought', { 
                    pid: game.players[game.turnIndex].position, 
                    owner: socket.id,
                    money: game.players[game.turnIndex].money
                });
            }
        }
        socket.emit('enableEndTurn');
    });

    socket.on('endTurn', (roomId) => {
        const game = monopolyGames[roomId];
        if (game) {
            const nextP = game.nextTurn();
            io.to(roomId).emit('turnChanged', { turn: nextP.id });
            io.to(roomId).emit('gameLog', [`👉 Lượt của ${nextP.username}`]);
        }
    });
    // Thêm sự kiện khi có người thắng Cờ Tỷ Phú
    socket.on('monopolyWin', async ({ roomId, winnerId }) => {
    const game = monopolyGames[roomId];
    if (game && socket.id === winnerId) {
        try {
            const user = await User.findOne({ username: socket.request.session.user.username });
            if (user) {
                user.score += 100; 
                user.monopolyLevel = (user.monopolyLevel || 1) + 1; // <--- DÒNG QUAN TRỌNG: Tăng cấp độ
                user.history.push({ activity: `Thắng Cờ Tỷ Phú - Lên cấp ${user.monopolyLevel}`, timestamp: new Date() });
                await user.save();
                // Gửi thông báo về cho Client kèm cấp độ mới
                io.to(roomId).emit('monopolyGameOver', { 
                    winner: user.username, 
                    newScore: user.score, 
                    newLevel: user.monopolyLevel 
                });
            }
        } catch (e) { console.error("Lỗi lưu điểm Monopoly:", e); }
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
});

server.listen(PORT, () => {
    console.log(`🚀 Server Database đang chạy tại: http://localhost:${PORT}`);
});