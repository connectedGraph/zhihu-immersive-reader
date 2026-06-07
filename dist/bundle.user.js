// ==UserScript==
// @name         沉浸式知乎_让知乎成为你深度阅读、外语学习、认知提升的工具
// @namespace    https://github.com/connectedGraph
// @version      5.0.3
// @description  让知乎成为你深度阅读、外语学习、认知提升的工具
// @author       Rap
// @homepageURL  https://github.com/connectedGraph/zhihu-immersive-reader
// @supportURL   https://github.com/connectedGraph/zhihu-immersive-reader/issues
// @match        *://zhihu.com/
// @match        *://www.zhihu.com/
// @match        *://zhihu.com/follow
// @match        *://www.zhihu.com/follow
// @match        *://*.zhihu.com/question/*
// @match        *://zhuanlan.zhihu.com/p/*
// @match        *://*.zhuanlan.zhihu.com/p/*
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @connect      api.deepseek.com
// @connect      zhihu.com
// @connect      www.zhihu.com
// @connect      zhuanlan.zhihu.com
// @connect      *.zhihu.com
// @connect      html2png.dev
// @connect      *
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/573678/%E6%B2%89%E6%B5%B8%E5%BC%8F%E7%9F%A5%E4%B9%8E_%E8%AE%A9%E7%9F%A5%E4%B9%8E%E6%88%90%E4%B8%BA%E4%BD%A0%E6%B7%B1%E5%BA%A6%E9%98%85%E8%AF%BB%E3%80%81%E5%A4%96%E8%AF%AD%E5%AD%A6%E4%B9%A0%E3%80%81%E8%AE%A4%E7%9F%A5%E6%8F%90%E5%8D%87%E7%9A%84%E5%B7%A5%E5%85%B7.user.js
// @updateURL https://update.greasyfork.org/scripts/573678/%E6%B2%89%E6%B5%B8%E5%BC%8F%E7%9F%A5%E4%B9%8E_%E8%AE%A9%E7%9F%A5%E4%B9%8E%E6%88%90%E4%B8%BA%E4%BD%A0%E6%B7%B1%E5%BA%A6%E9%98%85%E8%AF%BB%E3%80%81%E5%A4%96%E8%AF%AD%E5%AD%A6%E4%B9%A0%E3%80%81%E8%AE%A4%E7%9F%A5%E6%8F%90%E5%8D%87%E7%9A%84%E5%B7%A5%E5%85%B7.meta.js
// ==/UserScript==

// ═══════════════════════════════════════════════════════════
// 模块: constants.js
// ═══════════════════════════════════════════════════════════
/**
 * ============================================================================
 * 常量定义区：所有的样式、HTML模板、默认配置均提取于此，便于维护
 * ============================================================================
 */

// ----- 主题样式变量（CSS自定义属性） -----
const THEMES = [
    { name: '📜 宣纸', vars: { '--zh-bg': '#E5DEC9', '--zh-paper': '#F8F4E6', '--zh-text': '#2b2b2b', '--zh-title': '#1a1a1a', '--zh-accent': '#8B2626', '--zh-border': '#d4cbb8', '--zh-quote': '#f0ebe1', '--zh-code': '#eae5d9', '--zh-modal-bg': '#F8F4E6' } },
    { name: '🎋 竹简', vars: { '--zh-bg': '#D6E4D0', '--zh-paper': '#EDF5EA', '--zh-text': '#2C3E2E', '--zh-title': '#1B2A1E', '--zh-accent': '#3D7A4A', '--zh-border': '#B3CCAF', '--zh-quote': '#DDE9DA', '--zh-code': '#D4E2D0', '--zh-modal-bg': '#EDF5EA' } },
    { name: '🧳 牛皮', vars: { '--zh-bg': '#D4C4A8', '--zh-paper': '#F5EBDA', '--zh-text': '#3D2E1C', '--zh-title': '#2A1A08', '--zh-accent': '#8B5E34', '--zh-border': '#C9B896', '--zh-quote': '#EDE3D1', '--zh-code': '#E8DCCA', '--zh-modal-bg': '#F5EBDA' } },
    { name: '🧛 暗血', vars: { '--zh-bg': '#0F0F0F', '--zh-paper': '#1A1A1A', '--zh-text': '#C8C8C8', '--zh-title': '#E0E0E0', '--zh-accent': '#C0392B', '--zh-border': '#2E2E2E', '--zh-quote': '#222222', '--zh-code': '#161616', '--zh-modal-bg': '#242424' } },
    { name: '⚪ 简白', vars: { '--zh-bg': '#F5F5F5', '--zh-paper': '#FFFFFF', '--zh-text': '#333333', '--zh-title': '#000000', '--zh-accent': '#0066CC', '--zh-border': '#E0E0E0', '--zh-quote': '#F8F8F8', '--zh-code': '#F5F5F5', '--zh-modal-bg': '#FFFFFF' } }
];

// 自定义主题：localStorage 键 + 各 CSS 变量对应 UI 部位的中文指引
const CUSTOM_THEMES_KEY = 'zh-immersive-custom-themes-v1';
const THEME_VAR_GUIDE = [
    { key: '--zh-bg', label: '页面背景', desc: '整个页面最外层的底色', def: '#E5DEC9' },
    { key: '--zh-paper', label: '卡片/纸张', desc: '文章正文、卡片、弹窗的纸面色', def: '#F8F4E6' },
    { key: '--zh-text', label: '正文文字', desc: '正文与大部分文本颜色', def: '#2b2b2b' },
    { key: '--zh-title', label: '标题文字', desc: '大标题 H1/H2 与加粗标题色', def: '#1a1a1a' },
    { key: '--zh-accent', label: '强调色', desc: '主色：边框线、按钮高亮、激活态、链接', def: '#8B2626' },
    { key: '--zh-border', label: '边框/分隔线', desc: '卡片边框、虚线分隔线', def: '#d4cbb8' },
    { key: '--zh-quote', label: '引用/浅底块', desc: '引用块、开关轨道、浅色背景块', def: '#f0ebe1' },
    { key: '--zh-code', label: '代码块底色', desc: '代码块 / Wiki 输出区底色', def: '#eae5d9' },
    { key: '--zh-modal-bg', label: '弹窗背景', desc: '设置等模态弹窗的背景色', def: '#F8F4E6' }
];

// ----- 默认配置 -----
const DEFAULT_CONFIG = {
    apiHost: 'https://api.deepseek.com/v1',
    apiKey: '',
    apiModel: 'deepseek-chat',
    targetLang: 'English',
    radarInterestTags: 'AI工具、提示词工程、LLM训练、GitHub精选',
    autoSum: false,
    autoTr: false,
    autoHideImages: false,
    imageMode: 'preview',
    shareExportFormat: 'svg',
    answerPreviewMode: 'excerpt',
    wikiMaxItems: 100,
    wikiConcurrency: 20,
    wikiRpm: 300,
    wikiFinalSynthesis: true,
    wikiObsidianOptimized: false,
    embeddingHost: '',
    embeddingModel: 'text-embedding-3-small',
    embeddingKey: '',
    defaultCollectionId: ''
};

const EXPORT_HIDDEN_SELECTORS = [
    '.AppHeader',
    '.GlobalSideBar',
    '.CornerButtons',
    '#zh-tools-panel',
    '#immersive-exit-btn',
    '.zh-modal-overlay',
    '.CatalogBtn',
    '[aria-label="目录"]',
    '.css-u56wtg',
    '.FollowButton',
    '.Reward',
    '.Button',
    '.Popover',
    '.ContentItem-more',
    '.RichContent-collapsedText',
    '.zh-export-hidden',
    '.zh-tr-actions',
    '.zh-tr-regen-btn',
    '.zh-question-toolbar',
    '.zh-home-toolbar',
    '.zh-reader-top-nav',
    '.zh-wiki-actions',
    '.zh-wiki-history-actions',
    '.zh-radar-actions',
    '.zh-radar-generate-btn',
    '.pc-article-answer-text-chain',
    '.pc-article-answer:has(.pc-article-answer-card)',
    '.ecommerce-ad-box',
    '.MCNLinkCard',
    '.zh-hidden-by-immersive-inner',
    '.zh-hidden-by-immersive'
];

// ----- 工具栏按钮的 SVG 图标 (常量) -----
const ICONS = {
    translate: `<svg viewBox="0 0 24 24"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`,
    help: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>`,
    theme: `<svg viewBox="0 0 24 24"><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.21-.64-1.67-.08-.09-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zm-4 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.5-4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm4.5 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.5 4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>`,
    expression: `<svg viewBox="0 0 24 24"><path d="M5 4.75C5 3.78 5.78 3 6.75 3h10.5C18.22 3 19 3.78 19 4.75v15.38c0 .64-.73 1-1.24.62L12 16.45l-5.76 4.3A.75.75 0 0 1 5 20.13V4.75zm3 3.5A.75.75 0 0 0 8.75 9h6.5a.75.75 0 0 0 0-1.5h-6.5A.75.75 0 0 0 8 8.25zm0 3A.75.75 0 0 0 8.75 12h4.5a.75.75 0 0 0 0-1.5h-4.5A.75.75 0 0 0 8 11.25z"/></svg>`,
    radar: `<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-9 9 .75.75 0 0 0 1.5 0 7.5 7.5 0 1 1 3.24 6.17.75.75 0 0 0-.86 1.23A9 9 0 1 0 12 3zm0 3a6 6 0 0 0-6 6 .75.75 0 0 0 1.5 0 4.5 4.5 0 1 1 1.94 3.7.75.75 0 1 0-.86 1.23A6 6 0 1 0 12 6zm0 3a3 3 0 0 0-3 3 .75.75 0 0 0 1.5 0 1.5 1.5 0 1 1 .65 1.23.75.75 0 0 0-.86 1.23A3 3 0 1 0 12 9zm0 2.25a.75.75 0 0 0-.53 1.28l-8.25 8.25a.75.75 0 1 0 1.06 1.06l8.25-8.25A.75.75 0 0 0 12 11.25z"/></svg>`,
    share: `<svg viewBox="0 0 24 24"><path d="M15.5 5.25a3.25 3.25 0 1 1 .92 2.26l-7.24 4.14a3.36 3.36 0 0 1 0 .7l7.24 4.14a3.25 3.25 0 1 1-.75 1.3l-7.24-4.14a3.25 3.25 0 1 1 0-3.3l7.24-4.14a3.24 3.24 0 0 1-.17-.96z"/></svg>`,
    wiki: `<svg viewBox="0 0 24 24"><path d="M4.75 3A2.75 2.75 0 0 0 2 5.75v11.5A2.75 2.75 0 0 0 4.75 20H11a2 2 0 0 1 2 2 .75.75 0 0 0 1.5 0 2 2 0 0 1 2-2h2.75A2.75 2.75 0 0 0 22 17.25V5.75A2.75 2.75 0 0 0 19.25 3H16.5A3.5 3.5 0 0 0 13 6.5V18a3.48 3.48 0 0 0-2-.63H4.75c-.69 0-1.25-.56-1.25-1.25V5.75c0-.69.56-1.25 1.25-1.25H11a2 2 0 0 1 2 2 .75.75 0 0 0 1.5 0A2 2 0 0 1 16.5 4.5h2.75c.69 0 1.25.56 1.25 1.25v11.5c0 .69-.56 1.25-1.25 1.25H16.5a3.48 3.48 0 0 0-2 .63V6.5A3.5 3.5 0 0 0 11 3H4.75z"/></svg>`,
    github: `<svg viewBox="0 0 24 24"><path d="M12 2.25A9.75 9.75 0 0 0 8.92 21.25c.49.09.67-.21.67-.47v-1.72c-2.72.59-3.3-1.16-3.3-1.16-.44-1.13-1.08-1.43-1.08-1.43-.89-.6.07-.59.07-.59.98.07 1.5 1.01 1.5 1.01.87 1.49 2.28 1.06 2.84.81.09-.63.34-1.06.62-1.31-2.17-.25-4.45-1.09-4.45-4.83 0-1.07.38-1.94 1.01-2.62-.1-.25-.44-1.24.1-2.58 0 0 .83-.26 2.7 1a9.3 9.3 0 0 1 4.92 0c1.87-1.26 2.69-1 2.69-1 .54 1.34.2 2.33.1 2.58.63.68 1.01 1.55 1.01 2.62 0 3.75-2.28 4.58-4.46 4.82.35.3.67.91.67 1.83v2.56c0 .26.18.57.68.47A9.75 9.75 0 0 0 12 2.25z"/></svg>`,
    regenerate: `<svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.45 10.93.75.75 0 0 0-1.39-.56A6.5 6.5 0 1 1 12 5.5c1.8 0 3.43.73 4.61 1.91L14.75 9.25H20V4l-2.35 2.35z"/></svg>`,
    speak: `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`,
    speakStop: `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/><path d="M19.5 4.5L18 6l4.5 6-4.5 6 1.5 1.5L24 12z" fill="currentColor" opacity="0.7"/></svg>`,
    toread: `<svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`
};

// ═══════════════════════════════════════════════════════════
// 模块: styles.js
// ═══════════════════════════════════════════════════════════
// ----- 核心样式 (动态注入的 <style> 内容) -----
const STYLE_CSS = `
    body { background-color: var(--zh-bg) !important; margin: 0; padding: 50px 0; font-family: 'Times New Roman', 'KaiTi', 'STKaiti', serif !important; transition: background-color 0.5s ease !important; }
    .AppHeader, .ColumnPageHeader, .Post-StickyBar, .Sticky, .BottomActions, .CornerButtons, .GlobalSideBar, .css-1nalqj2, .zh-hidden-by-immersive { display: none !important; position: static !important; visibility: hidden !important; }
    #immersive-wrapper { position: relative; max-width: 760px; margin: 0 auto; padding: 60px 80px; background-color: var(--zh-paper) !important; border-radius: 4px; box-shadow: 0 4px 25px rgba(0,0,0,0.06); color: var(--zh-text) !important; line-height: 2.2; font-size: 18px; border-left: 2px solid var(--zh-accent) !important; border-right: 1px solid var(--zh-border) !important; display: block !important; transition: all 0.5s ease !important; }
    #immersive-wrapper h1, #immersive-wrapper h2, #immersive-wrapper h3 { font-weight: bold; color: var(--zh-title) !important; border-bottom: 1px dashed var(--zh-border) !important; padding-bottom: 12px; margin-top: 1.5em; }
    #immersive-wrapper blockquote { border-left: 4px solid var(--zh-accent) !important; background: var(--zh-quote) !important; color: var(--zh-text) !important; padding: 15px 20px !important; margin: 20px 0 !important; }
    #immersive-wrapper a { color: var(--zh-accent) !important; text-decoration: none !important; border-bottom: 1px solid var(--zh-accent) !important; }
    #immersive-wrapper pre {background-color: var(--zh-code) !important;font-family: Consolas, monospace !important;font-size: inherit !important;padding: 1em 1.2em !important;border-radius: 6px !important;overflow-x: auto !important;line-height: 1.5 !important;}#immersive-wrapper pre code {background-color: transparent !important;padding: 0 !important;font-family: inherit !important;font-size: inherit !important;}#immersive-wrapper code:not(pre code) {background-color: var(--zh-code) !important;font-family: Consolas, monospace !important;font-size: inherit !important;padding: 0.2em 0.4em !important;border-radius: 3px !important;}
    #immersive-wrapper img { border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 100%; height: auto; cursor: zoom-out; }
    #immersive-wrapper img.zh-img-hidden { display: none !important; }
    /* 主动隐藏图片时，收缩 zhihu 懒加载图外层容器预留的空白高度（保留占位 chip） */
    #immersive-wrapper figure:has(> img.zh-img-hidden), #immersive-wrapper figure:has(> img.zh-img-hidden:only-child) { min-height: 0 !important; height: auto !important; margin: 8px 0 !important; }
    #immersive-wrapper figure:has(img.zh-img-hidden) > div, #immersive-wrapper span:has(> img.zh-img-hidden) { min-height: 0 !important; height: auto !important; padding-bottom: 0 !important; }
    .zh-img-placeholder { min-height: 32px; margin: 8px 0; padding: 6px 12px; border: 1px dashed var(--zh-border); border-radius: 4px; background: var(--zh-quote); color: var(--zh-text); display: inline-flex; align-items: center; gap: 6px; cursor: pointer; opacity: 0.7; font-size: 13px; transition: all 0.2s ease; }
    .zh-img-placeholder:hover { border-color: var(--zh-accent); color: var(--zh-accent); opacity: 1; }
    .zh-img-placeholder svg { flex-shrink: 0; stroke: currentColor; }
    .zh-img-preview-overlay { position: fixed; inset: 0; z-index: 99999999; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; cursor: pointer; animation: zh-page-enter 0.2s ease-out; }
    .zh-img-preview-img { max-width: 90vw; max-height: 90vh; border-radius: 6px; object-fit: contain; box-shadow: 0 8px 40px rgba(0,0,0,0.5); }
    .zh-context-menu { position: fixed; min-width: 150px; padding: 6px; background: var(--zh-modal-bg); border: 1px solid var(--zh-accent); border-radius: 4px; color: var(--zh-text); box-shadow: 0 8px 24px rgba(0,0,0,0.22); z-index: 99999999; font-family: 'KaiTi', serif; font-size: 15px; }
    .zh-context-menu-item { padding: 8px 12px; border-radius: 3px; cursor: pointer; user-select: none; white-space: nowrap; }
    .zh-context-menu-item:hover { background: var(--zh-accent); color: var(--zh-paper); }
    .zh-question-title { margin: 0 0 18px !important; padding-bottom: 16px !important; border-bottom: 2px solid var(--zh-accent) !important; font-size: 30px !important; line-height: 1.45 !important; letter-spacing: 0 !important; }
    .zh-question-detail { margin: 0 0 30px; border: 1px dashed var(--zh-border); background: var(--zh-quote); border-radius: 4px; padding: 0 16px; }
    .zh-question-detail summary { cursor: pointer; color: var(--zh-accent); font-weight: bold; padding: 12px 0; }
    .zh-question-detail-body { padding: 0 0 16px; }
    .zh-question-toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0 28px; }
    .zh-reader-top-nav { position: absolute; top: 18px; right: 18px; z-index: 3; max-width: 270px; display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 6px; margin: 0 !important; padding: 6px 7px; border: 1px solid var(--zh-border); border-radius: 4px; background: var(--zh-paper); box-shadow: 0 4px 14px rgba(0,0,0,0.08); font-size: 12px; line-height: 1.2; opacity: 0.94; }
    .zh-reader-top-nav .zh-inline-btn { height: 24px; padding: 0 8px; font-size: 12px; line-height: 1.2; display: inline-flex; align-items: center; justify-content: center; }
    .zh-reader-top-nav .zh-nav-current { display: inline-flex; align-items: center; color: var(--zh-accent); font-weight: bold; padding: 4px 2px; white-space: nowrap; }
    .zh-has-top-nav .zh-question-title, .zh-has-top-nav .zh-home-title { padding-right: 290px !important; }
    .zh-inline-btn { display: inline-flex; align-items: center; justify-content: center; height: 34px; padding: 0 14px; border: 1px solid var(--zh-accent); border-radius: 4px; background: var(--zh-paper); color: var(--zh-accent); cursor: pointer; font-family: inherit; font-size: 14px; box-sizing: border-box; transition: all 0.15s ease; outline: none; }
    .zh-inline-btn:hover { background: var(--zh-accent); color: var(--zh-paper); }
    .zh-collect-status { margin: 24px 0; padding: 14px 18px; border-left: 4px solid var(--zh-accent); background: var(--zh-quote); color: var(--zh-text); }
    .zh-answer-list { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
    .zh-answer-list-item { border: 1px solid var(--zh-border); border-radius: 4px; padding: 14px 16px; background: rgba(255,255,255,0.18); cursor: pointer; transition: border-color 0.2s ease, transform 0.2s ease; }
    .zh-answer-list-item:hover { border-color: var(--zh-accent); transform: translateY(-1px); }
    .zh-answer-list-meta { color: var(--zh-accent); font-size: 0.9em; margin-bottom: 6px; }
    .zh-answer-list-snippet { line-height: 1.7; }
    .zh-home-title { margin: 0 0 14px !important; padding-bottom: 12px !important; border-bottom: 2px solid var(--zh-accent) !important; font-size: 26px !important; line-height: 1.4 !important; letter-spacing: 0 !important; }

    /* 首页/关注 切换头：H1 与开关同行，右上角 */
    .zh-feed-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin: 0 0 14px !important; padding-bottom: 12px; border-bottom: 2px solid var(--zh-accent); }
    .zh-feed-head .zh-home-title { margin: 0 !important; padding-bottom: 0 !important; border-bottom: none !important; }
    .zh-feed-switch { display: inline-flex; align-items: center; padding: 3px; border: 1px solid var(--zh-border); border-radius: 999px; background: var(--zh-quote); flex-shrink: 0; }
    .zh-feed-switch-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 16px; border: none; border-radius: 999px; background: transparent; color: var(--zh-text); opacity: 0.7; cursor: pointer; font-family: inherit; font-size: 14px; line-height: 1.2; white-space: nowrap; transition: all 0.2s ease; }
    .zh-feed-switch-btn:hover:not(.is-active) { opacity: 1; color: var(--zh-accent); }
    .zh-feed-switch-btn.is-active { background: var(--zh-accent); color: #fff; opacity: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
    .zh-feed-switch-btn svg { width: 15px; height: 15px; }

    /* 首页宽屏工作台布局 */
    #immersive-wrapper.zh-home-wide { max-width: 1200px; padding: 24px 48px 40px; margin-top: -30px; border-left: none !important; border-right: none !important; box-shadow: none; background: transparent !important; }
    .zh-home-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 20px; }
    .zh-home-grid.zh-home-grid-single { grid-template-columns: 1fr; max-width: 760px; margin-left: auto; margin-right: auto; }
    .zh-home-grid-single .zh-home-card { padding: 20px 24px; gap: 10px; }
    .zh-home-grid-single .zh-home-card-title { font-size: 18px; }
    .zh-home-grid-single .zh-home-card-snippet { font-size: 15px; -webkit-line-clamp: 3; }
    .zh-home-card { border: 1px solid var(--zh-border); border-radius: 8px; padding: 16px 18px; background: var(--zh-paper); cursor: pointer; transition: border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease; display: flex; flex-direction: column; gap: 8px; }
    .zh-home-card:hover { border-color: var(--zh-accent); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
    .zh-home-card-title { font-size: 17px; font-weight: bold; color: var(--zh-title); line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .zh-home-card-meta { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--zh-accent); opacity: 0.85; flex-wrap: wrap; line-height: 1.4; }
    .zh-home-card-meta img { width: 20px; height: 20px; border-radius: 3px; object-fit: cover; flex-shrink: 0; }
    .zh-home-card-snippet { font-size: 14px; color: var(--zh-text); opacity: 0.6; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0; }
    .zh-home-card-type { display: inline-block; font-size: 11px; padding: 1px 5px; border-radius: 3px; background: var(--zh-quote); color: var(--zh-accent); border: 1px solid var(--zh-border); white-space: nowrap; }

    /* 首页导航工具栏 */
    .zh-home-toolbar { display: flex; align-items: center; gap: 8px; margin: 0 0 8px; flex-wrap: wrap; }
    .zh-home-nav-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border: 1px solid var(--zh-border); border-radius: 6px; background: var(--zh-paper); color: var(--zh-text); cursor: pointer; font-family: inherit; font-size: 13px; transition: all 0.15s ease; }
    .zh-home-nav-btn:hover:not(:disabled) { border-color: var(--zh-accent); color: var(--zh-accent); background: var(--zh-quote); }
    .zh-home-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .zh-home-nav-icon { font-size: 16px; font-weight: bold; line-height: 1; }
    .zh-home-nav-indicator { font-size: 13px; color: var(--zh-text); opacity: 0.6; padding: 0 4px; white-space: nowrap; }
    .zh-home-layout-btn { margin-left: auto; }
    .zh-toread-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; padding: 0; border-radius: 6px; margin-left: auto; }
    .zh-toread-btn svg { fill: none; stroke: currentColor; stroke-width: 2; width: 16px; height: 16px; }
    .zh-toread-btn.zh-btn-active svg { fill: currentColor; }

    @media (max-width: 860px) { .zh-home-grid { grid-template-columns: 1fr; } #immersive-wrapper.zh-home-wide { max-width: none; padding: 24px 16px; } }

    /* 关注动态：推特式时间线 */
    #immersive-wrapper.zh-follow-wide { max-width: 640px; padding: 24px 0 60px; margin-top: -30px; border-left: none !important; border-right: none !important; box-shadow: none; background: transparent !important; }
    #immersive-wrapper.zh-follow-wide.zh-follow-double { max-width: 1100px; }
    .zh-follow-timeline { display: flex; flex-direction: column; gap: 14px; margin-top: 18px; animation: zh-page-enter 0.25s ease-out; }
    .zh-follow-timeline.zh-follow-grid { display: grid; grid-template-columns: repeat(2, 1fr); align-items: stretch; }
    .zh-follow-grid .zh-moment { height: 220px; display: flex; flex-direction: column; overflow: hidden; }
    .zh-follow-grid .zh-moment-card { flex: 1; min-height: 0; }
    .zh-follow-grid .zh-moment-snippet { -webkit-line-clamp: 5; }
    .zh-moment { border: 1px solid var(--zh-border); border-radius: 12px; background: var(--zh-paper); padding: 16px 18px; cursor: pointer; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
    .zh-moment:hover { border-color: var(--zh-accent); box-shadow: 0 4px 18px rgba(0,0,0,0.07); }
    .zh-moment-action { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--zh-accent); opacity: 0.9; margin-bottom: 10px; line-height: 1.4; }
    .zh-moment-action img { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .zh-moment-action b { color: var(--zh-title); font-weight: bold; }
    .zh-moment-verb { display: inline-block; font-size: 11px; padding: 1px 6px; border-radius: 10px; background: var(--zh-quote); color: var(--zh-accent); border: 1px solid var(--zh-border); white-space: nowrap; }
    .zh-moment-card { border-left: 3px solid var(--zh-border); padding-left: 12px; }
    .zh-moment-title { font-size: 16px; font-weight: bold; color: var(--zh-title); line-height: 1.5; margin: 0 0 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .zh-moment-snippet { font-size: 14px; color: var(--zh-text); opacity: 0.7; line-height: 1.7; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    @media (max-width: 700px) { #immersive-wrapper.zh-follow-wide { max-width: none; padding: 24px 12px 60px; } .zh-follow-timeline.zh-follow-grid { grid-template-columns: 1fr; } }

    /* 页面切换动画 */
    @keyframes zh-page-enter { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    .zh-page-enter { animation: zh-page-enter 0.3s ease-out; }
    .zh-home-grid { animation: zh-page-enter 0.25s ease-out; }

    .zh-wiki-progress { margin: 20px 0; padding: 14px 18px; border-left: 4px solid var(--zh-accent); background: var(--zh-quote); color: var(--zh-text); line-height: 1.8; }
    .zh-wiki-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 14px 0 20px; }
    .zh-wiki-output { white-space: pre-wrap; word-break: break-word; font-family: Consolas, 'Microsoft YaHei', monospace; font-size: 14px; line-height: 1.75; background: var(--zh-code); border: 1px solid var(--zh-border); border-radius: 4px; padding: 16px; max-height: 70vh; overflow: auto; }
    .zh-wiki-rendered { white-space: normal; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif; font-size: 15px; line-height: 1.8; max-height: none; background: var(--zh-paper); padding: 24px 28px; }
    .zh-wiki-rendered h1, .zh-wiki-rendered h2, .zh-wiki-rendered h3, .zh-wiki-rendered h4 { color: var(--zh-title); margin: 1.2em 0 0.6em; line-height: 1.4; }
    .zh-wiki-rendered h1 { font-size: 1.6em; border-bottom: 2px solid var(--zh-accent); padding-bottom: 8px; }
    .zh-wiki-rendered h2 { font-size: 1.35em; border-bottom: 1px solid var(--zh-border); padding-bottom: 6px; }
    .zh-wiki-rendered h3 { font-size: 1.15em; }
    .zh-wiki-rendered p { margin: 0.7em 0; }
    .zh-wiki-rendered ul, .zh-wiki-rendered ol { padding-left: 1.6em; margin: 0.5em 0; }
    .zh-wiki-rendered li { margin: 0.3em 0; }
    .zh-wiki-rendered a { color: var(--zh-link, #a13d3d); text-decoration: none; border-bottom: 1px dashed currentColor; }
    .zh-wiki-rendered a:hover { opacity: 0.8; }
    .zh-wiki-rendered code { background: var(--zh-code); padding: 2px 5px; border-radius: 3px; font-family: Consolas, monospace; font-size: 0.9em; }
    .zh-wiki-rendered strong { color: var(--zh-title); }
    .zh-wiki-rendered hr { border: none; border-top: 1px dashed var(--zh-border); margin: 1.5em 0; }
    .zh-wiki-history { margin: 18px 0; border-top: 1px dashed var(--zh-border); padding-top: 16px; }
    .zh-wiki-history h3 { margin: 0 0 12px !important; font-size: 18px !important; }
    .zh-wiki-history-list { display: flex; flex-direction: column; gap: 10px; }
    .zh-wiki-history-item { border: 1px solid var(--zh-border); background: var(--zh-quote); border-radius: 4px; padding: 12px 14px; line-height: 1.7; }
    .zh-wiki-history-main { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
    .zh-wiki-history-title { font-weight: bold; color: var(--zh-title); }
    .zh-wiki-history-meta { font-size: 13px; opacity: 0.78; }
    .zh-wiki-history-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .zh-wiki-log { max-height: 240px; overflow: auto; background: var(--zh-code); border: 1px solid var(--zh-border); border-radius: 4px; padding: 10px 12px; margin-top: 10px; font-size: 13px; line-height: 1.65; white-space: pre-wrap; word-break: break-word; }

    /* Wiki 搜索与标签面板 */
    .zh-wiki-search-bar { display: flex; gap: 10px; margin: 16px 0; align-items: center; }
    .zh-wiki-search-bar input { flex: 1; padding: 10px 14px; border: 1px solid var(--zh-border); border-radius: 6px; background: var(--zh-code); color: var(--zh-text); font-size: 15px; font-family: inherit; outline: none; }
    .zh-wiki-search-bar input:focus { border-color: var(--zh-accent); }
    .zh-wiki-search-bar button { padding: 10px 16px; border: 1px solid var(--zh-accent); border-radius: 6px; background: var(--zh-paper); color: var(--zh-accent); cursor: pointer; font-family: inherit; font-size: 14px; white-space: nowrap; }
    .zh-wiki-search-bar button:hover { background: var(--zh-accent); color: var(--zh-paper); }
    .zh-wiki-tag-cloud { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 18px; padding: 12px; border: 1px dashed var(--zh-border); border-radius: 6px; background: var(--zh-quote); }
    .zh-wiki-tag-chip { display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px; border-radius: 14px; font-size: 13px; cursor: pointer; border: 1px solid var(--zh-border); background: var(--zh-paper); color: var(--zh-text); transition: all 0.15s ease; }
    .zh-wiki-tag-chip:hover { border-color: var(--zh-accent); color: var(--zh-accent); }
    .zh-wiki-tag-chip.active { background: var(--zh-accent); color: var(--zh-paper); border-color: var(--zh-accent); }
    .zh-wiki-tag-chip .zh-tag-count { font-size: 11px; opacity: 0.7; }
    .zh-wiki-card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 16px; }
    .zh-wiki-card-grid .zh-home-card { position: relative; }
    .zh-wiki-card-grid .zh-wiki-card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
    .zh-wiki-card-grid .zh-wiki-card-tag { display: inline-block; font-size: 11px; padding: 2px 7px; border-radius: 10px; background: var(--zh-quote); color: var(--zh-accent); border: 1px solid var(--zh-border); }
    .zh-wiki-card-grid .zh-wiki-card-type-badge { position: absolute; top: 12px; right: 14px; font-size: 11px; padding: 2px 8px; border-radius: 3px; background: var(--zh-accent); color: var(--zh-paper); opacity: 0.85; }
    
    /* Wiki 卡片详情模态框样式 */
    .zh-wiki-detail-modal { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: var(--zh-text); padding: 5px 10px; }
    .zh-wiki-detail-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .zh-wiki-detail-type { font-size: 12px; font-weight: bold; padding: 3px 8px; border-radius: 4px; background: var(--zh-accent); color: var(--zh-paper); }
    .zh-wiki-detail-date { font-size: 12px; opacity: 0.6; }
    .zh-wiki-detail-title { font-size: 20px; font-weight: bold; color: var(--zh-title); margin: 0 0 10px 0; line-height: 1.4; }
    .zh-wiki-detail-title a { color: inherit !important; text-decoration: none !important; border-bottom: none !important; display: inline-flex; align-items: center; gap: 4px; }
    .zh-wiki-detail-title a:hover { color: var(--zh-accent) !important; }
    .zh-wiki-detail-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; }
    .zh-wiki-detail-tag { font-size: 11px; padding: 2px 8px; border-radius: 12px; background: var(--zh-quote); color: var(--zh-accent); border: 1px solid var(--zh-border); }
    .zh-wiki-detail-hr { border: none; border-top: 1px dashed var(--zh-border); margin: 16px 0; }
    .zh-wiki-detail-section { margin-bottom: 18px; }
    .zh-wiki-detail-section-title { font-size: 13px; font-weight: bold; color: var(--zh-accent); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
    .zh-wiki-detail-section-title::before { content: ''; display: inline-block; width: 4px; height: 12px; background: var(--zh-accent); border-radius: 2px; }
    .zh-wiki-detail-one-sentence { font-size: 15px; font-weight: 500; color: var(--zh-title); background: var(--zh-quote); border-left: 3px solid var(--zh-accent); padding: 8px 12px; border-radius: 0 4px 4px 0; }
    .zh-wiki-detail-list { margin: 0; padding-left: 20px; }
    .zh-wiki-detail-list li { font-size: 14px; margin-bottom: 6px; color: var(--zh-text); }
    .zh-wiki-detail-meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-top: 20px; padding-top: 16px; border-top: 1px dashed var(--zh-border); }
    .zh-wiki-detail-meta-box { display: flex; flex-direction: column; gap: 6px; }
    .zh-wiki-detail-credibility-row { display: flex; align-items: flex-start; gap: 8px; margin-top: 4px; }
    .zh-wiki-detail-credibility-level { font-size: 11px; font-weight: bold; padding: 2px 6px; border-radius: 3px; white-space: nowrap; display: inline-block; }
    .zh-wiki-detail-credibility-level.high { background: #e2f9e9; color: #1e7e34; }
    .zh-wiki-detail-credibility-level.medium { background: #fff3cd; color: #856404; }
    .zh-wiki-detail-credibility-level.low { background: #f8d7da; color: #721c24; }
    .zh-wiki-detail-credibility-level.verify { background: #e2f0d9; color: #385723; }
    .zh-wiki-detail-credibility-notes { font-size: 13px; color: var(--zh-text); opacity: 0.85; line-height: 1.45; }
    .zh-wiki-detail-reflection { font-size: 13px; color: var(--zh-text); background: var(--zh-quote); padding: 8px 12px; border-radius: 4px; border: 1px dashed var(--zh-border); font-style: italic; line-height: 1.45; }
    .zh-wiki-detail-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--zh-border); }
    .zh-wiki-detail-btn-delete { padding: 6px 12px; border: 1px solid #dc3545; border-radius: 4px; background: transparent; color: #dc3545; cursor: pointer; font-family: inherit; font-size: 13px; transition: all 0.15s ease; outline: none; }
    .zh-wiki-detail-btn-delete:hover { background: #dc3545; color: #fff; }
    .zh-wiki-detail-btn-primary { padding: 6px 16px; border: 1px solid var(--zh-accent); border-radius: 4px; background: var(--zh-accent); color: var(--zh-paper); cursor: pointer; font-family: inherit; font-size: 13px; font-weight: bold; transition: all 0.15s ease; outline: none; }
    .zh-wiki-detail-btn-primary:hover { opacity: 0.9; }

    /* Obsidian Callouts 网页渲染样式 */
    .zh-callout { margin: 16px 0; border: 1px solid var(--zh-border); border-left: 4px solid var(--zh-accent); border-radius: 4px; background: var(--zh-quote); overflow: hidden; font-family: inherit; }
    .zh-callout-title { display: flex; align-items: center; gap: 8px; padding: 10px 14px; font-weight: bold; background: rgba(0,0,0,0.03); color: var(--zh-title); border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 14px; }
    .zh-callout-icon { font-size: 16px; display: inline-flex; align-items: center; }
    .zh-callout-content { padding: 12px 14px; font-size: 14px; color: var(--zh-text); }
    .zh-callout-content p { margin: 0 0 8px 0; }
    .zh-callout-content p:last-child { margin-bottom: 0; }
    .zh-callout-content li { margin-left: 14px; margin-bottom: 4px; list-style-type: disc; }
    
    /* Callout 变体配色 */
    .zh-callout-info { border-left-color: #007acc; }
    .zh-callout-summary { border-left-color: #2e8b57; }
    .zh-callout-todo { border-left-color: #7a5cd8; }
    .zh-callout-example { border-left-color: #a855f7; }
    .zh-callout-tip { border-left-color: #eab308; }
    .zh-callout-brain { border-left-color: #a16207; }
    .zh-callout-warning { border-left-color: #ea580c; }
    .zh-callout-quote { border-left-color: #64748b; }

    @media (max-width: 860px) { .zh-wiki-card-grid { grid-template-columns: 1fr; } }

    .zh-question-answer-view .Reward, .zh-question-answer-view .FollowButton { display: none !important; }
    .zh-question-answer-view .RichContent { line-height: inherit !important; }
    #immersive-wrapper img.Avatar, #immersive-wrapper .Avatar img, #immersive-wrapper .AuthorInfo-avatarWrapper img, #immersive-wrapper .zh-answer-list-meta img { width: 36px !important; height: 36px !important; min-width: 36px !important; min-height: 36px !important; max-width: 36px !important; max-height: 36px !important; aspect-ratio: 1 / 1 !important; object-fit: cover !important; border-radius: 5px !important; box-shadow: none !important; cursor: default !important; flex: 0 0 36px !important; }
    #immersive-wrapper .AuthorInfo img.Avatar, #immersive-wrapper .AuthorInfo .Avatar img, #immersive-wrapper .AnswerItem-authorInfo img.Avatar, #immersive-wrapper .AnswerItem-authorInfo .Avatar img { width: 40px !important; height: 40px !important; min-width: 40px !important; min-height: 40px !important; max-width: 40px !important; max-height: 40px !important; flex-basis: 40px !important; }
    #immersive-wrapper .zh-answer-list-meta img, #immersive-wrapper .Comments-container img.Avatar, #immersive-wrapper .Comments-container .Avatar img, #immersive-wrapper .Comments-container .Avatar { width: 32px !important; height: 32px !important; min-width: 32px !important; min-height: 32px !important; max-width: 32px !important; max-height: 32px !important; aspect-ratio: 1 / 1 !important; object-fit: cover !important; border-radius: 5px !important; flex: 0 0 32px !important; align-self: flex-start !important; }
    .ContentItem-actions { border-top: 1px dashed var(--zh-border) !important; padding-top: 20px !important; }

    /* 复制 Markdown 按钮 */
    .zh-copy-md-container { position: fixed; top: 20px; right: 80px; z-index: 999998; display: flex; align-items: stretch; border-radius: 6px; overflow: visible; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .zh-copy-md-btn { display: inline-flex; align-items: center; gap: 5px; padding: 7px 12px; background: var(--zh-paper); border: 1px solid var(--zh-border); border-right: none; border-radius: 6px 0 0 6px; color: var(--zh-text); font-size: 13px; cursor: pointer; font-family: inherit; transition: all 0.15s ease; white-space: nowrap; }
    .zh-copy-md-btn:hover { border-color: var(--zh-accent); color: var(--zh-accent); }
    .zh-copy-md-btn svg { stroke: currentColor; flex-shrink: 0; }
    .zh-copy-md-drop { display: inline-flex; align-items: center; padding: 7px 6px; background: var(--zh-paper); border: 1px solid var(--zh-border); border-radius: 0 6px 6px 0; color: var(--zh-text); cursor: pointer; transition: all 0.15s ease; }
    .zh-copy-md-drop:hover { border-color: var(--zh-accent); color: var(--zh-accent); }
    .zh-copy-md-menu { position: absolute; top: 100%; right: 0; margin-top: 4px; background: var(--zh-paper); border: 1px solid var(--zh-border); border-radius: 6px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); display: none; min-width: 180px; overflow: hidden; }
    .zh-copy-md-menu-show { display: block; }
    .zh-copy-md-option { padding: 10px 14px; font-size: 13px; color: var(--zh-text); cursor: pointer; transition: background 0.1s; white-space: nowrap; }
    .zh-copy-md-option:hover { background: var(--zh-quote); color: var(--zh-accent); }
    .zh-ui-hidden .zh-copy-md-container { display: none !important; }

    /* API 推送流作者信息 - 覆盖全局 Avatar 规则 */
    .zh-api-author { display: flex !important; align-items: center !important; gap: 10px !important; margin: 8px 0 16px !important; }
    .zh-api-author .zh-api-avatar { width: 36px !important; height: 36px !important; min-width: 36px !important; max-width: 36px !important; min-height: 36px !important; max-height: 36px !important; border-radius: 5px !important; object-fit: cover !important; box-shadow: none !important; cursor: default !important; flex: 0 0 36px !important; margin: 0 !important; }
    .zh-api-author .zh-api-author-text { flex: 1; min-width: 0; line-height: 1.5; }
    #immersive-wrapper .ContentItem-actions { display: flex !important; visibility: visible !important; opacity: 1 !important; position: static !important; bottom: auto !important; box-shadow: none !important; background: transparent !important; margin-top: 28px !important; flex-wrap: wrap !important; gap: 8px !important; }
    #immersive-wrapper .zh-space-hidden { display: none !important; }
    /* Action bar 按钮 */
    .zh-api-action-bar { display: flex !important; flex-wrap: wrap !important; gap: 8px !important; align-items: center !important; margin-top: 20px !important; padding-top: 14px !important; border-top: 1px dashed var(--zh-border) !important; }
    .zh-action-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border: 1px solid var(--zh-border); border-radius: 4px; background: var(--zh-paper); color: var(--zh-text); cursor: pointer; font-family: inherit; font-size: 13px; line-height: 1.3; text-decoration: none !important; transition: all 0.15s ease; white-space: nowrap; }
    .zh-action-btn:hover { border-color: var(--zh-accent); color: var(--zh-accent); }
    .zh-action-btn.is-active { background: var(--zh-accent); color: var(--zh-paper); border-color: var(--zh-accent); }
    .zh-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .zh-action-vote-up.is-active { background: #0066ff; border-color: #0066ff; color: #fff; }
    .zh-action-vote-down.is-active { background: #f56c6c; border-color: #f56c6c; color: #fff; }
    #immersive-wrapper .pc-article-answer-text-chain, #immersive-wrapper .pc-article-answer-big-img, #immersive-wrapper .ecommerce-ad-box, #immersive-wrapper .MCNLinkCard, #immersive-wrapper .RichText-MCNLinkCardContainer { display: none !important; }
    
    @keyframes zh-spin { 100% { transform: rotate(360deg); } }
    .zh-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--zh-accent); border-top-color: transparent; border-radius: 50%; animation: zh-spin 1s linear infinite; vertical-align: middle; margin-right: 8px; }

    /* 修复1：补全隐藏 UI 时的样式 */
    .zh-ui-hidden #immersive-exit-btn, .zh-ui-hidden #zh-tools-panel { display: none !important; }

    /* 修复2：让翻译卡片独立出来，默认隐藏 */
    .zh-tr-card { display: none !important; margin: 10px 0 25px 20px; padding: 12px 18px; background-color: var(--zh-quote); border-left: 3px dashed var(--zh-accent); border-radius: 4px; font-size: 0.95em; color: var(--zh-text); transition: all 0.3s; }
    .zh-tr-actions { margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--zh-border); display: flex; justify-content: flex-end; gap: 8px; }
    .zh-tr-regen-btn { width: 28px; height: 26px; border: 1px solid var(--zh-border); border-radius: 4px; background: transparent; color: var(--zh-accent); display: inline-flex; align-items: center; justify-content: center; padding: 0; cursor: pointer; }
    .zh-tr-regen-btn svg { width: 15px; height: 15px; fill: currentColor; }
    .zh-tr-regen-btn:hover { background: var(--zh-accent); color: var(--zh-paper); }
    .zh-tr-speak-btn { color: var(--zh-text); }
    .zh-tr-speak-btn:hover { background: var(--zh-accent); color: var(--zh-paper); }
    
    /* 配合 JS 显示翻译卡片 */
    .zh-show-tr .zh-tr-card { display: block !important; animation: zhFadeIn 0.5s; }
    
    .zh-show-tr .zh-tr-card { display: block; animation: zhFadeIn 0.5s; }
    .zh-summary-card { margin-left: 0; margin-bottom: 30px; border-left: 4px solid var(--zh-accent); font-weight: 500; }
    @keyframes zhFadeIn { from {opacity: 0; transform: translateY(-5px);} to {opacity: 1; transform: translateY(0);} }

    #zh-tools-panel { position: fixed !important; bottom: 30px !important; right: 30px !important; display: flex; flex-direction: column; gap: 10px; z-index: 999999 !important; transition: opacity 0.3s; }
    @keyframes zh-toolbar-pop { from { opacity: 0; transform: scale(0.4) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .zh-square-btn { width: 38px !important; height: 38px !important; background-color: var(--zh-paper) !important; border: 1px solid var(--zh-accent) !important; border-radius: 4px !important; box-shadow: 0 4px 10px rgba(0,0,0,0.15) !important; display: flex !important; align-items: center !important; justify-content: center !important; color: var(--zh-accent) !important; cursor: pointer !important; transition: all 0.2s ease !important; padding: 0 !important; margin: 0 !important; animation: zh-toolbar-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
    .zh-square-btn:hover { background-color: var(--zh-accent) !important; color: var(--zh-paper) !important; }
    .zh-square-btn svg { fill: currentColor !important; width: 20px !important; height: 20px !important; }
    .zh-btn-active { background-color: var(--zh-accent) !important; color: var(--zh-paper) !important; }

    /* Toast 提示 */
    #zh-toast { position: fixed; top: 36px; left: 50%; transform: translateX(-50%) translateY(-12px); z-index: 999999999; padding: 10px 22px; background: var(--zh-paper, #fff); color: var(--zh-text, #333); border: 1px solid var(--zh-border, #ddd); border-radius: 8px; font-size: 14px; box-shadow: 0 6px 24px rgba(0,0,0,0.12); opacity: 0; transition: opacity 0.25s ease, transform 0.25s ease; pointer-events: none; }
    #zh-toast.zh-toast-show { opacity: 1; transform: translateX(-50%) translateY(0); }

    /* 自定义确认弹窗 */
    .zh-confirm-overlay { position: fixed; inset: 0; z-index: 999999999; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; animation: zhFadeIn 0.15s ease; }
    .zh-confirm-box { background: var(--zh-paper, #fff); border: 1px solid var(--zh-border, #ddd); border-radius: 10px; padding: 24px 28px; max-width: 360px; width: 90%; box-shadow: 0 12px 40px rgba(0,0,0,0.18); }
    .zh-confirm-text { font-size: 15px; color: var(--zh-text, #333); line-height: 1.6; margin: 0 0 20px; }
    .zh-confirm-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .zh-confirm-btn { padding: 8px 18px; border-radius: 6px; font-size: 14px; cursor: pointer; border: 1px solid var(--zh-border); background: var(--zh-paper); color: var(--zh-text); transition: all 0.15s ease; font-family: inherit; }
    .zh-confirm-btn:hover { border-color: var(--zh-accent); color: var(--zh-accent); }
    .zh-confirm-btn-primary { background: var(--zh-accent); color: var(--zh-paper); border-color: var(--zh-accent); }
    .zh-confirm-btn-primary:hover { opacity: 0.85; color: var(--zh-paper); }

    .zh-modal-btn { width: 100% !important; padding: 10px 15px !important; background-color: var(--zh-paper) !important; border: 1px solid var(--zh-accent) !important; border-radius: 4px !important; color: var(--zh-accent) !important; font-family: 'KaiTi', serif !important; font-size: 16px !important; font-weight: bold !important; cursor: pointer !important; transition: all 0.3s ease !important; letter-spacing: 2px !important; text-align: center !important; }
    .zh-modal-btn:hover { background-color: var(--zh-accent) !important; color: var(--zh-paper) !important; }
    
    .zh-test-btn { width: 100%; padding: 8px; background: transparent; border: 1px dashed var(--zh-border); color: var(--zh-text); border-radius: 4px; cursor: pointer; margin-bottom: 10px; font-family: inherit; transition: all 0.2s; }
    .zh-test-btn:hover { border-color: var(--zh-accent); color: var(--zh-accent); }
    .zh-test-res { font-size: 0.85em; margin-bottom: 15px; display: none; padding: 5px; border-radius: 3px; background: var(--zh-code); }

    .zh-pwd-wrap { position: relative; display: flex; align-items: center; margin-bottom: 15px; }
    .zh-pwd-wrap input { width: 100%; padding-right: 35px !important; margin-bottom: 0 !important; box-sizing: border-box; }
    .zh-eye-icon { position: absolute; right: 8px; cursor: pointer; color: var(--zh-text); opacity: 0.5; display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; }
    .zh-eye-icon:hover { opacity: 1; color: var(--zh-accent); }
    .zh-eye-icon svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

    #immersive-exit-btn { position: fixed !important; bottom: 30px !important; left: 30px !important; padding: 8px 16px !important; background-color: var(--zh-paper) !important; color: var(--zh-accent) !important; border: 1px solid var(--zh-accent) !important; border-radius: 4px !important; font-family: 'KaiTi', serif !important; cursor: pointer !important; box-shadow: 0 4px 10px rgba(0,0,0,0.15) !important; z-index: 999999 !important; transition: opacity 0.3s; }
    .zh-toc-fixed-style {position: fixed !important;top: 30px !important;right: 30px !important;z-index: 999999 !important;width: auto !important;height: auto !important;min-height: 38px !important;min-width: 38px !important;background-color: var(--zh-paper) !important;border: 1px solid var(--zh-accent) !important;border-radius: 4px !important;box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15) !important;display: inline-flex !important;align-items: center !important;justify-content: center !important;color: var(--zh-accent) !important;cursor: pointer !important;transition: all 0.2s ease !important;padding: 0 !important;margin: 0 !important;opacity: 1 !important;pointer-events: auto !important;}.zh-toc-fixed-style:hover {background-color: var(--zh-accent) !important;color: var(--zh-paper) !important;}.zh-toc-fixed-style svg {fill: currentColor !important;width: 20px !important;height: 20px !important;margin: 0 4px !important;}.zh-toc-fixed-style span {line-height: 1 !important;white-space: nowrap !important;}.zh-toc-fixed-style > a, .zh-toc-fixed-style > button {display: inline-flex !important;align-items: center !important;justify-content: center !important;width: 100% !important;height: 100% !important;padding: 0 12px !important;min-height: 38px !important;color: inherit !important;text-decoration: none !important;border: none !important;background: transparent !important;cursor: pointer !important;}.zh-toc-fixed-style.zh-btn-active {background-color: var(--zh-accent) !important;color: var(--zh-paper) !important;}    .zh-modal-overlay { position: fixed; top:0; left:0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999999; display: flex; justify-content: center; align-items: center; }
    .zh-modal { background: var(--zh-modal-bg); border: 2px solid var(--zh-accent); border-radius: 6px; width: 420px; max-width: 90%; color: var(--zh-text); font-family: 'KaiTi', serif; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .zh-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px dashed var(--zh-accent); font-weight: bold; font-size: 1.1em; }
    .zh-modal-close { background: transparent; border: none; color: var(--zh-accent); font-size: 24px; cursor: pointer; padding: 0; outline: none; }
    .zh-modal-body { padding: 25px 20px; font-size: 0.95em; line-height: 1.8; max-height: 70vh; overflow-y: auto; }
    .zh-modal-body input { background: var(--zh-code); border: 1px solid var(--zh-border); color: var(--zh-text); padding: 8px; border-radius: 4px; outline: none; }
    .zh-modal-body input:focus { border-color: var(--zh-accent); }
    
    @media print {
        @page {
            size: A4 portrait;
            margin: 0 !important;
        }

        html, body, * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        ${EXPORT_HIDDEN_SELECTORS.join(',\n        ')} {
            display: none !important;
        }

        html, body {
            background: var(--zh-bg, #ffffff) !important;
            color: var(--zh-text, #1a1a1a) !important;
            margin: 0 !important;
            padding: 0 !important;
            width: auto !important;
            min-height: auto !important;
            box-sizing: border-box !important;
        }

        body {
            padding: 15mm !important;
        }

        #immersive-wrapper, .Post-Main, .AnswerItem, .RichText, .Post-RichTextContainer, .Question-mainColumn {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            min-width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
            border-left: 0 !important;
            border-right: 0 !important;
        }

        #immersive-wrapper, #immersive-wrapper * {
            box-sizing: border-box !important;
        }

        p, .RichText p, .css-34mzkj, .zh-tr-card {
            margin-top: 12pt !important;
            margin-bottom: 12pt !important;
            orphans: 2;
            widows: 2;
        }

        pre, img, svg, .zh-tr-card, table, blockquote, .css-34mzkj {
            page-break-inside: avoid !important;
            break-inside: avoid-page !important;
        }

        table {
            width: 100% !important;
            border-collapse: collapse !important;
            background: var(--zh-paper, #ffffff) !important;
        }

        th, td {
            border: 1px solid var(--zh-border, #dddddd) !important;
            padding: 6pt 8pt !important;
            background-color: var(--zh-paper, #ffffff) !important;
            color: var(--zh-text, #1a1a1a) !important;
        }

        blockquote, .zh-tr-card {
            background: var(--zh-quote, #f8f8f8) !important;
        }

        .ContentItem-actions {
            position: static !important;
            bottom: auto !important;
            box-shadow: none !important;
            margin-top: 20px !important;
            background: transparent !important;
        }

        pre {
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
            overflow: visible !important;
        }

        img {
            max-width: 100% !important;
            height: auto !important;
        }
    }
    @media (max-width: 860px) {
        .zh-reader-top-nav { position: static; max-width: none; justify-content: flex-start; margin: 8px 0 18px !important; }
        .zh-has-top-nav .zh-question-title, .zh-has-top-nav .zh-home-title { padding-right: 0 !important; }
    }

    /* 个人空间布局 */
    .zh-space-layout { display: flex; gap: 20px; margin-top: 20px; min-height: 70vh; }
    .zh-space-sidebar { width: 180px; display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; border-right: 1px dashed var(--zh-border); padding-right: 16px; }
    .zh-space-sidebar-title { font-weight: bold; color: var(--zh-accent); font-size: 16px; padding: 10px 12px 14px; border-bottom: 2px solid var(--zh-accent); margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
    .zh-space-tab-btn { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: none; border-radius: 6px; background: transparent; color: var(--zh-text); cursor: pointer; text-align: left; font-family: inherit; font-size: 14px; transition: all 0.15s ease; outline: none; }
    .zh-space-tab-btn:hover { background: var(--zh-quote); color: var(--zh-accent); }
    .zh-space-tab-btn.is-active { background: var(--zh-accent); color: var(--zh-paper); font-weight: bold; }
    .zh-space-tab-btn svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; flex-shrink: 0; }
    .zh-space-content { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    
    /* 统计面板 */
    .zh-space-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .zh-space-stat-card { border: 1px solid var(--zh-border); border-radius: 8px; padding: 16px; background: var(--zh-paper); box-shadow: 0 2px 8px rgba(0,0,0,0.03); display: flex; flex-direction: column; gap: 6px; text-align: center; }
    .zh-space-stat-val { font-size: 26px; font-weight: bold; color: var(--zh-accent); }
    .zh-space-stat-lbl { font-size: 12px; opacity: 0.65; }
    
    /* 打卡与热力图 */
    .zh-space-heatmap-wrapper { overflow-x: auto; padding: 16px; background: var(--zh-quote); border: 1px solid var(--zh-border); border-radius: 8px; margin: 16px 0 24px; position: relative; }
    .zh-space-heatmap-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 13px; font-weight: bold; color: var(--zh-title); }
    .zh-space-heatmap-grid-container { display: flex; gap: 8px; align-items: flex-start; }
    .zh-space-heatmap-weekdays { display: grid; grid-template-rows: repeat(7, 10px); gap: 3px; font-size: 9px; opacity: 0.5; width: 14px; text-align: center; margin-top: 0; }
    .zh-space-heatmap-grid { display: grid; grid-template-rows: repeat(7, 10px); grid-auto-flow: column; grid-auto-columns: 10px; gap: 3px; }
    .zh-space-heatmap-day { width: 10px; height: 10px; border-radius: 2px; background: rgba(0,0,0,0.06); cursor: pointer; position: relative; }
    .zh-space-heatmap-day:hover { transform: scale(1.3); z-index: 3; box-shadow: 0 0 4px rgba(0,0,0,0.3); }
    .zh-space-heatmap-day.level-1 { background: rgba(122, 92, 216, 0.2); }
    .zh-space-heatmap-day.level-2 { background: rgba(122, 92, 216, 0.45); }
    .zh-space-heatmap-day.level-3 { background: rgba(122, 92, 216, 0.7); }
    .zh-space-heatmap-day.level-4 { background: var(--zh-accent); }
    .zh-space-heatmap-months { display: grid; grid-template-columns: repeat(53, 10px); gap: 3px; font-size: 9px; opacity: 0.5; margin-left: 22px; margin-bottom: 6px; height: 12px; line-height: 12px; }

    /* 表单与列表表格 */
    .zh-space-table-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 10px; flex-wrap: wrap; }
    .zh-space-table-wrap { border: 1px solid var(--zh-border); border-radius: 6px; overflow: hidden; background: var(--zh-paper); margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
    .zh-space-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    .zh-space-table th { background: var(--zh-quote); padding: 12px 14px; font-weight: bold; border-bottom: 1px solid var(--zh-border); color: var(--zh-title); vertical-align: middle; }
    .zh-space-table td { padding: 12px 14px; border-bottom: 1px solid var(--zh-border); line-height: 1.5; vertical-align: middle; word-wrap: break-word; overflow-wrap: anywhere; word-break: break-word; }
    .zh-space-table tr:last-child td { border-bottom: none; }
    .zh-space-table tr:hover td { background: rgba(0,0,0,0.02); }
    .zh-space-badge { font-size: 11px; padding: 2px 6px; border-radius: 3px; font-weight: bold; white-space: nowrap; }
    .zh-space-badge.article { background: #e2f0d9; color: #385723; }
    .zh-space-badge.answer { background: #e2f9e9; color: #1e7e34; }
    .zh-space-badge.wiki-done { background: #fff3cd; color: #856404; }
    .zh-space-badge.wiki-todo { background: #e8f4fd; color: #1d72b8; }

    /* 锁定工具栏槽位支持 - 禁用按钮样式 */
    .zh-square-btn.zh-btn-disabled {
        opacity: 0.45 !important;
        cursor: not-allowed !important;
        border-color: var(--zh-border) !important;
        color: var(--zh-text) !important;
    }
    .zh-square-btn.zh-btn-disabled:hover {
        background-color: var(--zh-paper) !important;
        color: var(--zh-text) !important;
    }

    /* 个人空间根容器卡片质感 & 动效 */
    @keyframes zh-space-enter {
        from { opacity: 0; transform: translateY(18px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes zh-space-exit-anim {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(18px); }
    }
    #zh-space-container {
        background-color: var(--zh-paper);
        border: 1px solid var(--zh-border);
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        padding: 24px;
        margin-top: 16px;
        transition: all 0.3s ease;
        animation: zh-space-enter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    #zh-space-container.zh-space-exit {
        animation: zh-space-exit-anim 0.25s ease forwards;
        pointer-events: none;
    }
    .zh-space-avatar {
        transition: transform 0.25s ease, border-color 0.25s ease;
    }
    .zh-space-avatar:hover {
        transform: scale(1.08) rotate(3deg);
        border-color: var(--zh-accent) !important;
    }

    /* 模态弹窗的高级打开与关闭动画 */
    @keyframes zh-modal-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes zh-modal-pop-in {
        from { transform: scale(0.92) translateY(12px); opacity: 0; }
        to { transform: scale(1) translateY(0); opacity: 1; }
    }
    @keyframes zh-modal-fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    @keyframes zh-modal-pop-out {
        from { transform: scale(1) translateY(0); opacity: 1; }
        to { transform: scale(0.92) translateY(12px); opacity: 0; }
    }
    .zh-modal-overlay {
        animation: zh-modal-fade-in 0.25s ease forwards;
    }
    .zh-modal {
        animation: zh-modal-pop-in 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    .zh-modal-overlay.zh-modal-closing {
        animation: zh-modal-fade-out 0.2s ease forwards;
        pointer-events: none;
    }
    .zh-modal-overlay.zh-modal-closing .zh-modal {
        animation: zh-modal-pop-out 0.2s ease forwards;
    }

    /* 响应式断点自适应排版：窄屏自动折叠侧边栏 */
    @media (max-width: 900px) {
        .zh-space-layout {
            flex-direction: column !important;
            gap: 16px !important;
        }
        .zh-space-sidebar {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px dashed var(--zh-border) !important;
            padding-right: 0 !important;
            padding-bottom: 16px !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
        }
        .zh-space-sidebar-title {
            width: 100% !important;
            border-bottom: none !important;
            margin-bottom: 4px !important;
            padding: 6px 12px !important;
        }
        .zh-space-tab-btn {
            flex: 1 1 auto !important;
            justify-content: center !important;
            padding: 8px 12px !important;
            font-size: 13px !important;
        }
        .zh-space-tab-btn[style*="margin-top: auto"] {
            margin-top: 0 !important;
            width: 100% !important;
        }
    }
`;

// ═══════════════════════════════════════════════════════════
// 模块: templates.js
// ═══════════════════════════════════════════════════════════
// ----- UI组件的HTML模板 (用于模态框等) -----
const SETTINGS_MODAL_HTML = (cfg) => `
    <label style="display:block; margin-bottom:5px;">API Host (记得带 /v1):</label>
    <input type="text" id="zh-cfg-host" value="${cfg.apiHost}" style="width:100%; margin-bottom:15px; box-sizing:border-box;">
    
    <label style="display:block; margin-bottom:5px;">模型名称 (Model):</label>
    <input type="text" id="zh-cfg-model" value="${cfg.apiModel}" placeholder="gpt-3.5-turbo / deepseek-chat" style="width:100%; margin-bottom:15px; box-sizing:border-box;">

    <label style="display:block; margin-bottom:5px;">API Key:</label>
    <div class="zh-pwd-wrap">
        <input type="password" id="zh-cfg-key" value="${cfg.apiKey}" placeholder="sk-xxxx">
        <div id="zh-toggle-eye" class="zh-eye-icon" title="显示/隐藏">
            <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        </div>
    </div>

    <button id="zh-test-api-btn" class="zh-test-btn">⚡ 测试 API 连通性</button>
    <div id="zh-test-res" class="zh-test-res"></div>

    <div style="border:1px dashed var(--zh-border); border-radius:4px; padding:10px 12px; margin:0 0 15px; background:var(--zh-quote);">
        <div style="font-weight:bold; color:var(--zh-accent); margin-bottom:8px;">API 配置组</div>
        <label style="display:block; margin-bottom:5px;">已保存配置:</label>
        <select id="zh-api-profile-select" style="width:100%; margin-bottom:8px; box-sizing:border-box; background:var(--zh-code); border:1px solid var(--zh-border); color:var(--zh-text); padding:8px; border-radius:4px;"></select>
        <label style="display:block; margin-bottom:5px;">配置名称:</label>
        <input type="text" id="zh-api-profile-name" placeholder="例如：DeepSeek / OpenAI / 本地中转" style="width:100%; margin-bottom:10px; box-sizing:border-box;">
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button id="zh-api-profile-apply" type="button" class="zh-inline-btn" style="padding:6px 10px; font-size:13px;">应用配置</button>
            <button id="zh-api-profile-save" type="button" class="zh-inline-btn" style="padding:6px 10px; font-size:13px;">保存当前为配置</button>
            <button id="zh-api-profile-new" type="button" class="zh-inline-btn" style="padding:6px 10px; font-size:13px;">新建配置</button>
            <button id="zh-api-profile-delete" type="button" class="zh-inline-btn" style="padding:6px 10px; font-size:13px;">删除配置</button>
        </div>
        <div id="zh-api-profile-status" style="font-size:12px; opacity:.75; margin-top:8px;">配置组只保存 Host / Model / Key，不影响翻译语言和其它偏好。</div>
    </div>
    
    <label style="display:block; margin-bottom:5px;">目标翻译语言 / 提示词:</label>
    <input type="text" id="zh-cfg-lang" value="${cfg.targetLang}" style="width:100%; margin-bottom:15px; box-sizing:border-box;" placeholder="文言文 / 英文 / 现代汉语解释">
    <label style="display:block; margin-bottom:5px;">阅读笔记兴趣标签:</label>
    <input type="text" id="zh-cfg-radar-tags" value="${cfg.radarInterestTags || ''}" style="width:100%; margin-bottom:15px; box-sizing:border-box;" placeholder="AI工具、提示词工程、LLM训练、GitHub精选">
    
    <label style="display:block; margin-bottom:5px; cursor:pointer;"><input type="checkbox" id="zh-cfg-autosum" ${cfg.autoSum ? 'checked' : ''}> 展卷时自动生成全文摘要</label>
    <label style="display:block; margin-bottom:5px; cursor:pointer;"><input type="checkbox" id="zh-cfg-autotr" ${cfg.autoTr ? 'checked' : ''}> 展卷时异步生成全文翻译 (慎选，耗量大)下次生效</label>
    <label style="display:block; margin-bottom:5px; cursor:pointer;"><input type="checkbox" id="zh-cfg-auto-hide-images" ${cfg.autoHideImages ? 'checked' : ''}> 展卷时自动折叠正文图片</label>
    <label style="display:block; margin-bottom:5px;">图片折叠后的交互方式:</label>
    <select id="zh-cfg-image-mode" style="width:100%; margin-bottom:20px; box-sizing:border-box; background:var(--zh-code); border:1px solid var(--zh-border); color:var(--zh-text); padding:8px; border-radius:4px;">
        <option value="preview" ${cfg.imageMode !== 'collapse' ? 'selected' : ''}>弹出预览（点击占位符全屏查看，点击其他区域收回）</option>
        <option value="collapse" ${cfg.imageMode === 'collapse' ? 'selected' : ''}>原位展开（点击占位符在原文位置展开图片，再点图片收起）</option>
    </select>
    <label style="display:block; margin-bottom:5px;">零损分享导出格式:</label>
    <select id="zh-cfg-share-format" style="width:100%; margin-bottom:20px; box-sizing:border-box; background:var(--zh-code); border:1px solid var(--zh-border); color:var(--zh-text); padding:8px; border-radius:4px;">
        <option value="png" ${cfg.shareExportFormat === 'png' ? 'selected' : ''}>PNG 长图（本地渲染 + 公共 API 兜底）</option>
        <option value="webp" ${cfg.shareExportFormat === 'webp' ? 'selected' : ''}>WebP 长图（本地渲染 + 公共 API 兜底）</option>
        <option value="svg" ${!['html', 'png', 'webp'].includes(cfg.shareExportFormat) ? 'selected' : ''}>SVG（html2svg）</option>
        <option value="html" ${cfg.shareExportFormat === 'html' ? 'selected' : ''}>HTML</option>
    </select>
    
    <label style="display:block; margin-bottom:5px;">回答列表预览:</label>
    <select id="zh-cfg-answer-preview" style="width:100%; margin-bottom:20px; box-sizing:border-box; background:var(--zh-code); border:1px solid var(--zh-border); color:var(--zh-text); padding:8px; border-radius:4px;">
        <option value="excerpt" ${cfg.answerPreviewMode !== 'ai' ? 'selected' : ''}>摘录回答前文</option>
        <option value="ai" ${cfg.answerPreviewMode === 'ai' ? 'selected' : ''}>AI 摘要</option>
    </select>

    <div style="border-top:1px dashed var(--zh-border); margin:16px 0; padding-top:14px;">
        <div style="font-weight:bold; color:var(--zh-accent); margin-bottom:10px;">首页信息流 Wiki</div>
        <div style="font-size:12px; opacity:.7; margin-bottom:10px; line-height:1.5;">采集条数 / 并发 / RPM / 今日总览 / Obsidian 格式等参数，已移至「个人空间 → Wiki 采集」启动时设置。</div>
        <button id="zh-preview-prompts-btn" type="button" class="zh-test-btn">查看当前系统提示词</button>
    </div>

    <div style="border-top:1px dashed var(--zh-border); margin:16px 0; padding-top:14px;">
        <div style="font-weight:bold; color:var(--zh-accent); margin-bottom:10px;">Embedding 向量配置（语义搜索）</div>
        <label style="display:block; margin-bottom:5px;">Embedding Host (带 /v1):</label>
        <input type="text" id="zh-cfg-embedding-host" value="${cfg.embeddingHost || ''}" placeholder="https://api.openai.com/v1" style="width:100%; margin-bottom:10px; box-sizing:border-box;">
        <label style="display:block; margin-bottom:5px;">Embedding 模型:</label>
        <input type="text" id="zh-cfg-embedding-model" value="${cfg.embeddingModel || 'text-embedding-3-small'}" placeholder="text-embedding-3-small" style="width:100%; margin-bottom:4px; box-sizing:border-box;">
        <div style="font-size:12px; opacity:.7; margin-bottom:10px; line-height:1.5;">⚠️ 更换模型会使已有向量失效（不同模型向量不兼容）。保存时会提示你清空旧向量并重跑，或保留旧向量、放弃本次更换。</div>
        <label style="display:block; margin-bottom:5px;">Embedding Key (留空则复用 LLM Key):</label>
        <input type="password" id="zh-cfg-embedding-key" value="${cfg.embeddingKey || ''}" placeholder="留空则使用上方 API Key" style="width:100%; margin-bottom:10px; box-sizing:border-box;">
    </div>
    
    <div style="border-top:1px dashed var(--zh-border); margin:16px 0; padding-top:14px;">
        <div style="font-weight:bold; color:var(--zh-accent); margin-bottom:10px;">知乎互动 · 收藏夹</div>
        <label style="display:block; margin-bottom:5px;">默认收藏夹 ID（用于一键收藏推荐流卡片）：</label>
        <input type="text" id="zh-cfg-collection-id" value="${cfg.defaultCollectionId || ''}" placeholder="例如 905152952" style="width:100%; margin-bottom:10px; box-sizing:border-box;">
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
            <button id="zh-fetch-collections-btn" type="button" class="zh-inline-btn" style="padding:6px 10px; font-size:13px;">拉取我的收藏夹</button>
            <span id="zh-fetch-collections-status" style="font-size:12px; opacity:.7; align-self:center;"></span>
        </div>
        <div id="zh-collections-list" style="font-size:13px; line-height:1.7; max-height:160px; overflow:auto;"></div>
        <div style="font-size:12px; opacity:.7; margin-top:6px;">点击列表中的收藏夹即可填入 ID。需登录知乎账号后操作。</div>
    </div>

    <div style="border-top:1px dashed var(--zh-border); margin:16px 0; padding-top:14px;">
        <div style="font-weight:bold; color:var(--zh-accent); margin-bottom:6px;">自定义主题（上传配色）</div>
        <div style="font-size:12px; opacity:.75; margin-bottom:10px; line-height:1.6;">为每个颜色选择色值，下方括号说明该颜色对应界面的哪个部位。命名后点「添加主题」即可保存到本地，随取色按钮循环切换。</div>
        <div id="zh-theme-var-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:8px 14px; margin-bottom:12px;">
            ${THEME_VAR_GUIDE.map(v => `
                <label style="display:flex; align-items:center; gap:8px; font-size:13px;">
                    <input type="color" class="zh-theme-var" data-var="${v.key}" value="${v.def}" style="width:34px; height:28px; padding:0; border:1px solid var(--zh-border); border-radius:4px; background:none; cursor:pointer; flex-shrink:0;">
                    <span style="min-width:0;"><b>${v.label}</b><br><span style="opacity:.65; font-size:11px;">${v.desc}</span></span>
                </label>
            `).join('')}
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
            <input type="text" id="zh-theme-name" placeholder="主题名，如 🌙 夜读" style="flex:1; min-width:140px; box-sizing:border-box;">
            <button id="zh-add-theme-btn" type="button" class="zh-inline-btn" style="padding:6px 12px; font-size:13px;">添加主题</button>
        </div>
        <details style="margin-bottom:8px;">
            <summary style="cursor:pointer; font-size:13px; color:var(--zh-accent);">或粘贴 JSON 主题对象导入</summary>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin:6px 0;">
                <button id="zh-theme-tutorial-btn" type="button" class="zh-inline-btn" style="padding:5px 10px; font-size:12px;">查看模板与字段说明</button>
            </div>
            <textarea id="zh-theme-json" rows="4" placeholder="在此粘贴主题 JSON 对象（点上方按钮查看模板与字段说明）" style="width:100%; box-sizing:border-box; font-family:Consolas,monospace; font-size:12px;"></textarea>
            <button id="zh-import-theme-btn" type="button" class="zh-inline-btn" style="padding:6px 12px; font-size:13px; margin-top:6px;">导入 JSON 主题</button>
        </details>
        <div id="zh-custom-theme-list" style="font-size:13px; line-height:1.7;"></div>
    </div>

    <button id="zh-save-settings-btn" class="zh-modal-btn">保存并应用配置</button>
`;

const HELP_MODAL_HTML = `
    <div style="line-height:1.9;">
        <h3 style="margin:0 0 8px; color:var(--zh-accent);">基础阅读</h3>
        <ul style="padding-left:20px; margin:0 0 14px;">
            <li><strong>Ctrl + E</strong>：展卷 / 收卷，切换沉浸阅读。</li>
            <li><strong>Ctrl + H</strong>：隐藏 / 显示侧边工具栏和退出按钮，适合截图、打印或专注阅读。</li>
            <li><strong>T</strong>：展开 / 收起段落翻译卡片；未自动翻译时，可逐段点击请求。</li>
            <li><strong>← / →</strong>：上一篇 / 下一篇（首页推荐流和问答列表均可用，支持跨组切换）。</li>
            <li><strong>J / K</strong>：同上，下一篇 / 上一篇（Vim 风格）。</li>
            <li><strong>图片</strong>：点击正文图片可折叠，再点击占位条恢复显示；头像和作者信息不会被主动隐藏。可在设置中切换"弹出预览"或"原位展开"两种模式。</li>
            <li><strong>打印 / PDF</strong>：沉浸模式下已隐藏站点 UI，并为正文保留打印边距。</li>
        </ul>

        <h3 style="margin:0 0 8px; color:var(--zh-accent);">AI 与积累</h3>
        <ul style="padding-left:20px; margin:0 0 14px;">
            <li><strong>表达收藏本图标</strong>：打开表达本，查看划词积累；支持复制 Markdown、下载 Markdown / JSON、清空。</li>
            <li><strong>划词右键</strong>：选中文字后右键，可进行 AI 划词解析，也可把原文、译文、上下文和 AI 批注加入表达本。</li>
            <li><strong>阅读笔记图标</strong>：为当前文章或回答生成短报告，记录 archetype、oneliner、impression、depth、relevance 和标签；报告可保存、复看、导出。</li>
            <li><strong>分享图标</strong>：导出当前文章或回答的纯净分享稿，支持 HTML、SVG、PNG 长图。PNG 为稳定下载会忽略正文图片，并在导出结果中标注。</li>
        </ul>

        <h3 style="margin:0 0 8px; color:var(--zh-accent);">首页与 Wiki</h3>
        <ul style="padding-left:20px; margin:0 0 14px;">
            <li><strong>首页推荐</strong>：首组沿用页面已有 DOM，后续通过推荐 API 手动加载，每组 5 条，可在列表右上角切换推荐组。</li>
            <li><strong>Wiki 图标</strong>：仅在首页显示。用于把已加载推荐流抓取全文、生成学习卡片和可复制/下载的 Markdown 日志。</li>
            <li><strong>Wiki Beta</strong>：当前仍偏实验功能，适合尝鲜和个人工作流验证，性能与体验还没有大量优化。</li>
        </ul>

        <h3 style="margin:0 0 8px; color:var(--zh-accent);">设置与仓库</h3>
        <ul style="padding-left:20px; margin:0;">
            <li><strong>设置图标</strong>：配置 OpenAI 兼容 API Host、模型、API Key、目标翻译语言、阅读笔记兴趣标签、分享格式、Wiki 参数等。</li>
            <li><strong>API 配置组</strong>：设置页可保存多组 Host / Model / Key，按需应用到当前 API 表单；不会改动翻译语言、Wiki 数量或其它阅读偏好。</li>
            <li><strong>仓库图标</strong>：侧边工具栏可直接跳转项目仓库。</li>
            <li><strong>仓库地址：</strong><a href="https://github.com/connectedGraph/zhihu-immersive-reader" target="_blank" rel="noopener noreferrer" style="color:var(--zh-accent);">https://github.com/connectedGraph/zhihu-immersive-reader</a></li>
        </ul>
    </div>
`;



(function() {
    if (window._hasZhihuImmersiveSetup) return;
    window._hasZhihuImmersiveSetup = true;
    window._isImmersive = false;
    window._uiHidden = false;
    window._trVisible = false;

// ═══════════════════════════════════════════════════════════
// 模块: state.js
// ═══════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════
    // 拦截并过滤知乎官方自带的失效 HTTPDNS 跨域请求（以保持控制台整洁）
    // ═══════════════════════════════════════════════════════════
    try {
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            if (typeof url === 'string' && (url.includes('118.89.204.198') || url.includes('resolv?host='))) {
                this.send = function() {};
                return originalOpen.apply(this, ['GET', 'javascript:void(0)']);
            }
            return originalOpen.apply(this, arguments);
        };
    } catch (e) {}

    let _articleNode = null;
    let _actionBarNode = null;
    let _postCommentsNode = null;
    let _postCommentInputNode = null;
    let _liveMountState = null;
    let _articleSummary = "";
    let _adCleanupObserver = null;
    const _translationMemoryCache = new Map();
    const _questionAnswerCache = new Map();
    const _homeFeedCache = new Map();
    const _followFeedCache = new Map();
    const _shareImageDataUrlCache = new Map();
    const QUESTION_CACHE_DB = 'zh-immersive-question-cache';
    const QUESTION_CACHE_STORE = 'questionAnswers';
    const WIKI_HISTORY_KEY = 'zh-immersive-wiki-history';
    const WIKI_HISTORY_MAX = 12;
    const HOME_BATCH_SIZE = 6;
    const HOME_RECOMMEND_API = 'https://www.zhihu.com/api/v3/feed/topstory/recommend';
    const FOLLOW_BATCH_SIZE = 8;
    const FOLLOW_MOMENTS_API = 'https://www.zhihu.com/api/v3/moments';
    const TRANSLATION_CACHE_KEY = 'zh-immersive-translation-cache-v1';
    const TRANSLATION_CACHE_MAX = 800;
    const EXPRESSION_BOOK_KEY = 'zh-immersive-expression-book-v1';
    const EXPRESSION_BOOK_MAX = 1200;
    const RADAR_REPORT_BOOK_KEY = 'zh-immersive-radar-report-book-v1';
    const RADAR_REPORT_BOOK_MAX = 800;
    const API_PROFILES_KEY = 'zh-immersive-api-profiles-v1';
    const TOREAD_LIST_KEY = 'zh-immersive-toread-v1';
    const TOREAD_MAX = 200;
    const radarJobState = new Map();

    // 加载或初始化配置（优先 GM 存储，兼容旧 localStorage 迁移）
    function _loadConfigFromStorage() {
        try {
            if (typeof GM_getValue === 'function') {
                const gmRaw = GM_getValue('zh-immersive-config', null);
                if (gmRaw) return JSON.parse(gmRaw);
            }
        } catch (err) {}
        try {
            const lsRaw = localStorage.getItem('zh-immersive-config');
            if (lsRaw) {
                const parsed = JSON.parse(lsRaw);
                if (typeof GM_setValue === 'function') GM_setValue('zh-immersive-config', lsRaw);
                return parsed;
            }
        } catch (err) {}
        return {};
    }
    let config = Object.assign({}, DEFAULT_CONFIG, _loadConfigFromStorage());

    if (typeof GM_addValueChangeListener === 'function') {
        GM_addValueChangeListener('zh-immersive-config', (name, oldVal, newVal, remote) => {
            if (!remote || !newVal) return;
            try {
                config = Object.assign({}, DEFAULT_CONFIG, JSON.parse(newVal));
                if (window._isImmersive) setupImageToggles();
            } catch (err) {
                console.warn('知乎沉浸式阅读：同步配置失败', err);
            }
        });
    }
    window.addEventListener('storage', (event) => {
        if (event.key !== 'zh-immersive-config' || !event.newValue) return;
        try {
            config = Object.assign({}, DEFAULT_CONFIG, JSON.parse(event.newValue));
            if (typeof GM_setValue === 'function') GM_setValue('zh-immersive-config', event.newValue);
            if (window._isImmersive) setupImageToggles();
        } catch (err) {
            console.warn('知乎沉浸式阅读：同步配置失败', err);
        }
    });

    let _questionState = {
        answers: [],
        questionTitle: '',
        questionDetailHTML: '',
        originalScrollY: 0,
        exitScrollY: 0,
        currentIndex: 0,
        reactRoot: null,
        view: '',
        collecting: false,
        loadingMore: false,
        exhausted: false
    };

    let _homeState = {
        items: [],
        groups: [],
        originalScrollY: 0,
        exitScrollY: 0,
        currentIndex: 0,
        currentGroupIndex: 0,
        currentIndexInGroup: 0,
        view: '',
        collecting: false,
        loadingMore: false,
        exhausted: false,
        apiNextUrl: '',
        apiStarted: false
    };

    let _followState = {
        items: [],
        groups: [],
        currentIndex: 0,
        currentGroupIndex: 0,
        currentIndexInGroup: 0,
        view: '',
        collecting: false,
        loadingMore: false,
        exhausted: false,
        apiNextUrl: '',
        apiStarted: false
    };

    let wikiState = {
        runId: '',
        items: [],
        running: false,
        finished: false,
        errors: [],
        markdown: '',
        startedAt: null,
        finishedAt: null,
        phase: '',
        progressMessage: '',
        paused: false,
        log: [],
        history: [],
        runConfig: null
    };

    let _personalSpaceBackup = {
        context: '',
        homeView: '',
        questionView: '',
        followView: '',
        scrollTop: 0,
        hasTopNav: false,
        hasHomeWide: false
    };

// ═══════════════════════════════════════════════════════════
// 模块: api-profiles.js
// ═══════════════════════════════════════════════════════════
    function createApiProfileId() {
        return `api-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    }

    function getApiProfileStoreFallback() {
        const id = createApiProfileId();
        return {
            activeId: id,
            profiles: [{
                id,
                name: '默认配置',
                apiHost: config.apiHost || DEFAULT_CONFIG.apiHost,
                apiModel: config.apiModel || DEFAULT_CONFIG.apiModel,
                apiKey: config.apiKey || '',
                updatedAt: new Date().toISOString()
            }]
        };
    }

    function normalizeApiProfileStore(store) {
        const fallback = getApiProfileStoreFallback();
        const profiles = Array.isArray(store?.profiles)
            ? store.profiles.map((profile, index) => ({
                id: profile.id || createApiProfileId(),
                name: String(profile.name || `API 配置 ${index + 1}`).trim(),
                apiHost: String(profile.apiHost || '').trim(),
                apiModel: String(profile.apiModel || '').trim(),
                apiKey: String(profile.apiKey || '').trim(),
                updatedAt: profile.updatedAt || new Date().toISOString()
            })).filter(profile => profile.apiHost || profile.apiModel || profile.apiKey || profile.name)
            : [];
        if (!profiles.length) return fallback;
        const activeId = profiles.some(profile => profile.id === store?.activeId) ? store.activeId : profiles[0].id;
        return { activeId, profiles };
    }

    function loadApiProfiles() {
        try {
            const raw = crossOriginGet(API_PROFILES_KEY);
            const store = normalizeApiProfileStore(raw ? JSON.parse(raw) : null);
            return store;
        } catch (err) {
            console.warn('知乎沉浸式阅读：API 配置组读取失败', err);
            return getApiProfileStoreFallback();
        }
    }

    function saveApiProfiles(store) {
        const normalized = normalizeApiProfileStore(store);
        const json = JSON.stringify(normalized);
        crossOriginSet(API_PROFILES_KEY, json);
        return normalized;
    }

    function readApiProfileNameFromForm() {
        return (document.getElementById('zh-api-profile-name')?.value || '').trim();
    }

    function getSelectedApiProfile(store = loadApiProfiles()) {
        const selectedId = document.getElementById('zh-api-profile-select')?.value || store.activeId;
        return store.profiles.find(profile => profile.id === selectedId) || store.profiles[0] || null;
    }

    function setApiProfileStatus(message) {
        const status = document.getElementById('zh-api-profile-status');
        if (status) status.textContent = message;
    }

    function fillApiFormFromProfile(profile) {
        if (!profile) return;
        const hostEl = document.getElementById('zh-cfg-host');
        const modelEl = document.getElementById('zh-cfg-model');
        const keyEl = document.getElementById('zh-cfg-key');
        const nameEl = document.getElementById('zh-api-profile-name');
        if (hostEl) hostEl.value = profile.apiHost || '';
        if (modelEl) modelEl.value = profile.apiModel || '';
        if (keyEl) keyEl.value = profile.apiKey || '';
        if (nameEl) nameEl.value = profile.name || '';
    }

    function renderApiProfileControls(store = loadApiProfiles()) {
        const select = document.getElementById('zh-api-profile-select');
        const nameEl = document.getElementById('zh-api-profile-name');
        if (!select || !nameEl) return store;
        select.innerHTML = store.profiles.map(profile => `<option value="${escapeHTML(profile.id)}" ${profile.id === store.activeId ? 'selected' : ''}>${escapeHTML(profile.name || '未命名配置')}</option>`).join('');
        const active = store.profiles.find(profile => profile.id === store.activeId) || store.profiles[0];
        nameEl.value = active?.name || '';
        return store;
    }

    function getApiProfileFromForm(existingId = '') {
        return {
            id: existingId || createApiProfileId(),
            name: readApiProfileNameFromForm() || '未命名配置',
            ...readApiSettingsFromForm(),
            updatedAt: new Date().toISOString()
        };
    }

    function bindApiProfileControls() {
        let store = renderApiProfileControls(loadApiProfiles());
        const select = document.getElementById('zh-api-profile-select');

        select?.addEventListener('change', () => {
            store = loadApiProfiles();
            const selected = getSelectedApiProfile(store);
            const nameEl = document.getElementById('zh-api-profile-name');
            if (nameEl) nameEl.value = selected?.name || '';
            setApiProfileStatus(selected ? `已选择：${selected.name}` : '暂无可用配置。');
        });

        document.getElementById('zh-api-profile-apply')?.addEventListener('click', () => {
            store = loadApiProfiles();
            const selected = getSelectedApiProfile(store);
            if (!selected) return setApiProfileStatus('暂无可应用配置。');
            fillApiFormFromProfile(selected);
            store.activeId = selected.id;
            store = saveApiProfiles(store);
            saveConfig({ apiHost: selected.apiHost, apiModel: selected.apiModel, apiKey: selected.apiKey });
            renderApiProfileControls(store);
            setApiProfileStatus(`已应用配置：${selected.name}`);
        });

        document.getElementById('zh-api-profile-save')?.addEventListener('click', () => {
            store = loadApiProfiles();
            const selected = getSelectedApiProfile(store);
            const profile = getApiProfileFromForm(selected?.id);
            const index = store.profiles.findIndex(item => item.id === profile.id);
            if (index >= 0) store.profiles[index] = profile;
            else store.profiles.unshift(profile);
            store.activeId = profile.id;
            store = saveApiProfiles(store);
            renderApiProfileControls(store);
            setApiProfileStatus(`已保存配置：${profile.name}`);
        });

        document.getElementById('zh-api-profile-new')?.addEventListener('click', () => {
            store = loadApiProfiles();
            const profile = getApiProfileFromForm();
            profile.name = readApiProfileNameFromForm() || `API 配置 ${store.profiles.length + 1}`;
            store.profiles.unshift(profile);
            store.activeId = profile.id;
            store = saveApiProfiles(store);
            renderApiProfileControls(store);
            setApiProfileStatus(`已新建配置：${profile.name}`);
        });

        document.getElementById('zh-api-profile-delete')?.addEventListener('click', () => {
            store = loadApiProfiles();
            const selected = getSelectedApiProfile(store);
            if (!selected) return setApiProfileStatus('暂无可删除配置。');
            if (store.profiles.length <= 1) return setApiProfileStatus('至少保留一个 API 配置。');
            if (!confirm(`确认删除配置「${selected.name}」？`)) return;
            store.profiles = store.profiles.filter(profile => profile.id !== selected.id);
            store.activeId = store.profiles[0]?.id || '';
            store = saveApiProfiles(store);
            renderApiProfileControls(store);
            setApiProfileStatus('配置已删除。');
        });
    }


// ═══════════════════════════════════════════════════════════
// 模块: utils.js
// ═══════════════════════════════════════════════════════════
    function stableHash(text) {
        const str = String(text || '');
        let h1 = 0xdeadbeef;
        let h2 = 0x41c6ce57;
        for (let i = 0; i < str.length; i++) {
            const ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return `${(h2 >>> 0).toString(36)}${(h1 >>> 0).toString(36)}`;
    }

    function getFormNumber(id, fallback, min = 0) {
        const el = document.getElementById(id);
        const raw = (el?.value || '').trim();
        if (raw === '') return fallback;
        const value = Number(raw);
        return Number.isFinite(value) ? Math.max(min, value) : fallback;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function isQuestionPage() {
        return /\/question\/\d+/.test(location.pathname);
    }

    function isHomePage() {
        const host = location.hostname.replace(/^www\./, '');
        return host === 'zhihu.com' && location.pathname === '/';
    }

    function isFollowPage() {
        const host = location.hostname.replace(/^www\./, '');
        return host === 'zhihu.com' && /^\/follow\/?$/.test(location.pathname);
    }

    function isPostPage() {
        return /\/p\/[^/]+/.test(location.pathname);
    }

    function isAnswerUrl() {
        return /\/question\/\d+\/answer\/\d+/.test(location.pathname);
    }

    function getMainQuestionUrl() {
        const match = location.href.match(/^(https?:\/\/[^?#]+\/question\/\d+)/);
        return match ? match[1] : location.origin + location.pathname.replace(/\/answer\/.*/, '');
    }

    function getQuestionCacheKey() {
        return `${getMainQuestionUrl().replace(/[#?].*$/, '')}::preview=${config.answerPreviewMode || 'excerpt'}`;
    }

    function getQuestionMainPageCacheKey() {
        return `${location.origin}${location.pathname.replace(/\/answer\/.*/, '').replace(/[#?].*$/, '')}::preview=${config.answerPreviewMode || 'excerpt'}`;
    }

    function getDocumentHeight() {
        return Math.max(
            document.body?.scrollHeight || 0,
            document.documentElement?.scrollHeight || 0,
            document.body?.offsetHeight || 0,
            document.documentElement?.offsetHeight || 0
        );
    }

    function forceScrollToBottom() {
        const height = getDocumentHeight();
        window.scrollTo(0, height);
        document.documentElement.scrollTop = height;
        document.body.scrollTop = height;
    }

    async function waitForElement(selector, timeout = 15000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const el = document.querySelector(selector);
            if (el) return el;
            await sleep(200);
        }
        return null;
    }

    async function waitForHomeFeedItems(targetCount = HOME_BATCH_SIZE, timeout = 25000, statusEl = null) {
        const start = Date.now();
        let lastCount = 0;
        let lastChangedAt = start;

        while (Date.now() - start < timeout) {
            const items = getHomeFeedItems();
            if (items.length >= targetCount) return items;

            if (items.length !== lastCount) {
                lastCount = items.length;
                lastChangedAt = Date.now();
            }

            if (statusEl) {
                statusEl.textContent = items.length
                    ? `正在等待首页推荐流稳定... ${Math.min(items.length, targetCount)}/${targetCount}`
                    : '正在等待首页推荐卡片...';
            }

            if (items.length > 0 && Date.now() - lastChangedAt > 1400) return items;
            await sleep(250);
        }

        return getHomeFeedItems();
    }

    function escapeHTML(text) {
        return String(text ?? '').replace(/[&<>"']/g, ch => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[ch]));
    }

    function saveConfig(newCfg) {
        config = Object.assign(config, newCfg);
        const json = JSON.stringify(config);
        if (typeof GM_setValue === 'function') GM_setValue('zh-immersive-config', json);
        localStorage.setItem('zh-immersive-config', json);
    }

    function crossOriginGet(key) {
        try {
            if (typeof GM_getValue === 'function') {
                const gm = GM_getValue(key, null);
                if (gm != null) return gm;
            }
        } catch (e) {}
        try {
            const ls = localStorage.getItem(key);
            if (ls != null && typeof GM_setValue === 'function') GM_setValue(key, ls);
            return ls;
        } catch (e) {}
        return null;
    }

    function crossOriginSet(key, value) {
        try { if (typeof GM_setValue === 'function') GM_setValue(key, value); } catch (e) {}
        try { localStorage.setItem(key, value); } catch (e) {}
    }

    function cleanupAnswerClone(clone) {
        clone.querySelectorAll('script, style, .pc-article-answer-card, .pc-article-answer-text-chain, .pc-article-answer-big-img, .ecommerce-ad-box, .MCNLinkCard').forEach(el => el.remove());
        clone.querySelectorAll('.ContentItem-actions').forEach(el => {
            el.style.position = 'static';
            el.style.boxShadow = 'none';
            el.style.background = 'transparent';
        });
        clone.querySelectorAll('img').forEach(img => {
            const realSrc = img.getAttribute('data-original') || img.getAttribute('data-actualsrc');
            if (realSrc) img.src = realSrc;
        });
        return clone;
    }

    function createLivePlaceholder(node, prefix) {
        const placeholder = document.createElement('span');
        placeholder.id = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        placeholder.style.display = 'none';
        node.parentNode.insertBefore(placeholder, node);
        return placeholder;
    }

    function restoreLiveMount() {
        if (!_liveMountState) return;
        const { node, placeholder, origCssText } = _liveMountState;
        if (node && placeholder?.parentNode) {
            node.style.cssText = origCssText || '';
            placeholder.parentNode.insertBefore(node, placeholder);
            placeholder.remove();
        }
        _liveMountState = null;
    }

    function mountLiveNode(node, target) {
        restoreLiveMount();
        if (!node || !node.parentNode || !target) return false;
        _liveMountState = {
            node,
            placeholder: createLivePlaceholder(node, 'zh-live-node-placeholder'),
            origCssText: node.style.cssText || ''
        };
        node.style.display = '';
        node.style.position = 'static';
        node.style.boxShadow = 'none';
        node.style.background = 'transparent';
        target.appendChild(node);
        return true;
    }

    function cloneFromHTML(html) {
        const template = document.createElement('template');
        template.innerHTML = html || '<div></div>';
        return template.content.firstElementChild || document.createElement('div');
    }

    function getElementPageTop(el) {
        const rect = el.getBoundingClientRect();
        return Math.max(0, Math.round(window.scrollY + rect.top));
    }

    function normalizeText(text) {
        return String(text || '')
            .replace(/\u200b/g, '')
            .replace(/\r/g, '\n')
            .replace(/[ \t\f\v]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function stripHTMLToText(html) {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(String(html), 'text/html');
        doc.querySelectorAll('script, style, noscript').forEach(el => el.remove());
        return normalizeText(doc.body?.textContent || doc.documentElement?.textContent || html);
    }


    function downloadBlobFile(filename, blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function downloadTextFile(filename, content, mime = 'text/plain;charset=utf-8') {
        downloadBlobFile(filename, new Blob([content], { type: mime }));
    }

    function sanitizeShareFilename(name) {
        return String(name || 'zhihu-share')
            .replace(/[\\/:*?"<>|]/g, '_')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 80) || 'zhihu-share';
    }

    function showCollectOverlay(text) {
        let overlay = document.getElementById('zh-question-collect-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'zh-question-collect-overlay';
            overlay.style.cssText = 'position:fixed;right:24px;bottom:24px;z-index:99999999;padding:12px 16px;background:#111;color:#fff;border-radius:4px;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.24);';
            document.body.appendChild(overlay);
        }
        overlay.textContent = text;
        return overlay;
    }

    function removeCollectOverlay() {
        const overlay = document.getElementById('zh-question-collect-overlay');
        if (overlay) overlay.remove();
    }

    function showToast(text, duration = 2200) {
        const existing = document.getElementById('zh-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.id = 'zh-toast';
        toast.textContent = text;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('zh-toast-show'));
        setTimeout(() => {
            toast.classList.remove('zh-toast-show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    function showConfirm(message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'zh-confirm-overlay';
        overlay.innerHTML = `
            <div class="zh-confirm-box">
                <p class="zh-confirm-text">${message}</p>
                <div class="zh-confirm-actions">
                    <button class="zh-confirm-btn" data-action="cancel">不保存，直接离开</button>
                    <button class="zh-confirm-btn zh-confirm-btn-primary" data-action="confirm">保存设置</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => {
            overlay.remove();
            if (onConfirm) onConfirm();
        });
        overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            overlay.remove();
            if (onCancel) onCancel();
        });
    }

    function isTypingTarget(target) {
        const el = target instanceof Element ? target : target?.parentElement;
        return !!el?.closest('input, textarea, select, [contenteditable="true"]');
    }

    function domToMarkdown(root, options = {}) {
        const includeImages = options.includeImages !== false;
        let imgCounter = 0;
        const lines = [];

        function processNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent.replace(/\n/g, ' ');
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return '';
            const tag = node.tagName;
            if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'BUTTON'].includes(tag)) return '';
            if (node.classList.contains('zh-hidden-by-immersive-inner') ||
                node.classList.contains('zh-tr-card') ||
                node.classList.contains('ContentItem-actions') ||
                node.classList.contains('zh-question-toolbar') ||
                node.classList.contains('zh-reader-top-nav') ||
                node.classList.contains('zh-img-placeholder')) return '';

            if (tag === 'IMG') {
                if (!includeImages) return '';
                const src = node.getAttribute('data-original') || node.getAttribute('data-actualsrc') || node.src || '';
                if (!src || /^data:/.test(src)) return '';
                imgCounter++;
                return `![图片#${imgCounter}](${src})`;
            }
            if (tag === 'BR') return '\n';
            if (tag === 'HR') return '\n---\n';

            const children = Array.from(node.childNodes).map(processNode).join('');

            if (tag === 'FIGURE') {
                return '\n' + children.trim() + '\n';
            }
            if (/^H[1-6]$/.test(tag)) {
                const level = parseInt(tag[1]);
                const prefix = '#'.repeat(level);
                return `\n${prefix} ${children.trim()}\n`;
            }
            if (tag === 'P') return '\n' + children.trim() + '\n';
            if (tag === 'BLOCKQUOTE') {
                return '\n' + children.trim().split('\n').map(l => '> ' + l).join('\n') + '\n';
            }
            if (tag === 'PRE') {
                const code = node.querySelector('code');
                const lang = code?.className?.match(/language-(\w+)/)?.[1] || '';
                const text = (code || node).textContent;
                return `\n\`\`\`${lang}\n${text}\n\`\`\`\n`;
            }
            if (tag === 'CODE' && node.parentElement?.tagName !== 'PRE') {
                return '`' + node.textContent + '`';
            }
            if (tag === 'STRONG' || tag === 'B') return `**${children.trim()}**`;
            if (tag === 'EM' || tag === 'I') return `*${children.trim()}*`;
            if (tag === 'S' || tag === 'DEL') return `~~${children.trim()}~~`;
            if (tag === 'A') {
                const href = node.getAttribute('href') || '';
                const text = children.trim();
                if (!href || href.startsWith('javascript:')) return text;
                return `[${text}](${href})`;
            }
            if (tag === 'UL' || tag === 'OL') return '\n' + children + '\n';
            if (tag === 'LI') {
                const parent = node.parentElement;
                const prefix = parent?.tagName === 'OL'
                    ? `${Array.from(parent.children).indexOf(node) + 1}. `
                    : '- ';
                return prefix + children.trim() + '\n';
            }
            if (tag === 'TABLE') return '\n' + tableToMarkdown(node) + '\n';
            if (tag === 'DIV' || tag === 'SECTION' || tag === 'ARTICLE') {
                return '\n' + children + '\n';
            }
            return children;
        }

        function tableToMarkdown(table) {
            const rows = Array.from(table.querySelectorAll('tr'));
            if (!rows.length) return '';
            const result = [];
            rows.forEach((row, i) => {
                const cells = Array.from(row.querySelectorAll('th, td'))
                    .map(cell => cell.textContent.replace(/\|/g, '\\|').replace(/\n/g, ' ').trim());
                result.push('| ' + cells.join(' | ') + ' |');
                if (i === 0) {
                    result.push('| ' + cells.map(() => '---').join(' | ') + ' |');
                }
            });
            return result.join('\n');
        }

        const raw = processNode(root);
        return raw.replace(/\n{3,}/g, '\n\n').trim();
    }

    function getArticleTitle() {
        const titleEl = document.querySelector('#immersive-wrapper .Post-Title') ||
                        document.querySelector('#immersive-wrapper h1');
        return titleEl?.textContent?.trim() || document.title.replace(/ - 知乎$/, '').trim();
    }

    function copyMarkdownFromPage(includeImages) {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return;

        let md = '';
        if (_questionState.view === 'answer') {
            const title = _questionState.questionTitle || getArticleTitle();
            md = `# ${title}\n\n`;
            const answerView = wrapper.querySelector('.zh-question-answer-view');
            if (answerView) {
                const answer = _questionState.answers[_questionState.currentIndex];
                if (answer?.author) md += `> 作者: ${answer.author}\n\n`;
                md += domToMarkdown(answerView, { includeImages });
            }
        } else {
            const title = getArticleTitle();
            const richText = wrapper.querySelector('.Post-RichTextContainer') ||
                             wrapper.querySelector('.RichText.ztext') ||
                             wrapper.querySelector('.RichText') ||
                             wrapper.querySelector('.Post-Main');
            md = `# ${title}\n\n`;
            if (richText) md += domToMarkdown(richText, { includeImages });
        }

        navigator.clipboard.writeText(md).then(() => {
            showToast(includeImages ? 'Markdown 已复制（含图片）' : 'Markdown 已复制（无图片）');
        }).catch(() => {
            showToast('复制失败，请手动复制');
        });
    }

    function createCopyMarkdownBtn() {
        const container = document.createElement('div');
        container.className = 'zh-copy-md-container';

        const mainBtn = document.createElement('button');
        mainBtn.className = 'zh-copy-md-btn';
        mainBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>复制 MD</span>';
        mainBtn.title = '复制为 Markdown（含图片）';
        mainBtn.addEventListener('click', () => copyMarkdownFromPage(true));

        const dropBtn = document.createElement('button');
        dropBtn.className = 'zh-copy-md-drop';
        dropBtn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>';
        dropBtn.title = '更多选项';

        const menu = document.createElement('div');
        menu.className = 'zh-copy-md-menu';
        menu.innerHTML = '<div class="zh-copy-md-option" data-mode="images">复制 Markdown（含图片）</div><div class="zh-copy-md-option" data-mode="no-images">复制 Markdown（忽略图片）</div>';

        menu.addEventListener('click', (e) => {
            const option = e.target.closest('.zh-copy-md-option');
            if (!option) return;
            const mode = option.dataset.mode;
            copyMarkdownFromPage(mode === 'images');
            menu.classList.remove('zh-copy-md-menu-show');
        });

        dropBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('zh-copy-md-menu-show');
        });

        document.addEventListener('click', () => menu.classList.remove('zh-copy-md-menu-show'));

        container.appendChild(mainBtn);
        container.appendChild(dropBtn);
        container.appendChild(menu);
        return container;
    }

// ═══════════════════════════════════════════════════════════
// 模块: api.js
// ═══════════════════════════════════════════════════════════
    async function callLLMMessages(messages, customKey = null, customHost = null, customModel = null) {
        const keyToUse = customKey || config.apiKey;
        const hostToUse = customHost || config.apiHost;
        const modelToUse = customModel || config.apiModel;

        if (!keyToUse) throw new Error("API Key 未配置！");
        const url = hostToUse.endsWith('/') ? hostToUse + 'chat/completions' : hostToUse + '/chat/completions';

        const payload = JSON.stringify({
            model: modelToUse,
            messages
        });

        if (typeof GM_xmlhttpRequest !== 'undefined') {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: url,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${keyToUse}`
                    },
                    data: payload,
                    timeout: 120000,
                    onload: function(res) {
                        if (res.status >= 200 && res.status < 300) {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (!data.choices || !data.choices[0]) throw new Error("API 响应格式异常");
                                resolve(data.choices[0].message.content.trim());
                            } catch (e) {
                                reject(new Error("API 数据解析失败: " + e.message));
                            }
                        } else {
                            let errMsg = `HTTP ${res.status}: `;
                            try {
                                const errData = JSON.parse(res.responseText);
                                errMsg += (errData.error?.message || res.statusText);
                            } catch(e) {
                                errMsg += res.statusText;
                            }
                            reject(new Error(errMsg));
                        }
                    },
                    onerror: function(err) {
                        reject(new Error("网络或跨域请求失败，请检查网络或 Host 地址"));
                    },
                    ontimeout: function() {
                        reject(new Error("请求超时"));
                    }
                });
            });
        } else {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${keyToUse}` },
                    body: payload,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (!res.ok) {
                    const errText = await res.text();
                    throw new Error(`HTTP ${res.status}: ${errText.substring(0, 300)}`);
                }
                const data = await res.json();
                return data.choices[0].message.content.trim();
            } catch (err) {
                clearTimeout(timeoutId);
                if (err.name === 'AbortError') {
                    throw new Error("请求超时");
                }
                throw err;
            }
        }
    }

    async function callLLM(systemPrompt, userPrompt, customKey = null, customHost = null, customModel = null) {
        return callLLMMessages([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ], customKey, customHost, customModel);
    }

    function isRetryableLLMError(err) {
        const message = String(err?.message || '');
        return /HTTP (429|500|502|503|504)|rate|too many|timeout|超时|网络|network/i.test(message);
    }

    function isContextTooLongError(err) {
        const message = String(err?.message || '');
        return /context|token|length|maximum|max|too large|上下文|长度|过长|超限/i.test(message);
    }

    async function callLLMMessagesWithRetry(messages, options = {}) {
        const retries = Number.isFinite(options.retries) ? options.retries : 2;
        let lastErr = null;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await callLLMMessages(messages, options.apiKey || null, options.apiHost || null, options.apiModel || null);
            } catch (err) {
                lastErr = err;
                if (!isRetryableLLMError(err) || attempt >= retries) break;
                await sleep(800 * (attempt + 1));
            }
        }
        throw lastErr;
    }

    async function callLLMWithRetry(systemPrompt, userPrompt, options = {}) {
        const retries = Number.isFinite(options.retries) ? options.retries : 2;
        let lastErr = null;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                if (options.apiKey || options.apiHost || options.apiModel) {
                    return await callLLMMessages([
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ], options.apiKey, options.apiHost, options.apiModel);
                }
                return await callLLM(systemPrompt, userPrompt);
            } catch (err) {
                lastErr = err;
                if (!isRetryableLLMError(err) || attempt >= retries) break;
                await sleep(800 * (attempt + 1));
            }
        }
        throw lastErr;
    }


    function getUserscriptXHR() {
        if (typeof GM_xmlhttpRequest === 'function') return GM_xmlhttpRequest;
        if (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function') return GM.xmlHttpRequest.bind(GM);
        return null;
    }

    function gmFetchText(url) {
        return new Promise((resolve, reject) => {
            if (!url) return reject(new Error('缺少 URL'));

            const xhr = getUserscriptXHR();
            if (xhr) {
                xhr({
                    method: 'GET',
                    url,
                    timeout: 20000,
                    anonymous: false,
                    responseType: 'text',
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Cache-Control': 'no-cache'
                    },
                    onload: res => {
                        if (res.status >= 200 && res.status < 300) resolve(res.responseText || '');
                        else reject(new Error(`HTTP ${res.status}`));
                    },
                    onerror: err => reject(new Error(`GM 跨域抓取失败：${err?.error || err?.message || '未知错误'}`)),
                    ontimeout: () => reject(new Error('页面抓取超时'))
                });
                return;
            }

            fetch(url, { credentials: 'include' })
                .then(res => res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`)))
                .then(resolve)
                .catch(err => reject(new Error(`原生 fetch 跨域失败：${err.message || err}`)));
        });
    }

    function gmFetchJSON(url) {
        return new Promise((resolve, reject) => {
            if (!url) return reject(new Error('缺少 URL'));

            const xhr = getUserscriptXHR();
            if (xhr) {
                xhr({
                    method: 'GET',
                    url,
                    timeout: 20000,
                    anonymous: false,
                    responseType: 'json',
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Cache-Control': 'no-cache'
                    },
                    onload: res => {
                        if (res.status < 200 || res.status >= 300) {
                            reject(new Error(`HTTP ${res.status}`));
                            return;
                        }
                        if (res.response && typeof res.response === 'object') {
                            resolve(res.response);
                            return;
                        }
                        try {
                            resolve(JSON.parse(res.responseText || '{}'));
                        } catch (err) {
                            reject(new Error(`JSON 解析失败：${err.message}`));
                        }
                    },
                    onerror: err => reject(new Error(`GM API 请求失败：${err?.error || err?.message || '未知错误'}`)),
                    ontimeout: () => reject(new Error('API 请求超时'))
                });
                return;
            }

            fetch(url, {
                credentials: 'include',
                headers: { 'Accept': 'application/json, text/plain, */*' }
            })
                .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
                .then(resolve)
                .catch(err => reject(new Error(`原生 fetch API 请求失败：${err.message || err}`)));
        });
    }

    function getNodeText(root, selector) {
        const node = root.querySelector(selector);
        return node ? normalizeText(node.textContent || '') : '';
    }

    function getNodesText(root, selector, limit = 6) {
        return Array.from(root.querySelectorAll(selector))
            .slice(0, limit)
            .map(node => normalizeText(node.textContent || ''))
            .filter(Boolean)
            .join('\n\n');
    }

    async function callEmbeddingAPI(texts) {
        const hostToUse = (config.embeddingHost || config.apiHost || '').trim();
        const keyToUse = (config.embeddingKey || config.apiKey || '').trim();
        const modelToUse = (config.embeddingModel || 'text-embedding-3-small').trim();

        if (!keyToUse) throw new Error('Embedding API Key 未配置');
        if (!hostToUse) throw new Error('Embedding API Host 未配置');

        const url = hostToUse.endsWith('/') ? hostToUse + 'embeddings' : hostToUse + '/embeddings';
        const input = Array.isArray(texts) ? texts : [texts];
        const payload = JSON.stringify({ model: modelToUse, input });

        if (typeof GM_xmlhttpRequest !== 'undefined') {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: url,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${keyToUse}`
                    },
                    data: payload,
                    timeout: 60000,
                    onload: function(res) {
                        if (res.status >= 200 && res.status < 300) {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (!data.data || !Array.isArray(data.data)) throw new Error('Embedding 响应格式异常');
                                const embeddings = data.data
                                    .sort((a, b) => a.index - b.index)
                                    .map(item => item.embedding);
                                resolve(embeddings);
                            } catch (e) {
                                reject(new Error('Embedding 数据解析失败: ' + e.message));
                            }
                        } else {
                            let errMsg = `HTTP ${res.status}: `;
                            try {
                                const errData = JSON.parse(res.responseText);
                                errMsg += (errData.error?.message || res.statusText);
                            } catch(e) {
                                errMsg += res.statusText;
                            }
                            reject(new Error(errMsg));
                        }
                    },
                    onerror: function() {
                        reject(new Error('Embedding 网络请求失败'));
                    },
                    ontimeout: function() {
                        reject(new Error('Embedding 请求超时'));
                    }
                });
            });
        } else {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${keyToUse}` },
                body: payload
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Embedding HTTP ${res.status}: ${errText.substring(0, 300)}`);
            }
            const data = await res.json();
            if (!data.data || !Array.isArray(data.data)) throw new Error('Embedding 响应格式异常');
            return data.data.sort((a, b) => a.index - b.index).map(item => item.embedding);
        }
    }


// ═══════════════════════════════════════════════════════════
// 模块: zhihu-action.js
// ═══════════════════════════════════════════════════════════
    /**
     * ============================================================================
     * 知乎写操作 API（赞同 / 反对 / 感谢 / 喜欢 / 收藏）
     *   - 同源请求，credentials:'include' 自动带 z_c0
     *   - 必须手动加 x-xsrftoken（= cookie 里的 _xsrf）
     *   - 不需要 x-zse-96，所有 voters/thankers/likers/collections 接口实测放行
     * ============================================================================
     */

    const ZHIHU_API_BASE = 'https://www.zhihu.com';

    function getXSRFToken() {
        const match = document.cookie.match(/(?:^|;\s*)_xsrf=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    }

    function buildZhihuActionUrl(path, query) {
        const url = path.startsWith('http')
            ? new URL(path)
            : new URL(path, ZHIHU_API_BASE);
        if (query && typeof query === 'object') {
            Object.entries(query).forEach(([k, v]) => {
                if (v === undefined || v === null) return;
                url.searchParams.set(k, String(v));
            });
        }
        return url.href;
    }

    async function zhihuFetch(method, path, options = {}) {
        const xsrf = getXSRFToken();
        if (!xsrf) {
            const err = new Error('缺少 _xsrf cookie，请先登录知乎');
            err.code = 'NO_XSRF';
            throw err;
        }

        const headers = {
            'x-xsrftoken': xsrf,
            'x-requested-with': 'fetch',
            'accept': 'application/json, text/plain, */*'
        };
        let body;
        if (options.body !== undefined) {
            headers['content-type'] = 'application/json';
            body = JSON.stringify(options.body);
        }

        const url = buildZhihuActionUrl(path, options.query);

        // zhuanlan.zhihu.com → www.zhihu.com 跨域，需要 GM_xmlhttpRequest
        const isCrossOrigin = !url.startsWith(location.origin);
        const xhr = isCrossOrigin ? getUserscriptXHR() : null;

        if (xhr) {
            return new Promise((resolve, reject) => {
                xhr({
                    method,
                    url,
                    headers,
                    data: body,
                    timeout: 15000,
                    anonymous: false,
                    responseType: 'text',
                    onload: res => {
                        let data = null;
                        if (res.responseText) {
                            try { data = JSON.parse(res.responseText); } catch (e) { data = res.responseText; }
                        }
                        if (res.status >= 200 && res.status < 300) {
                            resolve({ status: res.status, data });
                        } else {
                            const message = (data && typeof data === 'object' && (data.error?.message || data.message))
                                || (typeof data === 'string' && data.slice(0, 200))
                                || `HTTP ${res.status}`;
                            const err = new Error(`知乎接口错误：${message}`);
                            err.status = res.status;
                            err.data = data;
                            reject(err);
                        }
                    },
                    onerror: e => reject(new Error(`知乎接口网络错误：${e?.error || e?.message || '未知错误'}`)),
                    ontimeout: () => reject(new Error('知乎接口请求超时'))
                });
            });
        }

        const res = await fetch(url, {
            method,
            credentials: 'include',
            headers,
            body
        });

        const text = await res.text();
        let data = null;
        if (text) {
            try { data = JSON.parse(text); } catch (err) { data = text; }
        }

        if (!res.ok) {
            const message = (data && typeof data === 'object' && (data.error?.message || data.message))
                || (typeof data === 'string' && data.slice(0, 200))
                || `HTTP ${res.status}`;
            const err = new Error(`知乎接口错误：${message}`);
            err.status = res.status;
            err.data = data;
            throw err;
        }

        return { status: res.status, data };
    }

    function voteAnswer(answerId, dir) {
        if (!answerId) throw new Error('voteAnswer 缺少 answerId');
        if (!['up', 'down', 'neutral'].includes(dir)) throw new Error(`voteAnswer 非法方向：${dir}`);
        return zhihuFetch('POST', `/api/v4/answers/${answerId}/voters`, { body: { type: dir } });
    }

    function voteArticle(articleId, dir) {
        if (!articleId) throw new Error('voteArticle 缺少 articleId');
        if (![1, -1, 0].includes(dir)) throw new Error(`voteArticle 非法方向：${dir}`);
        return zhihuFetch('POST', `/api/v4/articles/${articleId}/voters`, { body: { voting: dir } });
    }

    function thankAnswer(answerId, on) {
        if (!answerId) throw new Error('thankAnswer 缺少 answerId');
        return on
            ? zhihuFetch('POST', `/api/v4/answers/${answerId}/thankers`, { body: {} })
            : zhihuFetch('DELETE', `/api/v4/answers/${answerId}/thankers`);
    }

    async function likeArticle(articleId, on) {
        if (!articleId) throw new Error('likeArticle 缺少 articleId');
        if (on) {
            return zhihuFetch('POST', `/api/v4/articles/${articleId}/likers`, { body: {} });
        }
        try {
            return await zhihuFetch('DELETE', `/api/v4/articles/${articleId}/likers`);
        } catch (err) {
            if (err.status === 404 || err.status === 405) {
                return zhihuFetch('POST', `/api/v4/articles/${articleId}/likers`, { body: { liking: 0 } });
            }
            throw err;
        }
    }

    function normalizeContentType(type) {
        if (type === 'answer' || type === 'article') return type;
        throw new Error(`未支持的收藏类型：${type}`);
    }

    function addCollection(collectionId, contentId, contentType) {
        if (!collectionId) {
            const err = new Error('未配置收藏夹 ID，请到设置面板填入');
            err.code = 'NO_COLLECTION_ID';
            throw err;
        }
        if (!contentId) throw new Error('addCollection 缺少 contentId');
        const t = normalizeContentType(contentType);
        return zhihuFetch('POST', `/api/v4/collections/${collectionId}/contents`, {
            query: { content_id: contentId, content_type: t }
        });
    }

    function removeCollection(collectionId, contentId, contentType) {
        if (!collectionId) {
            const err = new Error('未配置收藏夹 ID，请到设置面板填入');
            err.code = 'NO_COLLECTION_ID';
            throw err;
        }
        if (!contentId) throw new Error('removeCollection 缺少 contentId');
        const t = normalizeContentType(contentType);
        return zhihuFetch('DELETE', `/api/v4/collections/${collectionId}/contents/${contentId}`, {
            query: { content_type: t }
        });
    }

    async function fetchMyCollections(limit = 20) {
        const me = await zhihuFetch('GET', '/api/v4/me');
        const urlToken = me.data?.url_token;
        if (!urlToken) {
            const err = new Error('未获取到当前用户 url_token，请确认已登录');
            err.code = 'NO_URL_TOKEN';
            throw err;
        }
        const include = 'data[*].updated_time,answer_count,follower_count,creator,description,is_following,comment_count,created_time';
        const res = await zhihuFetch('GET', `/api/v4/people/${urlToken}/collections`, {
            query: { include, offset: 0, limit }
        });
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        return list.map(item => ({
            id: String(item.id),
            title: item.title || '(未命名收藏夹)',
            answerCount: item.answer_count ?? item.item_count ?? 0,
            isDefault: item.is_default === true
        }));
    }

    // ─── Action Bar 渲染层 ───────────────────────────────────────────────

    const ACTION_ICONS = {
        up: '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M13.792 3.681c-.781-1.406-2.803-1.406-3.584 0l-7.79 14.023c-.76 1.367.228 3.046 1.791 3.046h15.582c1.563 0 2.55-1.68 1.791-3.046l-7.79-14.023Z" clip-rule="evenodd"></path></svg>',
        down: '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M13.792 20.319c-.781 1.406-2.803 1.406-3.584 0L2.418 6.296c-.76-1.367.228-3.046 1.791-3.046h15.582c1.563 0 2.55 1.68 1.791 3.046l-7.79 14.023Z" clip-rule="evenodd"></path></svg>',
        comment: '<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.37c5.67 0 10.266 4.085 10.267 9.125 0 2.08-.786 3.997-2.105 5.532a1.064 1.064 0 0 0-.247.91l.644 3.056c.24 1.157-.66 1.58-1.444 1.157l-2.925-1.584c-.53-.287-1.153-.338-1.743-.21-.784.172-1.604.265-2.447.265-5.67 0-10.268-4.087-10.268-9.126C1.732 6.455 6.33 2.37 12 2.37Z"></path></svg>',
        star: '<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="currentColor"><path d="M10.424 2.828c.7-1.213 2.452-1.213 3.152 0l2.47 4.285c.038.064.1.109.172.124l4.839 1.027c1.37.29 1.912 1.956.974 2.997l-3.312 3.674a.26.26 0 0 0-.065.201l.52 4.92c.146 1.393-1.27 2.422-2.55 1.852l-4.518-2.014a.26.26 0 0 0-.212 0l-4.518 2.014c-1.28.57-2.696-.46-2.55-1.853l.52-4.919a.26.26 0 0 0-.065-.2L1.969 11.26c-.938-1.041-.396-2.707.974-2.997l4.839-1.027a.26.26 0 0 0 .171-.124l2.471-4.285Z"></path></svg>',
        heart: '<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M16.984 3.324c1.73.315 3.125 1.472 4.04 2.978 1.893 3.116.758 6.989-1.384 9.556a23.241 23.241 0 0 1-3.96 3.737c-.66.486-1.308.895-1.902 1.196-.579.294-1.166.517-1.695.57a.845.845 0 0 1-.145.002c-.529-.038-1.127-.267-1.708-.564a14.407 14.407 0 0 1-1.947-1.232 23.512 23.512 0 0 1-4.081-3.88C2.165 13.207 1.139 9.536 2.85 6.514 3.742 4.94 5.14 3.71 6.896 3.348c1.606-.332 3.363.094 5.103 1.394 1.696-1.267 3.409-1.704 4.985-1.418Z" clip-rule="evenodd"></path></svg>'
    };

    const _actionThrottles = new Map();

    function isActionThrottled(key) {
        const now = Date.now();
        if (_actionThrottles.has(key) && now - _actionThrottles.get(key) < 1000) return true;
        _actionThrottles.set(key, now);
        return false;
    }

    function buildActionBar(record) {
        const bar = document.createElement('div');
        bar.className = 'ContentItem-actions zh-api-action-bar';
        bar.dataset.recordKey = record.key || '';

        const isAnswer = record.apiTargetType === 'answer';
        const isArticle = record.apiTargetType === 'article';
        const hasVote = isAnswer || isArticle;
        const hasThank = isAnswer;
        const hasLike = isArticle;

        const voteCount = record.voteup_count ?? 0;
        const isVotedUp = record.voting === 1;
        const isVotedDown = record.voting === -1;

        let html = '';

        if (hasVote) {
            html += `<button class="zh-action-btn zh-action-vote-up${isVotedUp ? ' is-active' : ''}" data-action="vote-up" title="赞同">
                <span style="display:inline-flex;align-items:center">${ACTION_ICONS.up}</span>
                ${isVotedUp ? '已赞同' : '赞同'}${voteCount > 0 ? ' ' + voteCount : ''}
            </button>`;
            html += `<button class="zh-action-btn zh-action-vote-down${isVotedDown ? ' is-active' : ''}" data-action="vote-down" title="反对">
                <span style="display:inline-flex;align-items:center">${ACTION_ICONS.down}</span>
            </button>`;
        }

        if (record.comment_count != null) {
            html += `<a class="zh-action-btn zh-action-comment" href="${escapeHTML(record.url || '#')}" target="_blank" rel="noopener noreferrer" title="查看评论">
                <span style="display:inline-flex;align-items:center">${ACTION_ICONS.comment}</span>
                ${record.comment_count > 0 ? record.comment_count + ' 评论' : '评论'}
            </a>`;
        }

        html += `<button class="zh-action-btn zh-action-collect${record.collected ? ' is-active' : ''}" data-action="collect" title="收藏">
            <span style="display:inline-flex;align-items:center">${ACTION_ICONS.star}</span>
            ${record.collected ? '已收藏' : '收藏'}${record.favlists_count > 0 ? ' ' + record.favlists_count : ''}
        </button>`;

        if (hasThank) {
            html += `<button class="zh-action-btn zh-action-thank${record.thanked ? ' is-active' : ''}" data-action="thank" title="感谢">
                <span style="display:inline-flex;align-items:center">${ACTION_ICONS.heart}</span>
                ${record.thanked ? '已感谢' : '感谢'}
            </button>`;
        }
        if (hasLike) {
            html += `<button class="zh-action-btn zh-action-like${record.liked ? ' is-active' : ''}" data-action="like" title="喜欢">
                <span style="display:inline-flex;align-items:center">${ACTION_ICONS.heart}</span>
                ${record.liked ? '已喜欢' : '喜欢'}
            </button>`;
        }

        html += `<a class="zh-action-btn zh-action-open" href="${escapeHTML(record.url || '#')}" target="_blank" rel="noopener noreferrer">打开原文</a>`;

        bar.innerHTML = html;
        bindActionBar(bar, record);
        return bar;
    }

    function bindActionBar(bar, record) {
        bar.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const action = btn.dataset.action;
                const throttleKey = `${record.key}::${action}`;
                if (isActionThrottled(throttleKey)) return;
                btn.disabled = true;
                btn.style.opacity = '0.5';
                try {
                    await executeAction(record, action);
                    refreshActionBar(bar, record);
                } catch (err) {
                    console.warn('知乎互动失败:', action, err);
                    if (err.code === 'NO_COLLECTION_ID') {
                        showToast('请先到设置面板填入收藏夹 ID');
                    } else if (err.code === 'NO_XSRF' || err.status === 401) {
                        showToast('请先登录知乎');
                    } else {
                        showToast('操作失败：' + (err.message || err).slice(0, 60));
                    }
                } finally {
                    btn.disabled = false;
                    btn.style.opacity = '';
                }
            });
        });
    }

    async function executeAction(record, action) {
        const id = record.apiTargetId;
        const isAnswer = record.apiTargetType === 'answer';
        const isArticle = record.apiTargetType === 'article';

        switch (action) {
            case 'vote-up': {
                const newDir = record.voting === 1 ? 'neutral' : 'up';
                if (isAnswer) {
                    await voteAnswer(id, newDir === 'up' ? 'up' : 'neutral');
                } else {
                    await voteArticle(id, newDir === 'up' ? 1 : 0);
                }
                record.voting = newDir === 'up' ? 1 : 0;
                if (newDir === 'up') record.voteup_count = (record.voteup_count || 0) + 1;
                else record.voteup_count = Math.max(0, (record.voteup_count || 0) - 1);
                break;
            }
            case 'vote-down': {
                const newDir = record.voting === -1 ? 'neutral' : 'down';
                if (record.voting === 1) record.voteup_count = Math.max(0, (record.voteup_count || 0) - 1);
                if (isAnswer) {
                    await voteAnswer(id, newDir === 'down' ? 'down' : 'neutral');
                } else {
                    await voteArticle(id, newDir === 'down' ? -1 : 0);
                }
                record.voting = newDir === 'down' ? -1 : 0;
                break;
            }
            case 'thank': {
                const on = !record.thanked;
                await thankAnswer(id, on);
                record.thanked = on;
                break;
            }
            case 'like': {
                const on = !record.liked;
                await likeArticle(id, on);
                record.liked = on;
                break;
            }
            case 'collect': {
                const cid = config.defaultCollectionId;
                const contentType = isAnswer ? 'answer' : 'article';
                if (record.collected) {
                    await removeCollection(cid, id, contentType);
                    record.collected = false;
                } else {
                    await addCollection(cid, id, contentType);
                    record.collected = true;
                }
                break;
            }
        }
        persistHomeFeedCache();
    }

    function refreshActionBar(bar, record) {
        const newBar = buildActionBar(record);
        bar.innerHTML = newBar.innerHTML;
        bindActionBar(bar, record);
    }


// ═══════════════════════════════════════════════════════════
// 模块: cache.js
// ═══════════════════════════════════════════════════════════
    function openQuestionCacheDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error('当前环境不支持 IndexedDB'));
                return;
            }
            const req = indexedDB.open(QUESTION_CACHE_DB, 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(QUESTION_CACHE_STORE)) {
                    db.createObjectStore(QUESTION_CACHE_STORE, { keyPath: 'cacheKey' });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function getQuestionCacheRecord(cacheKey) {
        const db = await openQuestionCacheDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(QUESTION_CACHE_STORE, 'readonly');
            const req = tx.objectStore(QUESTION_CACHE_STORE).get(cacheKey);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
            tx.oncomplete = () => db.close();
            tx.onerror = () => db.close();
        });
    }

    async function putQuestionCacheRecord(record) {
        const db = await openQuestionCacheDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(QUESTION_CACHE_STORE, 'readwrite');
            tx.objectStore(QUESTION_CACHE_STORE).put(record);
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); reject(tx.error); };
        });
    }

    function loadTranslationCache() {
        try {
            const raw = crossOriginGet(TRANSLATION_CACHE_KEY);
            const parsed = raw ? JSON.parse(raw) : null;
            return parsed && typeof parsed === 'object'
                ? { entries: parsed.entries || {}, order: Array.isArray(parsed.order) ? parsed.order : [] }
                : { entries: {}, order: [] };
        } catch (err) {
            console.warn('知乎沉浸式阅读：翻译缓存读取失败', err);
            return { entries: {}, order: [] };
        }
    }

    function saveTranslationCache(cache) {
        const entries = cache.entries || {};
        let order = Array.isArray(cache.order) ? cache.order.filter(key => entries[key]) : Object.keys(entries);
        const seen = new Set();
        order = order.filter(key => {
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        while (order.length > TRANSLATION_CACHE_MAX) {
            const oldKey = order.shift();
            delete entries[oldKey];
        }
        try {
            crossOriginSet(TRANSLATION_CACHE_KEY, JSON.stringify({ entries, order }));
        } catch (err) {
            while (order.length > Math.floor(TRANSLATION_CACHE_MAX / 2)) {
                const oldKey = order.shift();
                delete entries[oldKey];
            }
            try {
                crossOriginSet(TRANSLATION_CACHE_KEY, JSON.stringify({ entries, order }));
            } catch (innerErr) {
                console.warn('知乎沉浸式阅读：翻译缓存写入失败', innerErr);
            }
        }
    }

    function makeTranslationCacheKey(type, content) {
        return [
            type,
            config.apiHost || '',
            config.apiModel || '',
            config.targetLang || '',
            stableHash(content)
        ].join('::');
    }

    function normalizeTranslationCacheText(text) {
        return String(text || '')
            .replace(/\u200b/g, '')
            .replace(/图片已隐藏，点击显示/g, '')
            .replace(/正在高强度研读全文并提取摘要/g, '')
            .replace(/解析队列中/g, '')
            .replace(/▶ 点击请求 AI 翻译此段/g, '')
            .replace(/正在重新生成翻译/g, '')
            .replace(/重新生成/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function getSummaryCacheContent(fullText) {
        return normalizeTranslationCacheText(fullText);
    }

    function getTranslationCache(type, content) {
        const key = makeTranslationCacheKey(type, content);
        if (_translationMemoryCache.has(key)) {
            console.info(`[Zhihu TR Cache] memory hit: ${type}`);
            return _translationMemoryCache.get(key);
        }
        const cache = loadTranslationCache();
        const value = cache.entries[key]?.value || '';
        if (value) {
            _translationMemoryCache.set(key, value);
            console.info(`[Zhihu TR Cache] localStorage hit: ${type}`);
        } else {
            console.info(`[Zhihu TR Cache] miss: ${type} ${stableHash(content)}`);
        }
        return value;
    }

    function setTranslationCache(type, content, value) {
        if (!value) return;
        const cache = loadTranslationCache();
        const key = makeTranslationCacheKey(type, content);
        cache.entries[key] = { value, savedAt: Date.now() };
        cache.order = (cache.order || []).filter(item => item !== key);
        cache.order.push(key);
        _translationMemoryCache.set(key, value);
        console.info(`[Zhihu TR Cache] saved: ${type} ${stableHash(content)}`);
        saveTranslationCache(cache);
    }

// ═══════════════════════════════════════════════════════════
// 模块: ui.js
// ═══════════════════════════════════════════════════════════
    const THEME_STORAGE_KEY = 'zh-immersive-theme-index';

    // 启动时把用户自定义主题追加进 THEMES（mutate，不重新赋值 const）
    function loadCustomThemes() {
        try {
            const raw = crossOriginGet(CUSTOM_THEMES_KEY);
            const list = raw ? JSON.parse(raw) : [];
            if (Array.isArray(list)) {
                list.forEach(t => {
                    if (t && t.name && t.vars && !THEMES.some(x => x.name === t.name)) THEMES.push(t);
                });
            }
        } catch (e) {}
    }
    loadCustomThemes();

    function saveCustomThemes() {
        const custom = THEMES.filter(t => t.custom);
        try { crossOriginSet(CUSTOM_THEMES_KEY, JSON.stringify(custom)); } catch (e) {}
    }

    function addCustomTheme(name, vars) {
        const theme = { name, vars, custom: true };
        THEMES.push(theme);
        saveCustomThemes();
        return THEMES.length - 1;
    }

    // 容错解析主题对象：先严格 JSON，失败再把单引号/无引号 key normalize 后重试
    function parseThemeJSON(raw) {
        const text = String(raw).trim().replace(/;$/, '');
        try { return JSON.parse(text); } catch (e) {}
        try {
            const normalized = text
                .replace(/'/g, '"')
                .replace(/([{,]\s*)([A-Za-z_$][\w$-]*)\s*:/g, '$1"$2":')
                .replace(/,\s*([}\]])/g, '$1');
            return JSON.parse(normalized);
        } catch (e) { return null; }
    }

    function removeCustomTheme(name) {
        const idx = THEMES.findIndex(t => t.custom && t.name === name);        if (idx < 0) return;
        THEMES.splice(idx, 1);
        saveCustomThemes();
        if (currentThemeIndex >= THEMES.length) applyTheme(0);
    }

    let currentThemeIndex = (() => {
        try {
            if (typeof GM_getValue === 'function') {
                const gm = GM_getValue(THEME_STORAGE_KEY, null);
                if (gm !== null) { const idx = parseInt(gm, 10); if (idx >= 0 && idx < THEMES.length) return idx; }
            }
            const saved = localStorage.getItem(THEME_STORAGE_KEY);
            const idx = saved !== null ? parseInt(saved, 10) : 0;
            return (idx >= 0 && idx < THEMES.length) ? idx : 0;
        } catch (e) { return 0; }
    })();
    function applyTheme(index) {
        const safeIndex = (index >= 0 && index < THEMES.length) ? index : 0;
        currentThemeIndex = safeIndex;
        const theme = THEMES[safeIndex];
        const root = document.documentElement;
        for (let key in theme.vars) root.style.setProperty(key, theme.vars[key], 'important');
        try { localStorage.setItem(THEME_STORAGE_KEY, String(safeIndex)); } catch (e) {}
        try { if (typeof GM_setValue === 'function') GM_setValue(THEME_STORAGE_KEY, String(safeIndex)); } catch (e) {}
    }

    function sanitizeLLMHTML(content) {
        const template = document.createElement('template');
        template.innerHTML = String(content || '');

        const allowedTags = new Set([
            'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD', 'CAPTION', 'COLGROUP', 'COL',
            'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'CODE', 'PRE', 'BLOCKQUOTE',
            'UL', 'OL', 'LI', 'SPAN', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SUP', 'SUB',
            'MATH', 'SEMANTICS', 'MROW', 'MI', 'MO', 'MN', 'MSUP', 'MSUB', 'MFRAC', 'MSQRT',
            'MOVER', 'MUNDER', 'MUNDEROVER', 'MTABLE', 'MTR', 'MTD', 'MTEXT', 'MSPACE', 'ANNOTATION'
        ]);
        const allowedAttrs = new Set(['colspan', 'rowspan', 'scope', 'align', 'class', 'data-tex', 'encoding']);
        const allowedClasses = /^(ztext-math|math|katex|MathJax)/;
        const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
        const unsafeNodes = [];

        while (walker.nextNode()) {
            const el = walker.currentNode;
            if (!allowedTags.has(el.tagName)) {
                unsafeNodes.push(el);
                continue;
            }

            Array.from(el.attributes).forEach(attr => {
                const name = attr.name.toLowerCase();
                if (name.startsWith('on') || name === 'style' || !allowedAttrs.has(name)) {
                    el.removeAttribute(attr.name);
                }
            });
            if (el.hasAttribute('class')) {
                const classes = el.getAttribute('class').split(/\s+/).filter(c => allowedClasses.test(c));
                if (classes.length) el.setAttribute('class', classes.join(' '));
                else el.removeAttribute('class');
            }
        }

        unsafeNodes.forEach(el => el.replaceWith(document.createTextNode(el.textContent || '')));
        return template.innerHTML;
    }

    function triggerMathJaxTypeset(el) {
        if (window.MathJax) {
            if (MathJax.typesetPromise) MathJax.typesetPromise([el]).catch(() => {});
            else if (MathJax.Hub) MathJax.Hub.Queue(['Typeset', MathJax.Hub, el]);
        }
    }

    function getImagePlaceholder(img) {
        const next = img.nextElementSibling;
        return next && next.classList.contains('zh-img-placeholder') ? next : null;
    }

    function isImageToggleExcluded(img) {
        const classText = String(img.className || '');
        if (img.classList.contains('Avatar') || /(^|\s|-)avatar(\s|-|$)/i.test(classText)) return true;
        return !!img.closest([
            '.Post-Header',
            '.css-34mzkj',
            '.AuthorInfo',
            '.ContentItem-meta',
            '.AnswerItem-authorInfo',
            '.AuthorInfo-avatarWrapper',
            '.UserLink',
            '.Avatar',
            '[class*="Avatar"]',
            '[class*="avatar"]',
            '.zh-answer-list-meta',
            '.zh-home-card-meta',
            '.zh-moment-action',
            '.zh-home-api-item .AuthorInfo',
            '.Reward',
            '.ContentItem-actions',
            '.zh-home-list',
            '.zh-question-list'
        ].join(', '));
    }

    function clearImageToggle(img) {
        const placeholder = getImagePlaceholder(img);
        if (placeholder) placeholder.remove();
        img.classList.remove('zh-img-hidden');
        delete img.dataset.zhImgHidden;
    }

    function setImageHidden(img, hidden) {
        if (hidden && isImageToggleExcluded(img)) {
            clearImageToggle(img);
            return;
        }
        const placeholder = getImagePlaceholder(img);
        img.classList.toggle('zh-img-hidden', hidden);
        img.dataset.zhImgHidden = hidden ? '1' : '0';
        if (placeholder) placeholder.style.display = hidden ? 'flex' : 'none';
    }

    function setupImageToggles() {
        document.querySelectorAll('#immersive-wrapper img').forEach(img => {
            const realSrc = img.getAttribute('data-original') || img.getAttribute('data-actualsrc');
            if (realSrc) img.src = realSrc;

            if (isImageToggleExcluded(img)) {
                clearImageToggle(img);
                return;
            }

            let placeholder = getImagePlaceholder(img);
            if (!placeholder) {
                placeholder = document.createElement('div');
                placeholder.className = 'zh-img-placeholder';
                placeholder.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span>查看图片</span>';
                img.insertAdjacentElement('afterend', placeholder);
            }

            placeholder.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (config.imageMode === 'collapse') {
                    setImageHidden(img, false);
                } else {
                    showImagePreview(img.src || realSrc);
                }
            };

            if (!img.dataset.zhImageToggleReady) {
                img.addEventListener('click', (event) => {
                    if (!window._isImmersive || img.classList.contains('zh-img-hidden') || isImageToggleExcluded(img)) return;
                    event.preventDefault();
                    event.stopPropagation();
                    if (config.imageMode === 'collapse') {
                        setImageHidden(img, true);
                    } else {
                        showImagePreview(img.src || realSrc);
                    }
                });
                img.dataset.zhImageToggleReady = '1';
            }

            setImageHidden(img, !!config.autoHideImages);
        });
    }

    function showImagePreview(src) {
        if (!src) return;
        const overlay = document.createElement('div');
        overlay.className = 'zh-img-preview-overlay';
        overlay.innerHTML = `<img src="${src}" class="zh-img-preview-img">`;
        overlay.addEventListener('click', () => overlay.remove());
        document.body.appendChild(overlay);
    }

    function resetImageToggles() {
        document.querySelectorAll('.zh-img-placeholder').forEach(placeholder => placeholder.remove());
        document.querySelectorAll('img.zh-img-hidden').forEach(img => {
            img.classList.remove('zh-img-hidden');
            delete img.dataset.zhImgHidden;
        });
    }

    /**
     * ============================================================================
     * 模态框 / UI 构建函数 (使用常量区的HTML模板)
     * ============================================================================
     */
    function createModal(id, title, innerHTML, onClose) {
        const overlay = document.createElement('div');
        overlay.id = id;
        overlay.className = 'zh-modal-overlay';
        overlay.innerHTML = `
            <div class="zh-modal">
                <div class="zh-modal-header">
                    <span>${title}</span>
                    <button class="zh-modal-close" id="${id}-close-btn">×</button>
                </div>
                <div class="zh-modal-body">${innerHTML}</div>
            </div>
        `;
        document.body.appendChild(overlay);

        const closeWithAnim = () => {
            overlay.classList.add('zh-modal-closing');
            setTimeout(() => {
                if (onClose) onClose();
                else overlay.remove();
            }, 200);
        };

        document.getElementById(`${id}-close-btn`).addEventListener('click', closeWithAnim);
        
        // 点击遮罩背景也可以关闭模态窗
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeWithAnim();
            }
        });

        return overlay;
    }

    //

function S2translate(id, title, innerHTML) {
    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = 'zh-modal-overlay';
    
    // 1. 布局调整：推到左下角，并修复溢出问题
    overlay.style.alignItems = 'flex-end';       // 垂直方向靠底
    overlay.style.justifyContent = 'flex-start'; // 水平方向靠左
    overlay.style.padding = '24px';              // 距离左下角留出 24px 的安全边距
    // ⚠️ 关键修复：强行改变盒模型，防止 padding 撑爆 100% 的 height，导致模态框被挤出屏幕
    overlay.style.boxSizing = 'border-box';      

    // 2. 结构优化：限制最大高度，内容超长时内部滚动
    overlay.innerHTML = `
        <div class="zh-modal" style="margin: 0; max-height: 100%; display: flex; flex-direction: column;">
            <div class="zh-modal-header" style="flex-shrink: 0; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.1);">
                <span style="font-weight: bold;">${title}</span>
                <button class="zh-modal-close" id="${id}-close-btn" style="background: transparent; border: none; font-size: 20px; cursor: pointer;">×</button>
            </div>
            <div class="zh-modal-body" style="padding: 15px; overflow-y: auto; flex-grow: 1;">
                ${innerHTML}
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // 3. 点击 ❌ 按钮关闭
    document.getElementById(`${id}-close-btn`).addEventListener('click', () => {
        overlay.remove();
    });

    // 4. 点击遮罩层关闭 (Click Outside to Close)
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            overlay.remove();
        }
    });

    return overlay;
}

    function readApiSettingsFromForm() {
        return {
            apiHost: (document.getElementById('zh-cfg-host')?.value || '').trim(),
            apiKey: (document.getElementById('zh-cfg-key')?.value || '').trim(),
            apiModel: (document.getElementById('zh-cfg-model')?.value || '').trim()
        };
    }

    function readSettingsFromForm() {
        const shareFormat = document.getElementById('zh-cfg-share-format')?.value || 'svg';
        const imageMode = document.getElementById('zh-cfg-image-mode')?.value || 'preview';
        return {
            ...readApiSettingsFromForm(),
            targetLang: document.getElementById('zh-cfg-lang').value,
            radarInterestTags: (document.getElementById('zh-cfg-radar-tags')?.value || '').trim(),
            autoSum: document.getElementById('zh-cfg-autosum').checked,
            autoTr: document.getElementById('zh-cfg-autotr').checked,
            autoHideImages: document.getElementById('zh-cfg-auto-hide-images').checked,
            imageMode: imageMode === 'collapse' ? 'collapse' : 'preview',
            shareExportFormat: ['html', 'svg', 'png', 'webp'].includes(shareFormat) ? shareFormat : 'svg',
            answerPreviewMode: document.getElementById('zh-cfg-answer-preview').value,
            embeddingHost: (document.getElementById('zh-cfg-embedding-host')?.value || '').trim(),
            embeddingModel: (document.getElementById('zh-cfg-embedding-model')?.value || '').trim() || 'text-embedding-3-small',
            embeddingKey: (document.getElementById('zh-cfg-embedding-key')?.value || '').trim(),
            defaultCollectionId: (document.getElementById('zh-cfg-collection-id')?.value || '').trim()
        };
    }

    function showPromptPreviewModal() {
        if (document.getElementById('zh-prompts-modal')) return;
        const content = [
            '【学习卡片系统提示词】',
            getWikiLearningCardSystemPrompt(),
            '',
            '【总览系统提示词】',
            getWikiSynthesisSystemPrompt(),
            '',
            '【阅读笔记系统提示词】',
            getRadarReportSystemPrompt(),
            '',
            '【翻译摘要提示词】',
            '你是一个阅读助手。请将文章提炼为100字左右的摘要，主要用于提供上下文。不要有任何多余的客套话。',
            '',
            '【段落翻译提示词模板】',
            `你是一个翻译专家。请翻译到目标语言：【${config.targetLang}】。注意：如果是表格则输出完整HTML表格结构；遇到公式块、代码块请原文保留，不可随意篡改。输出纯内容，不要markdown格式的标记。`
        ].join('\n\n');
        createModal('zh-prompts-modal', '当前系统提示词预览', `<pre style="white-space:pre-wrap;word-break:break-word;background:var(--zh-code);border:1px solid var(--zh-border);border-radius:4px;padding:12px;max-height:60vh;overflow:auto;">${escapeHTML(content)}</pre>`);
    }

    function showSettingsModal() {
        if(document.getElementById('zh-settings-modal')) return;

        const getFormSnapshot = () => JSON.stringify(readSettingsFromForm());
        let initialSnapshot = '';

        function closeSettingsModal() {
            document.getElementById('zh-settings-modal')?.remove();
        }

        async function commitSettingsSave(onDone) {
            const next = readSettingsFromForm();
            const prevModel = (config.embeddingModel || '').trim();
            const nextModel = (next.embeddingModel || '').trim();
            if (nextModel && prevModel && nextModel !== prevModel) {
                let hasEmbeddings = false;
                try {
                    hasEmbeddings = (await getAllWikiCards()).some(c => c.embedding && c.embedding.length);
                } catch (e) {}
                if (hasEmbeddings) {
                    const ok = window.confirm(`检测到 Embedding 模型从「${prevModel}」改为「${nextModel}」。\n\n不同模型生成的向量互不兼容，旧向量将无法用于语义搜索。\n\n点「确定」：清空全部已有向量（卡片正文保留），之后可重新跑 Embedding；\n点「取消」：保留旧向量，本次不更换模型。`);
                    if (!ok) {
                        next.embeddingModel = prevModel;
                    } else {
                        try {
                            const cleared = await clearAllCardEmbeddings();
                            showToast(`已清空 ${cleared} 条旧向量`);
                        } catch (e) {
                            alert('清空旧向量失败：' + e.message);
                            return;
                        }
                    }
                }
            }
            saveConfig(next);
            if (window._isImmersive) setupImageToggles();
            onDone?.();
            showToast('设置已保存');
        }

        function tryClose() {
            if (initialSnapshot && getFormSnapshot() !== initialSnapshot) {
                showConfirm('设置有未保存的改动，是否保存？', () => {
                    commitSettingsSave(closeSettingsModal);
                }, closeSettingsModal);
            } else {
                closeSettingsModal();
            }
        }

        createModal('zh-settings-modal', '⚙️ 设置偏好', SETTINGS_MODAL_HTML(config), tryClose);
        requestAnimationFrame(() => { initialSnapshot = getFormSnapshot(); });

        // 绑定眼睛图标的切换事件
        document.getElementById('zh-toggle-eye').addEventListener('click', function() {
            const input = document.getElementById('zh-cfg-key');
            if (input.type === 'password') {
                input.type = 'text';
                this.innerHTML = `<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"></path></svg>`;
            } else {
                input.type = 'password';
                this.innerHTML = `<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            }
        });
        bindApiProfileControls();

        // 测试 API 按钮
        document.getElementById('zh-test-api-btn').addEventListener('click', async function() {
            const apiSettings = readApiSettingsFromForm();
            const resDiv = document.getElementById('zh-test-res');
            resDiv.style.display = 'block';
            resDiv.style.color = 'var(--zh-text)';
            resDiv.innerHTML = `<span class="zh-spinner"></span>正在向主机发送问候...`;

            try {
                const testRes = await callLLM("你是一个连通性测试助手。请只回答'✅ 连接成功！'", "Test", apiSettings.apiKey, apiSettings.apiHost, apiSettings.apiModel);
                saveConfig(apiSettings);
                initialSnapshot = getFormSnapshot();
                resDiv.style.color = 'green';
                resDiv.innerText = `${testRes || '✅ 连接成功！'}\n已同步本次 Host / Key / Model，后续摘要会使用这套配置。`;
            } catch (err) {
                resDiv.style.color = 'red';
                resDiv.innerText = '❌ ' + err.message;
            }
        });

        document.getElementById('zh-preview-prompts-btn').addEventListener('click', showPromptPreviewModal);

        document.getElementById('zh-fetch-collections-btn').addEventListener('click', async () => {
            const status = document.getElementById('zh-fetch-collections-status');
            const list = document.getElementById('zh-collections-list');
            const input = document.getElementById('zh-cfg-collection-id');
            status.textContent = '正在拉取...';
            status.style.color = 'var(--zh-text)';
            list.innerHTML = '';
            try {
                const collections = await fetchMyCollections(50);
                if (!collections.length) {
                    status.textContent = '未拉到任何收藏夹（可能未登录或账号下没有收藏夹）。';
                    return;
                }
                const def = collections.find(c => c.isDefault);
                status.textContent = def
                    ? `共 ${collections.length} 个，默认收藏夹「${def.title}」(id=${def.id})。点击列表项可改填其它。`
                    : `共 ${collections.length} 个收藏夹，点击即可填入 ID。`;
                if (def && !input.value.trim()) input.value = def.id;
                list.innerHTML = collections.map(c => `
                    <div class="zh-collection-row" data-cid="${escapeHTML(c.id)}" style="display:flex;justify-content:space-between;gap:8px;padding:6px 8px;border:1px solid var(--zh-border);border-radius:4px;margin-bottom:4px;cursor:pointer;background:var(--zh-quote);">
                        <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(c.title)}${c.isDefault ? ' <span style="color:var(--zh-accent);font-size:11px;border:1px solid var(--zh-accent);padding:0 4px;border-radius:3px;margin-left:4px;">默认</span>' : ''}</span>
                        <span style="opacity:.6;font-size:12px;flex-shrink:0;">${c.answerCount} 项 · id=${escapeHTML(c.id)}</span>
                    </div>
                `).join('');
                list.querySelectorAll('.zh-collection-row').forEach(row => {
                    row.addEventListener('click', () => {
                        const cid = row.getAttribute('data-cid');
                        input.value = cid;
                        status.style.color = 'green';
                        status.textContent = `已填入收藏夹 ID：${cid}（记得保存）`;
                    });
                });
            } catch (err) {
                status.style.color = 'red';
                status.textContent = '拉取失败：' + (err.message || err);
            }
        });

        // 自定义主题：渲染已有列表 + 添加/删除
        function renderCustomThemeList() {
            const box = document.getElementById('zh-custom-theme-list');
            if (!box) return;
            const customs = THEMES.filter(t => t.custom);
            box.innerHTML = customs.length
                ? customs.map(t => `
                    <div class="zh-custom-theme-row" data-name="${escapeHTML(t.name)}" style="display:flex; align-items:center; gap:8px; padding:6px 8px; border:1px solid var(--zh-border); border-radius:4px; margin-bottom:4px; background:var(--zh-quote);">
                        <span style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(t.name)}</span>
                        <span style="display:inline-flex; gap:3px;">${THEME_VAR_GUIDE.slice(0,5).map(v => `<span style="width:14px;height:14px;border-radius:3px;border:1px solid var(--zh-border);background:${escapeHTML(t.vars[v.key] || '#000')};"></span>`).join('')}</span>
                        <button type="button" class="zh-inline-btn zh-apply-theme" style="padding:3px 8px; font-size:12px;">应用</button>
                        <button type="button" class="zh-inline-btn zh-del-theme" style="padding:3px 8px; font-size:12px;">删除</button>
                    </div>
                `).join('')
                : '<div style="opacity:.6;">还没有自定义主题。</div>';
            box.querySelectorAll('.zh-custom-theme-row').forEach(row => {
                const name = row.getAttribute('data-name');
                row.querySelector('.zh-apply-theme').addEventListener('click', () => {
                    applyTheme(THEMES.findIndex(t => t.name === name));
                    showToast(`已应用主题「${name}」`);
                });
                row.querySelector('.zh-del-theme').addEventListener('click', () => {
                    removeCustomTheme(name);
                    renderCustomThemeList();
                    showToast('已删除主题');
                });
            });
        }
        renderCustomThemeList();

        document.getElementById('zh-add-theme-btn').addEventListener('click', () => {
            const name = (document.getElementById('zh-theme-name').value || '').trim();
            if (!name) { showToast('请先填写主题名'); return; }
            if (THEMES.some(t => t.name === name)) { showToast('已存在同名主题'); return; }
            const vars = {};
            document.querySelectorAll('#zh-theme-var-grid .zh-theme-var').forEach(inp => {
                vars[inp.getAttribute('data-var')] = inp.value;
            });
            const idx = addCustomTheme(name, vars);
            applyTheme(idx);
            document.getElementById('zh-theme-name').value = '';
            renderCustomThemeList();
            showToast(`已添加并应用「${name}」`);
        });

        document.getElementById('zh-theme-tutorial-btn').addEventListener('click', showThemeTutorialModal);

        document.getElementById('zh-import-theme-btn').addEventListener('click', () => {
            const raw = (document.getElementById('zh-theme-json').value || '').trim();
            if (!raw) { showToast('请先粘贴 JSON'); return; }
            const obj = parseThemeJSON(raw);
            if (!obj || !obj.name || !obj.vars || typeof obj.vars !== 'object') { showToast('JSON 格式不对，需含 name 和 vars'); return; }
            const name = String(obj.name).trim();
            if (THEMES.some(t => t.name === name)) { showToast('已存在同名主题'); return; }
            const vars = {};
            THEME_VAR_GUIDE.forEach(v => { vars[v.key] = obj.vars[v.key] || v.def; });
            const idx = addCustomTheme(name, vars);
            applyTheme(idx);
            document.getElementById('zh-theme-json').value = '';
            renderCustomThemeList();
            showToast(`已导入并应用「${name}」`);
        });

        // 保存配置按钮
        document.getElementById('zh-save-settings-btn').addEventListener('click', () => {
            commitSettingsSave(() => {
                initialSnapshot = getFormSnapshot();
                closeSettingsModal();
            });
        });
    }

    function showThemeTutorialModal() {
        if (document.getElementById('zh-theme-tutorial-modal')) return;
        const template = JSON.stringify({
            name: '🌙 我的主题',
            vars: Object.fromEntries(THEME_VAR_GUIDE.map(v => [v.key, v.def]))
        }, null, 2);
        const rows = THEME_VAR_GUIDE.map(v => `
            <div style="display:flex; gap:8px; padding:6px 0; border-bottom:1px dashed var(--zh-border);">
                <code style="color:var(--zh-accent); flex-shrink:0; width:120px;">${escapeHTML(v.key)}</code>
                <span><b>${escapeHTML(v.label)}</b> — ${escapeHTML(v.desc)}</span>
            </div>
        `).join('');
        createModal('zh-theme-tutorial-modal', '🎨 主题模板与字段说明', `
            <div style="font-size:13px; line-height:1.7; margin-bottom:12px;">复制下面的模板，把每个颜色改成你想要的值（支持 #RRGGBB），再粘回导入框点「导入 JSON 主题」。单引号、无引号 key 也能识别。</div>
            <pre style="background:var(--zh-code); border:1px solid var(--zh-border); border-radius:4px; padding:12px; font-size:12px; overflow:auto; max-height:240px; margin:0 0 8px;"><code>${escapeHTML(template)}</code></pre>
            <button id="zh-copy-theme-template" type="button" class="zh-inline-btn" style="padding:6px 12px; font-size:13px; margin-bottom:16px;">一键复制模板</button>
            <div style="font-weight:bold; color:var(--zh-accent); margin-bottom:6px;">字段说明</div>
            <div style="font-size:13px;">${rows}</div>
        `);
        document.getElementById('zh-copy-theme-template').addEventListener('click', () => {
            navigator.clipboard.writeText(template).then(() => showToast('模板已复制')).catch(() => showToast('复制失败'));
        });
    }

    function showHelpModal() {
        if(document.getElementById('zh-help-modal')) return;
        createModal('zh-help-modal', '❓ 卷轴指南', HELP_MODAL_HTML);
    }


// ═══════════════════════════════════════════════════════════
// 模块: translation.js
// ═══════════════════════════════════════════════════════════
    /**
     * ============================================================================
     * 翻译 & 摘要核心逻辑
     * ============================================================================
     */
    async function generateSummary(fullText) {
        if (_articleSummary) return _articleSummary;
        const cacheContent = getSummaryCacheContent(fullText);
        const cached = getTranslationCache('summary', cacheContent);
        if (cached) {
            _articleSummary = cached;
            window._articleSummary = _articleSummary;
            return _articleSummary;
        }
        const sys = "你是一个阅读助手。请将文章提炼为100字左右的摘要，主要用于提供上下文。不要有任何多余的客套话。";
        _articleSummary = await callLLMWithRetry(sys, fullText, { retries: 2 });
        setTranslationCache('summary', cacheContent, _articleSummary);
        window._articleSummary = _articleSummary;
        return _articleSummary;
    }

function getActiveTranslationRoot() {
    if (_homeState.view === 'list') {
        alert('请先从首页推荐列表中选择一条内容，再开启翻译。');
        document.body.classList.remove('zh-show-tr');
        window._trVisible = false;
        const translateBtn = document.getElementById('zh-translate-btn');
        if (translateBtn) translateBtn.classList.remove('zh-btn-active');
        return null;
    }

    if (_homeState.view === 'item') {
        return document.querySelector('#immersive-wrapper .zh-home-card-view .RichText.ztext')
            || document.querySelector('#immersive-wrapper .zh-home-card-view .RichText')
            || document.querySelector('#immersive-wrapper .zh-home-card-view .RichContent-inner')
            || document.querySelector('#immersive-wrapper .zh-home-card-view');
    }

    if (_questionState.view === 'list') {
        alert('请先从回答列表中选择一个回答，再开启翻译。');
        document.body.classList.remove('zh-show-tr');
        window._trVisible = false;
        const translateBtn = document.getElementById('zh-translate-btn');
        if (translateBtn) translateBtn.classList.remove('zh-btn-active');
        return null;
    }

    if (_questionState.view === 'answer') {
        return document.querySelector('#immersive-wrapper');
    }

    return document.querySelector('#immersive-wrapper') || document.querySelector('.RichText') || _articleNode;
}

function isTranslatableBlock(node) {
    if (!(node instanceof Element)) return false;
    if (node.closest('.zh-tr-card, .zh-question-toolbar, .zh-home-toolbar, .ContentItem-actions, .Reward, .AuthorInfo, .Popover, button, .zh-collect-status, #zh-tools-panel, #immersive-exit-btn')) return false;
    if (node.querySelector(':scope > .zh-tr-card')) return false;
    const tag = node.tagName;
    if (!/^(H1|H2|H3|H4|P|TABLE|UL|OL|BLOCKQUOTE)$/.test(tag)) return false;
    const text = (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim();
    const minLen = /^H[1-4]$/.test(tag) ? 2 : 5;
    if (text.length < minLen) return false;
    if (/^(上一篇|下一篇|返回|当前第|查看全部回答|再加载)/.test(text)) return false;
    return true;
}

function collectTranslationNodes(root) {
    if (!root) return [];
    const nodes = [];
    if (isTranslatableBlock(root)) nodes.push(root);
    root.querySelectorAll('h1, h2, h3, h4, p, table, ul, ol, blockquote').forEach(node => {
        if (!isTranslatableBlock(node)) return;
        if (nodes.some(parent => parent !== node && parent.contains(node))) return;
        nodes.push(node);
    });
    return nodes;
}

function getNodeCacheContent(node) {
    const tag = node?.tagName || 'NODE';
    const text = normalizeTranslationCacheText(node?.innerText || node?.textContent || '');
    return `${location.hostname}${location.pathname.replace(/\/$/, '')}\n${tag}\n${text}`;
}

function buildTranslationPrompt(node) {
    return `CONTENT_TO_TRANSLATE_ONLY_BEGIN\n${node.outerHTML}\nCONTENT_TO_TRANSLATE_ONLY_END`;
}

function buildTranslationMessages(systemPrompt, node) {
    const messages = [
        { role: 'system', content: systemPrompt }
    ];

    if (_articleSummary) {
        messages.push({
            role: 'user',
            content: `CONTEXT_SUMMARY_FOR_REFERENCE_ONLY_DO_NOT_TRANSLATE:\n${_articleSummary}\nEND_CONTEXT_SUMMARY`
        });
    }

    messages.push({
        role: 'user',
        content: buildTranslationPrompt(node)
    });

    return messages;
}

function cleanTranslationOutput(content) {
    let text = String(content || '').trim();
    text = text
        .replace(/^\s*(【?Previous Summary】?|Previous Summary|CONTEXT_SUMMARY_FOR_REFERENCE_ONLY_DO_NOT_TRANSLATE)\s*[:：]?[\s\S]*?(【?Content to Translate】?|Content to Translate|CONTENT_TO_TRANSLATE_ONLY_BEGIN)\s*[:：]?/i, '')
        .replace(/^\s*(【?待翻译内容】?|待翻译内容|CONTENT_TO_TRANSLATE_ONLY_BEGIN)\s*[:：]?/i, '')
        .replace(/\s*(CONTENT_TO_TRANSLATE_ONLY_END|END_CONTEXT_SUMMARY)\s*$/i, '')
        .trim();
    return text || content;
}

function renderParagraphTranslationCard(card, translation, regenerateHandler) {
    card.innerHTML = sanitizeLLMHTML(translation);
    triggerMathJaxTypeset(card);
    const actions = document.createElement('div');
    actions.className = 'zh-tr-actions';

    const speakBtn = document.createElement('button');
    speakBtn.type = 'button';
    speakBtn.className = 'zh-tr-regen-btn zh-tr-speak-btn';
    speakBtn.title = '朗读翻译内容';
    speakBtn.setAttribute('aria-label', '朗读翻译');
    speakBtn.innerHTML = ICONS.speak;
    speakBtn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        toggleSpeakTranslation(card, speakBtn);
    });
    actions.appendChild(speakBtn);

    const regenBtn = document.createElement('button');
    regenBtn.type = 'button';
    regenBtn.className = 'zh-tr-regen-btn';
    regenBtn.title = '重新请求 AI 翻译，并覆盖本地翻译缓存';
    regenBtn.setAttribute('aria-label', '重新生成翻译');
    regenBtn.innerHTML = ICONS.regenerate;
    regenBtn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        regenerateHandler?.();
    });
    actions.appendChild(regenBtn);
    card.appendChild(actions);
}

function toggleSpeakTranslation(card, btn) {
    const synth = window.speechSynthesis;
    if (!synth) { alert('当前浏览器不支持语音合成 API'); return; }

    if (synth.speaking) {
        synth.cancel();
        btn.innerHTML = ICONS.speak;
        btn.title = '朗读翻译内容';
        return;
    }

    const text = (card.innerText || card.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = config.targetLang?.includes('英') || config.targetLang?.toLowerCase().includes('en') ? 'en-US' : 'zh-CN';
    utterance.rate = 1;

    btn.innerHTML = ICONS.speakStop;
    btn.title = '停止朗读';

    utterance.onend = () => { btn.innerHTML = ICONS.speak; btn.title = '朗读翻译内容'; };
    utterance.onerror = () => { btn.innerHTML = ICONS.speak; btn.title = '朗读翻译内容'; };

    synth.speak(utterance);
}

async function processTranslation() {
    // 防止重复生成
    if (document.getElementById('zh-tr-summary-card')) return;

    // 摘取全文内容
    const richTextContainer = getActiveTranslationRoot();
    if (!richTextContainer) return;
    const initialNodes = collectTranslationNodes(richTextContainer);
    const fullText = normalizeTranslationCacheText(initialNodes.map(node => node.innerText || node.textContent || '').join('\n\n') || richTextContainer.innerText || '');

    // 1. 优先注入摘要卡片 DOM
    const summaryCard = document.createElement('div');
    summaryCard.id = 'zh-tr-summary-card';
    summaryCard.className = 'zh-tr-card zh-summary-card';
    summaryCard.innerHTML = `<strong>【AI 全文摘要】</strong><br><span id="zh-sum-text"><span class="zh-spinner"></span>正在高强度研读全文并提取摘要...</span>`;
    
    // 兼容性挂载，确保能找到容器
    if (richTextContainer) richTextContainer.prepend(summaryCard);

    // 防御：确保翻译卡片可见（知乎 React 可能在初始渲染时覆盖 body class）
    if (window._trVisible && !document.body.classList.contains('zh-show-tr')) {
        document.body.classList.add('zh-show-tr');
    }

    const timeoutPromise = (promise, ms, errMessage) => {
        let timeoutId;
        const delay = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(errMessage)), ms);
        });
        return Promise.race([
            promise.then(val => { clearTimeout(timeoutId); return val; }),
            delay
        ]);
    };

    try {
        // 2. 【修改】改为阻塞模式，等待摘要生成完成，并加上 15 秒超时守护
        const sumText = await timeoutPromise(generateSummary(fullText), 15000, "AI 摘要生成超时，已自动跳过背景提取以保障流畅度");
        document.getElementById('zh-sum-text').innerText = sumText;
    } catch (e) {
        document.getElementById('zh-sum-text').innerHTML = `<span style="color:var(--zh-accent); font-weight:bold;">${escapeHTML(e.message)}</span>`;
        _articleSummary = '';
        window._articleSummary = '';
    }

    // 3. 【注意】以下代码在摘要生成完成后才执行
    // 再次确保翻译卡片可见（摘要生成期间 body class 可能被外部脚本覆盖）
    if (window._trVisible && !document.body.classList.contains('zh-show-tr')) {
        document.body.classList.add('zh-show-tr');
    }
    const nodes = initialNodes.length ? initialNodes : collectTranslationNodes(richTextContainer);
    const sysTr = `你是一个翻译专家。请翻译到目标语言：【${config.targetLang}】。
只翻译 CONTENT_TO_TRANSLATE_ONLY_BEGIN 和 CONTENT_TO_TRANSLATE_ONLY_END 之间的内容。
CONTEXT_SUMMARY_FOR_REFERENCE_ONLY_DO_NOT_TRANSLATE 只用于理解上下文，绝对不能翻译、复述、输出或改写。
输出中不得出现 Previous Summary、Content to Translate、CONTEXT_SUMMARY、CONTENT_TO_TRANSLATE 等边界标题。
如果是表格则输出完整HTML表格结构；遇到公式块、代码块请原文保留，不可随意篡改。输出纯内容，不要markdown格式的标记。`;

    // 4. 并发处理所有节点（保持全并发，不加await）
    Array.from(nodes).forEach((node, i) => {
        const cacheContent = getNodeCacheContent(node);
        const cachedTranslation = getTranslationCache('block', cacheContent);
        let currentTranslation = cachedTranslation || '';

        const trCard = document.createElement('div');
        trCard.className = 'zh-tr-card zh-para-tr';
        trCard.dataset.zhTrFor = stableHash(cacheContent);
        node.after(trCard);

        const requestAndRender = (isRegenerate = false) => {
            trCard.innerHTML = `<span class="zh-spinner"></span><span style="opacity:0.8;">${isRegenerate ? '正在重新生成翻译...' : '正在请求 AI 接口研读...'}</span>`;
            callLLMMessagesWithRetry(buildTranslationMessages(sysTr, node), { retries: 2 })
                .then(content => {
                    const cleaned = cleanTranslationOutput(content);
                    currentTranslation = cleaned;
                    setTranslationCache('block', cacheContent, cleaned);
                    renderParagraphTranslationCard(trCard, cleaned, () => requestAndRender(true));
                })
                .catch(err => {
                    if (currentTranslation) {
                        renderParagraphTranslationCard(trCard, currentTranslation, () => requestAndRender(true));
                        const errLine = document.createElement('div');
                        errLine.style.cssText = 'margin-top:8px; color:#b33; font-size:13px;';
                        errLine.textContent = `重新生成失败：${err.message}`;
                        trCard.appendChild(errLine);
                    } else {
                        trCard.innerHTML = `<span style="color:red">请求失败: ${err.message}</span><div style="margin-top:8px;"><button class="zh-tr-retry-btn" style="cursor:pointer; border:1px solid var(--zh-border); border-radius:4px; padding:4px 10px; background:transparent; color:var(--zh-accent);">重试</button></div>`;
                        trCard.querySelector('.zh-tr-retry-btn')?.addEventListener('click', () => requestAndRender(false));
                    }
                });
        };

        if (cachedTranslation) {
            renderParagraphTranslationCard(trCard, cachedTranslation, () => requestAndRender(true));
            return;
        }

        if (config.autoTr) {
            // 【全并发核心】直接发起 messages harness，不用 await！
            trCard.innerHTML = `<span class="zh-spinner"></span><span style="opacity:0.6;">解析队列中...</span>`;
            requestAndRender(false);

        } else {
            // 手动点击模式
            const btnId = 'zh-tr-btn-' + i;
            trCard.innerHTML = `<span id="${btnId}" style="opacity:0.8; cursor:pointer; color: var(--zh-accent); display:flex; align-items:center;">▶ 点击请求 AI 翻译此段</span>`;

            setTimeout(() => {
                const triggerBtn = document.getElementById(btnId);
                if(triggerBtn) {
                    triggerBtn.addEventListener('click', () => {
                        requestAndRender(false);
                    });
                }
            }, 0);
        }
    });
}

// ═══════════════════════════════════════════════════════════
// 模块: expression.js
// ═══════════════════════════════════════════════════════════
    function removeSelectionContextMenu() {
        const menu = document.getElementById('zh-selection-context-menu');
        if (menu) menu.remove();
    }

    function getSelectionAnchorElement() {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return null;
        const node = selection.anchorNode || selection.getRangeAt(0).commonAncestorContainer;
        return node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement || null;
    }

    function findPrevElementSibling(el) {
        let current = el?.previousSibling || null;
        while (current) {
            if (current.nodeType === Node.ELEMENT_NODE) return current;
            current = current.previousSibling;
        }
        return null;
    }

    function findNextElementSibling(el) {
        let current = el?.nextSibling || null;
        while (current) {
            if (current.nodeType === Node.ELEMENT_NODE) return current;
            current = current.nextSibling;
        }
        return null;
    }

    function getExpressionContextFromSelection(selectedText, fallbackContextText = '') {
        const anchorEl = getSelectionAnchorElement();
        const translationCard = anchorEl?.closest?.('.zh-tr-card');
        let sourceNode = null;
        let translatedNode = null;

        if (translationCard) {
            translatedNode = translationCard;
            const prev = findPrevElementSibling(translationCard);
            sourceNode = prev && isTranslatableBlock(prev) ? prev : null;
        } else {
            sourceNode = anchorEl?.closest?.('h1, h2, h3, h4, p, table, ul, ol, blockquote') || null;
            let next = sourceNode ? findNextElementSibling(sourceNode) : null;
            if (next?.classList?.contains('zh-tr-card')) translatedNode = next;
        }

        const sourceText = normalizeTranslationCacheText(sourceNode?.innerText || sourceNode?.textContent || fallbackContextText || '');
        const translatedText = normalizeTranslationCacheText(translatedNode?.innerText || translatedNode?.textContent || '');
        return {
            selectedText: normalizeTranslationCacheText(selectedText),
            sourceText,
            translatedText,
            selectedInTranslation: !!translationCard
        };
    }

    function loadExpressionBook() {
        try {
            const raw = crossOriginGet(EXPRESSION_BOOK_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            console.warn('知乎沉浸式阅读：表达本读取失败', err);
            return [];
        }
    }

    function saveExpressionBook(items) {
        const safeItems = (Array.isArray(items) ? items : []).slice(0, EXPRESSION_BOOK_MAX);
        try {
            crossOriginSet(EXPRESSION_BOOK_KEY, JSON.stringify(safeItems));
            return true;
        } catch (err) {
            try {
                crossOriginSet(EXPRESSION_BOOK_KEY, JSON.stringify(safeItems.slice(0, Math.floor(EXPRESSION_BOOK_MAX / 2))));
                return true;
            } catch (innerErr) {
                console.warn('知乎沉浸式阅读：表达本写入失败', innerErr);
                return false;
            }
        }
    }

    function getCurrentPageTitleForExpression() {
        return (_questionState.questionTitle || document.querySelector('#immersive-wrapper h1, h1')?.innerText || document.title || '知乎内容').replace(/\s+/g, ' ').trim();
    }

    function openSaveExpressionModal(selectedText, contextText) {
        const context = getExpressionContextFromSelection(selectedText, contextText);
        if (!context.selectedText) {
            alert('没有可收藏的划词内容。');
            return;
        }

        const modalId = 'zh-save-expr-modal-' + Date.now();
        const modalHTML = `
            <div style="margin-bottom: 12px; font-size: 13px; opacity: 0.8; max-height: 100px; overflow: auto; background: var(--zh-quote); padding: 8px; border-radius: 4px;">
                <strong>【选中词句】</strong>：${escapeHTML(context.selectedText)}
            </div>
            <div style="margin-bottom: 8px;"><strong>批注/释义（可选）：</strong></div>
            <textarea id="zh-expr-annotation-input" style="width:100%; height:80px; margin-bottom:12px; padding:8px; box-sizing:border-box; background:var(--zh-code); border:1px solid var(--zh-border); border-radius:4px; color:var(--zh-text); outline:none; resize:vertical; font-family:inherit;"></textarea>
            
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <button id="zh-expr-ai-btn" class="zh-test-btn" style="width:auto; margin:0; padding:6px 12px; font-size:13px;">✨ AI 自动生成批注</button>
                <div style="display:flex; gap:8px;">
                    <button id="zh-expr-cancel-btn" class="zh-inline-btn" style="background:transparent; border-color:var(--zh-border); color:var(--zh-text);">取消</button>
                    <button id="zh-expr-save-btn" class="zh-modal-btn" style="width:auto; padding:6px 16px;">确认保存</button>
                </div>
            </div>
        `;

        const modal = createModal(modalId, '📝 收藏至表达本', modalHTML);

        const aiBtn = document.getElementById('zh-expr-ai-btn');
        const saveBtn = document.getElementById('zh-expr-save-btn');
        const cancelBtn = document.getElementById('zh-expr-cancel-btn');
        const annotationInput = document.getElementById('zh-expr-annotation-input');

        aiBtn.addEventListener('click', async () => {
            aiBtn.disabled = true;
            aiBtn.innerText = '正在生成...';
            aiBtn.style.opacity = '0.7';
            try {
                const draft = annotationInput.value.trim();
                const sys = "你是一个语言学习/阅读助手。请对用户提取的词句进行简明批注，包含：1. 释义与语境分析 2. 其他常见用法/搭配（如果有）。如果用户提供了草稿批注/方向，请优先沿着草稿的理解方向润色、补全和压缩，不要无视草稿另起炉灶。请保持精简，总计不超过150字。输出纯文本。";
                const usr = `【原文段落】：\n${context.sourceText}\n\n【选中词句】：\n${context.selectedText}${draft ? `\n\n【用户草稿批注/方向】：\n${draft}` : ''}`;
                const res = await callLLM(sys, usr);
                annotationInput.value = res;
            } catch (err) {
                alert('AI 批注生成失败：' + err.message);
            } finally {
                aiBtn.disabled = false;
                aiBtn.innerText = '✨ 重新生成批注';
                aiBtn.style.opacity = '1';
            }
        });

        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });

        saveBtn.addEventListener('click', () => {
            const items = loadExpressionBook();
            const entry = {
                id: `expr-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
                savedAt: new Date().toISOString(),
                selectedText: context.selectedText,
                sourceText: context.sourceText,
                translatedText: context.translatedText,
                selectedInTranslation: context.selectedInTranslation,
                url: location.href,
                title: getCurrentPageTitleForExpression(),
                annotation: annotationInput.value.trim()
            };
            const dupKey = `${stableHash(entry.url)}::${stableHash(entry.selectedText)}::${stableHash(entry.sourceText)}::${stableHash(entry.translatedText)}`;
            const filtered = items.filter(item => `${stableHash(item.url)}::${stableHash(item.selectedText)}::${stableHash(item.sourceText)}::${stableHash(item.translatedText)}` !== dupKey);
            filtered.unshift(entry);
            
            if (saveExpressionBook(filtered)) {
                showCollectOverlay(`已加入表达本：${entry.selectedText.slice(0, 24)}`);
                setTimeout(removeCollectOverlay, 1500);
                if (document.getElementById('zh-expression-book-modal')) {
                    const exprModal = document.getElementById('zh-expression-book-modal');
                    exprModal.remove();
                    showExpressionBookModal();
                }
            } else {
                alert('表达本保存失败，可能是 localStorage 空间不足。');
            }
            modal.remove();
        });
    }

    function formatExpressionBookMarkdown(items = loadExpressionBook()) {
        const lines = ['# 知乎表达收藏本', '', `导出时间：${new Date().toLocaleString()}`, `条目数量：${items.length}`, ''];
        items.forEach((item, index) => {
            lines.push(`## ${index + 1}. ${item.selectedText || '未命名表达'}`);
            lines.push(`- 来源：${item.title || '知乎内容'}`);
            lines.push(`- 链接：${item.url || ''}`);
            lines.push(`- 收藏时间：${item.savedAt ? new Date(item.savedAt).toLocaleString() : ''}`);
            lines.push(`- 划词位置：${item.selectedInTranslation ? '译文' : '原文'}`);
            lines.push('');
            if (item.annotation) {
                lines.push('**AI 批注**');
                lines.push('');
                lines.push(`> ${String(item.annotation).replace(/\n/g, '\n> ')}`);
                lines.push('');
            }
            lines.push('**原段落**');
            lines.push('');
            lines.push(`> ${String(item.sourceText || '').replace(/\n/g, '\n> ') || '未捕获'}`);
            lines.push('');
            lines.push('**译文段落**');
            lines.push('');
            lines.push(`> ${String(item.translatedText || '').replace(/\n/g, '\n> ') || '暂无译文'}`);
            lines.push('');
        });
        return lines.join('\n');
    }

    function showExpressionBookModal() {
        if (document.getElementById('zh-expression-book-modal')) return;
        const items = loadExpressionBook();
        const rows = items.slice(0, 80).map((item, index) => `
            <div style="border:1px solid var(--zh-border);background:var(--zh-quote);border-radius:4px;padding:10px;margin-bottom:10px;">
                <div style="font-weight:bold;color:var(--zh-accent);">${index + 1}. ${escapeHTML(item.selectedText || '')}</div>
                <div style="font-size:13px;opacity:.75;">${escapeHTML(item.title || '')} · ${item.savedAt ? escapeHTML(new Date(item.savedAt).toLocaleString()) : ''}</div>
                <div style="margin-top:8px;"><strong>原文：</strong>${escapeHTML((item.sourceText || '').slice(0, 220))}</div>
                <div style="margin-top:6px;"><strong>译文：</strong>${escapeHTML((item.translatedText || '暂无译文').slice(0, 220))}</div>
                ${item.annotation ? `<div style="margin-top:6px;color:var(--zh-accent);"><strong>AI批注：</strong>${escapeHTML(item.annotation)}</div>` : ''}
            </div>
        `).join('');
        const modal = createModal('zh-expression-book-modal', '表达收藏本', `
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
                <button id="zh-expr-copy-md" class="zh-inline-btn">复制 Markdown</button>
                <button id="zh-expr-download-md" class="zh-inline-btn">下载 Markdown</button>
                <button id="zh-expr-download-json" class="zh-inline-btn">下载 JSON</button>
                <button id="zh-expr-clear" class="zh-inline-btn">清空</button>
            </div>
            <div style="font-size:13px;opacity:.75;margin-bottom:12px;">共 ${items.length} 条。列表只预览前 80 条，导出包含全部。</div>
            <div>${rows || '<div style="opacity:.7;">表达本还是空的。划词右键可以加入。</div>'}</div>
        `);
        document.getElementById('zh-expr-copy-md')?.addEventListener('click', async () => {
            await navigator.clipboard.writeText(formatExpressionBookMarkdown(loadExpressionBook()));
            alert('Markdown 已复制。');
        });
        document.getElementById('zh-expr-download-md')?.addEventListener('click', () => {
            downloadTextFile(`zhihu-expression-book-${new Date().toISOString().slice(0, 10)}.md`, formatExpressionBookMarkdown(loadExpressionBook()), 'text/markdown;charset=utf-8');
        });
        document.getElementById('zh-expr-download-json')?.addEventListener('click', () => {
            downloadTextFile(`zhihu-expression-book-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(loadExpressionBook(), null, 2), 'application/json;charset=utf-8');
        });
        document.getElementById('zh-expr-clear')?.addEventListener('click', () => {
            if (!confirm('确认清空表达本？')) return;
            saveExpressionBook([]);
            modal.remove();
            showExpressionBookModal();
        });
    }

// ═══════════════════════════════════════════════════════════
// 模块: radar.js
// ═══════════════════════════════════════════════════════════
    function loadRadarReportBook() {
        try {
            const raw = crossOriginGet(RADAR_REPORT_BOOK_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            console.warn('知乎沉浸式阅读：阅读笔记本读取失败', err);
            return [];
        }
    }

    function saveRadarReportBook(items) {
        const safeItems = (Array.isArray(items) ? items : []).slice(0, RADAR_REPORT_BOOK_MAX);
        try {
            crossOriginSet(RADAR_REPORT_BOOK_KEY, JSON.stringify(safeItems));
            return true;
        } catch (err) {
            try {
                crossOriginSet(RADAR_REPORT_BOOK_KEY, JSON.stringify(safeItems.slice(0, Math.floor(RADAR_REPORT_BOOK_MAX / 2))));
                return true;
            } catch (innerErr) {
                console.warn('知乎沉浸式阅读：阅读笔记本写入失败', innerErr);
                return false;
            }
        }
    }

    function getRadarReportSystemPrompt() {
        return `你是一个阅读笔记助手。帮用户为当前文章写一份简洁的阅读笔记。

输出要求：
- oneliner：一句话概括这篇内容的核心观点或价值
- impression：读完最值得记住的感受或启发（2-3句）
- tags：3-4个关键词标签

archetype 只能选：trick / tutorial / analysis / opinion / trend / noise。
depth：只能选 skim / read / study / skip。
relevance：0-100（对用户的相关度）。

请输出严格 JSON，不要 Markdown，不要代码块。字段：
archetype, oneliner, impression, depth, relevance, tags。`;
    }

    function getRadarReportWithDraftSystemPrompt() {
        return `你是一个阅读笔记助手。用户已经写了一些笔记草稿，请基于用户的草稿方向进行润色、补充和扩展。

规则：
1. 优先沿着用户草稿的思路和方向写，不要无视草稿另起炉灶
2. 润色用户已有的表达，使其更精炼
3. 在用户草稿基础上补充用户可能遗漏的要点
4. 保持用户的语气和视角

输出要求：
- oneliner：一句话概括（可基于用户草稿润色）
- impression：读后感/笔记正文（基于用户草稿扩展，3-5句）
- tags：3-4个关键词标签

archetype 只能选：trick / tutorial / analysis / opinion / trend / noise。
depth：只能选 skim / read / study / skip。
relevance：0-100。

请输出严格 JSON，不要 Markdown，不要代码块。字段：
archetype, oneliner, impression, depth, relevance, tags。`;
    }

    function normalizeRadarTags(value) {
        return normalizeWikiTags(value).slice(0, 4);
    }

    function normalizeRadarDepth(value) {
        const depth = String(value || '').trim();
        return ['skim', 'read', 'study', 'skip'].includes(depth) ? depth : 'skim';
    }

    function normalizeRadarArchetype(value) {
        const archetype = String(value || '').trim();
        return ['trick', 'tutorial', 'analysis', 'opinion', 'trend', 'noise'].includes(archetype) ? archetype : 'opinion';
    }

    function getCurrentRadarSource() {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) throw new Error('请先进入沉浸模式。');

        // 只在能定位到具体文章/回答/动态 URL 的正文视图下允许生成笔记，
        // 个人空间、Wiki、未进入正文的推荐流/关注流列表等都禁止（否则会把页面 URL 错记为笔记来源）。
        const inHomeItem = _homeState.view === 'item';
        const inFollowItem = _followState.view === 'item';
        const inAnswer = _questionState.view === 'answer' || isAnswerUrl();
        const inPost = isPostPage() && _homeState.view !== 'item' && _followState.view === '' && _questionState.view !== 'answer';
        if (!inHomeItem && !inFollowItem && !inAnswer && !inPost) {
            throw new Error('请先打开一篇文章 / 回答 / 关注动态的正文，再生成阅读笔记。');
        }

        // 首页推荐流正文视图
        if (inHomeItem) {
            const homeItem = _homeState.items[_homeState.currentIndex];
            const root = document.querySelector('#immersive-wrapper .zh-home-card-view') || wrapper;
            const sourceText = normalizeText(root?.innerText || root?.textContent || '');
            if (!sourceText || sourceText.length < 20) throw new Error('当前内容太短，无法生成阅读笔记。');
            const url = homeItem?.url || homeItem?.key || location.href;
            const title = (homeItem?.title || document.querySelector('#immersive-wrapper h1, h2')?.innerText || '知乎内容').replace(/\s+/g, ' ').trim();
            return {
                sourceType: homeItem?.type || 'article',
                title,
                url,
                sourceText,
                sourceKey: `home::${stableHash(url)}::${stableHash(sourceText)}`
            };
        }

        // 关注动态正文视图
        if (inFollowItem) {
            const followItem = _followState.items[_followState.currentIndex];
            const root = document.querySelector('#immersive-wrapper .zh-home-card-view, #immersive-wrapper .zh-follow-card-view') || wrapper;
            const sourceText = normalizeText(followItem?.text || root?.innerText || root?.textContent || '');
            if (!sourceText || sourceText.length < 20) throw new Error('当前内容太短，无法生成阅读笔记。');
            const url = followItem?.url || followItem?.key;
            if (!url) throw new Error('无法定位当前动态的链接，暂不能生成阅读笔记。');
            const title = (followItem?.title || document.querySelector('#immersive-wrapper h1, h2')?.innerText || '知乎动态').replace(/\s+/g, ' ').trim();
            return {
                sourceType: followItem?.type || 'article',
                title,
                url,
                sourceText,
                sourceKey: `follow::${stableHash(url)}::${stableHash(sourceText)}`
            };
        }

        const isAnswer = inAnswer;
        const sourceType = isAnswer ? 'answer' : 'article';
        const answer = isAnswer ? _questionState.answers[_questionState.currentIndex] : null;
        const title = (isAnswer
            ? (_questionState.questionTitle || document.querySelector('#immersive-wrapper h1, h1')?.innerText)
            : (document.querySelector('#immersive-wrapper h1, h1')?.innerText || document.title || '知乎文章')
        || '知乎内容').replace(/\s+/g, ' ').trim();

        const articleRoot = wrapper.querySelector('.Post-RichTextContainer .RichText, .Post-RichTextContainer, .Post-RichText, .RichText.ztext, .RichText') || wrapper;
        const root = isAnswer
            ? (document.querySelector('#immersive-wrapper .zh-question-answer-view') || wrapper)
            : articleRoot;
        const sourceText = normalizeText(answer?.text || root?.innerText || root?.textContent || '');
        if (!sourceText || sourceText.length < 20) throw new Error('当前内容太短，无法生成阅读笔记。');

        const url = (answer?.key && /^https?:\/\//.test(answer.key)) ? answer.key : location.href;
        return {
            sourceType,
            title,
            url,
            sourceText,
            sourceKey: `${sourceType}::${stableHash(url)}::${stableHash(sourceText)}`
        };
    }

    function findRadarReportForSource(source) {
        const items = loadRadarReportBook();
        return items.find(item => item.sourceKey === source.sourceKey)
            || items.find(item => item.url === source.url && item.sourceType === source.sourceType);
    }

    function buildRadarReportUserPrompt(source, userDraft = '') {
        const tags = String(config.radarInterestTags || '').trim();
        const parts = [
            `页面类型：${source.sourceType}`,
            `标题：${source.title}`,
            `来源 URL：${source.url}`,
            tags ? `用户兴趣标签：${tags}` : '',
            `正文前 6000 字：\n${source.sourceText.slice(0, 6000)}`
        ];
        if (userDraft.trim()) {
            parts.push(`\n【用户笔记草稿】：\n${userDraft.trim()}`);
        }
        return parts.filter(Boolean).join('\n\n');
    }

    function fallbackRadarReport(raw, source) {
        const text = String(raw || '').replace(/\s+/g, ' ').trim();
        return {
            archetype: 'opinion',
            oneliner: text.slice(0, 120) || source.sourceText.slice(0, 120) || '这条内容需要人工判断。',
            impression: '这条内容需要人工判断是否值得保留。',
            depth: 'skim',
            relevance: 50,
            offTagHighlight: false,
            highlightReason: '',
            tags: [],
            rawJson: raw || ''
        };
    }

    function normalizeRadarReport(data, source, raw = '') {
        const parsed = data && typeof data === 'object' ? data : fallbackRadarReport(raw, source);
        const relevance = Number(parsed.relevance);
        return {
            id: `radar-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            savedAt: new Date().toISOString(),
            url: source.url,
            title: source.title,
            sourceType: source.sourceType,
            sourceText: source.sourceText,
            sourceKey: source.sourceKey,
            archetype: normalizeRadarArchetype(parsed.archetype),
            oneliner: String(parsed.oneliner || fallbackRadarReport(raw, source).oneliner).replace(/\s+/g, ' ').trim(),
            impression: String(parsed.impression || '这条内容需要人工判断是否值得保留。').replace(/\s+/g, ' ').trim(),
            depth: normalizeRadarDepth(parsed.depth),
            relevance: Number.isFinite(relevance) ? Math.max(0, Math.min(100, Math.round(relevance))) : 50,
            offTagHighlight: !!parsed.offTagHighlight,
            highlightReason: String(parsed.highlightReason || '').replace(/\s+/g, ' ').trim(),
            tags: normalizeRadarTags(parsed.tags),
            rawJson: raw || JSON.stringify(parsed)
        };
    }

    async function generateRadarReport(source, onProgress = null, userDraft = '') {
        if (!config.apiKey) throw new Error('请先在设置里配置 API Key。');
        const hasDraft = !!userDraft.trim();
        onProgress?.({ phase: 'prepare', message: hasDraft ? '基于你的笔记草稿润色生成...' : '准备生成阅读笔记...' });
        const sysPrompt = hasDraft ? getRadarReportWithDraftSystemPrompt() : getRadarReportSystemPrompt();
        const messages = [
            { role: 'system', content: sysPrompt },
            { role: 'user', content: buildRadarReportUserPrompt(source, userDraft) }
        ];
        onProgress?.({ phase: 'request', message: '正在发送 API 请求...' });
        const raw = await callLLMMessages(messages);
        onProgress?.({ phase: 'response', message: '已收到 API 响应，正在解析...' });
        const parsed = parseJSONFromText(raw);
        const report = normalizeRadarReport(parsed, source, raw);
        if (hasDraft) report.userDraft = userDraft.trim();
        onProgress?.({ phase: 'done', message: '阅读笔记已生成。' });
        return report;
    }

    function getRadarJob(source) {
        return radarJobState.get(source.sourceKey) || null;
    }

    function setRadarJob(source, patch) {
        const prev = getRadarJob(source) || {
            sourceKey: source.sourceKey,
            status: 'idle',
            phase: '',
            message: '',
            startedAt: '',
            finishedAt: '',
            report: null,
            error: '',
            promise: null
        };
        const next = { ...prev, ...patch };
        radarJobState.set(source.sourceKey, next);
        return next;
    }

    function startRadarReportJob(source, userDraft = '') {
        const existing = getRadarJob(source);
        if (existing?.status === 'running' && existing.promise) return existing;
        const startedAt = new Date().toISOString();
        const hasDraft = !!userDraft.trim();
        const job = setRadarJob(source, {
            status: 'running',
            phase: 'prepare',
            message: hasDraft ? '基于草稿生成笔记...' : '准备生成阅读笔记...',
            startedAt,
            finishedAt: '',
            report: existing?.report || findRadarReportForSource(source) || null,
            error: ''
        });
        job.promise = generateRadarReport(source, patch => setRadarJob(source, patch), userDraft)
            .then(report => {
                setRadarJob(source, {
                    status: 'done',
                    phase: 'done',
                    message: '报告已生成，确认后可保存。',
                    finishedAt: new Date().toISOString(),
                    report,
                    error: ''
                });
                return report;
            })
            .catch(err => {
                setRadarJob(source, {
                    status: 'error',
                    phase: 'error',
                    message: `生成失败：${err.message}`,
                    finishedAt: new Date().toISOString(),
                    error: err.message
                });
                throw err;
            });
        radarJobState.set(source.sourceKey, job);
        return job;
    }

    function formatRadarReportMarkdown(report) {
        if (!report) return '';
        const tags = (report.tags || []).map(tag => `#${String(tag).replace(/^#/, '').replace(/\s+/g, '_')}`).join(' ');
        const depthLabel = { skim: '略读', read: '细读', study: '精读', skip: '跳过' }[report.depth] || report.depth || '略读';
        const lines = [
            `### [${report.archetype || 'opinion'}] ${report.title || '知乎内容'}`,
            `> ${report.impression || report.oneliner || ''}`,
            '',
            `📖 ${depthLabel} · 🏷 ${tags || '无'} · 🔗 ${report.url || ''}`
        ];
        if (report.userDraft) {
            lines.push('', `**我的笔记：** ${report.userDraft}`);
        }
        return lines.join('\n');
    }

    function formatRadarReportBookMarkdown(items = loadRadarReportBook()) {
        const lines = ['# 知乎阅读笔记本', '', `导出时间：${new Date().toLocaleString()}`, `条目数量：${items.length}`, ''];
        items.forEach(item => {
            lines.push(formatRadarReportMarkdown(item), '');
        });
        return lines.join('\n');
    }

    function saveRadarReport(report) {
        if (!report) return false;
        const items = loadRadarReportBook();
        const filtered = items.filter(item => item.sourceKey !== report.sourceKey);
        filtered.unshift({ ...report, savedAt: new Date().toISOString() });
        return saveRadarReportBook(filtered);
    }

    function renderRadarReportHTML(report) {
        if (!report) return '<div style="opacity:.75;">当前内容还没有生成阅读笔记。</div>';
        const tags = (report.tags || []).map(tag => `<span style="display:inline-block;margin:2px 4px 2px 0;padding:1px 6px;border-radius:3px;background:var(--zh-code);color:var(--zh-accent);font-size:12px;">#${escapeHTML(tag)}</span>`).join('');
        const depthLabel = { skim: '略读', read: '细读', study: '精读', skip: '跳过' }[report.depth] || report.depth || '略读';
        return `
            <div style="border:1px solid var(--zh-border);background:var(--zh-quote);border-radius:6px;padding:14px 16px;margin-bottom:12px;">
                <div style="font-weight:bold;color:var(--zh-title);margin-bottom:8px;font-size:15px;">${escapeHTML(report.oneliner || report.title)}</div>
                <div style="margin:8px 0;padding-left:12px;border-left:3px solid var(--zh-accent);color:var(--zh-text);line-height:1.7;">${escapeHTML(report.impression || '')}</div>
                <div style="margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span style="font-size:12px;padding:2px 8px;border-radius:3px;background:var(--zh-accent);color:var(--zh-paper);">${escapeHTML(report.archetype || 'opinion')}</span>
                    <span style="font-size:12px;opacity:.75;">📖 ${escapeHTML(depthLabel)}</span>
                    ${tags}
                </div>
                <div style="margin-top:8px;font-size:12px;opacity:.6;word-break:break-all;">${escapeHTML(report.url || '')}</div>
            </div>
        `;
    }

    function showRadarReportBookModal() {
        if (document.getElementById('zh-radar-book-modal')) return;
        const items = loadRadarReportBook();
        const rows = items.slice(0, 80).map((item, index) => `
            <div style="border:1px solid var(--zh-border);background:var(--zh-quote);border-radius:4px;padding:10px;margin-bottom:10px;">
                <div style="font-weight:bold;color:var(--zh-accent);">${index + 1}. [${escapeHTML(item.archetype || '')}] ${escapeHTML(item.oneliner || item.title || '')}</div>
                <div style="margin-top:6px;">${escapeHTML(item.impression || '')}</div>
                <div style="font-size:13px;opacity:.75;margin-top:6px;">${escapeHTML(item.depth || 'skim')} · ⭐ ${escapeHTML(item.relevance ?? 50)} · ${escapeHTML(item.savedAt ? new Date(item.savedAt).toLocaleString() : '')}</div>
            </div>
        `).join('');
        const modal = createModal('zh-radar-book-modal', '阅读笔记本', `
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
                <button id="zh-radar-copy-md" class="zh-inline-btn">复制 Markdown</button>
                <button id="zh-radar-download-md" class="zh-inline-btn">下载 Markdown</button>
                <button id="zh-radar-download-json" class="zh-inline-btn">下载 JSON</button>
                <button id="zh-radar-clear" class="zh-inline-btn">清空</button>
            </div>
            <div style="font-size:13px;opacity:.75;margin-bottom:12px;">共 ${items.length} 条。列表只预览前 80 条，导出包含全部。</div>
            <div>${rows || '<div style="opacity:.7;">阅读笔记本还是空的。点击 R 可以生成当前文章/回答报告。</div>'}</div>
        `);
        document.getElementById('zh-radar-copy-md')?.addEventListener('click', async () => {
            await navigator.clipboard.writeText(formatRadarReportBookMarkdown(loadRadarReportBook()));
            alert('Markdown 已复制。');
        });
        document.getElementById('zh-radar-download-md')?.addEventListener('click', () => {
            downloadTextFile(`zhihu-radar-report-book-${new Date().toISOString().slice(0, 10)}.md`, formatRadarReportBookMarkdown(loadRadarReportBook()), 'text/markdown;charset=utf-8');
        });
        document.getElementById('zh-radar-download-json')?.addEventListener('click', () => {
            downloadTextFile(`zhihu-radar-report-book-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(loadRadarReportBook(), null, 2), 'application/json;charset=utf-8');
        });
        document.getElementById('zh-radar-clear')?.addEventListener('click', () => {
            if (!confirm('确认清空阅读笔记本？')) return;
            saveRadarReportBook([]);
            modal.remove();
            showRadarReportBookModal();
        });
    }

    function showRadarReportModal() {
        if (document.getElementById('zh-radar-report-modal')) return;
        let source;
        try {
            source = getCurrentRadarSource();
        } catch (err) {
            alert(err.message);
            return;
        }
        const savedReport = findRadarReportForSource(source) || null;
        const existingJob = getRadarJob(source);
        let currentReport = existingJob?.report || savedReport || null;
        const modal = createModal('zh-radar-report-modal', '阅读笔记', `
            <div style="margin-bottom:12px;">
                <label style="display:block;margin-bottom:5px;font-weight:bold;color:var(--zh-accent);">我的笔记 / 想法：</label>
                <textarea id="zh-radar-user-draft" style="width:100%;height:80px;padding:8px;box-sizing:border-box;background:var(--zh-code);border:1px solid var(--zh-border);border-radius:4px;color:var(--zh-text);outline:none;resize:vertical;font-family:inherit;font-size:14px;line-height:1.6;" placeholder="写下你的想法、关键词或笔记方向，AI 会基于此润色补充...">${escapeHTML(currentReport?.userDraft || '')}</textarea>
                <div style="font-size:12px;opacity:.6;margin-top:4px;">留空则 AI 自动生成；写了内容则 AI 会沿着你的方向润色扩展。</div>
            </div>
            <div id="zh-radar-report-content">${renderRadarReportHTML(currentReport)}</div>
            <div id="zh-radar-report-status" style="font-size:13px;opacity:.75;margin:8px 0 12px;">${existingJob?.message || (currentReport ? '已读取本地笔记。' : '')}</div>
            <div class="zh-radar-actions" style="display:flex;gap:8px;flex-wrap:wrap;">
                <button id="zh-radar-generate" class="zh-inline-btn zh-radar-generate-btn zh-export-hidden">${currentReport ? 'AI 重新生成' : 'AI 生成笔记'}</button>
                <button id="zh-radar-save" class="zh-inline-btn">保存</button>
                <button id="zh-radar-copy-current" class="zh-inline-btn">复制 Markdown</button>
                <button id="zh-radar-open-book" class="zh-inline-btn">笔记本</button>
            </div>
        `);
        const contentEl = document.getElementById('zh-radar-report-content');
        const statusEl = document.getElementById('zh-radar-report-status');
        const generateBtn = document.getElementById('zh-radar-generate');
        const draftInput = document.getElementById('zh-radar-user-draft');
        const render = (message = '') => {
            if (contentEl) contentEl.innerHTML = renderRadarReportHTML(currentReport);
            if (statusEl && message) statusEl.textContent = message;
        };
        const syncFromJob = () => {
            const job = getRadarJob(source);
            if (!job) return;
            currentReport = job.report || currentReport;
            if (contentEl) contentEl.innerHTML = renderRadarReportHTML(currentReport);
            if (statusEl) {
                statusEl.textContent = job.message || (job.status === 'running' ? '正在生成...' : '');
                if (job.status === 'error') statusEl.innerHTML = `<span style="color:red">${escapeHTML(job.message || job.error || '生成失败')}</span>`;
            }
            if (generateBtn) {
                generateBtn.disabled = job.status === 'running';
                generateBtn.textContent = job.status === 'running' ? '生成中...' : (currentReport ? 'AI 重新生成' : 'AI 生成笔记');
            }
        };
        syncFromJob();
        const radarSyncTimer = setInterval(() => {
            if (!document.getElementById('zh-radar-report-modal')) {
                clearInterval(radarSyncTimer);
                return;
            }
            syncFromJob();
        }, 500);

        generateBtn?.addEventListener('click', async () => {
            const draft = draftInput?.value || '';
            const job = startRadarReportJob(source, draft);
            syncFromJob();
            try {
                currentReport = await job.promise;
                render('笔记已生成。');
            } catch (err) {
                if (statusEl) statusEl.innerHTML = `<span style="color:red">生成失败：${escapeHTML(err.message)}</span>`;
            } finally {
                syncFromJob();
            }
        });

        document.getElementById('zh-radar-save')?.addEventListener('click', () => {
            if (!currentReport) return alert('请先生成笔记。');
            currentReport.userDraft = (draftInput?.value || '').trim();
            if (saveRadarReport(currentReport)) {
                showCollectOverlay('阅读笔记已保存。');
                setTimeout(removeCollectOverlay, 1400);
                render('已保存。');
            } else {
                alert('保存失败，可能是 localStorage 空间不足。');
            }
        });
        document.getElementById('zh-radar-copy-current')?.addEventListener('click', async () => {
            if (!currentReport) return alert('请先生成笔记。');
            await navigator.clipboard.writeText(formatRadarReportMarkdown(currentReport));
            showCollectOverlay('Markdown 已复制');
            setTimeout(removeCollectOverlay, 1200);
        });
        document.getElementById('zh-radar-open-book')?.addEventListener('click', () => {
            modal.remove();
            showRadarReportBookModal();
        });
    }

    function showSelectionContextMenu(event, selectedText, contextText) {
        removeSelectionContextMenu();

        const menu = document.createElement('div');
        menu.id = 'zh-selection-context-menu';
        menu.className = 'zh-context-menu';
        menu.innerHTML = `
            <div class="zh-context-menu-item" id="zh-context-analyze">🔎 AI 划词解析</div>
            <div class="zh-context-menu-item" id="zh-context-save-expression">★ 加入表达本</div>
        `;
        document.body.appendChild(menu);

        const maxLeft = window.innerWidth - menu.offsetWidth - 8;
        const maxTop = window.innerHeight - menu.offsetHeight - 8;
        menu.style.left = `${Math.max(8, Math.min(event.clientX, maxLeft))}px`;
        menu.style.top = `${Math.max(8, Math.min(event.clientY, maxTop))}px`;

        document.getElementById('zh-context-analyze').addEventListener('click', () => {
            removeSelectionContextMenu();
            runSelectionAnalysis(selectedText, contextText);
        });

        document.getElementById('zh-context-save-expression').addEventListener('click', () => {
            openSaveExpressionModal(selectedText, contextText);
            removeSelectionContextMenu();
        });

        setTimeout(() => {
            document.addEventListener('click', removeSelectionContextMenu, { once: true });
        }, 0);
    }

    async function runSelectionAnalysis(selectedText, contextText) {
        const modalId = 'zh-selection-modal-' + Date.now();
        S2translate(modalId, '🔎 划词解析', `<div id="${modalId}-content"><span class="zh-spinner"></span>正在研读并解析，请稍候...</div>`);

        try {
            const sys = "你是一个专业阅读助手。请针对用户划词部分进行针对性的解释，不超过100字。输出纯文本，不要Markdown语法，尽量精简易懂。回答语言：中文";
            const usr = `【所在段落上下文】：\n${contextText}\n\n【用户划词需要解析的部分】：\n${selectedText}`;
            const res = await callLLM(sys, usr);
            const contentEl = document.getElementById(`${modalId}-content`);
            if (contentEl) contentEl.innerText = res;
        } catch (err) {
            const contentEl = document.getElementById(`${modalId}-content`);
            if (contentEl) contentEl.innerHTML = `<span style="color:red">解析失败：${err.message}</span>`;
        }
    }

// ═══════════════════════════════════════════════════════════
// 模块: share.js
// ═══════════════════════════════════════════════════════════

    function getCurrentThemeVarsText() {
        const vars = THEMES[currentThemeIndex]?.vars || THEMES[0].vars;
        return Object.entries(vars).map(([key, value]) => `${key}: ${value};`).join('\n');
    }

    function getZeroLossShareCSS() {
        return `
            :root { ${getCurrentThemeVarsText()} }
            :root { --zh-meta: #736b58; --zh-link: #a13d3d; }
            * { box-sizing: border-box; }
            body, .zh-share-svg-root { margin: 0; background: var(--zh-bg); color: var(--zh-text); font-family: 'Times New Roman', 'STKaiti', 'KaiTi', '楷体', serif; padding: 40px 20px; }
            .zh-share-page { width: 860px; margin: 0 auto; padding: 60px 80px; background: var(--zh-paper); border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,.08); border-left: 4px solid var(--zh-accent); color: var(--zh-text); }
            .zh-share-question-title { font-size: 32px; font-weight: bold; color: var(--zh-title); margin: 0 0 30px; padding-bottom: 20px; border-bottom: 2px solid var(--zh-accent); line-height: 1.5; letter-spacing: 0; }
            .ContentItem-meta { background: var(--zh-quote); padding: 20px 25px; border-radius: 8px; margin-bottom: 40px; border: 1px solid var(--zh-border); }
            .AuthorInfo { display: flex; align-items: center; gap: 15px; }
            .AuthorInfo-avatar { width: 50px; height: 50px; object-fit: cover; border-radius: 5px; border: 2px solid var(--zh-paper); box-shadow: 0 2px 5px rgba(0,0,0,.1); }
            .AuthorInfo-content { flex: 1; min-width: 0; }
            .AuthorInfo-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
            .AuthorInfo-name a, .AuthorInfo-name { font-size: 18px; font-weight: bold; color: var(--zh-title); text-decoration: none; border: 0; }
            .AuthorInfo-badgeText { font-size: 14px; color: var(--zh-meta); line-height: 1.45; }
            .zh-share-meta-lines { margin-top: 12px; display: grid; gap: 6px; font-family: sans-serif; font-size: 13px; color: var(--zh-accent); }
            .zh-share-meta-line { display: flex; align-items: center; gap: 6px; }
            .zh-share-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; padding-top: 18px; border-top: 1px dashed var(--zh-border); font-family: sans-serif; }
            .zh-share-action-chip { border: 1px solid var(--zh-border); color: var(--zh-accent); background: var(--zh-quote); border-radius: 999px; padding: 4px 10px; font-size: 13px; line-height: 1.4; }
            .RichContent-inner, .Post-RichTextContainer, .RichText { font-size: 18px; line-height: 2; color: var(--zh-text); text-align: justify; }
            .RichContent-inner p, .Post-RichTextContainer p, .RichText p { margin: 1.4em 0; }
            .RichContent-inner a, .Post-RichTextContainer a, .RichText a { color: var(--zh-link); text-decoration: none; border-bottom: 1px dashed var(--zh-link); }
            .RichContent-inner blockquote, .Post-RichTextContainer blockquote, .RichText blockquote { border-left: 4px solid var(--zh-accent); background: var(--zh-quote); padding: 15px 20px; margin: 25px 0; font-style: italic; color: #4a4539; }
            .zh-share-page pre, .zh-share-page code { background: var(--zh-code); font-family: Consolas, monospace; }
            .zh-share-page pre { padding: 1em 1.2em; border-radius: 6px; overflow-x: auto; line-height: 1.5; }
            .zh-share-page img { max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,.1); }
            .zh-share-page img.Avatar, .zh-share-page .Avatar img, .zh-share-page .AuthorInfo-avatarWrapper img { width: 50px; height: 50px; min-width: 50px; object-fit: cover; border-radius: 5px; box-shadow: none; }
            .zh-share-page .css-4gq0sj, .zh-share-page .css-2dtzk2, .zh-share-page .ZDI--FourPointedStar16, .zh-share-page .Button, .zh-share-page .Popover, .zh-share-page .ModalLoading-content, .zh-share-page .css-8atqhb, .zh-share-page .ContentItem-actions { display: none !important; }
            .ContentItem-time { margin-top: 40px; font-size: 14px; color: var(--zh-meta); font-family: sans-serif; }
            .ContentItem-time a { color: inherit; text-decoration: none; border: 0; }
            .zh-share-warning { margin-top: 24px; padding: 10px 14px; border: 1px dashed var(--zh-border); border-radius: 6px; background: var(--zh-quote); color: var(--zh-meta); font-size: 13px; line-height: 1.6; font-family: sans-serif; }
            .zh-share-source { margin-top: 30px; padding-top: 20px; border-top: 1px dashed var(--zh-border); color: var(--zh-meta); font-size: 13px; word-break: break-all; font-family: Consolas, monospace; }
            .zh-share-page table { width: 100%; border-collapse: collapse; }
            .zh-share-page th, .zh-share-page td { border: 1px solid var(--zh-border); padding: 6px 8px; }
            @media (max-width: 768px) { body { padding: 0; } .zh-share-page { width: 100%; padding: 30px 20px; border-left: none; border-top: 4px solid var(--zh-accent); border-radius: 0; } }
        `;
    }

    function cleanupZeroLossShareClone(root) {
        const removeSelectors = [
            'script',
            'style',
            'noscript',
            'iframe',
            'video',
            'audio',
            'canvas',
            'object',
            'embed',
            '.zh-tr-card',
            '.zh-img-placeholder',
            '.zh-question-toolbar',
            '.zh-home-toolbar',
            '.zh-reader-top-nav',
            '#zh-article-placeholder',
            '#zh-action-placeholder',
            '#zh-comments-placeholder',
            '#zh-comment-input-placeholder',
            '[id^="zh-live-node-placeholder"]',
            '.zh-question-detail',
            '.Comments-container',
            '.CommentEditor',
            '.RichText-MCNLinkCardContainer',
            '.pc-article-answer-card',
            '.pc-article-answer-text-chain',
            '.pc-article-answer-big-img',
            '.ecommerce-ad-box',
            '.MCNLinkCard',
            '.Button',
            '.Popover',
            '.FollowButton',
            '.OptionsButton',
            '.ModalLoading-content',
            '.ContentItem-actions',
            '.RichContent-collapsedText',
            '.css-4gq0sj',
            '.css-2dtzk2',
            '.css-8atqhb',
            '.ZDI--FourPointedStar16',
            'meta',
            '.zh-hidden-by-immersive-inner',
            ...EXPORT_HIDDEN_SELECTORS
        ];
        removeSelectors.forEach(selector => {
            try {
                root.querySelectorAll(selector).forEach(el => el.remove());
            } catch (err) {
                console.warn('知乎零损分享：跳过不兼容的导出隐藏选择器', selector, err);
            }
        });

        root.querySelectorAll('img').forEach(img => {
            const realSrc = img.getAttribute('data-original') || img.getAttribute('data-actualsrc') || img.getAttribute('data-src') || img.getAttribute('src');
            if (realSrc) img.setAttribute('src', realSrc);
        });

        root.querySelectorAll('*').forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                const name = attr.name.toLowerCase();
                const value = attr.value || '';
                if (
                    name.startsWith('on')
                    || name === 'contenteditable'
                    || name === 'tabindex'
                    || name === 'style'
                    || name.startsWith('data-')
                    || name.startsWith('aria-')
                    || name === 'role'
                    || name === 'itemprop'
                    || name === 'itemscope'
                    || name === 'itemtype'
                ) {
                    el.removeAttribute(attr.name);
                    return;
                }
                if ((name === 'href' || name === 'src') && value && !/^(data:|blob:|#|mailto:|javascript:)/i.test(value)) {
                    try { el.setAttribute(attr.name, new URL(value, location.href).href); } catch (err) {}
                }
            });
        });

        root.querySelectorAll('img').forEach(img => {
            img.classList.remove('zh-img-hidden');
            img.removeAttribute('data-zh-img-hidden');
        });

        return root;
    }

    function normalizeShareText(text) {
        return String(text || '').replace(/\u200b/g, '').replace(/\s+/g, ' ').trim();
    }

    function getShareImageSrc(img) {
        if (!img) return '';
        return img.getAttribute('src') || img.getAttribute('data-original') || img.getAttribute('data-actualsrc') || img.getAttribute('data-src') || '';
    }

    function findShareAuthorRoot(root) {
        return root?.querySelector?.('.ContentItem-meta .AuthorInfo[itemtype*="Person"], .AnswerItem-authorInfo .AuthorInfo, .Post-Header .AuthorInfo, .AuthorInfo[itemtype*="Person"], .AuthorInfo') || null;
    }

    function extractShareAuthor(root) {
        const authorRoot = findShareAuthorRoot(root);
        if (!authorRoot) return null;
        const avatar = authorRoot.querySelector('img.Avatar, .AuthorInfo-avatarWrapper img, img');
        const name = authorRoot.querySelector('meta[itemprop="name"]')?.content
            || authorRoot.querySelector('.AuthorInfo-name, .UserLink.AuthorInfo-name, .UserLink-link')?.innerText
            || '';
        const headline = authorRoot.querySelector('.AuthorInfo-badgeText, .AuthorInfo-detail, .AuthorInfo-badge')?.innerText || '';
        const url = authorRoot.querySelector('meta[itemprop="url"]')?.content
            || authorRoot.querySelector('a[href*="/people/"], .UserLink-link[href]')?.href
            || '';
        const avatarSrc = getShareImageSrc(avatar);
        if (!name && !avatarSrc && !headline) return null;
        return {
            name: normalizeShareText(name) || '知乎作者',
            headline: normalizeShareText(headline),
            url,
            avatarSrc,
            avatarAlt: avatar?.alt || normalizeShareText(name)
        };
    }

    function getShareMetaLines(root) {
        const lines = [];
        const voteLine = normalizeShareText(root?.querySelector?.('.ContentItem-meta .css-dvccr2, .ContentItem-meta .css-1lr85n')?.innerText);
        const columnLine = normalizeShareText(root?.querySelector?.('.ContentItem-meta .css-140fcia, .css-3ibr72 .css-1b0xgmx')?.innerText);
        const upvote = root?.querySelector?.('meta[itemprop="upvoteCount"]')?.content;
        const comment = root?.querySelector?.('meta[itemprop="commentCount"]')?.content;
        if (voteLine) lines.push(voteLine);
        else if (upvote) lines.push(`${upvote} 人赞同`);
        if (columnLine) lines.push(columnLine);
        if (comment) lines.push(`${comment} 条评论`);
        return Array.from(new Set(lines.filter(Boolean))).slice(0, 4);
    }

    function buildShareAuthorCard(root) {
        const author = extractShareAuthor(root);
        const lines = getShareMetaLines(root);
        if (!author && !lines.length) return null;

        const card = document.createElement('div');
        card.className = 'ContentItem-meta';
        if (author) {
            const info = document.createElement('div');
            info.className = 'AuthorInfo';
            const avatarWrap = document.createElement(author.url ? 'a' : 'span');
            avatarWrap.className = 'AuthorInfo-avatarWrapper';
            if (author.url) {
                avatarWrap.href = author.url;
                avatarWrap.target = '_blank';
                avatarWrap.rel = 'noopener noreferrer';
            }
            if (author.avatarSrc) {
                const img = document.createElement('img');
                img.className = 'Avatar AuthorInfo-avatar';
                img.src = author.avatarSrc;
                img.alt = author.avatarAlt || author.name;
                avatarWrap.appendChild(img);
            }
            const content = document.createElement('div');
            content.className = 'AuthorInfo-content';
            const head = document.createElement('div');
            head.className = 'AuthorInfo-head';
            const name = document.createElement(author.url ? 'a' : 'span');
            name.className = 'AuthorInfo-name';
            if (author.url) {
                name.href = author.url;
                name.target = '_blank';
                name.rel = 'noopener noreferrer';
            }
            name.textContent = author.name;
            head.appendChild(name);
            content.appendChild(head);
            if (author.headline) {
                const detail = document.createElement('div');
                detail.className = 'AuthorInfo-badgeText';
                detail.textContent = author.headline;
                content.appendChild(detail);
            }
            info.appendChild(avatarWrap);
            info.appendChild(content);
            card.appendChild(info);
        }

        if (lines.length) {
            const meta = document.createElement('div');
            meta.className = 'zh-share-meta-lines';
            lines.forEach(line => {
                const item = document.createElement('div');
                item.className = 'zh-share-meta-line';
                item.textContent = line;
                meta.appendChild(item);
            });
            card.appendChild(meta);
        }
        return card;
    }

    function getShareRichSource(root) {
        return root?.querySelector?.('.RichContent-inner, .Post-RichTextContainer .RichText, .Post-RichTextContainer, .RichText.ztext, .RichText, [itemprop="text"]') || null;
    }

    function buildShareBody(root) {
        const source = getShareRichSource(root);
        if (!source) return null;
        const rich = document.createElement('div');
        rich.className = 'RichContent';
        const inner = document.createElement('div');
        inner.className = 'RichContent-inner';
        const clone = cleanupZeroLossShareClone(source.cloneNode(true));
        if (clone.classList.contains('RichContent-inner')) {
            Array.from(clone.childNodes).forEach(node => inner.appendChild(node));
        } else {
            inner.appendChild(clone);
        }
        rich.appendChild(inner);
        cleanupZeroLossShareClone(rich);
        return rich;
    }

    function getShareActionLabels(root) {
        const action = root?.matches?.('.ContentItem-actions, .RichContent-actions')
            ? root
            : root?.querySelector?.('.ContentItem-actions, .RichContent-actions');
        if (!action) return [];
        const blocked = /^(反对|更多|分享|收起|展开|举报|添加评论|写评论)$/;
        const labels = Array.from(action.querySelectorAll('button, a, [aria-label]'))
            .map(el => normalizeShareText(el.innerText || el.getAttribute('aria-label') || el.textContent))
            .filter(text => text && !blocked.test(text) && text.length <= 24);
        return Array.from(new Set(labels)).slice(0, 6);
    }

    function buildShareActions(root) {
        const labels = getShareActionLabels(root);
        if (!labels.length) return null;
        const box = document.createElement('div');
        box.className = 'zh-share-actions';
        labels.forEach(label => {
            const chip = document.createElement('span');
            chip.className = 'zh-share-action-chip';
            chip.textContent = label;
            box.appendChild(chip);
        });
        return box;
    }

    function buildShareTime(root) {
        const time = root?.querySelector?.('.ContentItem-time, .Post-Sub, time');
        if (!time) return null;
        const clone = cleanupZeroLossShareClone(time.cloneNode(true));
        clone.classList.add('ContentItem-time');
        return clone;
    }

    function appendShareTitle(container, text) {
        const title = document.createElement('h1');
        title.className = 'zh-share-question-title';
        title.textContent = normalizeShareText(text) || '知乎内容';
        container.appendChild(title);
        return title.textContent;
    }

    function getZeroLossShareContent() {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) throw new Error('请先进入沉浸模式。');

        const container = document.createElement('div');
        container.className = 'zh-share-content';
        let title = document.title || '知乎分享';
        let sourceType = '';
        let contentRoot = null;
        let actionRoot = null;

        if (isPostPage()) {
            const article = (_articleNode && _articleNode.closest('#immersive-wrapper'))
                ? _articleNode
                : wrapper.querySelector('.Post-Main.Post-NormalMain, .Post-Main, .Post-RichTextContainer');
            if (!article) throw new Error('未找到可分享的文章正文。');
            contentRoot = article;
            actionRoot = (_actionBarNode && _actionBarNode.closest('#immersive-wrapper'))
                ? _actionBarNode
                : wrapper.querySelector('.ContentItem-actions, .RichContent-actions');
            title = appendShareTitle(container, article.querySelector('h1, .Post-Title')?.innerText || document.title || '知乎文章');
            sourceType = 'article';
        } else if (isQuestionPage()) {
            if (_questionState.view !== 'answer') throw new Error('请先打开某个回答正文，再使用零损分享。');
            const answerView = wrapper.querySelector('.zh-question-answer-view');
            if (!answerView) throw new Error('未找到可分享的回答正文。');
            contentRoot = answerView;
            actionRoot = answerView;
            title = appendShareTitle(container, wrapper.querySelector('.zh-question-title, h1')?.innerText || document.title || '知乎回答');
            sourceType = 'answer';
        } else {
            throw new Error('零损分享目前只支持 /p 文章页和回答正文页。');
        }

        const authorCard = buildShareAuthorCard(contentRoot);
        if (authorCard) container.appendChild(authorCard);
        const body = buildShareBody(contentRoot);
        if (!body) throw new Error('未找到可分享的正文。');
        container.appendChild(body);
        const time = buildShareTime(contentRoot);
        if (time) container.appendChild(time);
        const actions = buildShareActions(actionRoot || contentRoot);
        if (actions) container.appendChild(actions);

        const source = document.createElement('div');
        source.className = 'zh-share-source';
        source.textContent = `来源：${location.href}`;
        container.appendChild(source);
        return { title, sourceType, node: container };
    }

    function blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('图片转 dataURL 失败'));
            reader.readAsDataURL(blob);
        });
    }

    function gmFetchBlob(url) {
        return new Promise((resolve, reject) => {
            const xhr = getUserscriptXHR();
            if (!xhr) {
                fetch(url, { credentials: 'include', cache: 'force-cache' })
                    .then(res => res.ok ? res.blob() : Promise.reject(new Error(`HTTP ${res.status}`)))
                    .then(resolve)
                    .catch(reject);
                return;
            }

            xhr({
                method: 'GET',
                url,
                timeout: 30000,
                anonymous: false,
                responseType: 'blob',
                headers: { 'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' },
                onload: res => {
                    if (res.status < 200 || res.status >= 300) {
                        reject(new Error(`HTTP ${res.status}`));
                        return;
                    }
                    if (res.response instanceof Blob) {
                        resolve(res.response);
                        return;
                    }
                    reject(new Error('图片响应不是 Blob'));
                },
                onerror: err => reject(new Error(`图片抓取失败：${err?.error || err?.message || '未知错误'}`)),
                ontimeout: () => reject(new Error('图片抓取超时'))
            });
        });
    }

    async function fetchShareImageDataURL(src) {
        if (!src || /^(data:|blob:)/i.test(src)) return src;
        const absolute = new URL(src, location.href).href;
        if (_shareImageDataUrlCache.has(absolute)) return _shareImageDataUrlCache.get(absolute);
        const promise = gmFetchBlob(absolute).then(blobToDataURL);
        _shareImageDataUrlCache.set(absolute, promise);
        return promise;
    }

    function getShareSrcsetFirstUrl(srcset) {
        return String(srcset || '').split(',')[0]?.trim().split(/\s+/)[0] || '';
    }

    function buildShareImagePlaceholderDataURL(width = 640, height = 360) {
        const rawW = Number.parseFloat(width);
        const rawH = Number.parseFloat(height);
        const w = Math.max(80, Math.round(Number.isFinite(rawW) ? rawW : 640));
        const h = Math.max(50, Math.round(Number.isFinite(rawH) ? rawH : Math.min(w * 0.56, 360)));
        const label = w < 140 || h < 80 ? '图' : '图片未能内嵌';
        const fontSize = w < 140 || h < 80 ? 13 : 15;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" rx="8" fill="#f0ebe1"/><rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="8" fill="none" stroke="#d4cbb8" stroke-dasharray="8 8"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="${fontSize}" fill="#736b58">${label}</text></svg>`;
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    function getImageFallbackSize(img) {
        const rect = img.getBoundingClientRect?.();
        return {
            width: Number(img.getAttribute('width')) || Math.round(rect?.width || 0) || (img.classList?.contains('Avatar') ? 50 : 640),
            height: Number(img.getAttribute('height')) || Math.round(rect?.height || 0) || (img.classList?.contains('Avatar') ? 50 : 360)
        };
    }

    async function inlineShareImages(root, options = {}) {
        const stats = { replaced: 0 };
        const replaceImgWithPlaceholder = img => {
            const size = getImageFallbackSize(img);
            img.setAttribute('src', buildShareImagePlaceholderDataURL(size.width, size.height));
            img.setAttribute('alt', `${img.getAttribute('alt') || '图片'}（PNG 导出时未能内嵌，已用占位图替换）`);
            stats.replaced++;
        };

        root.querySelectorAll('source').forEach(el => el.remove());
        const imgs = Array.from(root.querySelectorAll('img'));
        const tasks = imgs.map(img => async () => {
            const src = img.getAttribute('src') || getShareSrcsetFirstUrl(img.getAttribute('srcset')) || img.src;
            img.removeAttribute('srcset');
            img.removeAttribute('loading');
            img.removeAttribute('decoding');
            img.removeAttribute('crossorigin');
            if (!src) {
                if (options.strict) replaceImgWithPlaceholder(img);
                return;
            }
            try {
                const dataUrl = await fetchShareImageDataURL(src);
                if (dataUrl) img.setAttribute('src', dataUrl);
            } catch (err) {
                console.warn('知乎零损分享：图片内嵌失败', src, err);
                if (options.strict) {
                    replaceImgWithPlaceholder(img);
                } else {
                    img.setAttribute('src', src);
                }
            }
        });

        for (let i = 0; i < tasks.length; i += 4) {
            await Promise.all(tasks.slice(i, i + 4).map(task => task()));
        }

        const svgImages = Array.from(root.querySelectorAll('image'));
        await Promise.all(svgImages.map(async image => {
            const href = image.getAttribute('href') || image.getAttribute('xlink:href') || image.getAttributeNS?.('http://www.w3.org/1999/xlink', 'href');
            if (!href || /^(data:|blob:|#)/i.test(href)) return;
            try {
                const dataUrl = await fetchShareImageDataURL(href);
                image.setAttribute('href', dataUrl);
                image.setAttributeNS?.('http://www.w3.org/1999/xlink', 'href', dataUrl);
            } catch (err) {
                console.warn('知乎零损分享：SVG 图片内嵌失败', href, err);
                if (options.strict) {
                    const dataUrl = buildShareImagePlaceholderDataURL(image.getAttribute('width'), image.getAttribute('height'));
                    image.setAttribute('href', dataUrl);
                    image.setAttributeNS?.('http://www.w3.org/1999/xlink', 'href', dataUrl);
                    stats.replaced++;
                }
            }
        }));

        if (options.strict) {
            root.querySelectorAll('a[href]').forEach(a => a.removeAttribute('href'));
            root.querySelectorAll('img').forEach(img => {
                const src = img.getAttribute('src') || '';
                if (src && !/^data:/i.test(src)) replaceImgWithPlaceholder(img);
            });
            root.querySelectorAll('image').forEach(image => {
                const href = image.getAttribute('href') || image.getAttribute('xlink:href') || '';
                if (href && !/^data:/i.test(href)) {
                    const dataUrl = buildShareImagePlaceholderDataURL(image.getAttribute('width'), image.getAttribute('height'));
                    image.setAttribute('href', dataUrl);
                    image.setAttributeNS?.('http://www.w3.org/1999/xlink', 'href', dataUrl);
                    stats.replaced++;
                }
            });
        }
        return stats;
    }

    function stripShareImagesForPng(root) {
        let removed = 0;
        root.querySelectorAll('a[href]').forEach(a => a.removeAttribute('href'));
        root.querySelectorAll('picture, source, link').forEach(el => el.remove());
        root.querySelectorAll('img, image, svg use, svg').forEach(el => {
            if (el.tagName.toLowerCase() === 'use') { el.remove(); return; }
            if (el.tagName.toLowerCase() === 'svg') {
                const hasExtRef = el.querySelector('use[href], use[xlink\\:href], image[href], image[xlink\\:href]');
                if (hasExtRef) { el.remove(); removed++; return; }
                return;
            }
            removed++;
            el.remove();
        });
        root.querySelectorAll('*').forEach(el => {
            ['src', 'href', 'xlink:href', 'poster', 'background'].forEach(attr => {
                const val = el.getAttribute(attr);
                if (val && !/^(data:|blob:|#|$)/i.test(val.trim())) {
                    el.removeAttribute(attr);
                }
            });
        });
        root.querySelectorAll('figure').forEach(figure => {
            if (!normalizeShareText(figure.innerText || figure.textContent)) figure.remove();
        });
        root.querySelectorAll('a, span').forEach(el => {
            if (!el.children.length && !normalizeShareText(el.textContent)) el.remove();
        });
        root.querySelectorAll('p, div').forEach(el => {
            if (el.classList?.contains('zh-share-content') || el.classList?.contains('zh-share-page')) return;
            if (!el.children.length && !normalizeShareText(el.textContent)) el.remove();
        });
        return { removed };
    }

    async function renderZeroLossSharePage(contentNode, options = {}) {
        const frame = document.createElement('div');
        frame.style.cssText = 'position:absolute;left:-12000px;top:0;width:900px;visibility:hidden;pointer-events:none;';
        const style = document.createElement('style');
        style.textContent = getZeroLossShareCSS();
        const root = document.createElement('div');
        root.className = 'zh-share-svg-root';
        const page = document.createElement('div');
        page.className = 'zh-share-page';
        page.appendChild(contentNode);
        frame.appendChild(style);
        root.appendChild(page);
        frame.appendChild(root);
        document.body.appendChild(frame);
        let imageFallbackCount = 0;
        let imageRemovedCount = 0;
        if (options.stripImages) {
            const stripStats = stripShareImagesForPng(page);
            imageRemovedCount = stripStats.removed || 0;
            if (imageRemovedCount > 0) {
                const note = document.createElement('div');
                note.className = 'zh-share-warning';
                note.textContent = `PNG 长图说明：为保证浏览器稳定导出，已忽略 ${imageRemovedCount} 张图片；HTML/SVG 导出通常可保留原图链接。`;
                const source = page.querySelector('.zh-share-source');
                if (source?.parentNode) source.parentNode.insertBefore(note, source);
                else page.appendChild(note);
            }
        } else if (options.inlineImages) {
            const imageStats = await inlineShareImages(page, { strict: false });
            imageFallbackCount = imageStats?.replaced || 0;
        }
        const width = 900;
        const height = Math.max(640, Math.ceil(root.scrollHeight + 2));
        const html = page.outerHTML;
        const xhtml = serializeZeroLossShareXHTML(page);
        frame.remove();
        return { width, height, html, xhtml, imageFallbackCount, imageRemovedCount };
    }

    function serializeZeroLossShareXHTML(pageNode) {
        const root = document.createElement('div');
        root.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
        root.className = 'zh-share-svg-root';
        const style = document.createElement('style');
        style.textContent = getZeroLossShareCSS();
        root.appendChild(style);
        root.appendChild(pageNode.cloneNode(true));
        return new XMLSerializer().serializeToString(root);
    }

    function buildZeroLossShareHTML(page) {
        return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>知乎零损分享 - 纯净阅读版</title>
<style>${getZeroLossShareCSS()}</style>
</head>
<body>${page.html}</body>
</html>`;
    }

    function buildZeroLossShareSVG(page) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}" height="${page.height}" viewBox="0 0 ${page.width} ${page.height}">
<foreignObject width="100%" height="100%">
${page.xhtml}
</foreignObject>
</svg>`;
    }

    function renderSvgToPngBlob(svgText, width, height) {
        return new Promise((resolve, reject) => {
            const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => {
                try {
                    const maxSide = 30000;
                    const preferredScale = Math.min(window.devicePixelRatio || 1, 2);
                    const scale = Math.min(preferredScale, maxSide / Math.max(width, height));
                    if (!Number.isFinite(scale) || scale <= 0) throw new Error('画布尺寸异常');

                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, Math.ceil(width * scale));
                    canvas.height = Math.max(1, Math.ceil(height * scale));
                    const ctx = canvas.getContext('2d');
                    if (!ctx) throw new Error('无法创建 Canvas');
                    ctx.setTransform(scale, 0, 0, scale, 0, 0);
                    ctx.drawImage(img, 0, 0, width, height);
                    URL.revokeObjectURL(url);
                    canvas.toBlob(blob => {
                        if (blob) resolve(blob);
                        else reject(new Error('PNG Blob 生成失败'));
                    }, 'image/png');
                } catch (err) {
                    URL.revokeObjectURL(url);
                    if (err.message?.includes('Tainted') || err.name === 'SecurityError') {
                        reject(new Error('PNG 导出被浏览器安全策略阻止（Canvas 被污染）。请尝试使用 SVG 或 HTML 格式导出。'));
                    } else {
                        reject(err);
                    }
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('SVG 渲染为 PNG 失败'));
            };
            img.src = url;
        });
    }

    async function runZeroLossShare() {
        try {
            const content = getZeroLossShareContent();
            const format = ['html', 'svg', 'png'].includes(config.shareExportFormat) ? config.shareExportFormat : 'svg';
            if (format === 'png') showCollectOverlay('正在准备 PNG 长图...');
            const page = await renderZeroLossSharePage(content.node, {
                inlineImages: format === 'svg',
                stripImages: format === 'png'
            });
            const filename = `${sanitizeShareFilename(content.title || content.sourceType)}.${format}`;
            if (format === 'html') {
                downloadTextFile(filename, buildZeroLossShareHTML(page), 'text/html;charset=utf-8');
            } else if (format === 'png') {
                showCollectOverlay('正在渲染 PNG 长图...');
                const svgText = buildZeroLossShareSVG(page);
                const pngBlob = await renderSvgToPngBlob(svgText, page.width, page.height);
                downloadBlobFile(filename, pngBlob);
            } else {
                downloadTextFile(filename, buildZeroLossShareSVG(page), 'image/svg+xml;charset=utf-8');
            }
            const imageTip = page.imageRemovedCount ? `（已忽略 ${page.imageRemovedCount} 张图片）` : (page.imageFallbackCount ? `（${page.imageFallbackCount} 张图片已占位）` : '');
            showCollectOverlay(`零损分享已导出：${filename}${imageTip}`);
            setTimeout(removeCollectOverlay, 1600);
        } catch (err) {
            removeCollectOverlay();
            alert(`零损分享失败：${err.message}`);
        }
    }


// ═══════════════════════════════════════════════════════════
// 模块: page-post.js
// ═══════════════════════════════════════════════════════════
    function hideArticleAdCards(root = document) {
        const scope = root.querySelectorAll ? root : document;
        if (scope.matches && scope.matches('.pc-article-answer-card')) {
            const adCard = scope.closest('.pc-article-answer') || scope;
            adCard.dataset.origDisplay = adCard.style.display || '';
            adCard.style.display = 'none';
            adCard.classList.add('zh-hidden-by-immersive-inner');
        }
        scope.querySelectorAll('.pc-article-answer-card').forEach(card => {
            const adCard = card.closest('.pc-article-answer') || card;
            adCard.dataset.origDisplay = adCard.style.display || '';
            adCard.style.display = 'none';
            adCard.classList.add('zh-hidden-by-immersive-inner');
        });
    }

    function startArticleAdCleanup() {
        hideArticleAdCards(_articleNode || document);
        if (_adCleanupObserver || !_articleNode) return;

        _adCleanupObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) hideArticleAdCards(node);
                });
            });
        });
        _adCleanupObserver.observe(_articleNode, { childList: true, subtree: true });
    }

    function stopArticleAdCleanup() {
        if (_adCleanupObserver) {
            _adCleanupObserver.disconnect();
            _adCleanupObserver = null;
        }
    }


    function findPostCommentsNode() {
        const comments = document.querySelector('.Comments-container');
        if (!comments || comments.closest('#immersive-wrapper')) return null;
        return comments;
    }

    function findPostCommentInputNode() {
        const inputs = Array.from(document.querySelectorAll('.InputLike, [contenteditable="true"]'))
            .filter(el => !el.closest('#immersive-wrapper') && !el.closest('.Comments-container') && !el.closest('.AppHeader') && !el.closest('[role="dialog"]'));

        for (const input of inputs) {
            let node = input;
            while (node && node.parentElement && node.parentElement !== document.body) {
                const style = window.getComputedStyle(node);
                if (style.position === 'fixed') return node;
                node = node.parentElement;
            }
        }
        return null;
    }

    function enterPostImmersive() {
        try {
            _articleNode = document.querySelector('.Post-Main.Post-NormalMain') || document.querySelector('.Post-Main') || document.querySelector('.AnswerItem');
            if (!_articleNode) return alert('阁下，未寻得文章主体！');

            _actionBarNode = _articleNode.querySelector('.ContentItem-actions') || document.querySelector('.ContentItem-actions');

            const articlePlaceholder = document.createElement('span');
            articlePlaceholder.id = 'zh-article-placeholder';
            articlePlaceholder.style.display = 'none';
            if (_articleNode.parentNode) {
                _articleNode.parentNode.insertBefore(articlePlaceholder, _articleNode);
            }

            if (_actionBarNode) {
                const actionPlaceholder = document.createElement('span');
                actionPlaceholder.id = 'zh-action-placeholder';
                actionPlaceholder.style.display = 'none';
                if (_actionBarNode.parentNode) {
                    _actionBarNode.parentNode.insertBefore(actionPlaceholder, _actionBarNode);
                }

                _actionBarNode.dataset.origCssText = _actionBarNode.style.cssText;
                _actionBarNode.style.cssText = 'position: static !important; box-shadow: none !important; background: transparent !important; margin-top: 40px !important;';
            }

            const wrapper = document.createElement('div');
            wrapper.id = 'immersive-wrapper';
            wrapper.appendChild(_articleNode);
            if (_actionBarNode) wrapper.appendChild(_actionBarNode);

            _postCommentsNode = findPostCommentsNode();
            if (_postCommentsNode) {
                const commentsPlaceholder = document.createElement('span');
                commentsPlaceholder.id = 'zh-comments-placeholder';
                commentsPlaceholder.style.display = 'none';
                if (_postCommentsNode.parentNode) {
                    _postCommentsNode.parentNode.insertBefore(commentsPlaceholder, _postCommentsNode);
                }
                wrapper.appendChild(_postCommentsNode);
            }

            _postCommentInputNode = findPostCommentInputNode();
            if (_postCommentInputNode) {
                const inputPlaceholder = document.createElement('span');
                inputPlaceholder.id = 'zh-comment-input-placeholder';
                inputPlaceholder.style.display = 'none';
                if (_postCommentInputNode.parentNode) {
                    _postCommentInputNode.parentNode.insertBefore(inputPlaceholder, _postCommentInputNode);
                }
                wrapper.appendChild(_postCommentInputNode);
            }

            const reactRoot = document.getElementById('root') || document.body;
            Array.from(reactRoot.children).forEach(child => {
                if (child.id !== 'immersive-wrapper' && child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE' && child.tagName !== 'LINK') {
                    child.dataset.origDisplay = child.style.display || '';
                    child.style.display = 'none';
                    child.classList.add('zh-hidden-by-immersive');
                }
            });

            reactRoot.appendChild(wrapper);
            document.body.appendChild(createCopyMarkdownBtn());

            const postToreadBtn = createPageToReadBtn(
                location.href,
                document.querySelector('.Post-Title')?.innerText || document.title,
                document.querySelector('.AuthorInfo-name')?.innerText || '',
                '专栏文章'
            );
            postToreadBtn.style.cssText = 'position:absolute;top:18px;right:18px;z-index:3;';
            wrapper.style.position = 'relative';
            wrapper.appendChild(postToreadBtn);

            const tocNode = _articleNode.querySelector('.css-u56wtg') || document.querySelector('.CatalogBtn') || document.querySelector('[aria-label="目录"]');
            if (tocNode) {
                tocNode.classList.add('zh-toc-fixed-style');
                tocNode.addEventListener('click', (e) => {
                    if (e.target === tocNode) {
                        const inner = tocNode.querySelector('a, button');
                        if (inner) inner.click();
                    }
                });
            }

            const timeNode = _articleNode.querySelector('.ContentItem-time') || _articleNode.querySelector('.Post-Sub');
            if (timeNode) {
                let currentNode = timeNode.nextElementSibling;
                while (currentNode) {
                    if (currentNode.id !== 'zh-action-placeholder' && !currentNode.classList.contains('ContentItem-actions')) {
                        currentNode.dataset.origDisplay = currentNode.style.display || '';
                        currentNode.style.display = 'none';
                        currentNode.classList.add('zh-hidden-by-immersive-inner');
                    }
                    currentNode = currentNode.nextElementSibling;
                }
            }

            _articleNode.querySelectorAll('.FollowButton').forEach(btn => {
                btn.dataset.origDisplay = btn.style.display || '';
                btn.style.display = 'none';
                btn.classList.add('zh-hidden-by-immersive-inner');
            });

            ['.pc-article-answer-text-chain', '.pc-article-answer-big-img', '.RichText-MCNLinkCardContainer', '.ecommerce-ad-box', '.MCNLinkCard'].forEach(s => {
                _articleNode.querySelectorAll(s).forEach(ad => {
                    ad.dataset.origDisplay = ad.style.display || '';
                    ad.style.display = 'none';
                    ad.classList.add('zh-hidden-by-immersive-inner');
                });
            });
            startArticleAdCleanup();

            ensureImmersiveStyle();

            // 强制隐藏知乎顶部/底部固定互动栏及侧边栏（React 可能在脚本执行后重新渲染这些元素）
            document.querySelectorAll('.AppHeader, .ColumnPageHeader, .Post-StickyBar, .Sticky, .BottomActions, .CornerButtons, .GlobalSideBar').forEach(el => {
                el.style.display = 'none';
                el.classList.add('zh-hidden-by-immersive');
            });

            createQuestionToolsPanel();

            setupImageToggles();
            applyTheme(currentThemeIndex);
            window._isImmersive = true;

            if (config.autoSum || config.autoTr) {
                const triggerAutoTranslate = () => {
                    const translateBtn = document.getElementById('zh-translate-btn');
                    if (translateBtn) translateBtn.click();
                };
                if (document.readyState === 'complete') {
                    setTimeout(triggerAutoTranslate, 800);
                } else {
                    window.addEventListener('load', () => setTimeout(triggerAutoTranslate, 800), { once: true });
                }
            }

            logCurrentPageReadingRecord();
        } catch (e) {
            console.error('进入专栏沉浸式阅读失败:', e);
            alert('进入沉浸式阅读失败，原因为: ' + e.message);
            window._isImmersive = false;
        }
    }

// ═══════════════════════════════════════════════════════════
// 模块: page-question.js
// ═══════════════════════════════════════════════════════════
    async function expandQuestionRichText() {
        for (let i = 0; i < 3; i++) {
            const btn = document.querySelector('button.QuestionRichText-more');
            if (!btn) return;
            btn.click();
            await sleep(500);
        }
    }

    function getQuestionDetailHTML() {
        const detail = document.querySelector('.QuestionRichText.QuestionRichText--expandable') || document.querySelector('.QuestionRichText');
        if (!detail || !detail.innerText.trim()) return '';
        const clone = detail.cloneNode(true);
        clone.querySelectorAll('button.QuestionRichText-more').forEach(btn => btn.remove());
        return clone.innerHTML;
    }

    function getQuestionTitleText() {
        return (document.querySelector('h1.QuestionHeader-title')?.innerText || document.title || '知乎问题').trim();
    }

    function getAnswerKey(item, index) {
        const answerLink = item.querySelector('a[href*="/answer/"]')?.href;
        if (answerLink) return answerLink;
        const metaUrl = item.querySelector('meta[itemprop="url"]')?.content;
        if (metaUrl && /\/answer\//.test(metaUrl)) return metaUrl;
        const zop = item.getAttribute('data-zop');
        if (zop) {
            try {
                const data = JSON.parse(zop);
                if (data.itemId) return String(data.itemId);
            } catch (err) {}
        }
        return `${index}-${(item.innerText || '').slice(0, 80)}`;
    }

    function expandAnswerItem(item) {
        const controls = item.querySelectorAll('.RichContent button, .RichContent-collapsedText, button.ContentItem-more');
        controls.forEach(ctrl => {
            const text = (ctrl.innerText || ctrl.textContent || '').trim();
            if (/阅读全文|显示全部|展开阅读全文|展开/.test(text)) {
                try { ctrl.click(); } catch (err) {}
            }
        });
    }

    function getAnswerAuthor(item) {
        const metaName = item.querySelector('meta[itemprop="name"]')?.content;
        const textName = item.querySelector('.AuthorInfo-name, .UserLink.AuthorInfo-name, .UserLink-link')?.innerText;
        return (metaName || textName || '匿名用户').trim();
    }

    function getAnswerVoteText(item) {
        const count = item.querySelector('meta[itemprop="upvoteCount"]')?.content;
        if (count && count !== '0') return `${count} 人赞同`;
        const voteText = item.querySelector('.css-1lr85n')?.innerText;
        if (voteText) return voteText.trim();
        const aria = item.querySelector('button[aria-label*="赞同"]')?.getAttribute('aria-label');
        return (aria || '').replace(/\s+/g, ' ').trim();
    }

    function getAnswerText(item) {
        const richText = item.querySelector('.RichText.ztext, .RichText');
        return (richText?.innerText || item.innerText || '').replace(/\s+/g, ' ').trim();
    }

    function serializeAnswerForCache(answer) {
        return {
            key: answer.key,
            author: answer.author,
            voteText: answer.voteText,
            snippet: answer.snippet,
            preview: answer.preview,
            text: answer.text,
            sourceTop: answer.sourceTop,
            html: answer.clone?.outerHTML || ''
        };
    }

    function hydrateAnswerFromCache(answer) {
        return {
            key: answer.key,
            author: answer.author,
            voteText: answer.voteText,
            snippet: answer.snippet,
            preview: answer.preview || answer.snippet,
            text: answer.text || '',
            sourceTop: Number.isFinite(answer.sourceTop) ? answer.sourceTop : 0,
            clone: cleanupAnswerClone(cloneFromHTML(answer.html))
        };
    }

    function buildQuestionCachePayload(cacheKey) {
        return {
            cacheKey,
            savedAt: Date.now(),
            previewMode: config.answerPreviewMode || 'excerpt',
            questionTitle: _questionState.questionTitle,
            questionDetailHTML: _questionState.questionDetailHTML,
            currentIndex: _questionState.currentIndex || 0,
            exitScrollY: _questionState.exitScrollY || 0,
            exhausted: !!_questionState.exhausted,
            answers: _questionState.answers.map(serializeAnswerForCache)
        };
    }

    async function persistCurrentQuestionCache() {
        if (!isQuestionPage() || isAnswerUrl() || !_questionState.answers.length) return;
        const cacheKey = getQuestionCacheKey();
        const payload = buildQuestionCachePayload(cacheKey);
        _questionAnswerCache.set(cacheKey, {
            answers: _questionState.answers,
            questionTitle: _questionState.questionTitle,
            questionDetailHTML: _questionState.questionDetailHTML,
            currentIndex: _questionState.currentIndex || 0,
            exitScrollY: _questionState.exitScrollY || 0,
            exhausted: !!_questionState.exhausted
        });
        try {
            await putQuestionCacheRecord(payload);
        } catch (err) {
            console.warn('知乎沉浸式阅读：持久缓存写入失败', err);
        }
    }

    function navigateFromAnswerToMainQuestion() {
        const mainUrl = getMainQuestionUrl();
        const cacheKey = getQuestionMainPageCacheKey();
        _questionAnswerCache.delete(cacheKey);
        try {
            sessionStorage.setItem('zh-force-main-question-collect', mainUrl);
        } catch (err) {}
        if (window._isImmersive) exitImmersive();
        location.assign(`${mainUrl}${mainUrl.includes('?') ? '&' : '?'}zh_force_collect=${Date.now()}`);
    }

    async function loadPersistentQuestionCache(cacheKey) {
        try {
            const record = await getQuestionCacheRecord(cacheKey);
            if (!record?.answers?.length) return null;
            const hydrated = {
                answers: record.answers.map(hydrateAnswerFromCache),
                questionTitle: record.questionTitle,
                questionDetailHTML: record.questionDetailHTML,
                currentIndex: record.currentIndex || 0,
                exitScrollY: record.exitScrollY || 0,
                exhausted: record.exhausted === true
            };
            _questionAnswerCache.set(cacheKey, hydrated);
            return hydrated;
        } catch (err) {
            console.warn('知乎沉浸式阅读：持久缓存读取失败', err);
            return null;
        }
    }

    function buildAnswerRecord(item, index) {
        expandAnswerItem(item);
        const text = getAnswerText(item);
        const clone = cleanupAnswerClone(item.cloneNode(true));
        return {
            key: getAnswerKey(item, index),
            author: getAnswerAuthor(item),
            voteText: getAnswerVoteText(item),
            snippet: text.slice(0, 160),
            preview: text.slice(0, 160),
            text,
            sourceTop: getElementPageTop(item),
            liveNode: item,
            clone
        };
    }

    function attachLiveNodesToAnswers(answers) {
        const liveItems = getAnswerItems();
        answers.forEach(answer => {
            if (answer.liveNode) return;
            const match = liveItems.find((item, index) => getAnswerKey(item, index) === answer.key);
            if (match) answer.liveNode = match;
        });
    }

    async function enrichAnswersForList(answers, statusEl = null) {
        answers.forEach(answer => {
            answer.preview = answer.snippet || '该回答暂无可预览文本。';
        });

        if (config.answerPreviewMode !== 'ai' || !answers.length) return answers;

        if (!config.apiKey) {
            if (statusEl) statusEl.textContent = '未配置 API Key，已回退为摘录回答前文。';
            await sleep(600);
            return answers;
        }

        const sys = "你是一个阅读列表摘要助手。请把用户提供的知乎回答压缩成不超过60字的中文摘要。只输出摘要正文，不要编号，不要Markdown。";
        let finished = 0;
        if (statusEl) statusEl.textContent = `正在并发生成 AI 摘要 0/${answers.length}`;
        showCollectOverlay(`正在并发生成 AI 摘要 0/${answers.length}`);

        await Promise.allSettled(answers.map(async answer => {
            const source = (answer.text || '').slice(0, 2600);
            if (!source.trim()) return;

            try {
                const summary = await callLLM(sys, `【回答正文】\n${source}`);
                if (summary) answer.preview = summary.replace(/\s+/g, ' ').trim();
            } catch (err) {
                answer.preview = answer.snippet || `AI 摘要失败：${err.message}`;
            } finally {
                finished++;
                const message = `正在并发生成 AI 摘要 ${finished}/${answers.length}`;
                if (statusEl) statusEl.textContent = message;
                showCollectOverlay(message);
            }
        }));

        return answers;
    }

    function getAnswerItems() {
        return Array.from(document.querySelectorAll('.QuestionAnswers-answers .ContentItem.AnswerItem, .ContentItem.AnswerItem'))
            .filter(item => !item.closest('#immersive-wrapper'));
    }


    async function collectQuestionAnswers(statusEl = null, targetCount = HOME_BATCH_SIZE, options = {}) {
        const records = new Map();
        const existingKeys = new Set(options.existingKeys || []);
        const label = options.label || '快速采集问题回答';
        let unchangedRounds = 0;
        let lastCount = 0;
        let lastHeight = 0;
        const maxRounds = options.maxRounds || Math.max(8, targetCount * 3);

        for (let round = 0; round < maxRounds && records.size < targetCount && unchangedRounds < 6; round++) {
            const currentItems = getAnswerItems();
            currentItems.forEach(item => expandAnswerItem(item));
            await sleep(120);

            currentItems.forEach((item, index) => {
                const record = buildAnswerRecord(item, index);
                if (record.text.length >= 5 && !existingKeys.has(record.key) && !records.has(record.key)) records.set(record.key, record);
            });

            const message = `${label} ${Math.min(records.size, targetCount)}/${targetCount}（第 ${round + 1} 轮）`;
            if (statusEl) statusEl.textContent = message;
            showCollectOverlay(message);

            const currentHeight = getDocumentHeight();
            if (records.size === lastCount && currentHeight === lastHeight) unchangedRounds++;
            else unchangedRounds = 0;
            lastCount = records.size;
            lastHeight = currentHeight;

            if (records.size >= targetCount) break;
            forceScrollToBottom();
            await sleep(120);
            forceScrollToBottom();
            await sleep(360);
        }

        return Array.from(records.values()).slice(0, targetCount);
    }

    function getQuestionExistingKeys() {
        return new Set(_questionState.answers.map(answer => answer.key).filter(Boolean));
    }

    async function collectMoreQuestionAnswers(batchSize = HOME_BATCH_SIZE, statusEl = null) {
        if (_questionState.loadingMore || _questionState.exhausted) return [];
        _questionState.loadingMore = true;
        const wrapper = document.getElementById('immersive-wrapper');
        const previousWrapperDisplay = wrapper?.style.display || '';
        const wasImmersive = !!window._isImmersive;
        if (wrapper) wrapper.style.display = 'none';
        setOriginalPageVisibleForWiki(true);
        await sleep(120);

        try {
            let batch = await collectQuestionAnswers(statusEl, batchSize, {
                existingKeys: getQuestionExistingKeys(),
                label: '懒加载问题回答',
                maxRounds: Math.max(8, batchSize * 3)
            });
            if (!batch.length) {
                _questionState.exhausted = true;
                await persistCurrentQuestionCache();
                return [];
            }
            batch = await enrichAnswersForList(batch, statusEl);
            _questionState.answers = _questionState.answers.concat(batch);
            if (batch.length < batchSize) _questionState.exhausted = true;
            await persistCurrentQuestionCache();
            return batch;
        } finally {
            setOriginalPageVisibleForWiki(false);
            if (wrapper) wrapper.style.display = previousWrapperDisplay;
            if (wasImmersive) window.scrollTo(0, 0);
            _questionState.loadingMore = false;
            removeCollectOverlay();
        }
    }

    async function loadMoreQuestionAndRender(mode = 'list') {
        const wrapper = document.getElementById('immersive-wrapper');
        let status = document.getElementById('zh-question-load-status');
        if (!status && wrapper) {
            status = document.createElement('div');
            status.id = 'zh-question-load-status';
            status.className = 'zh-collect-status';
            wrapper.appendChild(status);
        }
        if (status) status.textContent = `正在加载后续 ${HOME_BATCH_SIZE} 个回答...`;
        const before = _questionState.answers.length;
        const keepScrollY = window.scrollY;
        try {
            const batch = await collectMoreQuestionAnswers(HOME_BATCH_SIZE, status);
            if (mode === 'answer') {
                if (batch.length && _questionState.currentIndex < _questionState.answers.length - 1) {
                    renderQuestionAnswer(_questionState.currentIndex + 1, false);
                } else {
                    renderQuestionAnswer(Math.min(_questionState.currentIndex, _questionState.answers.length - 1), false);
                }
                return batch;
            }
            renderQuestionList();
            requestAnimationFrame(() => window.scrollTo(0, keepScrollY));
            if (!batch.length && before === _questionState.answers.length) {
                const done = document.getElementById('zh-question-load-status');
                if (done) done.textContent = '暂时没有加载到更多回答。';
            }
            return batch;
        } catch (e) {
            console.error('加载回答失败:', e);
            if (status) status.textContent = `加载失败: ${e.message || '网络或数据错误'}`;
            return [];
        }
    }


    function ensureImmersiveStyle() {
        if (document.getElementById('immersive-style')) return;
        const style = document.createElement('style');
        style.id = 'immersive-style';
        style.innerHTML = STYLE_CSS;
        document.head.appendChild(style);
    }

    function hideOriginalPage(wrapper) {
        const reactRoot = document.getElementById('root') || document.body;
        _questionState.reactRoot = reactRoot;
        Array.from(reactRoot.children).forEach(child => {
            if (child === wrapper || child.id === 'immersive-wrapper' || child.tagName === 'SCRIPT' || child.tagName === 'STYLE' || child.tagName === 'LINK') return;
            child.dataset.origDisplay = child.style.display || '';
            child.style.display = 'none';
            child.classList.add('zh-hidden-by-immersive');
        });
        reactRoot.appendChild(wrapper);
    }

    async function captureQuestionContext() {
        await waitForElement('h1.QuestionHeader-title');
        await expandQuestionRichText();
        _questionState.questionTitle = getQuestionTitleText();
        _questionState.questionDetailHTML = getQuestionDetailHTML();
    }

    function appendQuestionHeader(container, showAllAnswersButton = false) {
        const title = document.createElement('h1');
        title.className = 'zh-question-title';
        title.textContent = _questionState.questionTitle || '知乎问题';
        container.appendChild(title);

        if (_questionState.questionDetailHTML) {
            const details = document.createElement('details');
            details.className = 'zh-question-detail';
            details.innerHTML = `<summary>问题补充</summary><div class="zh-question-detail-body">${_questionState.questionDetailHTML}</div>`;
            container.appendChild(details);
        }

        if (showAllAnswersButton) {
            const toolbar = document.createElement('div');
            toolbar.className = 'zh-question-toolbar';
            const btn = document.createElement('button');
            btn.className = 'zh-inline-btn zh-view-all-answers-btn zh-export-hidden';
            btn.textContent = '查看全部回答';
            btn.addEventListener('click', navigateFromAnswerToMainQuestion);
            toolbar.appendChild(btn);
            container.appendChild(toolbar);
        }

        const hr = document.createElement('hr');
        hr.style.cssText = 'border:0;border-top:1px dashed var(--zh-border);margin:24px 0;';
        container.appendChild(hr);
    }

    function buildQuestionWrapper() {
        const wrapper = document.createElement('div');
        wrapper.id = 'immersive-wrapper';
        wrapper.className = 'zh-question-wrapper';
        return wrapper;
    }

    function clearQuestionTranslations() {
        document.querySelectorAll('#immersive-wrapper .zh-tr-card').forEach(card => card.remove());
        document.body.classList.remove('zh-show-tr');
        window._trVisible = false;
        _articleSummary = '';
        window._articleSummary = '';
        const translateBtn = document.getElementById('zh-translate-btn');
        if (translateBtn) translateBtn.classList.remove('zh-btn-active');
    }

    function renderQuestionList() {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return;
        _questionState.view = 'list';
        restoreLiveMount();
        clearQuestionTranslations();
        wrapper.classList.remove('zh-has-top-nav');
        wrapper.innerHTML = '';
        document.querySelector('.zh-copy-md-container')?.remove();
        appendQuestionHeader(wrapper, false);

        const status = document.createElement('div');
        status.className = 'zh-collect-status';
        status.textContent = _questionState.answers.length
            ? `已采集 ${_questionState.answers.length} 个回答，点击任意条目进入正文。`
            : '没有采集到可展示的回答。';
        wrapper.appendChild(status);

        const list = document.createElement('div');
        list.className = 'zh-answer-list';
        _questionState.answers.forEach((answer, index) => {
            const item = document.createElement('div');
            item.className = 'zh-answer-list-item';
            item.innerHTML = `
                <div class="zh-answer-list-meta">#${index + 1} · ${escapeHTML(answer.author)}${answer.voteText ? ` · ${escapeHTML(answer.voteText)}` : ''}</div>
                <div class="zh-answer-list-snippet">${escapeHTML(answer.preview || answer.snippet || '该回答暂无可预览文本。')}</div>
            `;
            item.addEventListener('click', () => renderQuestionAnswer(index, false));
            list.appendChild(item);
        });
        wrapper.appendChild(list);

        const loadBox = document.createElement('div');
        loadBox.id = 'zh-question-load-status';
        loadBox.className = 'zh-collect-status';
        loadBox.textContent = _questionState.exhausted
            ? `已显示 ${_questionState.answers.length} 个回答，暂时没有更多回答。`
            : `已显示 ${_questionState.answers.length} 个回答，滚到底部或点击按钮再加载 ${HOME_BATCH_SIZE} 个。`;
        wrapper.appendChild(loadBox);

        if (!_questionState.exhausted) {
            const loadBtn = document.createElement('button');
            loadBtn.className = 'zh-inline-btn';
            loadBtn.textContent = `再加载 ${HOME_BATCH_SIZE} 个回答`;
            loadBtn.addEventListener('click', () => loadMoreQuestionAndRender('list'));
            wrapper.appendChild(loadBtn);
        }

        const sentinel = document.createElement('div');
        sentinel.id = 'zh-question-lazy-sentinel';
        sentinel.style.cssText = 'height:1px;margin-top:12px;';
        wrapper.appendChild(sentinel);
        if (!_questionState.exhausted && 'IntersectionObserver' in window) {
            const observer = new IntersectionObserver(entries => {
                if (entries.some(entry => entry.isIntersecting)) {
                    observer.disconnect();
                    loadMoreQuestionAndRender('list');
                }
            }, { rootMargin: '200px' });
            observer.observe(sentinel);
        }
        setupImageToggles();
        window.scrollTo(0, 0);
    }

    function setCurrentQuestionAnswer(index) {
        const safeIndex = Math.max(0, Math.min(index, _questionState.answers.length - 1));
        const answer = _questionState.answers[safeIndex];
        _questionState.currentIndex = safeIndex;
        _questionState.exitScrollY = Number.isFinite(answer?.sourceTop) ? answer.sourceTop : _questionState.originalScrollY;
        persistCurrentQuestionCache();
        return safeIndex;
    }

    async function navigateQuestionAnswer(delta) {
        if (_questionState.view !== 'answer' || !_questionState.answers.length) return;
        const nextIndex = _questionState.currentIndex + delta;
        if (nextIndex < 0) return;
        if (nextIndex >= _questionState.answers.length) {
            if (!_questionState.exhausted) await loadMoreQuestionAndRender('answer');
            return;
        }
        renderQuestionAnswer(nextIndex, false);
    }

    function findOriginalAnswerElement(answer) {
        if (!answer?.key) return null;
        return getAnswerItems().find((item, index) => getAnswerKey(item, index) === answer.key) || null;
    }

    function restoreQuestionAnswerPosition() {
        if (!isQuestionPage() || _questionState.view !== 'answer') return;
        const answer = _questionState.answers[_questionState.currentIndex];
        const original = findOriginalAnswerElement(answer);
        if (original) {
            original.scrollIntoView({ block: 'start' });
            return;
        }

        const targetTop = Number.isFinite(_questionState.exitScrollY)
            ? _questionState.exitScrollY
            : answer?.sourceTop;
        if (Number.isFinite(targetTop)) {
            if (targetTop > getDocumentHeight()) {
                forceScrollToBottom();
                setTimeout(() => window.scrollTo(0, Math.min(targetTop, getDocumentHeight())), 500);
            } else {
                window.scrollTo(0, targetTop);
                setTimeout(() => window.scrollTo(0, targetTop), 120);
            }
        }
    }

    function isTypingTarget(target) {
        const el = target instanceof Element ? target : target?.parentElement;
        return !!el?.closest('input, textarea, select, [contenteditable="true"]');
    }

    function logAnswerReadingRecord(answer) {
        if (!answer) return;
        try {
            let url = answer.key || '';
            if (!url.startsWith('http')) {
                const mainUrl = getMainQuestionUrl().replace(/[?#].*$/, '');
                url = `${mainUrl}/answer/${answer.key}`;
            }
            
            const questionTitle = getQuestionTitleText();
            const title = `${questionTitle} - ${answer.author || '知乎用户'} 的回答`;
            const author = answer.author || '知乎用户';
            const contentKind = 'answer';
            
            addReadingRecord({
                url,
                title,
                author,
                contentKind,
                readAt: new Date().toISOString(),
                manuallyMarked: false,
                wikiCardId: null,
                duration: 0
            }).then(() => {
                console.log('沉浸式阅读：已成功自动保存回答历史', { url, title });
            }).catch(e => {
                console.warn('保存回答历史失败', e);
            });
        } catch (e) {
            console.warn('记录回答历史错误', e);
        }
    }

    function renderQuestionAnswer(index = 0, showAllAnswersButton = false) {
        const wrapper = document.getElementById('immersive-wrapper');
        const safeIndex = setCurrentQuestionAnswer(index);
        const answer = _questionState.answers[safeIndex];
        if (!wrapper || !answer) return;

        logAnswerReadingRecord(answer);

        _questionState.view = 'answer';
        clearQuestionTranslations();
        wrapper.classList.add('zh-has-top-nav');
        wrapper.innerHTML = '';
        appendQuestionHeader(wrapper, showAllAnswersButton);

        const toolbar = document.createElement('div');
        toolbar.className = 'zh-question-toolbar zh-reader-top-nav';
        if (_questionState.answers.length > 1 || !_questionState.exhausted) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'zh-inline-btn';
            prevBtn.textContent = '上一篇';
            prevBtn.disabled = safeIndex <= 0;
            prevBtn.style.opacity = prevBtn.disabled ? '0.45' : '1';
            prevBtn.addEventListener('click', () => navigateQuestionAnswer(-1));
            toolbar.appendChild(prevBtn);

            const nextBtn = document.createElement('button');
            nextBtn.className = 'zh-inline-btn';
            nextBtn.textContent = safeIndex >= _questionState.answers.length - 1 && !_questionState.exhausted
                ? `加载后续 ${HOME_BATCH_SIZE} 个`
                : '下一篇';
            nextBtn.disabled = safeIndex >= _questionState.answers.length - 1 && _questionState.exhausted;
            nextBtn.style.opacity = nextBtn.disabled ? '0.45' : '1';
            nextBtn.addEventListener('click', () => navigateQuestionAnswer(1));
            toolbar.appendChild(nextBtn);

            const backBtn = document.createElement('button');
            backBtn.className = 'zh-inline-btn';
            backBtn.textContent = '返回回答列表';
            backBtn.addEventListener('click', renderQuestionList);
            toolbar.appendChild(backBtn);
        }

        const current = document.createElement('span');
        current.className = 'zh-nav-current';
        current.textContent = `当前第 ${safeIndex + 1} / ${_questionState.answers.length}`;
        toolbar.appendChild(current);

        const answerUrl = answer.key && /^https?:\/\//.test(answer.key) ? answer.key : location.href;
        const qToreadBtn = createPageToReadBtn(
            answerUrl,
            _questionState.questionTitle || document.title,
            answer.author || '',
            '问题回答'
        );
        toolbar.appendChild(qToreadBtn);

        wrapper.appendChild(toolbar);

        const view = document.createElement('div');
        view.className = 'zh-question-answer-view';
        if (!mountLiveNode(answer.liveNode, view)) {
            view.appendChild(cleanupAnswerClone(answer.clone.cloneNode(true)));
        }
        wrapper.appendChild(view);
        document.querySelector('.zh-copy-md-container')?.remove();
        document.body.appendChild(createCopyMarkdownBtn());
        setupImageToggles();
        startArticleAdCleanup();
        window.scrollTo(0, 0);
    }

    async function enterQuestionImmersive() {
        if (!isQuestionPage()) return alert('阁下，此版本只适配知乎 question 页面。');
        _questionState.originalScrollY = window.scrollY;
        _questionState.collecting = true;
        applyTheme(currentThemeIndex);

        try {
            await captureQuestionContext();
            const wrapper = buildQuestionWrapper();

            if (isAnswerUrl()) {
                const content = await waitForElement('.QuestionAnswer-content, .AnswerItem');
                if (!content) throw new Error('未找到当前回答正文');
                const answerItem = content.closest?.('.AnswerItem') || content;
                expandAnswerItem(answerItem);
                await sleep(400);
                _questionState.answers = [buildAnswerRecord(answerItem, 0)];
                _questionState.exhausted = true;
                ensureImmersiveStyle();
                hideOriginalPage(wrapper);
                _articleNode = wrapper;
                createQuestionToolsPanel();
                window._isImmersive = true;
                renderQuestionAnswer(0, true);
                if (config.autoSum || config.autoTr) {
                    const triggerAutoTranslate = () => document.getElementById('zh-translate-btn')?.click();
                    if (document.readyState === 'complete') {
                        setTimeout(triggerAutoTranslate, 800);
                    } else {
                        window.addEventListener('load', () => setTimeout(triggerAutoTranslate, 800), { once: true });
                    }
                }
                logCurrentPageReadingRecord();
                return;
            }

            const status = showCollectOverlay('正在等待回答列表...');
            await waitForElement('.Card.AnswersNavWrapper, .QuestionAnswers-answers, .ContentItem.AnswerItem');
            const cacheKey = getQuestionCacheKey();
            let forceMainCollect = false;
            try {
                forceMainCollect = sessionStorage.getItem('zh-force-main-question-collect') === getMainQuestionUrl();
                if (forceMainCollect) sessionStorage.removeItem('zh-force-main-question-collect');
            } catch (err) {}
            const cached = forceMainCollect ? null : (_questionAnswerCache.get(cacheKey) || await loadPersistentQuestionCache(cacheKey));
            if (cached?.answers?.length) {
                _questionState.answers = cached.answers;
                attachLiveNodesToAnswers(_questionState.answers);
                if (cached.questionTitle) _questionState.questionTitle = cached.questionTitle;
                if (cached.questionDetailHTML) _questionState.questionDetailHTML = cached.questionDetailHTML;
                _questionState.currentIndex = cached.currentIndex || 0;
                _questionState.exitScrollY = cached.exitScrollY || _questionState.answers[_questionState.currentIndex]?.sourceTop || _questionState.originalScrollY;
                _questionState.exhausted = cached.exhausted === true;
                status.textContent = `已使用缓存的 ${_questionState.answers.length} 个回答`;
                await sleep(200);
            } else {
                _questionState.answers = await collectQuestionAnswers(status, HOME_BATCH_SIZE, {
                    label: '快速采集首批问题回答',
                    maxRounds: Math.max(8, HOME_BATCH_SIZE * 3)
                });
                _questionState.exhausted = _questionState.answers.length < HOME_BATCH_SIZE;
                _questionState.answers = await enrichAnswersForList(_questionState.answers, status);
                _questionState.currentIndex = 0;
                _questionState.exitScrollY = _questionState.answers[0]?.sourceTop || _questionState.originalScrollY;
                await persistCurrentQuestionCache();
            }
            removeCollectOverlay();
            ensureImmersiveStyle();
            hideOriginalPage(wrapper);
            _articleNode = wrapper;
            createQuestionToolsPanel();
            window._isImmersive = true;
            renderQuestionList();
            logCurrentPageReadingRecord();
        } catch (err) {
            removeCollectOverlay();
            window._isImmersive = false;
            alert(`进入问题沉浸模式失败：${err.message}`);
        } finally {
            _questionState.collecting = false;
        }
    }


// ═══════════════════════════════════════════════════════════
// 模块: page-home.js
// ═══════════════════════════════════════════════════════════
    function getHomeCacheKey() {
        return `${location.origin}${location.pathname}::topstory`;
    }

    function getHomeFeedItems() {
        return Array.from(document.querySelectorAll('#TopstoryContent .Card.TopstoryItem, #TopstoryContent .TopstoryItem'))
            .filter(item => !item.closest('#immersive-wrapper') && item.querySelector('.ContentItem, .RichContent, .RichText'));
    }

    function getHomeRecommendInitialApiUrl(limit = HOME_BATCH_SIZE) {
        const url = new URL('/api/v3/feed/topstory/recommend', location.origin);
        url.searchParams.set('action', 'down');
        url.searchParams.set('page_number', '1');
        url.searchParams.set('limit', String(limit));
        return url.href;
    }

    function normalizeHomeApiNextUrl(raw) {
        if (!raw) return '';
        try {
            return new URL(raw, location.origin).href;
        } catch (err) {
            return '';
        }
    }

    function parseHomeBrief(feedItem) {
        try {
            return feedItem?.brief ? JSON.parse(feedItem.brief) : {};
        } catch (err) {
            return {};
        }
    }

    function expandHomeFeedItem(item) {
        item.querySelectorAll('.RichContent button, .RichContent-collapsedText, button.ContentItem-more').forEach(ctrl => {
            const text = (ctrl.innerText || ctrl.textContent || '').trim();
            if (/阅读全文|显示全部|展开阅读全文|展开/.test(text)) {
                try { ctrl.click(); } catch (err) {}
            }
        });
    }

    function isZhihuContentUrl(url) {
        return /\/question\/\d+(?:\/answer\/\d+)?(?:[/?#]|$)/.test(url || '')
            || /\/p\/\d+(?:[/?#]|$)/.test(url || '');
    }

    function normalizeContentUrl(raw) {
        if (!raw) return '';
        try {
            const url = new URL(raw, location.origin);
            url.hash = '';
            return isZhihuContentUrl(url.href) ? url.href : '';
        } catch (err) {
            return isZhihuContentUrl(raw) ? raw : '';
        }
    }

    function getHomeContentUrlCandidates(item) {
        const candidates = [];
        item.querySelectorAll('.ContentItem-title a[href], h2 a[href], a.ContentItem-title[href], a[href*="/answer/"], a[href*="/question/"], a[href*="/p/"]').forEach(link => {
            const normalized = normalizeContentUrl(link.href || link.getAttribute('href'));
            if (normalized) candidates.push(normalized);
        });
        item.querySelectorAll('meta[itemprop="url"]').forEach(meta => {
            const normalized = normalizeContentUrl(meta.content);
            if (normalized) candidates.push(normalized);
        });
        return Array.from(new Set(candidates));
    }

    function getHomeItemKey(item, index) {
        const link = getHomeContentUrlCandidates(item)[0];
        if (link) return link;
        const title = item.querySelector('.ContentItem-title, h2')?.innerText || '';
        return `${index}-${title}-${(item.innerText || '').slice(0, 60)}`;
    }

    function getHomeItemUrl(item) {
        return getHomeContentUrlCandidates(item)[0] || '';
    }

    function getHomeItemType(url) {
        if (/\/p\//.test(url)) return '专栏文章';
        if (/\/question\/\d+\/answer\//.test(url)) return '问题回答';
        if (/\/question\//.test(url)) return '问题';
        return '知乎内容';
    }

    function getHomeItemTitle(item) {
        return (item.querySelector('.ContentItem-title, h2')?.innerText || '知乎推荐内容').replace(/\s+/g, ' ').trim();
    }

    function getHomeItemAuthor(item) {
        const metaName = item.querySelector('meta[itemprop="name"]')?.content;
        const textName = item.querySelector('.AuthorInfo-name, .UserLink.AuthorInfo-name, .UserLink-link')?.innerText;
        return (metaName || textName || '未知作者').replace(/\s+/g, ' ').trim();
    }

    function getHomeItemText(item) {
        const richText = item.querySelector('.RichText.ztext, .RichText, .RichContent-inner');
        return (richText?.innerText || item.innerText || '').replace(/\s+/g, ' ').trim();
    }

    function getWebUrlFromApiTarget(target = {}) {
        const type = target.type || '';
        if (type === 'answer' && target.question?.id && target.id) {
            return `https://www.zhihu.com/question/${target.question.id}/answer/${target.id}`;
        }
        if (type === 'article' && target.id) {
            return `https://zhuanlan.zhihu.com/p/${target.id}`;
        }
        if (type === 'question' && target.id) {
            return `https://www.zhihu.com/question/${target.id}`;
        }
        return normalizeContentUrl(target.url || target.url_token || '');
    }

    function getHomeApiTargetTitle(target = {}, brief = {}) {
        if (target.type === 'answer') return target.question?.title || brief.title || '知乎回答';
        return target.title || target.question?.title || brief.title || '知乎推荐内容';
    }

    function getHomeApiTargetAuthor(target = {}, brief = {}) {
        return (target.author?.name || brief.author || brief.member?.name || '未知作者').replace(/\s+/g, ' ').trim();
    }

    function getHomeApiAuthorAvatar(target = {}, brief = {}) {
        const author = target.author || brief.member || {};
        const template = author.avatar_url_template || author.avatarUrlTemplate || '';
        if (template) return String(template).replace('{size}', 'xl').replace('{id}', 'xl');
        return author.avatar_url || author.avatarUrl || author.avatar || brief.avatar_url || '';
    }

    function getHomeApiAuthorHeadline(target = {}, brief = {}) {
        const author = target.author || brief.member || {};
        return (author.headline || author.description || author.bio || brief.headline || brief.description || '').replace(/\s+/g, ' ').trim();
    }

    function getHomeApiThumbnail(target = {}, brief = {}) {
        const thumbnails = target.thumbnails || brief.thumbnails || [];
        const first = Array.isArray(thumbnails) ? thumbnails[0] : null;
        return target.thumbnail || target.thumbnail_url || target.image_url || brief.thumbnail || brief.thumbnail_url
            || (typeof first === 'string' ? first : first?.url || '');
    }

    function formatHomeApiStats(target = {}) {
        return [
            ['赞同', target.voteup_count],
            ['评论', target.comment_count],
            ['收藏', target.favorite_count],
            ['感谢', target.thanks_count],
            ['浏览', target.visited_count]
        ].filter(([, value]) => Number.isFinite(Number(value)) && Number(value) > 0)
            .map(([label, value]) => `${value} ${label}`)
            .join(' · ');
    }

    function getHomeApiTargetType(target = {}, url = '') {
        if (target.type === 'answer') return '问题回答';
        if (target.type === 'article') return '专栏文章';
        if (target.type === 'question') return '问题';
        return getHomeItemType(url);
    }

    function getHomeApiTargetHTML(target = {}, text = '') {
        const html = target.content || target.excerpt_new || target.excerpt || target.detail || '';
        if (/<[a-z][\s\S]*>/i.test(String(html))) return html;
        return escapeHTML(html || text).replace(/\n/g, '<br>');
    }

    function buildHomeApiClone(record, target = {}) {
        const clone = document.createElement('article');
        clone.className = 'ContentItem zh-home-api-item';
        const avatarHTML = record.authorAvatar
            ? `<img class="Avatar zh-api-avatar" src="${escapeHTML(record.authorAvatar)}" alt="">`
            : '';
        const headlineHTML = record.authorHeadline
            ? `<div style="font-size:13px;opacity:.72;margin-top:2px;">${escapeHTML(record.authorHeadline)}</div>`
            : '';
        const thumbnailHTML = record.thumbnail
            ? `<figure style="margin:14px 0;"><img src="${escapeHTML(record.thumbnail)}" alt="" style="max-width:100%;height:auto;border-radius:6px;object-fit:cover;"></figure>`
            : '';
        clone.innerHTML = `
            <h2 class="ContentItem-title"><a href="${escapeHTML(record.url || '#')}" target="_blank" rel="noopener noreferrer">${escapeHTML(record.title)}</a></h2>
            <div class="AuthorInfo zh-api-author">
                ${avatarHTML}
                <div class="zh-api-author-text">
                    <div style="font-weight:bold;">${escapeHTML(record.author)}${record.stats ? ` · <span style="font-weight:normal;opacity:.78;">${escapeHTML(record.stats)}</span>` : ''}</div>
                    ${headlineHTML}
                </div>
            </div>
            ${thumbnailHTML}
            <div class="RichText ztext">${getHomeApiTargetHTML(target, record.text)}</div>
            <div class="zh-api-action-slot"></div>
        `;
        return cleanupHomeClone(clone);
    }

    function buildHomeApiRecord(feedItem, index) {
        const target = feedItem?.target || {};
        const brief = parseHomeBrief(feedItem);
        const url = getWebUrlFromApiTarget(target);
        const title = getHomeApiTargetTitle(target, brief);
        const author = getHomeApiTargetAuthor(target, brief);
        const authorAvatar = getHomeApiAuthorAvatar(target, brief);
        const authorHeadline = getHomeApiAuthorHeadline(target, brief);
        const thumbnail = getHomeApiThumbnail(target, brief);
        const stats = formatHomeApiStats(target);
        const primaryContent = target.content || target.detail || '';
        const rawText = stripHTMLToText(primaryContent || target.excerpt_new || target.excerpt || brief.content || brief.text || title);
        const text = normalizeText(rawText || title);
        const apiFullContentText = normalizeText(stripHTMLToText(primaryContent));
        const record = {
            key: url || feedItem?.id || `${index}-${title}-${text.slice(0, 60)}`,
            url,
            type: getHomeApiTargetType(target, url),
            title,
            author,
            authorAvatar,
            authorHeadline,
            thumbnail,
            stats,
            snippet: text.slice(0, 180),
            text,
            sourceTop: _homeState.originalScrollY || window.scrollY || 0,
            liveNode: null,
            clone: null,
            apiFeedId: feedItem?.id || '',
            apiOffset: feedItem?.offset,
            apiTargetType: target.type || '',
            apiTargetId: String(target.id || ''),
            apiContentLength: apiFullContentText.length,
            apiHasFullContent: apiFullContentText.length >= 80,
            voting: (target.relationship?.voting) ?? 0,
            thanked: !!(target.relationship?.is_thanked),
            liked: false,
            collected: false,
            voteup_count: target.voteup_count ?? 0,
            comment_count: target.comment_count ?? 0,
            thanks_count: target.thanks_count ?? 0,
            favlists_count: target.favlists_count ?? target.favorite_count ?? 0
        };
        record.clone = buildHomeApiClone(record, target);
        return record;
    }

    function cleanupHomeClone(clone) {
        clone.querySelectorAll('script, style, .Comments-container, .pc-article-answer-card, .pc-article-answer-text-chain, .pc-article-answer-big-img, .ecommerce-ad-box, .MCNLinkCard').forEach(el => el.remove());
        clone.querySelectorAll('.ContentItem-actions').forEach(el => {
            el.style.position = 'static';
            el.style.boxShadow = 'none';
            el.style.background = 'transparent';
        });
        clone.querySelectorAll('img').forEach(img => {
            const realSrc = img.getAttribute('data-original') || img.getAttribute('data-actualsrc');
            if (realSrc) img.src = realSrc;
        });
        return clone;
    }

    function buildHomeRecord(item, index) {
        expandHomeFeedItem(item);
        const text = getHomeItemText(item);
        const url = getHomeItemUrl(item);
        return {
            key: getHomeItemKey(item, index),
            url,
            type: getHomeItemType(url),
            title: getHomeItemTitle(item),
            author: getHomeItemAuthor(item),
            snippet: text.slice(0, 180),
            text,
            sourceTop: getElementPageTop(item),
            liveNode: item,
            clone: cleanupHomeClone(item.cloneNode(true))
        };
    }

    function updateHomeCollectStatus(statusEl, message) {
        if (statusEl?.id === 'zh-wiki-progress' && wikiState.running) {
            updateWikiProgress(message, 'collect');
        } else {
            if (statusEl) statusEl.textContent = message;
            showCollectOverlay(message);
        }
    }

    async function fetchHomeRecommendApiPage(limit = HOME_BATCH_SIZE) {
        const url = _homeState.apiNextUrl || getHomeRecommendInitialApiUrl(limit);
        const data = await gmFetchJSON(url);
        _homeState.apiStarted = true;
        const paging = data?.paging || {};
        _homeState.apiNextUrl = normalizeHomeApiNextUrl(paging.next);
        if (paging.is_end || !_homeState.apiNextUrl) _homeState.exhausted = true;
        return Array.isArray(data?.data) ? data.data : [];
    }

    async function collectHomeFeedItemsFromApi(statusEl = null, targetCount = HOME_BATCH_SIZE, options = {}) {
        const records = new Map();
        const existingKeys = new Set(options.existingKeys || []);
        const label = options.label || 'API 加载首页推荐';
        const maxPages = options.maxPages || Math.max(3, Math.ceil(targetCount / HOME_BATCH_SIZE) + 3);

        for (let page = 0; page < maxPages && records.size < targetCount && !_homeState.exhausted; page++) {
            if (wikiState.running) await waitWhileWikiPaused();
            updateHomeCollectStatus(statusEl, `${label} ${Math.min(records.size, targetCount)}/${targetCount}（API 第 ${page + 1} 页）`);
            const feedItems = await fetchHomeRecommendApiPage(HOME_BATCH_SIZE);
            if (!feedItems.length) {
                _homeState.exhausted = true;
                break;
            }

            feedItems.forEach((feedItem, index) => {
                const record = buildHomeApiRecord(feedItem, index);
                if (record.text.length >= 5 && !existingKeys.has(record.key) && !records.has(record.key)) records.set(record.key, record);
            });

            updateHomeCollectStatus(statusEl, `${label} ${Math.min(records.size, targetCount)}/${targetCount}`);
        }

        return Array.from(records.values()).slice(0, targetCount);
    }

    function collectHomeFeedItemsFromDOM(statusEl = null, targetCount = HOME_BATCH_SIZE, options = {}) {
        const records = new Map();
        const existingKeys = new Set(options.existingKeys || []);
        const label = options.label || '读取首页预加载推荐';
        const currentItems = getHomeFeedItems();
        currentItems.forEach(item => expandHomeFeedItem(item));
        currentItems.forEach((item, index) => {
            const record = buildHomeRecord(item, index);
            if (record.text.length >= 5 && !existingKeys.has(record.key) && !records.has(record.key)) records.set(record.key, record);
        });
        updateHomeCollectStatus(statusEl, `${label} ${Math.min(records.size, targetCount)}/${targetCount}（DOM 兜底，不触底滚动）`);
        return Array.from(records.values()).slice(0, targetCount);
    }

    async function collectHomeFeedItems(statusEl = null, targetCount = HOME_BATCH_SIZE, options = {}) {
        if (options.source !== 'api') {
            return collectHomeFeedItemsFromDOM(statusEl, targetCount, options);
        }
        try {
            const apiRecords = await collectHomeFeedItemsFromApi(statusEl, targetCount, options);
            if (apiRecords.length || _homeState.apiStarted) return apiRecords;
        } catch (err) {
            console.warn('知乎沉浸式阅读：首页推荐 API 加载失败，回退 DOM 预加载内容', err);
            updateHomeCollectStatus(statusEl, `首页推荐 API 加载失败，回退页面预加载内容：${err.message || err}`);
        }
        return collectHomeFeedItemsFromDOM(statusEl, targetCount, options);
    }


    function clearHomeTranslations() {
        clearQuestionTranslations();
    }

    function buildHomeWrapper() {
        const wrapper = document.createElement('div');
        wrapper.id = 'immersive-wrapper';
        wrapper.className = 'zh-home-wrapper';
        return wrapper;
    }

    function appendHomeHeader(container) {
        const title = document.createElement('h1');
        title.className = 'zh-home-title';
        title.textContent = '知乎首页推荐';
        container.appendChild(title);
    }

    function normalizeHomeGroups(groups = _homeState.groups) {
        return (Array.isArray(groups) ? groups : [])
            .map(group => (Array.isArray(group) ? group.filter(Boolean).slice(0, HOME_BATCH_SIZE) : []))
            .filter(group => group.length);
    }

    function syncHomeItemsFromGroups() {
        _homeState.groups = normalizeHomeGroups(_homeState.groups);
        _homeState.items = _homeState.groups.flat();
        return _homeState.items;
    }

    function getHomeGroupStartIndex(groupIndex = _homeState.currentGroupIndex) {
        syncHomeItemsFromGroups();
        return _homeState.groups.slice(0, Math.max(0, groupIndex)).reduce((sum, group) => sum + group.length, 0);
    }

    function getCurrentHomeGroup() {
        syncHomeItemsFromGroups();
        if (!_homeState.groups.length) return [];
        _homeState.currentGroupIndex = Math.max(0, Math.min(_homeState.currentGroupIndex || 0, _homeState.groups.length - 1));
        return _homeState.groups[_homeState.currentGroupIndex] || [];
    }

    function persistHomeFeedCache() {
        syncHomeItemsFromGroups();
        _homeFeedCache.set(getHomeCacheKey(), {
            schemaVersion: 2,
            groups: _homeState.groups,
            items: _homeState.items,
            currentIndex: _homeState.currentIndex || 0,
            currentGroupIndex: _homeState.currentGroupIndex || 0,
            currentIndexInGroup: _homeState.currentIndexInGroup || 0,
            exitScrollY: _homeState.exitScrollY || _homeState.originalScrollY,
            exhausted: _homeState.exhausted,
            apiNextUrl: _homeState.apiNextUrl,
            apiStarted: _homeState.apiStarted
        });
    }

    function getHomeExistingKeys() {
        return new Set(syncHomeItemsFromGroups().map(item => item.key).filter(Boolean));
    }

    function setHomeGroup(groupIndex) {
        syncHomeItemsFromGroups();
        if (!_homeState.groups.length) return;
        _homeState.currentGroupIndex = Math.max(0, Math.min(groupIndex, _homeState.groups.length - 1));
        _homeState.currentIndexInGroup = 0;
        _homeState.currentIndex = getHomeGroupStartIndex(_homeState.currentGroupIndex);
        persistHomeFeedCache();
        renderHomeList();
    }

    async function loadNextHomeGroup(statusEl = null, options = {}) {
        if (_homeState.loadingMore || _homeState.exhausted) return [];
        _homeState.loadingMore = true;
        const batchSize = options.batchSize || HOME_BATCH_SIZE;
        const switchToNewGroup = options.switchToNewGroup !== false;
        const previousGroupIndex = _homeState.currentGroupIndex || 0;

        try {
            const batch = await collectHomeFeedItemsFromApi(statusEl, batchSize, {
                existingKeys: getHomeExistingKeys(),
                label: options.label || '手动加载下一组首页推荐',
                maxPages: options.maxPages || Math.max(4, Math.ceil(batchSize / HOME_BATCH_SIZE) + 4)
            });
            if (!batch.length) {
                _homeState.exhausted = true;
                persistHomeFeedCache();
                return [];
            }
            _homeState.groups = normalizeHomeGroups(_homeState.groups.concat([batch]));
            _homeState.currentGroupIndex = switchToNewGroup ? _homeState.groups.length - 1 : previousGroupIndex;
            _homeState.currentIndexInGroup = switchToNewGroup ? 0 : (_homeState.currentIndexInGroup || 0);
            _homeState.currentIndex = getHomeGroupStartIndex(_homeState.currentGroupIndex) + (_homeState.currentIndexInGroup || 0);
            persistHomeFeedCache();
            return batch;
        } finally {
            _homeState.loadingMore = false;
            removeCollectOverlay();
        }
    }

    async function collectMoreHomeItems(batchSize = HOME_BATCH_SIZE, statusEl = null) {
        return loadNextHomeGroup(statusEl, { batchSize, switchToNewGroup: true });
    }

    async function loadMoreHomeAndRender() {
        const wrapper = document.getElementById('immersive-wrapper');
        let status = document.getElementById('zh-home-load-status');
        if (!status && wrapper) {
            status = document.createElement('div');
            status.id = 'zh-home-load-status';
            status.className = 'zh-collect-status';
            wrapper.appendChild(status);
        }
        if (status) status.textContent = `正在加载第 ${_homeState.groups.length + 1} 组首页推荐...`;
        const keepScrollY = window.scrollY;
        try {
            const batch = await loadNextHomeGroup(status, { switchToNewGroup: true });
            renderHomeList();
            requestAnimationFrame(() => window.scrollTo(0, batch.length ? 0 : keepScrollY));
            return batch;
        } catch (e) {
            console.error('加载推荐动态失败:', e);
            if (status) status.textContent = `加载失败: ${e.message || '网络或数据错误'}`;
            return [];
        }
    }

    function getHomeLayout() {
        return crossOriginGet('zh-home-layout') || 'double';
    }

    function setHomeLayout(layout) {
        crossOriginSet('zh-home-layout', layout);
    }

    function renderHomeGroupToolbar(wrapper) {
        const groups = normalizeHomeGroups(_homeState.groups);
        const groupIndex = Math.max(0, Math.min(_homeState.currentGroupIndex || 0, Math.max(0, groups.length - 1)));
        const toolbar = document.createElement('div');
        toolbar.className = 'zh-home-toolbar';

        const makeBtn = (label, icon, disabled, handler) => {
            const btn = document.createElement('button');
            btn.className = 'zh-home-nav-btn';
            btn.disabled = disabled;
            btn.innerHTML = `<span class="zh-home-nav-icon">${icon}</span><span>${label}</span>`;
            if (!disabled) btn.addEventListener('click', handler);
            return btn;
        };

        toolbar.appendChild(makeBtn('上一组', '‹', groupIndex <= 0, () => setHomeGroup(groupIndex - 1)));

        const indicator = document.createElement('span');
        indicator.className = 'zh-home-nav-indicator';
        indicator.textContent = `${groups.length ? groupIndex + 1 : 0} / ${groups.length}`;
        toolbar.appendChild(indicator);

        toolbar.appendChild(makeBtn('下一组', '›', groupIndex >= groups.length - 1, () => setHomeGroup(groupIndex + 1)));

        if (!_homeState.exhausted) {
            toolbar.appendChild(makeBtn('加载更多', '+', _homeState.loadingMore, () => loadMoreHomeAndRender()));
        }

        const layoutBtn = document.createElement('button');
        layoutBtn.className = 'zh-home-nav-btn zh-home-layout-btn';
        layoutBtn.title = '切换单列/双列';
        const isSingle = getHomeLayout() === 'single';
        layoutBtn.innerHTML = isSingle
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="3" width="9" height="8" rx="1"/><rect x="13" y="3" width="9" height="8" rx="1"/><rect x="2" y="13" width="9" height="8" rx="1"/><rect x="13" y="13" width="9" height="8" rx="1"/></svg>'
            : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/></svg>';
        layoutBtn.addEventListener('click', () => {
            setHomeLayout(isSingle ? 'double' : 'single');
            renderHomeList();
        });
        toolbar.appendChild(layoutBtn);

        wrapper.appendChild(toolbar);
    }

    function renderHomeList() {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return;
        _homeState.view = 'list';
        restoreLiveMount();
        clearHomeTranslations();
        syncHomeItemsFromGroups();
        wrapper.classList.remove('zh-has-top-nav', 'zh-follow-wide', 'zh-follow-double');
        wrapper.classList.add('zh-home-wide');
        wrapper.innerHTML = '';
        appendFeedSwitchHeader(wrapper, 'home');
        renderHomeGroupToolbar(wrapper);

        const group = getCurrentHomeGroup();
        const groupIndex = _homeState.currentGroupIndex || 0;

        if (!group.length) {
            const empty = document.createElement('div');
            empty.className = 'zh-collect-status';
            empty.textContent = '没有采集到可展示的首页推荐。';
            wrapper.appendChild(empty);
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'zh-home-grid' + (getHomeLayout() === 'single' ? ' zh-home-grid-single' : '');
        group.forEach((itemRecord, index) => {
            const card = document.createElement('div');
            card.className = 'zh-home-card';

            const title = document.createElement('div');
            title.className = 'zh-home-card-title';
            title.textContent = itemRecord.title || '知乎推荐内容';

            const meta = document.createElement('div');
            meta.className = 'zh-home-card-meta';
            if (itemRecord.authorAvatar) {
                const avatar = document.createElement('img');
                avatar.src = itemRecord.authorAvatar;
                avatar.alt = '';
                meta.appendChild(avatar);
            }
            const metaText = document.createElement('span');
            metaText.textContent = [itemRecord.author, itemRecord.stats].filter(Boolean).join(' · ');
            meta.appendChild(metaText);
            if (itemRecord.type) {
                const typeTag = document.createElement('span');
                typeTag.className = 'zh-home-card-type';
                typeTag.textContent = itemRecord.type;
                meta.appendChild(typeTag);
            }

            const snippet = document.createElement('p');
            snippet.className = 'zh-home-card-snippet';
            snippet.textContent = itemRecord.snippet || '';

            card.appendChild(title);
            card.appendChild(meta);
            if (itemRecord.snippet) card.appendChild(snippet);
            card.addEventListener('click', () => renderHomeItem(index, groupIndex));
            grid.appendChild(card);
        });
        wrapper.appendChild(grid);

        setupImageToggles();
        window.scrollTo(0, 0);
    }

    function setCurrentHomeItem(indexInGroup = 0, groupIndex = _homeState.currentGroupIndex) {
        syncHomeItemsFromGroups();
        if (!_homeState.groups.length) return { group: [], item: null, groupIndex: 0, indexInGroup: 0, globalIndex: 0 };
        const safeGroupIndex = Math.max(0, Math.min(groupIndex, _homeState.groups.length - 1));
        const group = _homeState.groups[safeGroupIndex] || [];
        const safeIndex = Math.max(0, Math.min(indexInGroup, Math.max(0, group.length - 1)));
        const item = group[safeIndex] || null;
        const globalIndex = getHomeGroupStartIndex(safeGroupIndex) + safeIndex;
        _homeState.currentGroupIndex = safeGroupIndex;
        _homeState.currentIndexInGroup = safeIndex;
        _homeState.currentIndex = globalIndex;
        _homeState.exitScrollY = Number.isFinite(item?.sourceTop) ? item.sourceTop : _homeState.originalScrollY;
        persistHomeFeedCache();
        return { group, item, groupIndex: safeGroupIndex, indexInGroup: safeIndex, globalIndex };
    }

    function navigateHomeItem(delta) {
        if (_homeState.view !== 'item') return;
        syncHomeItemsFromGroups();
        const totalItems = _homeState.items.length;
        const currentGlobal = _homeState.currentIndex || 0;
        const nextGlobal = currentGlobal + delta;
        if (nextGlobal < 0 || nextGlobal >= totalItems) return;

        let count = 0;
        for (let g = 0; g < _homeState.groups.length; g++) {
            const group = _homeState.groups[g];
            if (nextGlobal < count + group.length) {
                renderHomeItem(nextGlobal - count, g);
                return;
            }
            count += group.length;
        }
    }

    function loadToReadList() {
        try {
            const raw = crossOriginGet(TOREAD_LIST_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    }

    function saveToReadList(list) {
        crossOriginSet(TOREAD_LIST_KEY, JSON.stringify((list || []).slice(0, TOREAD_MAX)));
    }

    function isInToReadList(url) {
        if (!url) return false;
        return loadToReadList().some(item => item.url === url);
    }

    function toggleToReadItem(itemRecord, btn) {
        const list = loadToReadList();
        const url = itemRecord.url || itemRecord.key || '';
        const existingIndex = list.findIndex(item => item.url === url);

        if (existingIndex >= 0) {
            list.splice(existingIndex, 1);
            saveToReadList(list);
            if (btn) btn.classList.remove('zh-btn-active');
            showCollectOverlay('已从待读列表移除');
        } else {
            list.unshift({
                url,
                title: itemRecord.title || '知乎内容',
                author: itemRecord.author || '',
                type: itemRecord.type || '',
                addedAt: new Date().toISOString()
            });
            saveToReadList(list);
            if (btn) btn.classList.add('zh-btn-active');
            showCollectOverlay('已加入待读列表');
        }
        setTimeout(removeCollectOverlay, 1200);
    }

    function showToReadListModal() {
        if (document.getElementById('zh-toread-modal')) return;
        const items = loadToReadList();
        const rows = items.map((item, index) => `
            <div style="border:1px solid var(--zh-border);background:var(--zh-quote);border-radius:4px;padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;gap:10px;">
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:bold;color:var(--zh-title);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(item.title)}</div>
                    <div style="font-size:12px;opacity:.7;margin-top:3px;">${escapeHTML(item.author || '')}${item.type ? ' · ' + escapeHTML(item.type) : ''} · ${item.addedAt ? new Date(item.addedAt).toLocaleDateString() : ''}</div>
                </div>
                <a href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer" class="zh-inline-btn" style="padding:4px 8px;font-size:12px;white-space:nowrap;">打开</a>
                <button class="zh-inline-btn zh-toread-remove" data-index="${index}" style="padding:4px 8px;font-size:12px;">移除</button>
            </div>
        `).join('');
        const modal = createModal('zh-toread-modal', '待读列表', `
            <div style="font-size:13px;opacity:.75;margin-bottom:12px;">共 ${items.length} 条。</div>
            <div id="zh-toread-list">${rows || '<div style="opacity:.7;">待读列表为空。在文章阅读页点击书签图标可添加。</div>'}</div>
            <div style="margin-top:12px;display:flex;gap:8px;">
                <button id="zh-toread-clear" class="zh-inline-btn">清空列表</button>
            </div>
        `);
        modal.querySelectorAll('.zh-toread-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const list = loadToReadList();
                const idx = parseInt(btn.dataset.index, 10);
                if (idx >= 0 && idx < list.length) {
                    list.splice(idx, 1);
                    saveToReadList(list);
                    modal.remove();
                    showToReadListModal();
                }
            });
        });
        document.getElementById('zh-toread-clear')?.addEventListener('click', () => {
            if (!confirm('确认清空待读列表？')) return;
            saveToReadList([]);
            modal.remove();
            showToReadListModal();
        });
    }

    function logFeedItemReadingRecord(item) {
        if (!item) return;
        try {
            const url = (item.url || item.key || '').replace(/[?#].*$/, '');
            if (!url) return;
            const title = (item.title || '知乎内容').replace(/\s+-\s+知乎$/, '').replace(/\s+-\s+知乎专栏$/, '');
            const author = item.author || '未知作者';
            const contentKind = item.type || 'article';
            
            addReadingRecord({
                url,
                title,
                author,
                contentKind,
                readAt: new Date().toISOString(),
                manuallyMarked: false,
                wikiCardId: null,
                duration: 0
            }).then(() => {
                console.log('沉浸式阅读：已成功自动保存历史记录', { url, title });
            }).catch(e => {
                console.warn('保存历史记录失败', e);
            });
        } catch (e) {
            console.warn('记录历史记录错误', e);
        }
    }

    function renderHomeItem(indexInGroup = 0, groupIndex = _homeState.currentGroupIndex) {
        const wrapper = document.getElementById('immersive-wrapper');
        const position = setCurrentHomeItem(indexInGroup, groupIndex);
        const itemRecord = position.item;
        if (!wrapper || !itemRecord) return;
        
        logFeedItemReadingRecord(itemRecord);

        _homeState.view = 'item';
        clearHomeTranslations();
        wrapper.classList.add('zh-has-top-nav');
        wrapper.classList.remove('zh-home-wide');
        wrapper.innerHTML = '';
        appendHomeHeader(wrapper);

        syncHomeItemsFromGroups();
        const totalItems = _homeState.items.length;
        const globalIndex = position.globalIndex;

        const toolbar = document.createElement('div');
        toolbar.className = 'zh-question-toolbar zh-reader-top-nav';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'zh-inline-btn';
        prevBtn.textContent = '‹ 上一篇';
        prevBtn.disabled = globalIndex <= 0;
        prevBtn.style.opacity = prevBtn.disabled ? '0.35' : '1';
        prevBtn.addEventListener('click', () => navigateHomeItem(-1));
        toolbar.appendChild(prevBtn);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'zh-inline-btn';
        nextBtn.textContent = '下一篇 ›';
        nextBtn.disabled = globalIndex >= totalItems - 1;
        nextBtn.style.opacity = nextBtn.disabled ? '0.35' : '1';
        nextBtn.addEventListener('click', () => navigateHomeItem(1));
        toolbar.appendChild(nextBtn);

        const backBtn = document.createElement('button');
        backBtn.className = 'zh-inline-btn';
        backBtn.textContent = '返回列表';
        backBtn.addEventListener('click', renderHomeList);
        toolbar.appendChild(backBtn);

        const current = document.createElement('span');
        current.className = 'zh-nav-current';
        current.textContent = `${globalIndex + 1} / ${totalItems}`;
        toolbar.appendChild(current);

        const toreadBtn = document.createElement('button');
        toreadBtn.className = 'zh-inline-btn zh-toread-btn' + (isInToReadList(itemRecord.url || itemRecord.key) ? ' zh-btn-active' : '');
        toreadBtn.title = '加入/移除待读列表';
        toreadBtn.innerHTML = ICONS.toread;
        toreadBtn.addEventListener('click', () => toggleToReadItem(itemRecord, toreadBtn));
        toolbar.appendChild(toreadBtn);

        wrapper.appendChild(toolbar);

        const view = document.createElement('div');
        view.className = 'zh-home-card-view zh-page-enter';
        if (!mountLiveNode(itemRecord.liveNode, view)) {
            view.appendChild(cleanupHomeClone(itemRecord.clone.cloneNode(true)));
        }
        wrapper.appendChild(view);

        if (itemRecord.apiTargetId) {
            const slot = view.querySelector('.zh-api-action-slot');
            if (slot) slot.replaceWith(buildActionBar(itemRecord));
        }

        setupImageToggles();
        startArticleAdCleanup();
        window.scrollTo(0, 0);
    }


    function findOriginalHomeElement(itemRecord) {
        if (!itemRecord?.key) return null;
        return getHomeFeedItems().find((item, index) => getHomeItemKey(item, index) === itemRecord.key) || null;
    }

    function restoreHomeItemPosition() {
        if (!isHomePage() || _homeState.view !== 'item') return;
        const itemRecord = _homeState.items[_homeState.currentIndex];
        const original = findOriginalHomeElement(itemRecord);
        if (original) {
            original.scrollIntoView({ block: 'start' });
            return;
        }

        const targetTop = Number.isFinite(_homeState.exitScrollY)
            ? _homeState.exitScrollY
            : itemRecord?.sourceTop;
        if (Number.isFinite(targetTop)) {
            const maxSafeTop = Math.max(0, getDocumentHeight() - window.innerHeight - 80);
            const safeTop = Math.max(0, Math.min(targetTop, maxSafeTop));
            window.scrollTo(0, safeTop);
            setTimeout(() => window.scrollTo(0, safeTop), 120);
        }
    }


    async function enterHomeImmersive() {
        if (!isHomePage()) return alert('阁下，此版本只适配知乎首页。');
        _homeState.originalScrollY = window.scrollY;
        _homeState.collecting = true;
        applyTheme(currentThemeIndex);

        try {
            const wrapper = buildHomeWrapper();
            const status = showCollectOverlay('正在等待首页推荐流...');
            await waitForElement('#TopstoryContent');

            const cacheKey = getHomeCacheKey();
            const cached = _homeFeedCache.get(cacheKey);
            if (cached?.schemaVersion === 2 && Array.isArray(cached.groups) && cached.groups.length) {
                _homeState.groups = normalizeHomeGroups(cached.groups);
                syncHomeItemsFromGroups();
                _homeState.currentGroupIndex = Math.max(0, Math.min(cached.currentGroupIndex || 0, _homeState.groups.length - 1));
                _homeState.currentIndexInGroup = Math.max(0, Math.min(cached.currentIndexInGroup || 0, (_homeState.groups[_homeState.currentGroupIndex]?.length || 1) - 1));
                _homeState.currentIndex = getHomeGroupStartIndex(_homeState.currentGroupIndex) + _homeState.currentIndexInGroup;
                _homeState.exitScrollY = cached.exitScrollY || _homeState.items[_homeState.currentIndex]?.sourceTop || _homeState.originalScrollY;
                _homeState.exhausted = !!cached.exhausted;
                _homeState.apiNextUrl = cached.apiNextUrl || '';
                _homeState.apiStarted = !!cached.apiStarted;
                status.textContent = `已使用缓存的 ${_homeState.groups.length} 组首页推荐`;
                await sleep(200);
            } else {
                await waitForHomeFeedItems(HOME_BATCH_SIZE, 25000, status);
                const firstGroup = collectHomeFeedItemsFromDOM(status, HOME_BATCH_SIZE, {
                    label: '读取首页预加载推荐'
                });
                if (!firstGroup.length) {
                    status.textContent = '首页推荐卡片暂未加载出来，已保留原页面；稍后可按 Ctrl+E 重新进入沉浸模式。';
                    await sleep(2200);
                    removeCollectOverlay();
                    window._isImmersive = false;
                    return;
                }
                _homeState.groups = firstGroup.length ? [firstGroup] : [];
                syncHomeItemsFromGroups();
                _homeState.currentGroupIndex = 0;
                _homeState.currentIndexInGroup = 0;
                _homeState.currentIndex = 0;
                _homeState.exitScrollY = _homeState.items[0]?.sourceTop || _homeState.originalScrollY;
                persistHomeFeedCache();
            }

            removeCollectOverlay();
            ensureImmersiveStyle();
            hideOriginalPage(wrapper);
            _articleNode = wrapper;
            createQuestionToolsPanel();
            window._isImmersive = true;
            renderHomeList();
        } catch (err) {
            removeCollectOverlay();
            window._isImmersive = false;
            alert(`进入首页沉浸模式失败：${err.message}`);
        } finally {
            _homeState.collecting = false;
        }
    }

    function createPageToReadBtn(url, title, author, type) {
        const cleanUrl = (url || location.href).replace(/#.*$/, '');
        const btn = document.createElement('button');
        btn.className = 'zh-inline-btn zh-toread-btn zh-page-toread-btn' + (isInToReadList(cleanUrl) ? ' zh-btn-active' : '');
        btn.title = '加入/移除待读列表';
        btn.innerHTML = ICONS.toread;
        btn.addEventListener('click', () => {
            const record = {
                url: cleanUrl,
                title: title || document.title || '知乎内容',
                author: author || '',
                type: type || '知乎内容'
            };
            toggleToReadItem(record, btn);
        });
        return btn;
    }


// ═══════════════════════════════════════════════════════════
// 模块: page-follow.js
// ═══════════════════════════════════════════════════════════
    /**
     * ============================================================================
     * 关注动态页 (/follow)：纯 API，跟随 moments paging.next 翻页，推特式时间线
     * moment 是“某人做了某事”的动态，需结合 verb/action_text_tpl/target 分类，
     * 不能只看 target.type。复用 page-home 的 target 解析与卡片构建。
     * ============================================================================
     */
    function getFollowCacheKey() {
        return `${location.origin}/follow::moments`;
    }

    function getFollowInitialApiUrl(limit = FOLLOW_BATCH_SIZE) {
        const url = new URL('/api/v3/moments', location.origin);
        url.searchParams.set('limit', String(limit));
        url.searchParams.set('page_num', '1');
        return url.href;
    }

    function normalizeFollowApiNextUrl(raw) {
        if (!raw) return '';
        try { return new URL(raw, location.origin).href; } catch (err) { return ''; }
    }

    // 取动作文案：优先 action_text_tpl（去掉占位符 {}），回退 action_text
    function getMomentActionText(momentItem) {
        const tpl = (momentItem?.action_text_tpl || '').replace(/\{\}/g, '').trim();
        if (tpl) return tpl;
        const text = (momentItem?.action_text || '').trim();
        // action_text 形如“张三赞同了回答”，把动作部分抽出来（去掉开头的人名近似处理）
        return text;
    }

    // 动作短标签：按 tpl/verb/target.type 顺序判断
    function classifyMomentAction(momentItem) {
        const tpl = momentItem?.action_text_tpl || '';
        const text = momentItem?.action_text || '';
        const verb = momentItem?.verb || '';
        const t = momentItem?.target?.type || '';
        const has = s => tpl.includes(s) || text.includes(s);
        if (has('关注了问题')) return '关注了问题';
        if (has('关注了')) return '关注了';
        if (has('回答了问题') || verb === 'MEMBER_ANSWER_QUESTION') return '回答了问题';
        if (has('赞同了回答') || verb === 'MEMBER_VOTEUP_ANSWER') return '赞同了回答';
        if (has('赞同了文章') || verb === 'MEMBER_VOTEUP_ARTICLE') return '赞同了文章';
        if (has('发布了文章') || verb === 'MEMBER_CREATE_ARTICLE') return '发布了文章';
        if (has('发布了想法') || verb === 'MEMBER_CREATE_PIN') return '发布了想法';
        if (has('赞同了想法') || verb === 'MEMBER_VOTE_PIN') return '赞同了想法';
        if (t === 'question') return '问题';
        if (t === 'pin') return '想法';
        if (t === 'article') return '文章';
        if (t === 'answer') return '回答';
        return '动态';
    }

    // 动态发起者（actor）：moments 顶层通常有 actors / actor
    function getMomentActor(momentItem) {
        const actor = (Array.isArray(momentItem?.actors) ? momentItem.actors[0] : null) || momentItem?.actor || {};
        const tpl = actor.avatar_url_template || actor.avatarUrlTemplate || '';
        const avatar = tpl ? String(tpl).replace('{size}', 'sm').replace('{id}', 'sm') : (actor.avatar_url || actor.avatar || '');
        return { name: (actor.name || '').replace(/\s+/g, ' ').trim(), avatar };
    }

    // pin（想法）的 target 解析（无 title，用正文）
    function getPinContentHTML(target = {}) {
        const blocks = Array.isArray(target.content) ? target.content : [];
        const htmlBlock = blocks.find(b => b && (b.type === 'text' || b.html))?.html;
        return htmlBlock || target.excerpt_title || target.excerpt || '';
    }

    function buildFollowRecord(momentItem, index) {
        const target = momentItem?.target || {};
        const isPin = target.type === 'pin';
        const url = isPin
            ? (target.id ? `https://www.zhihu.com/pin/${target.id}` : '')
            : getWebUrlFromApiTarget(target);
        const title = isPin
            ? (stripHTMLToText(getPinContentHTML(target)).slice(0, 40) || '知乎想法')
            : getHomeApiTargetTitle(target, {});
        const author = getHomeApiTargetAuthor(target, {});
        const primaryContent = isPin ? getPinContentHTML(target) : (target.content || target.detail || '');
        const text = normalizeText(stripHTMLToText(primaryContent || target.excerpt_new || target.excerpt || title) || title);
        const actor = getMomentActor(momentItem);
        const record = {
            key: url || momentItem?.id || `${index}-${title}-${text.slice(0, 60)}`,
            url,
            type: getHomeApiTargetType(target, url),
            actorName: actor.name,
            actorAvatar: actor.avatar,
            actionLabel: classifyMomentAction(momentItem),
            actionText: getMomentActionText(momentItem),
            createdTime: momentItem?.created_time || 0,
            title,
            author,
            authorAvatar: getHomeApiAuthorAvatar(target, {}),
            authorHeadline: getHomeApiAuthorHeadline(target, {}),
            thumbnail: getHomeApiThumbnail(target, {}),
            stats: formatHomeApiStats(target),
            snippet: text.slice(0, 200),
            text,
            clone: null,
            apiTargetType: target.type || '',
            apiTargetId: String(target.id || ''),
            voting: (target.relationship?.voting) ?? 0,
            thanked: !!(target.relationship?.is_thanked),
            liked: false,
            collected: false,
            voteup_count: target.voteup_count ?? 0,
            comment_count: target.comment_count ?? 0,
            thanks_count: target.thanks_count ?? 0,
            favlists_count: target.favlists_count ?? target.favorite_count ?? 0
        };
        record.clone = buildHomeApiClone(record, isPin ? { ...target, content: primaryContent } : target);
        return record;
    }

    // 展开 feed_group，跳过广告，产出扁平 moment 列表
    function flattenMomentItems(momentItems) {
        const out = [];
        (momentItems || []).forEach(item => {
            if (!item || item.type === 'feed_advert') return;
            if (item.type === 'feed_group' && Array.isArray(item.feeds)) {
                item.feeds.forEach(sub => { if (sub && sub.type !== 'feed_advert') out.push(sub); });
            } else {
                out.push(item);
            }
        });
        return out;
    }

    async function fetchFollowMomentsPage(limit = FOLLOW_BATCH_SIZE) {
        const url = _followState.apiNextUrl || getFollowInitialApiUrl(limit);
        const data = await gmFetchJSON(url);
        _followState.apiStarted = true;
        const paging = data?.paging || {};
        _followState.apiNextUrl = normalizeFollowApiNextUrl(paging.next);
        if (paging.is_end || !_followState.apiNextUrl) _followState.exhausted = true;
        return flattenMomentItems(Array.isArray(data?.data) ? data.data : []);
    }

    async function collectFollowMoments(statusEl = null, targetCount = FOLLOW_BATCH_SIZE, options = {}) {
        const records = new Map();
        const existingKeys = new Set(options.existingKeys || []);
        const label = options.label || 'API 加载关注动态';
        const maxPages = options.maxPages || Math.max(4, Math.ceil(targetCount / FOLLOW_BATCH_SIZE) + 4);

        for (let page = 0; page < maxPages && records.size < targetCount && !_followState.exhausted; page++) {
            if (statusEl) statusEl.textContent = `${label} ${Math.min(records.size, targetCount)}/${targetCount}（API 第 ${page + 1} 页）`;
            const momentItems = await fetchFollowMomentsPage(FOLLOW_BATCH_SIZE);
            if (!momentItems.length) { _followState.exhausted = true; break; }
            momentItems.forEach((momentItem, index) => {
                const record = buildFollowRecord(momentItem, index);
                if (record.url && record.text.length >= 1 && !existingKeys.has(record.key) && !records.has(record.key)) {
                    records.set(record.key, record);
                }
            });
        }
        return Array.from(records.values()).slice(0, targetCount);
    }

    function normalizeFollowGroups(groups = _followState.groups) {
        return (Array.isArray(groups) ? groups : [])
            .map(group => (Array.isArray(group) ? group.filter(Boolean).slice(0, FOLLOW_BATCH_SIZE) : []))
            .filter(group => group.length);
    }

    function syncFollowItemsFromGroups() {
        _followState.groups = normalizeFollowGroups(_followState.groups);
        _followState.items = _followState.groups.flat();
        return _followState.items;
    }

    function getFollowGroupStartIndex(groupIndex = _followState.currentGroupIndex) {
        syncFollowItemsFromGroups();
        return _followState.groups.slice(0, Math.max(0, groupIndex)).reduce((sum, group) => sum + group.length, 0);
    }

    function getCurrentFollowGroup() {
        syncFollowItemsFromGroups();
        if (!_followState.groups.length) return [];
        _followState.currentGroupIndex = Math.max(0, Math.min(_followState.currentGroupIndex || 0, _followState.groups.length - 1));
        return _followState.groups[_followState.currentGroupIndex] || [];
    }

    function persistFollowFeedCache() {
        syncFollowItemsFromGroups();
        _followFeedCache.set(getFollowCacheKey(), {
            schemaVersion: 2,
            groups: _followState.groups,
            currentGroupIndex: _followState.currentGroupIndex || 0,
            currentIndexInGroup: _followState.currentIndexInGroup || 0,
            exhausted: _followState.exhausted,
            apiNextUrl: _followState.apiNextUrl,
            apiStarted: _followState.apiStarted
        });
    }

    function getFollowExistingKeys() {
        return new Set(syncFollowItemsFromGroups().map(item => item.key).filter(Boolean));
    }

    function setFollowGroup(groupIndex) {
        syncFollowItemsFromGroups();
        if (!_followState.groups.length) return;
        _followState.currentGroupIndex = Math.max(0, Math.min(groupIndex, _followState.groups.length - 1));
        _followState.currentIndexInGroup = 0;
        _followState.currentIndex = getFollowGroupStartIndex(_followState.currentGroupIndex);
        persistFollowFeedCache();
        renderFollowList();
    }

    async function loadNextFollowGroup(statusEl = null, options = {}) {
        if (_followState.loadingMore || _followState.exhausted) return [];
        _followState.loadingMore = true;
        const batchSize = options.batchSize || FOLLOW_BATCH_SIZE;
        try {
            const batch = await collectFollowMoments(statusEl, batchSize, {
                existingKeys: getFollowExistingKeys(),
                label: options.label || '加载下一组关注动态'
            });
            if (!batch.length) { _followState.exhausted = true; persistFollowFeedCache(); return []; }
            _followState.groups = normalizeFollowGroups(_followState.groups.concat([batch]));
            _followState.currentGroupIndex = _followState.groups.length - 1;
            _followState.currentIndexInGroup = 0;
            _followState.currentIndex = getFollowGroupStartIndex(_followState.currentGroupIndex);
            persistFollowFeedCache();
            return batch;
        } finally {
            _followState.loadingMore = false;
            removeCollectOverlay();
        }
    }

    async function loadMoreFollowAndRender() {
        const wrapper = document.getElementById('immersive-wrapper');
        let status = document.getElementById('zh-follow-load-status');
        if (!status && wrapper) {
            status = document.createElement('div');
            status.id = 'zh-follow-load-status';
            status.className = 'zh-collect-status';
            wrapper.appendChild(status);
        }
        if (status) status.textContent = `正在加载第 ${_followState.groups.length + 1} 组关注动态...`;
        try {
            const batch = await loadNextFollowGroup(status);
            renderFollowList();
            requestAnimationFrame(() => window.scrollTo(0, 0));
            return batch;
        } catch (e) {
            console.error('加载关注动态失败:', e);
            if (status) status.textContent = `加载失败: ${e.message || '网络或数据错误'}`;
            return [];
        }
    }

    function appendFollowHeader(container) {
        const title = document.createElement('h1');
        title.className = 'zh-home-title';
        title.textContent = '知乎关注动态';
        container.appendChild(title);
    }

    // 首页推荐 ↔ 关注动态 分段开关（标题同行，右上角）。activeFeed: 'home' | 'follow'
    function appendFeedSwitchHeader(container, activeFeed) {
        const head = document.createElement('div');
        head.className = 'zh-feed-head';

        const title = document.createElement('h1');
        title.className = 'zh-home-title';
        title.textContent = activeFeed === 'follow' ? '知乎关注动态' : '知乎首页推荐';
        head.appendChild(title);

        const homeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>';
        const followIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><path d="M17 8h4M19 6v4"/></svg>';

        const sw = document.createElement('div');
        sw.className = 'zh-feed-switch';
        const makeSeg = (label, icon, active, onClick) => {
            const btn = document.createElement('button');
            btn.className = 'zh-feed-switch-btn' + (active ? ' is-active' : '');
            btn.innerHTML = `${icon}<span>${label}</span>`;
            if (!active) btn.addEventListener('click', onClick);
            return btn;
        };
        sw.appendChild(makeSeg('首页推荐', homeIcon, activeFeed === 'home', () => switchFollowToHomeInPlace()));
        sw.appendChild(makeSeg('关注动态', followIcon, activeFeed === 'follow', () => switchHomeToFollowInPlace()));
        head.appendChild(sw);

        container.appendChild(head);
    }

    function getFollowLayout() {
        return crossOriginGet('zh-follow-layout') || 'single';
    }

    function setFollowLayout(layout) {
        crossOriginSet('zh-follow-layout', layout);
    }

    function renderFollowGroupToolbar(wrapper) {
        const groups = normalizeFollowGroups(_followState.groups);
        const groupIndex = Math.max(0, Math.min(_followState.currentGroupIndex || 0, Math.max(0, groups.length - 1)));
        const toolbar = document.createElement('div');
        toolbar.className = 'zh-home-toolbar';

        const makeBtn = (label, icon, disabled, handler) => {
            const btn = document.createElement('button');
            btn.className = 'zh-home-nav-btn';
            btn.disabled = disabled;
            btn.innerHTML = `<span class="zh-home-nav-icon">${icon}</span><span>${label}</span>`;
            if (!disabled) btn.addEventListener('click', handler);
            return btn;
        };

        // 切回首页推荐：直接跳转 URL，脚本自动重新加载
        toolbar.appendChild(makeBtn('上一组', '‹', groupIndex <= 0, () => setFollowGroup(groupIndex - 1)));
        const indicator = document.createElement('span');
        indicator.className = 'zh-home-nav-indicator';
        indicator.textContent = `${groups.length ? groupIndex + 1 : 0} / ${groups.length}`;
        toolbar.appendChild(indicator);
        toolbar.appendChild(makeBtn('下一组', '›', groupIndex >= groups.length - 1, () => setFollowGroup(groupIndex + 1)));
        if (!_followState.exhausted) {
            toolbar.appendChild(makeBtn('加载更多', '+', _followState.loadingMore, () => loadMoreFollowAndRender()));
        }

        const layoutBtn = document.createElement('button');
        layoutBtn.className = 'zh-home-nav-btn zh-home-layout-btn';
        layoutBtn.title = '切换单列/双列';
        const isSingle = getFollowLayout() === 'single';
        layoutBtn.innerHTML = isSingle
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="3" width="9" height="8" rx="1"/><rect x="13" y="3" width="9" height="8" rx="1"/><rect x="2" y="13" width="9" height="8" rx="1"/><rect x="13" y="13" width="9" height="8" rx="1"/></svg>'
            : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/></svg>';
        layoutBtn.addEventListener('click', () => {
            setFollowLayout(isSingle ? 'double' : 'single');
            renderFollowList();
        });
        toolbar.appendChild(layoutBtn);

        wrapper.appendChild(toolbar);
    }

    function buildMomentActionLine(itemRecord) {
        const line = document.createElement('div');
        line.className = 'zh-moment-action';
        if (itemRecord.actorAvatar) {
            const av = document.createElement('img');
            av.src = itemRecord.actorAvatar; av.alt = '';
            line.appendChild(av);
        }
        const txt = document.createElement('span');
        const actor = itemRecord.actorName ? `<b>${escapeHTML(itemRecord.actorName)}</b> ` : '';
        const action = escapeHTML(itemRecord.actionText || itemRecord.actionLabel || '');
        txt.innerHTML = `${actor}${action}`;
        line.appendChild(txt);
        const tag = document.createElement('span');
        tag.className = 'zh-moment-verb';
        tag.textContent = itemRecord.actionLabel || '动态';
        line.appendChild(tag);
        return line;
    }

    function renderFollowList() {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return;
        _followState.view = 'list';
        restoreLiveMount();
        clearQuestionTranslations();
        syncFollowItemsFromGroups();
        wrapper.classList.remove('zh-has-top-nav', 'zh-home-wide');
        wrapper.classList.add('zh-follow-wide');
        const isDouble = getFollowLayout() === 'double';
        wrapper.classList.toggle('zh-follow-double', isDouble);
        wrapper.innerHTML = '';
        appendFeedSwitchHeader(wrapper, 'follow');
        renderFollowGroupToolbar(wrapper);

        const group = getCurrentFollowGroup();
        const groupIndex = _followState.currentGroupIndex || 0;
        if (!group.length) {
            const empty = document.createElement('div');
            empty.className = 'zh-collect-status';
            empty.textContent = '没有采集到可展示的关注动态。';
            wrapper.appendChild(empty);
            return;
        }

        const timeline = document.createElement('div');
        timeline.className = 'zh-follow-timeline' + (isDouble ? ' zh-follow-grid' : '');
        group.forEach((itemRecord, index) => {
            const moment = document.createElement('div');
            moment.className = 'zh-moment';
            moment.appendChild(buildMomentActionLine(itemRecord));

            const card = document.createElement('div');
            card.className = 'zh-moment-card';
            const title = document.createElement('div');
            title.className = 'zh-moment-title';
            title.textContent = itemRecord.title || '知乎内容';
            card.appendChild(title);
            if (itemRecord.snippet) {
                const snippet = document.createElement('p');
                snippet.className = 'zh-moment-snippet';
                snippet.textContent = itemRecord.snippet;
                card.appendChild(snippet);
            }
            moment.appendChild(card);
            moment.addEventListener('click', () => renderFollowItem(index, groupIndex));
            timeline.appendChild(moment);
        });
        wrapper.appendChild(timeline);
        setupImageToggles();
        window.scrollTo(0, 0);
    }

    function setCurrentFollowItem(indexInGroup = 0, groupIndex = _followState.currentGroupIndex) {
        syncFollowItemsFromGroups();
        if (!_followState.groups.length) return { item: null, globalIndex: 0 };
        const safeGroupIndex = Math.max(0, Math.min(groupIndex, _followState.groups.length - 1));
        const group = _followState.groups[safeGroupIndex] || [];
        const safeIndex = Math.max(0, Math.min(indexInGroup, Math.max(0, group.length - 1)));
        const item = group[safeIndex] || null;
        const globalIndex = getFollowGroupStartIndex(safeGroupIndex) + safeIndex;
        _followState.currentGroupIndex = safeGroupIndex;
        _followState.currentIndexInGroup = safeIndex;
        _followState.currentIndex = globalIndex;
        persistFollowFeedCache();
        return { item, globalIndex };
    }

    function navigateFollowItem(delta) {
        if (_followState.view !== 'item') return;
        syncFollowItemsFromGroups();
        const totalItems = _followState.items.length;
        const nextGlobal = (_followState.currentIndex || 0) + delta;
        if (nextGlobal < 0 || nextGlobal >= totalItems) return;
        let count = 0;
        for (let g = 0; g < _followState.groups.length; g++) {
            const grp = _followState.groups[g];
            if (nextGlobal < count + grp.length) { renderFollowItem(nextGlobal - count, g); return; }
            count += grp.length;
        }
    }

    function logFollowItemReadingRecord(item) {
        if (!item) return;
        try {
            const url = (item.url || item.key || '').replace(/[?#].*$/, '');
            if (!url) return;
            const title = (item.title || '知乎内容').replace(/\s+-\s+知乎$/, '').replace(/\s+-\s+知乎专栏$/, '');
            const author = item.author || '未知作者';
            const contentKind = item.type || 'article';
            
            addReadingRecord({
                url,
                title,
                author,
                contentKind,
                readAt: new Date().toISOString(),
                manuallyMarked: false,
                wikiCardId: null,
                duration: 0
            }).then(() => {
                console.log('沉浸式阅读：已成功自动保存关注页条目历史', { url, title });
            }).catch(e => {
                console.warn('保存关注页条目历史失败', e);
            });
        } catch (e) {
            console.warn('记录关注页条目历史错误', e);
        }
    }

    function renderFollowItem(indexInGroup = 0, groupIndex = _followState.currentGroupIndex) {
        const wrapper = document.getElementById('immersive-wrapper');
        const position = setCurrentFollowItem(indexInGroup, groupIndex);
        const itemRecord = position.item;
        if (!wrapper || !itemRecord) return;

        logFollowItemReadingRecord(itemRecord);

        _followState.view = 'item';
        clearQuestionTranslations();
        wrapper.classList.add('zh-has-top-nav');
        wrapper.classList.remove('zh-follow-wide', 'zh-follow-double', 'zh-home-wide');
        wrapper.innerHTML = '';
        appendFollowHeader(wrapper);

        syncFollowItemsFromGroups();
        const totalItems = _followState.items.length;
        const globalIndex = position.globalIndex;

        const toolbar = document.createElement('div');
        toolbar.className = 'zh-question-toolbar zh-reader-top-nav';
        const prevBtn = document.createElement('button');
        prevBtn.className = 'zh-inline-btn';
        prevBtn.textContent = '‹ 上一条';
        prevBtn.disabled = globalIndex <= 0;
        prevBtn.style.opacity = prevBtn.disabled ? '0.35' : '1';
        prevBtn.addEventListener('click', () => navigateFollowItem(-1));
        toolbar.appendChild(prevBtn);
        const nextBtn = document.createElement('button');
        nextBtn.className = 'zh-inline-btn';
        nextBtn.textContent = '下一条 ›';
        nextBtn.disabled = globalIndex >= totalItems - 1;
        nextBtn.style.opacity = nextBtn.disabled ? '0.35' : '1';
        nextBtn.addEventListener('click', () => navigateFollowItem(1));
        toolbar.appendChild(nextBtn);
        const backBtn = document.createElement('button');
        backBtn.className = 'zh-inline-btn';
        backBtn.textContent = '返回列表';
        backBtn.addEventListener('click', renderFollowList);
        toolbar.appendChild(backBtn);
        const current = document.createElement('span');
        current.className = 'zh-nav-current';
        current.textContent = `${globalIndex + 1} / ${totalItems}`;
        toolbar.appendChild(current);
        const toreadBtn = document.createElement('button');
        toreadBtn.className = 'zh-inline-btn zh-toread-btn' + (isInToReadList(itemRecord.url || itemRecord.key) ? ' zh-btn-active' : '');
        toreadBtn.title = '加入/移除待读列表';
        toreadBtn.innerHTML = ICONS.toread;
        toreadBtn.addEventListener('click', () => toggleToReadItem(itemRecord, toreadBtn));
        toolbar.appendChild(toreadBtn);
        wrapper.appendChild(toolbar);

        const view = document.createElement('div');
        view.className = 'zh-home-card-view zh-page-enter';
        view.appendChild(buildMomentActionLine(itemRecord));
        view.appendChild(cleanupHomeClone(itemRecord.clone.cloneNode(true)));
        wrapper.appendChild(view);

        if (itemRecord.apiTargetId) {
            const slot = view.querySelector('.zh-api-action-slot');
            if (slot) slot.replaceWith(buildActionBar(itemRecord));
        }
        setupImageToggles();
        startArticleAdCleanup();
        window.scrollTo(0, 0);
    }

    // 载入 follow 数据到 _followState（缓存优先），返回是否有内容
    async function ensureFollowDataLoaded(status) {
        const cached = _followFeedCache.get(getFollowCacheKey());
        if (cached?.schemaVersion === 2 && Array.isArray(cached.groups) && cached.groups.length) {
            _followState.groups = normalizeFollowGroups(cached.groups);
            syncFollowItemsFromGroups();
            _followState.currentGroupIndex = Math.max(0, Math.min(cached.currentGroupIndex || 0, _followState.groups.length - 1));
            _followState.currentIndexInGroup = Math.max(0, Math.min(cached.currentIndexInGroup || 0, (_followState.groups[_followState.currentGroupIndex]?.length || 1) - 1));
            _followState.currentIndex = getFollowGroupStartIndex(_followState.currentGroupIndex) + _followState.currentIndexInGroup;
            _followState.exhausted = !!cached.exhausted;
            _followState.apiNextUrl = cached.apiNextUrl || '';
            _followState.apiStarted = !!cached.apiStarted;
            if (status) status.textContent = `已使用缓存的 ${_followState.groups.length} 组关注动态`;
            await sleep(200);
            return true;
        }
        const firstGroup = await collectFollowMoments(status, FOLLOW_BATCH_SIZE, { label: 'API 加载关注动态' });
        if (!firstGroup.length) return false;
        _followState.groups = [firstGroup];
        syncFollowItemsFromGroups();
        _followState.currentGroupIndex = 0;
        _followState.currentIndexInGroup = 0;
        _followState.currentIndex = 0;
        _followState.view = '';
        persistFollowFeedCache();
        return true;
    }

    // 从首页推荐流就地切到 follow：不跳转 URL，复用已隐藏的原页面与工具栏，API 加载
    async function switchHomeToFollowInPlace() {
        if (_followState.collecting) return;
        if (!document.getElementById('immersive-wrapper')) { location.href = location.origin + '/follow'; return; }
        // 已有数据：直接就地渲染，不弹遮罩、不停顿，保证来回切换丝滑
        if (_followState.groups?.length) { renderFollowList(); return; }
        _followState.collecting = true;
        const status = showCollectOverlay('正在通过 API 加载关注动态...');
        try {
            const ok = await ensureFollowDataLoaded(status);
            removeCollectOverlay();
            if (!ok) { alert('未能通过 API 加载到关注动态（请确认已登录知乎）。'); return; }
            renderFollowList();
        } catch (err) {
            removeCollectOverlay();
            alert(`切换关注动态失败：${err.message}`);
        } finally {
            _followState.collecting = false;
        }
    }

    // 切回首页推荐：若脚本本就在首页(/)（即由首页就地切来），直接就地切回，无需刷新；
    // 否则（真的在 /follow 路由）跳转首页让脚本重新加载。
    function switchFollowToHomeInPlace() {
        if (isHomePage() && document.getElementById('immersive-wrapper') && _homeState.items?.length) {
            renderHomeList();
            return;
        }
        location.href = location.origin + '/';
    }

    async function enterFollowImmersive() {
        if (!isFollowPage()) return alert('阁下，此版本只适配知乎关注动态页 (/follow)。');
        _followState.collecting = true;
        applyTheme(currentThemeIndex);
        try {
            const wrapper = document.createElement('div');
            wrapper.id = 'immersive-wrapper';
            wrapper.className = 'zh-home-wrapper';
            const status = showCollectOverlay('正在通过 API 加载关注动态...');

            const ok = await ensureFollowDataLoaded(status);
            if (!ok) {
                status.textContent = '未能通过 API 加载到关注动态（请确认已登录知乎）；稍后可按 Ctrl+E 重试。';
                await sleep(2400);
                removeCollectOverlay();
                window._isImmersive = false;
                return;
            }

            removeCollectOverlay();
            ensureImmersiveStyle();
            hideOriginalPage(wrapper);
            _articleNode = wrapper;
            createQuestionToolsPanel();
            window._isImmersive = true;
            renderFollowList();
        } catch (err) {
            removeCollectOverlay();
            window._isImmersive = false;
            alert(`进入关注动态沉浸模式失败：${err.message}`);
        } finally {
            _followState.collecting = false;
        }
    }


// ═══════════════════════════════════════════════════════════
// 模块: wiki-store.js
// ═══════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════
    // Wiki Cards IndexedDB 存储
    // ═══════════════════════════════════════════════════════════

    const WIKI_CARDS_DB_NAME = 'zh-wiki-cards-db';
    const WIKI_CARDS_DB_VERSION = 3;
    const WIKI_CARDS_STORE = 'cards';
    const WIKI_TAGS_STORE = 'tags';
    const READING_RECORDS_STORE = 'reading_records';

    let _wikiCardsDbInstance = null;

    function openWikiCardsDB() {
        if (_wikiCardsDbInstance) return Promise.resolve(_wikiCardsDbInstance);
        return new Promise((resolve, reject) => {
            let completed = false;
            const timeoutId = setTimeout(() => {
                if (!completed) {
                    completed = true;
                    reject(new Error('打开 IndexedDB 数据库超时 (5秒)，可能是浏览器数据库锁死。建议刷新页面重试。'));
                }
            }, 5000);

            let request;
            try {
                request = indexedDB.open(WIKI_CARDS_DB_NAME, WIKI_CARDS_DB_VERSION);
            } catch (err) {
                clearTimeout(timeoutId);
                reject(new Error('无法发起 IndexedDB 打开请求: ' + err.message));
                return;
            }
            
            request.onblocked = function() {
                if (!completed) {
                    completed = true;
                    clearTimeout(timeoutId);
                    reject(new Error('IndexedDB 被阻塞，请关闭其他标签页并重试'));
                }
            };

            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(WIKI_CARDS_STORE)) {
                    const cardStore = db.createObjectStore(WIKI_CARDS_STORE, { keyPath: 'id' });
                    cardStore.createIndex('batchId', 'batchId', { unique: false });
                    cardStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                if (!db.objectStoreNames.contains(WIKI_TAGS_STORE)) {
                    db.createObjectStore(WIKI_TAGS_STORE, { keyPath: 'tag' });
                }
                if (!db.objectStoreNames.contains(READING_RECORDS_STORE)) {
                    const recordStore = db.createObjectStore(READING_RECORDS_STORE, { keyPath: 'url' });
                    recordStore.createIndex('readAt', 'readAt', { unique: false });
                }
            };
            request.onsuccess = function(event) {
                if (!completed) {
                    completed = true;
                    clearTimeout(timeoutId);
                    _wikiCardsDbInstance = event.target.result;
                    _wikiCardsDbInstance.onversionchange = function() {
                        if (_wikiCardsDbInstance) {
                            _wikiCardsDbInstance.close();
                            _wikiCardsDbInstance = null;
                        }
                        console.log('检测到数据库版本变更，已主动断开旧版数据库连接。');
                    };
                    resolve(_wikiCardsDbInstance);
                }
            };
            request.onerror = function(event) {
                if (!completed) {
                    completed = true;
                    clearTimeout(timeoutId);
                    reject(new Error('Wiki IndexedDB 打开失败: ' + (event.target.error?.message || '未知错误')));
                }
            };
        });
    }

    function generateWikiCardId() {
        return `wc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    async function saveWikiCard(card) {
        const db = await openWikiCardsDB();
        const cardToSave = {
            ...card,
            id: card.id || generateWikiCardId(),
            createdAt: card.createdAt || new Date().toISOString()
        };
        return new Promise((resolve, reject) => {
            const tx = db.transaction([WIKI_CARDS_STORE, WIKI_TAGS_STORE], 'readwrite');
            tx.objectStore(WIKI_CARDS_STORE).put(cardToSave);
            // Update tags store
            const tags = Array.isArray(cardToSave.tags) ? cardToSave.tags : [];
            const tagStore = tx.objectStore(WIKI_TAGS_STORE);
            tags.forEach(tag => {
                const getReq = tagStore.get(tag);
                getReq.onsuccess = function() {
                    const existing = getReq.result || { tag, cardIds: [], count: 0 };
                    if (!existing.cardIds.includes(cardToSave.id)) {
                        existing.cardIds.push(cardToSave.id);
                        existing.count = existing.cardIds.length;
                    }
                    tagStore.put(existing);
                };
            });
            tx.oncomplete = () => resolve(cardToSave);
            tx.onerror = () => reject(new Error('保存 Wiki 卡片失败'));
        });
    }

    async function saveWikiCards(cards) {
        const results = [];
        for (const card of cards) {
            const saved = await saveWikiCard(card);
            results.push(saved);
        }
        return results;
    }

    async function getAllWikiCards() {
        const db = await openWikiCardsDB();
        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(WIKI_CARDS_STORE, 'readonly');
                const request = tx.objectStore(WIKI_CARDS_STORE).getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(new Error('读取 Wiki 卡片失败'));
            } catch (err) {
                reject(err);
            }
        });
    }

    async function getWikiCardsByTag(tag) {
        const db = await openWikiCardsDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([WIKI_TAGS_STORE, WIKI_CARDS_STORE], 'readonly');
            const tagReq = tx.objectStore(WIKI_TAGS_STORE).get(tag);
            tagReq.onsuccess = function() {
                const tagRecord = tagReq.result;
                if (!tagRecord || !tagRecord.cardIds?.length) {
                    resolve([]);
                    return;
                }
                const cardStore = tx.objectStore(WIKI_CARDS_STORE);
                const cards = [];
                let pending = tagRecord.cardIds.length;
                tagRecord.cardIds.forEach(id => {
                    const cardReq = cardStore.get(id);
                    cardReq.onsuccess = () => {
                        if (cardReq.result) cards.push(cardReq.result);
                        if (--pending === 0) resolve(cards);
                    };
                    cardReq.onerror = () => {
                        if (--pending === 0) resolve(cards);
                    };
                });
            };
            tagReq.onerror = () => reject(new Error('按标签查询失败'));
        });
    }

    async function getAllTags() {
        const db = await openWikiCardsDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(WIKI_TAGS_STORE, 'readonly');
            const request = tx.objectStore(WIKI_TAGS_STORE).getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(new Error('读取标签失败'));
        });
    }

    async function deleteWikiCard(id) {
        const db = await openWikiCardsDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([WIKI_CARDS_STORE, WIKI_TAGS_STORE], 'readwrite');
            const cardStore = tx.objectStore(WIKI_CARDS_STORE);
            const getReq = cardStore.get(id);
            getReq.onsuccess = function() {
                const card = getReq.result;
                cardStore.delete(id);
                if (card && Array.isArray(card.tags)) {
                    const tagStore = tx.objectStore(WIKI_TAGS_STORE);
                    card.tags.forEach(tag => {
                        const tagReq = tagStore.get(tag);
                        tagReq.onsuccess = function() {
                            const tagRecord = tagReq.result;
                            if (tagRecord) {
                                tagRecord.cardIds = tagRecord.cardIds.filter(cid => cid !== id);
                                tagRecord.count = tagRecord.cardIds.length;
                                if (tagRecord.count === 0) tagStore.delete(tag);
                                else tagStore.put(tagRecord);
                            }
                        };
                    });
                }
            };
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(new Error('删除 Wiki 卡片失败'));
        });
    }

    async function clearAllWikiCards() {
        const db = await openWikiCardsDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([WIKI_CARDS_STORE, WIKI_TAGS_STORE], 'readwrite');
            tx.objectStore(WIKI_CARDS_STORE).clear();
            tx.objectStore(WIKI_TAGS_STORE).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(new Error('清空 Wiki 卡片库失败'));
        });
    }

    async function clearAllCardEmbeddings() {
        const db = await openWikiCardsDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(WIKI_CARDS_STORE, 'readwrite');
            const store = tx.objectStore(WIKI_CARDS_STORE);
            let cleared = 0;
            store.openCursor().onsuccess = (e) => {
                const cursor = e.target.result;
                if (!cursor) return;
                const card = cursor.value;
                if (card && card.embedding) {
                    delete card.embedding;
                    cursor.update(card);
                    cleared++;
                }
                cursor.continue();
            };
            tx.oncomplete = () => resolve(cleared);
            tx.onerror = () => reject(new Error('清空向量字段失败'));
        });
    }

    function cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dot += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom === 0 ? 0 : dot / denom;
    }

    async function searchByEmbedding(queryVector, topK = 10) {
        const allCards = await getAllWikiCards();
        const scored = allCards
            .filter(card => card.embedding && card.embedding.length > 0)
            .map(card => ({
                card,
                score: cosineSimilarity(queryVector, card.embedding)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
        return scored;
    }

    const READING_RECORDS_GM_KEY = 'zh-immersive-reading-records-v1';
    const READING_RECORDS_GM_MAX = 500;

    function _gmLoadReadingRecords() {
        try {
            if (typeof GM_getValue === 'function') {
                const raw = GM_getValue(READING_RECORDS_GM_KEY, null);
                if (raw) return JSON.parse(raw);
            }
        } catch (e) {}
        return [];
    }

    function _gmSaveReadingRecords(records) {
        try {
            if (typeof GM_setValue === 'function') {
                const trimmed = records.slice(0, READING_RECORDS_GM_MAX);
                GM_setValue(READING_RECORDS_GM_KEY, JSON.stringify(trimmed));
            }
        } catch (e) {}
    }

    function _gmPushReadingRecord(record) {
        const records = _gmLoadReadingRecords();
        const idx = records.findIndex(r => r.url === record.url);
        if (idx >= 0) records.splice(idx, 1);
        records.unshift(record);
        _gmSaveReadingRecords(records);
    }

    async function addReadingRecord(record) {
        const db = await openWikiCardsDB();
        const recordToSave = {
            ...record,
            readAt: record.readAt || new Date().toISOString()
        };
        _gmPushReadingRecord(recordToSave);
        return new Promise((resolve, reject) => {
            const tx = db.transaction(READING_RECORDS_STORE, 'readwrite');
            tx.objectStore(READING_RECORDS_STORE).put(recordToSave);
            tx.oncomplete = () => resolve(recordToSave);
            tx.onerror = () => reject(new Error('保存阅读历史失败'));
        });
    }

    async function updateReadingProgress(url, progress) {
        const db = await openWikiCardsDB();
        const next = Math.max(0, Math.min(100, Math.round(progress)));
        return new Promise((resolve, reject) => {
            const tx = db.transaction(READING_RECORDS_STORE, 'readwrite');
            const store = tx.objectStore(READING_RECORDS_STORE);
            const getReq = store.get(url);
            getReq.onsuccess = () => {
                const existing = getReq.result;
                if (!existing) { resolve(); return; }
                if (next <= (existing.progress || 0)) { resolve(); return; }
                existing.progress = next;
                store.put(existing);
                _gmPushReadingRecord(existing);
            };
            getReq.onerror = () => reject(new Error('读取阅读记录失败'));
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(new Error('更新阅读进度失败'));
        });
    }

    async function getAllReadingRecords() {
        const db = await openWikiCardsDB();
        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(READING_RECORDS_STORE, 'readwrite');
                const store = tx.objectStore(READING_RECORDS_STORE);
                const req = store.getAll();
                req.onsuccess = () => {
                    try {
                        const local = req.result || [];
                        const localMap = new Map(local.map(r => [r.url, r]));
                        const gmRecords = _gmLoadReadingRecords();
                        let merged = false;
                        for (const gr of gmRecords) {
                            if (!gr.url) continue;
                            if (!localMap.has(gr.url)) {
                                store.put(gr);
                                localMap.set(gr.url, gr);
                                merged = true;
                            } else {
                                const existing = localMap.get(gr.url);
                                if ((gr.progress || 0) > (existing.progress || 0)) {
                                    const updated = { ...existing, progress: gr.progress };
                                    store.put(updated);
                                    localMap.set(gr.url, updated);
                                    merged = true;
                                }
                            }
                        }
                        const results = Array.from(localMap.values());
                        results.sort((a, b) => {
                            const dateA = a && a.readAt ? String(a.readAt) : '';
                            const dateB = b && b.readAt ? String(b.readAt) : '';
                            return dateB.localeCompare(dateA);
                        });
                        if (merged) _gmSaveReadingRecords(results.slice(0, READING_RECORDS_GM_MAX));
                        resolve(results);
                    } catch (sortErr) {
                        console.error('排序阅读历史失败:', sortErr);
                        resolve(req.result || []);
                    }
                };
                req.onerror = () => reject(new Error('读取阅读历史失败'));
            } catch (err) {
                reject(err);
            }
        });
    }

    async function deleteReadingRecord(url) {
        const db = await openWikiCardsDB();
        const gmRecords = _gmLoadReadingRecords().filter(r => r.url !== url);
        _gmSaveReadingRecords(gmRecords);
        return new Promise((resolve, reject) => {
            const tx = db.transaction(READING_RECORDS_STORE, 'readwrite');
            tx.objectStore(READING_RECORDS_STORE).delete(url);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(new Error('删除阅读历史失败'));
        });
    }

    async function clearAllReadingRecords() {
        const db = await openWikiCardsDB();
        _gmSaveReadingRecords([]);
        return new Promise((resolve, reject) => {
            const tx = db.transaction(READING_RECORDS_STORE, 'readwrite');
            tx.objectStore(READING_RECORDS_STORE).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(new Error('清空阅读历史失败'));
        });
    }


// ═══════════════════════════════════════════════════════════
// 模块: wiki.js
// ═══════════════════════════════════════════════════════════
    function createWikiRunConfig() {
        return {
            apiHost: config.apiHost || '',
            apiModel: config.apiModel || '',
            apiKey: config.apiKey || '',
            wikiMaxItems: Number.isFinite(Number(config.wikiMaxItems)) ? Math.max(1, Number(config.wikiMaxItems)) : 100,
            wikiConcurrency: Number.isFinite(Number(config.wikiConcurrency)) ? Math.max(0, Number(config.wikiConcurrency)) : 20,
            wikiRpm: Number.isFinite(Number(config.wikiRpm)) ? Math.max(0, Number(config.wikiRpm)) : 300,
            wikiFinalSynthesis: config.wikiFinalSynthesis !== false
        };
    }

    function getWikiRunConfig() {
        return wikiState.runConfig || createWikiRunConfig();
    }

    function getWikiLimit(name, fallback, runConfig = getWikiRunConfig()) {
        const value = Number(runConfig?.[name]);
        return Number.isFinite(value) ? Math.max(0, value) : fallback;
    }

    function createWikiRunId(date = new Date()) {
        return `wiki-${date.getTime()}-${Math.random().toString(16).slice(2, 8)}`;
    }

    function formatWikiTime(value = new Date()) {
        const date = value instanceof Date ? value : new Date(value);
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
    }

    function loadWikiHistory() {
        try {
            const raw = crossOriginGet(WIKI_HISTORY_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(parsed)) return [];
            const now = new Date().toISOString();
            return parsed.map(record => {
                if (record?.status !== 'running') return record;
                return {
                    ...record,
                    status: 'interrupted',
                    finishedAt: record.finishedAt || now,
                    progressMessage: `页面刷新或脚本重载前中断：${record.progressMessage || record.phase || '未知阶段'}`
                };
            });
        } catch (err) {
            console.warn('知乎沉浸式阅读：Wiki 历史读取失败', err);
            return [];
        }
    }

    function saveWikiHistory(history = wikiState.history) {
        let records = (Array.isArray(history) ? history : [])
            .slice(0, WIKI_HISTORY_MAX)
            .map(record => ({
                ...record,
                log: Array.isArray(record.log) ? record.log.slice(-260) : []
            }));

        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const json = JSON.stringify(records);
                crossOriginSet(WIKI_HISTORY_KEY, json);
                wikiState.history = records;
                return true;
            } catch (err) {
                if (records.length > 4) {
                    records = records.slice(0, Math.max(4, records.length - 3));
                } else {
                    records = records.map((record, index) => {
                        if (index === 0) return record;
                        return {
                            ...record,
                            markdown: record.markdown ? `${String(record.markdown).slice(0, 2000)}\n\n> 历史记录过大，此条 Markdown 已截断。` : ''
                        };
                    });
                }
            }
        }
        return false;
    }

    function ensureWikiHistory() {
        if (!Array.isArray(wikiState.history) || !wikiState.history.length) {
            wikiState.history = loadWikiHistory();
        }
        return wikiState.history;
    }

    function deleteWikiHistoryRecord(runId) {
        ensureWikiHistory();
        wikiState.history = wikiState.history.filter(r => r.runId !== runId);
        saveWikiHistory(wikiState.history);
    }

    function clearAllWikiHistory() {
        wikiState.history = [];
        saveWikiHistory([]);
    }

    function upsertWikiHistoryRecord(patch) {
        ensureWikiHistory();
        const runId = patch.runId || wikiState.runId;
        if (!runId) return null;
        const existingIndex = wikiState.history.findIndex(record => record.runId === runId);
        const existing = existingIndex >= 0 ? wikiState.history[existingIndex] : {};
        const next = {
            ...existing,
            ...patch,
            runId,
            updatedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) wikiState.history.splice(existingIndex, 1);
        wikiState.history.unshift(next);
        wikiState.history = wikiState.history.slice(0, WIKI_HISTORY_MAX);
        saveWikiHistory(wikiState.history);
        return next;
    }

    function recordWikiProgress(message, phase = '') {
        wikiState.progressMessage = message;
        wikiState.phase = phase || wikiState.phase;
        const entry = {
            time: new Date().toISOString(),
            phase: phase || wikiState.phase || 'running',
            message
        };
        wikiState.log = Array.isArray(wikiState.log) ? wikiState.log.concat(entry).slice(-260) : [entry];
        console.info(`[Zhihu Wiki] ${message}`);

        if (wikiState.runId) {
            upsertWikiHistoryRecord({
                status: wikiState.running ? (wikiState.paused ? 'paused' : 'running') : (wikiState.finished ? 'finished' : 'pending'),
                startedAt: wikiState.startedAt ? wikiState.startedAt.toISOString?.() || wikiState.startedAt : '',
                finishedAt: wikiState.finishedAt ? wikiState.finishedAt.toISOString?.() || wikiState.finishedAt : '',
                phase: wikiState.phase,
                progressMessage: message,
                itemCount: wikiState.items.length || 0,
                errorCount: wikiState.errors.length || 0,
                log: wikiState.log,
                runConfigSnapshot: wikiState.runConfig || null
            });
        }

        const logEl = document.getElementById('zh-wiki-live-log');
        if (logEl) logEl.textContent = wikiState.log.map(log => `[${formatWikiTime(log.time)}] ${log.message}`).join('\n');
    }

    function finishWikiHistoryRecord(status, extra = {}) {
        wikiState.finishedAt = new Date();
        upsertWikiHistoryRecord({
            status,
            finishedAt: wikiState.finishedAt.toISOString(),
            phase: extra.phase || wikiState.phase || status,
            progressMessage: extra.progressMessage || wikiState.progressMessage || '',
            itemCount: wikiState.items.length || 0,
            errorCount: wikiState.errors.length || 0,
            errors: wikiState.errors.slice(-20),
            log: wikiState.log,
            markdown: extra.markdown || wikiState.markdown || '',
            runConfigSnapshot: wikiState.runConfig || null
        });
    }

    function setOriginalPageVisibleForWiki(visible) {
        document.querySelectorAll('.zh-hidden-by-immersive').forEach(child => {
            child.style.display = visible ? (child.dataset.origDisplay || '') : 'none';
        });
    }

    function updateWikiProgress(message, phase = '') {
        recordWikiProgress(message, phase);
        const text = `信息流 Wiki：${message}`;
        const el = document.getElementById('zh-wiki-progress');
        if (el) el.textContent = text;
        showCollectOverlay(text);
    }

    function setWikiPaused(paused) {
        if (!wikiState.running) return;
        wikiState.paused = !!paused;
        const msg = wikiState.paused
            ? '已暂停调度；已发出的请求会继续完成，新的请求会等待恢复。'
            : '已恢复调度，继续发起剩余请求。';
        updateWikiProgress(msg, wikiState.phase || 'running');
        renderWikiDashboard();
    }

    async function waitWhileWikiPaused() {
        while (wikiState.running && wikiState.paused) {
            await sleep(500);
        }
    }

    async function runLimited(tasks, options = {}) {
        const concurrency = Number(options.concurrency) > 0 ? Number(options.concurrency) : tasks.length || 1;
        const rpm = Number(options.rpm) > 0 ? Number(options.rpm) : 0;
        const interval = rpm > 0 ? Math.ceil(60000 / rpm) : 0;
        const results = new Array(tasks.length);
        let nextIndex = 0;
        let completed = 0;
        let started = 0;
        let nextStartAt = Date.now();

        async function waitForStartSlot() {
            if (!interval) return;
            const now = Date.now();
            const wait = Math.max(0, nextStartAt - now);
            nextStartAt = Math.max(nextStartAt, now) + interval;
            if (wait > 0) await sleep(wait);
        }

        const workers = Array.from({ length: Math.min(concurrency, tasks.length || 1) }, async () => {
            while (nextIndex < tasks.length) {
                if (options.pauseable !== false) await waitWhileWikiPaused();
                const currentIndex = nextIndex++;
                await waitForStartSlot();
                if (options.pauseable !== false) await waitWhileWikiPaused();
                started++;
                if (typeof options.onStart === 'function') options.onStart(started, tasks.length, currentIndex);
                try {
                    results[currentIndex] = await tasks[currentIndex]();
                } catch (err) {
                    results[currentIndex] = { error: err };
                } finally {
                    completed++;
                    if (typeof options.onProgress === 'function') options.onProgress(completed, tasks.length, currentIndex);
                }
            }
        });

        await Promise.all(workers);
        return results;
    }

    function getUserscriptXHR() {
        if (typeof GM_xmlhttpRequest === 'function') return GM_xmlhttpRequest;
        if (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function') return GM.xmlHttpRequest.bind(GM);
        return null;
    }

    function gmFetchText(url) {
        return new Promise((resolve, reject) => {
            if (!url) return reject(new Error('缺少 URL'));

            const xhr = getUserscriptXHR();
            if (xhr) {
                xhr({
                    method: 'GET',
                    url,
                    timeout: 20000,
                    anonymous: false,
                    responseType: 'text',
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Cache-Control': 'no-cache'
                    },
                    onload: res => {
                        if (res.status >= 200 && res.status < 300) resolve(res.responseText || '');
                        else reject(new Error(`HTTP ${res.status}`));
                    },
                    onerror: err => reject(new Error(`GM 跨域抓取失败：${err?.error || err?.message || '未知错误'}`)),
                    ontimeout: () => reject(new Error('页面抓取超时'))
                });
                return;
            }

            fetch(url, { credentials: 'include' })
                .then(res => res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`)))
                .then(resolve)
                .catch(err => reject(new Error(`原生 fetch 跨域失败：${err.message || err}`)));
        });
    }

    function gmFetchJSON(url) {
        return new Promise((resolve, reject) => {
            if (!url) return reject(new Error('缺少 URL'));

            const xhr = getUserscriptXHR();
            if (xhr) {
                xhr({
                    method: 'GET',
                    url,
                    timeout: 20000,
                    anonymous: false,
                    responseType: 'json',
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Cache-Control': 'no-cache'
                    },
                    onload: res => {
                        if (res.status < 200 || res.status >= 300) {
                            reject(new Error(`HTTP ${res.status}`));
                            return;
                        }
                        if (res.response && typeof res.response === 'object') {
                            resolve(res.response);
                            return;
                        }
                        try {
                            resolve(JSON.parse(res.responseText || '{}'));
                        } catch (err) {
                            reject(new Error(`JSON 解析失败：${err.message}`));
                        }
                    },
                    onerror: err => reject(new Error(`GM API 请求失败：${err?.error || err?.message || '未知错误'}`)),
                    ontimeout: () => reject(new Error('API 请求超时'))
                });
                return;
            }

            fetch(url, {
                credentials: 'include',
                headers: { 'Accept': 'application/json, text/plain, */*' }
            })
                .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
                .then(resolve)
                .catch(err => reject(new Error(`原生 fetch API 请求失败：${err.message || err}`)));
        });
    }

    function getNodeText(root, selector) {
        const node = root.querySelector(selector);
        return node ? normalizeText(node.textContent || '') : '';
    }

    function getNodesText(root, selector, limit = 6) {
        return Array.from(root.querySelectorAll(selector))
            .slice(0, limit)
            .map(node => normalizeText(node.textContent || ''))
            .filter(Boolean)
            .join('\n\n');
    }

    function normalizeText(text) {
        return String(text || '')
            .replace(/\u200b/g, '')
            .replace(/\r/g, '\n')
            .replace(/[ \t\f\v]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function stripHTMLToText(html) {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(String(html), 'text/html');
        doc.querySelectorAll('script, style, noscript').forEach(el => el.remove());
        return normalizeText(doc.body?.textContent || doc.documentElement?.textContent || html);
    }

    function parseJSONLoose(text) {
        const raw = String(text || '').trim();
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (err) {
            const match = raw.match(/\{[\s\S]*\}/);
            if (!match) return null;
            try { return JSON.parse(match[0]); } catch (innerErr) { return null; }
        }
    }

    function getZhihuInitialState(doc) {
        const candidates = [
            doc.querySelector('#js-initialData')?.textContent,
            doc.querySelector('script[type="application/json"]')?.textContent,
            ...Array.from(doc.querySelectorAll('script')).map(script => script.textContent || '').filter(text => /initialState|entities|answers|articles|questions/.test(text))
        ].filter(Boolean);

        for (const text of candidates) {
            const parsed = parseJSONLoose(text);
            const state = parsed?.initialState || parsed?.props?.pageProps?.initialState || parsed;
            if (state?.entities) return state;
        }
        return null;
    }

    function getEntityList(initialState, name) {
        const values = initialState?.entities?.[name];
        return values && typeof values === 'object' ? Object.values(values) : [];
    }

    function getUrlIds(url) {
        return {
            questionId: url.match(/\/question\/(\d+)/)?.[1] || '',
            answerId: url.match(/\/answer\/(\d+)/)?.[1] || '',
            articleId: url.match(/\/p\/(\d+)/)?.[1] || ''
        };
    }

    function pickEntityById(list, id) {
        if (!id) return list[0] || null;
        return list.find(item => String(item?.id || item?.token || item?.url || '').includes(id)) || list[0] || null;
    }

    function getWikiContentKind(url) {
        if (/\/p\//.test(url)) return 'post';
        if (/\/question\/\d+\/answer\//.test(url)) return 'answer';
        if (/\/question\//.test(url)) return 'question';
        return 'unknown';
    }

    function extractWikiContentFromHTML(html, url, fallbackTitle = '') {
        const doc = new DOMParser().parseFromString(html || '', 'text/html');
        const kind = getWikiContentKind(url);
        const ids = getUrlIds(url);
        const initialState = getZhihuInitialState(doc);
        doc.querySelectorAll('script, style, noscript').forEach(el => el.remove());
        const questionEntity = pickEntityById(getEntityList(initialState, 'questions'), ids.questionId);
        const answerEntity = pickEntityById(getEntityList(initialState, 'answers'), ids.answerId);
        const articleEntity = pickEntityById(getEntityList(initialState, 'articles'), ids.articleId);

        const title = getNodeText(doc, 'h1.QuestionHeader-title')
            || getNodeText(doc, '.Post-Title')
            || getNodeText(doc, '.ContentItem-title')
            || getNodeText(doc, 'h1')
            || stripHTMLToText(articleEntity?.title)
            || stripHTMLToText(questionEntity?.title)
            || fallbackTitle;

        const questionDetail = getNodeText(doc, '.QuestionRichText.QuestionRichText--expandable')
            || getNodeText(doc, '.QuestionRichText')
            || stripHTMLToText(questionEntity?.detail)
            || stripHTMLToText(questionEntity?.excerpt);

        const questionTitle = stripHTMLToText(questionEntity?.title) || (kind === 'answer' || kind === 'question' ? title : '');

        let articleText = '';
        let answerText = '';
        let questionAnswersText = '';
        if (kind === 'post') {
            articleText = stripHTMLToText(articleEntity?.content)
                || stripHTMLToText(articleEntity?.excerpt)
                || getNodeText(doc, '.Post-Main .RichText')
                || getNodeText(doc, '.Post-RichTextContainer')
                || getNodeText(doc, '.Post-Main');
        } else if (kind === 'answer') {
            answerText = stripHTMLToText(answerEntity?.content)
                || stripHTMLToText(answerEntity?.excerpt)
                || getNodeText(doc, '.QuestionAnswer-content .RichText')
                || getNodeText(doc, '.QuestionAnswer-content')
                || getNodeText(doc, '.AnswerItem .RichText')
                || getNodeText(doc, '.AnswerItem');
        } else if (kind === 'question') {
            questionAnswersText = getNodesText(doc, '.AnswerItem .RichText, .AnswerItem', 3)
                || getEntityList(initialState, 'answers').slice(0, 3).map(answer => stripHTMLToText(answer?.content || answer?.excerpt)).filter(Boolean).join('\n\n');
        } else {
            articleText = getNodeText(doc, '.RichText')
                || getNodeText(doc, '.RichContent-inner')
                || getNodeText(doc, 'article')
                || getNodeText(doc, 'body');
        }

        const textParts = [];
        if (kind === 'answer') {
            textParts.push(`【原问题】\n${questionTitle || title || fallbackTitle}`);
            if (questionDetail) textParts.push(`【问题补充】\n${questionDetail}`);
            if (answerText) textParts.push(`【单个回答正文】\n${answerText}`);
        } else if (kind === 'question') {
            textParts.push(`【问题】\n${questionTitle || title || fallbackTitle}`);
            if (questionDetail) textParts.push(`【问题补充】\n${questionDetail}`);
            if (questionAnswersText) textParts.push(`【页面回答摘录】\n${questionAnswersText}`);
        } else if (kind === 'post') {
            textParts.push(`【文章标题】\n${title || fallbackTitle}`);
            if (articleText) textParts.push(`【文章正文】\n${articleText}`);
        } else {
            textParts.push([title, articleText].filter(Boolean).join('\n\n'));
        }

        const text = normalizeText(textParts.filter(Boolean).join('\n\n'));
        return {
            contentKind: kind,
            title: title || fallbackTitle,
            questionTitle,
            questionDetail,
            answerText,
            articleText,
            questionAnswersText,
            text,
            extractedLength: text.length
        };
    }

    function hasEnoughWikiStructuredContent(structured) {
        if (!structured) return false;
        const kind = structured.contentKind || 'unknown';
        if (kind === 'answer') return normalizeText(structured.answerText || '').length >= 80;
        if (kind === 'post') return normalizeText(structured.articleText || '').length >= 80;
        if (kind === 'question') {
            return normalizeText(structured.questionAnswersText || '').length >= 80
                || normalizeText(structured.questionDetail || '').length >= 140;
        }
        return normalizeText(structured.text || '').length >= 80;
    }

    function buildFallbackWikiContent(item, error = '') {
        const kind = getWikiContentKind(item.url || item.key || '');
        const text = normalizeText(item.text || item.snippet || '');
        const anomalyReason = !item.url
            ? '未识别到可抓取的知乎正文 URL，可能是作者主页、账号页、广告或卡片结构异常。'
            : error;
        const questionTitle = kind === 'answer' || kind === 'question' ? item.title : '';
        return {
            contentKind: kind,
            title: item.title || '知乎推荐内容',
            questionTitle,
            questionDetail: '',
            answerText: kind === 'answer' ? text : '',
            articleText: kind === 'post' || kind === 'unknown' ? text : '',
            questionAnswersText: kind === 'question' ? text : '',
            text,
            extractedLength: text.length,
            extractError: anomalyReason,
            isCollectionAnomaly: !item.url || text.length < 80,
            anomalyReason
        };
    }

    function buildApiFallbackWikiContent(item, warning = '') {
        const url = item.url || item.key || '';
        const structured = buildFallbackWikiContent(item, warning || '页面抓取失败，已使用首页推荐 API 返回的正文。');
        return {
            ...structured,
            source: '推荐 API 正文',
            error: '',
            warning: warning || '',
            isCollectionAnomaly: !url || !isZhihuContentUrl(url) || structured.text.length < 80
        };
    }

    async function fetchFullTextForItem(item) {
        const url = item.url || item.key;
        const fallback = item.text || item.snippet || '';
        if (!url || !/^https?:\/\//.test(url)) return { ...buildFallbackWikiContent(item, 'URL 不可用'), text: fallback, source: '卡片回退', error: 'URL 不可用' };
        const canUseApiContent = item.apiHasFullContent && isZhihuContentUrl(url) && normalizeText(fallback).length >= 80;

        try {
            const html = await gmFetchText(url);
            const structured = extractWikiContentFromHTML(html, url, item.title);
            const enough = hasEnoughWikiStructuredContent(structured);
            if (enough) return { ...structured, source: '全文抓取' };
            if (canUseApiContent) return buildApiFallbackWikiContent(item, '页面 HTML 正文解析过短，已使用推荐 API content 字段。');
            return { ...buildFallbackWikiContent(item, '正文过短'), source: '卡片回退', error: '正文过短' };
        } catch (err) {
            if (canUseApiContent) return buildApiFallbackWikiContent(item, `页面抓取失败：${err.message}`);
            return { ...buildFallbackWikiContent(item, err.message), source: '卡片回退', error: err.message };
        }
    }

    function parseJSONFromText(text) {
        const raw = String(text || '').trim();
        try {
            return JSON.parse(raw);
        } catch (err) {
            const match = raw.match(/\{[\s\S]*\}/);
            if (match) {
                try { return JSON.parse(match[0]); } catch (innerErr) {}
            }
        }
        return null;
    }

    function toArrayField(value, fallback = []) {
        if (Array.isArray(value)) return value.map(item => String(item || '').trim()).filter(Boolean);
        if (!value) return fallback;
        return String(value).split(/\n|[；;]/).map(item => item.replace(/^[-*、\d.\s]+/, '').trim()).filter(Boolean);
    }

    function normalizeWikiTags(value) {
        const tags = Array.isArray(value) ? value : String(value || '').split(/[，,、\s]+/);
        return tags
            .map(tag => String(tag || '').replace(/^#/, '').trim())
            .filter(Boolean)
            .slice(0, 6);
    }

    function clipWikiText(value, max = 90) {
        const text = String(value || '').replace(/\s+/g, ' ').trim();
        if (!text || text.length <= max) return text;
        return `${text.slice(0, Math.max(1, max - 1)).trim()}…`;
    }

    function compactWikiArray(value, maxItems = 3, maxChars = 90) {
        return toArrayField(value)
            .map(item => clipWikiText(item, maxChars))
            .filter(Boolean)
            .slice(0, maxItems);
    }

    function normalizeWikiChoice(value, allowed, fallback) {
        const text = String(value || '').trim();
        return allowed.includes(text) ? text : fallback;
    }

    function isUsableWikiUrl(value) {
        return /^https?:\/\//.test(value || '') && isZhihuContentUrl(value);
    }

    function sameWikiMetaText(a, b) {
        const left = normalizeText(a || '').replace(/[?？!！。，"""']/g, '').toLowerCase();
        const right = normalizeText(b || '').replace(/[?？!！。，"""']/g, '').toLowerCase();
        return !!left && !!right && left === right;
    }

    function getWikiDisplayAuthor(item) {
        const author = normalizeText(item?.author || '');
        const title = normalizeText(item?.title || item?.questionTitle || '');
        if (!author || author === '未知作者') return '未知作者';
        if (author.length > 40 || sameWikiMetaText(author, title)) return '未知作者';
        return author;
    }

    function formatWikiSourceLink(item) {
        const url = item?.url || item?.key || '';
        return isUsableWikiUrl(url) ? `[打开原文](${url})` : '未识别';
    }

    function cleanWikiSynthesisMarkdown(text) {
        const lines = String(text || '')
            .replace(/\r/g, '\n')
            .split('\n')
            .map(line => line.trimEnd());
        const dropPatterns = [
            /^Generated by\b/i,
            /^#\s*知乎首页学习卡片库/,
            /^知乎首页学习卡片库\b/,
            /^##\s*总览[:：]/,
            /^今日知识库编辑总览/,
            /^生成时间[:：]/,
            /^条目数量[:：]/,
            /^日期[:：]/,
            /^\d+[.、]\s*(信息流趋势雷达|学习萃取总览)/,
            /^[🧩📂🔍]?\s*(可复用模型|重要概念簇|值得深挖的问题)\s*$/,
            /^编辑笔记[:：]?/
        ];
        return lines
            .filter(line => !dropPatterns.some(pattern => pattern.test(line.trim())))
            .join('\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function makeAnomalyLearningCard(item, reason = '') {
        const title = item.title || '采集异常条目';
        return {
            ...item,
            wikiContentType: '采集异常',
            wikiOneSentence: '未能可靠取得正文，不进入正式学习卡片库。',
            wikiCorePoints: ['该条目需要补全文后再判断学习价值。'],
            wikiTransferScenarios: [],
            wikiEvidenceExamples: [],
            wikiJudgment: '待核验',
            wikiTags: ['采集异常', '待补全文'],
            wikiCredibility: '需核验',
            wikiCredibilityNotes: reason || item.anomalyReason || item.fetchError || '正文缺失或来源 URL 异常。',
            wikiPersonalReflection: '',
            wikiSummary: '未能可靠取得正文，不进入正式学习卡片库。',
            wikiValue: '待核验',
            title
        };
    }

    function getWikiLearningCardSystemPrompt() {
        return `你是学习卡片整理助手。目标：把知乎内容整理成短、准、可复查的卡片。

输出严格 JSON，字段：
- contentType: 概念|方法|案例|观点|综述|争议|采集异常|待核验
- oneSentence: 35-80字，最值得带走的判断
- corePoints: 1-3条，每条≤70字，原文支撑的机制/标准/反例
- transferScenarios: 0-3个，每条≤45字，明确迁移价值
- evidenceExamples: 0-2条，每条≤60字，原文具体例子/数字
- judgment: 正式入库|素材库|待核验|丢弃
- tags: 3-5个中文标签，避免泛标签
- credibility: 高|中|低|需核验
- credibilityNotes: ≤100字，说明可信度原因
- personalReflection: ≤50字，与已知知识的冲突或启发

关键要求：
1. 只依据输入内容，不补充外部事实
2. 不滥用"模型、机制、范式、底层架构"等包装词
3. 医学/法律/金融/政治内容保持保守
4. 正式入库需有清晰方法+具体证据
5. 缺失正文时标为采集异常`;
    }

    function getWikiSynthesisSystemPrompt() {
        return `你是个人学习型知识库编辑。请只基于用户给出的学习卡片生成 Markdown 片段。

输出结构固定为：
### 信息流趋势
- 1到3条，说明这些条目共同指向什么主题；不要写宏大口号。

### 今日可复用
- 2到5条，每条用"**名称**：具体用法/判断标准"的格式；名称要朴素，不要生造学术词。

### 需要复查
- 0到3条，只列需要补全文、证据不足或高风险领域的点；没有就写"无"。

限制：
- 不要输出一级标题、二级标题、生成时间、条目数量、模型署名或任何日期，外层模板会处理。
- 不要复述全部条目，不要扩写外部背景，不要发明新事实。
- 避免"系统性纠偏、底层架构认知、反直觉、认知跃迁"等泛化套话。
- 禁止使用"信息流趋势雷达、学习萃取总览、可复用模型、重要概念簇、值得深挖的问题、编辑笔记"这些旧版栏目名。`;
    }

    async function summarizeWikiItem(item, runConfig = getWikiRunConfig()) {
        if (item.isCollectionAnomaly || item.fullTextSource === '卡片回退' || !item.url || !isZhihuContentUrl(item.url)) {
            return makeAnomalyLearningCard(item, item.anomalyReason || item.fetchError || '全文抓取失败或 URL 不是知乎正文页。');
        }

        const kind = item.contentKind || getWikiContentKind(item.url || item.key || '');
        const sys = getWikiLearningCardSystemPrompt();
        const buildPrompt = limit => {
            if (kind === 'answer') {
                const answer = normalizeText(item.answerText || item.fullText || item.text || item.snippet || '').slice(0, limit);
                const questionDetail = normalizeText(item.questionDetail || '').slice(0, 1600);
                return [
                    `来源类型：知乎单个回答`,
                    `链接：${item.url || item.key}`,
                    `作者：${item.author || '未知作者'}`,
                    `原问题：${item.questionTitle || item.title || '未知问题'}`,
                    questionDetail ? `问题补充：${questionDetail}` : '',
                    `单个回答正文：\n${answer}`,
                    item.fullTextSource === '卡片回退' ? `注意：全文抓取失败，本次使用首页卡片可见文本，可能不是完整回答。` : ''
                ].filter(Boolean).join('\n\n');
            }

            if (kind === 'question') {
                const answers = normalizeText(item.questionAnswersText || item.fullText || item.text || item.snippet || '').slice(0, limit);
                const questionDetail = normalizeText(item.questionDetail || '').slice(0, 1800);
                return [
                    `来源类型：知乎问题页`,
                    `链接：${item.url || item.key}`,
                    `问题：${item.questionTitle || item.title || '未知问题'}`,
                    questionDetail ? `问题补充：${questionDetail}` : '',
                    answers ? `页面回答摘录：\n${answers}` : ''
                ].filter(Boolean).join('\n\n');
            }

            const source = normalizeText(item.articleText || item.fullText || item.text || item.snippet || '').slice(0, limit);
            return `来源类型：${item.type || '知乎内容'}\n标题：${item.title}\n作者：${item.author}\n链接：${item.url || item.key}\n\n正文：\n${source}`;
        };

        let raw = '';
        try {
            raw = await callLLMWithRetry(sys, buildPrompt(9000), { retries: 2, ...runConfig });
        } catch (err) {
            if (!isContextTooLongError(err)) throw err;
            raw = await callLLMWithRetry(sys, buildPrompt(3500), { retries: 1, ...runConfig });
        }
        const data = parseJSONFromText(raw) || {};
        const tags = normalizeWikiTags(data.tags).slice(0, 5);
        const oneSentence = clipWikiText(data.oneSentence || data.summary || raw || item.snippet || '', 90);
        const judgment = normalizeWikiChoice(data.judgment, ['正式入库', '素材库', '待核验', '丢弃'], '素材库');
        const contentType = normalizeWikiChoice(data.contentType, ['概念', '方法', '案例', '观点', '综述', '争议', '采集异常', '待核验'], '观点');
        const credibility = normalizeWikiChoice(data.credibility, ['高', '中', '低', '需核验'], '中');

        return {
            ...item,
            wikiContentType: contentType,
            wikiOneSentence: oneSentence,
            wikiCorePoints: compactWikiArray(data.corePoints, 3, 90),
            wikiTransferScenarios: compactWikiArray(data.transferScenarios, 3, 60),
            wikiEvidenceExamples: compactWikiArray(data.evidenceExamples, 2, 70),
            wikiJudgment: judgment,
            wikiTags: tags,
            wikiCredibility: credibility,
            wikiCredibilityNotes: clipWikiText(data.credibilityNotes || data.credibilityReason || '来自知乎内容，需结合原文语境判断。', 100),
            wikiPersonalReflection: clipWikiText(data.personalReflection || '', 50),
            wikiSummary: oneSentence,
            wikiValue: judgment
        };
    }

    async function buildWikiSynthesis(items, runConfig = getWikiRunConfig()) {
        if (runConfig.wikiFinalSynthesis === false || !items.length) return '';
        const validItems = items.filter(item => !['采集异常', '待补全文', '丢弃'].includes(item.wikiJudgment) && item.wikiContentType !== '采集异常');
        if (!validItems.length) return '> 本次没有足够可靠的条目生成学习总览。';
        const digest = validItems.map((item, index) => {
            const tags = item.wikiTags?.length ? ` 标签：${item.wikiTags.join('、')}` : '';
            const points = item.wikiCorePoints?.length ? `\n知识点：${item.wikiCorePoints.join('；')}` : '';
            return `${index + 1}. ${item.title}\n类型：${item.wikiContentType || item.type || '知乎内容'}\n一句话：${item.wikiOneSentence || item.wikiSummary}\n入库：${item.wikiJudgment}\n可信度：${item.wikiCredibility}${tags}${points}`;
        }).join('\n\n').slice(0, 12000);

        const sys = getWikiSynthesisSystemPrompt();
        const prompt = [
            `本次运行日期：${formatWikiDate(wikiState.startedAt || new Date())}`,
            '下面是已经结构化后的学习卡片，请据此生成总览：',
            digest
        ].join('\n\n');
        const raw = await callLLMWithRetry(sys, prompt, { retries: 2, ...runConfig });
        return cleanWikiSynthesisMarkdown(raw);
    }

    function formatWikiDate(date = new Date()) {
        date = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(date.getTime())) date = new Date();
        const pad = n => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function buildWikiMarkdown(items, synthesis) {
        const date = formatWikiDate(wikiState.startedAt || new Date());
        const formalCount = items.filter(item => item.wikiJudgment === '正式入库').length;
        const materialCount = items.filter(item => item.wikiJudgment === '素材库').length;
        const pendingCount = items.filter(item => item.wikiContentType === '采集异常' || item.wikiJudgment === '待核验').length;
        const cleanSynthesis = cleanWikiSynthesisMarkdown(synthesis);
        
        const isObsidian = config.wikiObsidianOptimized === true;
        const lines = [];

        if (isObsidian) {
            lines.push('---');
            lines.push(`title: "知乎首页学习卡片库 - ${date}"`);
            lines.push(`created: "${new Date().toLocaleString()}"`);
            lines.push(`total_cards: ${items.length}`);
            lines.push(`formal_count: ${formalCount}`);
            lines.push(`material_count: ${materialCount}`);
            lines.push(`pending_count: ${pendingCount}`);
            lines.push('tags: [知乎, 沉浸式阅读, 学习卡片, Wiki]');
            lines.push('---');
            lines.push('');
        }

        lines.push(`# 知乎首页学习卡片库 - ${date}`);
        lines.push('');
        lines.push(`生成时间：${new Date().toLocaleString()}`);
        lines.push(`条目数量：${items.length}`);
        lines.push(`入库概览：正式 ${formalCount} · 素材 ${materialCount} · 待核验 ${pendingCount}`);
        lines.push('');

        if (cleanSynthesis) {
            if (isObsidian) {
                lines.push('## 总览：趋势雷达 + 学习萃取', '');
                lines.push('> [!quote] AI 萃取与雷达总览');
                cleanSynthesis.split('\n').forEach(line => lines.push(`> ${line}`));
                lines.push('');
            } else {
                lines.push('## 总览：趋势雷达 + 学习萃取', '', cleanSynthesis, '');
            }
        }

        const learningItems = items.filter(item => item.wikiContentType !== '采集异常' && !['待核验', '丢弃'].includes(item.wikiJudgment));
        const anomalyItems = items.filter(item => item.wikiContentType === '采集异常' || ['待核验', '丢弃'].includes(item.wikiJudgment));

        lines.push('## 知识卡片库', '');
        learningItems.forEach((item, index) => {
            const tags = (item.wikiTags || []).map(tag => `#${String(tag).replace(/^#/, '').replace(/\s+/g, '_')}`).join(' ');
            lines.push(`### ${index + 1}. ${item.title || '未命名内容'}`);
            
            if (isObsidian) {
                // Info callout
                lines.push(`> [!info] 结构化卡片元数据`);
                lines.push(`> - **作者**：${getWikiDisplayAuthor(item)}`);
                lines.push(`> - **内容类型**：${item.wikiContentType || item.type || '观点'}`);
                if (item.contentKind === 'answer' && item.questionTitle && !sameWikiMetaText(item.questionTitle, item.title)) lines.push(`> - **原问题**：${item.questionTitle}`);
                if (item.contentKind === 'question' && item.questionTitle && !sameWikiMetaText(item.questionTitle, item.title)) lines.push(`> - **问题**：${item.questionTitle}`);
                lines.push(`> - **链接**：${formatWikiSourceLink(item)}`);
                if (item.fullTextSource || item.source) lines.push(`> - **正文来源**：${item.fullTextSource || item.source}`);
                if (item.fetchWarning) lines.push(`> - **抓取备注**：${item.fetchWarning}`);
                lines.push(`> - **入库判断**：${item.wikiJudgment || '素材库'}`);
                lines.push(`> - **可信度评估**：${item.wikiCredibility || '中'}${item.wikiCredibilityNotes ? ` (${item.wikiCredibilityNotes})` : ''}`);
                lines.push(`> - **检索标签**：${tags || '无'}`);
                lines.push('');
                
                // One sentence callout
                lines.push(`> [!summary] 一句话结论`);
                lines.push(`> ${item.wikiOneSentence || item.wikiSummary || '暂无结论。'}`);
                lines.push('');

                // Core points
                if (item.wikiCorePoints?.length) {
                    lines.push(`> [!todo] 核心知识点`);
                    item.wikiCorePoints.forEach(point => lines.push(`> - ${point}`));
                    lines.push('');
                }

                // Evidence
                if (item.wikiEvidenceExamples?.length || item.evidence?.length) {
                    lines.push(`> [!example] 证据与例子`);
                    const ev = item.wikiEvidenceExamples || item.evidence || [];
                    ev.forEach(example => lines.push(`> - ${example}`));
                    lines.push('');
                }

                // Scenarios
                if (item.wikiTransferScenarios?.length) {
                    lines.push(`> [!tip] 可迁移场景`);
                    item.wikiTransferScenarios.forEach(scene => lines.push(`> - ${scene}`));
                    lines.push('');
                }

                // Reflection
                if (item.wikiPersonalReflection || item.personalReflection) {
                    lines.push(`> [!brain] 个人反思`);
                    lines.push(`> ${item.wikiPersonalReflection || item.personalReflection}`);
                    lines.push('');
                }
            } else {
                lines.push(`- 作者：${getWikiDisplayAuthor(item)}`);
                lines.push(`- 内容类型：${item.wikiContentType || item.type || '观点'}`);
                if (item.contentKind === 'answer' && item.questionTitle && !sameWikiMetaText(item.questionTitle, item.title)) lines.push(`- 原问题：${item.questionTitle}`);
                if (item.contentKind === 'question' && item.questionTitle && !sameWikiMetaText(item.questionTitle, item.title)) lines.push(`- 问题：${item.questionTitle}`);
                lines.push(`- 链接：${formatWikiSourceLink(item)}`);
                if (item.fullTextSource || item.source) lines.push(`- 正文来源：${item.fullTextSource || item.source}`);
                if (item.fetchWarning) lines.push(`- 抓取备注：${item.fetchWarning}`);
                lines.push(`- 一句话结论：${item.wikiOneSentence || item.wikiSummary || '暂无结论。'}`);
                if (item.wikiCorePoints?.length) {
                    lines.push(`- 核心知识点：`);
                    item.wikiCorePoints.forEach(point => lines.push(`  - ${point}`));
                }
                if (item.wikiTransferScenarios?.length) {
                    lines.push(`- 可迁移场景：`);
                    item.wikiTransferScenarios.forEach(scene => lines.push(`  - ${scene}`));
                }
                if (item.wikiEvidenceExamples?.length || item.evidence?.length) {
                    lines.push(`- 证据与例子：`);
                    const ev = item.wikiEvidenceExamples || item.evidence || [];
                    ev.forEach(example => lines.push(`  - ${example}`));
                }
                lines.push(`- 入库判断：${item.wikiJudgment || '素材库'}`);
                lines.push(`- 检索标签：${tags || '无'}`);
                lines.push(`- 可信度：${item.wikiCredibility || '中'}${item.wikiCredibilityNotes ? `，${item.wikiCredibilityNotes}` : ''}`);
                if (item.wikiPersonalReflection || item.personalReflection) lines.push(`- 个人反思：${item.wikiPersonalReflection || item.personalReflection}`);
                lines.push('');
            }
        });

        if (anomalyItems.length) {
            lines.push('## 采集异常 / 待核验', '');
            anomalyItems.forEach((item, index) => {
                const tags = (item.wikiTags || []).map(tag => `#${String(tag).replace(/^#/, '').replace(/\s+/g, '_')}`).join(' ');
                lines.push(`### ${index + 1}. ${item.title || '未命名内容'}`);
                
                if (isObsidian) {
                    lines.push(`> [!warning] 采集状态及异常原因`);
                    lines.push(`> - **链接**：${formatWikiSourceLink(item)}`);
                    if (item.fullTextSource || item.source) lines.push(`> - **正文来源**：${item.fullTextSource || item.source}`);
                    lines.push(`> - **判断**：${item.wikiJudgment || '待核验'}`);
                    lines.push(`> - **异常原委**：${item.wikiCredibilityNotes || item.anomalyReason || item.fetchError || '正文缺失或来源异常。'}`);
                    if (item.fetchWarning) lines.push(`> - **抓取备注**：${item.fetchWarning}`);
                    lines.push(`> - **检索标签**：${tags || '#采集异常 #待核验'}`);
                    lines.push('');
                    lines.push(`> [!quote] 首页摘录`);
                    lines.push(`> ${clipWikiText(item.snippet || item.text?.slice(0, 180) || '无', 180)}`);
                    lines.push('');
                } else {
                    lines.push(`- 链接：${formatWikiSourceLink(item)}`);
                    if (item.fullTextSource || item.source) lines.push(`- 正文来源：${item.fullTextSource || item.source}`);
                    lines.push(`- 判断：${item.wikiJudgment || '待核验'}`);
                    lines.push(`- 原因：${item.wikiCredibilityNotes || item.anomalyReason || item.fetchError || '正文缺失或来源异常。'}`);
                    if (item.fetchWarning) lines.push(`- 抓取备注：${item.fetchWarning}`);
                    lines.push(`- 首页摘录：${clipWikiText(item.snippet || item.text?.slice(0, 180) || '无', 180)}`);
                    lines.push(`- 标签：${tags || '#采集异常 #待核验'}`);
                    lines.push('');
                }
            });
        }

        return lines.join('\n');
    }

    async function collectWikiHomeItems(statusEl, runConfig = getWikiRunConfig()) {
        const maxItems = Math.max(1, getWikiLimit('wikiMaxItems', 100, runConfig));
        syncHomeItemsFromGroups();

        while (_homeState.items.length < maxItems && !_homeState.exhausted) {
            const batch = await loadNextHomeGroup(statusEl, {
                switchToNewGroup: false,
                label: 'Wiki API 补充首页推荐',
                maxPages: Math.max(4, Math.ceil((maxItems - _homeState.items.length) / HOME_BATCH_SIZE) + 3)
            });
            if (!batch.length) break;
        }

        return _homeState.items.slice(0, maxItems);
    }

    function createWikiActionButton(text, handler) {
        const btn = document.createElement('button');
        btn.className = 'zh-inline-btn';
        btn.textContent = text;
        btn.addEventListener('click', handler);
        return btn;
    }

    function downloadWikiMarkdown(markdown, record = null) {
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const started = record?.startedAt || wikiState.startedAt || new Date();
        a.download = `zhihu-wiki-${formatWikiDate(new Date(started))}.md`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function copyWikiMarkdown(markdown, btn = null) {
        try {
            await navigator.clipboard.writeText(markdown);
            if (btn) btn.textContent = '已复制';
        } catch (err) {
            alert('复制失败，请在预览区手动复制。');
        }
    }

    function renderWikiLog(record = null) {
        const logs = record?.log || wikiState.log || [];
        const errors = record?.errors || wikiState.errors || [];
        const lines = logs.length
            ? logs.map(log => `[${formatWikiTime(log.time)}] ${log.message}`)
            : ['暂无日志。'];
        if (errors.length) {
            lines.push('', '抓取/生成异常：');
            errors.slice(-40).forEach((entry, index) => {
                const item = entry?.item || {};
                const title = item.title ? `《${clipWikiText(item.title, 48)}》` : '未知条目';
                const url = item.url || item.key || '无URL';
                lines.push(`${index + 1}. ${title}｜${entry?.error || '未知错误'}｜${url}`);
            });
        }
        const pre = document.createElement('pre');
        pre.id = record ? '' : 'zh-wiki-live-log';
        pre.className = 'zh-wiki-log';
        pre.textContent = lines.join('\n');
        return pre;
    }

    function renderWikiHistory(wrapper) {
        ensureWikiHistory();
        const section = document.createElement('section');
        section.className = 'zh-wiki-history';

        const title = document.createElement('h3');
        title.textContent = 'Wiki 运行历史';
        title.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:12px;';
        if (wikiState.history.length) {
            const clearBtn = createWikiActionButton('清空全部历史', () => {
                if (!confirm('确认清空全部 Wiki 运行历史？此操作不可撤销。')) return;
                clearAllWikiHistory();
                renderWikiDashboard();
            });
            clearBtn.style.fontWeight = 'normal';
            title.appendChild(clearBtn);
        }
        section.appendChild(title);

        if (!wikiState.history.length) {
            const empty = document.createElement('div');
            empty.className = 'zh-wiki-history-meta';
            empty.textContent = '还没有历史记录。开始一次采集后，这里会保留时间戳、阶段日志和结果。';
            section.appendChild(empty);
            wrapper.appendChild(section);
            return;
        }

        const list = document.createElement('div');
        list.className = 'zh-wiki-history-list';
        wikiState.history.forEach(record => {
            const item = document.createElement('div');
            item.className = 'zh-wiki-history-item';

            const main = document.createElement('div');
            main.className = 'zh-wiki-history-main';

            const left = document.createElement('div');
            const statusMap = { running: '运行中', paused: '已暂停', finished: '已完成', failed: '失败', interrupted: '已中断', pending: '准备中' };
            const recordTitle = document.createElement('div');
            recordTitle.className = 'zh-wiki-history-title';
            recordTitle.textContent = `${statusMap[record.status] || record.status || '未知状态'} · ${record.progressMessage || record.phase || '无阶段信息'}`;
            const recordMeta = document.createElement('div');
            recordMeta.className = 'zh-wiki-history-meta';
            recordMeta.textContent = `开始：${formatWikiTime(record.startedAt)}${record.finishedAt ? ` ｜ 结束：${formatWikiTime(record.finishedAt)}` : ''} ｜ 条目：${record.itemCount || 0} ｜ 错误：${record.errorCount || 0}`;
            left.appendChild(recordTitle);
            left.appendChild(recordMeta);
            main.appendChild(left);

            const actions = document.createElement('div');
            actions.className = 'zh-wiki-history-actions';
            if (record.markdown) {
                actions.appendChild(createWikiActionButton('查看结果', () => renderWikiResult(record.markdown, record)));
                actions.appendChild(createWikiActionButton('复制', e => copyWikiMarkdown(record.markdown, e.currentTarget)));
                actions.appendChild(createWikiActionButton('下载', () => downloadWikiMarkdown(record.markdown, record)));
            }
            actions.appendChild(createWikiActionButton('日志', () => {
                const existing = item.querySelector('.zh-wiki-log');
                if (existing) {
                    existing.remove();
                    return;
                }
                item.appendChild(renderWikiLog(record));
            }));
            if (record.status !== 'running') {
                actions.appendChild(createWikiActionButton('删除', () => {
                    if (!confirm('确认删除这条 Wiki 运行历史？')) return;
                    deleteWikiHistoryRecord(record.runId);
                    renderWikiDashboard();
                }));
            }
            main.appendChild(actions);
            item.appendChild(main);
            list.appendChild(item);
        });
        section.appendChild(list);
        wrapper.appendChild(section);
    }

    function renderWikiDashboard() {
        renderPersonalSpaceDashboard('wiki_history');
    }

    function renderWikiShell(message = '准备运行信息流 Wiki...') {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return null;

        const spaceContent = wrapper.querySelector('.zh-space-content');
        const targetContainer = spaceContent || wrapper;

        if (!spaceContent) {
            _homeState.view = 'wiki';
            restoreLiveMount();
            clearHomeTranslations();
            wrapper.classList.remove('zh-has-top-nav', 'zh-home-wide');
            wrapper.innerHTML = '';
            appendHomeHeader(wrapper);
        } else {
            spaceContent.innerHTML = '';
        }

        const progress = document.createElement('div');
        progress.id = 'zh-wiki-progress';
        progress.className = 'zh-wiki-progress';
        progress.textContent = `信息流 Wiki：${message}`;
        targetContainer.appendChild(progress);

        const actions = document.createElement('div');
        actions.className = 'zh-wiki-actions';
        actions.appendChild(createWikiActionButton('暂停任务', () => setWikiPaused(true)));
        actions.appendChild(createWikiActionButton('刷新进度', renderWikiDashboard));
        targetContainer.appendChild(actions);

        targetContainer.appendChild(renderWikiLog());

        if (!spaceContent) {
            renderWikiHistory(wrapper);
        } else {
            renderWikiHistory(spaceContent);
        }

        window.scrollTo(0, 0);
        return progress;
    }

    function renderWikiMarkdownToHTML(md) {
        const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const lines = md.split('\n');
        const out = [];
        let inList = false;
        let listType = '';
        let inCallout = false;
        let calloutType = '';

        const inlineFormat = line => {
            return line
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/`(.+?)`/g, '<code>$1</code>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        };

        const closeList = () => {
            if (inList) { out.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
        };

        const closeCallout = () => {
            if (inCallout) { out.push('</div></div>'); inCallout = false; }
        };

        const CALLOUT_ICONS = {
            info: 'ℹ️',
            summary: '📋',
            todo: '☑️',
            example: '🦄',
            tip: '💡',
            brain: '🧠',
            warning: '⚠️',
            quote: '💬'
        };

        const CALLOUT_LABELS = {
            info: '结构化卡片元数据',
            summary: '一句话结论',
            todo: '核心知识点',
            example: '证据与例子',
            tip: '可迁移场景',
            brain: '个人反思',
            warning: '采集异常 / 待核验',
            quote: 'AI 萃取与雷达总览'
        };

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // 识别以 '>' 开头的引用或 Callout 折叠框
            if (line.trim().startsWith('>')) {
                closeList();
                
                // 识别 Callout 头部: > [!type] Title
                const calloutHeaderMatch = line.match(/^>\s*\[!([a-zA-Z]+)\]\s*(.*)$/);
                if (calloutHeaderMatch) {
                    closeCallout(); // 关闭上一个活动折叠框
                    
                    const type = calloutHeaderMatch[1].toLowerCase();
                    const titleText = calloutHeaderMatch[2].trim();
                    const icon = CALLOUT_ICONS[type] || '📝';
                    const defaultTitle = CALLOUT_LABELS[type] || (type.toUpperCase());
                    const finalTitle = titleText ? inlineFormat(escapeHtml(titleText)) : defaultTitle;
                    
                    inCallout = true;
                    calloutType = type;
                    out.push(`<div class="zh-callout zh-callout-${type}">`);
                    out.push(`<div class="zh-callout-title"><span class="zh-callout-icon">${icon}</span> ${finalTitle}</div>`);
                    out.push(`<div class="zh-callout-content">`);
                    continue;
                }
                
                // 处理 Callout 或常规引用块内的行内容
                const cleanQuoteLine = line.replace(/^>\s*/, '');
                
                if (inCallout) {
                    if (/^\s*[-*]\s/.test(cleanQuoteLine)) {
                        out.push(`<li>${inlineFormat(escapeHtml(cleanQuoteLine.replace(/^\s*[-*]\s/, '')))}</li>`);
                    } else if (cleanQuoteLine.trim() === '') {
                        out.push('<br>');
                    } else {
                        out.push(`<p>${inlineFormat(escapeHtml(cleanQuoteLine))}</p>`);
                    }
                } else {
                    out.push(`<blockquote>${inlineFormat(escapeHtml(cleanQuoteLine))}</blockquote>`);
                }
                continue;
            }

            // 离开块引用/Callout状态，关闭所有活动 Callout
            closeCallout();

            if (/^#{1,4}\s/.test(line)) {
                closeList();
                const level = line.match(/^(#+)/)[1].length;
                const text = inlineFormat(escapeHtml(line.replace(/^#+\s*/, '')));
                out.push(`<h${level} class="zh-wiki-h">${text}</h${level}>`);
                continue;
            }

            if (/^---+$/.test(line.trim())) {
                closeList();
                out.push('<hr>');
                continue;
            }

            if (/^\s*[-*]\s/.test(line)) {
                if (!inList || listType !== 'ul') { closeList(); out.push('<ul>'); inList = true; listType = 'ul'; }
                out.push(`<li>${inlineFormat(escapeHtml(line.replace(/^\s*[-*]\s/, '')))}</li>`);
                continue;
            }

            if (/^\s*\d+\.\s/.test(line)) {
                if (!inList || listType !== 'ol') { closeList(); out.push('<ol>'); inList = true; listType = 'ol'; }
                out.push(`<li>${inlineFormat(escapeHtml(line.replace(/^\s*\d+\.\s/, '')))}</li>`);
                continue;
            }

            closeList();

            if (line.trim() === '') {
                out.push('');
                continue;
            }

            out.push(`<p>${inlineFormat(escapeHtml(line))}</p>`);
        }
        closeList();
        closeCallout();
        return out.join('\n');
    }

    function renderWikiResult(markdown, record = null) {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return;

        const spaceContent = wrapper.querySelector('.zh-space-content');
        const targetContainer = spaceContent || wrapper;

        if (!spaceContent) {
            wrapper.classList.remove('zh-has-top-nav', 'zh-home-wide');
            wrapper.innerHTML = '';
            appendHomeHeader(wrapper);
        } else {
            spaceContent.innerHTML = '';
        }

        const actions = document.createElement('div');
        actions.className = 'zh-wiki-actions';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'zh-inline-btn';
        copyBtn.textContent = '复制 Markdown';
        copyBtn.addEventListener('click', () => copyWikiMarkdown(markdown, copyBtn));

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'zh-inline-btn';
        downloadBtn.textContent = '下载 .md';
        downloadBtn.addEventListener('click', () => downloadWikiMarkdown(markdown, record));

        const backBtn = document.createElement('button');
        backBtn.className = 'zh-inline-btn';
        backBtn.textContent = spaceContent ? '返回记录列表' : '返回 Wiki 面板';
        backBtn.addEventListener('click', () => {
            if (spaceContent) {
                renderPersonalSpaceDashboard('wiki_history');
            } else {
                renderWikiDashboard();
            }
        });

        actions.appendChild(copyBtn);
        actions.appendChild(downloadBtn);
        actions.appendChild(backBtn);
        targetContainer.appendChild(actions);

        const content = document.createElement('div');
        content.className = 'zh-wiki-output zh-wiki-rendered';
        content.innerHTML = renderWikiMarkdownToHTML(markdown);
        targetContainer.appendChild(content);

        if (!spaceContent) {
            renderWikiHistory(wrapper);
        } else {
            renderWikiHistory(spaceContent);
        }
        window.scrollTo(0, 0);
    }

    async function startWikiRun(selectedItems = null) {
        if (!selectedItems && !isHomePage()) return alert('信息流 Wiki 目前只在知乎首页运行。');
        if (wikiState.running) {
            if (selectedItems) {
                alert('已有采集任务正在运行，请等待其完成。');
                return;
            }
            renderWikiDashboard();
            return;
        }
        const runConfig = createWikiRunConfig();
        if (!runConfig.apiKey) return alert('请先在设置里配置 API Key。');

        const startedAt = new Date();
        const runMsg = selectedItems ? `准备分析所选的 ${selectedItems.length} 条已读/待读条目...` : '准备采集首页推荐...';
        wikiState = {
            runId: createWikiRunId(startedAt),
            items: [],
            running: true,
            finished: false,
            errors: [],
            markdown: '',
            startedAt,
            finishedAt: null,
            phase: 'collect',
            progressMessage: runMsg,
            paused: false,
            log: [],
            history: loadWikiHistory(),
            runConfig
        };
        recordWikiProgress(runMsg, 'collect');

        const progressEl = renderWikiShell(runMsg);
        try {
            let items;
            if (selectedItems) {
                items = selectedItems.map(item => ({
                    url: item.url,
                    key: item.url,
                    title: item.title || '无标题',
                    author: item.author || '未知作者',
                    contentKind: item.contentKind || item.type || 'article',
                    type: item.contentKind || item.type || 'article'
                }));
            } else {
                items = await collectWikiHomeItems(progressEl, runConfig);
            }
            
            // 增量 Hash 校验：读取本地数据库中已保存的卡片 URL，避免重复的抓取、LLM 和 Embedding 消耗
            updateWikiProgress('正在读取本地卡片库，进行增量 Hash 校验...', 'collect');
            let allSavedCards = [];
            try {
                allSavedCards = await getAllWikiCards();
            } catch (err) {
                console.warn('读取本地已保存卡片失败，将跳过增量校验:', err);
            }
            const savedCardsMap = new Map();
            allSavedCards.forEach(c => {
                if (c.url) savedCardsMap.set(c.url, c);
            });

            let cachedCount = 0;
            const processedItems = items.map(item => {
                const url = item.url || item.key || '';
                if (url && savedCardsMap.has(url)) {
                    cachedCount++;
                    const cached = savedCardsMap.get(url);
                    return {
                        ...item,
                        isCached: true,
                        title: cached.title || item.title,
                        wikiContentType: cached.contentType,
                        wikiOneSentence: cached.oneSentence,
                        wikiCorePoints: cached.corePoints || [],
                        wikiTransferScenarios: cached.transferScenarios || [],
                        wikiEvidenceExamples: cached.evidenceExamples || cached.evidence || [],
                        wikiJudgment: cached.judgment,
                        wikiTags: cached.tags || [],
                        wikiCredibility: cached.credibility,
                        wikiCredibilityNotes: cached.credibilityNotes,
                        wikiPersonalReflection: cached.personalReflection,
                        embedding: cached.embedding
                    };
                }
                return item;
            });
            recordWikiProgress(`增量校验完成：本次共采集 ${items.length} 条推荐，其中 ${cachedCount} 条为已缓存（跳过网络抓取/AI生成），${items.length - cachedCount} 条为新条目。`, 'collect');
            wikiState.items = processedItems;

            updateWikiProgress(`准备抓取全文（新条目：${items.length - cachedCount} 条）...`, 'fetch');

            const fetchTasks = processedItems.map(item => async () => {
                if (item.isCached) return item;
                
                const result = await fetchFullTextForItem(item);
                return {
                    ...item,
                    ...result,
                    title: result.title || item.title,
                    fullText: result.text,
                    fullTextSource: result.source,
                    fetchError: result.error || '',
                    fetchWarning: result.warning || ''
                };
            });
            const fetchConcurrency = getWikiLimit('wikiConcurrency', 20, runConfig);
            const fetched = await runLimited(fetchTasks, {
                concurrency: fetchConcurrency,
                rpm: 0,
                onStart: (started, total) => updateWikiProgress(`抓取全文请求已发起 ${started}/${total}`, 'fetch'),
                onProgress: (done, total) => updateWikiProgress(`抓取全文已完成 ${done}/${total}`, 'fetch')
            });

            const normalized = fetched.map((item, index) => {
                if (item.isCached) return item;
                return item?.error ? { ...processedItems[index], fullText: processedItems[index].text, fullTextSource: '卡片回退', fetchError: item.error.message } : item;
            });

            const fetchStats = normalized.reduce((stats, item) => {
                if (item.isCached) {
                    stats.cached++;
                    return stats;
                }
                const source = item.fullTextSource || item.source || '未知';
                if (source === '全文抓取') stats.full++;
                else if (source === '推荐 API 正文') stats.api++;
                else if (source === '卡片回退') stats.fallback++;
                else stats.other++;
                if (!isUsableWikiUrl(item.url || item.key || '')) stats.noUrl++;
                if (item.fetchError || item.fetchWarning) stats.warn++;
                return stats;
            }, { full: 0, api: 0, fallback: 0, other: 0, noUrl: 0, warn: 0, cached: 0 });

            normalized
                .filter(item => !item.isCached && (item.fullTextSource === '卡片回退' || !isUsableWikiUrl(item.url || item.key || '') || item.fetchError))
                .slice(0, 30)
                .forEach(item => {
                    wikiState.errors.push({
                        item: {
                            title: item.title,
                            url: item.url || '',
                            key: item.key || '',
                            type: item.type || '',
                            contentKind: item.contentKind || ''
                        },
                        error: `${item.fullTextSource || '未知来源'}：${item.fetchError || item.anomalyReason || '未取得可靠正文'}`
                    });
                });
            recordWikiProgress(`全文抓取诊断：新抓取页面全文 ${fetchStats.full} · 推荐API正文兜底 ${fetchStats.api} · 卡片回退 ${fetchStats.fallback} · 已缓存跳过 ${fetchStats.cached} · 无有效URL ${fetchStats.noUrl} · 抓取备注 ${fetchStats.warn}`, 'fetch');
            
            updateWikiProgress(`全文抓取完成，开始 AI 摘要新条目（${normalized.length - cachedCount} 条）...`, 'summarize');
            const summaryTasks = normalized.map(item => () => {
                if (item.isCached) return Promise.resolve(item);
                return summarizeWikiItem(item, runConfig);
            });
            const summarized = await runLimited(summaryTasks, {
                concurrency: getWikiLimit('wikiConcurrency', 20, runConfig),
                rpm: getWikiLimit('wikiRpm', 300, runConfig),
                onStart: (started, total) => updateWikiProgress(`AI 摘要请求已发起 ${started}/${total}`, 'summarize'),
                onProgress: (done, total) => updateWikiProgress(`AI 摘要已完成 ${done}/${total}`, 'summarize')
            });

            const finalItems = summarized.map((item, index) => {
                if (item.isCached) return item;
                if (!item?.error) return item;
                wikiState.errors.push({ item: normalized[index], error: item.error.message });
                return makeAnomalyLearningCard(normalized[index], `AI 学习卡片生成失败：${item.error.message}`);
            });

            updateWikiProgress('生成今日总览...', 'synthesis');
            let synthesis = '';
            try {
                synthesis = await buildWikiSynthesis(finalItems, runConfig);
            } catch (err) {
                wikiState.errors.push({ error: `今日总览失败：${err.message}` });
                synthesis = `> 今日总览生成失败：${err.message}`;
            }

            // Embedding phase: 只对新生成的有效卡片进行向量嵌入计算
            let embeddingSuccess = 0;
            const embeddingHost = (config.embeddingHost || config.apiHost || '').trim();
            const embeddingKey = (config.embeddingKey || config.apiKey || '').trim();
            if (embeddingHost && embeddingKey) {
                updateWikiProgress('计算向量嵌入...', 'embedding');
                const embeddableItems = finalItems.filter(item => !item.isCached && item.wikiContentType !== '采集异常' && item.wikiJudgment !== '丢弃');
                const EMBED_BATCH_SIZE = 20;
                for (let i = 0; i < embeddableItems.length; i += EMBED_BATCH_SIZE) {
                    const batch = embeddableItems.slice(i, i + EMBED_BATCH_SIZE);
                    const texts = batch.map(item => {
                        const title = item.title || '';
                        const sentence = item.wikiOneSentence || '';
                        const tags = (item.wikiTags || []).join(' ');
                        return `${title} ${sentence} ${tags}`.trim();
                    });
                    try {
                        const embeddings = await callEmbeddingAPI(texts);
                        batch.forEach((item, idx) => {
                            if (embeddings[idx]) {
                                item.embedding = embeddings[idx];
                                embeddingSuccess++;
                            }
                        });
                    } catch (err) {
                        wikiState.errors.push({ error: `Embedding batch ${i}-${i + batch.length} 失败：${err.message}` });
                    }
                    updateWikiProgress(`向量嵌入进度 ${Math.min(i + EMBED_BATCH_SIZE, embeddableItems.length)}/${embeddableItems.length}`, 'embedding');
                }
                recordWikiProgress(`向量嵌入完成：新生成卡片共 ${embeddableItems.length} 条，其中 ${embeddingSuccess} 条计算成功。已缓存卡片跳过。`, 'embedding');
            }

            // Save structured cards to IndexedDB (只保存新卡片)
            updateWikiProgress('保存卡片到本地数据库...', 'save');
            try {
                const batchId = wikiState.runId;
                const cardsToSave = finalItems
                    .filter(item => !item.isCached && item.wikiContentType !== '采集异常' && item.wikiJudgment !== '丢弃')
                    .map(item => ({
                        id: generateWikiCardId(),
                        title: item.title || '未命名',
                        url: item.url || item.key || '',
                        author: getWikiDisplayAuthor(item),
                        tags: item.wikiTags || [],
                        contentType: item.wikiContentType || '观点',
                        oneSentence: item.wikiOneSentence || '',
                        corePoints: item.wikiCorePoints || [],
                        judgment: item.wikiJudgment || '素材库',
                        credibility: item.wikiCredibility || '中',
                        credibilityNotes: item.wikiCredibilityNotes || '',
                        personalReflection: item.wikiPersonalReflection || '',
                        embedding: item.embedding || null,
                        fullText: (item.fullText || item.text || '').slice(0, 8000),
                        createdAt: new Date().toISOString(),
                        batchId
                    }));
                await saveWikiCards(cardsToSave);
                recordWikiProgress(`本地数据库已更新：保存 ${cardsToSave.length} 张新卡片，自动跳过已存在的 ${cachedCount} 张卡片。`, 'save');
            } catch (err) {
                wikiState.errors.push({ error: `IndexedDB 保存失败：${err.message}` });
                recordWikiProgress(`卡片保存失败：${err.message}`, 'save');
            }

            const markdown = buildWikiMarkdown(finalItems, synthesis);
            wikiState.items = finalItems;
            wikiState.markdown = markdown;
            wikiState.finished = true;
            const learningCount = finalItems.filter(item => item.wikiContentType !== '采集异常' && item.wikiJudgment !== '待补全文').length;
            const anomalyCount = finalItems.length - learningCount;
            updateWikiProgress(`已完成，生成 ${learningCount} 张学习卡片，${anomalyCount} 条待核验。`, 'finished');
            finishWikiHistoryRecord('finished', {
                phase: 'finished',
                progressMessage: `已完成，生成 ${learningCount} 张学习卡片，${anomalyCount} 条待核验。`,
                markdown
            });
            renderWikiResult(markdown);
        } catch (err) {
            wikiState.errors.push({ error: err.message });
            updateWikiProgress(`运行失败：${err.message}`, 'failed');
            finishWikiHistoryRecord('failed', {
                phase: 'failed',
                progressMessage: `运行失败：${err.message}`
            });
            renderWikiShell(`运行失败：${err.message}`);
        } finally {
            wikiState.running = false;
            wikiState.paused = false;
            removeCollectOverlay();
            upsertWikiHistoryRecord({
                status: wikiState.finished ? 'finished' : 'failed',
                errorCount: wikiState.errors.length || 0,
                itemCount: wikiState.items.length || 0,
                log: wikiState.log,
                markdown: wikiState.markdown,
                runConfigSnapshot: wikiState.runConfig || null
            });
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Wiki 卡片库面板：语义搜索 + 标签云 + 卡片网格
    // ═══════════════════════════════════════════════════════════

    function showWikiCardDetailModal(card) {
        // 格式化日期辅助函数
        const formatDate = (isoString) => {
            if (!isoString) return '';
            try {
                const date = new Date(isoString);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            } catch (err) {
                return isoString.split('T')[0] || isoString;
            }
        };

        // 确定可信度级别的样式 class
        let credibilityClass = 'medium';
        if (card.credibility === '高') credibilityClass = 'high';
        else if (card.credibility === '低') credibilityClass = 'low';
        else if (card.credibility === '需核验') credibilityClass = 'verify';

        // 列表渲染辅助函数
        const renderBulletList = (items) => {
            if (!Array.isArray(items) || !items.length) return '<span style="opacity:0.5;">无</span>';
            return `<ul class="zh-wiki-detail-list">
                ${items.map(item => `<li>${escapeHTML(item)}</li>`).join('')}
            </ul>`;
        };

        // 标签 HTML
        const tagsHtml = Array.isArray(card.tags) && card.tags.length
            ? `<div class="zh-wiki-detail-tags">
                ${card.tags.map(t => `<span class="zh-wiki-detail-tag">${escapeHTML(t)}</span>`).join('')}
               </div>`
            : '';

        // 核心知识点 HTML
        const corePointsHtml = `
            <div class="zh-wiki-detail-section">
                <div class="zh-wiki-detail-section-title">核心知识点</div>
                ${renderBulletList(card.corePoints || card.wikiCorePoints)}
            </div>
        `;

        // 证据与例子 HTML
        const evidenceHtml = `
            <div class="zh-wiki-detail-section">
                <div class="zh-wiki-detail-section-title">证据与例子</div>
                ${renderBulletList(card.evidenceExamples || card.evidence || card.wikiEvidenceExamples)}
            </div>
        `;

        // 可迁移场景 HTML
        const scenariosHtml = `
            <div class="zh-wiki-detail-section">
                <div class="zh-wiki-detail-section-title">可迁移场景</div>
                ${renderBulletList(card.transferScenarios || card.wikiTransferScenarios)}
            </div>
        `;

        // 个人反思 HTML (仅当有值时渲染)
        const reflectionHtml = (card.personalReflection || card.wikiPersonalReflection)
            ? `<div class="zh-wiki-detail-meta-box">
                <div class="zh-wiki-detail-section-title">个人反思</div>
                <div class="zh-wiki-detail-reflection">${escapeHTML(card.personalReflection || card.wikiPersonalReflection)}</div>
               </div>`
            : '';

        const modalContent = `
            <div class="zh-wiki-detail-modal">
                <div class="zh-wiki-detail-top">
                    <span class="zh-wiki-detail-type">${escapeHTML(card.contentType || card.wikiContentType || '观点')}</span>
                    <span class="zh-wiki-detail-date">${escapeHTML(formatDate(card.createdAt))}</span>
                </div>
                <h3 class="zh-wiki-detail-title">
                    <a href="${escapeHTML(card.url || '#')}" target="_blank" rel="noopener noreferrer" title="在新窗口打开原文">
                        ${escapeHTML(card.title || '未命名')}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 4px; display: inline-block; vertical-align: middle;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                </h3>
                ${tagsHtml}
                <hr class="zh-wiki-detail-hr">
                
                <div class="zh-wiki-detail-section">
                    <div class="zh-wiki-detail-section-title">一句话结论</div>
                    <div class="zh-wiki-detail-one-sentence">${escapeHTML(card.oneSentence || card.wikiOneSentence || '')}</div>
                </div>

                ${corePointsHtml}
                ${evidenceHtml}
                ${scenariosHtml}

                <div class="zh-wiki-detail-meta-grid">
                    <div class="zh-wiki-detail-meta-box">
                        <div class="zh-wiki-detail-section-title">可信度评估</div>
                        <div class="zh-wiki-detail-credibility-row">
                            <span class="zh-wiki-detail-credibility-level ${credibilityClass}">${escapeHTML(card.credibility || card.wikiCredibility || '中')}</span>
                            <span class="zh-wiki-detail-credibility-notes">${escapeHTML(card.credibilityNotes || card.wikiCredibilityNotes || '来自知乎内容，需结合原文语境判断。')}</span>
                        </div>
                    </div>
                    ${reflectionHtml}
                </div>

                <div class="zh-wiki-detail-actions">
                    <button class="zh-wiki-detail-btn-primary" id="zh-wiki-detail-obsidian-btn" style="background:#7a5cd8; border-color:#7a5cd8; color:#fff; margin-right:auto;">导出 Obsidian MD</button>
                    <button class="zh-wiki-detail-btn-delete" id="zh-wiki-detail-del-btn">删除此卡片</button>
                    <button class="zh-wiki-detail-btn-primary" id="zh-wiki-detail-open-btn">打开原文</button>
                </div>
            </div>
        `;

        const modal = createModal('zh-wiki-card-detail-modal', '📖 学习卡片详情', modalContent);
        
        // 动态覆盖宽度以适配丰富的信息展示
        const modalContainer = modal.querySelector('.zh-modal');
        if (modalContainer) {
            modalContainer.style.width = '640px';
            modalContainer.style.maxWidth = '95%';
        }

        // 绑定"导出 Obsidian"按钮事件
        const obsBtn = modal.querySelector('#zh-wiki-detail-obsidian-btn');
        if (obsBtn) {
            obsBtn.addEventListener('click', () => {
                try {
                    const cleanTags = (card.tags || []).map(t => String(t).trim().replace(/\s+/g, '_')).filter(Boolean);
                    const formattedTags = cleanTags.map(t => `#${t}`).join(' ');
                    
                    const mdLines = [];
                    mdLines.push('---');
                    mdLines.push(`title: "${(card.title || '未命名').replace(/"/g, '\\"')}"`);
                    mdLines.push(`author: "${(getWikiDisplayAuthor(card) || '未知').replace(/"/g, '\\"')}"`);
                    mdLines.push(`type: "${card.contentType || card.wikiContentType || '观点'}"`);
                    mdLines.push(`url: "${card.url || ''}"`);
                    mdLines.push(`credibility: "${card.credibility || card.wikiCredibility || '中'}"`);
                    mdLines.push(`judgment: "${card.wikiJudgment || card.judgment || '素材库'}"`);
                    if (cleanTags.length) {
                        mdLines.push('tags:');
                        cleanTags.forEach(t => mdLines.push(`  - ${t}`));
                    } else {
                        mdLines.push('tags: [知乎, 沉浸式阅读, 学习卡片]');
                    }
                    mdLines.push(`created: "${formatDate(card.createdAt)}"`);
                    mdLines.push('---');
                    mdLines.push('');
                    
                    mdLines.push(`# ${card.title || '未命名'}`);
                    mdLines.push('');
                    
                    // 元数据 Callout
                    mdLines.push(`> [!info] 结构化卡片元数据`);
                    mdLines.push(`> - **作者**：${getWikiDisplayAuthor(card)}`);
                    mdLines.push(`> - **内容类型**：${card.contentType || card.wikiContentType || '观点'}`);
                    if (card.contentKind === 'answer' && card.questionTitle && !sameWikiMetaText(card.questionTitle, card.title)) {
                        mdLines.push(`> - **原问题**：${card.questionTitle}`);
                    }
                    mdLines.push(`> - **链接**：${card.url || '无'}`);
                    mdLines.push(`> - **入库判断**：${card.wikiJudgment || card.judgment || '素材库'}`);
                    mdLines.push(`> - **可信度评估**：${card.credibility || card.wikiCredibility || '中'}${card.credibilityNotes || card.wikiCredibilityNotes ? ` (${card.credibilityNotes || card.wikiCredibilityNotes})` : ''}`);
                    mdLines.push(`> - **检索标签**：${formattedTags || '无'}`);
                    mdLines.push('');
                    
                    // 一句话结论 Callout
                    mdLines.push(`> [!summary] 一句话结论`);
                    mdLines.push(`> ${card.oneSentence || card.wikiOneSentence || '暂无结论。'}`);
                    mdLines.push('');
                    
                    // 核心知识点 Callout
                    const pts = card.corePoints || card.wikiCorePoints;
                    if (Array.isArray(pts) && pts.length) {
                        mdLines.push(`> [!todo] 核心知识点`);
                        pts.forEach(p => mdLines.push(`> - ${p}`));
                        mdLines.push('');
                    }
                    
                    // 证据与例子 Callout
                    const ev = card.evidenceExamples || card.evidence || card.wikiEvidenceExamples;
                    if (Array.isArray(ev) && ev.length) {
                        mdLines.push(`> [!example] 证据与例子`);
                        ev.forEach(e => mdLines.push(`> - ${e}`));
                        mdLines.push('');
                    }
                    
                    // 可迁移场景 Callout
                    const sc = card.transferScenarios || card.wikiTransferScenarios;
                    if (Array.isArray(sc) && sc.length) {
                        mdLines.push(`> [!tip] 可迁移场景`);
                        sc.forEach(s => mdLines.push(`> - ${s}`));
                        mdLines.push('');
                    }
                    
                    // 个人反思 Callout
                    const ref = card.personalReflection || card.wikiPersonalReflection;
                    if (ref) {
                        mdLines.push(`> [!brain] 个人反思`);
                        mdLines.push(`> ${ref}`);
                        mdLines.push('');
                    }
                    
                    const finalMd = mdLines.join('\n');
                    const blob = new Blob([finalMd], { type: 'text/markdown;charset=utf-8' });
                    const downloadUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    const cleanFileName = (card.title || 'learning-card')
                        .replace(/[\\/:*?"<>|]/g, ' ')
                        .trim()
                        .slice(0, 50);
                    a.href = downloadUrl;
                    a.download = `[Obsidian] ${cleanFileName}.md`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(downloadUrl);
                    showToast('已成功导出单卡 Obsidian MD');
                } catch (err) {
                    showToast('导出失败: ' + err.message);
                }
            });
        }

        // 绑定"打开原文"按钮事件
        const openBtn = modal.querySelector('#zh-wiki-detail-open-btn');
        if (openBtn && card.url) {
            openBtn.addEventListener('click', () => {
                window.open(card.url, '_blank');
            });
        }

        // 绑定"删除卡片"按钮事件
        const delBtn = modal.querySelector('#zh-wiki-detail-del-btn');
        if (delBtn) {
            delBtn.addEventListener('click', async () => {
                if (!confirm('确定要删除这张学习卡片吗？该操作不可撤销。')) return;
                try {
                    await deleteWikiCard(card.id);
                    showToast('删除成功');
                    modal.remove();
                    
                    // 彻底刷新整个 Wiki 卡片面板以重新计算标签数和刷新网格
                    renderWikiCardPanel();
                } catch (err) {
                    showToast('删除失败: ' + err.message);
                }
            });
        }
    }

    function renderWikiCardGrid(cards, container) {
        container.innerHTML = '';
        if (!cards.length) {
            container.innerHTML = '<div style="padding:20px;text-align:center;opacity:0.6;">暂无卡片</div>';
            return;
        }
        cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'zh-home-card';

            const typeBadge = document.createElement('span');
            typeBadge.className = 'zh-wiki-card-type-badge';
            typeBadge.textContent = card.contentType || card.wikiContentType || '观点';
            cardEl.appendChild(typeBadge);

            const titleEl = document.createElement('div');
            titleEl.className = 'zh-home-card-title';
            titleEl.textContent = card.title || '未命名';
            cardEl.appendChild(titleEl);

            if (card.tags && card.tags.length) {
                const tagsEl = document.createElement('div');
                tagsEl.className = 'zh-wiki-card-tags';
                card.tags.forEach(tag => {
                    const chip = document.createElement('span');
                    chip.className = 'zh-wiki-card-tag';
                    chip.textContent = tag;
                    tagsEl.appendChild(chip);
                });
                cardEl.appendChild(tagsEl);
            }

            const snippetEl = document.createElement('div');
            snippetEl.className = 'zh-home-card-snippet';
            snippetEl.textContent = card.oneSentence || card.wikiOneSentence || '';
            cardEl.appendChild(snippetEl);

            cardEl.addEventListener('click', () => showWikiCardDetailModal(card));
            container.appendChild(cardEl);
        });
    }

    async function renderWikiCardPanel() {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return;

        const spaceContent = wrapper.querySelector('.zh-space-content');
        if (spaceContent) {
            renderPersonalSpaceDashboard('card_library');
            return;
        }

        _homeState.view = 'wiki-cards';
        restoreLiveMount();
        clearHomeTranslations();
        wrapper.classList.remove('zh-has-top-nav');
        wrapper.classList.add('zh-home-wide');
        wrapper.innerHTML = '';
        appendHomeHeader(wrapper);

        // Title
        const title = document.createElement('h2');
        title.className = 'zh-home-title';
        title.textContent = 'Wiki 卡片库';
        wrapper.appendChild(title);

        // Search bar
        const searchBar = document.createElement('div');
        searchBar.className = 'zh-wiki-search-bar';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '输入关键词进行语义搜索...';
        const searchBtn = document.createElement('button');
        searchBtn.textContent = '搜索';
        const backBtn = document.createElement('button');
        backBtn.textContent = '返回 Wiki';
        backBtn.addEventListener('click', renderWikiDashboard);
        searchBar.appendChild(searchInput);
        searchBar.appendChild(searchBtn);
        searchBar.appendChild(backBtn);
        wrapper.appendChild(searchBar);

        // Tag cloud
        const tagCloudEl = document.createElement('div');
        tagCloudEl.className = 'zh-wiki-tag-cloud';
        tagCloudEl.innerHTML = '<span style="opacity:0.5;">加载标签中...</span>';
        wrapper.appendChild(tagCloudEl);

        // Card grid
        const gridEl = document.createElement('div');
        gridEl.className = 'zh-wiki-card-grid';
        gridEl.innerHTML = '<div style="padding:20px;opacity:0.5;">加载卡片中...</div>';
        wrapper.appendChild(gridEl);

        // Load data
        let allCards = [];
        let allTags = [];
        let activeTag = null;

        try {
            allCards = await getAllWikiCards();
            allTags = await getAllTags();
        } catch (err) {
            gridEl.innerHTML = `<div style="padding:20px;color:red;">加载失败：${escapeHTML(err.message)}</div>`;
            return;
        }

        // Sort cards by createdAt descending
        allCards.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        // Render tag cloud
        tagCloudEl.innerHTML = '';
        if (allTags.length) {
            const allChip = document.createElement('span');
            allChip.className = 'zh-wiki-tag-chip active';
            allChip.innerHTML = `全部 <span class="zh-tag-count">${allCards.length}</span>`;
            allChip.addEventListener('click', () => {
                activeTag = null;
                tagCloudEl.querySelectorAll('.zh-wiki-tag-chip').forEach(c => c.classList.remove('active'));
                allChip.classList.add('active');
                renderWikiCardGrid(allCards, gridEl);
            });
            tagCloudEl.appendChild(allChip);

            allTags
                .sort((a, b) => b.count - a.count)
                .slice(0, 40)
                .forEach(tagRecord => {
                    const chip = document.createElement('span');
                    chip.className = 'zh-wiki-tag-chip';
                    chip.innerHTML = `${escapeHTML(tagRecord.tag)} <span class="zh-tag-count">${tagRecord.count}</span>`;
                    chip.addEventListener('click', async () => {
                        activeTag = tagRecord.tag;
                        tagCloudEl.querySelectorAll('.zh-wiki-tag-chip').forEach(c => c.classList.remove('active'));
                        chip.classList.add('active');
                        try {
                            const filtered = await getWikiCardsByTag(tagRecord.tag);
                            filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                            renderWikiCardGrid(filtered, gridEl);
                        } catch (err) {
                            gridEl.innerHTML = `<div style="padding:20px;color:red;">筛选失败</div>`;
                        }
                    });
                    tagCloudEl.appendChild(chip);
                });
        } else {
            tagCloudEl.innerHTML = '<span style="opacity:0.5;">暂无标签</span>';
        }

        // Render initial card grid
        renderWikiCardGrid(allCards, gridEl);

        // Search handler
        const doSearch = async () => {
            const query = searchInput.value.trim();
            if (!query) {
                renderWikiCardGrid(activeTag ? await getWikiCardsByTag(activeTag) : allCards, gridEl);
                return;
            }
            const embeddingHost = (config.embeddingHost || config.apiHost || '').trim();
            const embeddingKey = (config.embeddingKey || config.apiKey || '').trim();
            if (!embeddingHost || !embeddingKey) {
                // Fallback: text-based search
                const lower = query.toLowerCase();
                const filtered = allCards.filter(card =>
                    (card.title || '').toLowerCase().includes(lower) ||
                    (card.oneSentence || '').toLowerCase().includes(lower) ||
                    (card.tags || []).some(t => t.toLowerCase().includes(lower))
                );
                renderWikiCardGrid(filtered, gridEl);
                return;
            }
            gridEl.innerHTML = '<div style="padding:20px;opacity:0.5;">正在计算语义搜索...</div>';
            try {
                const embeddings = await callEmbeddingAPI([query]);
                if (!embeddings || !embeddings[0]) throw new Error('未获取到查询向量');
                const results = await searchByEmbedding(embeddings[0], 20);
                renderWikiCardGrid(results.map(r => r.card), gridEl);
            } catch (err) {
                // Fallback to text search on error
                const lower = query.toLowerCase();
                const filtered = allCards.filter(card =>
                    (card.title || '').toLowerCase().includes(lower) ||
                    (card.oneSentence || '').toLowerCase().includes(lower) ||
                    (card.tags || []).some(t => t.toLowerCase().includes(lower))
                );
                renderWikiCardGrid(filtered, gridEl);
            }
        };

        searchBtn.addEventListener('click', doSearch);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doSearch();
        });

        window.scrollTo(0, 0);
    }

    // ═══════════════════════════════════════════════════════════
    // 个人空间 (打卡/热力图/待读/历史/Wiki集成)
    // ═══════════════════════════════════════════════════════════

    async function logCurrentPageReadingRecord() {
        try {
            const url = location.href.replace(/[?#].*$/, '');
            let title = document.title || '未命名内容';
            let author = '未知作者';
            let contentKind = 'article';
            
            if (isPostPage()) {
                contentKind = 'article';
                const titleNode = document.querySelector('.Post-Title');
                if (titleNode) title = titleNode.textContent.trim();
                const authorNode = document.querySelector('.AuthorInfo-name, .AuthorInfo-name .UserLink-link');
                if (authorNode) author = authorNode.textContent.trim();
            } else if (isQuestionPage()) {
                contentKind = 'answer';
                const titleNode = document.querySelector('.QuestionHeader-title');
                if (titleNode) title = titleNode.textContent.trim();
                if (isAnswerUrl()) {
                    const authorNode = document.querySelector('.AuthorInfo-name, .AuthorInfo-name .UserLink-link');
                    if (authorNode) author = authorNode.textContent.trim();
                } else {
                    author = '知乎问答';
                }
            }
            title = title.replace(/\s+-\s+知乎$/, '').replace(/\s+-\s+知乎专栏$/, '');
            await addReadingRecord({
                url,
                title,
                author,
                contentKind,
                readAt: new Date().toISOString(),
                manuallyMarked: false,
                wikiCardId: null,
                duration: 0,
                progress: 0
            });
            startReadingProgressTracker(url);
        } catch (err) {
            console.warn('记录阅读历史失败:', err);
        }
    }

    // 基于原生 window 滚动统计阅读进度（百分比），不依赖任何脚本滚轮代理。
    // 等待沉浸模式完全进入 / 脚本自动滚动停下后才开始统计。
    let _progressTracker = null;

    function computeScrollProgress() {
        const scrollable = getDocumentHeight() - window.innerHeight;
        if (scrollable <= 0) return 100;
        return (window.scrollY / scrollable) * 100;
    }

    function startReadingProgressTracker(url) {
        stopReadingProgressTracker();
        const tracker = { url, max: 0, settled: false, lastSaved: 0, onScroll: null };
        _progressTracker = tracker;

        const flush = () => {
            if (tracker.max > tracker.lastSaved) {
                tracker.lastSaved = tracker.max;
                updateReadingProgress(tracker.url, tracker.max).catch(() => {});
            }
        };

        const sample = () => {
            if (!tracker.settled || _progressTracker !== tracker) return;
            const p = computeScrollProgress();
            if (p > tracker.max) tracker.max = p;
        };

        tracker.onScroll = () => { sample(); };
        // 等待沉浸模式自动滚动（window.scrollTo(0,0) 等）稳定后再开始采样，避免被脚本滚动污染。
        setTimeout(() => {
            if (_progressTracker !== tracker) return;
            tracker.settled = true;
            sample();
            window.addEventListener('scroll', tracker.onScroll, { passive: true });
        }, 900);
        tracker.flushTimer = setInterval(flush, 4000);
        tracker.flush = flush;

        if (!window._zhProgressUnloadHooked) {
            window._zhProgressUnloadHooked = true;
            window.addEventListener('pagehide', () => {
                if (_progressTracker && _progressTracker.flush) _progressTracker.flush();
            });
        }
    }

    function renderProgressCell(progress) {
        const pct = Math.max(0, Math.min(100, Math.round(progress)));
        const done = pct >= 95;
        const barColor = done ? '#4caf50' : 'var(--zh-accent)';
        const label = done ? '✓ 读完' : `${pct}%`;
        return `
            <div style="display:flex; align-items:center; gap:6px;">
                <div style="flex:1; height:6px; border-radius:3px; background:var(--zh-border); overflow:hidden;">
                    <div style="width:${pct}%; height:100%; background:${barColor};"></div>
                </div>
                <span style="font-size:12px; opacity:0.8; min-width:38px; text-align:right; color:${done ? '#4caf50' : 'inherit'};">${label}</span>
            </div>`;
    }

    function stopReadingProgressTracker() {
        const tracker = _progressTracker;
        if (!tracker) return;
        _progressTracker = null;
        if (tracker.onScroll) window.removeEventListener('scroll', tracker.onScroll);
        if (tracker.flushTimer) clearInterval(tracker.flushTimer);
        if (tracker.flush) tracker.flush();
    }


    function calculateReadingStreaks(records) {
        if (!records || !records.length) return { currentStreak: 0, maxStreak: 0, totalDays: 0 };
        
        // Extract unique YYYY-MM-DD local dates
        const datesSet = new Set();
        records.forEach(r => {
            if (r.readAt) {
                const dateStr = r.readAt.split('T')[0];
                datesSet.add(dateStr);
            }
        });
        
        const sortedDates = Array.from(datesSet).sort((a, b) => b.localeCompare(a));
        if (!sortedDates.length) return { currentStreak: 0, maxStreak: 0, totalDays: 0 };
        
        const todayStr = new Date().toISOString().split('T')[0];
        
        const getPrevDateStr = (dateStr) => {
            const d = new Date(dateStr);
            d.setDate(d.getDate() - 1);
            return d.toISOString().split('T')[0];
        };
        
        let currentStreak = 0;
        let checkDate = todayStr;
        
        const hasToday = sortedDates.includes(todayStr);
        const yesterdayStr = getPrevDateStr(todayStr);
        const hasYesterday = sortedDates.includes(yesterdayStr);
        
        if (hasToday) {
            currentStreak = 1;
            checkDate = yesterdayStr;
            while (sortedDates.includes(checkDate)) {
                currentStreak++;
                checkDate = getPrevDateStr(checkDate);
            }
        } else if (hasYesterday) {
            currentStreak = 1;
            checkDate = getPrevDateStr(yesterdayStr);
            while (sortedDates.includes(checkDate)) {
                currentStreak++;
                checkDate = getPrevDateStr(checkDate);
            }
        } else {
            currentStreak = 0;
        }
        
        let maxStreak = 0;
        let tempStreak = 0;
        let prevDate = null;
        
        const ascDates = Array.from(sortedDates).reverse();
        ascDates.forEach(dateStr => {
            if (!prevDate) {
                tempStreak = 1;
            } else {
                const expectedPrev = getPrevDateStr(dateStr);
                if (prevDate === expectedPrev) {
                    tempStreak++;
                } else if (prevDate !== dateStr) {
                    maxStreak = Math.max(maxStreak, tempStreak);
                    tempStreak = 1;
                }
            }
            prevDate = dateStr;
        });
        maxStreak = Math.max(maxStreak, tempStreak);
        
        return {
            currentStreak,
            maxStreak,
            totalDays: sortedDates.length
        };
    }

    function generateHeatmapData(records) {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - 364);
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        
        const countMap = {};
        records.forEach(r => {
            if (r.readAt) {
                const dateStr = typeof r.readAt === 'string'
                    ? r.readAt.split('T')[0]
                    : new Date(r.readAt).toISOString().split('T')[0];
                countMap[dateStr] = (countMap[dateStr] || 0) + 1;
            }
        });
        
        const cells = [];
        const temp = new Date(start);
        for (let i = 0; i < 371; i++) {
            const dateStr = temp.toISOString().split('T')[0];
            const count = countMap[dateStr] || 0;
            
            let level = 0;
            if (count >= 1 && count <= 2) level = 1;
            else if (count >= 3 && count <= 5) level = 2;
            else if (count >= 6 && count <= 9) level = 3;
            else if (count >= 10) level = 4;
            
            cells.push({
                date: dateStr,
                count,
                level
            });
            temp.setDate(temp.getDate() + 1);
        }
        
        return cells;
    }

    function closePersonalSpace() {
        const wrapper = document.getElementById('immersive-wrapper');
        const spaceContainer = document.getElementById('zh-space-container');
        if (!wrapper) return;

        const performCleanAndRestore = () => {
            if (spaceContainer) {
                spaceContainer.style.display = 'none';
                spaceContainer.remove();
            }

            // Restore classes
            if (_personalSpaceBackup.hasTopNav) {
                wrapper.classList.add('zh-has-top-nav');
            } else {
                wrapper.classList.remove('zh-has-top-nav');
            }
            if (_personalSpaceBackup.hasHomeWide) {
                wrapper.classList.add('zh-home-wide');
            } else {
                wrapper.classList.remove('zh-home-wide');
            }

            let siblingCount = 0;
            // 恢复被隐藏的同级元素的原有显示状态
            Array.from(wrapper.children).forEach(child => {
                if (child.id !== 'zh-space-container') {
                    siblingCount++;
                    child.classList.remove('zh-space-hidden');
                    if (child.hasAttribute('data-zh-space-orig-display')) {
                        child.style.display = child.getAttribute('data-zh-space-orig-display');
                        child.removeAttribute('data-zh-space-orig-display');
                    } else {
                        child.style.display = '';
                    }
                }
            });

            // 还原原来的视图状态，保留滚动位置
            const prevPage = _personalSpaceBackup.context || window._zhPrevPageType || 'home';
            const prevView = _personalSpaceBackup.homeView || _personalSpaceBackup.questionView || _personalSpaceBackup.followView || window._zhPrevView || 'list';

            if (_personalSpaceBackup.homeView !== undefined) _homeState.view = _personalSpaceBackup.homeView;
            if (_personalSpaceBackup.questionView !== undefined) _questionState.view = _personalSpaceBackup.questionView;
            if (_personalSpaceBackup.followView !== undefined) _followState.view = _personalSpaceBackup.followView;

            // 容错：如果确实没有任何兄弟节点，则调用传统的重新渲染方法
            if (siblingCount === 0) {
                if (prevPage === 'home') {
                    if (prevView === 'item') {
                        renderHomeItem(_homeState.currentIndexInGroup, _homeState.currentGroupIndex);
                    } else {
                        renderHomeList();
                    }
                } else if (prevPage === 'question') {
                    if (prevView === 'list') {
                        renderQuestionList();
                    } else {
                        renderQuestionAnswer(_questionState.currentIndex, false);
                    }
                } else if (prevPage === 'follow') {
                    renderFollowList();
                } else if (prevPage === 'post') {
                    _homeState.view = '';
                }
            }

            const scrollY = _personalSpaceBackup.scrollTop || window._zhPrevScrollY || 0;
            window.scrollTo(0, scrollY);

            // 重置备份状态
            _personalSpaceBackup = {
                context: '',
                homeView: '',
                questionView: '',
                followView: '',
                scrollTop: 0,
                hasTopNav: false,
                hasHomeWide: false
            };
            window._zhPrevPageType = '';
            window._zhPrevView = '';
            window._zhPrevScrollY = 0;
        };

        if (spaceContainer) {
            spaceContainer.classList.add('zh-space-exit');
            setTimeout(performCleanAndRestore, 250);
        } else {
            performCleanAndRestore();
        }
    }

    function appendSpaceHeader(container, pageType) {
        const title = document.createElement('h1');
        title.className = 'zh-home-title';
        if (pageType === 'follow') {
            title.textContent = '个人空间 · 动态集锦';
        } else if (pageType === 'post') {
            title.textContent = '个人空间 · 专栏阅读';
        } else if (pageType === 'question') {
            title.textContent = '个人空间 · 问答精选';
        } else {
            title.textContent = '个人空间 · 工作台';
        }
        container.appendChild(title);
    }

    async function renderPersonalSpaceDashboard(activeTab = 'dashboard') {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return;

        // 记录进入空间前的原始视图和滚动位置，防止销毁 DOM 导致退出后黑屏/白屏
        if (_homeState.view !== 'personal-space' && _questionState.view !== 'personal-space') {
            const context = isHomePage() ? 'home' : isPostPage() ? 'post' : isQuestionPage() ? 'question' : isFollowPage() ? 'follow' : 'general';
            const view = _homeState.view || _questionState.view || _followState.view || 'list';

            _personalSpaceBackup.context = context;
            _personalSpaceBackup.homeView = _homeState.view || '';
            _personalSpaceBackup.questionView = _questionState.view || '';
            _personalSpaceBackup.followView = _followState.view || '';
            _personalSpaceBackup.scrollTop = window.scrollY;
            _personalSpaceBackup.hasTopNav = wrapper.classList.contains('zh-has-top-nav');
            _personalSpaceBackup.hasHomeWide = wrapper.classList.contains('zh-home-wide');

            window._zhPrevView = view;
            window._zhPrevPageType = context;
            window._zhPrevScrollY = window.scrollY;
        }

        _homeState.view = 'personal-space';

        // 移除原有顶栏，设置宽屏样式
        wrapper.classList.remove('zh-has-top-nav');
        wrapper.classList.add('zh-home-wide');

        // 非破坏性 DOM 挂载：隐藏除空间 container 之外的所有兄弟 DOM 元素，并安全备份 display 属性
        let spaceContainer = document.getElementById('zh-space-container');
        if (!spaceContainer) {
            spaceContainer = document.createElement('div');
            spaceContainer.id = 'zh-space-container';
            wrapper.appendChild(spaceContainer);
        }

        Array.from(wrapper.children).forEach(child => {
            if (child !== spaceContainer) {
                if (!child.hasAttribute('data-zh-space-orig-display')) {
                    child.setAttribute('data-zh-space-orig-display', child.style.display || '');
                }
                child.style.display = 'none';
                child.classList.add('zh-space-hidden');
            }
        });

        spaceContainer.style.display = 'block';
        spaceContainer.innerHTML = '';
        
        const pageType = _personalSpaceBackup.context || window._zhPrevPageType || 'home';
        appendSpaceHeader(spaceContainer, pageType);

        const layout = document.createElement('div');
        layout.className = 'zh-space-layout';

        const sidebar = document.createElement('div');
        sidebar.className = 'zh-space-sidebar';

        const sidebarTitle = document.createElement('div');
        sidebarTitle.className = 'zh-space-sidebar-title';
        sidebarTitle.style.cssText = 'display:flex; flex-direction:column; align-items:center; text-align:center; padding:18px 10px; border-bottom:1px dashed var(--zh-border); margin-bottom:15px; gap:10px;';
        
        const cachedAvatar = crossOriginGet('zh-user-avatar') || '';
        const cachedName = crossOriginGet('zh-user-name') || '个人空间';

        sidebarTitle.innerHTML = `
            <img class="zh-space-avatar" src="${cachedAvatar || 'https://pic1.zhimg.com/v2-ab97017482aa2a5d112b2d282c6b3e39_l.jpg'}" style="width:56px; height:56px; border-radius:50%; border:2px solid var(--zh-accent); box-shadow:0 4px 10px rgba(0,0,0,0.1); object-fit:cover; display:block;" />
            <span class="zh-space-username" style="font-weight:bold; font-size:15px; color:var(--zh-accent); max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block;">${escapeHTML(cachedName)}</span>
        `;
        sidebar.appendChild(sidebarTitle);

        fetchZhihuProfile().then(profile => {
            if (profile) {
                const img = sidebarTitle.querySelector('.zh-space-avatar');
                const span = sidebarTitle.querySelector('.zh-space-username');
                if (img) img.src = profile.avatar_url;
                if (span) span.textContent = profile.name || '个人空间';
            }
        });

        const tabs = [
            { id: 'dashboard', label: '工作台主页', icon: ICONS.home || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>` },
            { id: 'toread_history', label: '待读与历史', icon: ICONS.toread || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>` },
            { id: 'card_library', label: '知识卡片库', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>` },
            { id: 'reading_notes', label: '阅读笔记汇总', icon: ICONS.radar || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>` },
            { id: 'expression_book', label: '表达收藏本', icon: ICONS.expression || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>` },
            { id: 'wiki_history', label: 'Wiki 采集记录', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>` }
        ];

        const tabButtons = {};
        tabs.forEach(tab => {
            const btn = document.createElement('button');
            btn.className = `zh-space-tab-btn ${activeTab === tab.id ? 'is-active' : ''}`;
            btn.innerHTML = `${tab.icon} <span>${tab.label}</span>`;
            btn.addEventListener('click', () => {
                Object.values(tabButtons).forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                renderTabContent(tab.id);
            });
            sidebar.appendChild(btn);
            tabButtons[tab.id] = btn;
        });

        // ═══════════════════════════════════════════════════════════
        // 【UIUX 全局统一】始终在底部显示“返回”按钮，且标签与图标根据当前宿主上下文动态适配
        // ═══════════════════════════════════════════════════════════
        const spacer = document.createElement('div');
        spacer.style.flex = '1';
        sidebar.appendChild(spacer);

        const backBtn = document.createElement('button');
        backBtn.className = 'zh-space-tab-btn';
        backBtn.style.marginTop = 'auto';

        const qView = _personalSpaceBackup.questionView || _questionState.view;
        
        let backLabel = '返回推荐';
        if (pageType === 'post') {
            backLabel = '返回文章';
        } else if (pageType === 'question') {
            backLabel = (qView === 'answer') ? '返回回答' : '返回问答';
        } else if (pageType === 'follow') {
            backLabel = '返回动态';
        }

        backBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> <span>${backLabel}</span>`;
        backBtn.addEventListener('click', closePersonalSpace);
        sidebar.appendChild(backBtn);

        layout.appendChild(sidebar);

        const contentArea = document.createElement('div');
        contentArea.className = 'zh-space-content';
        layout.appendChild(contentArea);
        spaceContainer.appendChild(layout);

        renderTabContent(activeTab);

        async function renderTabContent(tabId) {
            contentArea.innerHTML = '<div style="padding:40px; text-align:center; opacity:0.5;">正在加载...</div>';
            try {
                if (tabId === 'dashboard') {
                    await renderSpaceDashboardTab(contentArea);
                } else if (tabId === 'toread_history') {
                    await renderSpaceToreadHistoryTab(contentArea);
                } else if (tabId === 'card_library') {
                    await renderSpaceCardLibraryTab(contentArea);
                } else if (tabId === 'reading_notes') {
                    await renderSpaceReadingNotesTab(contentArea);
                } else if (tabId === 'expression_book') {
                    await renderSpaceExpressionBookTab(contentArea);
                } else if (tabId === 'wiki_history') {
                    await renderSpaceWikiRunsTab(contentArea);
                }
            } catch (err) {
                contentArea.innerHTML = `<div style="padding:20px; color:red;">渲染失败: ${escapeHTML(err.message)}</div>`;
            }
        }
    }

    async function renderSpaceDashboardTab(container) {
        let allCards = [];
        let allRecords = [];
        let toReadList = [];
        try {
            allCards = await getAllWikiCards();
            allRecords = await getAllReadingRecords();
            toReadList = loadToReadList();
        } catch (e) {
            console.warn('Dashboard 载入数据失败', e);
        }

        container.innerHTML = '';
        const streakInfo = calculateReadingStreaks(allRecords);

        const statsGrid = document.createElement('div');
        statsGrid.className = 'zh-space-stats-grid';
        statsGrid.innerHTML = `
            <div class="zh-space-stat-card">
                <div class="zh-space-stat-val">${streakInfo.currentStreak} 天</div>
                <div class="zh-space-stat-lbl">🔥 当前连续阅读打卡</div>
            </div>
            <div class="zh-space-stat-card">
                <div class="zh-space-stat-val">${streakInfo.maxStreak} 天</div>
                <div class="zh-space-stat-lbl">🏆 历史最长连续打卡</div>
            </div>
            <div class="zh-space-stat-card">
                <div class="zh-space-stat-val">${allRecords.length} 篇</div>
                <div class="zh-space-stat-lbl">📚 累计已读知乎条目</div>
            </div>
            <div class="zh-space-stat-card">
                <div class="zh-space-stat-val">${allCards.length} 张</div>
                <div class="zh-space-stat-lbl">💡 已沉淀 Wiki 知识卡片</div>
            </div>
            <div class="zh-space-stat-card">
                <div class="zh-space-stat-val">${toReadList.length} 篇</div>
                <div class="zh-space-stat-lbl">📌 待读列表文章数</div>
            </div>
        `;
        container.appendChild(statsGrid);

        const heatmapWrapper = document.createElement('div');
        heatmapWrapper.className = 'zh-space-heatmap-wrapper';

        const heatmapHeader = document.createElement('div');
        heatmapHeader.className = 'zh-space-heatmap-header';
        heatmapHeader.innerHTML = `
            <span>📅 知乎阅读热力图 (过去一年)</span>
            <span style="font-size:11px; font-weight:normal; opacity:0.8;">共打卡 ${streakInfo.totalDays} 天</span>
        `;
        heatmapWrapper.appendChild(heatmapHeader);

        const heatmapCells = generateHeatmapData(allRecords);

        const monthsRow = document.createElement('div');
        monthsRow.className = 'zh-space-heatmap-months';
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
        
        const weekMonths = [];
        for (let w = 0; w < 53; w++) {
            const dayIndex = w * 7;
            if (dayIndex < heatmapCells.length) {
                const dateStr = heatmapCells[dayIndex].date;
                const m = parseInt(dateStr.split('-')[1], 10) - 1;
                weekMonths.push(m);
            } else {
                weekMonths.push(-1);
            }
        }
        
        let lastMonth = -1;
        for (let w = 0; w < 53; w++) {
            const currentMonth = weekMonths[w];
            if (currentMonth !== lastMonth && currentMonth !== -1) {
                const monthCol = document.createElement('div');
                monthCol.textContent = monthNames[currentMonth];
                monthCol.style.gridColumnStart = w + 1;
                monthCol.style.gridColumnEnd = `span 4`;
                monthCol.style.whiteSpace = 'nowrap';
                monthsRow.appendChild(monthCol);
                lastMonth = currentMonth;
            }
        }
        heatmapWrapper.appendChild(monthsRow);

        const gridContainer = document.createElement('div');
        gridContainer.className = 'zh-space-heatmap-grid-container';

        const weekdaysCol = document.createElement('div');
        weekdaysCol.className = 'zh-space-heatmap-weekdays';
        weekdaysCol.innerHTML = `
            <span>日</span>
            <span></span>
            <span>二</span>
            <span></span>
            <span>四</span>
            <span></span>
            <span>六</span>
        `;
        gridContainer.appendChild(weekdaysCol);

        const grid = document.createElement('div');
        grid.className = 'zh-space-heatmap-grid';

        heatmapCells.forEach(cell => {
            const cellEl = document.createElement('div');
            cellEl.className = `zh-space-heatmap-day ${cell.level ? 'level-' + cell.level : ''}`;
            cellEl.title = `${cell.date} : 阅读 ${cell.count} 篇`;
            grid.appendChild(cellEl);
        });
        gridContainer.appendChild(grid);
        heatmapWrapper.appendChild(gridContainer);
        container.appendChild(heatmapWrapper);

        const motivation = document.createElement('div');
        motivation.className = 'zh-callout zh-callout-tip';
        motivation.style.margin = '20px 0';
        motivation.innerHTML = `
            <div class="zh-callout-title">💡 沉浸式思考与阅读</div>
            <div class="zh-callout-content">
                “学而不思则罔，思而不学则殆。” 连续打卡不仅是坚持的体现，更是在卡片库中不断沉淀思考、积累智慧的轨迹。今天你沉淀出知识卡片了吗？
            </div>
        `;
        container.appendChild(motivation);
    }

    function parseZhihuUrl(url) {
        url = url.trim();
        const res = {
            url,
            title: '手动添加的内容',
            author: '知乎',
            type: '知乎链接',
            addedAt: new Date().toISOString()
        };
        
        try {
            if (url.includes('zhuanlan.zhihu.com/p/')) {
                res.type = '专栏文章';
                res.contentKind = 'article';
                const match = url.match(/\/p\/(\d+)/);
                if (match) res.title = `知乎专栏文章 #${match[1]}`;
            } else if (url.includes('/answer/')) {
                res.type = '回答';
                res.contentKind = 'answer';
                const match = url.match(/\/question\/(\d+)\/answer\/(\d+)/);
                if (match) res.title = `知乎回答 #${match[2]}`;
            } else if (url.includes('/question/')) {
                res.type = '问题';
                res.contentKind = 'answer';
                const match = url.match(/\/question\/(\d+)/);
                if (match) res.title = `知乎问题 #${match[1]}`;
            }
        } catch (err) {}
        return res;
    }

    async function renderSpaceToreadHistoryTab(container) {
        container.innerHTML = '';
        let subTab = 'toread';
        
        const cardHeader = document.createElement('div');
        cardHeader.className = 'zh-space-table-actions';
        cardHeader.style.borderBottom = '1px dashed var(--zh-border)';
        cardHeader.style.paddingBottom = '10px';
        cardHeader.style.marginBottom = '16px';
        
        const subTabSwitch = document.createElement('div');
        subTabSwitch.style.display = 'flex';
        subTabSwitch.style.gap = '10px';
        
        const toReadBtn = document.createElement('button');
        toReadBtn.className = 'zh-inline-btn zh-btn-active';
        toReadBtn.textContent = '稍后待读列表';
        
        const historyBtn = document.createElement('button');
        historyBtn.className = 'zh-inline-btn';
        historyBtn.textContent = '已读历史记录';
        
        toReadBtn.addEventListener('click', () => {
            subTab = 'toread';
            toReadBtn.classList.add('zh-btn-active');
            historyBtn.classList.remove('zh-btn-active');
            renderListArea();
        });
        
        historyBtn.addEventListener('click', () => {
            subTab = 'history';
            historyBtn.classList.add('zh-btn-active');
            toReadBtn.classList.remove('zh-btn-active');
            renderListArea();
        });
        
        subTabSwitch.appendChild(toReadBtn);
        subTabSwitch.appendChild(historyBtn);
        cardHeader.appendChild(subTabSwitch);
        
        const manualEntryDiv = document.createElement('div');
        manualEntryDiv.style.display = 'flex';
        manualEntryDiv.style.gap = '8px';
        manualEntryDiv.style.alignItems = 'center';
        
        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.placeholder = '输入知乎文章/回答 URL...';
        urlInput.style.cssText = 'padding: 0 12px; font-size: 13px; height: 34px; box-sizing: border-box; border: 1px solid var(--zh-border); border-radius: 4px; background: var(--zh-paper); color: var(--zh-text); width: 220px; outline: none; transition: border-color 0.15s ease;';
        
        const addBtn = document.createElement('button');
        addBtn.className = 'zh-inline-btn';
        addBtn.textContent = '添加待读';
        addBtn.addEventListener('click', () => {
            const val = urlInput.value.trim();
            if (!val) return alert('请输入知乎链接');
            if (!val.startsWith('http://') && !val.startsWith('https://')) return alert('链接格式不正确');
            
            const parsed = parseZhihuUrl(val);
            const list = loadToReadList();
            if (list.some(item => item.url === parsed.url)) {
                alert('该链接已在待读列表中！');
                return;
            }
            list.unshift(parsed);
            saveToReadList(list);
            urlInput.value = '';
            showToast('添加成功');
            if (subTab === 'toread') renderListArea();
        });
        
        manualEntryDiv.appendChild(urlInput);
        manualEntryDiv.appendChild(addBtn);
        cardHeader.appendChild(manualEntryDiv);
        
        container.appendChild(cardHeader);
        
        const listArea = document.createElement('div');
        container.appendChild(listArea);
        
        renderListArea();
        
        async function renderListArea() {
            listArea.innerHTML = '<div style="opacity:0.5; padding:20px;">正在加载列表...</div>';
            
            if (subTab === 'toread') {
                const items = loadToReadList();
                if (!items.length) {
                    listArea.innerHTML = `<div style="padding:40px; text-align:center; opacity:0.5;">待读列表为空。在文章阅读页点击书签图标或在此处手动添加。</div>`;
                    return;
                }
                
                listArea.innerHTML = `
                    <div class="zh-space-table-actions">
                        <span style="font-size:13px; opacity:0.8;">共 ${items.length} 条待读内容</span>
                        <div style="display:flex; gap:8px;">
                            <button id="zh-batch-wiki-toread" class="zh-inline-btn" style="background:var(--zh-accent); color:var(--zh-paper);">🤖 所选进行 Wiki 采集</button>
                            <button id="zh-clear-toread" class="zh-inline-btn">清空待读</button>
                        </div>
                    </div>
                    <div class="zh-space-table-wrap">
                        <table class="zh-space-table">
                            <thead>
                                <tr>
                                    <th style="width: 40px; text-align: center;"><input type="checkbox" id="zh-toread-select-all"></th>
                                    <th>标题</th>
                                    <th>作者</th>
                                    <th>类型</th>
                                    <th>添加时间</th>
                                    <th style="width: 80px; text-align: center;">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map((item, index) => `
                                    <tr>
                                        <td style="text-align: center;"><input type="checkbox" class="zh-toread-checkbox" data-index="${index}"></td>
                                        <td><a href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--zh-accent); text-decoration:none; font-weight:bold;">${escapeHTML(item.title)}</a></td>
                                        <td>${escapeHTML(item.author || '未知')}</td>
                                        <td><span class="zh-home-card-type">${escapeHTML(item.type || '未指定')}</span></td>
                                        <td style="font-size:12px; opacity:0.75;">${item.addedAt ? new Date(item.addedAt).toLocaleString() : '未知'}</td>
                                        <td style="text-align: center;">
                                            <button class="zh-inline-btn zh-toread-delete" data-index="${index}" style="padding:2px 6px; font-size:12px;">移除</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                
                const selectAll = document.getElementById('zh-toread-select-all');
                const checkboxes = listArea.querySelectorAll('.zh-toread-checkbox');
                selectAll.addEventListener('change', () => {
                    checkboxes.forEach(cb => cb.checked = selectAll.checked);
                });
                
                listArea.querySelectorAll('.zh-toread-delete').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.dataset.index, 10);
                        const list = loadToReadList();
                        if (idx >= 0 && idx < list.length) {
                            list.splice(idx, 1);
                            saveToReadList(list);
                            showToast('已移除');
                            renderListArea();
                        }
                    });
                });
                
                document.getElementById('zh-clear-toread').addEventListener('click', () => {
                    if (confirm('确认清空待读列表？')) {
                        saveToReadList([]);
                        showToast('已清空');
                        renderListArea();
                    }
                });
                
                document.getElementById('zh-batch-wiki-toread').addEventListener('click', () => {
                    const selected = [];
                    checkboxes.forEach(cb => {
                        if (cb.checked) {
                            const idx = parseInt(cb.dataset.index, 10);
                            selected.push(items[idx]);
                        }
                    });
                    
                    if (!selected.length) {
                        alert('请先选择要采集的待读条目！');
                        return;
                    }
                    
                    startWikiRun(selected);
                });
                
            } else {
                let records = [];
                try {
                    records = await getAllReadingRecords();
                } catch (err) {
                    listArea.innerHTML = `<div style="color:red; padding:20px;">读取历史记录失败: ${err.message}</div>`;
                    return;
                }
                
                if (!records.length) {
                    listArea.innerHTML = `<div style="padding:40px; text-align:center; opacity:0.5;">未发现已读历史记录。在沉浸模式下阅读文章/回答，即可自动记录阅读打卡轨迹。</div>`;
                    return;
                }
                
                listArea.innerHTML = `
                    <div class="zh-space-table-actions">
                        <span style="font-size:13px; opacity:0.8;">共 ${records.length} 条已读历史记录</span>
                        <div style="display:flex; gap:8px;">
                            <button id="zh-batch-wiki-history" class="zh-inline-btn" style="background:var(--zh-accent); color:var(--zh-paper);">🤖 所选进行 Wiki 采集</button>
                            <button id="zh-clear-history" class="zh-inline-btn">清空历史</button>
                        </div>
                    </div>
                    <div class="zh-space-table-wrap">
                        <table class="zh-space-table">
                            <thead>
                                <tr>
                                    <th style="width: 40px; text-align: center;"><input type="checkbox" id="zh-history-select-all"></th>
                                    <th>标题</th>
                                    <th>作者</th>
                                    <th>品类</th>
                                    <th style="width: 130px;">阅读进度</th>
                                    <th>阅读打卡时间</th>
                                    <th style="width: 80px; text-align: center;">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${records.map((r, index) => `
                                    <tr>
                                        <td style="text-align: center;"><input type="checkbox" class="zh-history-checkbox" data-index="${index}"></td>
                                        <td><a href="${escapeHTML(r.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--zh-accent); text-decoration:none; font-weight:bold;">${escapeHTML(r.title)}</a></td>
                                        <td>${escapeHTML(r.author || '未知')}</td>
                                        <td><span class="zh-home-card-type" style="background: rgba(122,92,216,0.1); color: var(--zh-accent);">${escapeHTML(r.contentKind === 'article' ? '文章' : r.contentKind === 'answer' ? '回答' : '页面')}</span></td>
                                        <td>${renderProgressCell(r.progress || 0)}</td>
                                        <td style="font-size:12px; opacity:0.75;">${r.readAt ? new Date(r.readAt).toLocaleString() : '未知'}</td>
                                        <td style="text-align: center;">
                                            <button class="zh-inline-btn zh-history-delete" data-url="${escapeHTML(r.url)}" style="padding:2px 6px; font-size:12px;">删除</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                
                const selectAll = document.getElementById('zh-history-select-all');
                const checkboxes = listArea.querySelectorAll('.zh-history-checkbox');
                selectAll.addEventListener('change', () => {
                    checkboxes.forEach(cb => cb.checked = selectAll.checked);
                });
                
                listArea.querySelectorAll('.zh-history-delete').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const url = btn.dataset.url;
                        if (confirm('确认删除此条历史记录？')) {
                            try {
                                await deleteReadingRecord(url);
                                showToast('已删除');
                                renderListArea();
                            } catch (e) {
                                alert('删除失败: ' + e.message);
                            }
                        }
                    });
                });
                
                document.getElementById('zh-clear-history').addEventListener('click', async () => {
                    if (confirm('重要提示：这将清空所有的阅读记录，会影响打卡天数 and 热力图绘制！确认继续清空？')) {
                        try {
                            await clearAllReadingRecords();
                            showToast('已清空所有历史');
                            renderListArea();
                        } catch (e) {
                            alert('清空失败: ' + e.message);
                        }
                    }
                });
                
                document.getElementById('zh-batch-wiki-history').addEventListener('click', () => {
                    const selected = [];
                    checkboxes.forEach(cb => {
                        if (cb.checked) {
                            const idx = parseInt(cb.dataset.index, 10);
                            selected.push(records[idx]);
                        }
                    });
                    
                    if (!selected.length) {
                        alert('请先选择要采集的历史条目！');
                        return;
                    }
                    
                    startWikiRun(selected);
                });
            }
        }
    }

    async function renderSpaceCardLibraryTab(container) {
        container.innerHTML = '';
        const searchBar = document.createElement('div');
        searchBar.className = 'zh-wiki-search-bar';
        searchBar.style.margin = '0 0 16px 0';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '输入关键词或进行语义搜索...';
        
        const searchBtn = document.createElement('button');
        searchBtn.textContent = '搜索';
        
        searchBar.appendChild(searchInput);
        searchBar.appendChild(searchBtn);
        container.appendChild(searchBar);

        const tagCloudEl = document.createElement('div');
        tagCloudEl.className = 'zh-wiki-tag-cloud';
        tagCloudEl.style.marginBottom = '16px';
        tagCloudEl.innerHTML = '<span style="opacity:0.5;">加载标签中...</span>';
        container.appendChild(tagCloudEl);

        const gridEl = document.createElement('div');
        gridEl.className = 'zh-wiki-card-grid';
        gridEl.innerHTML = '<div style="padding:20px;opacity:0.5;">加载卡片中...</div>';
        container.appendChild(gridEl);

        let allCards = [];
        let allTags = [];
        let activeTag = null;

        try {
            allCards = await getAllWikiCards();
            allTags = await getAllTags();
        } catch (err) {
            gridEl.innerHTML = `<div style="padding:20px;color:red;">加载失败：${escapeHTML(err.message)}</div>`;
            return;
        }

        allCards.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        tagCloudEl.innerHTML = '';
        if (allTags.length) {
            const allChip = document.createElement('span');
            allChip.className = 'zh-wiki-tag-chip active';
            allChip.innerHTML = `全部 <span class="zh-tag-count">${allCards.length}</span>`;
            allChip.addEventListener('click', () => {
                activeTag = null;
                tagCloudEl.querySelectorAll('.zh-wiki-tag-chip').forEach(c => c.classList.remove('active'));
                allChip.classList.add('active');
                renderWikiCardGrid(allCards, gridEl);
            });
            tagCloudEl.appendChild(allChip);

            allTags
                .sort((a, b) => b.count - a.count)
                .slice(0, 30)
                .forEach(tagRecord => {
                    const chip = document.createElement('span');
                    chip.className = 'zh-wiki-tag-chip';
                    chip.innerHTML = `${escapeHTML(tagRecord.tag)} <span class="zh-tag-count">${tagRecord.count}</span>`;
                    chip.addEventListener('click', async () => {
                        activeTag = tagRecord.tag;
                        tagCloudEl.querySelectorAll('.zh-wiki-tag-chip').forEach(c => c.classList.remove('active'));
                        chip.classList.add('active');
                        try {
                            const filtered = await getWikiCardsByTag(tagRecord.tag);
                            filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                            renderWikiCardGrid(filtered, gridEl);
                        } catch (err) {
                            gridEl.innerHTML = `<div style="padding:20px;color:red;">筛选失败</div>`;
                        }
                    });
                    tagCloudEl.appendChild(chip);
                });
        } else {
            tagCloudEl.innerHTML = '<span style="opacity:0.5;">暂无标签</span>';
        }

        renderWikiCardGrid(allCards, gridEl);

        const doSearch = async () => {
            const query = searchInput.value.trim();
            if (!query) {
                renderWikiCardGrid(activeTag ? await getWikiCardsByTag(activeTag) : allCards, gridEl);
                return;
            }
            const embeddingHost = (config.embeddingHost || config.apiHost || '').trim();
            const embeddingKey = (config.embeddingKey || config.apiKey || '').trim();
            if (!embeddingHost || !embeddingKey) {
                const lower = query.toLowerCase();
                const filtered = allCards.filter(card =>
                    (card.title || '').toLowerCase().includes(lower) ||
                    (card.oneSentence || '').toLowerCase().includes(lower) ||
                    (card.tags || []).some(t => t.toLowerCase().includes(lower))
                );
                renderWikiCardGrid(filtered, gridEl);
                return;
            }
            gridEl.innerHTML = '<div style="padding:20px;opacity:0.5;">正在计算语义搜索...</div>';
            try {
                const embeddings = await callEmbeddingAPI([query]);
                if (!embeddings || !embeddings[0]) throw new Error('未获取到查询向量');
                const results = await searchByEmbedding(embeddings[0], 20);
                renderWikiCardGrid(results.map(r => r.card), gridEl);
            } catch (err) {
                const lower = query.toLowerCase();
                const filtered = allCards.filter(card =>
                    (card.title || '').toLowerCase().includes(lower) ||
                    (card.oneSentence || '').toLowerCase().includes(lower) ||
                    (card.tags || []).some(t => t.toLowerCase().includes(lower))
                );
                renderWikiCardGrid(filtered, gridEl);
            }
        };

        searchBtn.addEventListener('click', doSearch);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doSearch();
        });
    }

    function showWikiLaunchModal(onConfirm) {
        if (document.getElementById('zh-wiki-launch-modal')) return;
        createModal('zh-wiki-launch-modal', '首页信息流 Wiki · 启动设置', `
            <label style="display:block; margin-bottom:5px;">采集条数:</label>
            <input type="number" id="zh-launch-wiki-max" min="1" value="${config.wikiMaxItems || 100}" style="width:100%; margin-bottom:10px; box-sizing:border-box;">
            <label style="display:block; margin-bottom:5px;">AI 并发数 (0 为不限):</label>
            <input type="number" id="zh-launch-wiki-concurrency" min="0" value="${config.wikiConcurrency ?? 20}" style="width:100%; margin-bottom:10px; box-sizing:border-box;">
            <label style="display:block; margin-bottom:5px;">AI RPM (0 为不限):</label>
            <input type="number" id="zh-launch-wiki-rpm" min="0" value="${config.wikiRpm ?? 300}" style="width:100%; margin-bottom:10px; box-sizing:border-box;">
            <label style="display:block; margin-bottom:5px; cursor:pointer;"><input type="checkbox" id="zh-launch-wiki-final" ${config.wikiFinalSynthesis !== false ? 'checked' : ''}> 生成今日总览</label>
            <label style="display:block; margin-bottom:12px; cursor:pointer;"><input type="checkbox" id="zh-launch-wiki-obsidian" ${config.wikiObsidianOptimized === true ? 'checked' : ''}> Obsidian 导出格式优化 (使用 Frontmatter 与 Callouts)</label>
            <button id="zh-launch-wiki-start" class="zh-inline-btn" style="background:var(--zh-accent); color:var(--zh-paper); width:100%;">开始采集</button>
        `);
        document.getElementById('zh-launch-wiki-start').addEventListener('click', () => {
            saveConfig({
                wikiMaxItems: getFormNumber('zh-launch-wiki-max', 100, 1),
                wikiConcurrency: getFormNumber('zh-launch-wiki-concurrency', 20, 0),
                wikiRpm: getFormNumber('zh-launch-wiki-rpm', 300, 0),
                wikiFinalSynthesis: document.getElementById('zh-launch-wiki-final').checked,
                wikiObsidianOptimized: document.getElementById('zh-launch-wiki-obsidian').checked
            });
            document.getElementById('zh-wiki-launch-modal')?.remove();
            onConfirm();
        });
    }

    async function renderSpaceWikiRunsTab(container) {
        container.innerHTML = '';
        const statusSection = document.createElement('section');
        statusSection.className = 'zh-wiki-history';
        statusSection.style.marginBottom = '20px';
        
        const statusTitle = document.createElement('h3');
        statusTitle.textContent = '当前 Wiki 采集任务';
        statusTitle.style.marginBottom = '12px';
        statusSection.appendChild(statusTitle);
        
        const status = document.createElement('div');
        status.id = 'zh-wiki-progress';
        status.className = 'zh-wiki-progress';
        status.style.marginBottom = '12px';
        
        if (wikiState.running) {
            status.textContent = `信息流 Wiki：${wikiState.progressMessage || '正在运行...'}`;
        } else if (wikiState.finished && wikiState.markdown) {
            status.textContent = `信息流 Wiki：上一次运行已完成，共 ${wikiState.items.length || 0} 条。`;
        } else {
            status.textContent = '信息流 Wiki：未在运行。您可以在“待读与历史”页面中勾选并触发手动采集，或在此开始自动采集首页推荐。';
        }
        statusSection.appendChild(status);
        
        const actions = document.createElement('div');
        actions.className = 'zh-wiki-actions';
        actions.style.marginBottom = '12px';
        
        if (!wikiState.running) {
            actions.appendChild(createWikiActionButton('开始新采集 (知乎首页推荐)', () => {
                if (!isHomePage()) {
                    alert('自动采集知乎首页推荐只能在知乎首页推荐页运行。若需在其他页面运行，请使用“待读与历史”中的勾选采集功能。');
                    return;
                }
                showWikiLaunchModal(() => startWikiRun());
            }));
        } else {
            actions.appendChild(createWikiActionButton(wikiState.paused ? '恢复任务' : '暂停任务', () => {
                setWikiPaused(!wikiState.paused);
                renderPersonalSpaceDashboard('wiki_history');
            }));
            actions.appendChild(createWikiActionButton('刷新进度', () => renderPersonalSpaceDashboard('wiki_history')));
        }
        
        if (wikiState.finished && wikiState.markdown) {
            actions.appendChild(createWikiActionButton('查看本次结果', () => renderWikiResult(wikiState.markdown)));
        }
        
        statusSection.appendChild(actions);
        
        if (wikiState.running || wikiState.log?.length) {
            statusSection.appendChild(renderWikiLog());
        }
        
        container.appendChild(statusSection);
        
        renderWikiHistory(container);
    }

    async function fetchZhihuProfile() {
        try {
            const url = 'https://www.zhihu.com/api/v4/me';
            const xhr = getUserscriptXHR();
            let data;
            if (xhr && !url.startsWith(location.origin)) {
                data = await new Promise((resolve, reject) => {
                    xhr({
                        method: 'GET', url, timeout: 10000, anonymous: false,
                        headers: { 'Accept': 'application/json' },
                        onload: res => {
                            if (res.status >= 200 && res.status < 300) {
                                try { resolve(JSON.parse(res.responseText)); } catch (e) { reject(e); }
                            } else { reject(new Error(`HTTP ${res.status}`)); }
                        },
                        onerror: () => reject(new Error('network error')),
                        ontimeout: () => reject(new Error('timeout'))
                    });
                });
            } else {
                const res = await fetch(url);
                if (!res.ok) throw new Error('Zhihu API Error');
                data = await res.json();
            }
            if (data && data.avatar_url) {
                crossOriginSet('zh-user-avatar', data.avatar_url);
                crossOriginSet('zh-user-name', data.name || '个人空间');
                return data;
            }
        } catch (e) {
            console.warn('获取知乎个人资料 API 失败', e);
        }
        return null;
    }

    async function renderSpaceReadingNotesTab(container) {
        container.innerHTML = '';
        const items = loadRadarReportBook();

        const actions = document.createElement('div');
        actions.className = 'zh-space-table-actions';
        actions.innerHTML = `
            <div style="display:flex; gap:8px;">
                <button id="zh-space-radar-copy" class="zh-inline-btn">复制 Markdown</button>
                <button id="zh-space-radar-download-md" class="zh-inline-btn">下载 Markdown</button>
                <button id="zh-space-radar-download-json" class="zh-inline-btn">下载 JSON</button>
            </div>
            <button id="zh-space-radar-clear" class="zh-inline-btn" style="border-color:red; color:red;">清空全部</button>
        `;
        container.appendChild(actions);

        const countInfo = document.createElement('div');
        countInfo.style.cssText = 'font-size:13px; opacity:0.75; margin-bottom:16px;';
        countInfo.textContent = `共记录了 ${items.length} 篇阅读笔记。`;
        container.appendChild(countInfo);

        const listContainer = document.createElement('div');
        listContainer.style.cssText = 'display:flex; flex-direction:column; gap:16px;';

        if (items.length === 0) {
            listContainer.innerHTML = '<div style="padding:40px; text-align:center; opacity:0.5;">阅读笔记本还是空的哦。在文章页或问答页点击右侧工具栏的雷达图标，即可让 AI 辅助生成阅读笔记！</div>';
        } else {
            items.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'zh-space-stat-card';
                card.style.cssText = 'text-align:left; display:flex; flex-direction:column; gap:10px; padding:20px;';

                const depthLabel = { skim: '略读', read: '细读', study: '精读', skip: '跳过' }[item.depth] || item.depth || '略读';
                const relevanceScore = item.relevance ?? 50;

                const header = document.createElement('div');
                header.style.cssText = 'display:flex; justify-content:space-between; align-items:flex-start; gap:10px;';
                header.innerHTML = `
                    <div style="font-weight:bold; font-size:16px; color:var(--zh-title);">${index + 1}. [${escapeHTML(item.archetype || '')}] ${escapeHTML(item.oneliner || item.title || '')}</div>
                    <button class="zh-inline-btn delete-btn" style="border-color:rgba(255,0,0,0.3); color:red; padding:2px 8px; font-size:12px;">删除</button>
                `;

                header.querySelector('.delete-btn').addEventListener('click', () => {
                    if (!confirm('确认删除该笔记？')) return;
                    const book = loadRadarReportBook();
                    const filtered = book.filter(x => x.sourceKey !== item.sourceKey);
                    saveRadarReportBook(filtered);
                    renderPersonalSpaceDashboard('reading_notes');
                });

                card.appendChild(header);

                const impression = document.createElement('div');
                impression.style.cssText = 'padding-left:12px; border-left:3px solid var(--zh-accent); color:var(--zh-text); line-height:1.7; margin:8px 0;';
                impression.textContent = item.impression || '';
                card.appendChild(impression);

                const footer = document.createElement('div');
                footer.style.cssText = 'display:flex; justify-content:space-between; align-items:center; font-size:12px; opacity:0.75; flex-wrap:wrap; gap:8px;';
                
                const tags = (item.tags || []).map(t => `<span style="display:inline-block; margin-right:6px; padding:1px 6px; border-radius:3px; background:var(--zh-code); color:var(--zh-accent);">#${escapeHTML(t)}</span>`).join('');

                footer.innerHTML = `
                    <div>
                        <span style="font-weight:bold; color:var(--zh-accent); margin-right:12px;">📖 ${depthLabel}</span>
                        <span style="margin-right:12px;">⭐ 相关度: ${relevanceScore}%</span>
                        ${item.savedAt ? `<span>📅 ${new Date(item.savedAt).toLocaleString()}</span>` : ''}
                    </div>
                    <div>${tags}</div>
                `;
                card.appendChild(footer);

                if (item.url) {
                    const urlEl = document.createElement('div');
                    urlEl.style.cssText = 'font-size:12px; opacity:0.5; word-break:break-all; cursor:pointer; text-decoration:underline;';
                    urlEl.textContent = item.url;
                    urlEl.addEventListener('click', () => window.open(item.url, '_blank'));
                    card.appendChild(urlEl);
                }

                listContainer.appendChild(card);
            });
        }
        container.appendChild(listContainer);

        // Bind events
        document.getElementById('zh-space-radar-copy')?.addEventListener('click', async () => {
            await navigator.clipboard.writeText(formatRadarReportBookMarkdown(loadRadarReportBook()));
            showToast('已成功复制 Markdown 到剪贴板！');
        });
        document.getElementById('zh-space-radar-download-md')?.addEventListener('click', () => {
            downloadTextFile(`zhihu-radar-report-book-${new Date().toISOString().slice(0, 10)}.md`, formatRadarReportBookMarkdown(loadRadarReportBook()), 'text/markdown;charset=utf-8');
        });
        document.getElementById('zh-space-radar-download-json')?.addEventListener('click', () => {
            downloadTextFile(`zhihu-radar-report-book-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(loadRadarReportBook(), null, 2), 'application/json;charset=utf-8');
        });
        document.getElementById('zh-space-radar-clear')?.addEventListener('click', () => {
            if (!confirm('确定要清空所有的阅读笔记吗？该操作不可撤销！')) return;
            saveRadarReportBook([]);
            renderPersonalSpaceDashboard('reading_notes');
        });
    }

    async function renderSpaceExpressionBookTab(container) {
        container.innerHTML = '';
        const items = loadExpressionBook();

        const actions = document.createElement('div');
        actions.className = 'zh-space-table-actions';
        actions.innerHTML = `
            <div style="display:flex; gap:8px;">
                <button id="zh-space-expr-copy" class="zh-inline-btn">复制 Markdown</button>
                <button id="zh-space-expr-download-md" class="zh-inline-btn">下载 Markdown</button>
                <button id="zh-space-expr-download-json" class="zh-inline-btn">下载 JSON</button>
            </div>
            <button id="zh-space-expr-clear" class="zh-inline-btn" style="border-color:red; color:red;">清空全部</button>
        `;
        container.appendChild(actions);

        const countInfo = document.createElement('div');
        countInfo.style.cssText = 'font-size:13px; opacity:0.75; margin-bottom:16px;';
        countInfo.textContent = `共记录了 ${items.length} 条表达收藏。`;
        container.appendChild(countInfo);

        const listContainer = document.createElement('div');
        listContainer.style.cssText = 'display:flex; flex-direction:column; gap:16px;';

        if (items.length === 0) {
            listContainer.innerHTML = '<div style="padding:40px; text-align:center; opacity:0.5;">表达收藏本还是空的哦。在沉浸阅读模式下，选中任何中/英文文本划词，右键选择“加入表达收藏本”，即可在此回看和学习！</div>';
        } else {
            items.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'zh-space-stat-card';
                card.style.cssText = 'text-align:left; display:flex; flex-direction:column; gap:10px; padding:20px;';

                const header = document.createElement('div');
                header.style.cssText = 'display:flex; justify-content:space-between; align-items:flex-start; gap:10px;';
                header.innerHTML = `
                    <div style="font-weight:bold; font-size:16px; color:var(--zh-accent);">${index + 1}. ${escapeHTML(item.selectedText || '')}</div>
                    <button class="zh-inline-btn delete-btn" style="border-color:rgba(255,0,0,0.3); color:red; padding:2px 8px; font-size:12px;">删除</button>
                `;

                header.querySelector('.delete-btn').addEventListener('click', () => {
                    if (!confirm('确认删除该条表达收藏？')) return;
                    const book = loadExpressionBook();
                    const filtered = book.filter((_, idx) => idx !== index);
                    saveExpressionBook(filtered);
                    renderPersonalSpaceDashboard('expression_book');
                });

                card.appendChild(header);

                const details = document.createElement('div');
                details.style.cssText = 'font-size:13px; opacity:0.75; margin-bottom:4px;';
                details.textContent = `${item.title || ''} ${item.savedAt ? ' · ' + new Date(item.savedAt).toLocaleString() : ''}`;
                card.appendChild(details);

                const srcBox = document.createElement('div');
                srcBox.style.cssText = 'margin-top:6px;';
                srcBox.innerHTML = `<strong>原文段落：</strong>${escapeHTML(item.sourceText || '')}`;
                card.appendChild(srcBox);

                const trBox = document.createElement('div');
                trBox.style.cssText = 'margin-top:6px;';
                trBox.innerHTML = `<strong>对照译文：</strong>${escapeHTML(item.translatedText || '暂无对照译文')}`;
                card.appendChild(trBox);

                if (item.annotation) {
                    const annBox = document.createElement('div');
                    annBox.style.cssText = 'margin-top:6px; color:var(--zh-accent); padding:8px 12px; background:var(--zh-quote); border-radius:4px; font-size:13.5px;';
                    annBox.innerHTML = `<strong>AI 批注：</strong>${escapeHTML(item.annotation)}`;
                    card.appendChild(annBox);
                }

                listContainer.appendChild(card);
            });
        }
        container.appendChild(listContainer);

        // Bind events
        document.getElementById('zh-space-expr-copy')?.addEventListener('click', async () => {
            await navigator.clipboard.writeText(formatExpressionBookMarkdown(loadExpressionBook()));
            showToast('已成功复制 Markdown 到剪贴板！');
        });
        document.getElementById('zh-space-expr-download-md')?.addEventListener('click', () => {
            downloadTextFile(`zhihu-expression-book-${new Date().toISOString().slice(0, 10)}.md`, formatExpressionBookMarkdown(loadExpressionBook()), 'text/markdown;charset=utf-8');
        });
        document.getElementById('zh-space-expr-download-json')?.addEventListener('click', () => {
            downloadTextFile(`zhihu-expression-book-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(loadExpressionBook(), null, 2), 'application/json;charset=utf-8');
        });
        document.getElementById('zh-space-expr-clear')?.addEventListener('click', () => {
            if (!confirm('确定要清空所有的表达收藏吗？该操作不可撤销！')) return;
            saveExpressionBook([]);
            renderPersonalSpaceDashboard('expression_book');
        });
    }


// ═══════════════════════════════════════════════════════════
// 模块: toolbar.js
// ═══════════════════════════════════════════════════════════
    function createQuestionToolsPanel() {
        if (document.getElementById('zh-tools-panel')) return;
        const toolsPanel = document.createElement('div');
        toolsPanel.id = 'zh-tools-panel';

        const translateBtn = document.createElement('button');
        translateBtn.id = 'zh-translate-btn';
        translateBtn.className = 'zh-square-btn';
        translateBtn.title = '展开/隐藏 翻译卡片 (T)';
        translateBtn.innerHTML = ICONS.translate;
        translateBtn.addEventListener('click', () => {
            window._trVisible = !window._trVisible;
            document.body.classList.toggle('zh-show-tr', window._trVisible);
            if (window._trVisible) {
                translateBtn.classList.add('zh-btn-active');
                processTranslation();
            } else {
                translateBtn.classList.remove('zh-btn-active');
            }
        });

        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'zh-square-btn';
        settingsBtn.title = '设置 (API及偏好)';
        settingsBtn.innerHTML = ICONS.settings;
        settingsBtn.addEventListener('click', showSettingsModal);

        const expressionBtn = document.createElement('button');
        expressionBtn.className = 'zh-square-btn';
        expressionBtn.title = '表达收藏本';
        expressionBtn.innerHTML = ICONS.expression;
        expressionBtn.addEventListener('click', showExpressionBookModal);

        const radarBtn = document.createElement('button');
        radarBtn.className = 'zh-square-btn';
        radarBtn.title = '阅读笔记';
        radarBtn.innerHTML = ICONS.radar;
        radarBtn.addEventListener('click', showRadarReportModal);

        const shareBtn = document.createElement('button');
        shareBtn.id = 'zh-share-btn';
        shareBtn.className = 'zh-square-btn';
        shareBtn.title = '零损分享';
        shareBtn.innerHTML = ICONS.share;
        if (isHomePage() || isFollowPage()) {
            shareBtn.classList.add('zh-btn-disabled');
            shareBtn.title = '零损分享 (当前页面不可用)';
        }
        shareBtn.addEventListener('click', () => {
            if (isHomePage() || isFollowPage()) {
                showToast('零损分享目前仅支持文章正文或回答单篇阅读页哦~');
            } else {
                runZeroLossShare();
            }
        });

        const spaceBtn = document.createElement('button');
        spaceBtn.id = 'zh-space-btn';
        spaceBtn.className = 'zh-square-btn';
        spaceBtn.title = '个人空间 (打卡/待读/历史/Wiki)';
        spaceBtn.innerHTML = ICONS.wiki;
        spaceBtn.addEventListener('click', () => {
            if (_homeState.view === 'personal-space') {
                closePersonalSpace();
            } else {
                renderPersonalSpaceDashboard();
            }
        });
        toolsPanel.appendChild(spaceBtn);

        const helpBtn = document.createElement('button');
        helpBtn.className = 'zh-square-btn';
        helpBtn.title = '帮助 (快捷键说明)';
        helpBtn.innerHTML = ICONS.help;
        helpBtn.addEventListener('click', showHelpModal);

        const githubBtn = document.createElement('button');
        githubBtn.className = 'zh-square-btn';
        githubBtn.title = '打开 GitHub 仓库';
        githubBtn.innerHTML = ICONS.github;
        githubBtn.addEventListener('click', () => window.open('https://github.com/connectedGraph/zhihu-immersive-reader', '_blank', 'noopener,noreferrer'));

        const themeBtn = document.createElement('button');
        themeBtn.id = 'zh-theme-btn';
        themeBtn.className = 'zh-square-btn';
        themeBtn.innerHTML = ICONS.theme;
        themeBtn.addEventListener('click', () => { currentThemeIndex = (currentThemeIndex + 1) % THEMES.length; applyTheme(currentThemeIndex); });

        toolsPanel.appendChild(translateBtn);
        toolsPanel.appendChild(radarBtn);
        toolsPanel.appendChild(shareBtn);
        toolsPanel.appendChild(settingsBtn);
        toolsPanel.appendChild(helpBtn);
        toolsPanel.appendChild(githubBtn);
        toolsPanel.appendChild(themeBtn);
        document.body.appendChild(toolsPanel);

        Array.from(toolsPanel.children).forEach((btn, i) => {
            btn.style.animationDelay = `${i * 50}ms`;
        });

        const exitBtn = document.createElement('button');
        exitBtn.id = 'immersive-exit-btn';
        exitBtn.innerText = '退出沉浸';
        exitBtn.addEventListener('click', toggleImmersiveMode);
        document.body.appendChild(exitBtn);
    }


    function setOriginalPageVisibleForWiki(visible) {
        document.querySelectorAll('.zh-hidden-by-immersive').forEach(child => {
            child.style.display = visible ? (child.dataset.origDisplay || '') : 'none';
        });
    }

    function updateWikiProgress(message, phase = '') {
        recordWikiProgress(message, phase);
        const text = `信息流 Wiki：${message}`;
        const el = document.getElementById('zh-wiki-progress');
        if (el) el.textContent = text;
        showCollectOverlay(text);
    }

    function setWikiPaused(paused) {
        if (!wikiState.running) return;
        wikiState.paused = !!paused;
        const msg = wikiState.paused
            ? '已暂停调度；已发出的请求会继续完成，新的请求会等待恢复。'
            : '已恢复调度，继续发起剩余请求。';
        updateWikiProgress(msg, wikiState.phase || 'running');
        renderWikiDashboard();
    }

    async function waitWhileWikiPaused() {
        while (wikiState.running && wikiState.paused) {
            await sleep(500);
        }
    }

    async function runLimited(tasks, options = {}) {
        const concurrency = Number(options.concurrency) > 0 ? Number(options.concurrency) : tasks.length || 1;
        const rpm = Number(options.rpm) > 0 ? Number(options.rpm) : 0;
        const interval = rpm > 0 ? Math.ceil(60000 / rpm) : 0;
        const results = new Array(tasks.length);
        let nextIndex = 0;
        let completed = 0;
        let started = 0;
        let nextStartAt = Date.now();

        async function waitForStartSlot() {
            if (!interval) return;
            const now = Date.now();
            const wait = Math.max(0, nextStartAt - now);
            nextStartAt = Math.max(nextStartAt, now) + interval;
            if (wait > 0) await sleep(wait);
        }

        const workers = Array.from({ length: Math.min(concurrency, tasks.length || 1) }, async () => {
            while (nextIndex < tasks.length) {
                if (options.pauseable !== false) await waitWhileWikiPaused();
                const currentIndex = nextIndex++;
                await waitForStartSlot();
                if (options.pauseable !== false) await waitWhileWikiPaused();
                started++;
                if (typeof options.onStart === 'function') options.onStart(started, tasks.length, currentIndex);
                try {
                    results[currentIndex] = await tasks[currentIndex]();
                } catch (err) {
                    results[currentIndex] = { error: err };
                } finally {
                    completed++;
                    if (typeof options.onProgress === 'function') options.onProgress(completed, tasks.length, currentIndex);
                }
            }
        });

        await Promise.all(workers);
        return results;
    }


    window.toggleImmersiveMode = function() {
        if (_questionState.collecting || _homeState.collecting || _followState.collecting) return;
        if (window._isImmersive) exitImmersive();
        else enterImmersive();
    };

function enterImmersive() {
        if (isHomePage()) {
            enterHomeImmersive();
            return;
        }
        if (isFollowPage()) {
            enterFollowImmersive();
            return;
        }
        if (isQuestionPage()) {
            enterQuestionImmersive();
            return;
        }
        if (isPostPage()) {
            enterPostImmersive();
            return;
        }
        alert('阁下，此通用版目前只适配知乎首页、关注动态页 (/follow)、question 页面和 zhuanlan /p/ 页面。');
    }

    function exitImmersive() {
        const wrapper = document.getElementById('immersive-wrapper');
        const toolsPanel = document.getElementById('zh-tools-panel');
        const exitBtn = document.getElementById('immersive-exit-btn');

        const fadeTargets = [wrapper, toolsPanel, exitBtn].filter(Boolean);
        fadeTargets.forEach(el => { el.style.transition = 'opacity 0.25s ease'; el.style.opacity = '0'; });

        setTimeout(() => {
            _doExitImmersive();
        }, 260);
    }

    function _doExitImmersive() {
        stopReadingProgressTracker();
        stopArticleAdCleanup();
        removeCollectOverlay();
        restoreLiveMount();

        // 0. 如果在个人空间内直接退出沉浸模式，先清理个人空间对 wrapper 子元素的隐藏
        const wrapper = document.getElementById('immersive-wrapper');
        if (wrapper) {
            Array.from(wrapper.children).forEach(child => {
                child.classList.remove('zh-space-hidden');
                if (child.hasAttribute('data-zh-space-orig-display')) {
                    child.style.display = child.getAttribute('data-zh-space-orig-display');
                    child.removeAttribute('data-zh-space-orig-display');
                }
            });
            const spaceContainer = document.getElementById('zh-space-container');
            if (spaceContainer) spaceContainer.remove();
        }

        // 1. 顺着咱们进来时打下的占位符，把文章主体和操作栏送回去
        const articlePlaceholder = document.getElementById('zh-article-placeholder');
        if (_articleNode && articlePlaceholder && articlePlaceholder.parentNode) {
            articlePlaceholder.parentNode.insertBefore(_articleNode, articlePlaceholder);
            articlePlaceholder.remove();
        }

        const actionPlaceholder = document.getElementById('zh-action-placeholder');
        if (_actionBarNode && actionPlaceholder && actionPlaceholder.parentNode) {
            _actionBarNode.style.cssText = _actionBarNode.dataset.origCssText || '';
            actionPlaceholder.parentNode.insertBefore(_actionBarNode, actionPlaceholder);
            actionPlaceholder.remove();
        }

        const commentsPlaceholder = document.getElementById('zh-comments-placeholder');
        if (_postCommentsNode && commentsPlaceholder && commentsPlaceholder.parentNode) {
            commentsPlaceholder.parentNode.insertBefore(_postCommentsNode, commentsPlaceholder);
            commentsPlaceholder.remove();
        }

        const inputPlaceholder = document.getElementById('zh-comment-input-placeholder');
        if (_postCommentInputNode && inputPlaceholder && inputPlaceholder.parentNode) {
            inputPlaceholder.parentNode.insertBefore(_postCommentInputNode, inputPlaceholder);
            inputPlaceholder.remove();
        }

        // 2. 清理沉浸模式自己生成的壳子
        ['immersive-wrapper', 'zh-tools-panel', 'immersive-style', 'immersive-exit-btn', 'zh-settings-modal', 'zh-help-modal', 'zh-radar-report-modal', 'zh-radar-book-modal'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.remove();
        });
        document.querySelectorAll('.zh-copy-md-container').forEach(el => el.remove());
        document.querySelectorAll('[id^="zh-selection-modal-"]').forEach(modal => modal.remove());
        removeSelectionContextMenu();
        document.querySelectorAll('.zh-tr-card').forEach(card => card.remove());
        resetImageToggles();
        // （顺手防御性编程）重置一下之前存的全局变量，防止下次进入时状态错乱
        _articleSummary = '';
        window._articleSummary = '';
        window._uiHidden = false;
        window._trVisible = false;

        // 3. 把之前强行隐藏的东西全部显示出来（包括刚刚隐藏的关注按钮）
        const tocNode = document.querySelector('.zh-toc-fixed-style');
        if (tocNode) tocNode.classList.remove('zh-toc-fixed-style');

        document.querySelectorAll('.zh-hidden-by-immersive, .zh-hidden-by-immersive-inner').forEach(child => {
            child.style.display = child.dataset.origDisplay || '';
            child.classList.remove('zh-hidden-by-immersive');
            child.classList.remove('zh-hidden-by-immersive-inner');
        });

        restoreQuestionAnswerPosition();
        restoreHomeItemPosition();
        window._isImmersive = false;
        document.body.classList.remove('zh-ui-hidden', 'zh-show-tr');
        _questionState = {
            answers: [],
            questionTitle: '',
            questionDetailHTML: '',
            originalScrollY: 0,
            exitScrollY: 0,
            currentIndex: 0,
            reactRoot: null,
            view: '',
            collecting: false,
            loadingMore: false,
            exhausted: false
        };
        _homeState = {
            items: [],
            groups: [],
            originalScrollY: 0,
            exitScrollY: 0,
            currentIndex: 0,
            currentGroupIndex: 0,
            currentIndexInGroup: 0,
            view: '',
            collecting: false,
            loadingMore: false,
            exhausted: false,
            apiNextUrl: '',
            apiStarted: false
        };
        _articleNode = null;
        _actionBarNode = null;
        _postCommentsNode = null;
        _postCommentInputNode = null;

        _personalSpaceBackup = {
            context: '',
            homeView: '',
            questionView: '',
            followView: '',
            scrollTop: 0,
            hasTopNav: false,
            hasHomeWide: false
        };
    }

// ═══════════════════════════════════════════════════════════
// 模块: events.js
// ═══════════════════════════════════════════════════════════
    /**
     * ============================================================================
     * 事件监听：键盘快捷键 & 划词右键菜单
     * ============================================================================
     */
    function isEditPage() {
        return /\/p\/\d+\/edit/.test(location.pathname) || /\/edit/.test(location.pathname);
    }

    window.addEventListener('keydown', function(e) {
        const key = typeof e.key === 'string' ? e.key.toLowerCase() : '';
        const typing = isTypingTarget(e.target);
        if (key === 'escape') removeSelectionContextMenu();
        if (!key) return;

        if (window._isImmersive && _homeState.view === 'item' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
            if (key === 'j' || key === 'arrowright') {
                e.preventDefault();
                navigateHomeItem(1);
                return;
            }
            if (key === 'k' || key === 'arrowleft') {
                e.preventDefault();
                navigateHomeItem(-1);
                return;
            }
        }

        if (window._isImmersive && _followState.view === 'item' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
            if (key === 'j' || key === 'arrowright') {
                e.preventDefault();
                navigateFollowItem(1);
                return;
            }
            if (key === 'k' || key === 'arrowleft') {
                e.preventDefault();
                navigateFollowItem(-1);
                return;
            }
        }

        if (window._isImmersive && _questionState.view === 'answer' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
            if (key === 'j' || key === 'arrowright') {
                e.preventDefault();
                navigateQuestionAnswer(1);
                return;
            }
            if (key === 'k' || key === 'arrowleft') {
                e.preventDefault();
                navigateQuestionAnswer(-1);
                return;
            }
        }

        if (e.ctrlKey || e.metaKey) {
            if (key === 'e') {
                if (isEditPage()) return;
                e.preventDefault();
                window.toggleImmersiveMode();
            } else if (key === 'h' && window._isImmersive) {
                e.preventDefault();
                window._uiHidden = !window._uiHidden;
                document.body.classList.toggle('zh-ui-hidden', window._uiHidden);
            }
        }

        //  T 切换翻译面板 
        if (key === 't' && window._isImmersive && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            const translateBtn = document.getElementById('zh-translate-btn');
            if(translateBtn) translateBtn.click();
        }
        
    });

    // 划词右键菜单
    document.addEventListener('contextmenu', function(e) {
        if(!window._isImmersive) return;
        const sel = window.getSelection().toString().trim();
        if(!sel) return;

        const anchorNode = window.getSelection().anchorNode;
        const anchorEl = anchorNode && anchorNode.nodeType === Node.ELEMENT_NODE ? anchorNode : anchorNode?.parentElement;
        const paraNode = anchorEl ? anchorEl.closest('p, blockquote, li, table') : null;
        const contextText = paraNode ? paraNode.innerText : "无额外上下文";

        e.preventDefault();
        showSelectionContextMenu(e, sel, contextText);
    });



    // 启动：非编辑页时自动进入沉浸模式
    if (!isEditPage()) window.toggleImmersiveMode();
})();

