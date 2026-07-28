'use strict';

// Nội dung trong tệp này là nội dung nguyên bản, được tổ chức theo năng lực/yêu cầu cần đạt
// của Chương trình GDPT 2018 đang áp dụng. Không sao chép nguyên văn sách giáo khoa.
const PROGRAM_VERSION = 'CTGDPT-2018-2026';
const PASS_SCORE = 8;

const SUBJECTS = {
  toan: ['Toán', '🔢'],
  tieng_viet: ['Tiếng Việt', '📖'],
  ngu_van: ['Ngữ văn', '✍️'],
  tieng_anh: ['Tiếng Anh', '🎧'],
  dao_duc: ['Đạo đức', '🤝'],
  gdcd: ['Giáo dục công dân', '⚖️'],
  gdktepl: ['Giáo dục kinh tế và pháp luật', '🏛️'],
  tnxh: ['Tự nhiên và Xã hội', '🌱'],
  khoa_hoc: ['Khoa học', '🔬'],
  khtn: ['Khoa học tự nhiên', '🧪'],
  vat_ly: ['Vật lí', '⚡'],
  hoa_hoc: ['Hóa học', '⚗️'],
  sinh_hoc: ['Sinh học', '🧬'],
  lich_su_dia_li: ['Lịch sử và Địa lí', '🌏'],
  lich_su: ['Lịch sử', '🏺'],
  dia_li: ['Địa lí', '🗺️'],
  tin_hoc: ['Tin học', '💻'],
  cong_nghe: ['Công nghệ', '🛠️'],
  nghe_thuat: ['Nghệ thuật', '🎨'],
  am_nhac: ['Âm nhạc', '🎵'],
  mi_thuat: ['Mĩ thuật', '🖼️'],
  gdtc: ['Giáo dục thể chất', '🏃'],
  hdtn: ['Hoạt động trải nghiệm', '🌟'],
  hdtnhn: ['Hoạt động trải nghiệm, hướng nghiệp', '🧭'],
  gdqp: ['Giáo dục quốc phòng và an ninh', '🛡️'],
  dia_phuong: ['Nội dung giáo dục địa phương', '🏡']
};

function subjectIdsForGrade(grade) {
  if (grade <= 2) return ['toan','tieng_viet','tieng_anh','dao_duc','tnxh','nghe_thuat','gdtc','hdtn'];
  if (grade <= 5) return ['toan','tieng_viet','tieng_anh','dao_duc','khoa_hoc','lich_su_dia_li','tin_hoc','cong_nghe','nghe_thuat','gdtc','hdtn'];
  if (grade <= 9) return ['toan','ngu_van','tieng_anh','gdcd','khtn','lich_su_dia_li','tin_hoc','cong_nghe','nghe_thuat','gdtc','hdtnhn','dia_phuong'];
  return ['toan','ngu_van','tieng_anh','lich_su','gdtc','gdqp','hdtnhn','dia_phuong','dia_li','gdktepl','vat_ly','hoa_hoc','sinh_hoc','tin_hoc','cong_nghe','am_nhac','mi_thuat'];
}

const TOPICS = {
  toan: ['Số và phép tính','Hình học trực quan','Đo lường','Dữ liệu và xác suất','Biểu thức và quy tắc','Giải quyết vấn đề'],
  tieng_viet: ['Đọc hiểu','Từ và câu','Chính tả','Kể chuyện','Viết đoạn','Giao tiếp'],
  ngu_van: ['Đọc hiểu văn bản','Tiếng Việt','Viết','Nói và nghe','Nghị luận','Văn học Việt Nam'],
  tieng_anh: ['Greetings and introductions','School and friends','Family and home','Daily routines','Hobbies and health','Community and environment'],
  dao_duc: ['Tự chăm sóc','Yêu thương gia đình','Hợp tác với bạn bè','Trung thực','Trách nhiệm','Bảo vệ môi trường'],
  gdcd: ['Tự chủ','Tôn trọng','Quyền và nghĩa vụ','Pháp luật trong đời sống','Trách nhiệm cộng đồng','Ứng xử số'],
  gdktepl: ['Hoạt động kinh tế','Ngân sách cá nhân','Thị trường','Quyền công dân','Pháp luật','Khởi nghiệp có trách nhiệm'],
  tnxh: ['Gia đình','Trường học','Cộng đồng','Thực vật và động vật','Con người và sức khỏe','Trái Đất và bầu trời'],
  khoa_hoc: ['Chất và năng lượng','Thực vật và động vật','Con người và sức khỏe','Sinh vật và môi trường','Trái Đất','Thực hành khoa học'],
  khtn: ['Mở đầu khoa học tự nhiên','Chất và sự biến đổi','Vật sống','Năng lượng','Trái Đất và bầu trời','Thực hành an toàn'],
  vat_ly: ['Chuyển động','Lực','Năng lượng','Điện','Sóng','Vật lí nhiệt'],
  hoa_hoc: ['Cấu tạo chất','Bảng tuần hoàn','Liên kết hóa học','Phản ứng hóa học','Hóa học hữu cơ','Hóa học và đời sống'],
  sinh_hoc: ['Tế bào','Trao đổi chất','Di truyền','Tiến hóa','Sinh thái','Sinh học cơ thể'],
  lich_su_dia_li: ['Thời gian lịch sử','Cộng đồng cổ đại','Đất nước và con người Việt Nam','Bản đồ','Tự nhiên Việt Nam','Kinh tế và xã hội'],
  lich_su: ['Lịch sử thế giới','Lịch sử Việt Nam','Cách mạng và đổi mới','Quan hệ quốc tế','Di sản','Phương pháp sử học'],
  dia_li: ['Bản đồ và GIS','Địa lí tự nhiên','Dân cư','Các ngành kinh tế','Địa lí Việt Nam','Phát triển bền vững'],
  tin_hoc: ['Thông tin và dữ liệu','Mạng máy tính','Đạo đức số','Ứng dụng tin học','Thuật toán','Lập trình'],
  cong_nghe: ['Công nghệ trong đời sống','Thiết kế kĩ thuật','Nông nghiệp','Công nghiệp','An toàn lao động','Hướng nghiệp'],
  nghe_thuat: ['Nhịp điệu','Màu sắc','Hình khối','Biểu diễn','Sáng tạo','Cảm thụ nghệ thuật'],
  am_nhac: ['Hát','Nhạc cụ','Đọc nhạc','Thường thức âm nhạc','Sáng tạo âm nhạc','Biểu diễn'],
  mi_thuat: ['Yếu tố tạo hình','Thiết kế','Hội họa','Điêu khắc','Mĩ thuật ứng dụng','Di sản mĩ thuật'],
  gdtc: ['Đội hình đội ngũ','Vận động cơ bản','Thể thao tự chọn','Sức bền','An toàn vận động','Lối sống khỏe'],
  hdtn: ['Tự phục vụ','Quan hệ bạn bè','Gia đình','Nhà trường','Cộng đồng','Khám phá bản thân'],
  hdtnhn: ['Khám phá bản thân','Rèn luyện bản thân','Gia đình','Nhà trường','Cộng đồng','Hướng nghiệp'],
  gdqp: ['Quốc phòng toàn dân','An ninh quốc gia','Điều lệnh','Kĩ thuật chiến đấu','Phòng thủ dân sự','Trách nhiệm học sinh'],
  dia_phuong: ['Văn hóa địa phương','Lịch sử địa phương','Địa lí địa phương','Kinh tế địa phương','Môi trường','Cộng đồng']
};

function hash(input) {
  let h = 2166136261;
  for (const ch of String(input)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function pick(arr, seed) { return arr[seed % arr.length]; }
function shuffledQuestion(prompt, correct, distractors, seed, skill, explanation) {
  const options = [correct, ...distractors.filter(item => item !== correct)].slice(0, 4);
  while (options.length < 4) options.push(`Phương án ${options.length + 1}`);
  for (let i = options.length - 1; i > 0; i--) {
    const j = (seed + i * 17) % (i + 1);
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { prompt, options, answer: options.indexOf(correct), skill, explanation };
}

function numberChoices(answer) {
  const a = Number(answer);
  return [String(a + 1), String(Math.max(0, a - 1)), String(a + 2)];
}

function buildMathQuestion(grade, topic, seed, qIndex) {
  const cap = grade <= 2 ? 20 : grade <= 5 ? 100 : grade <= 9 ? 300 : 800;
  const a = 2 + seed % Math.max(4, Math.floor(cap / 3));
  const b = 1 + (seed >>> 3) % Math.max(3, Math.floor(cap / 5));
  const templates = [
    () => { const ans = a + b; return shuffledQuestion(`${a} + ${b} bằng bao nhiêu?`, String(ans), numberChoices(ans), seed, 'tính toán', `Cộng ${a} với ${b} được ${ans}.`); },
    () => { const hi = Math.max(a,b), lo = Math.min(a,b), ans = hi-lo; return shuffledQuestion(`${hi} - ${lo} bằng bao nhiêu?`, String(ans), numberChoices(ans), seed, 'tính toán', `Lấy ${hi} trừ ${lo} được ${ans}.`); },
    () => { const x=2+seed%8, y=2+(seed>>>4)%7, ans=x*y; return shuffledQuestion(`Một nhóm có ${x} hàng, mỗi hàng ${y} vật. Có tất cả bao nhiêu vật?`, String(ans), numberChoices(ans), seed, 'vận dụng', `${x} × ${y} = ${ans}.`); },
    () => { const w=3+seed%9,h=2+(seed>>>5)%8,ans=2*(w+h); return shuffledQuestion(`Hình chữ nhật dài ${w} cm, rộng ${h} cm. Chu vi là bao nhiêu?`, `${ans} cm`, [`${w*h} cm`,`${w+h} cm`,`${ans+2} cm`], seed, 'hình học', `Chu vi = 2 × (${w} + ${h}) = ${ans} cm.`); },
    () => { const n=2+seed%7, start=seed%10, ans=start+n*3; return shuffledQuestion(`Dãy ${start}, ${start+n}, ${start+2*n}, ... có số tiếp theo là gì?`, String(ans), numberChoices(ans), seed, 'quy luật', `Mỗi số tăng thêm ${n}.`); },
    () => { const total=(2+seed%8)*10, part=total/2; return shuffledQuestion(`Một nửa của ${total} là bao nhiêu?`, String(part), [String(total*2),String(total-1),String(part+10)], seed, 'phân số', `${total} chia 2 bằng ${part}.`); },
    () => { const x=3+seed%20,c=2+(seed>>>4)%15,sum=x+c; return shuffledQuestion(`Tìm x: x + ${c} = ${sum}.`, String(x), numberChoices(x), seed, 'đại số', `Lấy ${sum} - ${c} = ${x}.`); },
    () => { const m=1+seed%5, cm=m*100; return shuffledQuestion(`${m} mét bằng bao nhiêu xăng-ti-mét?`, `${cm} cm`, [`${m*10} cm`,`${m*1000} cm`,`${cm+10} cm`], seed, 'đo lường', `1 mét bằng 100 cm.`); },
    () => { const p=10*((seed%7)+1), base=10*((seed>>>4)%8+2), ans=base*p/100; return shuffledQuestion(`${p}% của ${base} bằng bao nhiêu?`, String(ans), numberChoices(ans), seed, 'tỉ lệ', `${base} × ${p}/100 = ${ans}.`); },
    () => { const vals=[a%20+2,b%20+2,(a+b)%20+2], ans=Math.max(...vals); return shuffledQuestion(`Trong các số ${vals.join(', ')}, số lớn nhất là số nào?`, String(ans), vals.filter(v=>v!==ans).map(String).concat(String(ans-1)), seed, 'so sánh', `So sánh theo hàng giá trị để chọn ${ans}.`); },
    () => { const x=2+seed%8, ans=x*x; return shuffledQuestion(`Diện tích hình vuông cạnh ${x} cm là bao nhiêu?`, `${ans} cm²`, [`${x*4} cm²`,`${x*2} cm²`,`${ans+1} cm²`], seed, 'hình học', `Diện tích hình vuông = cạnh × cạnh.`); },
    () => shuffledQuestion(`Bước nào nên làm cuối cùng khi giải bài toán về ${topic.toLowerCase()}?`, 'Kiểm tra lại kết quả và đơn vị', ['Bỏ qua dữ kiện','Chọn ngẫu nhiên một đáp án','Chỉ chép phép tính'], seed, 'tự đánh giá', 'Kiểm tra lại giúp phát hiện sai phép tính và sai đơn vị.')
  ];
  // Nội dung nâng cao chỉ xuất hiện từ lớp phù hợp; lớp nhỏ dùng lại dạng số học cơ bản.
  if (grade <= 2 && [3,5,6,8,10].includes(qIndex)) return templates[qIndex % 3]();
  if (grade <= 4 && qIndex === 8) return templates[4]();
  return templates[qIndex % templates.length]();
}

function buildEnglishQuestion(grade, topic, seed, qIndex) {
  const topicText = topic.toLowerCase();
  const templates = [
    () => shuffledQuestion('Which sentence is a polite greeting?', 'Hello! Nice to meet you.', ['Close the door.','I have two books.','Yesterday was rainy.'], seed, 'vocabulary', '“Hello! Nice to meet you.” is a polite greeting.'),
    () => shuffledQuestion('Complete the sentence: I ___ a student.', 'am', ['is','are','be'], seed, 'grammar', 'The subject “I” goes with “am”.'),
    () => shuffledQuestion('Choose the correct plural form of “book”.', 'books', ['bookes','bookies','book'], seed, 'grammar', 'Most nouns add -s in the plural.'),
    () => shuffledQuestion('Which question matches the answer “I am fine, thank you”?', 'How are you?', ['What is your name?','Where do you live?','How old is the book?'], seed, 'communication', '“How are you?” asks about someone’s condition.'),
    () => shuffledQuestion(`Which sentence is about ${topicText}?`, `We are learning about ${topicText}.`, ['The window is closed.','My pencil is blue.','It is seven o’clock.'], seed, 'reading', 'The correct sentence directly states the lesson topic.'),
    () => shuffledQuestion('Choose the sentence with the correct word order.', 'She goes to school every day.', ['She every day goes school to.','Goes she school every day.','Every school she goes day.'], seed, 'grammar', 'English statements commonly follow Subject + Verb + complement.'),
    () => shuffledQuestion('Which word means “gia đình”?', 'family', ['school','weather','number'], seed, 'vocabulary', '“Family” means “gia đình”.'),
    () => shuffledQuestion('Complete: There ___ two pencils on the desk.', 'are', ['is','am','be'], seed, 'grammar', 'Use “are” with a plural noun.'),
    () => shuffledQuestion('Which sentence describes an action happening now?', 'They are reading a book.', ['They read yesterday.','They will read tomorrow.','They have a red book.'], seed, 'grammar', 'Present continuous describes an action happening now.'),
    () => shuffledQuestion('What should you listen for first in a short passage?', 'The main idea', ['Every unknown word','Only the final sound','The speaker’s clothes'], seed, 'listening', 'Finding the main idea gives a framework for details.'),
    () => shuffledQuestion('Which reply is appropriate after “Thank you”?', 'You’re welcome.', ['Good night yesterday.','I am a table.','What colour?'], seed, 'communication', '“You’re welcome” is a standard polite reply.'),
    () => shuffledQuestion('What helps improve speaking pronunciation?', 'Listen, repeat, record, and compare', ['Speak as fast as possible','Skip difficult sounds','Read silently only'], seed, 'speaking', 'Repeated listening and comparison support pronunciation practice.')
  ];
  return templates[qIndex % templates.length]();
}

function buildLanguageQuestion(grade, topic, seed, qIndex) {
  const name = pick(['Lan','Minh','An','Hà'], seed);
  const text = `${name} thấy một cây non bị nghiêng sau cơn mưa. Bạn nhẹ nhàng dựng cây và buộc vào cọc để cây tiếp tục lớn.`;
  const templates = [
    () => shuffledQuestion(`Đọc đoạn: “${text}” Ý chính là gì?`, `${name} chăm sóc cây non sau mưa.`, [`${name} đi mua một cây mới.`,`Cây non không cần chăm sóc.`,`${name} chơi dưới mưa.`], seed, 'đọc hiểu', 'Ý chính bao quát hành động và mục đích trong đoạn.'),
    () => shuffledQuestion(`Từ nào trong câu “${name} nhẹ nhàng dựng cây” chỉ cách thực hiện hành động?`, 'nhẹ nhàng', [name,'dựng','cây'], seed, 'từ và câu', '“Nhẹ nhàng” bổ sung cách thức cho hành động “dựng”.'),
    () => shuffledQuestion('Dấu câu nào thường dùng cuối câu hỏi?', 'Dấu chấm hỏi (?)', ['Dấu chấm (.)','Dấu phẩy (,)','Dấu hai chấm (:)'], seed, 'chính tả', 'Câu hỏi thường kết thúc bằng dấu chấm hỏi.'),
    () => shuffledQuestion(`Chi tiết nào là bằng chứng ${name} biết bảo vệ cây?`, 'Bạn dựng cây và buộc vào cọc.', ['Trời vừa mưa.','Cây tiếp tục lớn.','Có một cây non.'], seed, 'đọc hiểu', 'Hành động cụ thể là bằng chứng rõ nhất.'),
    () => shuffledQuestion('Câu nào diễn đạt rõ ràng và đủ ý?', 'Em đọc kĩ đề rồi mới viết câu trả lời.', ['Đọc đề câu trả lời.','Kĩ rồi em.','Viết vì đề.'], seed, 'diễn đạt', 'Câu đúng có chủ ngữ, vị ngữ và quan hệ ý rõ ràng.'),
    () => shuffledQuestion('Từ nào gần nghĩa nhất với “chăm chỉ”?', 'siêng năng', ['lười biếng','ồn ào','vội vàng'], seed, 'vốn từ', '“Siêng năng” gần nghĩa với “chăm chỉ”.'),
    () => shuffledQuestion('Khi viết đoạn văn, câu mở đoạn nên làm gì?', 'Giới thiệu ý chính của đoạn', ['Lặp nguyên câu cuối','Đưa chi tiết không liên quan','Bỏ trống chủ đề'], seed, 'viết', 'Câu mở đoạn giúp người đọc biết nội dung chính.'),
    () => shuffledQuestion('Cách dùng dẫn chứng nào thuyết phục hơn?', 'Dẫn chứng cụ thể và liên quan trực tiếp', ['Dẫn chứng không rõ nguồn','Kể càng nhiều càng tốt dù lạc đề','Chỉ nêu cảm xúc'], seed, 'lập luận', 'Dẫn chứng cần cụ thể và hỗ trợ luận điểm.'),
    () => shuffledQuestion(`Nhan đề phù hợp nhất cho đoạn về ${name} là gì?`, 'Chăm sóc cây non', ['Một ngày ở cửa hàng','Trò chơi dưới nước','Chiếc cặp mới'], seed, 'đọc hiểu', 'Nhan đề phải gắn với nội dung trung tâm.'),
    () => shuffledQuestion('Khi sửa bài viết, nên ưu tiên kiểm tra điều gì?', 'Ý, bố cục, câu chữ và chính tả', ['Chỉ số lượng dòng','Chỉ màu mực','Chỉ chữ đầu tiên'], seed, 'tự đánh giá', 'Sửa bài cần xem cả nội dung lẫn hình thức.'),
    () => shuffledQuestion(`Câu nào có nội dung gắn với chủ đề “${topic}”?`, `Em tìm dữ kiện để hiểu rõ ${topic.toLowerCase()}.`, ['Chiếc ghế ở gần cửa.','Hôm nay em dùng bút xanh.','Sân trường có ba cây.'], seed, 'vận dụng', 'Câu đúng nhắc trực tiếp tới chủ đề bài.'),
    () => shuffledQuestion('Trong phần nói và nghe, hành vi nào phù hợp?', 'Lắng nghe, chờ lượt và phản hồi vào ý chính', ['Ngắt lời liên tục','Chỉ nói mà không nghe','Chê bai người trình bày'], seed, 'nói và nghe', 'Giao tiếp hiệu quả cần tôn trọng và phản hồi đúng trọng tâm.')
  ];
  return templates[qIndex % templates.length]();
}

function buildScienceQuestion(subjectId, topic, seed, qIndex) {
  const templates = [
    () => shuffledQuestion(`Muốn tìm hiểu ${topic.toLowerCase()}, bước đầu phù hợp là gì?`, 'Đặt câu hỏi có thể quan sát hoặc kiểm tra', ['Kết luận trước khi quan sát','Bỏ qua an toàn','Chép kết quả của người khác'], seed, 'phương pháp khoa học', 'Một câu hỏi kiểm chứng được định hướng cho quan sát hoặc thí nghiệm.'),
    () => shuffledQuestion('Đâu là một quan sát?', 'Nước trong cốc không màu.', ['Nước chắc chắn tốt nhất.','Em thích cốc này.','Có lẽ ngày mai sẽ khác.'], seed, 'quan sát', 'Quan sát mô tả điều nhận biết được, không phải ý thích hay dự đoán.'),
    () => shuffledQuestion('Khi làm thí nghiệm, vì sao chỉ nên thay đổi một yếu tố?', 'Để biết yếu tố nào gây ra kết quả', ['Để thí nghiệm lâu hơn','Để có nhiều đồ dùng hơn','Để bỏ qua việc ghi chép'], seed, 'thực hành', 'Giữ các yếu tố khác ổn định giúp so sánh công bằng.'),
    () => shuffledQuestion('Quy tắc an toàn nào đúng?', 'Đọc hướng dẫn và dùng bảo hộ phù hợp', ['Nếm hóa chất lạ','Chạm thiết bị điện bằng tay ướt','Tự ý trộn mọi chất'], seed, 'an toàn', 'Thực hành khoa học luôn cần tuân thủ hướng dẫn an toàn.'),
    () => shuffledQuestion('Đặc điểm chung của sinh vật là gì?', 'Có trao đổi chất và phát triển', ['Luôn đứng yên','Không cần năng lượng','Không phản ứng với môi trường'], seed, 'nhận biết', 'Sinh vật sử dụng năng lượng, phát triển và phản ứng với môi trường.'),
    () => shuffledQuestion('Sự chuyển từ nước lỏng thành hơi gọi là gì?', 'Bay hơi', ['Ngưng tụ','Đông đặc','Nóng chảy'], seed, 'kiến thức', 'Bay hơi là quá trình chất lỏng chuyển thành khí.'),
    () => shuffledQuestion('Nguồn năng lượng nào có thể tái tạo?', 'Ánh sáng Mặt Trời', ['Than đá','Dầu mỏ','Khí tự nhiên'], seed, 'vận dụng', 'Năng lượng Mặt Trời được bổ sung tự nhiên liên tục.'),
    () => shuffledQuestion('Bảng số liệu dùng để làm gì?', 'Tổ chức kết quả để so sánh', ['Thay thế mọi quan sát','Che các kết quả khác nhau','Đoán đáp án'], seed, 'xử lí dữ liệu', 'Bảng giúp sắp xếp dữ liệu rõ ràng.'),
    () => shuffledQuestion('Kết luận khoa học tốt cần dựa trên gì?', 'Dữ liệu và bằng chứng thu được', ['Ý kiến đông người nhất','Kết quả mong muốn','Một dự đoán chưa kiểm tra'], seed, 'lập luận', 'Kết luận phải phù hợp với bằng chứng.'),
    () => shuffledQuestion('Hành động nào góp phần bảo vệ hệ sinh thái?', 'Giảm rác và bảo vệ nơi sống của sinh vật', ['Xả rác xuống sông','Bắt mọi động vật nhìn thấy','Đốt rừng để mở rộng đất'], seed, 'môi trường', 'Giảm ô nhiễm và bảo vệ sinh cảnh giúp duy trì đa dạng sinh học.'),
    () => shuffledQuestion('Trong mạch điện đơn giản, điều gì cần có để đèn sáng?', 'Mạch kín và nguồn điện phù hợp', ['Dây bị đứt','Không có nguồn điện','Chỉ có một bóng đèn rời'], seed, 'vận dụng', 'Dòng điện chỉ chạy khi mạch kín.'),
    () => shuffledQuestion('Sau khi thí nghiệm cho kết quả khác dự đoán, nên làm gì?', 'Kiểm tra quy trình, ghi nhận và thử lại', ['Xóa kết quả','Đổi số liệu cho đúng dự đoán','Kết luận ngay là dụng cụ hỏng'], seed, 'tự đánh giá', 'Kết quả khác dự đoán vẫn có giá trị và cần được kiểm tra trung thực.')
  ];
  return templates[qIndex % templates.length]();
}

function buildSocialQuestion(subjectId, topic, seed, qIndex) {
  const templates = [
    () => shuffledQuestion('Trên bản đồ, kí hiệu và chú giải giúp làm gì?', 'Hiểu đối tượng được biểu diễn', ['Biết tác giả thích màu nào','Thay thế hoàn toàn tỉ lệ','Xác định thời tiết tương lai'], seed, 'bản đồ', 'Chú giải giải thích ý nghĩa của các kí hiệu.'),
    () => shuffledQuestion('Muốn sắp xếp sự kiện lịch sử, cần dựa chủ yếu vào gì?', 'Mốc thời gian', ['Màu của hình minh họa','Độ dài tên sự kiện','Số người kể lại'], seed, 'thời gian lịch sử', 'Mốc thời gian giúp xác định trình tự trước–sau.'),
    () => shuffledQuestion('Nguồn nào đáng tin cậy hơn khi tìm hiểu một sự kiện?', 'Tài liệu có nguồn gốc rõ ràng và được đối chiếu', ['Tin nhắn không rõ người gửi','Một lời đồn','Ảnh đã cắt mất bối cảnh'], seed, 'đánh giá nguồn', 'Nguồn rõ xuất xứ và được đối chiếu giúp giảm sai lệch.'),
    () => shuffledQuestion('Hướng đối diện với hướng Đông là hướng nào?', 'Tây', ['Bắc','Nam','Đông Bắc'], seed, 'địa lí', 'Đông và Tây là hai hướng đối diện.'),
    () => shuffledQuestion('Hành vi nào thể hiện trách nhiệm với cộng đồng?', 'Giữ vệ sinh chung và tuân thủ quy định', ['Làm hỏng tài sản chung','Phát tán tin chưa kiểm chứng','Chen lấn nơi công cộng'], seed, 'công dân', 'Trách nhiệm cộng đồng thể hiện qua hành vi tôn trọng người khác và tài sản chung.'),
    () => shuffledQuestion('Khi có bất đồng, cách xử lí phù hợp là gì?', 'Bình tĩnh trao đổi và tìm giải pháp công bằng', ['Đe dọa người khác','Đăng thông tin riêng tư lên mạng','Từ chối nghe mọi ý kiến'], seed, 'giao tiếp', 'Đối thoại tôn trọng giúp giải quyết bất đồng.'),
    () => shuffledQuestion('Một quyền luôn đi cùng điều gì?', 'Trách nhiệm và giới hạn theo pháp luật', ['Quyền làm mọi điều','Không cần tôn trọng người khác','Không cần chịu hậu quả'], seed, 'pháp luật', 'Việc thực hiện quyền phải tôn trọng quyền của người khác và pháp luật.'),
    () => shuffledQuestion('Trước khi chia sẻ một tin trên mạng, nên làm gì?', 'Kiểm tra nguồn và độ chính xác', ['Chia sẻ ngay nếu tiêu đề hấp dẫn','Xóa tên tác giả','Thêm chi tiết chưa biết'], seed, 'ứng xử số', 'Kiểm chứng giúp hạn chế tin sai.'),
    () => shuffledQuestion('Tỉ lệ bản đồ cho biết điều gì?', 'Mức thu nhỏ khoảng cách thực tế', ['Tuổi của bản đồ','Số màu trên bản đồ','Độ cao của người đọc'], seed, 'bản đồ', 'Tỉ lệ liên hệ khoảng cách trên bản đồ với thực tế.'),
    () => shuffledQuestion(`Khi học chủ đề “${topic}”, nên so sánh các nguồn để làm gì?`, 'Nhận ra điểm giống, khác và độ tin cậy', ['Chọn nguồn dài nhất','Bỏ mọi dữ kiện trái ý','Chỉ nhớ hình ảnh'], seed, 'phân tích', 'So sánh nguồn giúp nhìn vấn đề đầy đủ hơn.'),
    () => shuffledQuestion('Lập ngân sách cá nhân giúp gì?', 'Cân đối thu, chi và mục tiêu tiết kiệm', ['Chi hết tiền nhanh hơn','Không cần theo dõi khoản mua','Đảm bảo mọi khoản đầu tư có lãi'], seed, 'kinh tế', 'Ngân sách giúp chủ động phân bổ nguồn tiền.'),
    () => shuffledQuestion('Cách bảo tồn di sản phù hợp là gì?', 'Tìm hiểu, giữ gìn và tuân thủ quy định bảo vệ', ['Khắc tên lên di tích','Tự ý mang hiện vật về','Lan truyền thông tin sai'], seed, 'di sản', 'Bảo tồn cần tôn trọng giá trị và quy định của di sản.')
  ];
  return templates[qIndex % templates.length]();
}

function buildDigitalQuestion(topic, seed, qIndex) {
  const templates = [
    () => shuffledQuestion('Mật khẩu nào an toàn hơn?', 'Một cụm dài, riêng biệt và khó đoán', ['12345678','ngày sinh của em','password'], seed, 'an toàn số', 'Mật khẩu dài và riêng biệt khó bị đoán hơn.'),
    () => shuffledQuestion('Thuật toán là gì?', 'Dãy bước rõ ràng để giải quyết nhiệm vụ', ['Một thiết bị điện','Một hình nền','Một tài khoản mạng'], seed, 'thuật toán', 'Thuật toán mô tả các bước theo trình tự.'),
    () => shuffledQuestion('Khi nhận đường link đáng ngờ, nên làm gì?', 'Không mở và báo người lớn/quản trị viên', ['Nhập mật khẩu để kiểm tra','Gửi tiếp cho bạn','Tắt cảnh báo trình duyệt'], seed, 'an toàn số', 'Không tương tác với liên kết đáng ngờ giúp tránh lừa đảo.'),
    () => shuffledQuestion('Dữ liệu nào không nên công khai?', 'Mật khẩu và mã xác thực', ['Tên môn học','Một bài toán công khai','Thời khóa biểu mẫu'], seed, 'quyền riêng tư', 'Thông tin xác thực phải được giữ bí mật.'),
    () => shuffledQuestion('Trong lập trình, vòng lặp dùng để làm gì?', 'Lặp lại một nhóm lệnh theo điều kiện', ['Đổi màu màn hình duy nhất','Tắt máy tính','Xóa mọi dữ liệu'], seed, 'lập trình', 'Vòng lặp giảm việc viết lại cùng thao tác.'),
    () => shuffledQuestion('Trước khi dùng ảnh của người khác, nên làm gì?', 'Kiểm tra quyền sử dụng và ghi nguồn khi cần', ['Xóa tên tác giả','Nhận là ảnh của mình','Dùng mọi ảnh vì ở trên mạng'], seed, 'đạo đức số', 'Nội dung trên mạng vẫn có quyền tác giả.'),
    () => shuffledQuestion('Sơ đồ khối giúp ích gì?', 'Biểu diễn luồng xử lí của thuật toán', ['Tăng tốc mạng tự động','Thay mật khẩu','Sửa phần cứng'], seed, 'thuật toán', 'Sơ đồ khối trực quan hóa thứ tự và nhánh xử lí.'),
    () => shuffledQuestion('Tệp sao lưu dùng để làm gì?', 'Khôi phục dữ liệu khi bản chính bị mất hoặc hỏng', ['Làm thiết bị nóng hơn','Thay thế mật khẩu','Chia sẻ dữ liệu công khai'], seed, 'dữ liệu', 'Sao lưu giảm rủi ro mất dữ liệu.'),
    () => shuffledQuestion('Khi chương trình cho kết quả sai, bước phù hợp là gì?', 'Kiểm tra từng bước và dữ liệu đầu vào', ['Viết thêm lệnh ngẫu nhiên','Xóa toàn bộ ngay','Đổi kết quả bằng tay'], seed, 'gỡ lỗi', 'Gỡ lỗi có hệ thống giúp tìm nguyên nhân.'),
    () => shuffledQuestion(`Một sản phẩm số về “${topic}” nên ưu tiên điều gì?`, 'Đúng mục đích, dễ dùng và an toàn', ['Nhiều hiệu ứng nhất','Thu thập mọi dữ liệu','Ẩn hướng dẫn'], seed, 'thiết kế', 'Sản phẩm tốt phục vụ nhu cầu người dùng và bảo vệ dữ liệu.'),
    () => shuffledQuestion('Thông tin nào là dữ liệu đầu vào của máy tính?', 'Văn bản người dùng nhập', ['Kết luận chưa được tính','Ý định không được nhập','Một đáp án chưa lưu'], seed, 'dữ liệu', 'Dữ liệu đầu vào được đưa vào hệ thống để xử lí.'),
    () => shuffledQuestion('Khi làm việc nhóm trực tuyến, nên làm gì?', 'Phân quyền rõ và không chia sẻ tài khoản', ['Dùng chung một mật khẩu','Xóa lịch sử thay đổi','Sửa bài mà không thông báo'], seed, 'hợp tác số', 'Phân quyền và lịch sử thay đổi giúp cộng tác an toàn.')
  ];
  return templates[qIndex % templates.length]();
}

function buildLifeSkillQuestion(topic, seed, qIndex) {
  const templates = [
    () => shuffledQuestion('Trước khi vận động, nên làm gì?', 'Khởi động phù hợp', ['Nhịn uống nước cả ngày','Tập động tác khó ngay','Mang giày không vừa'], seed, 'an toàn', 'Khởi động giúp cơ thể sẵn sàng vận động.'),
    () => shuffledQuestion('Khi cảm thấy đau bất thường lúc tập, nên làm gì?', 'Dừng lại và báo giáo viên/người lớn', ['Cố tập nhanh hơn','Giấu cơn đau','Tự dùng thuốc lạ'], seed, 'sức khỏe', 'Dừng tập giúp hạn chế chấn thương.'),
    () => shuffledQuestion('Trong hoạt động nhóm, cách hợp tác tốt là gì?', 'Phân công rõ và lắng nghe nhau', ['Một người làm hết','Không chia sẻ thông tin','Chê ý tưởng khác'], seed, 'hợp tác', 'Hợp tác cần vai trò rõ ràng và tôn trọng.'),
    () => shuffledQuestion('Khi sáng tạo nghệ thuật, bản phác thảo có tác dụng gì?', 'Thử bố cục và ý tưởng trước khi hoàn thiện', ['Bắt buộc mọi tác phẩm giống nhau','Thay thế hoàn toàn việc quan sát','Chỉ để trang trí bàn'], seed, 'sáng tạo', 'Phác thảo giúp thử nghiệm và điều chỉnh.'),
    () => shuffledQuestion('Nhịp trong âm nhạc giúp gì?', 'Tổ chức âm thanh theo thời gian', ['Thay đổi màu sắc','Đo chiều dài','Xác định hướng Bắc'], seed, 'cảm thụ', 'Nhịp tạo trật tự thời gian cho âm nhạc.'),
    () => shuffledQuestion('Khi dùng dụng cụ thủ công, cần ưu tiên điều gì?', 'Đúng cách và an toàn', ['Dùng càng nhanh càng tốt','Đưa đầu nhọn về phía bạn','Bỏ qua hướng dẫn'], seed, 'công nghệ', 'Dụng cụ cần được dùng đúng chức năng và quy tắc an toàn.'),
    () => shuffledQuestion('Mục tiêu cá nhân tốt nên như thế nào?', 'Cụ thể, vừa sức và có thời hạn', ['Mơ hồ và không cần theo dõi','Phụ thuộc hoàn toàn người khác','Thay đổi mỗi giờ'], seed, 'tự quản lí', 'Mục tiêu rõ giúp lập kế hoạch và kiểm tra tiến độ.'),
    () => shuffledQuestion('Khi chọn nghề, nên tìm hiểu điều gì?', 'Sở thích, năng lực và nhu cầu xã hội', ['Chỉ tên nghề nghe hay','Chỉ ý kiến một người','Bỏ qua điều kiện đào tạo'], seed, 'hướng nghiệp', 'Quyết định nghề nghiệp cần nhiều nguồn thông tin.'),
    () => shuffledQuestion('Hành động nào thể hiện tôn trọng sự khác biệt?', 'Lắng nghe và không chế giễu', ['Ép mọi người giống mình','Đăng ảnh người khác không xin phép','Gắn nhãn tiêu cực'], seed, 'phẩm chất', 'Tôn trọng bắt đầu từ cách lắng nghe và ứng xử.'),
    () => shuffledQuestion(`Muốn tiến bộ ở chủ đề “${topic}”, nên làm gì?`, 'Luyện tập đều, nhận góp ý và điều chỉnh', ['Chỉ làm một lần','Tránh mọi góp ý','So sánh để chê người khác'], seed, 'tự đánh giá', 'Phản hồi và luyện tập có mục tiêu giúp tiến bộ.'),
    () => shuffledQuestion('Sau hoạt động, bước phản tư phù hợp là gì?', 'Nêu điều làm tốt, điều cần sửa và kế hoạch tiếp theo', ['Chỉ xem điểm','Đổ lỗi cho bạn','Không ghi nhận gì'], seed, 'phản tư', 'Phản tư biến trải nghiệm thành bài học.'),
    () => shuffledQuestion('Trong hoạt động quốc phòng–an ninh, nguyên tắc nào quan trọng?', 'Tuân thủ kỷ luật, an toàn và hướng dẫn', ['Tự ý thao tác','Đùa nghịch với thiết bị','Bỏ vị trí không báo'], seed, 'kỷ luật', 'Kỷ luật và an toàn là yêu cầu nền tảng.')
  ];
  return templates[qIndex % templates.length]();
}

function buildSubjectQuestion(grade, subjectId, topic, seed, qIndex) {
  if (subjectId === 'toan') return buildMathQuestion(grade, topic, seed, qIndex);
  if (subjectId === 'tieng_anh') return buildEnglishQuestion(grade, topic, seed, qIndex);
  if (['tieng_viet','ngu_van'].includes(subjectId)) return buildLanguageQuestion(grade, topic, seed, qIndex);
  if (['tnxh','khoa_hoc','khtn','vat_ly','hoa_hoc','sinh_hoc'].includes(subjectId)) return buildScienceQuestion(subjectId, topic, seed, qIndex);
  if (['lich_su_dia_li','lich_su','dia_li','dao_duc','gdcd','gdktepl','dia_phuong'].includes(subjectId)) return buildSocialQuestion(subjectId, topic, seed, qIndex);
  if (['tin_hoc','cong_nghe'].includes(subjectId)) return buildDigitalQuestion(topic, seed, qIndex);
  return buildLifeSkillQuestion(topic, seed, qIndex);
}

function makeLesson(grade, subjectId, index) {
  const [subjectName, icon] = SUBJECTS[subjectId];
  const topics = TOPICS[subjectId] || ['Kiến thức nền tảng'];
  const topic = topics[index % topics.length];
  const unit = Math.floor(index / 4) + 1;
  const lessonNo = index + 1;
  const isEnglish = subjectId === 'tieng_anh';
  const isLiterature = subjectId === 'ngu_van' || subjectId === 'tieng_viet';
  const title = `Bài ${lessonNo}: ${topic} ${Math.floor(index / topics.length) + 1}`;
  const seed = hash(`${grade}-${subjectId}-${index}`);
  const levelText = grade <= 5 ? 'gần gũi, trực quan' : grade <= 9 ? 'có lập luận và vận dụng' : 'có phân tích, đánh giá và vận dụng cao';
  const theory = [
    `Bài học giúp học sinh lớp ${grade} hình thành kiến thức cốt lõi về ${topic.toLowerCase()} trong môn ${subjectName}.`,
    `Hãy bắt đầu từ ví dụ quen thuộc, xác định dữ kiện quan trọng, nêu cách giải thích và tự kiểm tra kết quả.`,
    `Mức độ yêu cầu của bài là ${levelText}. Học sinh cần hiểu khái niệm, biết áp dụng và giải thích bằng lời của mình.`
  ];
  const objectives = [
    `Nhận biết được nội dung chính của ${topic.toLowerCase()}.`,
    `Thực hiện được một nhiệm vụ phù hợp với lớp ${grade}.`,
    `Vận dụng kiến thức vào tình huống mới và tự đánh giá kết quả.`
  ];
  const keyPoints = [
    `Đọc kĩ yêu cầu trước khi trả lời.`,
    `Dùng bằng chứng hoặc dữ kiện để giải thích.`,
    `Kiểm tra lại đáp án và sửa lỗi sau mỗi lần làm.`
  ];
  const questions = Array.from({ length: 12 }, (_, qIndex) => ({
    id: `q${qIndex + 1}`,
    ...buildSubjectQuestion(grade, subjectId, topic, hash(`${seed}-${qIndex}`), qIndex)
  }));
  return {
    id: `lesson-${lessonNo}`,
    order: lessonNo,
    unit,
    title,
    topic,
    estimatedMinutes: 20 + (grade >= 6 ? 10 : 0),
    theory,
    objectives,
    keyPoints,
    questions,
    listening: isEnglish ? {
      text: grade <= 5 ? `Hello! I am learning about ${topic.toLowerCase()}. I listen carefully and answer the question.` : `Today we are learning about ${topic.toLowerCase()}. Listen for the main idea and important supporting details.`,
      prompt: 'What is the speaker learning about?',
      expectedKeywords: topic.toLowerCase().split(/\s+/).filter(Boolean)
    } : null,
    speaking: isEnglish ? {
      prompt: grade <= 5 ? `Say: I can learn ${topic.toLowerCase()} step by step.` : `Speak for 20–40 seconds about ${topic.toLowerCase()} and give one example.`,
      reference: `I can learn ${topic.toLowerCase()} step by step and give a clear example.`
    } : null,
    writing: isLiterature && index % 3 === 2 ? {
      prompt: grade <= 5 ? `Viết một đoạn từ 5–8 câu về một trải nghiệm có liên quan đến ${topic.toLowerCase()}.` : `Viết bài khoảng ${grade <= 9 ? '300–500' : '500–800'} chữ phân tích hoặc trình bày suy nghĩ về ${topic.toLowerCase()}.`,
      rubric: ['Đúng yêu cầu','Bố cục','Lập luận và dẫn chứng','Diễn đạt','Chính tả và sáng tạo']
    } : null
  };
}

function getSubject(grade, subjectId, { includeLessons = false } = {}) {
  const valid = subjectIdsForGrade(grade).includes(subjectId);
  if (!valid || !SUBJECTS[subjectId]) return null;
  const [name, icon] = SUBJECTS[subjectId];
  const lessonCount = grade <= 5 ? 18 : 24;
  const lessons = Array.from({ length: lessonCount }, (_, index) => makeLesson(grade, subjectId, index));
  return {
    id: subjectId, name, icon,
    compulsory: !(grade >= 10 && ['dia_li','gdktepl','vat_ly','hoa_hoc','sinh_hoc','tin_hoc','cong_nghe','am_nhac','mi_thuat'].includes(subjectId)),
    lessonCount,
    units: Math.ceil(lessonCount / 4),
    lessons: includeLessons ? lessons : lessons.map(({ questions, theory, ...lesson }) => ({ ...lesson, questionCount: questions.length }))
  };
}

function getCatalog(grade) {
  const safeGrade = Math.min(12, Math.max(1, Number(grade) || 1));
  return {
    programVersion: PROGRAM_VERSION,
    grade: safeGrade,
    passScore: PASS_SCORE,
    note: 'Nội dung nguyên bản bám yêu cầu cần đạt; nhà trường có thể cấu hình bộ sách và lịch kiểm tra.',
    subjects: subjectIdsForGrade(safeGrade).map(id => getSubject(safeGrade, id))
  };
}

function getLesson(grade, subjectId, lessonId) {
  const subject = getSubject(Number(grade), subjectId, { includeLessons: true });
  if (!subject) return null;
  const lesson = subject.lessons.find(item => item.id === lessonId);
  if (!lesson) return null;
  return { programVersion: PROGRAM_VERSION, grade: Number(grade), subject: { id: subject.id, name: subject.name, icon: subject.icon }, lesson };
}

function scoreLesson(lesson, answers = {}) {
  let correct = 0;
  const details = lesson.questions.map(question => {
    const chosen = Number(answers[question.id]);
    const isCorrect = chosen === question.answer;
    if (isCorrect) correct += 1;
    return { id: question.id, chosen, answer: question.answer, isCorrect, skill: question.skill, explanation: question.explanation };
  });
  const score = Number(((correct / lesson.questions.length) * 10).toFixed(1));
  return { correct, total: lesson.questions.length, score, passed: score > PASS_SCORE, details };
}

module.exports = { PROGRAM_VERSION, PASS_SCORE, getCatalog, getSubject, getLesson, scoreLesson };
