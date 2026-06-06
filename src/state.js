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