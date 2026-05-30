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
        const batch = await loadNextFollowGroup(status);
        renderFollowList();
        requestAnimationFrame(() => window.scrollTo(0, 0));
        return batch;
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
        return localStorage.getItem('zh-follow-layout') || 'single';
    }

    function setFollowLayout(layout) {
        localStorage.setItem('zh-follow-layout', layout);
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

    function renderFollowItem(indexInGroup = 0, groupIndex = _followState.currentGroupIndex) {
        const wrapper = document.getElementById('immersive-wrapper');
        const position = setCurrentFollowItem(indexInGroup, groupIndex);
        const itemRecord = position.item;
        if (!wrapper || !itemRecord) return;
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
