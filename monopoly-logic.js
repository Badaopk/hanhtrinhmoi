// File: monopoly-logic.js
// Logic xử lý game Cờ Tỷ Phú

const { boardData } = require('./monopoly-data.js');

class MonopolyGame {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = []; // Danh sách người chơi
        this.boardState = {}; // Trạng thái ô đất (ai sở hữu?)
        this.turnIndex = 0; // Lượt của ai (0, 1, 2...)
        this.logs = []; // Lịch sử ván đấu
        this.state = 'waiting'; // waiting, playing, ended
    }

    addPlayer(id, username) {
        if (this.state !== 'waiting') return null;
        const color = ['red', 'blue', 'green', 'yellow'][this.players.length % 4];
        const newPlayer = {
            id,
            username,
            money: 1500, // Tiền khởi điểm
            position: 0,
            color: color,
            isJailed: false,
            jailTurns: 0,
            properties: []
        };
        this.players.push(newPlayer);
        this.log(`👋 ${username} đã tham gia game.`);
        return newPlayer;
    }

    startGame() {
        if (this.players.length < 2) return false;
        this.state = 'playing';
        this.turnIndex = 0;
        this.log("🎲 Game bắt đầu! Lượt của " + this.getCurrentPlayer().username);
        return true;
    }

    getCurrentPlayer() {
        return this.players[this.turnIndex];
    }

    nextTurn() {
        this.turnIndex = (this.turnIndex + 1) % this.players.length;
        this.log(`👉 Chuyển lượt sang: ${this.getCurrentPlayer().username}`);
    }

    rollDice() {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const total = d1 + d2;
        return { d1, d2, total };
    }

    movePlayer(steps) {
        const player = this.getCurrentPlayer();
        
        // Kiểm tra tù
        if (player.isJailed) {
            this.log(`${player.username} đang ở tù, mất lượt.`);
            player.jailTurns--;
            if (player.jailTurns <= 0) player.isJailed = false;
            return { moved: false, newPos: player.position };
        }

        const oldPos = player.position;
        player.position = (player.position + steps) % 40;

        // Đi qua Bắt Đầu (GO) nhận 200
        if (player.position < oldPos) {
            player.money += 200;
            this.log(`💰 ${player.username} đi qua Bắt Đầu, nhận $200.`);
        }

        return { moved: true, newPos: player.position };
    }

    handleLanding(pos) {
        const player = this.getCurrentPlayer();
        const cell = boardData[pos];
        const ownerId = this.boardState[pos];

        let action = null; // 'buy', 'rent', 'tax', 'chance', 'none'
        let message = `Bạn đang ở ${cell.name}.`;

        if (cell.type === 'property' || cell.type === 'railroad' || cell.type === 'utility') {
            if (!ownerId) {
                // Đất trống -> Có thể mua
                if (player.money >= cell.price) {
                    action = 'buy';
                    message = `Đất trống! Giá $${cell.price}. Mua không?`;
                } else {
                    message = `Đất trống nhưng bạn không đủ tiền ($${cell.price}).`;
                }
            } else if (ownerId !== player.id) {
                // Đất người khác -> Trả tiền thuê
                const rent = this.calculateRent(pos);
                player.money -= rent;
                const owner = this.players.find(p => p.id === ownerId);
                if (owner) owner.money += rent;
                
                action = 'rent_paid';
                this.log(`💸 ${player.username} trả $${rent} tiền thuê cho ${owner.username}.`);
                message = `Bạn đã trả $${rent} tiền thuê nhà.`;
            }
        } 
        else if (cell.type === 'tax') {
            player.money -= cell.price;
            this.log(`💸 ${player.username} đóng thuế $${cell.price}.`);
            message = `Bạn bị trừ $${cell.price} tiền thuế.`;
        }
        else if (cell.type === 'gotojail') {
            player.position = 10; // Chuyển về ô Thăm Tù
            player.isJailed = true;
            player.jailTurns = 3;
            this.log(`👮 ${player.username} bị bắt vào tù!`);
            message = "Bạn đã bị bắt vào tù!";
        }
        else if (cell.type === 'chance' || cell.type === 'community') {
            const luck = Math.random();
            if (luck > 0.5) {
                player.money += 50;
                this.log(`🍀 ${player.username} nhặt được $50.`);
                message = "May mắn! Bạn nhặt được $50.";
            } else {
                player.money -= 30;
                this.log(`⚠️ ${player.username} bị phạt $30.`);
                message = "Xui xẻo! Bạn bị phạt $30.";
            }
        }

        return { player, action, message };
    }

    buyProperty(pos) {
        const player = this.getCurrentPlayer();
        const cell = boardData[pos];

        if (player.money >= cell.price && !this.boardState[pos]) {
            player.money -= cell.price;
            this.boardState[pos] = player.id;
            player.properties.push(pos);
            this.log(`🏠 ${player.username} đã mua ${cell.name}.`);
            return true;
        }
        return false;
    }

    calculateRent(pos) {
        const cell = boardData[pos];
        // Logic đơn giản: 10% giá đất
        return Math.floor(cell.price * 0.1); 
    }

    log(msg) {
        const time = new Date().toLocaleTimeString();
        this.logs.push(`[${time}] ${msg}`);
        if (this.logs.length > 50) this.logs.shift();
    }
}

module.exports = MonopolyGame;