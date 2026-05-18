/**
 * 拆分脚本 v2：将 base.js 按逻辑模块拆分到 src/ 目录
 * 修正了所有函数边界问题
 * 用法：node split.js
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, 'base.js');
const SRC = path.join(__dirname, 'src');
const lines = fs.readFileSync(BASE, 'utf-8').split('\n');

if (!fs.existsSync(SRC)) fs.mkdirSync(SRC, { recursive: true });

function extract(start, end) {
    return lines.slice(start - 1, end).join('\n');
}

function write(name, content) {
    fs.writeFileSync(path.join(SRC, name), content, 'utf-8');
    console.log(`  [OK] src/${name} (${content.split('\n').length} lines)`);
}

console.log('开始拆分 base.js ...\n');

// 1. UserScript 头部
write('meta.js', extract(1, 22));

// 2. 常量：主题、默认配置、隐藏选择器、图标
write('constants.js', [
    extract(24, 89),
    '',
    extract(403, 415)
].join('\n'));

// 3. CSS 样式
write('styles.js', extract(91, 292));

// 4. HTML 模板
write('templates.js', extract(294, 401));

// === IIFE 内部模块 ===
// 5. 全局状态 & 配置管理
write('state.js', [
    extract(429, 466),
    '',
    extract(3700, 3745)
].join('\n'));

// 6. API 配置组管理
write('api-profiles.js', extract(473, 631));

// 7. LLM API 引擎 + 网络工具
write('api.js', [
    extract(2223, 2327),
    '',
    extract(4516, 4614)
].join('\n'));

// 8. 工具函数
write('utils.js', [
    extract(2328, 2340),   // stableHash
    '',
    extract(2742, 2748),   // getFormNumber
    '',
    extract(2849, 2907),   // sleep ~ waitForElement
    '',
    extract(2909, 2934),   // waitForHomeFeedItems
    '',
    extract(3002, 3070),   // escapeHTML ~ getElementPageTop
    '',
    extract(4615, 4630),   // normalizeText + stripHTMLToText
    '',
    extract(1039, 1058),   // downloadBlobFile + downloadTextFile + sanitizeShareFilename
    '',
    extract(3575, 3590),   // showCollectOverlay + removeCollectOverlay
    '',
    extract(3932, 3935),   // isTypingTarget
].join('\n'));

// 9. IndexedDB 缓存 + 翻译缓存
write('cache.js', [
    extract(632, 670),
    '',
    extract(2342, 2437),
].join('\n'));

// 10. UI 基础：主题、模态框、图片切换
write('ui.js', [
    extract(672, 800),     // applyTheme ~ resetImageToggles (ends at line 800)
    '',
    extract(2674, 2700),   // createModal
    '',
    extract(2701, 2740),   // S2translate
    '',
    extract(2750, 2848),   // readApiSettingsFromForm ~ showHelpModal
].join('\n'));

// 11. 翻译 & 摘要
write('translation.js', extract(2439, 2673));

// 12. 表达收藏本
write('expression.js', [
    extract(839, 1037),
    '',
    extract(1730, 1768),
].join('\n'));

// 13. 信息雷达
write('radar.js', extract(1770, 2216));

// 14. 零损分享
write('share.js', extract(1059, 1729));

// 15. 专栏文章页逻辑 (完整的 enterPostImmersive + 辅助函数)
write('page-post.js', [
    extract(802, 838),     // hideArticleAdCards + startArticleAdCleanup + stopArticleAdCleanup
    '',
    extract(5548, 5567),   // findPostCommentsNode + findPostCommentInputNode
    '',
    extract(5797, 5969),   // enterPostImmersive (完整函数，包含工具栏构建)
].join('\n'));

// 16. 问题页逻辑
write('page-question.js', [
    extract(2936, 3000),   // expandQuestionRichText ~ getAnswerText
    '',
    extract(3072, 3230),   // serializeAnswerForCache ~ getAnswerItems
    '',
    extract(3592, 3699),   // collectQuestionAnswers ~ loadMoreQuestionAndRender
    '',
    extract(3747, 3991),   // ensureImmersiveStyle ~ renderQuestionAnswer + restoreQuestionAnswerPosition
    '',
    extract(5661, 5734),   // enterQuestionImmersive
].join('\n'));

// 17. 首页推荐逻辑
write('page-home.js', [
    extract(3231, 3574),   // getHomeCacheKey ~ collectHomeFeedItems
    '',
    extract(3993, 4291),   // clearHomeTranslations ~ renderHomeItem (不含 createWikiRunConfig)
    '',
    extract(5523, 5547),   // findOriginalHomeElement + restoreHomeItemPosition
    '',
    extract(5735, 5796),   // enterHomeImmersive
].join('\n'));

// 18. Wiki 功能 (包含 createWikiRunConfig)
write('wiki.js', extract(4292, 5522));

// 19. 工具栏 & 沉浸模式进入/退出
write('toolbar.js', [
    extract(5569, 5660),   // createQuestionToolsPanel
    '',
    extract(4445, 4515),   // setOriginalPageVisibleForWiki
    '',
    extract(5976, 6090),   // toggleImmersiveMode + enterImmersive + exitImmersive
].join('\n'));

// 20. 事件监听
write('events.js', extract(6091, 6167));

console.log('\n拆分完成！共生成 ' + fs.readdirSync(SRC).length + ' 个模块文件。');
