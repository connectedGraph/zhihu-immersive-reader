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
            const raw = localStorage.getItem(WIKI_HISTORY_KEY);
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
                localStorage.setItem(WIKI_HISTORY_KEY, JSON.stringify(records));
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
            wikiJudgment: '待补全文',
            wikiTags: ['采集异常', '待补全文'],
            wikiCredibility: '需核验',
            wikiCredibilityReason: reason || item.anomalyReason || item.fetchError || '正文缺失或来源 URL 异常。',
            wikiSummary: '未能可靠取得正文，不进入正式学习卡片库。',
            wikiValue: '待补全文后再判断。',
            title
        };
    }

    function getWikiLearningCardSystemPrompt() {
        return `你是我的学习型知识库整理助手。你的目标是把知乎内容整理成短、准、可复查的学习卡片；第一职责是降噪，不是把普通观点包装成宏大理论。

请输出严格 JSON，不要 Markdown，不要代码块。字段如下：
contentType：只能选 概念 / 方法 / 案例 / 观点 / 争议 / 梗文化 / 采集异常 / 待核验
oneSentence：35到80字，只写这条内容最值得带走的一个判断
corePoints：2到3条，每条不超过70字；只写原文支撑得住的机制、变量、判断标准、反例或操作步骤
transferScenarios：0到2个，每条不超过45字；没有明确迁移价值就返回空数组
evidenceExamples：0到2条，每条不超过60字；只摘原文里的具体例子、数字、案例或论据
judgment：只能选 正式入库 / 只作素材 / 待补全文 / 丢弃
tags：3到5个概念型中文标签，避免 AI产品体验、用户体验、产品生态 这类泛标签
credibility：只能选 高 / 中 / 低 / 需核验
credibilityReason：一句话说明可信度原因

重要要求：
- 如果正文缺失、像作者主页/账号页/来源索引，不要强行总结观点，标为 采集异常，judgment 为 待补全文。
- 只依据输入内容，不要补充外部事实、日期、论文、机构、人物身份或统计数字。
- 不要给普通说法强行起名，不要滥用"模型、机制、效应、范式、底层架构、系统性纠偏、夺回掌控权"等包装词；除非原文明确提出。
- 不要写"具有观察价值""适合记录为典型案例""值得深挖"这种空泛话。
- 正式入库必须满足：有清晰方法/模型/判断标准/反例，且至少有一个具体证据或例子。否则优先只作素材。
- 对医学、营养、法律、金融、政治、现实事件、心理诊断类内容保持保守；知乎个人经验不能标为高可信。
- 不要把知乎观点当事实；涉及现实事件、医学、法律、政治、金融时，可信度必须保守，必要时标为 需核验。
- 标题、作者、链接等元信息只来自用户输入，不要自行改写或猜测。
- 输出要适合 Obsidian/Notion 长期复习，而不是日报。`;
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
        const judgment = normalizeWikiChoice(data.judgment, ['正式入库', '只作素材', '待补全文', '丢弃'], '只作素材');
        const contentType = normalizeWikiChoice(data.contentType, ['概念', '方法', '案例', '观点', '争议', '梗文化', '采集异常', '待核验'], '观点');
        const credibility = normalizeWikiChoice(data.credibility, ['高', '中', '低', '需核验'], '中');

        return {
            ...item,
            wikiContentType: contentType,
            wikiOneSentence: oneSentence,
            wikiCorePoints: compactWikiArray(data.corePoints, 3, 90),
            wikiTransferScenarios: compactWikiArray(data.transferScenarios, 2, 60),
            wikiEvidenceExamples: compactWikiArray(data.evidenceExamples, 2, 70),
            wikiJudgment: judgment,
            wikiTags: tags,
            wikiCredibility: credibility,
            wikiCredibilityReason: clipWikiText(data.credibilityReason || '来自知乎内容，需结合原文语境判断。', 90),
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
        const materialCount = items.filter(item => item.wikiJudgment === '只作素材').length;
        const pendingCount = items.filter(item => item.wikiContentType === '采集异常' || item.wikiJudgment === '待补全文').length;
        const cleanSynthesis = cleanWikiSynthesisMarkdown(synthesis);
        const lines = [
            `# 知乎首页学习卡片库 - ${date}`,
            '',
            `生成时间：${new Date().toLocaleString()}`,
            `条目数量：${items.length}`,
            `入库概览：正式 ${formalCount} · 素材 ${materialCount} · 待补全文 ${pendingCount}`,
            ''
        ];

        if (cleanSynthesis) {
            lines.push('## 总览：趋势雷达 + 学习萃取', '', cleanSynthesis, '');
        }

        const learningItems = items.filter(item => item.wikiContentType !== '采集异常' && !['待补全文', '丢弃'].includes(item.wikiJudgment));
        const anomalyItems = items.filter(item => item.wikiContentType === '采集异常' || ['待补全文', '丢弃'].includes(item.wikiJudgment));

        lines.push('## 知识卡片库', '');
        learningItems.forEach((item, index) => {
            const tags = (item.wikiTags || []).map(tag => `#${String(tag).replace(/^#/, '').replace(/\s+/g, '_')}`).join(' ');
            lines.push(`### ${index + 1}. ${item.title || '未命名内容'}`);
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
            if (item.wikiEvidenceExamples?.length) {
                lines.push(`- 证据与例子：`);
                item.wikiEvidenceExamples.forEach(example => lines.push(`  - ${example}`));
            }
            lines.push(`- 入库判断：${item.wikiJudgment || '只作素材'}`);
            lines.push(`- 检索标签：${tags || '无'}`);
            lines.push(`- 可信度：${item.wikiCredibility || '中'}${item.wikiCredibilityReason ? `，${item.wikiCredibilityReason}` : ''}`);
            lines.push('');
        });

        if (anomalyItems.length) {
            lines.push('## 采集异常 / 待补全文', '');
            anomalyItems.forEach((item, index) => {
                const tags = (item.wikiTags || []).map(tag => `#${String(tag).replace(/^#/, '').replace(/\s+/g, '_')}`).join(' ');
                lines.push(`### ${index + 1}. ${item.title || '未命名内容'}`);
                lines.push(`- 链接：${formatWikiSourceLink(item)}`);
                if (item.fullTextSource || item.source) lines.push(`- 正文来源：${item.fullTextSource || item.source}`);
                lines.push(`- 判断：${item.wikiJudgment || '待补全文'}`);
                lines.push(`- 原因：${item.wikiCredibilityReason || item.anomalyReason || item.fetchError || '正文缺失或来源异常。'}`);
                if (item.fetchWarning) lines.push(`- 抓取备注：${item.fetchWarning}`);
                lines.push(`- 首页摘录：${clipWikiText(item.snippet || item.text?.slice(0, 180) || '无', 180)}`);
                lines.push(`- 标签：${tags || '#采集异常 #待补全文'}`);
                lines.push('');
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
            main.appendChild(actions);
            item.appendChild(main);
            list.appendChild(item);
        });
        section.appendChild(list);
        wrapper.appendChild(section);
    }

    function renderWikiDashboard() {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return;
        _homeState.view = 'wiki';
        restoreLiveMount();
        clearHomeTranslations();
        wrapper.classList.remove('zh-has-top-nav', 'zh-home-wide');
        wrapper.innerHTML = '';
        appendHomeHeader(wrapper);

        const status = document.createElement('div');
        status.id = 'zh-wiki-progress';
        status.className = 'zh-wiki-progress';
        if (wikiState.running) {
            status.textContent = `信息流 Wiki：${wikiState.progressMessage || '正在运行...'}`;
        } else if (wikiState.finished && wikiState.markdown) {
            status.textContent = `信息流 Wiki：上一次运行已完成，共 ${wikiState.items.length || 0} 条。`;
        } else {
            status.textContent = '信息流 Wiki：未运行。打开历史可追溯之前的任务，开始新采集会生成一条新的历史记录。';
        }
        wrapper.appendChild(status);

        const actions = document.createElement('div');
        actions.className = 'zh-wiki-actions';
        if (!wikiState.running) {
            actions.appendChild(createWikiActionButton('开始新采集', startWikiRun));
        } else {
            actions.appendChild(createWikiActionButton(wikiState.paused ? '恢复任务' : '暂停任务', () => setWikiPaused(!wikiState.paused)));
            actions.appendChild(createWikiActionButton('刷新进度', renderWikiDashboard));
        }
        actions.appendChild(createWikiActionButton('卡片库', renderWikiCardPanel));
        if (_homeState.items.length) actions.appendChild(createWikiActionButton('返回推荐列表', renderHomeList));
        wrapper.appendChild(actions);

        if (wikiState.running || wikiState.log?.length) wrapper.appendChild(renderWikiLog());
        renderWikiHistory(wrapper);
        window.scrollTo(0, 0);
    }

    function renderWikiShell(message = '准备运行信息流 Wiki...') {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return null;
        _homeState.view = 'wiki';
        restoreLiveMount();
        clearHomeTranslations();
        wrapper.classList.remove('zh-has-top-nav', 'zh-home-wide');
        wrapper.innerHTML = '';
        appendHomeHeader(wrapper);
        const progress = document.createElement('div');
        progress.id = 'zh-wiki-progress';
        progress.className = 'zh-wiki-progress';
        progress.textContent = `信息流 Wiki：${message}`;
        wrapper.appendChild(progress);
        const actions = document.createElement('div');
        actions.className = 'zh-wiki-actions';
        actions.appendChild(createWikiActionButton('暂停任务', () => setWikiPaused(true)));
        actions.appendChild(createWikiActionButton('刷新进度', renderWikiDashboard));
        wrapper.appendChild(actions);
        wrapper.appendChild(renderWikiLog());
        renderWikiHistory(wrapper);
        window.scrollTo(0, 0);
        return progress;
    }

    function renderWikiMarkdownToHTML(md) {
        const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const lines = md.split('\n');
        const out = [];
        let inList = false;
        let listType = '';

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

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

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
        return out.join('\n');
    }

    function renderWikiResult(markdown, record = null) {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return;
        wrapper.classList.remove('zh-has-top-nav', 'zh-home-wide');
        wrapper.innerHTML = '';
        appendHomeHeader(wrapper);

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
        backBtn.textContent = '返回 Wiki 面板';
        backBtn.addEventListener('click', renderWikiDashboard);

        actions.appendChild(copyBtn);
        actions.appendChild(downloadBtn);
        actions.appendChild(backBtn);
        wrapper.appendChild(actions);

        const content = document.createElement('div');
        content.className = 'zh-wiki-output zh-wiki-rendered';
        content.innerHTML = renderWikiMarkdownToHTML(markdown);
        wrapper.appendChild(content);
        renderWikiHistory(wrapper);
        window.scrollTo(0, 0);
    }

    async function startWikiRun() {
        if (!isHomePage()) return alert('信息流 Wiki 目前只在知乎首页运行。');
        if (wikiState.running) {
            renderWikiDashboard();
            return;
        }
        const runConfig = createWikiRunConfig();
        if (!runConfig.apiKey) return alert('请先在设置里配置 API Key。');

        const startedAt = new Date();
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
            progressMessage: '准备采集首页推荐...',
            paused: false,
            log: [],
            history: loadWikiHistory(),
            runConfig
        };
        recordWikiProgress('准备采集首页推荐...', 'collect');

        const progressEl = renderWikiShell('准备采集首页推荐...');
        try {
            const items = await collectWikiHomeItems(progressEl, runConfig);
            wikiState.items = items;
            updateWikiProgress(`采集完成，共 ${items.length} 条，开始抓取全文...`, 'fetch');

            const fetchTasks = items.map(item => async () => {
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

            const normalized = fetched.map((item, index) => item?.error ? { ...items[index], fullText: items[index].text, fullTextSource: '卡片回退', fetchError: item.error.message } : item);
            const fetchStats = normalized.reduce((stats, item) => {
                const source = item.fullTextSource || item.source || '未知';
                if (source === '全文抓取') stats.full++;
                else if (source === '推荐 API 正文') stats.api++;
                else if (source === '卡片回退') stats.fallback++;
                else stats.other++;
                if (!isUsableWikiUrl(item.url || item.key || '')) stats.noUrl++;
                if (item.fetchError || item.fetchWarning) stats.warn++;
                return stats;
            }, { full: 0, api: 0, fallback: 0, other: 0, noUrl: 0, warn: 0 });
            normalized
                .filter(item => item.fullTextSource === '卡片回退' || !isUsableWikiUrl(item.url || item.key || '') || item.fetchError)
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
            recordWikiProgress(`全文抓取诊断：页面全文 ${fetchStats.full} · 推荐API正文兜底 ${fetchStats.api} · 卡片回退 ${fetchStats.fallback} · 无有效URL ${fetchStats.noUrl} · 抓取备注 ${fetchStats.warn}`, 'fetch');
            updateWikiProgress(`全文抓取完成，开始 AI 摘要 ${normalized.length} 条...`, 'summarize');
            const summaryTasks = normalized.map(item => () => summarizeWikiItem(item, runConfig));
            const summarized = await runLimited(summaryTasks, {
                concurrency: getWikiLimit('wikiConcurrency', 20, runConfig),
                rpm: getWikiLimit('wikiRpm', 300, runConfig),
                onStart: (started, total) => updateWikiProgress(`AI 摘要请求已发起 ${started}/${total}`, 'summarize'),
                onProgress: (done, total) => updateWikiProgress(`AI 摘要已完成 ${done}/${total}`, 'summarize')
            });

            const finalItems = summarized.map((item, index) => {
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

            // Embedding phase: compute embeddings and save to IndexedDB
            let embeddingSuccess = 0;
            const embeddingHost = (config.embeddingHost || config.apiHost || '').trim();
            const embeddingKey = (config.embeddingKey || config.apiKey || '').trim();
            if (embeddingHost && embeddingKey) {
                updateWikiProgress('计算向量嵌入...', 'embedding');
                const embeddableItems = finalItems.filter(item => item.wikiContentType !== '采集异常' && item.wikiJudgment !== '丢弃');
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
                recordWikiProgress(`向量嵌入完成：${embeddingSuccess}/${embeddableItems.length} 条成功`, 'embedding');
            }

            // Save structured cards to IndexedDB
            updateWikiProgress('保存卡片到本地数据库...', 'save');
            try {
                const batchId = wikiState.runId;
                const cardsToSave = finalItems
                    .filter(item => item.wikiContentType !== '采集异常' && item.wikiJudgment !== '丢弃')
                    .map(item => ({
                        id: generateWikiCardId(),
                        title: item.title || '未命名',
                        url: item.url || item.key || '',
                        author: getWikiDisplayAuthor(item),
                        tags: item.wikiTags || [],
                        contentType: item.wikiContentType || '观点',
                        oneSentence: item.wikiOneSentence || '',
                        corePoints: item.wikiCorePoints || [],
                        judgment: item.wikiJudgment || '只作素材',
                        credibility: item.wikiCredibility || '中',
                        embedding: item.embedding || null,
                        fullText: (item.fullText || item.text || '').slice(0, 8000),
                        createdAt: new Date().toISOString(),
                        batchId
                    }));
                await saveWikiCards(cardsToSave);
                recordWikiProgress(`已保存 ${cardsToSave.length} 张卡片到本地数据库`, 'save');
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
            updateWikiProgress(`已完成，生成 ${learningCount} 张学习卡片，${anomalyCount} 条待补全文。`, 'finished');
            finishWikiHistoryRecord('finished', {
                phase: 'finished',
                progressMessage: `已完成，生成 ${learningCount} 张学习卡片，${anomalyCount} 条待补全文。`,
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
            typeBadge.textContent = card.contentType || '观点';
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
            snippetEl.textContent = card.oneSentence || '';
            cardEl.appendChild(snippetEl);

            if (card.url) {
                cardEl.addEventListener('click', () => window.open(card.url, '_blank'));
            }
            container.appendChild(cardEl);
        });
    }

    async function renderWikiCardPanel() {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return;
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
