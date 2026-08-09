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

    // 回答采集不再使用缓存：API 分页等幂且够快，每次进入重新采集即可。
    // 旧实现把 answers / currentIndex / exhausted 一起持久化到 IndexedDB，
    // 恢复时会连带恢复「已采集完」状态，导致「继续加载」被永久关闭。
    function navigateFromAnswerToMainQuestion() {
        const mainUrl = getMainQuestionUrl();
        if (window._isImmersive) exitImmersive();
        location.assign(mainUrl);
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
        updateQuestionCollectStatus(statusEl, `正在并发生成 AI 摘要 0/${answers.length}`);

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
                updateQuestionCollectStatus(statusEl, `正在并发生成 AI 摘要 ${finished}/${answers.length}`);
            }
        }));

        return answers;
    }

    function getAnswerItems() {
        return Array.from(document.querySelectorAll('.QuestionAnswers-answers .ContentItem.AnswerItem, .ContentItem.AnswerItem'))
            .filter(item => !item.closest('#immersive-wrapper'));
    }


    // ── 回答列表 API 采集：GET /api/v4/questions/{id}/feeds ──────────────────
    // 实测结论（104 回答样本）：
    //   · 纯登录 cookie 即可，无需 x-zse-96 / x-zst-81 签名头；无 authorization 头
    //   · GET 为纯读操作，不产生知乎侧「已读」；已读由独立的 POST /lastread/touch 负责，本插件不发
    //   · 同参数重发等幂，(cursor, offset) 位置锚定，失败重试安全
    //   · 不需要初始 cursor，offset=0 即从第一条开始；paging.next 自带后续 cursor
    //   · limit 至少可到 40 且按传入值返回；正文 content 完整不截断
    const QUESTION_FEEDS_INCLUDE = [
        'data[*].content,excerpt,voteup_count,comment_count,created_time,updated_time',
        'is_normal,is_collapsed,collapsed_by,is_sticky,can_comment,question,relevant_info',
        'relationship.is_thanked,voting,is_author',
        ';data[*].author.follower_count,vip_info'
    ].join(',').replace(',;', ';');

    function getQuestionId() {
        return (location.pathname.match(/\/question\/(\d+)/) || [])[1] || '';
    }

    function getQuestionFeedsApiUrl(limit = HOME_BATCH_SIZE) {
        const questionId = getQuestionId();
        if (!questionId) return '';
        const url = new URL(`/api/v4/questions/${questionId}/feeds`, location.origin);
        url.searchParams.set('include', QUESTION_FEEDS_INCLUDE);
        url.searchParams.set('limit', String(limit));
        url.searchParams.set('offset', '0');
        url.searchParams.set('platform', 'desktop');
        return url.href;
    }

    function normalizeQuestionApiNextUrl(raw) {
        if (!raw) return '';
        try {
            return new URL(raw, location.origin).href;
        } catch (err) {
            return '';
        }
    }

    function buildQuestionApiAnswerUrl(target = {}) {
        const answerId = String(target.id || '');
        const questionId = String(target.question?.id || getQuestionId() || '');
        if (!answerId || !questionId) return '';
        return `${location.origin}/question/${questionId}/answer/${answerId}`;
    }

    function buildQuestionApiClone(record, target = {}) {
        const clone = document.createElement('div');
        clone.className = 'ContentItem AnswerItem zh-question-api-item';
        const avatarHTML = record.authorAvatar
            ? `<img class="Avatar zh-api-avatar" src="${escapeHTML(record.authorAvatar)}" alt="">`
            : '';
        const headlineHTML = record.authorHeadline
            ? `<div style="font-size:13px;opacity:.72;margin-top:2px;">${escapeHTML(record.authorHeadline)}</div>`
            : '';
        const metaLine = [record.voteText, record.commentText].filter(Boolean).join(' · ');
        clone.innerHTML = `
            <div class="AuthorInfo zh-api-author">
                ${avatarHTML}
                <div class="zh-api-author-text">
                    <div style="font-weight:bold;">${escapeHTML(record.author)}</div>
                    ${headlineHTML}
                </div>
            </div>
            ${metaLine ? `<div class="zh-answer-api-meta" style="font-size:13px;opacity:.72;margin:6px 0 14px;">${escapeHTML(metaLine)}</div>` : ''}
            <div class="RichContent"><div class="RichText ztext">${target.content || ''}</div></div>
            <div class="zh-api-action-slot"></div>
        `;
        return cleanupAnswerClone(clone);
    }

    function buildQuestionApiRecord(feedItem, index) {
        const target = feedItem?.target || {};
        const author = target.author || {};
        const url = buildQuestionApiAnswerUrl(target);
        const text = normalizeText(stripHTMLToText(target.content || target.excerpt || ''));
        const voteCount = Number(target.voteup_count);
        const commentCount = Number(target.comment_count);
        const avatarTemplate = author.avatar_url_template || author.avatarUrlTemplate || '';
        const record = {
            key: url || String(target.id || `${index}-${text.slice(0, 60)}`),
            author: (author.name || '匿名用户').replace(/\s+/g, ' ').trim(),
            authorAvatar: avatarTemplate
                ? String(avatarTemplate).replace('{size}', 'xl')
                : (author.avatar_url || ''),
            authorHeadline: (author.headline || '').replace(/\s+/g, ' ').trim(),
            voteText: Number.isFinite(voteCount) && voteCount > 0 ? `${voteCount} 人赞同` : '',
            commentText: Number.isFinite(commentCount) && commentCount > 0 ? `${commentCount} 条评论` : '',
            snippet: text.slice(0, 160),
            preview: text.slice(0, 160),
            text,
            sourceTop: _questionState.originalScrollY || window.scrollY || 0,
            liveNode: null,
            clone: null,
            // 互动栏字段：与 page-home.js / page-follow.js 的记录保持同一契约，
            // 直接复用 zhihu-action.js 的 buildActionBar / executeAction。
            url,
            apiTargetType: 'answer',
            apiTargetId: String(target.id || ''),
            voting: (target.relationship?.voting) ?? 0,
            thanked: !!(target.relationship?.is_thanked),
            liked: false,
            collected: false,
            voteup_count: Number.isFinite(voteCount) ? voteCount : 0,
            comment_count: Number.isFinite(commentCount) ? commentCount : 0,
            thanks_count: target.thanks_count ?? 0,
            favlists_count: target.favlists_count ?? target.favorite_count ?? 0,
            // 卡片底部统计栏与首页推荐卡同字段，交给 getHomeCardStats 统一格式化
            author_follower_count: Number(author.follower_count) || 0
        };
        record.clone = buildQuestionApiClone(record, target);
        return record;
    }

    function isQuestionApiAnswerItem(feedItem) {
        if (!feedItem || !feedItem.target) return false;
        if (feedItem.target_type && feedItem.target_type !== 'answer') return false;
        if (feedItem.target.type && feedItem.target.type !== 'answer') return false;
        return true;
    }

    async function fetchQuestionFeedsPage(limit = HOME_BATCH_SIZE) {
        const url = _questionState.apiNextUrl || getQuestionFeedsApiUrl(limit);
        if (!url) throw new Error('无法构造问题回答 API 地址');
        const data = await gmFetchJSON(url);
        _questionState.apiStarted = true;
        const paging = data?.paging || {};
        _questionState.apiNextUrl = normalizeQuestionApiNextUrl(paging.next);
        if (paging.is_end || !_questionState.apiNextUrl) _questionState.exhausted = true;
        return Array.isArray(data?.data) ? data.data : [];
    }

    // 与 page-home.js updateHomeCollectStatus 同一契约：状态节点是滚动门
    // （.zh-feed-load-gate）时只更新门内文案，不再叠加全屏采集 overlay，
    // 否则拉动进度环加载时会被 overlay 盖住。
    function updateQuestionCollectStatus(statusEl, message) {
        if (statusEl) statusEl.textContent = message;
        if (!statusEl?.classList?.contains('zh-feed-load-gate')) showCollectOverlay(message);
    }

    async function collectQuestionAnswersFromApi(statusEl = null, targetCount = HOME_BATCH_SIZE, options = {}) {
        const records = new Map();
        const existingKeys = new Set(options.existingKeys || []);
        const label = options.label || 'API 加载问题回答';
        const maxPages = options.maxPages || Math.max(3, Math.ceil(targetCount / HOME_BATCH_SIZE) + 3);

        for (let page = 0; page < maxPages && records.size < targetCount && !_questionState.exhausted; page++) {
            const message = `${label} ${Math.min(records.size, targetCount)}/${targetCount}（API 第 ${page + 1} 页）`;
            updateQuestionCollectStatus(statusEl, message);

            const feedItems = await fetchQuestionFeedsPage(HOME_BATCH_SIZE);
            if (!feedItems.length) {
                _questionState.exhausted = true;
                break;
            }

            feedItems.forEach((feedItem, index) => {
                if (!isQuestionApiAnswerItem(feedItem)) return;
                const record = buildQuestionApiRecord(feedItem, index);
                if (record.text.length >= 5 && !existingKeys.has(record.key) && !records.has(record.key)) {
                    records.set(record.key, record);
                }
            });

            if (statusEl) statusEl.textContent = `${label} ${Math.min(records.size, targetCount)}/${targetCount}`;
        }

        return Array.from(records.values()).slice(0, targetCount);
    }

    // DOM 兜底：只读「当前页面已经渲染出来的」回答，单次扫描。
    // 明确不做触底滚动加载——那套 forceScrollToBottom 轮询会劫持用户滚动位置、
    // 拉长进入耗时并造成闪烁。API 不可用时宁可少给几条，也不再驱动页面滚动。
    function collectQuestionAnswersFromDOM(statusEl = null, targetCount = HOME_BATCH_SIZE, options = {}) {
        const records = new Map();
        const existingKeys = new Set(options.existingKeys || []);
        const label = options.label || '读取当前页面已加载回答';
        const currentItems = getAnswerItems();
        currentItems.forEach(item => expandAnswerItem(item));
        currentItems.forEach((item, index) => {
            const record = buildAnswerRecord(item, index);
            if (record.text.length >= 5 && !existingKeys.has(record.key) && !records.has(record.key)) {
                records.set(record.key, record);
            }
        });
        const message = `${label} ${Math.min(records.size, targetCount)}/${targetCount}（不触底滚动）`;
        updateQuestionCollectStatus(statusEl, message);
        return Array.from(records.values()).slice(0, targetCount);
    }

    // 采集分发：默认走 API，失败时回退为读取当前已渲染的回答（不滚动）。
    // options.source === 'dom' 可强制走 DOM（供兜底重试或调试）。
    async function collectQuestionAnswers(statusEl = null, targetCount = HOME_BATCH_SIZE, options = {}) {
        if (options.source === 'dom' || !getQuestionId()) {
            return collectQuestionAnswersFromDOM(statusEl, targetCount, options);
        }
        try {
            const apiRecords = await collectQuestionAnswersFromApi(statusEl, targetCount, options);
            if (apiRecords.length || _questionState.apiStarted) return apiRecords;
        } catch (err) {
            // API 已经成功翻过页时不再回退：说明链路可用，只是本次请求异常，
            // 交给上层显示错误并允许用户重试。
            if (_questionState.apiStarted) throw err;
            console.warn('知乎沉浸式阅读：问题回答 API 加载失败，回退读取当前已加载回答', err);
            const message = `回答 API 加载失败，改为读取当前页面已加载的回答：${err.message || err}`;
            updateQuestionCollectStatus(statusEl, message);
            _questionState.apiNextUrl = '';
            _questionState.exhausted = false;
        }
        return collectQuestionAnswersFromDOM(statusEl, targetCount, options);
    }

    function isQuestionApiActive() {
        return !!_questionState.apiStarted;
    }

    // 与首页 _homeState.groups 等价的轻量实现：回答仍存在一维 answers 数组里，
    // 只给每条打上 batchIndex，渲染时据此插入批次分隔线。
    function tagQuestionBatch(batch) {
        const batchIndex = _questionState.batchCount || 0;
        batch.forEach(answer => { answer.batchIndex = batchIndex; });
        _questionState.batchCount = batchIndex + 1;
        return batch;
    }

    // 与 getHomeLayout / getFollowLayout 同一套 crossOrigin 存储契约，独立 key。
    function getQuestionLayout() {
        return crossOriginGet('zh-question-layout') || 'double';
    }

    function setQuestionLayout(layout) {
        crossOriginSet('zh-question-layout', layout);
    }

    function getQuestionFeedMode() {
        return config.homeFeedMode === 'scroll' ? 'scroll' : 'paged';
    }

    function getQuestionExistingKeys() {
        return new Set(_questionState.answers.map(answer => answer.key).filter(Boolean));
    }

    async function collectMoreQuestionAnswers(batchSize = HOME_BATCH_SIZE, statusEl = null) {
        if (_questionState.loadingMore || _questionState.exhausted) return [];
        _questionState.loadingMore = true;
        // API 采集不依赖原页面滚动，无需隐藏 wrapper、显示原页面，也无需回滚到顶部；
        // 只有 DOM 兜底采集需要这套「让原页面可见并滚到底」的动作。
        const domFallbackMode = !isQuestionApiActive();
        const wrapper = domFallbackMode ? document.getElementById('immersive-wrapper') : null;
        const previousWrapperDisplay = wrapper?.style.display || '';
        const wasImmersive = domFallbackMode && !!window._isImmersive;
        if (wrapper) wrapper.style.display = 'none';
        if (domFallbackMode) {
            setOriginalPageVisibleForWiki(true);
            await sleep(120);
        }

        try {
            let batch = await collectQuestionAnswers(statusEl, batchSize, {
                existingKeys: getQuestionExistingKeys(),
                label: '懒加载问题回答'
            });
            if (!batch.length) {
                _questionState.exhausted = true;
                return [];
            }
            batch = await enrichAnswersForList(batch, statusEl);
            tagQuestionBatch(batch);
            _questionState.answers = _questionState.answers.concat(batch);
            // API 路径的 exhausted 由 paging.is_end 决定，不能用「不足一批」反推
            if (!isQuestionApiActive() && batch.length < batchSize) _questionState.exhausted = true;
            return batch;
        } finally {
            // 只在真正动过原页面可见性的 DOM 兜底路径里恢复，避免 API 路径产生不成对的副作用
            if (domFallbackMode) setOriginalPageVisibleForWiki(false);
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
            renderQuestionList({ scrollY: keepScrollY, preserveScroll: true });
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

    // 单列/双列切换：与 renderHomeGroupToolbar / renderFollowGroupToolbar 同一形态，
    // 复用 .zh-home-toolbar / .zh-home-nav-btn 样式，图标与首页保持一致。
    function renderQuestionListToolbar(wrapper) {
        const toolbar = document.createElement('div');
        toolbar.className = 'zh-home-toolbar';

        const indicator = document.createElement('span');
        indicator.className = 'zh-home-nav-indicator zh-home-scroll-count';
        indicator.textContent = `已加载 ${_questionState.answers.length} 个回答`;
        toolbar.appendChild(indicator);

        const layoutBtn = document.createElement('button');
        layoutBtn.className = 'zh-home-nav-btn zh-home-layout-btn';
        layoutBtn.title = '切换单列/双列';
        const isSingle = getQuestionLayout() === 'single';
        layoutBtn.innerHTML = isSingle
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="3" width="9" height="8" rx="1"/><rect x="13" y="3" width="9" height="8" rx="1"/><rect x="2" y="13" width="9" height="8" rx="1"/><rect x="13" y="13" width="9" height="8" rx="1"/></svg>'
            : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/></svg>';
        layoutBtn.addEventListener('click', () => {
            setQuestionLayout(isSingle ? 'double' : 'single');
            renderQuestionList({ preserveScroll: true });
        });
        toolbar.appendChild(layoutBtn);

        wrapper.appendChild(toolbar);
    }

    async function refreshQuestionAfterScroll(sentinel, controller, status) {
        if (_questionState.loadingMore || !sentinel.isConnected) return [];
        return collectMoreQuestionAnswers(HOME_BATCH_SIZE, status);
    }

    // 与 prepareHomeScrollRefresh / prepareFollowScrollRefresh 同构：
    // 滚动模式下把「触底自动加载」换成首页那套拉动进度环门控。
    function prepareQuestionScrollRefresh(wrapper) {
        disconnectFeedScrollController();
        if (getQuestionFeedMode() !== 'scroll') return;

        const sentinel = wrapper.querySelector('#zh-question-scroll-sentinel') || document.createElement('div');
        sentinel.id = 'zh-question-scroll-sentinel';
        sentinel.className = 'zh-feed-load-gate';
        if (_questionState.exhausted) {
            sentinel.textContent = `已加载全部 ${_questionState.answers.length} 个回答`;
            sentinel.classList.add('is-exhausted');
            if (!sentinel.isConnected) wrapper.appendChild(sentinel);
            return;
        }
        sentinel.setAttribute('aria-label', '继续加载问题回答');
        if (!sentinel.isConnected) wrapper.appendChild(sentinel);

        return () => {
            if (_questionState.collecting || !sentinel.isConnected) return null;
            return setupFeedScrollController({
                sentinel,
                hasNext: () => !_questionState.exhausted,
                labels: {
                    loading: '正在加载下一组回答...',
                    error: '网络未跟上，继续向下滚动重试'
                },
                onLoadNext: (controller, status) => refreshQuestionAfterScroll(sentinel, controller, status),
                onCommit: batch => {
                    if (batch?.length) {
                        renderQuestionList({ focusLatestBatch: true, smoothFocus: true });
                        return true;
                    }
                    sentinel.classList.remove('is-loading');
                    sentinel.classList.add('is-exhausted');
                    sentinel.textContent = `已加载全部 ${_questionState.answers.length} 个回答`;
                    disconnectFeedScrollController();
                    return false;
                }
            });
        };
    }

    function renderQuestionList(options = {}) {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return;
        const previousScrollY = window.scrollY;
        disconnectFeedScrollController();
        _questionState.view = 'list';
        restoreLiveMount();
        clearQuestionTranslations();
        wrapper.classList.remove('zh-has-top-nav');
        wrapper.classList.add('zh-question-wide');
        wrapper.innerHTML = '';
        document.querySelector('.zh-copy-md-container')?.remove();
        appendQuestionHeader(wrapper, false);
        renderQuestionListToolbar(wrapper);

        if (!_questionState.answers.length) {
            const empty = document.createElement('div');
            empty.className = 'zh-collect-status';
            empty.textContent = '没有采集到可展示的回答。';
            wrapper.appendChild(empty);
            return;
        }

        const scrollMode = getQuestionFeedMode() === 'scroll';
        const list = document.createElement('div');
        list.className = 'zh-answer-list' + (getQuestionLayout() === 'single' ? ' zh-answer-list-single' : '');
        _questionState.answers.forEach((answer, index) => {
            const batchIndex = Number(answer.batchIndex) || 0;
            const isBatchHead = index === 0 || (Number(_questionState.answers[index - 1]?.batchIndex) || 0) !== batchIndex;
            if (scrollMode && isBatchHead && batchIndex > 0) {
                const divider = document.createElement('div');
                divider.className = 'zh-feed-batch-divider zh-feed-batch-anchor';
                divider.innerHTML = `<span>第 ${batchIndex + 1} 批 · ${HOME_BATCH_SIZE} 个回答</span>`;
                list.appendChild(divider);
            }

            const item = document.createElement('div');
            item.className = 'zh-answer-list-item';

            const meta = document.createElement('div');
            meta.className = 'zh-answer-list-meta';
            if (answer.authorAvatar) {
                const avatar = document.createElement('img');
                avatar.src = answer.authorAvatar;
                avatar.alt = '';
                meta.appendChild(avatar);
            }
            const metaText = document.createElement('span');
            metaText.textContent = answer.author || '匿名用户';
            meta.appendChild(metaText);
            const indexTag = document.createElement('span');
            indexTag.className = 'zh-answer-list-index';
            indexTag.textContent = `#${index + 1}`;
            meta.appendChild(indexTag);

            const snippet = document.createElement('p');
            snippet.className = 'zh-answer-list-snippet';
            snippet.textContent = answer.preview || answer.snippet || '该回答暂无可预览文本。';

            item.appendChild(meta);
            item.appendChild(snippet);

            // 底部统计栏与首页推荐卡同源：直接复用 getHomeCardStats 的字段与格式化，
            // DOM 兜底采集的记录没有这些计数字段，退回展示 voteText。
            const stats = getHomeCardStats(answer);
            const statValues = stats.length ? stats : (answer.voteText ? [answer.voteText] : []);
            if (statValues.length) {
                const statsFooter = document.createElement('div');
                statsFooter.className = 'zh-answer-list-stats';
                statValues.forEach(value => {
                    const stat = document.createElement('span');
                    stat.textContent = value;
                    statsFooter.appendChild(stat);
                });
                item.appendChild(statsFooter);
            }

            item.addEventListener('click', () => {
                _questionState.listScrollY = window.scrollY;
                renderQuestionAnswer(index, false);
            });
            list.appendChild(item);
        });
        wrapper.appendChild(list);

        const activateScrollRefresh = prepareQuestionScrollRefresh(wrapper);

        // 分页模式保留原来的文字状态 + 按钮 + IntersectionObserver 触底加载；
        // 滚动模式的加载反馈完全交给上面的 .zh-feed-load-gate。
        if (!scrollMode) {
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
        }

        setupImageToggles();

        const latestDivider = Array.from(wrapper.querySelectorAll('.zh-feed-batch-divider')).pop();
        const shouldPosition = options.focusLatestBatch || options.preserveScroll || options.restoreScroll;
        const targetScrollY = options.focusLatestBatch
            ? getFeedAnchorScrollTop(latestDivider)
            : options.scrollY ?? (options.restoreScroll ? _questionState.listScrollY : options.preserveScroll ? previousScrollY : null);
        const positionList = () => {
            const top = shouldPosition ? Math.max(0, Number(targetScrollY) || 0) : 0;
            window.scrollTo(options.smoothFocus ? { top, behavior: 'smooth' } : { top, behavior: 'auto' });
            if (options.startScrollRefresh !== false) {
                requestAnimationFrame(() => requestAnimationFrame(() => activateScrollRefresh?.()));
            }
        };
        if (shouldPosition) requestAnimationFrame(positionList);
        else positionList();
        return () => requestAnimationFrame(() => requestAnimationFrame(() => activateScrollRefresh?.()));
    }

    function setCurrentQuestionAnswer(index) {
        const safeIndex = Math.max(0, Math.min(index, _questionState.answers.length - 1));
        const answer = _questionState.answers[safeIndex];
        _questionState.currentIndex = safeIndex;
        _questionState.exitScrollY = Number.isFinite(answer?.sourceTop) ? answer.sourceTop : _questionState.originalScrollY;
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
        disconnectFeedScrollController();
        wrapper.classList.add('zh-has-top-nav');
        wrapper.classList.remove('zh-question-wide');
        wrapper.innerHTML = '';
        appendQuestionHeader(wrapper, showAllAnswersButton);

        // 顶栏文案、箭头与禁用态与 page-home.js renderHomeItem 保持一致
        const toolbar = document.createElement('div');
        toolbar.className = 'zh-question-toolbar zh-reader-top-nav';
        if (_questionState.answers.length > 1 || !_questionState.exhausted) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'zh-inline-btn';
            prevBtn.textContent = '‹ 上一篇';
            prevBtn.disabled = safeIndex <= 0;
            prevBtn.style.opacity = prevBtn.disabled ? '0.35' : '1';
            prevBtn.addEventListener('click', () => navigateQuestionAnswer(-1));
            toolbar.appendChild(prevBtn);

            const nextBtn = document.createElement('button');
            nextBtn.className = 'zh-inline-btn';
            nextBtn.textContent = safeIndex >= _questionState.answers.length - 1 && !_questionState.exhausted
                ? `加载后续 ${HOME_BATCH_SIZE} 个`
                : '下一篇 ›';
            nextBtn.disabled = safeIndex >= _questionState.answers.length - 1 && _questionState.exhausted;
            nextBtn.style.opacity = nextBtn.disabled ? '0.35' : '1';
            nextBtn.addEventListener('click', () => navigateQuestionAnswer(1));
            toolbar.appendChild(nextBtn);

            const backBtn = document.createElement('button');
            backBtn.className = 'zh-inline-btn';
            backBtn.textContent = '返回列表';
            backBtn.addEventListener('click', () => renderQuestionList({ restoreScroll: true }));
            toolbar.appendChild(backBtn);
        }

        const current = document.createElement('span');
        current.className = 'zh-nav-current';
        current.textContent = `${safeIndex + 1} / ${_questionState.answers.length}`;
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
        view.className = 'zh-question-answer-view zh-page-enter';
        if (!mountLiveNode(answer.liveNode, view)) {
            view.appendChild(cleanupAnswerClone(answer.clone.cloneNode(true)));
        }
        wrapper.appendChild(view);

        // API 采集的回答挂互动栏（赞同/反对/感谢/收藏/评论/原文），与首页推荐流同构。
        // DOM 兜底采集的克隆自带知乎原生 .ContentItem-actions，不重复挂。
        if (answer.apiTargetId) {
            const slot = view.querySelector('.zh-api-action-slot');
            if (slot) slot.replaceWith(buildActionBar(answer));
        }

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
            // 不再读取回答缓存：API 分页等幂且够快，每次进入都重新采集第一批。
            // 旧缓存会连带恢复「已采集完」（exhausted）状态，导致继续加载被永久关闭。
            try {
                sessionStorage.removeItem('zh-force-main-question-collect');
            } catch (err) {}
            _questionState.answers = await collectQuestionAnswers(status, HOME_BATCH_SIZE, {
                label: '采集首批问题回答'
            });
            // API 路径的 exhausted 已由 paging.is_end 精确给出，不能用「不足一批」反推：
            // 过滤掉非回答条目后也可能不足 6 条，会误判为没有更多回答。
            if (!isQuestionApiActive()) {
                _questionState.exhausted = _questionState.answers.length < HOME_BATCH_SIZE;
            }
            _questionState.answers = await enrichAnswersForList(_questionState.answers, status);
            _questionState.batchCount = 0;
            tagQuestionBatch(_questionState.answers);
            _questionState.currentIndex = 0;
            _questionState.listScrollY = 0;
            _questionState.exitScrollY = _questionState.answers[0]?.sourceTop || _questionState.originalScrollY;
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
