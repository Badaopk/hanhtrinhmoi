'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const entries = fs.readdirSync(root, { withFileTypes: true });
const files = new Set(entries.filter(entry => entry.isFile()).map(entry => entry.name));
const htmlFiles = [...files].filter(file => file.endsWith('.html'));
const jsFiles = [...files].filter(file => file.endsWith('.js') && !file.endsWith('.bak'));
const failures = [];

for (const file of jsFiles) {
    try {
        execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
    } catch (error) {
        failures.push(`JavaScript không hợp lệ: ${file}\n${error.stderr?.toString() || error.message}`);
    }
}

// Biên dịch script nội tuyến để bắt lỗi JavaScript nằm trong HTML.
for (const htmlFile of htmlFiles) {
    const content = fs.readFileSync(path.join(root, htmlFile), 'utf8');
    let scriptIndex = 0;
    for (const match of content.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        scriptIndex += 1;
        const attrs = match[1] || '';
        const source = match[2] || '';
        if (/\bsrc\s*=/.test(attrs) || !source.trim()) continue;
        const type = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
        if (type && !['text/javascript', 'application/javascript'].includes(type)) continue;
        try {
            new vm.Script(source, { filename: `${htmlFile}#script-${scriptIndex}` });
        } catch (error) {
            failures.push(`Script nội tuyến không hợp lệ: ${htmlFile} khối ${scriptIndex}: ${error.message}`);
        }
    }
}

const localRefPattern = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
for (const htmlFile of htmlFiles) {
    const content = fs.readFileSync(path.join(root, htmlFile), 'utf8');
    for (const match of content.matchAll(localRefPattern)) {
        const value = match[1];
        if (!value || value.includes('${') || /^(?:https?:|data:|mailto:|javascript:|#|\/socket\.io)/i.test(value)) continue;
        const target = value.split(/[?#]/)[0].replace(/^\//, '');
        if (target && !files.has(target)) failures.push(`${htmlFile}: thiếu tệp ${target}`);
    }
}

for (const htmlFile of htmlFiles) {
    const content = fs.readFileSync(path.join(root, htmlFile), 'utf8');
    if (!content.includes('modern-ui.css')) failures.push(`${htmlFile}: chưa nạp modern-ui.css`);
    if (!content.includes('modern-ui.js')) failures.push(`${htmlFile}: chưa nạp modern-ui.js`);
}

try {
    const { tests } = require(path.join(root, 'question-data.js'));
    const { SUBJECTS, DIFFICULTIES, ensureCompleteQuestionBank } = require(path.join(root, 'question-bank-complete.js'));
    const summary = ensureCompleteQuestionBank(tests, { minQuestions: 100 });
    const ids = new Set();
    for (const subject of SUBJECTS) {
        for (let grade = 1; grade <= 12; grade += 1) {
            for (const difficulty of DIFFICULTIES) {
                const questions = tests[subject]?.[`grade${grade}`]?.[difficulty];
                if (!Array.isArray(questions) || questions.length < 100) {
                    failures.push(`Thiếu câu hỏi: ${subject} lớp ${grade} ${difficulty}`);
                    continue;
                }
                for (const question of questions) {
                    if (!question.id || ids.has(question.id)) failures.push(`ID câu hỏi trùng/thiếu: ${question.id || '(trống)'}`);
                    ids.add(question.id);
                    if (!question.q || !Array.isArray(question.a) || question.a.length < 4 || !question.a.includes(question.correct)) failures.push(`Câu hỏi không hợp lệ: ${question.id}`);
                }
            }
        }
    }
    if (summary.totalQuestions < 21600) failures.push(`Ngân hàng chỉ có ${summary.totalQuestions} câu, yêu cầu tối thiểu 21600.`);
} catch (error) {
    failures.push(`Không kiểm tra được ngân hàng câu hỏi: ${error.message}`);
}

let curriculumSummary = { grades: 0, subjects: 0, lessons: 0, lessonQuestions: 0 };
try {
    const curriculum = require(path.join(root, 'curriculum-data.js'));
    const firstLessonBySubject = new Map();
    for (let grade = 1; grade <= 12; grade += 1) {
        const catalog = curriculum.getCatalog(grade);
        curriculumSummary.grades += 1;
        if (catalog.grade !== grade || !catalog.gradeFocus) failures.push(`Hồ sơ lớp ${grade} thiếu trọng tâm riêng.`);
        if (!catalog.framework?.qualities?.length || !catalog.framework?.generalCompetencies?.length) failures.push(`Hồ sơ lớp ${grade} thiếu khung phẩm chất và năng lực V8.`);
        if (!Array.isArray(catalog.subjects) || catalog.subjects.length < 8) failures.push(`Lớp ${grade} có quá ít môn học.`);
        const subjectNames = new Set();
        for (const subject of catalog.subjects) {
            curriculumSummary.subjects += 1;
            if (!subject.name.includes(String(grade))) failures.push(`${subject.id} lớp ${grade}: tên môn chưa thể hiện lớp riêng.`);
            if (subjectNames.has(subject.name)) failures.push(`Lớp ${grade}: tên môn trùng ${subject.name}`);
            subjectNames.add(subject.name);
            const fullSubject = curriculum.getSubject(grade, subject.id, { includeLessons: true });
            if (!fullSubject || fullSubject.lessons.length !== subject.lessonCount) failures.push(`${subject.name}: số bài không khớp.`);
            if (!fullSubject?.competencyProfile?.general?.length || !fullSubject?.competencyProfile?.subjectSpecific?.length) failures.push(`${subject.name}: thiếu hồ sơ năng lực môn học.`);
            const lessonTitles = new Set();
            for (const lesson of fullSubject?.lessons || []) {
                curriculumSummary.lessons += 1;
                curriculumSummary.lessonQuestions += lesson.questions.length;
                if (lessonTitles.has(lesson.title)) failures.push(`${subject.name}: bài bị trùng tên ${lesson.title}`);
                lessonTitles.add(lesson.title);
                if (!lesson.gradeFocus || !lesson.title || lesson.questions.length !== 12) failures.push(`${subject.name}/${lesson.id}: gói bài học chưa đầy đủ.`);
                if (!lesson.unitTitle || !lesson.difficulty || !Array.isArray(lesson.studySteps) || lesson.studySteps.length !== 5 || !Array.isArray(lesson.practiceTasks) || lesson.practiceTasks.length !== 3) failures.push(`${subject.name}/${lesson.id}: thiếu chặng, độ khó hoặc tiến trình học V7.`);
                if (!Array.isArray(lesson.learningOutcomes) || lesson.learningOutcomes.length < 2 || !lesson.competencies?.general?.length || !lesson.competencies?.subjectSpecific?.length || !Array.isArray(lesson.qualities) || !lesson.qualities.length || !lesson.assessment?.rubricLevels?.length) failures.push(`${subject.name}/${lesson.id}: thiếu yêu cầu cần đạt, phẩm chất, năng lực hoặc minh chứng đánh giá V8.`);
                if (lesson.order % 4 === 0 && !lesson.isCheckpoint) failures.push(`${subject.name}/${lesson.id}: bài cuối chặng chưa được đánh dấu mốc kiểm tra.`);
                for (const question of lesson.questions) {
                    if (!question.prompt || !Array.isArray(question.options) || question.options.length !== 4 || !Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) failures.push(`${subject.name}/${lesson.id}/${question.id}: câu hỏi lộ trình không hợp lệ.`);
                }
            }
            const firstTitle = fullSubject?.lessons?.[0]?.title;
            if (firstTitle) {
                const previous = firstLessonBySubject.get(subject.id);
                if (previous?.has(firstTitle)) failures.push(`${subject.id}: lớp ${grade} dùng lại bài mở đầu ${firstTitle}`);
                if (!previous) firstLessonBySubject.set(subject.id, new Set([firstTitle])); else previous.add(firstTitle);
            }
        }
    }
    const grade1English = curriculum.getSubject(1, 'tieng_anh');
    const grade3English = curriculum.getSubject(3, 'tieng_anh');
    if (!grade1English || grade1English.compulsory) failures.push('Tiếng Anh lớp 1 phải là chương trình làm quen tự chọn.');
    if (!grade3English || !grade3English.compulsory) failures.push('Tiếng Anh lớp 3 phải là môn bắt buộc.');
    for (const grade of [3,4,5]) if (!curriculum.getSubject(grade, 'tin_hoc_cong_nghe')) failures.push(`Lớp ${grade} thiếu môn Tin học và Công nghệ.`);
    const sample = curriculum.getLesson(6, 'toan', 'lesson-1').lesson;
    const tenCorrect = Object.fromEntries(sample.questions.map((q, index) => [q.id, index < 10 ? q.answer : (q.answer + 1) % 4]));
    const nineCorrect = Object.fromEntries(sample.questions.map((q, index) => [q.id, index < 9 ? q.answer : (q.answer + 1) % 4]));
    if (!curriculum.scoreLesson(sample, tenCorrect).passed || curriculum.scoreLesson(sample, nineCorrect).passed) failures.push('Ngưỡng mở khóa trên 8/10 hoạt động sai.');
} catch (error) {
    failures.push(`Không kiểm tra được lộ trình lớp 1–12: ${error.message}`);
}

const roomSource = fs.readFileSync(path.join(root, 'trang-tri-phong.html'), 'utf8');
for (const requiredSnippet of ['generateInfiniteMine()', 'isMineable', '/api/house/mine', 'voxel_diamond', 'Mỏ Pha Lê Vô Tận']) {
    if (!roomSource.includes(requiredSnippet)) failures.push(`Trang trí phòng thiếu tính năng mỏ V7: ${requiredSnippet}`);
}

const serverSource = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const serverRoutes = new Set([...serverSource.matchAll(/app\.(?:get|post|put|delete)\(\s*['"]([^'"]+)['"]/g)].map(match => match[1]));
for (const route of ['/api/learning/week-plan', '/api/learning/review-quiz', '/api/learning/review-quiz/submit', '/api/house/mine']) {
    if (!serverRoutes.has(route)) failures.push(`Thiếu API V7: ${route}`);
}
for (const route of ['/api/learning/education-dashboard', '/api/learning/self-assessment']) {
    if (!serverRoutes.has(route)) failures.push(`Thiếu API giáo dục V8: ${route}`);
}
for (const route of ['/api/tournaments', '/api/tournaments/:id', '/api/tournaments/:id/join', '/api/tournaments/:id/leave', '/api/tournaments/:id/start', '/api/tournaments/:id/cancel', '/api/tournaments/join-code']) {
    if (!serverRoutes.has(route)) failures.push(`Thiếu API giải cộng đồng V9: ${route}`);
}
for (const snippet of ['arenaPoints', 'arena-noncash', 'refundTournamentEntries', 'creditArenaPoints', 'COMMUNITY_TOURNAMENT_MAX_ENTRY']) {
    if (!serverSource.includes(snippet)) failures.push(`Máy chủ thiếu bảo vệ quỹ giải V9: ${snippet}`);
}

const boardPages = ['caro.html', 'co-ty-phu.html', 'co-vua.html', 'co-vay.html', 'othello.html'];
for (const boardPage of boardPages) {
    const content = fs.readFileSync(path.join(root, boardPage), 'utf8');
    if (!content.includes('board-ui-v8.css') || !content.includes('board-ui-v8.js')) failures.push(`${boardPage}: chưa nạp giao diện bàn cờ responsive V8.`);
}
const boardHubSource = fs.readFileSync(path.join(root, 'choi-co.html'), 'utf8');
for (const href of boardPages) {
    if (!boardHubSource.includes(`href="${href}"`) && !boardHubSource.includes(`href='${href}'`)) failures.push(`Đấu trường cờ thiếu liên kết ${href}`);
}
const tournamentSource = ['giai-dau.html','tournament-v9.css','tournament-v9.js'].map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
for (const snippet of ['Trung tâm Giải đấu', 'bracket-scroll', 'Lịch thi đấu cá nhân', 'Vòng bảng', 'Bảng vinh danh']) {
    if (!tournamentSource.includes(snippet)) failures.push(`Giải đấu thiếu giao diện rõ nét: ${snippet}`);
}
for (const snippet of ['Điểm Đấu Trường', '/api/tournaments', 'join-code', 'Tạo giải cộng đồng']) {
    if (!tournamentSource.includes(snippet)) failures.push(`Giải cộng đồng V9 thiếu: ${snippet}`);
}
for (const eventName of ['othelloMove', 'othelloState', 'othelloGameOver']) {
    if (!serverSource.includes(eventName)) failures.push(`Máy chủ thiếu xác thực Othello V8: ${eventName}`);
}

for (const sourceFile of [...htmlFiles, ...jsFiles.filter(file => file !== 'server.js')]) {
    const content = fs.readFileSync(path.join(root, sourceFile), 'utf8');
    for (const match of content.matchAll(/fetch\(\s*[`'"]([^`'"]+)/g)) {
        const raw = match[1];
        if (!raw.startsWith('/api/') || raw.includes('${')) continue;
        const route = raw.split('?')[0];
        if (!serverRoutes.has(route)) failures.push(`${sourceFile}: API chưa tồn tại ${route}`);
    }
}

if (failures.length) {
    console.error(`❌ Phát hiện ${failures.length} lỗi:\n- ${failures.join('\n- ')}`);
    process.exit(1);
}

console.log(`✅ Kiểm tra V9 thành công: ${htmlFiles.length} trang HTML, ${jsFiles.length} tệp JavaScript, ${serverRoutes.size} API, ${curriculumSummary.grades} lớp, ${curriculumSummary.subjects} lộ trình môn, ${curriculumSummary.lessons} bài học, ${curriculumSummary.lessonQuestions} câu hỏi lộ trình và 21.600+ câu hỏi ngân hàng.`);
