// Tên file: global-client.js
// NỘI DUNG ĐẦY ĐỦ (Đã nâng cấp với TẤT CẢ listener)

(function() {
    // (Tính năng cũ: Kết nối Socket)
    const currentUser = localStorage.getItem('currentUser');
    let globalSocket;

    if (currentUser) {
        try {
            globalSocket = io(); 

            // (Cũ) Lắng nghe thông báo riêng
            globalSocket.on('adminNotification', (data) => {
                showAdminPopup(data.title, data.message);
            });

            // (Cũ) Bị đá do hết giờ
            globalSocket.on('playtimeLimitExceeded', () => {
                handlePlaytimeLimit();
            });
            
            // (Cũ) Bị đá do khóa tài khoản
            globalSocket.on('accountSuspended', (data) => {
                handleAccountSuspended(data.message);
            });
            
            // (Mới) Lắng nghe sự kiện Bảo Trì
            globalSocket.on('maintenanceModeOn', (data) => {
                handleMaintenanceMode(true, data.message);
            });
            globalSocket.on('maintenanceModeOff', (data) => {
                handleMaintenanceMode(false, data.message);
            });

        } catch (e) {
            console.warn("Socket.IO chưa được tải hoặc kết nối thất bại.", e);
        }
    }

    // (Tính năng cũ: Heartbeat)
    let heartbeatInterval;
    async function sendHeartbeat() {
        if (!currentUser) {
             if (heartbeatInterval) clearInterval(heartbeatInterval);
             return;
        }
        
        try {
            const response = await fetch('/api/user/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                 const errorData = await response.json();
                 if (response.status === 403 || errorData.code === 'PLAYTIME_LIMIT_EXCEEDED') {
                    handlePlaytimeLimit();
                 }
                 // (Mới) Check nếu bị khóa
                 if (errorData.code === 'ACCOUNT_SUSPENDED') {
                    handleAccountSuspended(errorData.message);
                 }
                 // (Mới) Check nếu bảo trì
                 if (errorData.code === 'MAINTENANCE') {
                     handleMaintenanceMode(true, errorData.message);
                 }
                 return;
            }
            
            const data = await response.json();
            if (data.status === 'limit_exceeded') {
                handlePlaytimeLimit();
            }
        } catch (error) {
            console.error('Heartbeat error:', error);
        }
    }

    // (Tính năng cũ: Hàm Overlay)
    function showBlockOverlay(title, message, linkText = "Về Trang Chủ") {
        if (document.getElementById('block-overlay')) return; 
        
        const overlay = document.createElement('div');
        overlay.id = 'block-overlay';
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 9998;
            display: flex; justify-content: center; align-items: center;
            color: white; font-family: 'Baloo 2', cursive; text-align: center;
        `;
        overlay.innerHTML = `
            <div style="background: #fff; color: #333; padding: 40px; border-radius: 20px; box-shadow: 0 5px 20px rgba(0,0,0,0.5);">
                <h1 style="font-size: 2.5rem; color: #e74c3c;">${title}</h1>
                <p style="font-size: 1.2rem;">${message}</p>
                <a href="index.html" style="display: inline-block; padding: 10px 20px; background: #3498db; color: white; border-radius: 10px; text-decoration: none; font-weight: bold; margin-top: 20px;">${linkText}</a>
            </div>
        `;
        document.body.appendChild(overlay);

        // Ngắt kết nối tất cả socket
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (globalSocket) globalSocket.disconnect();
        // Giả sử các trang game dùng 1 socket tên là 'socket'
        if (typeof socket !== 'undefined' && socket.disconnect) socket.disconnect();
        
        // Đăng xuất user khỏi localStorage
        localStorage.removeItem('currentUser');
    }
    
    // (Hàm cũ)
    function handlePlaytimeLimit() {
        showBlockOverlay(
            'Đã hết giờ!',
            'Bạn đã sử dụng hết thời gian chơi cho ngày hôm nay. Hãy quay lại vào ngày mai nhé!'
        );
    }
    
    // (Hàm cũ)
    function handleAccountSuspended(message) {
         showBlockOverlay(
            'Tài Khoản Bị Khóa!',
            message || 'Tài khoản của bạn đã bị Admin tạm khóa. Vui lòng liên hệ Admin để biết thêm chi tiết.',
            'Đăng xuất'
        );
    }
    
    // (Hàm mới)
    function handleMaintenanceMode(isStarting, message) {
        if (isStarting) {
            // Bật bảo trì -> ĐÁ ra
            showBlockOverlay(
                'Hệ Thống Bảo Trì',
                message || 'Hệ thống đang bảo trì. Vui lòng quay lại sau.',
                'Đăng xuất'
            );
        } else {
            // Tắt bảo trì -> Hiển thị thông báo nhẹ nhàng
            showAdminPopup(
                'Hệ Thống Mở Lại',
                message || 'Hệ thống đã bảo trì xong! Vui lòng tải lại trang để tiếp tục.'
            );
            // Xóa overlay nếu lỡ có
            const overlay = document.getElementById('block-overlay');
            if (overlay) overlay.remove();
        }
    }

    // (Hàm cũ: Hiển thị popup)
    function showAdminPopup(title, message) {
        if (document.getElementById('admin-popup')) return; 

        const popup = document.createElement('div');
        popup.id = 'admin-popup';
        popup.style = `
            position: fixed; top: 20px; right: 20px;
            background: #fff; border: 2px solid #3498db;
            border-radius: 10px; padding: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 300px;
            font-family: 'Arial', sans-serif;
            transition: opacity 0.3s;
            opacity: 0;
        `;
        popup.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #2980b9;">${title || 'Thông báo'}</h3>
            <p style="margin: 0 0 15px 0; color: #333; max-height: 100px; overflow-y: auto;">${message}</p>
            <button id="admin-popup-close" style="padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Đã hiểu</button>
        `;
        document.body.appendChild(popup);
        
        setTimeout(() => { popup.style.opacity = '1'; }, 10);
        
        popup.querySelector('#admin-popup-close').onclick = () => {
            popup.style.opacity = '0';
            setTimeout(() => { popup.remove(); }, 300);
        };

        setTimeout(() => {
            if (popup) {
                popup.style.opacity = '0';
                setTimeout(() => { popup.remove(); }, 300);
            }
        }, 15000);
    }

    // (Hàm cũ: Bắt đầu Heartbeat)
    document.addEventListener('DOMContentLoaded', () => {
        if (currentUser) {
            setTimeout(sendHeartbeat, 5000); 
            heartbeatInterval = setInterval(sendHeartbeat, 60000); 
        }
    });

})();