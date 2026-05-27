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
        const metaUrl = item.querySelector('meta[itemprop="url"]')?.content;
        if (metaUrl) return metaUrl;
        const answerLink = item.querySelector('a[href*="/answer/"]')?.href;
        if (answerLink) return answerLink;
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

    function renderQuestionAnswer(index = 0, showAllAnswersButton = false) {
        const wrapper = document.getElementById('immersive-wrapper');
        const safeIndex = setCurrentQuestionAnswer(index);
        const answer = _questionState.answers[safeIndex];
        if (!wrapper || !answer) return;
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
                if (config.autoSum || config.autoTr) document.getElementById('zh-translate-btn')?.click();
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
        } catch (err) {
            removeCollectOverlay();
            window._isImmersive = false;
            alert(`进入问题沉浸模式失败：${err.message}`);
        } finally {
            _questionState.collecting = false;
        }
    }
