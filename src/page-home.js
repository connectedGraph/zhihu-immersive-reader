    let _feedScrollController = null;

    function getHomeFeedMode() {
        return config.homeFeedMode === 'scroll' ? 'scroll' : 'paged';
    }

    function disconnectFeedScrollController() {
        const controller = _feedScrollController;
        if (!controller) return;
        controller.destroy();
        if (_feedScrollController === controller) _feedScrollController = null;
    }

    function setupFeedScrollController({ sentinel, onRefresh }) {
        if (!sentinel?.isConnected || typeof onRefresh !== 'function') return null;
        disconnectFeedScrollController();

        const progress = document.createElement('div');
        progress.className = 'zh-feed-scroll-progress';
        progress.setAttribute('role', 'progressbar');
        progress.setAttribute('aria-label', '下一批内容加载进度');
        progress.setAttribute('aria-valuemin', '0');
        progress.setAttribute('aria-valuemax', '100');
        progress.setAttribute('aria-valuenow', '0');

        const progressBar = document.createElement('div');
        progressBar.className = 'zh-feed-scroll-progress-bar';
        const progressValue = document.createElement('span');
        progressValue.className = 'zh-feed-scroll-progress-value';
        progressValue.textContent = '0%';
        progress.appendChild(progressBar);
        progress.appendChild(progressValue);
        document.body.appendChild(progress);

        const controller = {
            destroyed: false,
            armed: false,
            atEnd: false,
            loading: false,
            distance: 0,
            displayedRatio: 0,
            threshold: Math.max(1, window.innerWidth || document.documentElement.clientWidth || 0),
            lastScrollY: Math.max(0, window.scrollY || 0),
            lastTouchY: null,
            lastFrameTime: null,
            armTimer: null,
            readyTimer: null,
            frameId: null,
            progress,
            requestRefresh: null,
            retry: null,
            destroy: null
        };

        const isAtDocumentEnd = () => {
            const root = document.documentElement;
            const body = document.body;
            const viewportHeight = window.innerHeight || root.clientHeight || 0;
            const documentHeight = Math.max(root.scrollHeight, body?.scrollHeight || 0);
            return (window.scrollY || 0) + viewportHeight >= documentHeight - 8;
        };

        const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        const cancelReadyRefresh = () => {
            if (controller.readyTimer === null) return;
            clearTimeout(controller.readyTimer);
            controller.readyTimer = null;
        };

        const renderProgress = timestamp => {
            controller.frameId = null;
            if (controller.destroyed) return;
            const targetRatio = Math.max(0, Math.min(1, controller.distance / controller.threshold));
            const elapsed = controller.lastFrameTime === null ? 16 : Math.min(64, Math.max(0, timestamp - controller.lastFrameTime));
            controller.lastFrameTime = timestamp;
            if (prefersReducedMotion) {
                controller.displayedRatio = targetRatio;
            } else {
                const follow = 1 - Math.exp(-elapsed / 85);
                controller.displayedRatio += (targetRatio - controller.displayedRatio) * follow;
                if (Math.abs(targetRatio - controller.displayedRatio) < 0.001) controller.displayedRatio = targetRatio;
            }

            const percent = Math.round(controller.displayedRatio * 100);
            const isReady = targetRatio >= 1 && controller.displayedRatio >= 0.995;
            progressBar.style.setProperty('--zh-feed-progress-angle', `${controller.displayedRatio * 360}deg`);
            progressValue.textContent = controller.loading ? '...' : controller.atEnd ? `${percent}%` : '↓';
            progress.setAttribute('aria-valuenow', String(percent));
            progress.setAttribute('aria-valuetext', controller.atEnd ? `下一批加载进度 ${percent}%` : '滚动到列表底部后开始累计');
            progress.classList.toggle('is-at-end', controller.atEnd);
            progress.classList.toggle('is-ready', isReady);

            if (isReady && !controller.loading && controller.readyTimer === null) {
                controller.readyTimer = setTimeout(() => {
                    controller.readyTimer = null;
                    if (controller.atEnd && controller.distance >= controller.threshold) requestRefresh(false);
                }, prefersReducedMotion ? 0 : 140);
            } else if (!isReady) {
                cancelReadyRefresh();
            }

            if (Math.abs(targetRatio - controller.displayedRatio) >= 0.001) scheduleProgressRender();
        };

        const scheduleProgressRender = () => {
            if (controller.frameId === null) controller.frameId = requestAnimationFrame(renderProgress);
        };

        const scheduleArm = (delay = 120) => {
            clearTimeout(controller.armTimer);
            controller.armed = false;
            controller.armTimer = setTimeout(() => {
                if (controller.destroyed) return;
                controller.lastScrollY = Math.max(0, window.scrollY || 0);
                controller.armed = true;
            }, delay);
        };

        const requestRefresh = async force => {
            if (controller.destroyed || controller.loading || !sentinel.isConnected) return;
            if (!force && (!controller.armed || controller.distance < controller.threshold)) return;
            cancelReadyRefresh();
            controller.loading = true;
            controller.armed = false;
            progress.classList.add('is-loading');
            progressValue.textContent = '...';
            try {
                await onRefresh(controller);
            } finally {
                if (!controller.destroyed) {
                    controller.loading = false;
                    controller.distance = 0;
                    progress.classList.remove('is-loading', 'is-ready');
                    scheduleProgressRender();
                    scheduleArm();
                }
            }
        };

        const recordDistance = delta => {
            if (!controller.armed || !controller.atEnd || controller.loading || !Number.isFinite(delta) || delta <= 0) return;
            controller.distance = Math.min(controller.threshold, controller.distance + delta);
            scheduleProgressRender();
        };

        const resetProgress = () => {
            if (controller.distance === 0) return;
            controller.distance = 0;
            scheduleProgressRender();
        };

        const updateEndState = () => {
            const nextAtEnd = isAtDocumentEnd();
            if (!nextAtEnd) resetProgress();
            if (controller.atEnd !== nextAtEnd) {
                controller.atEnd = nextAtEnd;
                scheduleProgressRender();
            }
        };

        const onScroll = () => {
            const scrollY = Math.max(0, window.scrollY || 0);
            controller.lastScrollY = scrollY;
            if (!controller.armed) { scheduleArm(); return; }
            updateEndState();
        };

        const onWheel = event => {
            if (!controller.armed || controller.loading) return;
            updateEndState();
            if (!controller.atEnd) return;
            if (event.deltaY < 0) { resetProgress(); return; }
            const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? (window.innerHeight || 1) : 1;
            recordDistance(event.deltaY * unit);
        };

        const onTouchStart = event => {
            controller.lastTouchY = event.touches[0]?.clientY ?? null;
            updateEndState();
        };

        const onTouchMove = event => {
            const touchY = event.touches[0]?.clientY;
            if (!Number.isFinite(touchY) || !Number.isFinite(controller.lastTouchY)) return;
            const delta = controller.lastTouchY - touchY;
            controller.lastTouchY = touchY;
            updateEndState();
            if (!controller.atEnd) return;
            if (delta < 0) { resetProgress(); return; }
            recordDistance(delta);
        };

        const onResize = () => {
            const previousThreshold = controller.threshold;
            controller.threshold = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 0);
            controller.distance = Math.min(controller.threshold, controller.distance * controller.threshold / previousThreshold);
            updateEndState();
            scheduleProgressRender();
        };

        controller.requestRefresh = requestRefresh;
        controller.retry = () => requestRefresh(true);
        controller.destroy = () => {
            if (controller.destroyed) return;
            controller.destroyed = true;
            clearTimeout(controller.armTimer);
            cancelReadyRefresh();
            if (controller.frameId !== null) cancelAnimationFrame(controller.frameId);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('resize', onResize);
            progress.remove();
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('wheel', onWheel, { passive: true });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        _feedScrollController = controller;
        updateEndState();
        scheduleArm();
        return controller;
    }

    function getFeedAnchorScrollTop(element) {
        if (!element) return 0;
        if (typeof element.getBoundingClientRect === 'function') {
            return Math.max(0, Math.round(element.getBoundingClientRect().top + window.scrollY - 12));
        }
        return Math.max(0, Number(element.offsetTop) || 0);
    }

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

    function parseHomeCountValue(raw) {
        if (raw == null || raw === '') return null;
        const text = String(raw).replace(/,/g, '').replace(/\s+/g, '').trim();
        const match = text.match(/^([\d.]+)(万|亿)?$/);
        if (!match) return null;
        const value = Number(match[1]);
        if (!Number.isFinite(value)) return null;
        const multiplier = match[2] === '亿' ? 100000000 : match[2] === '万' ? 10000 : 1;
        return Math.round(value * multiplier);
    }

    function getHomeDomCount(item, itemprop, kind) {
        const metaValue = item.querySelector(`meta[itemprop="${itemprop}"]`)?.getAttribute('content');
        const fromMeta = parseHomeCountValue(metaValue);
        if (fromMeta != null) return fromMeta;
        if (kind === 'follower') return null;
        const actionText = (item.querySelector('.ContentItem-actions')?.textContent || '').replace(/[\u200b\u200c\u200d\ufeff]/g, '').replace(/\s+/g, ' ').trim();
        if (kind === 'voteup') {
            const match = actionText.match(/赞同\s*([\d.]+\s*(?:万|亿)?)/);
            return parseHomeCountValue(match?.[1]);
        }
        const match = actionText.match(/([\d.]+\s*(?:万|亿)?)\s*条评论/);
        if (match) return parseHomeCountValue(match[1]);
        return /添加评论/.test(actionText) ? 0 : null;
    }

    function formatHomeCardCount(value) {
        const count = Number(value);
        return Number.isFinite(count) ? Math.max(0, Math.round(count)).toLocaleString('zh-CN') : '';
    }

    function getHomeCardStats(itemRecord = {}) {
        const stats = [];
        if (itemRecord.voteup_count != null && Number.isFinite(Number(itemRecord.voteup_count))) {
            stats.push(`${formatHomeCardCount(itemRecord.voteup_count)} 赞同`);
        }
        if (itemRecord.comment_count != null && Number.isFinite(Number(itemRecord.comment_count))) {
            stats.push(Number(itemRecord.comment_count) > 0 ? `${formatHomeCardCount(itemRecord.comment_count)} 评论` : '暂无评论');
        }
        if (itemRecord.author_follower_count != null && Number.isFinite(Number(itemRecord.author_follower_count)) && Number(itemRecord.author_follower_count) > 0) {
            stats.push(`${formatHomeCardCount(itemRecord.author_follower_count)} 粉丝`);
        }
        return stats;
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

    function getHomeApiAuthorFollowerCount(target = {}, brief = {}) {
        const author = target.author || brief.member || {};
        return parseHomeCountValue(author.follower_count ?? author.followerCount ?? brief.follower_count);
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
        const authorFollowerCount = getHomeApiAuthorFollowerCount(target, brief);
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
            author_follower_count: authorFollowerCount,
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
            author_follower_count: getHomeDomCount(item, 'zhihu:followerCount', 'follower'),
            voteup_count: getHomeDomCount(item, 'upvoteCount', 'voteup'),
            comment_count: getHomeDomCount(item, 'commentCount', 'comment'),
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
            if (!statusEl?.classList?.contains('zh-home-scroll-status')) showCollectOverlay(message);
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
            schemaVersion: 3,
            groups: _homeState.groups,
            items: _homeState.items,
            currentIndex: _homeState.currentIndex || 0,
            currentGroupIndex: _homeState.currentGroupIndex || 0,
            currentIndexInGroup: _homeState.currentIndexInGroup || 0,
            listScrollY: _homeState.listScrollY || 0,
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

    function getHomeListEntries() {
        syncHomeItemsFromGroups();
        if (getHomeFeedMode() === 'scroll') {
            return _homeState.groups.flatMap((group, groupIndex) => group.map((itemRecord, indexInGroup) => ({
                itemRecord,
                groupIndex,
                indexInGroup
            })));
        }
        const groupIndex = _homeState.currentGroupIndex || 0;
        return getCurrentHomeGroup().map((itemRecord, indexInGroup) => ({ itemRecord, groupIndex, indexInGroup }));
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

        const indicator = document.createElement('span');
        indicator.className = 'zh-home-nav-indicator';
        if (getHomeFeedMode() === 'scroll') {
            indicator.classList.add('zh-home-scroll-count');
            indicator.textContent = `已加载 ${syncHomeItemsFromGroups().length} 条`;
            toolbar.appendChild(indicator);
        } else {
            toolbar.appendChild(makeBtn('上一组', '‹', groupIndex <= 0, () => setHomeGroup(groupIndex - 1)));
            indicator.textContent = `${groups.length ? groupIndex + 1 : 0} / ${groups.length}`;
            toolbar.appendChild(indicator);
            toolbar.appendChild(makeBtn('下一组', '›', groupIndex >= groups.length - 1, () => setHomeGroup(groupIndex + 1)));
            if (!_homeState.exhausted) {
                toolbar.appendChild(makeBtn('加载更多', '+', _homeState.loadingMore, () => loadMoreHomeAndRender()));
            }
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
            renderHomeList({ preserveScroll: getHomeFeedMode() === 'scroll' });
        });
        toolbar.appendChild(layoutBtn);

        wrapper.appendChild(toolbar);
    }

    async function refreshHomeAfterScroll(sentinel, controller) {
        if (_homeState.loadingMore || _homeState.exhausted || !sentinel.isConnected) return;
        sentinel.classList.add('is-loading');
        sentinel.textContent = '正在加载更多推荐...';
        try {
            const batch = await loadNextHomeGroup(sentinel, {
                switchToNewGroup: false,
                label: '连续加载首页推荐'
            });
            if (batch.length) {
                renderHomeList({ focusLatestBatch: true });
            } else {
                disconnectFeedScrollController();
                sentinel.classList.remove('is-loading');
                sentinel.textContent = `已加载全部 ${syncHomeItemsFromGroups().length} 条推荐`;
            }
        } catch (error) {
            sentinel.classList.remove('is-loading');
            sentinel.innerHTML = '<span>加载失败</span><button type="button" class="zh-home-scroll-retry">重试</button>';
            sentinel.querySelector('.zh-home-scroll-retry')?.addEventListener('click', controller.retry, { once: true });
        }
    }

    function prepareHomeScrollRefresh(wrapper) {
        disconnectFeedScrollController();
        if (getHomeFeedMode() !== 'scroll') return;

        const sentinel = wrapper.querySelector('#zh-home-scroll-sentinel') || document.createElement('div');
        sentinel.id = 'zh-home-scroll-sentinel';
        sentinel.className = 'zh-home-scroll-status';
        if (_homeState.exhausted) {
            sentinel.textContent = `已加载全部 ${syncHomeItemsFromGroups().length} 条推荐`;
            if (!sentinel.isConnected) wrapper.appendChild(sentinel);
            return;
        }
        sentinel.textContent = '';
        sentinel.setAttribute('aria-label', '继续加载首页推荐');
        if (!sentinel.isConnected) wrapper.appendChild(sentinel);

        return () => {
            if (_homeState.collecting || !sentinel.isConnected) return null;
            return setupFeedScrollController({
                sentinel,
                onRefresh: controller => refreshHomeAfterScroll(sentinel, controller)
            });
        };
    }

    function renderHomeList(options = {}) {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return;
        const previousScrollY = window.scrollY;
        disconnectFeedScrollController();
        _homeState.view = 'list';
        restoreLiveMount();
        clearHomeTranslations();
        syncHomeItemsFromGroups();
        wrapper.classList.remove('zh-has-top-nav', 'zh-follow-wide', 'zh-follow-double');
        wrapper.classList.add('zh-home-wide');
        wrapper.innerHTML = '';
        appendFeedSwitchHeader(wrapper, 'home');
        renderHomeGroupToolbar(wrapper);

        const entries = getHomeListEntries();

        if (!entries.length) {
            const empty = document.createElement('div');
            empty.className = 'zh-collect-status';
            empty.textContent = '没有采集到可展示的首页推荐。';
            wrapper.appendChild(empty);
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'zh-home-grid' + (getHomeLayout() === 'single' ? ' zh-home-grid-single' : '') + (getHomeFeedMode() === 'scroll' ? ' zh-home-grid-scroll' : '');
        entries.forEach(({ itemRecord, groupIndex, indexInGroup }) => {
            if (getHomeFeedMode() === 'scroll' && indexInGroup === 0 && groupIndex > 0) {
                const divider = document.createElement('div');
                divider.className = 'zh-feed-batch-divider';
                divider.innerHTML = `<span>第 ${groupIndex + 1} 批 · 6 条推荐</span>`;
                grid.appendChild(divider);
            }
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
            metaText.textContent = itemRecord.author || '未知作者';
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
            const stats = getHomeCardStats(itemRecord);
            if (stats.length) {
                const statsFooter = document.createElement('div');
                statsFooter.className = 'zh-home-card-stats';
                stats.forEach(value => {
                    const stat = document.createElement('span');
                    stat.textContent = value;
                    statsFooter.appendChild(stat);
                });
                card.appendChild(statsFooter);
            }
            card.addEventListener('click', () => {
                _homeState.listScrollY = window.scrollY;
                renderHomeItem(indexInGroup, groupIndex);
            });
            grid.appendChild(card);
        });
        wrapper.appendChild(grid);
        const activateScrollRefresh = prepareHomeScrollRefresh(wrapper);

        setupImageToggles();
        const latestDivider = Array.from(wrapper.querySelectorAll('.zh-feed-batch-divider')).pop();
        const targetScrollY = options.focusLatestBatch
            ? getFeedAnchorScrollTop(latestDivider)
            : options.scrollY ?? (options.restoreScroll ? _homeState.listScrollY : options.preserveScroll ? previousScrollY : null);
        const positionList = () => {
            window.scrollTo(0, options.focusLatestBatch || options.preserveScroll || options.restoreScroll
                ? Math.max(0, Number(targetScrollY) || 0)
                : 0);
            if (options.startScrollRefresh !== false) {
                requestAnimationFrame(() => requestAnimationFrame(() => activateScrollRefresh?.()));
            }
        };
        if (options.focusLatestBatch || options.preserveScroll || options.restoreScroll) requestAnimationFrame(positionList);
        else positionList();
        return () => requestAnimationFrame(() => requestAnimationFrame(() => activateScrollRefresh?.()));
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
        disconnectFeedScrollController();
        
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
        backBtn.addEventListener('click', () => renderHomeList({ restoreScroll: true }));
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
            if (cached?.schemaVersion === 3 && Array.isArray(cached.groups) && cached.groups.length) {
                _homeState.groups = normalizeHomeGroups(cached.groups);
                syncHomeItemsFromGroups();
                _homeState.currentGroupIndex = Math.max(0, Math.min(cached.currentGroupIndex || 0, _homeState.groups.length - 1));
                _homeState.currentIndexInGroup = Math.max(0, Math.min(cached.currentIndexInGroup || 0, (_homeState.groups[_homeState.currentGroupIndex]?.length || 1) - 1));
                _homeState.currentIndex = getHomeGroupStartIndex(_homeState.currentGroupIndex) + _homeState.currentIndexInGroup;
                _homeState.listScrollY = cached.listScrollY || 0;
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
            const startScrollRefresh = renderHomeList({ startScrollRefresh: false });
            _homeState.collecting = false;
            startScrollRefresh?.();
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
