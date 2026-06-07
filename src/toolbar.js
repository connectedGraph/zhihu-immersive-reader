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