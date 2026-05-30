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