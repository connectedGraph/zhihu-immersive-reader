// 编辑页保护：避免 /p/{id}/edit 与回答编辑页自动进入沉浸模式，
// 并阻断会与编辑器快捷键（如 Ctrl+Alt+E 插入公式）冲突的 Ctrl/Cmd+E。
(function initEditGuard() {
    if (window.__zhImmersiveEditGuardInstalled) return;
    window.__zhImmersiveEditGuardInstalled = true;

    const ARTICLE_EDIT_URL = /\/p\/[^/]+\/edit(?:\/|$|\?)/i;
    const EDIT_FORM_SELECTORS = [
        '.AnswerForm',
        '.AnswerForm-container',
        '.AnswerForm-editor',
        '.AnswerEditor',
        '.ArticleForm',
        '.ArticleForm-container',
        '.ArticleForm-editor',
        '.ArticleEditor',
        '.QuestionForm-detail',
        '.QuestionForm-rich',
        '.QuestionForm-editor'
    ].join(',');

    let lastExitAt = 0;
    let observerStarted = false;
    let originalToggle = (typeof toggleImmersiveMode === 'function') ? toggleImmersiveMode : null;

    function isArticleEditUrl() {
        return ARTICLE_EDIT_URL.test(window.location.pathname || '');
    }

    function isEditingPage() {
        if (isArticleEditUrl()) return true;
        if (!document.body) return false;
        const nodes = document.querySelectorAll(EDIT_FORM_SELECTORS);
        for (let i = 0; i < nodes.length; i++) {
            const el = nodes[i];
            if (el.offsetWidth > 0 && el.offsetHeight > 0) return true;
        }
        return false;
    }

    function shouldBlock() {
        return isEditingPage();
    }

    function isImmersive() {
        if (Boolean(window._isImmersive)) return true;
        const nodes = [document.body, document.documentElement, document.getElementById('immersive-wrapper')].filter(Boolean);
        const classes = ['immersive', 'zh-immersive', 'zhihu-immersive', 'immersive-mode', 'immersive-active', 'is-immersive'];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = 0; j < classes.length; j++) {
                if (nodes[i].classList.contains(classes[j])) return true;
            }
        }
        return false;
    }

    function exitIfImmersive() {
        if (!shouldBlock() || !isImmersive()) return;
        const now = Date.now();
        if (now - lastExitAt < 600) return;
        lastExitAt = now;
        const fn = (typeof toggleImmersiveMode === 'function') ? toggleImmersiveMode : originalToggle;
        if (typeof fn === 'function') {
            try { fn.call(window); } catch (err) { console.warn('知乎沉浸式阅读：编辑页退出沉浸失败', err); }
        }
    }

    if (originalToggle) {
        try {
            toggleImmersiveMode = function (force) {
                if (shouldBlock()) {
                    if (isImmersive()) {
                        return originalToggle.call(this);
                    }
                    return;
                }
                return originalToggle.apply(this, arguments);
            };
        } catch (err) {
            console.warn('知乎沉浸式阅读：无法接管沉浸模式切换', err);
        }
    }

    window.addEventListener('keydown', function (event) {
        if (!event || !event.key) return;
        const mod = event.ctrlKey || event.metaKey;
        if (!mod) return;
        const key = String(event.key).toLowerCase();
        const isProtectedShortcut = key === 'e' || key === 'h';
        if (!isProtectedShortcut) return;
        if (!shouldBlock()) return;
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    }, true);

    function startMonitor() {
        if (observerStarted) return;
        observerStarted = true;
        exitIfImmersive();
        setInterval(exitIfImmersive, 800);
        try {
            const observer = new MutationObserver(function () {
                exitIfImmersive();
            });
            observer.observe(document.documentElement || document, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
        } catch (err) { /* 忽略 MutationObserver 不可用 */ }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startMonitor);
        window.addEventListener('load', startMonitor);
    } else {
        startMonitor();
    }
})();
