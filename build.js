/**
 * 打包脚本：将 note.js 头部 + src/ 下的模块按顺序合并为单文件 dist/bundle.user.js
 * 用法：node build.js
 */
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const NOTE_FILE = path.join(__dirname, 'note.js');
const DIST_DIR = path.join(__dirname, 'dist');
const OUTPUT = path.join(DIST_DIR, 'bundle.user.js');

// 先拼接注释头，再拼接源码模块
const noteContent = fs.existsSync(NOTE_FILE) ? fs.readFileSync(NOTE_FILE, 'utf-8') : null;
if (!noteContent) {
    console.error('[ERROR] 缺少头部文件: note.js');
    process.exit(1);
}

// 按顺序拼接的模块列表
const modules = [
    'constants.js',      // 主题、默认配置、选择器、图标
    'styles.js',         // CSS 样式
    'templates.js',      // HTML 模板
    // --- 以下进入 IIFE ---
    'state.js',          // 全局状态 & 配置管理
    'api-profiles.js',   // API 配置组管理
    'utils.js',          // 工具函数
    'api.js',            // LLM API 引擎
    'zhihu-action.js',   // 知乎赞同/感谢/收藏写 API
    'cache.js',          // 翻译缓存 & IndexedDB
    'ui.js',             // 模态框、overlay、图片切换
    'translation.js',    // 翻译 & 摘要
    'expression.js',     // 表达收藏本
    'radar.js',          // 信息雷达
    'share.js',          // 零损分享
    'page-post.js',      // 专栏文章页逻辑
    'page-question.js',  // 问题页逻辑
    'feed-scroll.js',    // 信息流预取队列与滚动加载门
    'page-home.js',      // 首页推荐逻辑
    'page-follow.js',    // 关注动态页逻辑（纯 API）
    'wiki-store.js',     // Wiki IndexedDB 存储
    'wiki.js',           // Wiki 功能
    'toolbar.js',        // 工具栏 & 沉浸模式进入/退出
    'events.js',         // 键盘快捷键 & 右键菜单
];

// IIFE 内部模块（state.js 开始到 events.js 结束）
const IIFE_START_INDEX = modules.indexOf('state.js');

if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

let output = noteContent.trimEnd() + '\n\n';

for (let i = 0; i < modules.length; i++) {
    const file = path.join(SRC_DIR, modules[i]);
    if (!fs.existsSync(file)) {
        console.error(`[ERROR] 缺少模块: src/${modules[i]}`);
        process.exit(1);
    }
    const content = fs.readFileSync(file, 'utf-8');

    if (i === IIFE_START_INDEX) {
        output += '\n(function() {\n';
        output += '    if (window._hasZhihuImmersiveSetup) return;\n';
        output += '    window._hasZhihuImmersiveSetup = true;\n';
        output += '    window._isImmersive = false;\n';
        output += '    window._uiHidden = false;\n';
        output += '    window._trVisible = false;\n\n';
    }

    output += `// ═══════════════════════════════════════════════════════════\n`;
    output += `// 模块: ${modules[i]}\n`;
    output += `// ═══════════════════════════════════════════════════════════\n`;
    output += content + '\n\n';
}

fs.writeFileSync(OUTPUT, output, 'utf-8');
const sizeKB = (Buffer.byteLength(output, 'utf-8') / 1024).toFixed(1);
console.log(`[OK] 打包完成: dist/bundle.user.js (${sizeKB} KB)`);
