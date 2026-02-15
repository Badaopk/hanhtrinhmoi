// File: monopoly-data.js
// Dữ liệu bàn cờ chuẩn (40 ô - 10 ô mỗi cạnh)

const boardData = [
    // --- CẠNH DƯỚI (Bottom) ---
    { id: 0, name: "BẮT ĐẦU", type: "go", price: 0 },
    { id: 1, name: "Thái Hà", type: "property", price: 60, color: "#8e44ad", group: 1 },
    { id: 2, name: "Khí Vận", type: "community", price: 0 },
    { id: 3, name: "Chùa Bộc", type: "property", price: 60, color: "#8e44ad", group: 1 },
    { id: 4, name: "Thuế TNCN", type: "tax", price: 200 },
    { id: 5, name: "Ga Hà Nội", type: "railroad", price: 200 },
    { id: 6, name: "Nguyễn Trãi", type: "property", price: 100, color: "#3498db", group: 2 },
    { id: 7, name: "Cơ Hội", type: "chance", price: 0 },
    { id: 8, name: "Lê Văn Lương", type: "property", price: 100, color: "#3498db", group: 2 },
    { id: 9, name: "Láng Hạ", type: "property", price: 120, color: "#3498db", group: 2 },

    // --- CẠNH TRÁI (Left) ---
    { id: 10, name: "THĂM TÙ", type: "jail", price: 0 },
    { id: 11, name: "Phố Huế", type: "property", price: 140, color: "#d35400", group: 3 },
    { id: 12, name: "Công Ty Điện", type: "utility", price: 150 },
    { id: 13, name: "Hàng Bài", type: "property", price: 140, color: "#d35400", group: 3 },
    { id: 14, name: "Hàng Gai", type: "property", price: 160, color: "#d35400", group: 3 },
    { id: 15, name: "Ga Sài Gòn", type: "railroad", price: 200 },
    { id: 16, name: "Đinh Tiên Hoàng", type: "property", price: 180, color: "#e67e22", group: 4 },
    { id: 17, name: "Khí Vận", type: "community", price: 0 },
    { id: 18, name: "Lê Duẩn", type: "property", price: 180, color: "#e67e22", group: 4 },
    { id: 19, name: "Hai Bà Trưng", type: "property", price: 200, color: "#e67e22", group: 4 },

    // --- CẠNH TRÊN (Top) ---
    { id: 20, name: "BÃI ĐẬU XE", type: "parking", price: 0 },
    { id: 21, name: "Trần Hưng Đạo", type: "property", price: 220, color: "#e74c3c", group: 5 },
    { id: 22, name: "Cơ Hội", type: "chance", price: 0 },
    { id: 23, name: "Lý Thường Kiệt", type: "property", price: 220, color: "#e74c3c", group: 5 },
    { id: 24, name: "Phan Chu Trinh", type: "property", price: 240, color: "#e74c3c", group: 5 },
    { id: 25, name: "Ga Đà Nẵng", type: "railroad", price: 200 },
    { id: 26, name: "Nguyễn Huệ", type: "property", price: 260, color: "#f1c40f", group: 6 },
    { id: 27, name: "Đồng Khởi", type: "property", price: 260, color: "#f1c40f", group: 6 },
    { id: 28, name: "Công Ty Nước", type: "utility", price: 150 },
    { id: 29, name: "Lê Lợi", type: "property", price: 280, color: "#f1c40f", group: 6 },

    // --- CẠNH PHẢI (Right) ---
    { id: 30, name: "VÀO TÙ", type: "gotojail", price: 0 },
    { id: 31, name: "Bà Huyện", type: "property", price: 300, color: "#2ecc71", group: 7 },
    { id: 32, name: "Võ Thị Sáu", type: "property", price: 300, color: "#2ecc71", group: 7 },
    { id: 33, name: "Khí Vận", type: "community", price: 0 },
    { id: 34, name: "Điện Biên Phủ", type: "property", price: 320, color: "#2ecc71", group: 7 },
    { id: 35, name: "Ga Nha Trang", type: "railroad", price: 200 },
    { id: 36, name: "Cơ Hội", type: "chance", price: 0 },
    { id: 37, name: "Landmark 81", type: "property", price: 350, color: "#2c3e50", group: 8 },
    { id: 38, name: "Thuế Xa Xỉ", type: "tax", price: 100 },
    { id: 39, name: "Dinh Độc Lập", type: "property", price: 400, color: "#2c3e50", group: 8 }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { boardData }; // Dành cho Server (NodeJS)
} else {
    window.boardData = boardData;   // Dành cho Trình duyệt (Client)
}