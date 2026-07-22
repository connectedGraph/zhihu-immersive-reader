// ----- 核心样式 (动态注入的 <style> 内容) -----
const STYLE_CSS = `
    body { background-color: var(--zh-bg) !important; margin: 0; padding: 50px 0; font-family: var(--zh-reader-font, 'Times New Roman', 'KaiTi', 'STKaiti', serif) !important; transition: background-color 0.5s ease !important; }
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
    .zh-home-card-stats { margin-top: auto; padding-top: 10px; display: flex; align-items: center; gap: 0; flex-wrap: wrap; border-top: 1px solid var(--zh-border); color: var(--zh-text); opacity: .58; font-size: 11px; line-height: 1.4; }
    .zh-home-card-stats span + span::before { content: '·'; margin: 0 7px; opacity: .7; }
    .zh-feed-batch-divider { grid-column: 1 / -1; min-height: 34px; margin: 18px 0 2px; display: flex; align-items: center; gap: 12px; color: var(--zh-text); opacity: .52; font-size: 11px; line-height: 1; }
    .zh-feed-batch-divider::before, .zh-feed-batch-divider::after { content: ''; height: 1px; flex: 1; background: var(--zh-border); }
    .zh-feed-batch-divider span { flex-shrink: 0; }

    /* 首页导航工具栏 */
    .zh-home-toolbar { display: flex; align-items: center; gap: 8px; margin: 0 0 8px; flex-wrap: wrap; }
    .zh-home-nav-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border: 1px solid var(--zh-border); border-radius: 6px; background: var(--zh-paper); color: var(--zh-text); cursor: pointer; font-family: inherit; font-size: 13px; transition: all 0.15s ease; }
    .zh-home-nav-btn:hover:not(:disabled) { border-color: var(--zh-accent); color: var(--zh-accent); background: var(--zh-quote); }
    .zh-home-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .zh-home-nav-icon { font-size: 16px; font-weight: bold; line-height: 1; }
    .zh-home-nav-indicator { font-size: 13px; color: var(--zh-text); opacity: 0.6; padding: 0 4px; white-space: nowrap; }
    .zh-home-layout-btn { margin-left: auto; }
    .zh-home-scroll-count { min-height: 32px; display: inline-flex; align-items: center; }
    html.zh-feed-scroll-snap { scroll-snap-type: y proximity; scroll-padding-top: 12px; }
    .zh-feed-batch-anchor { scroll-snap-align: start; scroll-snap-stop: normal; }
    .zh-feed-load-gate { --zh-feed-pull-ratio: 0; --zh-feed-progress-angle: 0deg; height: 0; margin: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; gap: 10px; color: var(--zh-text); opacity: .62; font-size: 12px; line-height: 1.4; transition: height .24s cubic-bezier(.2,.75,.25,1), opacity .18s ease; }
    .zh-feed-load-gate.is-pulling, .zh-feed-load-gate.is-loading, .zh-feed-load-gate.is-error { margin-top: 8px; }
    .zh-feed-load-indicator { width: 34px; height: 34px; flex: 0 0 34px; display: grid; place-items: center; color: var(--zh-accent); }
    .zh-feed-load-ring { position: relative; width: 30px; height: 30px; display: grid; place-items: center; border-radius: 50%; background: conic-gradient(var(--zh-accent) 0deg var(--zh-feed-progress-angle), color-mix(in srgb, var(--zh-border) 68%, transparent) var(--zh-feed-progress-angle) 360deg); transform: scale(.94); transition: transform .18s cubic-bezier(.2,.75,.25,1); }
    .zh-feed-load-ring::after { content: ''; position: absolute; inset: 3px; border-radius: 50%; background: var(--zh-paper); }
    .zh-feed-load-value { position: relative; z-index: 1; min-width: 24px; color: var(--zh-text); opacity: .72; font-size: 8px; line-height: 1; text-align: center; font-variant-numeric: tabular-nums; }
    .zh-feed-load-gate.is-pulling .zh-feed-load-ring { transform: scale(1); }
    .zh-feed-load-gate.is-loading { height: 104px !important; opacity: .82; }
    .zh-feed-load-gate.is-loading .zh-feed-load-ring { background: conic-gradient(var(--zh-accent) 0deg 92deg, color-mix(in srgb, var(--zh-border) 45%, transparent) 92deg 360deg); animation: zh-feed-load-spin .72s linear infinite; }
    .zh-feed-load-gate.is-loading .zh-feed-load-value { opacity: 0; }
    .zh-feed-load-gate.is-error { opacity: .68; }
    .zh-feed-load-gate.is-exhausted { height: auto !important; min-height: 42px; margin-top: 12px; opacity: .5; }
    @keyframes zh-feed-load-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { html.zh-feed-scroll-snap { scroll-snap-type: none; } .zh-feed-load-gate, .zh-feed-load-ring { transition: none; } .zh-feed-load-gate.is-loading .zh-feed-load-ring { animation-duration: 1.2s; } }
    .zh-toread-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; padding: 0; border-radius: 6px; margin-left: auto; }
    .zh-toread-btn svg { fill: none; stroke: currentColor; stroke-width: 2; width: 16px; height: 16px; }
    .zh-toread-btn.zh-btn-active svg { fill: currentColor; }

    @media (max-width: 860px) { .zh-home-grid { grid-template-columns: 1fr; } #immersive-wrapper.zh-home-wide { max-width: none; padding: 24px 16px; } }

    /* 关注动态：推特式时间线 */
    #immersive-wrapper.zh-follow-wide { max-width: 640px; padding: 24px 0 60px; margin-top: -30px; border-left: none !important; border-right: none !important; box-shadow: none; background: transparent !important; }
    #immersive-wrapper.zh-follow-wide.zh-follow-double { max-width: 1100px; }
    .zh-follow-timeline { display: flex; flex-direction: column; gap: 14px; margin-top: 18px; animation: zh-page-enter 0.25s ease-out; }
    .zh-follow-timeline.zh-follow-grid { display: grid; grid-template-columns: repeat(2, 1fr); align-items: stretch; }
    .zh-follow-timeline > .zh-feed-batch-divider { width: 100%; }
    .zh-follow-timeline.zh-follow-grid > .zh-feed-batch-divider { grid-column: 1 / -1; }
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

    /* 全屏设置页 */
    #zh-settings-modal { align-items: stretch; justify-content: stretch; padding: 0; background: var(--zh-bg); z-index: 99999999; }
    #zh-settings-modal .zh-modal { width: 100%; height: 100%; max-width: none; border: 0; border-radius: 0; box-shadow: none; display: flex; flex-direction: column; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; letter-spacing: 0; overflow: hidden; animation: none; }
    #zh-settings-modal .zh-modal-header { min-height: 64px; box-sizing: border-box; padding: 0 32px; flex-shrink: 0; border-bottom: 1px solid var(--zh-border); background: var(--zh-paper); font-size: 18px; color: var(--zh-title); }
    #zh-settings-modal .zh-modal-close { width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 4px; color: var(--zh-text); font: 300 28px/1 system-ui, sans-serif; }
    #zh-settings-modal .zh-modal-close:hover { background: var(--zh-quote); color: var(--zh-accent); }
    #zh-settings-modal .zh-modal-body { padding: 0; max-height: none; min-height: 0; flex: 1; overflow: hidden; font-size: 14px; line-height: 1.5; }
    #zh-settings-modal .zh-modal-body input,
    #zh-settings-modal .zh-modal-body select,
    #zh-settings-modal .zh-modal-body textarea,
    #zh-settings-modal .zh-modal-body button { font-family: inherit; letter-spacing: 0; }

    .zh-settings-page { display: flex; width: 100%; height: 100%; min-width: 0; color: var(--zh-text); background: var(--zh-modal-bg); }
    .zh-settings-sidebar { width: 232px; padding: 28px 18px; box-sizing: border-box; flex-shrink: 0; background: var(--zh-quote); border-right: 1px solid var(--zh-border); }
    .zh-settings-sidebar-label { margin: 0 12px 14px; color: var(--zh-text); opacity: .55; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .zh-settings-nav { display: flex; flex-direction: column; gap: 3px; }
    .zh-settings-nav-btn { position: relative; width: 100%; min-height: 54px; padding: 8px 12px 8px 16px; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; border: 0; border-radius: 4px; background: transparent; color: var(--zh-text); text-align: left; cursor: pointer; }
    .zh-settings-nav-btn::before { content: ''; position: absolute; left: 0; top: 11px; bottom: 11px; width: 3px; border-radius: 2px; background: transparent; }
    .zh-settings-nav-btn:hover { background: var(--zh-paper); }
    .zh-settings-nav-btn.is-active { background: var(--zh-paper); color: var(--zh-accent); }
    .zh-settings-nav-btn.is-active::before { background: var(--zh-accent); }
    .zh-settings-nav-btn span { font-size: 14px; font-weight: 650; line-height: 1.4; }
    .zh-settings-nav-btn small { margin-top: 2px; font-size: 11px; color: var(--zh-text); opacity: .55; line-height: 1.3; }

    .zh-settings-workspace { min-width: 0; flex: 1; display: flex; flex-direction: column; background: var(--zh-modal-bg); }
    .zh-settings-scroll { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
    .zh-settings-section { width: min(880px, calc(100% - 64px)); margin: 0 auto; padding: 46px 0 72px; box-sizing: border-box; animation: zh-settings-section-in .18s ease both; }
    .zh-settings-section[hidden] { display: none !important; }
    @keyframes zh-settings-section-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    .zh-settings-section-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 34px; padding-bottom: 22px; border-bottom: 1px solid var(--zh-border); }
    .zh-settings-section-header h2 { margin: 4px 0 0; color: var(--zh-title); font-size: 25px; line-height: 1.25; font-weight: 700; }
    .zh-settings-section-header p { max-width: 320px; margin: 0 0 2px; color: var(--zh-text); opacity: .62; font-size: 13px; text-align: right; }
    .zh-settings-kicker { color: var(--zh-accent); font-size: 10px; font-weight: 800; }
    .zh-settings-subsection h3 { margin: 0 0 18px; color: var(--zh-title); font-size: 16px; line-height: 1.4; }
    .zh-settings-divider { height: 1px; margin: 32px 0; background: var(--zh-border); opacity: .85; }
    .zh-settings-note { margin: 0 0 14px; max-width: 680px; color: var(--zh-text); opacity: .7; font-size: 13px; line-height: 1.7; }
    .zh-settings-note-compact { margin: 10px 0 0; font-size: 11px; }

    .zh-settings-form-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px 22px; }
    .zh-settings-field { min-width: 0; display: flex; flex-direction: column; gap: 7px; color: var(--zh-title); font-size: 13px; font-weight: 650; }
    .zh-settings-field-wide { grid-column: 1 / -1; }
    .zh-settings-field > small { color: var(--zh-text); opacity: .58; font-size: 11px; font-weight: 400; }
    #zh-settings-modal .zh-settings-field input,
    #zh-settings-modal .zh-settings-field select,
    #zh-settings-modal .zh-settings-details textarea,
    #zh-settings-modal .zh-settings-inline-actions > input { width: 100%; height: 40px; box-sizing: border-box; margin: 0; padding: 0 12px; border: 1px solid var(--zh-border); border-radius: 4px; outline: 0; background: var(--zh-code); color: var(--zh-text); font-size: 13px; }
    #zh-settings-modal .zh-settings-field select { appearance: auto; }
    #zh-settings-modal .zh-settings-field input:focus,
    #zh-settings-modal .zh-settings-field select:focus,
    #zh-settings-modal .zh-settings-details textarea:focus,
    #zh-settings-modal .zh-settings-inline-actions > input:focus { border-color: var(--zh-accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--zh-accent) 14%, transparent); }

    .zh-settings-toggle-list { display: flex; flex-direction: column; }
    .zh-settings-toggle { min-height: 64px; padding: 10px 2px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 24px; cursor: pointer; border-bottom: 1px solid var(--zh-border); }
    .zh-settings-toggle:last-child { border-bottom: 0; }
    .zh-settings-toggle > span { min-width: 0; display: flex; flex-direction: column; }
    .zh-settings-toggle b { color: var(--zh-title); font-size: 14px; font-weight: 650; }
    .zh-settings-toggle small { margin-top: 3px; color: var(--zh-text); opacity: .58; font-size: 11px; }
    .zh-settings-toggle input { position: absolute; opacity: 0; pointer-events: none; }
    .zh-settings-toggle i { position: relative; width: 38px; height: 22px; flex-shrink: 0; border-radius: 12px; background: var(--zh-border); transition: background .16s ease; }
    .zh-settings-toggle i::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: var(--zh-paper); box-shadow: 0 1px 3px rgba(0,0,0,.18); transition: transform .16s ease; }
    .zh-settings-toggle input:checked + i { background: var(--zh-accent); }
    .zh-settings-toggle input:checked + i::after { transform: translateX(16px); }
    .zh-settings-toggle input:focus-visible + i { outline: 2px solid var(--zh-accent); outline-offset: 2px; }

    .zh-font-preset-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .zh-font-preset { min-width: 0; min-height: 82px; padding: 13px 14px; box-sizing: border-box; display: grid; grid-template-columns: 52px 1fr; align-items: center; gap: 12px; border: 1px solid var(--zh-border); border-radius: 6px; background: var(--zh-paper); cursor: pointer; transition: border-color .15s ease, background .15s ease; }
    .zh-font-preset:hover { border-color: var(--zh-accent); }
    .zh-font-preset.is-selected { border-color: var(--zh-accent); background: var(--zh-quote); box-shadow: inset 3px 0 0 var(--zh-accent); }
    .zh-font-preset input { position: absolute; opacity: 0; pointer-events: none; }
    .zh-font-preset-sample { color: var(--zh-title); font: 24px/1.2 var(--zh-font-option); text-align: center; }
    .zh-font-preset-copy { min-width: 0; display: flex; flex-direction: column; }
    .zh-font-preset-copy b { color: var(--zh-title); font-size: 13px; }
    .zh-font-preset-copy small { margin-top: 4px; color: var(--zh-text); opacity: .58; font-size: 10px; line-height: 1.45; }
    .zh-font-preview { margin-top: 18px; padding: 22px 0; border-top: 1px solid var(--zh-border); border-bottom: 1px solid var(--zh-border); font-family: var(--zh-reader-font); }
    .zh-font-preview > span { display: block; margin-bottom: 8px; color: var(--zh-accent); font: 700 10px/1.2 system-ui, sans-serif; }
    .zh-font-preview p { margin: 0; color: var(--zh-title); font-size: 20px; line-height: 1.8; }

    .zh-segmented-control { width: fit-content; max-width: 100%; display: inline-flex; padding: 3px; border: 1px solid var(--zh-border); border-radius: 6px; background: var(--zh-code); }
    .zh-segmented-control label { cursor: pointer; }
    .zh-segmented-control input { position: absolute; opacity: 0; pointer-events: none; }
    .zh-segmented-control span { min-width: 76px; height: 32px; padding: 0 12px; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; border-radius: 3px; color: var(--zh-text); font-size: 12px; }
    .zh-segmented-control input:checked + span { background: var(--zh-paper); color: var(--zh-accent); box-shadow: 0 1px 4px rgba(0,0,0,.1); font-weight: 650; }
    .zh-custom-font-panel { margin-top: 16px; }
    .zh-custom-font-panel[hidden] { display: none !important; }
    .zh-font-file-picker { min-height: 76px; padding: 14px 16px; box-sizing: border-box; display: flex; align-items: center; border: 1px dashed var(--zh-border); border-radius: 6px; background: var(--zh-code); cursor: pointer; }
    .zh-font-file-picker:hover { border-color: var(--zh-accent); }
    .zh-font-file-picker input { position: absolute; width: 1px; height: 1px; opacity: 0; }
    .zh-font-file-picker span { display: flex; flex-direction: column; }
    .zh-font-file-picker b { color: var(--zh-accent); font-size: 13px; }
    .zh-font-file-picker small { margin-top: 4px; color: var(--zh-text); opacity: .62; font-size: 11px; }
    .zh-settings-status { color: var(--zh-text); opacity: .68; font-size: 11px; line-height: 1.6; }
    #zh-font-load-status { min-height: 18px; margin-top: 8px; }

    .zh-theme-var-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; margin-bottom: 16px; }
    .zh-theme-var-row { min-width: 0; padding: 9px 10px; display: flex; align-items: center; gap: 9px; border: 1px solid var(--zh-border); border-radius: 4px; background: var(--zh-paper); }
    #zh-settings-modal .zh-theme-var-row input[type="color"] { width: 30px; height: 30px; padding: 1px; flex-shrink: 0; border: 1px solid var(--zh-border); border-radius: 4px; background: transparent; cursor: pointer; }
    .zh-theme-var-row span { min-width: 0; display: flex; flex-direction: column; }
    .zh-theme-var-row b { color: var(--zh-title); font-size: 11px; }
    .zh-theme-var-row small { overflow: hidden; color: var(--zh-text); opacity: .55; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
    .zh-settings-inline-actions { margin-top: 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .zh-settings-inline-actions > input { max-width: 360px; }
    .zh-settings-inline-actions small { color: var(--zh-text); opacity: .55; font-size: 11px; }
    #zh-settings-modal .zh-inline-btn,
    #zh-settings-modal .zh-test-btn { width: auto; min-height: 36px; margin: 0; padding: 0 13px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--zh-border); border-radius: 4px; background: var(--zh-paper); color: var(--zh-text); font-size: 12px; font-weight: 600; cursor: pointer; }
    #zh-settings-modal .zh-inline-btn:hover,
    #zh-settings-modal .zh-test-btn:hover { border-color: var(--zh-accent); color: var(--zh-accent); }
    #zh-settings-modal .zh-test-btn { margin-top: 16px; border-style: solid; }
    #zh-settings-modal .zh-test-res { margin: 10px 0 0; padding: 10px 12px; border-radius: 4px; }
    .zh-settings-details { margin-top: 14px; }
    .zh-settings-details summary { width: fit-content; color: var(--zh-accent); font-size: 12px; cursor: pointer; }
    #zh-settings-modal .zh-settings-details textarea { height: auto; min-height: 112px; margin: 10px 0 8px; padding: 10px 12px; resize: vertical; font-family: Consolas, monospace; line-height: 1.5; }
    .zh-settings-list { margin-top: 14px; font-size: 12px; line-height: 1.6; }
    .zh-collections-list { max-height: 360px; overflow-y: auto; }
    .zh-translation-prompt-list { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
    .zh-translation-prompt-row { padding: 12px; border: 1px solid var(--zh-border); border-radius: 6px; background: var(--zh-paper); }
    .zh-translation-prompt-toolbar { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .zh-translation-prompt-enabled { min-height: 34px; flex: 0 0 auto; padding: 0; border: 0; }
    .zh-translation-prompt-enabled > span { display: none; }
    .zh-translation-prompt-enabled i { width: 34px; height: 20px; }
    .zh-translation-prompt-enabled i::after { width: 14px; height: 14px; }
    .zh-translation-prompt-enabled input:checked + i::after { transform: translateX(14px); }
    #zh-settings-modal .zh-translation-prompt-name { min-width: 0; flex: 1; height: 34px; box-sizing: border-box; padding: 0 10px; border: 1px solid var(--zh-border); border-radius: 4px; outline: 0; background: var(--zh-code); color: var(--zh-text); font-size: 12px; }
    #zh-settings-modal .zh-translation-prompt-name:focus { border-color: var(--zh-accent); }
    #zh-settings-modal .zh-translation-prompt-text { width: 100%; min-height: 88px; margin-top: 10px; padding: 10px; box-sizing: border-box; resize: vertical; border: 1px solid var(--zh-border); border-radius: 4px; outline: 0; background: var(--zh-code); color: var(--zh-text); font: 12px/1.6 Consolas, monospace; }
    #zh-settings-modal .zh-translation-prompt-text:focus { border-color: var(--zh-accent); }
    @media (max-width: 520px) {
        .zh-translation-prompt-toolbar { flex-wrap: wrap; }
        .zh-translation-prompt-name { order: 2; flex-basis: calc(100% - 44px); }
        .zh-translation-prompt-delete { order: 3; }
    }

    #zh-settings-modal .zh-pwd-wrap { margin: 0; }
    #zh-settings-modal .zh-eye-icon { right: 7px; width: 28px; height: 28px; padding: 5px; box-sizing: border-box; border: 0; border-radius: 4px; background: transparent; }
    .zh-settings-footer { min-height: 68px; padding: 12px 32px; box-sizing: border-box; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 20px; border-top: 1px solid var(--zh-border); background: var(--zh-paper); box-shadow: 0 -8px 24px rgba(0,0,0,.035); }
    .zh-settings-footer > span { color: var(--zh-text); opacity: .55; font-size: 11px; }
    .zh-settings-footer > div { display: flex; gap: 8px; }
    .zh-settings-secondary-btn,
    .zh-settings-primary-btn { min-width: 92px; height: 40px; padding: 0 16px; border-radius: 4px; font-size: 13px; font-weight: 650; cursor: pointer; }
    .zh-settings-secondary-btn { border: 1px solid var(--zh-border); background: transparent; color: var(--zh-text); }
    .zh-settings-secondary-btn:hover { border-color: var(--zh-accent); color: var(--zh-accent); }
    .zh-settings-primary-btn { border: 1px solid var(--zh-accent); background: var(--zh-accent); color: var(--zh-paper); }
    .zh-settings-primary-btn:hover { opacity: .88; }
    .zh-settings-primary-btn:disabled { opacity: .55; cursor: wait; }

    @media (max-width: 760px) {
        #zh-settings-modal .zh-modal-header { min-height: 56px; padding: 0 16px; }
        .zh-settings-page { flex-direction: column; }
        .zh-settings-sidebar { width: 100%; padding: 8px 12px; border-right: 0; border-bottom: 1px solid var(--zh-border); overflow-x: auto; }
        .zh-settings-sidebar-label { display: none; }
        .zh-settings-nav { width: max-content; min-width: 100%; flex-direction: row; gap: 2px; }
        .zh-settings-nav-btn { width: auto; min-width: 88px; min-height: 44px; padding: 6px 12px; align-items: center; }
        .zh-settings-nav-btn::before { left: 12px; right: 12px; top: auto; bottom: 0; width: auto; height: 2px; }
        .zh-settings-nav-btn small { display: none; }
        .zh-settings-section { width: calc(100% - 32px); padding: 28px 0 56px; }
        .zh-settings-section-header { align-items: flex-start; margin-bottom: 26px; }
        .zh-settings-section-header h2 { font-size: 22px; }
        .zh-settings-section-header p { display: none; }
        .zh-settings-footer { min-height: 62px; padding: 10px 16px; }
        .zh-settings-footer > span { display: none; }
        .zh-settings-footer > div { width: 100%; }
        .zh-settings-secondary-btn, .zh-settings-primary-btn { flex: 1; }
        .zh-theme-var-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    @media (max-width: 520px) {
        .zh-settings-form-grid,
        .zh-font-preset-grid { grid-template-columns: minmax(0, 1fr); }
        .zh-settings-field-wide { grid-column: auto; }
        .zh-theme-var-grid { grid-template-columns: minmax(0, 1fr); }
        .zh-segmented-control { width: 100%; }
        .zh-segmented-control label { flex: 1; }
        .zh-segmented-control span { width: 100%; min-width: 0; padding: 0 6px; }
        .zh-font-preview p { font-size: 17px; }
    }

    @media (prefers-reduced-motion: reduce) {
        .zh-settings-section { animation: none; }
        .zh-settings-toggle i,
        .zh-settings-toggle i::after { transition: none; }
    }
    
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
