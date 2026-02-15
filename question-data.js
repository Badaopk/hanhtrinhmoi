// =================================================================
// --- KHO TÀNG TRI THỨC HÀNH TINH MƠ ƯỚC (MERGED VERSION) ---
// --- BAO GỒM: TOÁN, TIẾNG VIỆT, TIẾNG ANH, KHOA HỌC, LỊCH SỬ, ĐỊA LÝ ---
// =================================================================

const tests = {
    // -----------------------------------------------------------------
    // 1. TOÁN HỌC (Dữ liệu chi tiết từ File 1)
    // -----------------------------------------------------------------
    'toan': {
        'grade1': {
            'easy': [
                { id: 't1_1', q: 'Số liền sau của 7 là?', a: ['6', '7', '8', '9'], correct: '8' },
                { id: 't1_2', q: '5 + 3 = ?', a: ['7', '8', '9', '10'], correct: '8' },
                { id: 't1_3', q: '9 - 4 = ?', a: ['3', '4', '5', '6'], correct: '5' },
                { id: 't1_4', q: 'Số lớn nhất trong các số 2, 8, 5, 10 là?', a: ['2', '8', '5', '10'], correct: '10' },
                { id: 't1_5', q: '6 + ... = 10', a: ['2', '3', '4', '5'], correct: '4' },
                { id: 't1_8', q: 'Có 5 quả táo, thêm 2 quả táo nữa. Có tất cả bao nhiêu quả?', a: ['6', '7', '8', '9'], correct: '7' },
                { id: 't1_14', q: 'Số 16 đọc là gì?', a: ['Một sáu', 'Mười sáu', 'Mười và sáu', 'Sáu mươi'], correct: 'Mười sáu' },
            ],
            'medium': [
                { id: 't1_6', q: 'Số liền trước của 19 là?', a: ['17', '18', '20', '21'], correct: '18' },
                { id: 't1_7', q: 'Phép tính nào có kết quả bằng 9?', a: ['4 + 4', '10 - 2', '5 + 4', '3 + 5'], correct: '5 + 4' },
                { id: 't1_9', q: 'Số bé nhất có hai chữ số là?', a: ['9', '10', '11', '99'], correct: '10' },
                { id: 't1_10', q: '7 + 2 - 1 = ?', a: ['7', '8', '9', '10'], correct: '8' },
                { id: 't1_11', q: 'Số gồm 1 chục và 5 đơn vị là số nào?', a: ['10', '5', '15', '51'], correct: '15' },
                { id: 't1_12', q: 'Trong các số 12, 18, 15, 11, số nào lớn nhất?', a: ['12', '18', '15', '11'], correct: '18' },
                { id: 't1_13', q: '10 - ... = 3', a: ['5', '6', '7', '8'], correct: '7' },
            ],
            'hard': [
                { id: 't1_15', q: 'Phép tính nào sai?', a: ['5+5=10', '8-3=5', '4+3=8', '9-0=9'], correct: '4+3=8' },
                { id: 't1_16', q: 'Số nhỏ nhất trong các số 19, 9, 29, 39 là?', a: ['19', '9', '29', '39'], correct: '9' },
                { id: 't1_17', q: 'Có bao nhiêu số có một chữ số?', a: ['8', '9', '10', '11'], correct: '10' },
                { id: 't1_18', q: '2 + 3 + 4 = ?', a: ['7', '8', '9', '10'], correct: '9' },
                { id: 't1_19', q: '8 lớn hơn mấy?', a: ['9', '10', '8', '7'], correct: '7' },
                { id: 't1_20', q: 'Trong các hình: tròn, vuông, tam giác, hình nào có 3 cạnh?', a: ['Tròn', 'Vuông', 'Tam giác', 'Không hình nào'], correct: 'Tam giác' },
            ]
        },
        'grade2': {
            'easy': [
                { id: 't2_1', q: '5 x 8 = ?', a: ['35', '40', '45', '50'], correct: '40' },
                { id: 't2_2', q: '27 + 12 = ?', a: ['39', '38', '49', '48'], correct: '39' },
                { id: 't2_3', q: '50 - 20 = ?', a: ['20', '30', '40', '70'], correct: '30' },
                { id: 't2_4', q: '18 : 2 = ?', a: ['7', '8', '9', '10'], correct: '9' },
                { id: 't2_5', q: 'Số "Bốn trăm linh năm" viết là?', a: ['450', '405', '4005', '45'], correct: '405' },
                { id: 't2_16', q: 'Một mét bằng bao nhiêu xăng-ti-mét?', a: ['10 cm', '1 cm', '1000 cm', '100 cm'], correct: '100 cm' },
                { id: 't2_17', q: 'Số lớn nhất có 2 chữ số là?', a: ['10', '90', '99', '100'], correct: '99' }
            ],
            'medium': [
                { id: 't2_6', q: '45 + 28 = ?', a: ['63', '73', '613', '713'], correct: '73' },
                { id: 't2_7', q: '80 - 35 = ?', a: ['45', '55', '50', '40'], correct: '45' },
                { id: 't2_8', q: 'Tìm X, biết: X : 5 = 7', a: ['12', '2', '30', '35'], correct: '35' },
                { id: 't2_9', q: '1/3 của 12 là mấy?', a: ['3', '4', '5', '6'], correct: '4' },
                { id: 't2_10', q: 'Đồng hồ chỉ 3 giờ chiều (15:00). 30 phút nữa là mấy giờ?', a: ['15:30', '16:00', '14:30', '18:00'], correct: '15:30' },
                { id: 't2_18', q: 'Số gồm 5 trăm, 0 chục, 2 đơn vị là?', a: ['502', '520', '205', '5002'], correct: '502' }
            ],
            'hard': [
                { id: 't2_11', q: 'Có 24 cái kẹo chia đều cho 4 bạn. Hỏi mỗi bạn được mấy cái kẹo?', a: ['4', '5', '6', '8'], correct: '6' },
                { id: 't2_12', q: '5 x 9 + 15 = ?', a: ['45', '50', '60', '70'], correct: '60' },
                { id: 't2_13', q: 'Hình tứ giác là hình có mấy cạnh?', a: ['3 cạnh', '4 cạnh', '5 cạnh', '6 cạnh'], correct: '4 cạnh' },
                { id: 't2_14', q: 'Tìm X, biết: X - 14 = 30', a: ['16', '44', '26', '54'], correct: '44' },
                { id: 't2_15', q: 'Số bé nhất có 3 chữ số khác nhau là?', a: ['100', '101', '123', '102'], correct: '102' },
                { id: 't2_19', q: 'Lan có 15 quyển vở. Mẹ mua thêm cho Lan 5 quyển. Lan cho bạn 3 quyển. Lan còn lại bao nhiêu quyển?', a: ['17', '20', '10', '23'], correct: '17' }
            ]
        },
        'grade3': {
            'easy': [
                { id: 't3_1', q: '8 x 7 = ?', a: ['54', '56', '63', '64'], correct: '56' },
                { id: 't3_2', q: '63 : 9 = ?', a: ['6', '7', '8', '9'], correct: '7' },
                { id: 't3_3', q: 'Số liền sau của 499 là?', a: ['498', '500', '501', '490'], correct: '500' },
                { id: 't3_4', q: 'Một giờ có bao nhiêu phút?', a: ['50 phút', '60 phút', '30 phút', '100 phút'], correct: '60 phút' },
                { id: 't3_5', q: '1km bằng bao nhiêu mét?', a: ['10m', '100m', '1000m', '10000m'], correct: '1000m' },
                { id: 't3_16', q: 'Phép tính nào đúng?', a: ['120 + 30 = 160', '500 - 100 = 300', '50 x 2 = 100', '100 : 1 = 10'], correct: '50 x 2 = 100' },
                { id: 't3_17', q: 'Số 745 đọc là gì?', a: ['Bảy bốn năm', 'Bảy trăm bốn lăm', 'Bảy trăm bốn mươi lăm', 'Bảy trăm mươi lăm'], correct: 'Bảy trăm bốn mươi lăm' }
            ],
            'medium': [
                { id: 't3_6', q: 'Tìm X, biết: X + 115 = 230', a: ['105', '110', '115', '120'], correct: '115' },
                { id: 't3_7', q: '5m 3cm = ... cm?', a: ['53', '503', '530', '5003'], correct: '503' },
                { id: 't3_8', q: 'Hình vuông có cạnh 4cm. Chu vi của hình vuông đó là?', a: ['8cm', '12cm', '16cm', '20cm'], correct: '16cm' },
                { id: 't3_9', q: 'Mua 3 quyển vở hết 9000 đồng. Hỏi mua 5 quyển vở như thế hết bao nhiêu tiền?', a: ['12000', '15000', '18000', '27000'], correct: '15000' },
                { id: 't3_10', q: 'Số lớn nhất có 3 chữ số là?', a: ['100', '987', '999', '102'], correct: '999' },
                { id: 't3_18', q: 'Trong các số 876, 786, 867, 687, số nào bé nhất?', a: ['876', '786', '867', '687'], correct: '687' }
            ],
            'hard': [
                { id: 't3_11', q: '1/3 của 30 phút là bao nhiêu phút?', a: ['5 phút', '10 phút', '15 phút', '20 phút'], correct: '10 phút' },
                { id: 't3_12', q: 'Có 40 cái kẹo chia đều cho 5 bạn. Hỏi 3 bạn có bao nhiêu cái kẹo?', a: ['8', '15', '24', '30'], correct: '24' },
                { id: 't3_13', q: 'Số nhỏ nhất có 3 chữ số khác nhau là?', a: ['100', '101', '102', '123'], correct: '102' },
                { id: 't3_14', q: 'Hôm nay là thứ Ba. 10 ngày nữa là thứ mấy?', a: ['Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'], correct: 'Thứ Sáu' },
                { id: 't3_15', q: 'Một hình chữ nhật có chu vi 20m, chiều dài 6m. Chiều rộng là bao nhiêu?', a: ['4m', '5m', '10m', '14m'], correct: '4m' },
                { id: 't3_19', q: '9 x 9 - 9 : 9 = ?', a: ['0', '9', '80', '81'], correct: '80' }
            ]
        },
        'grade4': {
            'easy': [
                { id: 't4_1', q: 'Phân số "ba phần tư" được viết là?', a: ['3/4', '4/3', '34', '43'], correct: '3/4' },
                { id: 't4_2', q: '125 x 4 = ?', a: ['400', '500', '600', '480'], correct: '500' },
                { id: 't4_3', q: '1 tấn bằng bao nhiêu kilôgam?', a: ['10 kg', '100 kg', '1000 kg', '10000 kg'], correct: '1000 kg' },
                { id: 't4_4', q: 'Số lớn nhất trong các số: 5432, 5423, 5342, 5324 là?', a: ['5432', '5423', '5342', '5324'], correct: '5432' },
                { id: 't4_5', q: 'Góc bẹt bằng bao nhiêu độ?', a: ['45 độ', '90 độ', '120 độ', '180 độ'], correct: '180 độ' },
                { id: 't4_16', q: '2 phút 10 giây = ... giây?', a: ['30', '120', '130', '210'], correct: '130' },
                { id: 't4_17', q: 'Phép tính 1000 : 100 có kết quả là?', a: ['1', '10', '100', '1000'], correct: '10' }
            ],
            'medium': [
                { id: 't4_6', q: 'Tìm X, biết: X - 250 = 400', a: ['150', '600', '650', '750'], correct: '650' },
                { id: 't4_7', q: '1/2 + 1/4 = ?', a: ['2/6', '1/8', '3/4', '2/4'], correct: '3/4' },
                { id: 't4_8', q: 'Hình vuông có chu vi 36cm. Cạnh của hình vuông đó là?', a: ['9cm', '6cm', '4cm', '18cm'], correct: '9cm' },
                { id: 't4_9', q: '5m² 7dm² = ... dm²?', a: ['57', '507', '570', '5007'], correct: '507' },
                { id: 't4_10', q: 'Số trung bình cộng của 10 và 20 là?', a: ['10', '15', '20', '30'], correct: '15' },
                { id: 't4_18', q: '3/5 của 15 là?', a: ['3', '5', '9', '25'], correct: '9' }
            ],
            'hard': [
                // --- DẠNG 1: SỐ TỰ NHIÊN & LÀM TRÒN ---
                { id: 't4_h1', q: 'Số lớn nhất có 6 chữ số khác nhau mà chữ số hàng nghìn là 0 là?', a: ['980 765', '987 065', '980 754', '987 650'], correct: '987 065' },
                { id: 't4_h2', q: 'Số bé nhất có 5 chữ số khác nhau mà tổng các chữ số bằng 15 là?', a: ['10 239', '10 248', '10 347', '12 345'], correct: '10 239' },
                { id: 't4_h3', q: 'Khi làm tròn số $X$ đến hàng trăm nghìn ta được 600 000. Biết chữ số hàng chục nghìn là 5, số $X$ nhỏ nhất có thể là?', a: ['550 000', '650 000', '500 000', '600 000'], correct: '550 000' },
                { id: 't4_h4', q: 'Tìm một số có 5 chữ số, biết rằng nếu viết thêm chữ số 2 vào đằng trước số đó ta được số mới gấp 5 lần số đã cho?', a: ['50 000', '40 000', '25 000', '60 000'], correct: '50 000' },
                { id: 't4_h5', q: 'Tổng của số lớn nhất có 5 chữ số khác nhau và số bé nhất có 5 chữ số khác nhau là?', a: ['108 999', '108 989', '109 999', '111 110'], correct: '108 989' },
                { id: 't4_h6', q: 'Hiệu của số lớn nhất có 6 chữ số và số bé nhất có 6 chữ số khác nhau là?', a: ['897 654', '897 543', '897 655', '900 000'], correct: '897 654' },
                { id: 't4_h7', q: 'Số nào dưới đây vừa chia hết cho 2, vừa chia hết cho 5 và có tổng các chữ số bằng 9?', a: ['450', '900', '810', 'Tất cả đều đúng'], correct: 'Tất cả đều đúng' },
                { id: 't4_h8', q: 'Từ các chữ số 0, 1, 2, 3 có thể lập được bao nhiêu số có 4 chữ số khác nhau?', a: ['18', '24', '12', '16'], correct: '18' },
                { id: 't4_h9', q: 'Giá trị của chữ số 5 trong số $572 800$ gấp mấy lần giá trị của chữ số 5 trong số $105 000$?', a: ['10 lần', '100 lần', '1000 lần', '2 lần'], correct: '100 lần' },
                { id: 't4_h10', q: 'Làm tròn số $995 432$ đến hàng chục nghìn ta được?', a: ['990 000', '1 000 000', '995 000', '1 010 000'], correct: '1 000 000' },
                { id: 't4_h11', q: 'Tìm số tự nhiên $x$ sao cho: $25 000 < x < 25 010$ và $x$ là số tròn năm?', a: ['25 001', '25 005', '25 010', '25 000'], correct: '25 005' },
                { id: 't4_h12', q: 'Số gồm 2 triệu, 5 trăm nghìn và 2 đơn vị là?', a: ['2 500 002', '2 050 002', '2 502 000', '2 500 020'], correct: '2 500 002' },
                { id: 't4_h13', q: 'Dãy số nào được sắp xếp theo thứ tự giảm dần?', a: ['987, 897, 789', '789, 897, 987', '897, 987, 789', '789, 798, 897'], correct: '987, 897, 789' },
                { id: 't4_h14', q: 'Số bé nhất có 5 chữ số mà chữ số hàng chục là 7 và là số lẻ?', a: ['10 071', '10 073', '10 075', '10 070'], correct: '10 071' },
                { id: 't4_h15', q: 'Nếu $a$ là số có 3 chữ số, $b$ là số có 2 chữ số thì hiệu $a - b$ nhỏ nhất là bao nhiêu?', a: ['1', '2', '91', '10'], correct: '1' },
                { id: 't4_h16', q: 'Số lớn nhất có 5 chữ số mà khi chia cho 5 dư 3 là?', a: ['99 998', '99 993', '99 995', '99 999'], correct: '99 998' },
                { id: 't4_h17', q: 'Để viết các số từ 1 đến 100 cần bao nhiêu chữ số 1?', a: ['20', '21', '19', '11'], correct: '21' },
                { id: 't4_h18', q: 'Tìm số tròn chục $x$ biết $100 < x \times 2 < 140$?', a: ['60', '70', '50', '80'], correct: '60' },
                { id: 't4_h19', q: 'Một số có 4 chữ số, nếu xóa chữ số hàng nghìn thì số đó giảm đi bao nhiêu đơn vị?', a: ['1000 lần', '9000 đơn vị', 'Tùy vào chữ số đó', '1000 đơn vị'], correct: 'Tùy vào chữ số đó' },
                { id: 't4_h20', q: 'Số trung bình cộng của số lớn nhất có 2 chữ số và số bé nhất có 4 chữ số là?', a: ['549', '549.5', '1099', '500'], correct: '549.5' },
                // --- DẠNG 2: ĐỔI ĐƠN VỊ & THỜI GIAN ---
                { id: 't4_h21', q: 'Một con voi nặng 3 tấn 5 tạ, một con bò nặng 4 tạ. Cả hai con nặng bao nhiêu yến?', a: ['390 yến', '3900 yến', '39 yến', '354 yến'], correct: '390 yến' },
                { id: 't4_h22', q: '2 giờ rưỡi và 15 phút bằng bao nhiêu phút?', a: ['135 phút', '165 phút', '150 phút', '145 phút'], correct: '165 phút' },
                { id: 't4_h23', q: 'Năm 1789 thuộc thế kỷ thứ mấy? Năm đó là năm nhuận hay năm thường?', a: ['Thế kỷ 18, năm thường', 'Thế kỷ 17, năm thường', 'Thế kỷ 18, năm nhuận', 'Thế kỷ 19, năm thường'], correct: 'Thế kỷ 18, năm thường' },
                { id: 't4_h24', q: 'Một xe tải chở 4 chuyến, mỗi chuyến 25 tạ hàng. Tổng số hàng xe đó chở được là bao nhiêu tấn?', a: ['10 tấn', '100 tấn', '1 tấn', '1000 tấn'], correct: '10 tấn' },
                { id: 't4_h25', q: 'Bác Hồ ra đi tìm đường cứu nước năm 1911. Năm đó thuộc thế kỷ nào?', a: ['XIX', 'XX', 'XXI', 'XVIII'], correct: 'XX' },
                { id: 't4_h26', q: '3 ngày 4 giờ ... 80 giờ. Dấu cần điền là?', a: ['>', '<', '=', 'Không so sánh được'], correct: '<' },
                { id: 't4_h27', q: '1/5 thế kỷ và 15 năm bằng bao nhiêu năm?', a: ['35 năm', '20 năm', '15 năm', '25 năm'], correct: '35 năm' },
                { id: 't4_h28', q: 'Một người đi bộ trong 1 phút được 60m. Trong 1 giờ người đó đi được bao nhiêu km?', a: ['3.6 km', '6 km', '36 km', '0.6 km'], correct: '3.6 km' },
                { id: 't4_h29', q: 'Có 5 bao gạo nặng tổng cộng 2 tạ. Hỏi 8 bao như thế nặng bao nhiêu kg?', a: ['320 kg', '40 kg', '160 kg', '200 kg'], correct: '320 kg' },
                { id: 't4_h30', q: 'Kim phút quay được 3 vòng thì hết bao nhiêu giờ?', a: ['1 giờ', '2 giờ', '3 giờ', '180 giờ'], correct: '3 giờ' },
                { id: 't4_h31', q: '8 tấn 7kg = ... kg?', a: ['807', '8007', '8700', '80007'], correct: '8007' },
                { id: 't4_h32', q: 'Một ngày rưỡi có bao nhiêu giây?', a: ['129 600', '86 400', '43 200', '100 000'], correct: '129 600' },
                { id: 't4_h33', q: 'Năm nhuận có bao nhiêu tuần và bao nhiêu ngày?', a: ['52 tuần 1 ngày', '52 tuần 2 ngày', '51 tuần', '50 tuần'], correct: '52 tuần 2 ngày' },
                { id: 't4_h34', q: '4 tạ 5kg ... 45 yến. Điền dấu?', a: ['>', '<', '=', 'Không rõ'], correct: '<' },
                { id: 't4_h35', q: 'Một máy in in được 25 trang trong 1 phút. Để in 1000 trang cần bao nhiêu phút?', a: ['40 phút', '50 phút', '25 phút', '100 phút'], correct: '40 phút' },
                { id: 't4_h36', q: '1/4 ngày bằng bao nhiêu giờ?', a: ['4 giờ', '6 giờ', '8 giờ', '12 giờ'], correct: '6 giờ' },
                { id: 't4_h37', q: 'Thế kỷ 21 bắt đầu từ năm nào?', a: ['2000', '2001', '2100', '1999'], correct: '2001' },
                { id: 't4_h38', q: '7 yến 5kg + 25kg = ... kg?', a: ['100 kg', '95 kg', '1 yến', '1 tạ'], correct: '100 kg' },
                { id: 't4_h39', q: 'Bình đi học từ 7 giờ 15 phút và đến trường lúc 8 giờ kém 10 phút. Bình đi hết bao nhiêu phút?', a: ['35 phút', '45 phút', '25 phút', '55 phút'], correct: '35 phút' },
                { id: 't4_h40', q: 'Giá trị của 2 tạ 5 yến gấp mấy lần 5 kg?', a: ['5 lần', '50 lần', '25 lần', '10 lần'], correct: '50 lần' },
                // --- DẠNG 3: HÌNH HỌC ---
                { id: 't4_h41', q: 'Góc tạo bởi kim giờ và kim phút lúc 4 giờ là góc gì?', a: ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt'], correct: 'Góc tù' },
                { id: 't4_h42', q: 'Một hình chữ nhật có chu vi 48cm. Nếu tăng chiều rộng thêm 4cm thì được hình vuông. Diện tích hình chữ nhật là?', a: ['140 $cm^2$', '128 $cm^2$', '160 $cm^2$', '100 $cm^2$'], correct: '140 $cm^2$' },
                { id: 't4_h43', q: 'Hai đường thẳng vuông góc với nhau tạo thành mấy góc nhọn?', a: ['0', '1', '2', '4'], correct: '0' },
                { id: 't4_h44', q: 'Cho hình vuông có cạnh 8cm. Nếu gấp cạnh lên 3 lần thì diện tích thay đổi thế nào?', a: ['Tăng 3 lần', 'Tăng 6 lần', 'Tăng 9 lần', 'Không đổi'], correct: 'Tăng 9 lần' },
                { id: 't4_h45', q: 'Hình thoi có độ dài hai đường chéo lần lượt là 10cm và 12cm. Diện tích là?', a: ['120 $cm^2$', '60 $cm^2$', '22 $cm^2$', '44 $cm^2$'], correct: '60 $cm^2$' },
                { id: 't4_h46', q: 'Góc nhọn 45 độ bằng một nửa của góc nào?', a: ['Góc tù', 'Góc bẹt', 'Góc vuông', 'Góc 60 độ'], correct: 'Góc vuông' },
                { id: 't4_h47', q: 'Một hình chữ nhật có chiều dài gấp 3 lần chiều rộng và diện tích là 75 $cm^2$. Chu vi hình đó là?', a: ['40 cm', '30 cm', '20 cm', '80 cm'], correct: '40 cm' },
                { id: 't4_h48', q: 'Hai đường thẳng song song là hai đường thẳng như thế nào?', a: ['Cắt nhau tại 1 điểm', 'Không bao giờ cắt nhau', 'Tạo thành góc vuông', 'Luôn luôn trùng nhau'], correct: 'Không bao giờ cắt nhau' },
                { id: 't4_h49', q: 'Góc bẹt có số đo bằng tổng của mấy góc vuông?', a: ['1', '2', '3', '4'], correct: '2' },
                { id: 't4_h50', q: 'Hình nào có hai cặp cạnh đối diện song song và bốn cạnh bằng nhau?', a: ['Hình chữ nhật', 'Hình bình hành', 'Hình thoi', 'Hình thang'], correct: 'Hình thoi' },
                { id: 't4_h51', q: 'Trong hình chữ nhật, hai đường chéo có tính chất gì?', a: ['Vuông góc', 'Bằng nhau', 'Song song', 'Không cắt nhau'], correct: 'Bằng nhau' },
                { id: 't4_h52', q: 'Kim đồng hồ lúc mấy giờ tạo thành góc bẹt?', a: ['3 giờ', '9 giờ', '6 giờ', '12 giờ'], correct: '6 giờ' },
                { id: 't4_h53', q: 'Một tam giác có thể có tối đa bao nhiêu góc tù?', a: ['0', '1', '2', '3'], correct: '1' },
                { id: 't4_h54', q: 'Diện tích hình bình hành có đáy 15cm và chiều cao 8cm là?', a: ['120 $cm^2$', '60 $cm^2$', '23 $cm^2$', '46 $cm^2$'], correct: '120 $cm^2$' },
                { id: 't4_h55', q: 'Hình vuông có diện tích 100 $cm^2$ thì chu vi là?', a: ['40 cm', '20 cm', '50 cm', '10 cm'], correct: '40 cm' },
                { id: 't4_h56', q: 'Nếu một cạnh của hình chữ nhật giữ nguyên, cạnh kia tăng 2 lần thì diện tích?', a: ['Tăng 2 lần', 'Tăng 4 lần', 'Không đổi', 'Giảm 2 lần'], correct: 'Tăng 2 lần' },
                { id: 't4_h57', q: 'Góc có số đo 150 độ là góc gì?', a: ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt'], correct: 'Góc tù' },
                { id: 't4_h58', q: 'Số góc vuông trong hình chữ nhật là?', a: ['2', '4', '0', '1'], correct: '4' },
                { id: 't4_h59', q: 'Hình thoi có bao nhiêu cặp cạnh song song?', a: ['1', '2', '4', '0'], correct: '2' },
                { id: 't4_h60', q: 'Muốn tính diện tích hình thoi ta làm thế nào?', a: ['Cạnh nhân cạnh', 'Tích hai đường chéo chia 2', 'Dài cộng rộng nhân 2', 'Đáy nhân chiều cao'], correct: 'Tích hai đường chéo chia 2' },
                // --- DẠNG 4: PHÉP TÍNH & TÌM X ---
                { id: 't4_h61', q: 'Tìm X: $X \times 12 + X \times 8 = 400$?', a: ['10', '20', '30', '40'], correct: '20' },
                { id: 't4_h62', q: 'Tính nhanh: $125 \times 16 \times 5 = ?$', a: ['10 000', '1 000', '20 000', '12 500'], correct: '10 000' },
                { id: 't4_h63', q: 'Tìm X: $(X - 120) : 4 = 150$?', a: ['720', '480', '600', '520'], correct: '720' },
                { id: 't4_h64', q: 'Kết quả của phép tính: $999 \times 11 = ?$', a: ['10 989', '9 999', '11 111', '10 889'], correct: '10 989' },
                { id: 't4_h65', q: 'Tìm X: $1500 : X = 25 \times 2$?', a: ['30', '60', '25', '15'], correct: '30' },
                { id: 't4_h66', q: 'Giá trị của biểu thức $1000 - 500 : 5 + 10$ là?', a: ['110', '910', '100', '890'], correct: '910' },
                { id: 't4_h67', q: 'Một phép chia có số chia là 8, thương là 12 và số dư là số dư lớn nhất có thể. Số bị chia là?', a: ['103', '96', '104', '105'], correct: '103' },
                { id: 't4_h68', q: 'Tính: $45 \times 11 - 45 = ?$', a: ['450', '495', '405', '500'], correct: '450' },
                { id: 't4_h69', q: 'Tìm số $x$ biết $x$ là số chẵn và $15 < x < 18$?', a: ['16', '17', '14', '18'], correct: '16' },
                { id: 't4_h70', q: 'Kết quả của $1 + 2 + 3 + ... + 10 = ?$', a: ['45', '55', '65', '100'], correct: '55' },
                { id: 't4_h71', q: 'Tìm X: $X : 11 = 121$?', a: ['11', '1331', '121', '132'], correct: '1331' },
                { id: 't4_h72', q: 'Hiệu của số lớn nhất có 4 chữ số và số nhỏ nhất có 4 chữ số là?', a: ['8999', '9000', '8000', '9999'], correct: '8999' },
                { id: 't4_h73', q: 'Tính nhanh: $25 \times 4 \times 13 = ?$', a: ['130', '1300', '2500', '1000'], correct: '1300' },
                { id: 't4_h74', q: 'Một số chia cho 9 dư 5. Hỏi số đó cộng thêm bao nhiêu thì chia hết cho 9 và thương tăng thêm 1 đơn vị?', a: ['4', '5', '9', '1'], correct: '4' },
                { id: 't4_h75', q: 'Kết quả của $200 \times 300 = ?$', a: ['6 000', '60 000', '600 000', '600'], correct: '60 000' },
                { id: 't4_h76', q: 'Tìm X: $X \times 9 = 0$?', a: ['0', '9', '1', 'Không có'], correct: '0' },
                { id: 't4_h77', q: 'Giá trị biểu thức $(15 + 35) \times (20 - 10) = ?$', a: ['500', '100', '50', '250'], correct: '500' },
                { id: 't4_h78', q: 'Số nào nhân với 100 thì được 10 000?', a: ['10', '100', '1000', '1'], correct: '100' },
                { id: 't4_h79', q: 'Tìm X: $X - 456 = 544$?', a: ['1000', '88', '100', '900'], correct: '1000' },
                { id: 't4_h80', q: 'Phép nhân một số với 11 có mẹo tính nhẩm là gì?', a: ['Thêm số 0', 'Cộng hai chữ số rồi viết vào giữa', 'Nhân với 10 rồi cộng chính nó', 'Cả B và C'], correct: 'Cả B và C' },
                // --- DẠNG 5: TRUNG BÌNH CỘNG & TỔNG - HIỆU ---
                { id: 't4_h81', q: 'Trung bình cộng của 5 số lẻ liên tiếp là 11. Số lớn nhất trong 5 số đó là?', a: ['13', '15', '11', '17'], correct: '15' },
                { id: 't4_h82', q: 'Tổng của hai số là 100, hiệu là 20. Tích của hai số đó là?', a: ['2400', '2000', '1500', '800'], correct: '2400' },
                { id: 't4_h83', q: 'An có 20 viên bi, Bình có 24 viên bi. Chi có số bi hơn trung bình cộng của cả ba bạn là 2 viên. Chi có bao nhiêu viên bi?', a: ['24', '25', '26', '22'], correct: '25' },
                { id: 't4_h84', q: 'Tổng của hai số là số lớn nhất có 2 chữ số. Hiệu của hai số là 11. Hai số đó là?', a: ['55 và 44', '50 và 49', '60 và 39', '45 và 54'], correct: '55 và 44' },
                { id: 't4_h85', q: 'Trung bình cộng của hai số là 50. Biết số thứ nhất gấp 4 lần số thứ hai. Số lớn là?', a: ['80', '20', '40', '100'], correct: '80' },
                { id: 't4_h86', q: 'Tuổi bố và tuổi con cộng lại là 50 tuổi. Bố hơn con 28 tuổi. Tính tuổi mỗi người?', a: ['39 và 11', '40 và 10', '38 và 12', '41 và 9'], correct: '39 và 11' },
                { id: 't4_h87', q: 'Trung bình cộng của các số lẻ nhỏ hơn 10 là?', a: ['5', '4', '6', '4.5'], correct: '5' },
                { id: 't4_h88', q: 'Hai lớp 4A và 4B trồng được 600 cây. Lớp 4A trồng ít hơn lớp 4B là 50 cây. Số cây lớp 4B trồng là?', a: ['325', '275', '350', '300'], correct: '325' },
                { id: 't4_h89', q: 'Trung bình cộng của 3 số là 20. Nếu gấp mỗi số lên 2 lần thì trung bình cộng mới là?', a: ['20', '40', '60', '80'], correct: '40' },
                { id: 't4_h90', q: 'Tìm hai số có tổng là 200 và hiệu là 0?', a: ['100 và 100', '200 và 0', '150 và 50', '110 và 90'], correct: '100 và 100' },
                { id: 't4_h91', q: 'Một đội công nhân ngày thứ nhất làm được 120m đường, ngày thứ hai làm được hơn ngày thứ nhất 20m. Trung bình mỗi ngày làm được?', a: ['130 m', '140 m', '120 m', '150 m'], correct: '130 m' },
                { id: 't4_h92', q: 'Tổng của ba số là 60. Trung bình cộng của số thứ nhất và số thứ hai là 15. Số thứ ba là?', a: ['30', '15', '45', '20'], correct: '30' },
                { id: 't4_h93', q: 'Hiệu của hai số là 40. Nếu tăng số bị trừ thêm 10 và giảm số trừ 10 thì hiệu mới là?', a: ['40', '60', '20', '50'], correct: '60' },
                { id: 't4_h94', q: 'Trung bình cộng của các số tròn chục có 2 chữ số là?', a: ['50', '45', '55', '60'], correct: '50' },
                { id: 't4_h95', q: 'Mẹ hơn con 25 tuổi. Tổng số tuổi của hai mẹ con là 45. Tuổi con là?', a: ['10', '35', '15', '20'], correct: '10' },
                { id: 't4_h96', q: 'Tìm hai số khi biết tổng là 120 và hiệu là số bé nhất có hai chữ số?', a: ['65 và 55', '70 và 50', '60 và 60', '75 và 45'], correct: '65 và 55' },
                { id: 't4_h97', q: 'Trung bình cộng của số thứ nhất và số thứ hai là 25, số thứ hai và số thứ ba là 30, số thứ ba và số thứ nhất là 35. Tổng ba số là?', a: ['90', '45', '180', '60'], correct: '90' },
                { id: 't4_h98', q: 'Một cửa hàng có 2 tấn gạo. Ngày đầu bán 8 tạ, ngày sau bán 6 tạ. Cửa hàng còn lại bao nhiêu kg?', a: ['400 kg', '200 kg', '600 kg', '0 kg'], correct: '600 kg' },
                { id: 't4_h99', q: 'Tổng của hai số lẻ là 20. Hiệu của chúng là 4. Hai số đó là?', a: ['12 và 8', '13 và 7', '11 và 9', '15 và 5'], correct: '12 và 8' },
                { id: 't4_h100', q: 'Trung bình cộng của 10 số tự nhiên liên tiếp đầu tiên là?', a: ['4.5', '5', '5.5', '4'], correct: '4.5' }
            ]
        },
        'grade5': {
            'easy': [
                { id: 't5_1', q: 'Số "Năm phẩy mười hai" viết là?', a: ['5,12', '5,102', '51,2', '50,12'], correct: '5,12' },
                { id: 't5_2', q: '3,45 + 1,2 = ?', a: ['4,65', '4,55', '3,57', '4,47'], correct: '4,65' },
                { id: 't5_3', q: '50% của 100 là bao nhiêu?', a: ['50', '25', '100', '200'], correct: '50' },
                { id: 't5_4', q: '1/2 + 1/2 = ?', a: ['2/4', '1/4', '1', '2'], correct: '1' },
                { id: 't5_5', q: 'Số lớn nhất trong các số: 0.5, 0.15, 0.05, 0.51 là?', a: ['0.5', '0.15', '0.05', '0.51'], correct: '0.51' },
                { id: 't5_16', q: '10,5 - 5,0 = ?', a: ['5,0', '5,5', '15,5', '5'], correct: '5,5' },
                { id: 't5_17', q: '25% được viết dưới dạng phân số tối giản là?', a: ['25/100', '5/20', '1/4', '1/5'], correct: '1/4' }
            ],
            'medium': [
                { id: 't5_6', q: '2.5 x 4 = ?', a: ['1.0', '10', '100', '10.5'], correct: '10' },
                { id: 't5_7', q: '10 : 0.1 = ?', a: ['1', '10', '100', '0.01'], correct: '100' },
                { id: 't5_8', q: '3/4 + 1/8 = ?', a: ['4/12', '4/8', '7/8', '5/8'], correct: '7/8' },
                { id: 't5_9', q: 'Một hình chữ nhật có chiều dài 10m, chiều rộng 5m. Diện tích là?', a: ['15 m²', '30 m²', '50 m²', '50 m'], correct: '50 m²' },
                { id: 't5_10', q: '1.5 tấn = ... kg?', a: ['150', '15', '1500', '15000'], correct: '1500' },
                { id: 't5_18', q: 'Viết 5m 2cm dưới dạng số thập phân (đơn vị mét):', a: ['5,2m', '5,02m', '5,002m', '52m'], correct: '5,02m' }
            ],
            'hard': [
                { id: 't5_11', q: 'Một người đi xe đạp 30km trong 2 giờ. Vận tốc của người đó là?', a: ['15 km/h', '60 km/h', '32 km/h', '28 km/h'], correct: '15 km/h' },
                { id: 't5_12', q: 'Diện tích hình tam giác có đáy 5cm, chiều cao 4cm là?', a: ['10 cm²', '20 cm²', '9 cm²', '10 cm'], correct: '10 cm²' },
                { id: 't5_13', q: 'Lớp có 40 học sinh, trong đó có 10 học sinh nữ. Tỉ số phần trăm của học sinh nữ so với cả lớp là?', a: ['10%', '40%', '25%', '50%'], correct: '25%' },
                { id: 't5_14', q: 'Tìm X, biết: X x 1.2 = 6', a: ['0.5', '5', '7.2', '4.8'], correct: '5' },
                { id: 't5_15', q: 'Chu vi hình tròn có bán kính 1cm là? (Lấy Pi = 3.14)', a: ['3.14 cm', '6.28 cm', '1.57 cm', '31.4 cm'], correct: '6.28 cm' },
                { id: 't5_19', q: 'Giá một chiếc áo là 200,000 đồng. Giảm giá 10% thì giá mới là?', a: ['180,000', '20,000', '190,000', '220,000'], correct: '180,000' }
            ]
        },
        'grade9': {
            'easy': [
                { id: 't9_1', q: 'Phương trình x² - 4 = 0 có tập nghiệm là?', a: ['{2}', '{-2}', '{2, -2}', 'Ø'], correct: '{2, -2}' },
                { id: 't9_2', q: 'Trong một đường tròn, góc nội tiếp chắn nửa đường tròn là góc gì?', a: ['Góc nhọn', 'Góc tù', 'Góc vuông', 'Góc bẹt'], correct: 'Góc vuông' },
                { id: 't9_3', q: 'Hệ phương trình x+y=5 và x-y=1 có nghiệm là?', a: ['(2, 3)', '(3, 2)', '(4, 1)', '(1, 4)'], correct: '(3, 2)' },
                { id: 't9_4', q: 'Điều kiện để biểu thức √(x-3) có nghĩa là?', a: ['x > 3', 'x < 3', 'x ≥ 3', 'x ≠ 3'], correct: 'x ≥ 3' },
                { id: 't9_5', q: 'Hàm số y = 2x + 1 là hàm số...?', a: ['Đồng biến', 'Nghịch biến', 'Không đổi', 'Hằng số'], correct: 'Đồng biến' },
                { id: 't9_11', q: 'Kết quả của phép tính √9 * √4 là?', a: ['√13', '√36', '6', '18'], correct: '6' },
                { id: 't9_15', q: 'Góc ở tâm là góc có đỉnh...', a: ['Nằm trên đường tròn', 'Trùng với tâm đường tròn', 'Nằm bên trong đường tròn', 'Nằm bên ngoài đường tròn'], correct: 'Trùng với tâm đường tròn' },
            ],
            'medium': [
                { id: 't9_6', q: 'Đồ thị hàm số y = ax² (a≠0) đi qua gốc tọa độ và nhận trục nào làm trục đối xứng?', a: ['Trục hoành Ox', 'Trục tung Oy', 'Đường phân giác y=x', 'Không có'], correct: 'Trục tung Oy' },
                { id: 't9_7', q: 'Cho tam giác ABC vuông tại A, sin(B) bằng?', a: ['Cạnh kề / Cạnh huyền', 'Cạnh đối / Cạnh huyền', 'Cạnh đối / Cạnh kề', 'Cạnh kề / Cạnh đối'], correct: 'Cạnh đối / Cạnh huyền' },
                { id: 't9_8', q: 'Phương trình x² - 5x + 6 = 0 có tổng hai nghiệm bằng?', a: ['-5', '5', '6', '-6'], correct: '5' },
                { id: 't9_12', q: 'Đường thẳng y = x + 2 và y = 2x + 2 cắt nhau tại điểm có tung độ là?', a: ['0', '1', '2', '-2'], correct: '2' },
                { id: 't9_13', q: 'Biệt thức Δ (delta) của phương trình ax² + bx + c = 0 là?', a: ['b² - 4ac', 'b² + 4ac', 'a² - 4bc', 'c² - 4ab'], correct: 'b² - 4ac' },
                { id: 't9_14', q: 'Hình trụ có bán kính đáy r và chiều cao h. Diện tích xung quanh là?', a: ['πr²h', '2πrh', '2πr(r+h)', 'πrh'], correct: '2πrh' },
                { id: 't9_17', q: 'Hàm số y = -3x + 5 là hàm số...?', a: ['Đồng biến', 'Nghịch biến', 'Không đổi', 'Hằng số'], correct: 'Nghịch biến' },
            ],
            'hard': [
                { id: 't9_9', q: 'Công thức tính diện tích hình quạt tròn bán kính R, cung n° là?', a: ['πR²n/180', 'πR²n/360', 'πRn/180', '2πRn/360'], correct: 'πR²n/360' },
                { id: 't9_10', q: 'Nếu hai tiếp tuyến của một đường tròn cắt nhau tại một điểm thì...?', a: ['Điểm đó cách đều hai tiếp điểm', 'Tia kẻ từ điểm đó qua tâm là tia phân giác của góc tạo bởi hai tiếp tuyến', 'Cả A và B đều đúng', 'Cả A và B đều sai'], correct: 'Cả A và B đều đúng' },
                { id: 't9_16', q: 'Đưa thừa số ra ngoài dấu căn của √28 ta được?', a: ['7√4', '4√7', '2√7', '2√14'], correct: '2√7' },
                { id: 't9_18', q: 'Tứ giác nội tiếp là tứ giác có...', a: ['4 cạnh bằng nhau', '4 góc bằng nhau', '4 đỉnh nằm trên một đường tròn', '2 đường chéo vuông góc'], correct: '4 đỉnh nằm trên một đường tròn' },
                { id: 't9_19', q: 'Hệ phương trình vô nghiệm khi nào?', a: ['d song song d\'', 'd cắt d\'', 'd trùng d\'', 'd vuông góc d\''], correct: 'd song song d\'' },
                { id: 't9_20', q: 'Cho tam giác ABC vuông tại A, có AB = 3, AC = 4. Độ dài cạnh huyền BC là?', a: ['3', '4', '5', '7'], correct: '5' },
            ]
        },
    },

    // -----------------------------------------------------------------
    // 2. TIẾNG VIỆT (Dữ liệu chi tiết từ File 1)
    // -----------------------------------------------------------------
    'tieng-viet': {
        'grade1': {
            'easy': [
                { id: 'tv1_1', q: 'Chữ "b" đọc là gì?', a: ['Bê', 'Bờ', 'Cờ', 'Bò'], correct: 'Bờ' },
                { id: 'tv1_2', q: 'Tiếng "ba" gồm những âm nào?', a: ['Âm b và âm o', 'Âm d và âm a', 'Âm b và âm a', 'Âm a và âm b'], correct: 'Âm b và âm a' },
                { id: 'tv1_3', q: 'Vần "an" có trong từ nào sau đây?', a: ['Cái bàn', 'Cái ghế', 'Con gà', 'Bông hoa'], correct: 'Cái bàn' },
                { id: 'tv1_4', q: 'Đâu là chữ hoa của chữ "c"?', a: ['c', 'C', 'K', 'k'], correct: 'C' },
                { id: 'tv1_5', q: 'Từ "con cá" có mấy tiếng?', a: ['1 tiếng', '2 tiếng', '3 tiếng', '4 tiếng'], correct: '2 tiếng' },
                { id: 'tv1_16', q: 'Vần "em" có trong từ nào?', a: ['Cái kem', 'Cái kẹo', 'Quả cam', 'Quả ổi'], correct: 'Cái kem' },
                { id: 'tv1_17', q: 'Chữ "q" thường đi với chữ nào?', a: ['p', 'o', 'a', 'u'], correct: 'u' }
            ],
            'medium': [
                { id: 'tv1_6', q: 'Điền "g" hay "gh" vào chỗ trống: "...ế gỗ"?', a: ['g', 'gh', 'c', 'k'], correct: 'gh' },
                { id: 'tv1_7', q: 'Điền "ng" hay "ngh" vào chỗ trống: "...ỉ ngơi"?', a: ['ng', 'ngh', 'g', 'k'], correct: 'ngh' },
                { id: 'tv1_8', q: 'Câu nào sau đây viết đúng?', a: ['bé đi học', 'bé đi học.', 'Bé đi học.', 'Bé đi học'], correct: 'Bé đi học.' },
                { id: 'tv1_9', q: 'Sắp xếp các từ sau thành câu: "chơi, bạn, sân, ngoài"', a: ['Bạn chơi ngoài sân.', 'Sân ngoài bạn chơi.', 'Chơi bạn ngoài sân.', 'Ngoài sân chơi bạn.'], correct: 'Bạn chơi ngoài sân.' },
                { id: 'tv1_10', q: 'Âm "nh" ghép với vần "a" ta được tiếng gì?', a: ['nha', 'na', 'gia', 'nga'], correct: 'nha' },
                { id: 'tv1_18', q: 'Từ nào dùng để chỉ đồ vật?', a: ['Cái ca', 'Con gà', 'Bà già', 'Ca hát'], correct: 'Cái ca' }
            ],
            'hard': [
                { id: 'tv1_11', q: 'Đọc câu sau: "Mẹ em đi chợ." Ai đi chợ?', a: ['Bà', 'Bố', 'Mẹ', 'Em'], correct: 'Mẹ' },
                { id: 'tv1_12', q: 'Câu nào là câu hỏi?', a: ['Nhà bạn ở đâu?', 'Nhà mình ở đây.', 'Nhà bạn đẹp quá!', 'Nhà.'], correct: 'Nhà bạn ở đâu?' },
                { id: 'tv1_13', q: 'Từ nào viết SAI chính tả?', a: ['Con ngựa', 'Cái ghế', 'Ngoan ngoãn', 'Con gấu'], correct: 'Con ngựa' },
                { id: 'tv1_14', q: 'Tìm từ có vần "ay":', a: ['Bàn tay', 'Máy bay', 'Cả hai đều đúng', 'Cả hai đều sai'], correct: 'Cả hai đều đúng' },
                { id: 'tv1_15', q: 'Dấu phẩy (,) trong câu "Mẹ mua cam, quýt." dùng để làm gì?', a: ['Kết thúc câu', 'Hỏi', 'Ngăn cách các từ', 'Ngạc nhiên'], correct: 'Ngăn cách các từ' },
                { id: 'tv1_19', q: 'Tìm từ có vần "ươn":', a: ['Con lươn', 'Vườn rau', 'Cả hai đều đúng', 'Cả hai đều sai'], correct: 'Cả hai đều đúng' }
            ]
        },
        'grade2': {
            'easy': [
                { id: 'tv2_1', q: 'Từ nào sau đây chỉ hoạt động?', a: ['Cái bàn', 'Con mèo', 'Chạy nhảy', 'Xinh đẹp'], correct: 'Chạy nhảy' },
                { id: 'tv2_2', q: 'Từ nào sau đây chỉ đặc điểm?', a: ['Quyển vở', 'Màu vàng', 'Đi học', 'Cái bút'], correct: 'Màu vàng' },
                { id: 'tv2_3', q: 'Trong câu "Bạn Lan rất chăm chỉ.", từ nào chỉ đặc điểm?', a: ['Bạn Lan', 'rất', 'chăm chỉ', 'Bạn'], correct: 'chăm chỉ' },
                { id: 'tv2_4', q: 'Câu "Con mèo đang bắt chuột." thuộc kiểu câu nào?', a: ['Ai là gì?', 'Ai làm gì?', 'Ai thế nào?', 'Câu hỏi'], correct: 'Ai làm gì?' },
                { id: 'tv2_5', q: 'Dấu câu nào dùng để kết thúc một câu kể?', a: ['Dấu chấm (.)', 'Dấu phẩy (,)', 'Dấu hỏi (?)', 'Dấu than (!)'], correct: 'Dấu chấm (.)' },
                { id: 'tv2_16', q: 'Từ nào viết đúng chính tả?', a: ['Cái chong chóng', 'Cái song chóng', 'Cái trong tróng', 'Cái song sóng'], correct: 'Cái chong chóng' },
                { id: 'tv2_17', q: 'Từ "hiền lành" là từ chỉ...?', a: ['Sự vật', 'Hoạt động', 'Đặc điểm', 'Thời gian'], correct: 'Đặc điểm' }
            ],
            'medium': [
                { id: 'tv2_6', q: 'Câu "Bông hoa hồng rất đẹp." thuộc kiểu câu nào?', a: ['Ai là gì?', 'Ai làm gì?', 'Ai thế nào?', 'Câu hỏi'], correct: 'Ai thế nào?' },
                { id: 'tv2_7', q: 'Trong câu "Mẹ em là giáo viên.", từ nào trả lời cho câu hỏi "là gì?"', a: ['Mẹ em', 'là', 'giáo viên', 'là giáo viên'], correct: 'là giáo viên' },
                { id: 'tv2_8', q: 'Từ nào viết SAI chính tả?', a: ['Nghỉ ngơi', 'Ngoan ngoãn', 'Nguệch ngoạc', 'Ngĩ ngợi'], correct: 'Ngĩ ngợi' },
                { id: 'tv2_9', q: 'Dấu phẩy trong câu "Sáng nay, em đi học." dùng để làm gì?', a: ['Ngăn cách bộ phận chỉ thời gian', 'Kết thúc câu', 'Ngạc nhiên', 'Liệt kê'], correct: 'Ngăn cách bộ phận chỉ thời gian' },
                { id: 'tv2_10', q: 'Từ nào trái nghĩa với từ "vui"?', a: ['Buồn', 'Cười', 'Hát', 'Chơi'], correct: 'Buồn' },
                { id: 'tv2_18', q: 'Bộ phận trả lời câu hỏi "Ai?" trong câu "Chú gà trống gáy vang." là gì?', a: ['Chú gà trống', 'gáy vang', 'Chú gà', 'gáy'], correct: 'Chú gà trống' }
            ],
            'hard': [
                { id: 'tv2_11', q: 'Sắp xếp các từ sau thành câu: "học, chăm, rất, bạn, Nam"', a: ['Bạn Nam chăm học rất.', 'Bạn Nam rất chăm học.', 'Chăm học bạn Nam rất.', 'Rất chăm bạn Nam học.'], correct: 'Bạn Nam rất chăm học.' },
                { id: 'tv2_12', q: 'Câu nào sau đây là câu hỏi?', a: ['Bạn thích ăn kem không?', 'Bạn thích ăn kem!', 'Mình thích ăn kem.', 'Kem ngon quá.'], correct: 'Bạn thích ăn kem không?' },
                { id: 'tv2_13', q: 'Từ nào sau đây là từ chỉ sự vật (người)?', a: ['Bác sĩ', 'Xe đạp', 'Con trâu', 'Cây bàng'], correct: 'Bác sĩ' },
                { id: 'tv2_14', q: 'Đâu là từ láy?', a: ['Xinh xắn', 'Xinh đẹp', 'Bàn ghế', 'Trường học'], correct: 'Xinh xắn' },
                { id: 'tv2_15', q: 'Đặt câu hỏi cho bộ phận in đậm: "Em tưới cây **ngoài vườn**."?', a: ['Em làm gì?', 'Em tưới cây ở đâu?', 'Ai tưới cây?', 'Em tưới cây khi nào?'], correct: 'Em tưới cây ở đâu?' },
                { id: 'tv2_19', q: 'Từ nào cùng nghĩa với từ "siêng năng"?', a: ['Lười biếng', 'Chăm chỉ', 'Thông minh', 'Nhanh nhẹn'], correct: 'Chăm chỉ' }
            ]
        },
        'grade3': {
            'easy': [
                { id: 'tv3_1', q: 'Biện pháp nghệ thuật nào được dùng trong câu "Mặt trời đỏ như hòn lửa."?', a: ['So sánh', 'Nhân hóa', 'Ẩn dụ', 'Nói quá'], correct: 'So sánh' },
                { id: 'tv3_2', q: 'Từ nào sau đây là từ chỉ hoạt động?', a: ['Niềm vui', 'Hạnh phúc', 'Suy nghĩ', 'Xinh đẹp'], correct: 'Suy nghĩ' },
                { id: 'tv3_3', q: 'Từ nào viết đúng chính tả?', a: ['Cây xao', 'Xao động', 'Xay lúa', 'Xin lỗi'], correct: 'Xin lỗi' },
                { id: 'tv3_4', q: 'Trong câu "Ông mặt trời mặc áo giáp đen ra trận." sự vật nào được nhân hóa?', a: ['Ông', 'Mặt trời', 'Áo giáp', 'Trận'], correct: 'Mặt trời' },
                { id: 'tv3_5', q: 'Câu nào sau đây dùng dấu chấm than (!) đúng?', a: ['Bạn có khỏe không!', 'Trời đẹp quá!', 'Tôi đang đi học!', 'Con mèo nhà em!'], correct: 'Trời đẹp quá!' },
                { id: 'tv3_16', q: 'Từ nào không cùng nhóm với các từ còn lại: to, nhỏ, cao, thấp, quyển sách?', a: ['to', 'nhỏ', 'cao', 'quyển sách'], correct: 'quyển sách' },
                { id: 'tv3_17', q: 'Từ "dũng cảm" là từ chỉ...?', a: ['Hoạt động', 'Đặc điểm', 'Sự vật', 'Thời gian'], correct: 'Đặc điểm' }
            ],
            'medium': [
                { id: 'tv3_6', q: 'Dấu hai chấm (:) trong câu "Mẹ bảo: Con phải chăm học." dùng để làm gì?', a: ['Báo hiệu lời nói trực tiếp', 'Kết thúc câu', 'Liệt kê', 'Giải thích'], correct: 'Báo hiệu lời nói trực tiếp' },
                { id: 'tv3_7', q: 'Đâu là từ láy?', a: ['Lung linh', 'Tươi tốt', 'Mát mẻ', 'Bàn ghế'], correct: 'Lung linh' },
                { id: 'tv3_8', q: 'Từ nào viết SAI chính tả?', a: ['Sáng sủa', 'Sửa chữa', 'Xản xuất', 'Náo nức'], correct: 'Xản xuất' },
                { id: 'tv3_9', q: 'Bộ phận trả lời câu hỏi "Như thế nào?" trong câu "Các bạn học sinh học tập rất chăm chỉ." là gì?', a: ['Các bạn học sinh', 'học tập', 'rất chăm chỉ', 'rất'], correct: 'rất chăm chỉ' },
                { id: 'tv3_10', q: 'Từ nào trái nghĩa với "đoàn kết"?', a: ['Chia rẽ', 'Giúp đỡ', 'Yêu thương', 'Đồng lòng'], correct: 'Chia rẽ' },
                { id: 'tv3_18', q: 'Trong các từ "ăn cơm, ăn ảnh, ăn năn", từ nào có "ăn" mang nghĩa gốc?', a: ['ăn cơm', 'ăn ảnh', 'ăn năn', 'Tất cả'], correct: 'ăn cơm' }
            ],
            'hard': [
                { id: 'tv3_11', q: 'Câu "Những chú chim hót líu lo trên cành." được nhân hóa bằng cách nào?', a: ['Dùng từ "chú"', 'Dùng từ "hót"', 'Cả A và B', 'Không có nhân hóa'], correct: 'Cả A và B' },
                { id: 'tv3_12', q: 'Đâu là thành ngữ?', a: ['Chị ngã em nâng', 'Trường học', 'Đi chơi', 'Rất đẹp'], correct: 'Chị ngã em nâng' },
                { id: 'tv3_13', q: 'Từ "Tổ quốc" là từ chỉ...?', a: ['Sự vật chung', 'Sự vật riêng', 'Đặc điểm', 'Hoạt động'], correct: 'Sự vật chung' },
                { id: 'tv3_14', q: 'Trong câu "Vì trời mưa, đường rất trơn.", bộ phận "Vì trời mưa" là...?', a: ['Chủ ngữ', 'Vị ngữ', 'Trạng ngữ chỉ nguyên nhân', 'Trạng ngữ chỉ nơi chốn'], correct: 'Trạng ngữ chỉ nguyên nhân' },
                { id: 'tv3_15', q: 'Từ "làng quê" thuộc nhóm từ nào?', a: ['Từ ghép tổng hợp', 'Từ ghép phân loại', 'Từ láy', 'Từ đơn'], correct: 'Từ ghép tổng hợp' },
                { id: 'tv3_19', q: 'Tìm từ có tiếng "truyền" (nghĩa là trao lại):', a: ['Truyền thống', 'Truyện tranh', 'Nói chuyện', 'Trạm truyền'], correct: 'Truyền thống' }
            ]
        },
        'grade4': {
            'easy': [
                { id: 'tv4_1', q: 'Câu "Lan là học sinh giỏi." có chủ ngữ là gì?', a: ['Lan', 'là', 'học sinh giỏi', 'là học sinh giỏi'], correct: 'Lan' },
                { id: 'tv4_2', q: 'Câu "Con mèo bắt chuột." có vị ngữ là gì?', a: ['Con mèo', 'bắt chuột', 'chuột', 'bắt'], correct: 'bắt chuột' },
                { id: 'tv4_3', q: 'Từ nào sau đây là danh từ?', a: ['Học tập', 'Giáo viên', 'Xinh đẹp', 'Chạy'], correct: 'Giáo viên' },
                { id: 'tv4_4', q: 'Từ nào sau đây là động từ?', a: ['Hòa bình', 'Quyển sách', 'Màu đỏ', 'Viết'], correct: 'Viết' },
                { id: 'tv4_5', q: 'Từ nào sau đây là tính từ?', a: ['Niềm vui', 'Nhớ thương', 'Siêng năng', 'Cái bàn'], correct: 'Siêng năng' },
                { id: 'tv4_16', q: 'Trong câu "Hôm nay, tôi đi học.", "Hôm nay" là...?', a: ['Chủ ngữ', 'Vị ngữ', 'Trạng ngữ', 'Bổ ngữ'], correct: 'Trạng ngữ' },
                { id: 'tv4_17', q: 'Từ nào viết đúng chính tả?', a: ['Chia sẻ', 'Chia xẻ', 'Xung phong', 'Sung phong'], correct: 'Chia sẻ' }
            ],
            'medium': [
                { id: 'tv4_6', q: 'Câu "Em làm bài tập." là kiểu câu gì?', a: ['Câu kể Ai làm gì?', 'Câu kể Ai thế nào?', 'Câu kể Ai là gì?', 'Câu hỏi'], correct: 'Câu kể Ai làm gì?' },
                { id: 'tv4_7', q: 'Câu "Bạn có thích đọc sách không?" là kiểu câu gì?', a: ['Câu kể', 'Câu hỏi', 'Câu cảm', 'Câu cầu khiến'], correct: 'Câu hỏi' },
                { id: 'tv4_8', q: 'Đâu là từ ghép?', a: ['Xe đạp', 'Xinh xắn', 'Long lanh', 'Chăm chỉ'], correct: 'Xe đạp' },
                { id: 'tv4_9', q: 'Đâu là từ láy?', a: ['Thật thà', 'Sách vở', 'Bút mực', 'Núi non'], correct: 'Thật thà' },
                { id: 'tv4_10', q: 'Trong các từ "đồng lúa, đồng tiền, đồng đội", từ "đồng" nào là từ đồng âm?', a: ['đồng lúa và đồng tiền', 'đồng lúa và đồng đội', 'đồng tiền và đồng đội', 'Cả ba'], correct: 'đồng lúa và đồng tiền' },
                { id: 'tv4_18', q: 'Từ "dũng cảm" đồng nghĩa với từ nào?', a: ['Can đảm', 'Nhút nhát', 'Hiền lành', 'Độc ác'], correct: 'Can đảm' }
            ],
            'hard': [
                { id: 'tv4_11', q: 'Câu "Xin bạn hãy giữ trật tự!" là kiểu câu gì?', a: ['Câu kể', 'Câu hỏi', 'Câu cảm', 'Câu cầu khiến'], correct: 'Câu cầu khiến' },
                { id: 'tv4_12', q: 'Vị ngữ trong câu "Những bông hoa huệ trắng muốt, tinh khiết." là gì?', a: ['Những bông hoa huệ', 'trắng muốt, tinh khiết', 'trắng muốt', 'tinh khiết'], correct: 'trắng muốt, tinh khiết' },
                { id: 'tv4_13', q: 'Đâu là câu có chủ ngữ, vị ngữ được nối bằng quan hệ từ?', a: ['Mẹ em rất đẹp.', 'Mẹ em là giáo viên.', 'Nếu trời mưa thì em nghỉ học.', 'Em học bài.'], correct: 'Nếu trời mưa thì em nghỉ học.' },
                { id: 'tv4_14', q: 'Trạng ngữ "Bằng giọng nói dịu dàng," trong câu bổ sung ý nghĩa gì?', a: ['Nơi chốn', 'Nguyên nhân', 'Phương tiện', 'Thời gian'], correct: 'Phương tiện' },
                { id: 'tv4_15', q: 'Đâu là thành ngữ, tục ngữ nói về lòng dũng cảm?', a: ['Gan vàng dạ sắt', 'Nước chảy đá mòn', 'Một nắng hai sương', 'Uống nước nhớ nguồn'], correct: 'Gan vàng dạ sắt' },
                { id: 'tv4_19', q: 'Từ "mùa xuân" trong câu "Mùa xuân là Tết trồng cây." và "Cô ấy đã 60 mùa xuân." có quan hệ gì?', a: ['Đồng nghĩa', 'Trái nghĩa', 'Đồng âm', 'Nhiều nghĩa'], correct: 'Nhiều nghĩa' }
            ]
        },
        'grade5': {
            'easy': [
                { id: 'tv5_1', q: 'Từ nào đồng nghĩa với từ "Hòa bình"?', a: ['Chiến tranh', 'Bình yên', 'Hỗn loạn', 'Đánh nhau'], correct: 'Bình yên' },
                { id: 'tv5_2', q: 'Từ nào trái nghĩa với từ "Bảo vệ"?', a: ['Giữ gìn', 'Phá hoại', 'Xây dựng', 'Che chở'], correct: 'Phá hoại' },
                { id: 'tv5_3', q: 'Từ nào sau đây là từ nhiều nghĩa?', a: ['Ăn', 'Bút', 'Thước', 'Xe đạp'], correct: 'Ăn' },
                { id: 'tv5_4', q: 'Đâu là từ đồng âm?', a: ['Đá (hòn đá) - Đá (đá bóng)', 'Xuân (mùa xuân) - Xuân (tuổi xuân)', 'Chín (quả chín) - Chín (suy nghĩ chín chắn)', 'Bay (chim bay) - Bay (bay màu)'], correct: 'Đá (hòn đá) - Đá (đá bóng)' },
                { id: 'tv5_5', q: 'Trong câu "Mẹ em là giáo viên." quan hệ từ là gì?', a: ['Mẹ', 'em', 'là', 'giáo viên'], correct: 'là' },
                { id: 'tv5_16', q: 'Đại từ là từ dùng để...', a: ['Chỉ sự vật', 'Chỉ hoạt động', 'Chỉ đặc điểm', 'Xưng hô hoặc thay thế danh từ, động từ'], correct: 'Xưng hô hoặc thay thế danh từ, động từ' },
                { id: 'tv5_17', q: 'Từ nào là đại từ xưng hô?', a: ['Tôi', 'Cái bàn', 'Xinh đẹp', 'Chạy'], correct: 'Tôi' }
            ],
            'medium': [
                { id: 'tv5_6', q: 'Câu "Tuy nhà xa nhưng bạn Nam vẫn đi học đúng giờ." là câu gì?', a: ['Câu đơn', 'Câu ghép', 'Câu rút gọn', 'Câu đặc biệt'], correct: 'Câu ghép' },
                { id: 'tv5_7', q: 'Vế câu "Bạn Nam vẫn đi học đúng giờ." trong câu trên được nối với vế trước bằng cặp quan hệ từ nào?', a: ['Tuy ... nhưng ...', 'Vì ... nên ...', 'Nếu ... thì ...', 'Không có'], correct: 'Tuy ... nhưng ...' },
                { id: 'tv5_8', q: 'Từ "bác sĩ" là...', a: ['Danh từ chung', 'Danh từ riêng', 'Động từ', 'Tính từ'], correct: 'Danh từ chung' },
                { id: 'tv5_9', q: 'Từ "Hồ Chí Minh" là...', a: ['Danh từ chung', 'Danh từ riêng', 'Động từ', 'Tính từ'], correct: 'Danh từ riêng' },
                { id: 'tv5_10', q: 'Từ "công dân" có nghĩa là gì?', a: ['Người làm việc nhà nước', 'Người dân của một nước, có quyền và nghĩa vụ', 'Người ở thành phố', 'Người đi làm'], correct: 'Người dân của một nước, có quyền và nghĩa vụ' },
                { id: 'tv5_18', q: 'Câu "Trời mưa." là câu gì?', a: ['Câu đơn (đủ C-V)', 'Câu rút gọn', 'Câu đặc biệt', 'Câu ghép'], correct: 'Câu đơn (đủ C-V)' }
            ],
            'hard': [
                { id: 'tv5_11', q: 'Câu "Ngoài đường, xe cộ đi lại nườm nượp." có mấy vế câu?', a: ['Một vế (Câu đơn)', 'Hai vế (Câu ghép)', 'Ba vế (Câu ghép)', 'Không có vế nào'], correct: 'Một vế (Câu đơn)' },
                { id: 'tv5_12', q: 'Dấu phẩy trong câu "Trời nắng, chang chang." có tác dụng gì?', a: ['Ngăn cách trạng ngữ', 'Ngăn cách chủ ngữ và vị ngữ', 'Ngăn cách các vế câu', 'Ngăn cách các từ cùng loại'], correct: 'Ngăn cách các từ cùng loại' },
                { id: 'tv5_13', q: 'Trong câu "Bạn Nam học giỏi, còn bạn Hoa thì lười biếng.", hai vế câu được nối bằng cách nào?', a: ['Nối trực tiếp (dùng dấu phẩy)', 'Nối bằng 1 quan hệ từ ("còn")', 'Nối bằng cặp quan hệ từ', 'Cả A và B đều đúng'], correct: 'Cả A và B đều đúng' },
                { id: 'tv5_14', q: 'Từ "mũi" trong "mũi dao" và "mũi thuyền" có quan hệ gì?', a: ['Đồng âm', 'Nhiều nghĩa', 'Đồng nghĩa', 'Trái nghĩa'], correct: 'Nhiều nghĩa' },
                { id: 'tv5_15', q: 'Câu "Ôi, bạn giỏi quá!" dùng để làm gì?', a: ['Kể', 'Hỏi', 'Bộc lộ cảm xúc', 'Yêu cầu'], correct: 'Bộc lộ cảm xúc' },
                { id: 'tv5_19', q: 'Từ nào thay thế được cho từ "bạn" trong câu "Nam là bạn thân của tôi. Nó rất tốt bụng."?', a: ['Nó', 'Tôi', 'Nam', 'Tốt bụng'], correct: 'Nó' }
            ]
        },
        'grade9': {
            'easy': [
                { id: 'tv9_1', q: 'Nhân vật chính trong "Truyện Kiều" của Nguyễn Du là ai?', a: ['Thúy Vân', 'Đạm Tiên', 'Thúy Kiều', 'Hoạn Thư'], correct: 'Thúy Kiều' },
                { id: 'tv9_2', q: 'Phương châm hội thoại "về chất" yêu cầu người nói phải...', a: ['Nói ngắn gọn', 'Nói có liên quan đến chủ đề', 'Nói có bằng chứng xác thực', 'Nói lịch sự'], correct: 'Nói có bằng chứng xác thực' },
                { id: 'tv9_4', q: 'Khởi ngữ là thành phần câu đứng trước chủ ngữ để làm gì?', a: ['Nêu lên chủ đề của câu', 'Chỉ thời gian', 'Chỉ nơi chốn', 'Gọi đáp'], correct: 'Nêu lên chủ đề của câu' },
                { id: 'tv9_5', q: 'Tác phẩm "Lặng lẽ Sa Pa" của Nguyễn Thành Long ca ngợi ai?', a: ['Những người lính', 'Những người lao động thầm lặng cống hiến cho đất nước', 'Các bác sĩ', 'Các thầy cô giáo'], correct: 'Những người lao động thầm lặng cống hiến cho đất nước' },
                { id: 'tv9_12', q: 'Nhân vật ông Hai trong truyện ngắn "Làng" của Kim Lân có đặc điểm nổi bật nào?', a: ['Yêu làng và yêu nước tha thiết', 'Ích kỷ, hẹp hòi', 'Ham tiền', 'Nhu nhược'], correct: 'Yêu làng và yêu nước tha thiết' },
                { id: 'tv9_15', q: 'Trong các tác phẩm sau, tác phẩm nào không thuộc văn học trung đại?', a: ['Truyện Kiều', 'Bình Ngô đại cáo', 'Lão Hạc', 'Hịch tướng sĩ'], correct: 'Lão Hạc' },
                { id: 'tv9_20', q: 'Tác giả của tác phẩm "Hoàng Lê nhất thống chí" là ai?', a: ['Ngô gia văn phái', 'Nguyễn Du', 'Hồ Xuân Hương', 'Nguyễn Trãi'], correct: 'Ngô gia văn phái' },
            ],
            'medium': [
                { id: 'tv9_6', q: 'Các thành phần biệt lập trong câu là...', a: ['Chủ ngữ, vị ngữ', 'Trạng ngữ, bổ ngữ', 'Tình thái, cảm thán, gọi-đáp, phụ chú', 'Không có trong câu'], correct: 'Tình thái, cảm thán, gọi-đáp, phụ chú' },
                { id: 'tv9_7', q: 'Phép lặp và phép thế trong liên kết câu có tác dụng gì?', a: ['Tránh lặp lại từ ngữ, tạo sự liên kết chặt chẽ', 'Làm câu văn dài hơn', 'Làm câu văn khó hiểu hơn', 'Chỉ dùng để trang trí'], correct: 'Tránh lặp lại từ ngữ, tạo sự liên kết chặt chẽ' },
                { id: 'tv9_8', q: 'Nhân vật anh thanh niên trong "Lặng lẽ Sa Pa" làm công việc gì?', a: ['Lái xe', 'Kĩ sư nông nghiệp', 'Làm công tác khí tượng thủy văn', 'Vẽ tranh'], correct: 'Làm công tác khí tượng thủy văn' },
                { id: 'tv9_10', q: 'Bài thơ "Viếng lăng Bác" của Viễn Phương thể hiện tình cảm gì?', a: ['Sự thành kính và niềm xúc động sâu sắc của nhà thơ đối với Bác Hồ', 'Sự vui mừng', 'Sự tò mò', 'Sự đau khổ'], correct: 'Sự thành kính và niềm xúc động sâu sắc của nhà thơ đối với Bác Hồ' },
                { id: 'tv9_11', q: 'Lời dẫn trực tiếp và lời dẫn gián tiếp khác nhau ở điểm nào?', a: ['Dấu câu', 'Ngôi xưng', 'Cả hai đều đúng', 'Không khác nhau'], correct: 'Cả hai đều đúng' },
                { id: 'tv9_13', q: 'Thành phần phụ chú trong câu được ngăn cách với thành phần chính bằng dấu gì?', a: ['Dấu phẩy', 'Dấu gạch ngang, dấu ngoặc đơn', 'Dấu chấm', 'Dấu chấm hỏi'], correct: 'Dấu gạch ngang, dấu ngoặc đơn' },
                { id: 'tv9_17', q: 'Nghị luận về một sự việc, hiện tượng đời sống là bàn về...', a: ['Một vấn đề có thật trong đời sống', 'Một vấn đề tưởng tượng', 'Một tác phẩm văn học', 'Một nhân vật lịch sử'], correct: 'Một vấn đề có thật trong đời sống' },
            ],
            'hard': [
                { id: 'tv9_3', q: 'Trong bài thơ "Đồng chí", hình ảnh "đầu súng trăng treo" gợi lên điều gì?', a: ['Hiện thực khốc liệt và chất thơ lãng mạn', 'Sự nguy hiểm của chiến tranh', 'Vẻ đẹp của đêm trăng', 'Sự cô đơn của người lính'], correct: 'Hiện thực khốc liệt và chất thơ lãng mạn' },
                { id: 'tv9_9', q: 'Nghĩa tường minh và hàm ý là gì?', a: ['Nghĩa tường minh là phần thông báo được diễn đạt trực tiếp, hàm ý là phần không được diễn đạt trực tiếp', 'Hai khái niệm giống nhau', 'Hàm ý được nói ra trực tiếp', 'Nghĩa tường minh là nghĩa ẩn'], correct: 'Nghĩa tường minh là phần thông báo được diễn đạt trực tiếp, hàm ý là phần không được diễn đạt trực tiếp' },
                { id: 'tv9_14', q: 'Vẻ đẹp của nhân vật Phương Định trong "Những ngôi sao xa xôi" là gì?', a: ['Vẻ đẹp trong sáng, hồn nhiên và dũng cảm', 'Vẻ đẹp kiêu sa, lộng lẫy', 'Vẻ đẹp giản dị, mộc mạc', 'Vẻ đẹp buồn bã'], correct: 'Vẻ đẹp trong sáng, hồn nhiên và dũng cảm' },
                { id: 'tv9_16', q: 'Biện pháp nghệ thuật chính được sử dụng trong bài thơ "Ánh trăng" của Nguyễn Duy là gì?', a: ['Ẩn dụ, nhân hóa', 'So sánh, nói quá', 'Tương phản, đối lập', 'Liệt kê, điệp ngữ'], correct: 'Ẩn dụ, nhân hóa' },
                { id: 'tv9_18', q: 'Trong đoạn trích "Chị em Thúy Kiều", Nguyễn Du đã sử dụng bút pháp nghệ thuật nào là chủ yếu?', a: ['Tả thực', 'Ước lệ tượng trưng', 'Tự sự', 'Biểu cảm'], correct: 'Ước lệ tượng trưng' },
                { id: 'tv9_19', q: 'Hàm ý của câu "Trời sắp mưa rồi đấy!" trong một cuộc nói chuyện có thể là gì?', a: ['Thông báo thời tiết', 'Đề nghị nhanh chóng kết thúc câu chuyện', 'Khoe kiến thức', 'Tất cả đều có thể đúng tùy ngữ cảnh'], correct: 'Tất cả đều có thể đúng tùy ngữ cảnh' },
            ]
        },
    },

    // -----------------------------------------------------------------
    // 3. TIẾNG ANH (Dữ liệu mới từ File 2)
    // -----------------------------------------------------------------
    'tieng-anh': {
        'grade1': {
            'easy': [
                { id: 'en1_1', q: 'Hello nghĩa là gì?', a: ['Xin chào', 'Tạm biệt', 'Cảm ơn', 'Xin lỗi'], correct: 'Xin chào' },
                { id: 'en1_2', q: 'Cat là con gì?', a: ['Mèo', 'Chó', 'Gà', 'Lợn'], correct: 'Mèo' }
            ]
        }
    },

    // -----------------------------------------------------------------
    // 4. KHOA HỌC (Dữ liệu mới từ File 2)
    // -----------------------------------------------------------------
    'khoa-hoc': {
        'grade4': {
            'medium': [
                { id: 'kh4_1', q: 'Ba thể của nước là gì?', a: ['Rắn, Lỏng, Khí', 'Mưa, Đá, Tuyết', 'Cứng, Mềm, Hơi', 'Nóng, Lạnh, Ấm'], correct: 'Rắn, Lỏng, Khí' }
            ]
        }
    },

    // -----------------------------------------------------------------
    // 5. LỊCH SỬ (Dữ liệu mới từ File 2)
    // -----------------------------------------------------------------
    'lich-su': {
        'grade4': {
            'hard': [
                { id: 'ls4_1', q: 'Chiến thắng Bạch Đằng năm 938 do ai lãnh đạo?', a: ['Ngô Quyền', 'Trần Hưng Đạo', 'Lê Lợi', 'Quang Trung'], correct: 'Ngô Quyền' }
            ]
        }
    },

    // -----------------------------------------------------------------
    // 6. ĐỊA LÝ (Dữ liệu mới từ File 2)
    // -----------------------------------------------------------------
    'dia-ly': {
        'grade5': {
            'medium': [
                { id: 'dl5_1', q: 'Thủ đô của Việt Nam là gì?', a: ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Huế'], correct: 'Hà Nội' }
            ]
        }
    }
};

// =================================================================
// --- PHẦN 2: DỮ LIỆU GAME TOÁN ĐỐI KHÁNG (maths) ---
// Dùng cho game Socket.io, ưu tiên sử dụng dữ liệu phong phú từ File 1
// =================================================================
const maths = {
    'grade1': [
        { q: '2 + 7 = ?', a: ['8', '9', '10', '7'], correct: '9' },
        { q: '10 - 6 = ?', a: ['3', '4', '5', '6'], correct: '4' },
        { q: '3 + 5 = ?', a: ['7', '8', '9', '6'], correct: '8' },
        { q: '9 - 1 = ?', a: ['8', '7', '10', '9'], correct: '8' },
        { q: '4 + 4 = ?', a: ['6', '7', '8', '9'], correct: '8' },
        { q: '5 + 5 = ?', a: ['10', '9', '11', '12'], correct: '10' },
        { q: '7 - 3 = ?', a: ['2', '3', '4', '5'], correct: '4' },
        { q: '6 + 2 = ?', a: ['7', '8', '9', '10'], correct: '8' },
        { q: '8 - 0 = ?', a: ['0', '8', '7', '9'], correct: '8' },
        { q: '1 + 9 = ?', a: ['9', '10', '11', '8'], correct: '10' },
        { q: 'Số liền trước của 10 là?', a: ['8', '9', '10', '11'], correct: '9' },
        { q: 'Số liền sau của 15 là?', a: ['14', '15', '16', '17'], correct: '16' },
        { q: '3 + ... = 5', a: ['1', '2', '3', '4'], correct: '2' },
        { q: '... - 2 = 7', a: ['7', '8', '9', '10'], correct: '9' },
        { q: 'Số bé nhất có hai chữ số là?', a: ['1', '9', '10', '11'], correct: '10' },
        { q: '14 + 1 = ?', a: ['13', '14', '15', '16'], correct: '15' },
        { q: '19 - 5 = ?', a: ['13', '14', '15', '16'], correct: '14' },
        { q: '10 + 7 = ?', a: ['17', '10', '7', '16'], correct: '17' },
        { q: '18 - 8 = ?', a: ['0', '8', '10', '18'], correct: '10' },
        { q: '5 + 4 - 3 = ?', a: ['5', '6', '7', '8'], correct: '6' }
    ],
    'grade2': [
        { q: '25 + 18 = ?', a: ['33', '43', '45', '53'], correct: '43' },
        { q: '50 - 22 = ?', a: ['28', '38', '32', '22'], correct: '28' },
        { q: '7 x 5 = ?', a: ['30', '35', '40', '45'], correct: '35' },
        { q: '40 : 4 = ?', a: ['8', '9', '10', '11'], correct: '10' },
        { q: '19 + 31 = ?', a: ['40', '50', '60', '49'], correct: '50' },
        { q: '6 x 3 = ?', a: ['18', '19', '20', '16'], correct: '18' },
        { q: '18 : 2 = ?', a: ['7', '8', '9', '10'], correct: '9' },
        { q: '72 - 15 = ?', a: ['57', '67', '47', '53'], correct: '57' },
        { q: '33 + 47 = ?', a: ['70', '80', '90', '77'], correct: '80' },
        { q: '5 x 8 = ?', a: ['40', '45', '50', '35'], correct: '40' },
        { q: '27 : 3 = ?', a: ['7', '8', '9', '6'], correct: '9' },
        { q: '100 - 30 = ?', a: ['60', '70', '80', '90'], correct: '70' },
        { q: '45 + 5 = ?', a: ['40', '50', '55', '60'], correct: '50' },
        { q: '9 x 2 = ?', a: ['16', '18', '20', '22'], correct: '18' },
        { q: '50 : 5 = ?', a: ['5', '10', '15', '20'], correct: '10' },
        { q: '17 + 8 = ?', a: ['23', '24', '25', '26'], correct: '25' },
        { q: '30 - 11 = ?', a: ['19', '20', '21', '29'], correct: '19' },
        { q: '4 x 7 = ?', a: ['24', '26', '28', '30'], correct: '28' },
        { q: '36 : 6 = ?', a: ['4', '5', '6', '7'], correct: '6' },
        { q: '53 + 27 = ?', a: ['70', '80', '90', '73'], correct: '80' }
    ],
    'grade3': [
        { q: '12 x 5 = ?', a: ['50', '55', '60', '65'], correct: '60' },
        { q: '99 : 9 = ?', a: ['9', '10', '11', '12'], correct: '11' },
        { q: '120 + 35 = ?', a: ['155', '165', '145', '150'], correct: '155' },
        { q: '8 x 7 = ?', a: ['49', '54', '56', '63'], correct: '56' },
        { q: '150 - 45 = ?', a: ['100', '115', '110', '105'], correct: '105' },
        { q: '7 x 7 = ?', a: ['42', '49', '56', '35'], correct: '49' },
        { q: '64 : 8 = ?', a: ['6', '7', '8', '9'], correct: '8' },
        { q: '300 + 150 = ?', a: ['400', '450', '500', '350'], correct: '450' },
        { q: '500 - 1 = ?', a: ['400', '490', '499', '498'], correct: '499' },
        { q: '9 x 6 = ?', a: ['45', '54', '63', '72'], correct: '54' },
        { q: '48 : 6 = ?', a: ['6', '7', '8', '9'], correct: '8' },
        { q: '11 x 10 = ?', a: ['11', '100', '110', '111'], correct: '110' },
        { q: '105 + 95 = ?', a: ['190', '195', '200', '205'], correct: '200' },
        { q: '200 - 50 = ?', a: ['100', '120', '150', '180'], correct: '150' },
        { q: '6 x 9 = ?', a: ['54', '45', '63', '72'], correct: '54' },
        { q: '81 : 9 = ?', a: ['7', '8', '9', '10'], correct: '9' },
        { q: '50 x 3 = ?', a: ['15', '53', '150', '1500'], correct: '150' },
        { q: '125 + 125 = ?', a: ['200', '225', '250', '300'], correct: '250' },
        { q: '1000 - 100 = ?', a: ['800', '900', '990', '999'], correct: '900' },
        { q: '7 x 8 = ?', a: ['56', '64', '49', '72'], correct: '56' }
    ],
    'grade4': [
        { q: '250 + 175 = ?', a: ['325', '400', '425', '450'], correct: '425' },
        { q: '500 - 190 = ?', a: ['310', '300', '210', '410'], correct: '310' },
        { q: '15 x 10 = ?', a: ['15', '150', '1500', '1.5'], correct: '150' },
        { q: '200 : 5 = ?', a: ['20', '30', '40', '50'], correct: '40' },
        { q: '123 + 45 = ?', a: ['168', '178', '573', '158'], correct: '168' },
        { q: '12 x 12 = ?', a: ['124', '134', '144', '154'], correct: '144' },
        { q: '1000 : 10 = ?', a: ['1', '10', '100', '1000'], correct: '100' },
        { q: '50 x 50 = ?', a: ['250', '2500', '500', '5000'], correct: '2500' },
        { q: '999 + 1 = ?', a: ['998', '100', '1000', '10000'], correct: '1000' },
        { q: '25 x 4 = ?', a: ['100', '1000', '75', '125'], correct: '100' },
        { q: '160 : 4 = ?', a: ['4', '40', '44', '164'], correct: '40' },
        { q: '130 + 70 = ?', a: ['200', '190', '210', '100'], correct: '200' },
        { q: '600 - 150 = ?', a: ['450', '550', '500', '400'], correct: '450' },
        { q: '20 x 30 = ?', a: ['60', '600', '6000', '50'], correct: '600' },
        { q: '450 : 9 = ?', a: ['5', '50', '60', '90'], correct: '50' },
        { q: '505 + 105 = ?', a: ['600', '605', '610', '700'], correct: '610' },
        { q: '720 - 700 = ?', a: ['2', '10', '20', '70'], correct: '20' },
        { q: '15 x 6 = ?', a: ['80', '90', '100', '75'], correct: '90' },
        { q: '121 : 11 = ?', a: ['10', '11', '12', '121'], correct: '11' },
        { q: '3000 + 500 = ?', a: ['3005', '3050', '3500', '8000'], correct: '3500' }
    ],
    'grade5': [
        { q: '12 x 15 = ?', a: ['160', '180', '200', '150'], correct: '180' },
        { q: '5.5 + 2.7 = ?', a: ['7.2', '8.2', '8.5', '7.5'], correct: '8.2' },
        { q: '100 : 4 = ?', a: ['20', '25', '30', '40'], correct: '25' },
        { q: '30 x 7 = ?', a: ['210', '21', '2100', '240'], correct: '210' },
        { q: '50 x 5 = ?', a: ['2500', '250', '25', '500'], correct: '250' },
        { q: '0.5 x 10 = ?', a: ['5', '50', '0.05', '500'], correct: '5' },
        { q: '10 : 2.5 = ?', a: ['2', '3', '4', '5'], correct: '4' },
        { q: '1 - 0.1 = ?', a: ['0.9', '0.09', '9', '1.1'], correct: '0.9' },
        { q: '0.2 + 0.8 = ?', a: ['0.10', '1.0', '10', '0.016'], correct: '1.0' },
        { q: '20 x 20 = ?', a: ['40', '400', '4000', '200'], correct: '400' },
        { q: '1/2 + 1/2 = ?', a: ['1/4', '2/4', '1', '2'], correct: '1' },
        { q: '100 x 0.1 = ?', a: ['1', '10', '100', '1000'], correct: '10' },
        { q: '5.0 - 1.5 = ?', a: ['4.5', '4.0', '3.5', '3.0'], correct: '3.5' },
        { q: '100 : 5 = ?', a: ['10', '15', '20', '25'], correct: '20' },
        { q: '0.25 x 4 = ?', a: ['1', '10', '100', '1000'], correct: '1' },
        { q: '6.3 + 3.7 = ?', a: ['9.0', '10.0', '9.7', '10.3'], correct: '10.0' },
        { q: '50% của 200 là?', a: ['50', '100', '150', '200'], correct: '100' },
        { q: '10 x 10 x 10 = ?', a: ['30', '100', '1000', '10000'], correct: '1000' },
        { q: '9.9 - 0.9 = ?', a: ['9.0', '8.0', '9.8', '8.9'], correct: '9.0' },
        { q: '2.5 x 2 = ?', a: ['4.0', '4.5', '5.0', '5.5'], correct: '5.0' }
    ],
};

// Xuất module cho Server (NodeJS) và Client (Browser)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tests, maths };
} else {
    window.questionData = { tests, maths };
}