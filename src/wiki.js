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
            const raw = crossOriginGet(WIKI_HISTORY_KEY);
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
                const json = JSON.stringify(records);
                crossOriginSet(WIKI_HISTORY_KEY, json);
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

    function deleteWikiHistoryRecord(runId) {
        ensureWikiHistory();
        wikiState.history = wikiState.history.filter(r => r.runId !== runId);
        saveWikiHistory(wikiState.history);
    }

    function clearAllWikiHistory() {
        wikiState.history = [];
        saveWikiHistory([]);
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
            wikiJudgment: '待核验',
            wikiTags: ['采集异常', '待补全文'],
            wikiCredibility: '需核验',
            wikiCredibilityNotes: reason || item.anomalyReason || item.fetchError || '正文缺失或来源 URL 异常。',
            wikiPersonalReflection: '',
            wikiSummary: '未能可靠取得正文，不进入正式学习卡片库。',
            wikiValue: '待核验',
            title
        };
    }

    function getWikiLearningCardSystemPrompt() {
        return `你是学习卡片整理助手。目标：把知乎内容整理成短、准、可复查的卡片。

输出严格 JSON，字段：
- contentType: 概念|方法|案例|观点|综述|争议|采集异常|待核验
- oneSentence: 35-80字，最值得带走的判断
- corePoints: 1-3条，每条≤70字，原文支撑的机制/标准/反例
- transferScenarios: 0-3个，每条≤45字，明确迁移价值
- evidenceExamples: 0-2条，每条≤60字，原文具体例子/数字
- judgment: 正式入库|素材库|待核验|丢弃
- tags: 3-5个中文标签，避免泛标签
- credibility: 高|中|低|需核验
- credibilityNotes: ≤100字，说明可信度原因
- personalReflection: ≤50字，与已知知识的冲突或启发

关键要求：
1. 只依据输入内容，不补充外部事实
2. 不滥用"模型、机制、范式、底层架构"等包装词
3. 医学/法律/金融/政治内容保持保守
4. 正式入库需有清晰方法+具体证据
5. 缺失正文时标为采集异常`;
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
        const judgment = normalizeWikiChoice(data.judgment, ['正式入库', '素材库', '待核验', '丢弃'], '素材库');
        const contentType = normalizeWikiChoice(data.contentType, ['概念', '方法', '案例', '观点', '综述', '争议', '采集异常', '待核验'], '观点');
        const credibility = normalizeWikiChoice(data.credibility, ['高', '中', '低', '需核验'], '中');

        return {
            ...item,
            wikiContentType: contentType,
            wikiOneSentence: oneSentence,
            wikiCorePoints: compactWikiArray(data.corePoints, 3, 90),
            wikiTransferScenarios: compactWikiArray(data.transferScenarios, 3, 60),
            wikiEvidenceExamples: compactWikiArray(data.evidenceExamples, 2, 70),
            wikiJudgment: judgment,
            wikiTags: tags,
            wikiCredibility: credibility,
            wikiCredibilityNotes: clipWikiText(data.credibilityNotes || data.credibilityReason || '来自知乎内容，需结合原文语境判断。', 100),
            wikiPersonalReflection: clipWikiText(data.personalReflection || '', 50),
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
        const materialCount = items.filter(item => item.wikiJudgment === '素材库').length;
        const pendingCount = items.filter(item => item.wikiContentType === '采集异常' || item.wikiJudgment === '待核验').length;
        const cleanSynthesis = cleanWikiSynthesisMarkdown(synthesis);
        
        const isObsidian = config.wikiObsidianOptimized === true;
        const lines = [];

        if (isObsidian) {
            lines.push('---');
            lines.push(`title: "知乎首页学习卡片库 - ${date}"`);
            lines.push(`created: "${new Date().toLocaleString()}"`);
            lines.push(`total_cards: ${items.length}`);
            lines.push(`formal_count: ${formalCount}`);
            lines.push(`material_count: ${materialCount}`);
            lines.push(`pending_count: ${pendingCount}`);
            lines.push('tags: [知乎, 沉浸式阅读, 学习卡片, Wiki]');
            lines.push('---');
            lines.push('');
        }

        lines.push(`# 知乎首页学习卡片库 - ${date}`);
        lines.push('');
        lines.push(`生成时间：${new Date().toLocaleString()}`);
        lines.push(`条目数量：${items.length}`);
        lines.push(`入库概览：正式 ${formalCount} · 素材 ${materialCount} · 待核验 ${pendingCount}`);
        lines.push('');

        if (cleanSynthesis) {
            if (isObsidian) {
                lines.push('## 总览：趋势雷达 + 学习萃取', '');
                lines.push('> [!quote] AI 萃取与雷达总览');
                cleanSynthesis.split('\n').forEach(line => lines.push(`> ${line}`));
                lines.push('');
            } else {
                lines.push('## 总览：趋势雷达 + 学习萃取', '', cleanSynthesis, '');
            }
        }

        const learningItems = items.filter(item => item.wikiContentType !== '采集异常' && !['待核验', '丢弃'].includes(item.wikiJudgment));
        const anomalyItems = items.filter(item => item.wikiContentType === '采集异常' || ['待核验', '丢弃'].includes(item.wikiJudgment));

        lines.push('## 知识卡片库', '');
        learningItems.forEach((item, index) => {
            const tags = (item.wikiTags || []).map(tag => `#${String(tag).replace(/^#/, '').replace(/\s+/g, '_')}`).join(' ');
            lines.push(`### ${index + 1}. ${item.title || '未命名内容'}`);
            
            if (isObsidian) {
                // Info callout
                lines.push(`> [!info] 结构化卡片元数据`);
                lines.push(`> - **作者**：${getWikiDisplayAuthor(item)}`);
                lines.push(`> - **内容类型**：${item.wikiContentType || item.type || '观点'}`);
                if (item.contentKind === 'answer' && item.questionTitle && !sameWikiMetaText(item.questionTitle, item.title)) lines.push(`> - **原问题**：${item.questionTitle}`);
                if (item.contentKind === 'question' && item.questionTitle && !sameWikiMetaText(item.questionTitle, item.title)) lines.push(`> - **问题**：${item.questionTitle}`);
                lines.push(`> - **链接**：${formatWikiSourceLink(item)}`);
                if (item.fullTextSource || item.source) lines.push(`> - **正文来源**：${item.fullTextSource || item.source}`);
                if (item.fetchWarning) lines.push(`> - **抓取备注**：${item.fetchWarning}`);
                lines.push(`> - **入库判断**：${item.wikiJudgment || '素材库'}`);
                lines.push(`> - **可信度评估**：${item.wikiCredibility || '中'}${item.wikiCredibilityNotes ? ` (${item.wikiCredibilityNotes})` : ''}`);
                lines.push(`> - **检索标签**：${tags || '无'}`);
                lines.push('');
                
                // One sentence callout
                lines.push(`> [!summary] 一句话结论`);
                lines.push(`> ${item.wikiOneSentence || item.wikiSummary || '暂无结论。'}`);
                lines.push('');

                // Core points
                if (item.wikiCorePoints?.length) {
                    lines.push(`> [!todo] 核心知识点`);
                    item.wikiCorePoints.forEach(point => lines.push(`> - ${point}`));
                    lines.push('');
                }

                // Evidence
                if (item.wikiEvidenceExamples?.length || item.evidence?.length) {
                    lines.push(`> [!example] 证据与例子`);
                    const ev = item.wikiEvidenceExamples || item.evidence || [];
                    ev.forEach(example => lines.push(`> - ${example}`));
                    lines.push('');
                }

                // Scenarios
                if (item.wikiTransferScenarios?.length) {
                    lines.push(`> [!tip] 可迁移场景`);
                    item.wikiTransferScenarios.forEach(scene => lines.push(`> - ${scene}`));
                    lines.push('');
                }

                // Reflection
                if (item.wikiPersonalReflection || item.personalReflection) {
                    lines.push(`> [!brain] 个人反思`);
                    lines.push(`> ${item.wikiPersonalReflection || item.personalReflection}`);
                    lines.push('');
                }
            } else {
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
                if (item.wikiEvidenceExamples?.length || item.evidence?.length) {
                    lines.push(`- 证据与例子：`);
                    const ev = item.wikiEvidenceExamples || item.evidence || [];
                    ev.forEach(example => lines.push(`  - ${example}`));
                }
                lines.push(`- 入库判断：${item.wikiJudgment || '素材库'}`);
                lines.push(`- 检索标签：${tags || '无'}`);
                lines.push(`- 可信度：${item.wikiCredibility || '中'}${item.wikiCredibilityNotes ? `，${item.wikiCredibilityNotes}` : ''}`);
                if (item.wikiPersonalReflection || item.personalReflection) lines.push(`- 个人反思：${item.wikiPersonalReflection || item.personalReflection}`);
                lines.push('');
            }
        });

        if (anomalyItems.length) {
            lines.push('## 采集异常 / 待核验', '');
            anomalyItems.forEach((item, index) => {
                const tags = (item.wikiTags || []).map(tag => `#${String(tag).replace(/^#/, '').replace(/\s+/g, '_')}`).join(' ');
                lines.push(`### ${index + 1}. ${item.title || '未命名内容'}`);
                
                if (isObsidian) {
                    lines.push(`> [!warning] 采集状态及异常原因`);
                    lines.push(`> - **链接**：${formatWikiSourceLink(item)}`);
                    if (item.fullTextSource || item.source) lines.push(`> - **正文来源**：${item.fullTextSource || item.source}`);
                    lines.push(`> - **判断**：${item.wikiJudgment || '待核验'}`);
                    lines.push(`> - **异常原委**：${item.wikiCredibilityNotes || item.anomalyReason || item.fetchError || '正文缺失或来源异常。'}`);
                    if (item.fetchWarning) lines.push(`> - **抓取备注**：${item.fetchWarning}`);
                    lines.push(`> - **检索标签**：${tags || '#采集异常 #待核验'}`);
                    lines.push('');
                    lines.push(`> [!quote] 首页摘录`);
                    lines.push(`> ${clipWikiText(item.snippet || item.text?.slice(0, 180) || '无', 180)}`);
                    lines.push('');
                } else {
                    lines.push(`- 链接：${formatWikiSourceLink(item)}`);
                    if (item.fullTextSource || item.source) lines.push(`- 正文来源：${item.fullTextSource || item.source}`);
                    lines.push(`- 判断：${item.wikiJudgment || '待核验'}`);
                    lines.push(`- 原因：${item.wikiCredibilityNotes || item.anomalyReason || item.fetchError || '正文缺失或来源异常。'}`);
                    if (item.fetchWarning) lines.push(`- 抓取备注：${item.fetchWarning}`);
                    lines.push(`- 首页摘录：${clipWikiText(item.snippet || item.text?.slice(0, 180) || '无', 180)}`);
                    lines.push(`- 标签：${tags || '#采集异常 #待核验'}`);
                    lines.push('');
                }
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
        title.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:12px;';
        if (wikiState.history.length) {
            const clearBtn = createWikiActionButton('清空全部历史', () => {
                if (!confirm('确认清空全部 Wiki 运行历史？此操作不可撤销。')) return;
                clearAllWikiHistory();
                renderWikiDashboard();
            });
            clearBtn.style.fontWeight = 'normal';
            title.appendChild(clearBtn);
        }
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
            if (record.status !== 'running') {
                actions.appendChild(createWikiActionButton('删除', () => {
                    if (!confirm('确认删除这条 Wiki 运行历史？')) return;
                    deleteWikiHistoryRecord(record.runId);
                    renderWikiDashboard();
                }));
            }
            main.appendChild(actions);
            item.appendChild(main);
            list.appendChild(item);
        });
        section.appendChild(list);
        wrapper.appendChild(section);
    }

    function renderWikiDashboard() {
        renderPersonalSpaceDashboard('wiki_history');
    }

    function renderWikiShell(message = '准备运行信息流 Wiki...') {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return null;

        const spaceContent = wrapper.querySelector('.zh-space-content');
        const targetContainer = spaceContent || wrapper;

        if (!spaceContent) {
            _homeState.view = 'wiki';
            restoreLiveMount();
            clearHomeTranslations();
            wrapper.classList.remove('zh-has-top-nav', 'zh-home-wide');
            wrapper.innerHTML = '';
            appendHomeHeader(wrapper);
        } else {
            spaceContent.innerHTML = '';
        }

        const progress = document.createElement('div');
        progress.id = 'zh-wiki-progress';
        progress.className = 'zh-wiki-progress';
        progress.textContent = `信息流 Wiki：${message}`;
        targetContainer.appendChild(progress);

        const actions = document.createElement('div');
        actions.className = 'zh-wiki-actions';
        actions.appendChild(createWikiActionButton('暂停任务', () => setWikiPaused(true)));
        actions.appendChild(createWikiActionButton('刷新进度', renderWikiDashboard));
        targetContainer.appendChild(actions);

        targetContainer.appendChild(renderWikiLog());

        if (!spaceContent) {
            renderWikiHistory(wrapper);
        } else {
            renderWikiHistory(spaceContent);
        }

        window.scrollTo(0, 0);
        return progress;
    }

    function renderWikiMarkdownToHTML(md) {
        const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const lines = md.split('\n');
        const out = [];
        let inList = false;
        let listType = '';
        let inCallout = false;
        let calloutType = '';

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

        const closeCallout = () => {
            if (inCallout) { out.push('</div></div>'); inCallout = false; }
        };

        const CALLOUT_ICONS = {
            info: 'ℹ️',
            summary: '📋',
            todo: '☑️',
            example: '🦄',
            tip: '💡',
            brain: '🧠',
            warning: '⚠️',
            quote: '💬'
        };

        const CALLOUT_LABELS = {
            info: '结构化卡片元数据',
            summary: '一句话结论',
            todo: '核心知识点',
            example: '证据与例子',
            tip: '可迁移场景',
            brain: '个人反思',
            warning: '采集异常 / 待核验',
            quote: 'AI 萃取与雷达总览'
        };

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // 识别以 '>' 开头的引用或 Callout 折叠框
            if (line.trim().startsWith('>')) {
                closeList();
                
                // 识别 Callout 头部: > [!type] Title
                const calloutHeaderMatch = line.match(/^>\s*\[!([a-zA-Z]+)\]\s*(.*)$/);
                if (calloutHeaderMatch) {
                    closeCallout(); // 关闭上一个活动折叠框
                    
                    const type = calloutHeaderMatch[1].toLowerCase();
                    const titleText = calloutHeaderMatch[2].trim();
                    const icon = CALLOUT_ICONS[type] || '📝';
                    const defaultTitle = CALLOUT_LABELS[type] || (type.toUpperCase());
                    const finalTitle = titleText ? inlineFormat(escapeHtml(titleText)) : defaultTitle;
                    
                    inCallout = true;
                    calloutType = type;
                    out.push(`<div class="zh-callout zh-callout-${type}">`);
                    out.push(`<div class="zh-callout-title"><span class="zh-callout-icon">${icon}</span> ${finalTitle}</div>`);
                    out.push(`<div class="zh-callout-content">`);
                    continue;
                }
                
                // 处理 Callout 或常规引用块内的行内容
                const cleanQuoteLine = line.replace(/^>\s*/, '');
                
                if (inCallout) {
                    if (/^\s*[-*]\s/.test(cleanQuoteLine)) {
                        out.push(`<li>${inlineFormat(escapeHtml(cleanQuoteLine.replace(/^\s*[-*]\s/, '')))}</li>`);
                    } else if (cleanQuoteLine.trim() === '') {
                        out.push('<br>');
                    } else {
                        out.push(`<p>${inlineFormat(escapeHtml(cleanQuoteLine))}</p>`);
                    }
                } else {
                    out.push(`<blockquote>${inlineFormat(escapeHtml(cleanQuoteLine))}</blockquote>`);
                }
                continue;
            }

            // 离开块引用/Callout状态，关闭所有活动 Callout
            closeCallout();

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
        closeCallout();
        return out.join('\n');
    }

    function renderWikiResult(markdown, record = null) {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return;

        const spaceContent = wrapper.querySelector('.zh-space-content');
        const targetContainer = spaceContent || wrapper;

        if (!spaceContent) {
            wrapper.classList.remove('zh-has-top-nav', 'zh-home-wide');
            wrapper.innerHTML = '';
            appendHomeHeader(wrapper);
        } else {
            spaceContent.innerHTML = '';
        }

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
        backBtn.textContent = spaceContent ? '返回记录列表' : '返回 Wiki 面板';
        backBtn.addEventListener('click', () => {
            if (spaceContent) {
                renderPersonalSpaceDashboard('wiki_history');
            } else {
                renderWikiDashboard();
            }
        });

        actions.appendChild(copyBtn);
        actions.appendChild(downloadBtn);
        actions.appendChild(backBtn);
        targetContainer.appendChild(actions);

        const content = document.createElement('div');
        content.className = 'zh-wiki-output zh-wiki-rendered';
        content.innerHTML = renderWikiMarkdownToHTML(markdown);
        targetContainer.appendChild(content);

        if (!spaceContent) {
            renderWikiHistory(wrapper);
        } else {
            renderWikiHistory(spaceContent);
        }
        window.scrollTo(0, 0);
    }

    async function startWikiRun(selectedItems = null) {
        if (!selectedItems && !isHomePage()) return alert('信息流 Wiki 目前只在知乎首页运行。');
        if (wikiState.running) {
            if (selectedItems) {
                alert('已有采集任务正在运行，请等待其完成。');
                return;
            }
            renderWikiDashboard();
            return;
        }
        const runConfig = createWikiRunConfig();
        if (!runConfig.apiKey) return alert('请先在设置里配置 API Key。');

        const startedAt = new Date();
        const runMsg = selectedItems ? `准备分析所选的 ${selectedItems.length} 条已读/待读条目...` : '准备采集首页推荐...';
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
            progressMessage: runMsg,
            paused: false,
            log: [],
            history: loadWikiHistory(),
            runConfig
        };
        recordWikiProgress(runMsg, 'collect');

        const progressEl = renderWikiShell(runMsg);
        try {
            let items;
            if (selectedItems) {
                items = selectedItems.map(item => ({
                    url: item.url,
                    key: item.url,
                    title: item.title || '无标题',
                    author: item.author || '未知作者',
                    contentKind: item.contentKind || item.type || 'article',
                    type: item.contentKind || item.type || 'article'
                }));
            } else {
                items = await collectWikiHomeItems(progressEl, runConfig);
            }
            
            // 增量 Hash 校验：读取本地数据库中已保存的卡片 URL，避免重复的抓取、LLM 和 Embedding 消耗
            updateWikiProgress('正在读取本地卡片库，进行增量 Hash 校验...', 'collect');
            let allSavedCards = [];
            try {
                allSavedCards = await getAllWikiCards();
            } catch (err) {
                console.warn('读取本地已保存卡片失败，将跳过增量校验:', err);
            }
            const savedCardsMap = new Map();
            allSavedCards.forEach(c => {
                if (c.url) savedCardsMap.set(c.url, c);
            });

            let cachedCount = 0;
            const processedItems = items.map(item => {
                const url = item.url || item.key || '';
                if (url && savedCardsMap.has(url)) {
                    cachedCount++;
                    const cached = savedCardsMap.get(url);
                    return {
                        ...item,
                        isCached: true,
                        title: cached.title || item.title,
                        wikiContentType: cached.contentType,
                        wikiOneSentence: cached.oneSentence,
                        wikiCorePoints: cached.corePoints || [],
                        wikiTransferScenarios: cached.transferScenarios || [],
                        wikiEvidenceExamples: cached.evidenceExamples || cached.evidence || [],
                        wikiJudgment: cached.judgment,
                        wikiTags: cached.tags || [],
                        wikiCredibility: cached.credibility,
                        wikiCredibilityNotes: cached.credibilityNotes,
                        wikiPersonalReflection: cached.personalReflection,
                        embedding: cached.embedding
                    };
                }
                return item;
            });
            recordWikiProgress(`增量校验完成：本次共采集 ${items.length} 条推荐，其中 ${cachedCount} 条为已缓存（跳过网络抓取/AI生成），${items.length - cachedCount} 条为新条目。`, 'collect');
            wikiState.items = processedItems;

            updateWikiProgress(`准备抓取全文（新条目：${items.length - cachedCount} 条）...`, 'fetch');

            const fetchTasks = processedItems.map(item => async () => {
                if (item.isCached) return item;
                
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

            const normalized = fetched.map((item, index) => {
                if (item.isCached) return item;
                return item?.error ? { ...processedItems[index], fullText: processedItems[index].text, fullTextSource: '卡片回退', fetchError: item.error.message } : item;
            });

            const fetchStats = normalized.reduce((stats, item) => {
                if (item.isCached) {
                    stats.cached++;
                    return stats;
                }
                const source = item.fullTextSource || item.source || '未知';
                if (source === '全文抓取') stats.full++;
                else if (source === '推荐 API 正文') stats.api++;
                else if (source === '卡片回退') stats.fallback++;
                else stats.other++;
                if (!isUsableWikiUrl(item.url || item.key || '')) stats.noUrl++;
                if (item.fetchError || item.fetchWarning) stats.warn++;
                return stats;
            }, { full: 0, api: 0, fallback: 0, other: 0, noUrl: 0, warn: 0, cached: 0 });

            normalized
                .filter(item => !item.isCached && (item.fullTextSource === '卡片回退' || !isUsableWikiUrl(item.url || item.key || '') || item.fetchError))
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
            recordWikiProgress(`全文抓取诊断：新抓取页面全文 ${fetchStats.full} · 推荐API正文兜底 ${fetchStats.api} · 卡片回退 ${fetchStats.fallback} · 已缓存跳过 ${fetchStats.cached} · 无有效URL ${fetchStats.noUrl} · 抓取备注 ${fetchStats.warn}`, 'fetch');
            
            updateWikiProgress(`全文抓取完成，开始 AI 摘要新条目（${normalized.length - cachedCount} 条）...`, 'summarize');
            const summaryTasks = normalized.map(item => () => {
                if (item.isCached) return Promise.resolve(item);
                return summarizeWikiItem(item, runConfig);
            });
            const summarized = await runLimited(summaryTasks, {
                concurrency: getWikiLimit('wikiConcurrency', 20, runConfig),
                rpm: getWikiLimit('wikiRpm', 300, runConfig),
                onStart: (started, total) => updateWikiProgress(`AI 摘要请求已发起 ${started}/${total}`, 'summarize'),
                onProgress: (done, total) => updateWikiProgress(`AI 摘要已完成 ${done}/${total}`, 'summarize')
            });

            const finalItems = summarized.map((item, index) => {
                if (item.isCached) return item;
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

            // Embedding phase: 只对新生成的有效卡片进行向量嵌入计算
            let embeddingSuccess = 0;
            const embeddingHost = (config.embeddingHost || config.apiHost || '').trim();
            const embeddingKey = (config.embeddingKey || config.apiKey || '').trim();
            if (embeddingHost && embeddingKey) {
                updateWikiProgress('计算向量嵌入...', 'embedding');
                const embeddableItems = finalItems.filter(item => !item.isCached && item.wikiContentType !== '采集异常' && item.wikiJudgment !== '丢弃');
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
                recordWikiProgress(`向量嵌入完成：新生成卡片共 ${embeddableItems.length} 条，其中 ${embeddingSuccess} 条计算成功。已缓存卡片跳过。`, 'embedding');
            }

            // Save structured cards to IndexedDB (只保存新卡片)
            updateWikiProgress('保存卡片到本地数据库...', 'save');
            try {
                const batchId = wikiState.runId;
                const cardsToSave = finalItems
                    .filter(item => !item.isCached && item.wikiContentType !== '采集异常' && item.wikiJudgment !== '丢弃')
                    .map(item => ({
                        id: generateWikiCardId(),
                        title: item.title || '未命名',
                        url: item.url || item.key || '',
                        author: getWikiDisplayAuthor(item),
                        tags: item.wikiTags || [],
                        contentType: item.wikiContentType || '观点',
                        oneSentence: item.wikiOneSentence || '',
                        corePoints: item.wikiCorePoints || [],
                        judgment: item.wikiJudgment || '素材库',
                        credibility: item.wikiCredibility || '中',
                        credibilityNotes: item.wikiCredibilityNotes || '',
                        personalReflection: item.wikiPersonalReflection || '',
                        embedding: item.embedding || null,
                        fullText: (item.fullText || item.text || '').slice(0, 8000),
                        createdAt: new Date().toISOString(),
                        batchId
                    }));
                await saveWikiCards(cardsToSave);
                recordWikiProgress(`本地数据库已更新：保存 ${cardsToSave.length} 张新卡片，自动跳过已存在的 ${cachedCount} 张卡片。`, 'save');
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
            updateWikiProgress(`已完成，生成 ${learningCount} 张学习卡片，${anomalyCount} 条待核验。`, 'finished');
            finishWikiHistoryRecord('finished', {
                phase: 'finished',
                progressMessage: `已完成，生成 ${learningCount} 张学习卡片，${anomalyCount} 条待核验。`,
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

    function showWikiCardDetailModal(card) {
        // 格式化日期辅助函数
        const formatDate = (isoString) => {
            if (!isoString) return '';
            try {
                const date = new Date(isoString);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            } catch (err) {
                return isoString.split('T')[0] || isoString;
            }
        };

        // 确定可信度级别的样式 class
        let credibilityClass = 'medium';
        if (card.credibility === '高') credibilityClass = 'high';
        else if (card.credibility === '低') credibilityClass = 'low';
        else if (card.credibility === '需核验') credibilityClass = 'verify';

        // 列表渲染辅助函数
        const renderBulletList = (items) => {
            if (!Array.isArray(items) || !items.length) return '<span style="opacity:0.5;">无</span>';
            return `<ul class="zh-wiki-detail-list">
                ${items.map(item => `<li>${escapeHTML(item)}</li>`).join('')}
            </ul>`;
        };

        // 标签 HTML
        const tagsHtml = Array.isArray(card.tags) && card.tags.length
            ? `<div class="zh-wiki-detail-tags">
                ${card.tags.map(t => `<span class="zh-wiki-detail-tag">${escapeHTML(t)}</span>`).join('')}
               </div>`
            : '';

        // 核心知识点 HTML
        const corePointsHtml = `
            <div class="zh-wiki-detail-section">
                <div class="zh-wiki-detail-section-title">核心知识点</div>
                ${renderBulletList(card.corePoints || card.wikiCorePoints)}
            </div>
        `;

        // 证据与例子 HTML
        const evidenceHtml = `
            <div class="zh-wiki-detail-section">
                <div class="zh-wiki-detail-section-title">证据与例子</div>
                ${renderBulletList(card.evidenceExamples || card.evidence || card.wikiEvidenceExamples)}
            </div>
        `;

        // 可迁移场景 HTML
        const scenariosHtml = `
            <div class="zh-wiki-detail-section">
                <div class="zh-wiki-detail-section-title">可迁移场景</div>
                ${renderBulletList(card.transferScenarios || card.wikiTransferScenarios)}
            </div>
        `;

        // 个人反思 HTML (仅当有值时渲染)
        const reflectionHtml = (card.personalReflection || card.wikiPersonalReflection)
            ? `<div class="zh-wiki-detail-meta-box">
                <div class="zh-wiki-detail-section-title">个人反思</div>
                <div class="zh-wiki-detail-reflection">${escapeHTML(card.personalReflection || card.wikiPersonalReflection)}</div>
               </div>`
            : '';

        const modalContent = `
            <div class="zh-wiki-detail-modal">
                <div class="zh-wiki-detail-top">
                    <span class="zh-wiki-detail-type">${escapeHTML(card.contentType || card.wikiContentType || '观点')}</span>
                    <span class="zh-wiki-detail-date">${escapeHTML(formatDate(card.createdAt))}</span>
                </div>
                <h3 class="zh-wiki-detail-title">
                    <a href="${escapeHTML(card.url || '#')}" target="_blank" rel="noopener noreferrer" title="在新窗口打开原文">
                        ${escapeHTML(card.title || '未命名')}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 4px; display: inline-block; vertical-align: middle;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                </h3>
                ${tagsHtml}
                <hr class="zh-wiki-detail-hr">
                
                <div class="zh-wiki-detail-section">
                    <div class="zh-wiki-detail-section-title">一句话结论</div>
                    <div class="zh-wiki-detail-one-sentence">${escapeHTML(card.oneSentence || card.wikiOneSentence || '')}</div>
                </div>

                ${corePointsHtml}
                ${evidenceHtml}
                ${scenariosHtml}

                <div class="zh-wiki-detail-meta-grid">
                    <div class="zh-wiki-detail-meta-box">
                        <div class="zh-wiki-detail-section-title">可信度评估</div>
                        <div class="zh-wiki-detail-credibility-row">
                            <span class="zh-wiki-detail-credibility-level ${credibilityClass}">${escapeHTML(card.credibility || card.wikiCredibility || '中')}</span>
                            <span class="zh-wiki-detail-credibility-notes">${escapeHTML(card.credibilityNotes || card.wikiCredibilityNotes || '来自知乎内容，需结合原文语境判断。')}</span>
                        </div>
                    </div>
                    ${reflectionHtml}
                </div>

                <div class="zh-wiki-detail-actions">
                    <button class="zh-wiki-detail-btn-primary" id="zh-wiki-detail-obsidian-btn" style="background:#7a5cd8; border-color:#7a5cd8; color:#fff; margin-right:auto;">导出 Obsidian MD</button>
                    <button class="zh-wiki-detail-btn-delete" id="zh-wiki-detail-del-btn">删除此卡片</button>
                    <button class="zh-wiki-detail-btn-primary" id="zh-wiki-detail-open-btn">打开原文</button>
                </div>
            </div>
        `;

        const modal = createModal('zh-wiki-card-detail-modal', '📖 学习卡片详情', modalContent);
        
        // 动态覆盖宽度以适配丰富的信息展示
        const modalContainer = modal.querySelector('.zh-modal');
        if (modalContainer) {
            modalContainer.style.width = '640px';
            modalContainer.style.maxWidth = '95%';
        }

        // 绑定"导出 Obsidian"按钮事件
        const obsBtn = modal.querySelector('#zh-wiki-detail-obsidian-btn');
        if (obsBtn) {
            obsBtn.addEventListener('click', () => {
                try {
                    const cleanTags = (card.tags || []).map(t => String(t).trim().replace(/\s+/g, '_')).filter(Boolean);
                    const formattedTags = cleanTags.map(t => `#${t}`).join(' ');
                    
                    const mdLines = [];
                    mdLines.push('---');
                    mdLines.push(`title: "${(card.title || '未命名').replace(/"/g, '\\"')}"`);
                    mdLines.push(`author: "${(getWikiDisplayAuthor(card) || '未知').replace(/"/g, '\\"')}"`);
                    mdLines.push(`type: "${card.contentType || card.wikiContentType || '观点'}"`);
                    mdLines.push(`url: "${card.url || ''}"`);
                    mdLines.push(`credibility: "${card.credibility || card.wikiCredibility || '中'}"`);
                    mdLines.push(`judgment: "${card.wikiJudgment || card.judgment || '素材库'}"`);
                    if (cleanTags.length) {
                        mdLines.push('tags:');
                        cleanTags.forEach(t => mdLines.push(`  - ${t}`));
                    } else {
                        mdLines.push('tags: [知乎, 沉浸式阅读, 学习卡片]');
                    }
                    mdLines.push(`created: "${formatDate(card.createdAt)}"`);
                    mdLines.push('---');
                    mdLines.push('');
                    
                    mdLines.push(`# ${card.title || '未命名'}`);
                    mdLines.push('');
                    
                    // 元数据 Callout
                    mdLines.push(`> [!info] 结构化卡片元数据`);
                    mdLines.push(`> - **作者**：${getWikiDisplayAuthor(card)}`);
                    mdLines.push(`> - **内容类型**：${card.contentType || card.wikiContentType || '观点'}`);
                    if (card.contentKind === 'answer' && card.questionTitle && !sameWikiMetaText(card.questionTitle, card.title)) {
                        mdLines.push(`> - **原问题**：${card.questionTitle}`);
                    }
                    mdLines.push(`> - **链接**：${card.url || '无'}`);
                    mdLines.push(`> - **入库判断**：${card.wikiJudgment || card.judgment || '素材库'}`);
                    mdLines.push(`> - **可信度评估**：${card.credibility || card.wikiCredibility || '中'}${card.credibilityNotes || card.wikiCredibilityNotes ? ` (${card.credibilityNotes || card.wikiCredibilityNotes})` : ''}`);
                    mdLines.push(`> - **检索标签**：${formattedTags || '无'}`);
                    mdLines.push('');
                    
                    // 一句话结论 Callout
                    mdLines.push(`> [!summary] 一句话结论`);
                    mdLines.push(`> ${card.oneSentence || card.wikiOneSentence || '暂无结论。'}`);
                    mdLines.push('');
                    
                    // 核心知识点 Callout
                    const pts = card.corePoints || card.wikiCorePoints;
                    if (Array.isArray(pts) && pts.length) {
                        mdLines.push(`> [!todo] 核心知识点`);
                        pts.forEach(p => mdLines.push(`> - ${p}`));
                        mdLines.push('');
                    }
                    
                    // 证据与例子 Callout
                    const ev = card.evidenceExamples || card.evidence || card.wikiEvidenceExamples;
                    if (Array.isArray(ev) && ev.length) {
                        mdLines.push(`> [!example] 证据与例子`);
                        ev.forEach(e => mdLines.push(`> - ${e}`));
                        mdLines.push('');
                    }
                    
                    // 可迁移场景 Callout
                    const sc = card.transferScenarios || card.wikiTransferScenarios;
                    if (Array.isArray(sc) && sc.length) {
                        mdLines.push(`> [!tip] 可迁移场景`);
                        sc.forEach(s => mdLines.push(`> - ${s}`));
                        mdLines.push('');
                    }
                    
                    // 个人反思 Callout
                    const ref = card.personalReflection || card.wikiPersonalReflection;
                    if (ref) {
                        mdLines.push(`> [!brain] 个人反思`);
                        mdLines.push(`> ${ref}`);
                        mdLines.push('');
                    }
                    
                    const finalMd = mdLines.join('\n');
                    const blob = new Blob([finalMd], { type: 'text/markdown;charset=utf-8' });
                    const downloadUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    const cleanFileName = (card.title || 'learning-card')
                        .replace(/[\\/:*?"<>|]/g, ' ')
                        .trim()
                        .slice(0, 50);
                    a.href = downloadUrl;
                    a.download = `[Obsidian] ${cleanFileName}.md`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(downloadUrl);
                    showToast('已成功导出单卡 Obsidian MD');
                } catch (err) {
                    showToast('导出失败: ' + err.message);
                }
            });
        }

        // 绑定"打开原文"按钮事件
        const openBtn = modal.querySelector('#zh-wiki-detail-open-btn');
        if (openBtn && card.url) {
            openBtn.addEventListener('click', () => {
                window.open(card.url, '_blank');
            });
        }

        // 绑定"删除卡片"按钮事件
        const delBtn = modal.querySelector('#zh-wiki-detail-del-btn');
        if (delBtn) {
            delBtn.addEventListener('click', async () => {
                if (!confirm('确定要删除这张学习卡片吗？该操作不可撤销。')) return;
                try {
                    await deleteWikiCard(card.id);
                    showToast('删除成功');
                    modal.remove();
                    
                    // 彻底刷新整个 Wiki 卡片面板以重新计算标签数和刷新网格
                    renderWikiCardPanel();
                } catch (err) {
                    showToast('删除失败: ' + err.message);
                }
            });
        }
    }

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
            typeBadge.textContent = card.contentType || card.wikiContentType || '观点';
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
            snippetEl.textContent = card.oneSentence || card.wikiOneSentence || '';
            cardEl.appendChild(snippetEl);

            cardEl.addEventListener('click', () => showWikiCardDetailModal(card));
            container.appendChild(cardEl);
        });
    }

    async function renderWikiCardPanel() {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return;

        const spaceContent = wrapper.querySelector('.zh-space-content');
        if (spaceContent) {
            renderPersonalSpaceDashboard('card_library');
            return;
        }

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

    // ═══════════════════════════════════════════════════════════
    // 个人空间 (打卡/热力图/待读/历史/Wiki集成)
    // ═══════════════════════════════════════════════════════════

    async function logCurrentPageReadingRecord() {
        try {
            const url = location.href.replace(/[?#].*$/, '');
            let title = document.title || '未命名内容';
            let author = '未知作者';
            let contentKind = 'article';
            
            if (isPostPage()) {
                contentKind = 'article';
                const titleNode = document.querySelector('.Post-Title');
                if (titleNode) title = titleNode.textContent.trim();
                const authorNode = document.querySelector('.AuthorInfo-name, .AuthorInfo-name .UserLink-link');
                if (authorNode) author = authorNode.textContent.trim();
            } else if (isQuestionPage()) {
                contentKind = 'answer';
                const titleNode = document.querySelector('.QuestionHeader-title');
                if (titleNode) title = titleNode.textContent.trim();
                if (isAnswerUrl()) {
                    const authorNode = document.querySelector('.AuthorInfo-name, .AuthorInfo-name .UserLink-link');
                    if (authorNode) author = authorNode.textContent.trim();
                } else {
                    author = '知乎问答';
                }
            }
            title = title.replace(/\s+-\s+知乎$/, '').replace(/\s+-\s+知乎专栏$/, '');
            await addReadingRecord({
                url,
                title,
                author,
                contentKind,
                readAt: new Date().toISOString(),
                manuallyMarked: false,
                wikiCardId: null,
                duration: 0,
                progress: 0
            });
            startReadingProgressTracker(url);
        } catch (err) {
            console.warn('记录阅读历史失败:', err);
        }
    }

    // 基于原生 window 滚动统计阅读进度（百分比），不依赖任何脚本滚轮代理。
    // 等待沉浸模式完全进入 / 脚本自动滚动停下后才开始统计。
    let _progressTracker = null;

    function computeScrollProgress() {
        const scrollable = getDocumentHeight() - window.innerHeight;
        if (scrollable <= 0) return 100;
        return (window.scrollY / scrollable) * 100;
    }

    function startReadingProgressTracker(url) {
        stopReadingProgressTracker();
        const tracker = { url, max: 0, settled: false, lastSaved: 0, onScroll: null };
        _progressTracker = tracker;

        const flush = () => {
            if (tracker.max > tracker.lastSaved) {
                tracker.lastSaved = tracker.max;
                updateReadingProgress(tracker.url, tracker.max).catch(() => {});
            }
        };

        const sample = () => {
            if (!tracker.settled || _progressTracker !== tracker) return;
            const p = computeScrollProgress();
            if (p > tracker.max) tracker.max = p;
        };

        tracker.onScroll = () => { sample(); };
        // 等待沉浸模式自动滚动（window.scrollTo(0,0) 等）稳定后再开始采样，避免被脚本滚动污染。
        setTimeout(() => {
            if (_progressTracker !== tracker) return;
            tracker.settled = true;
            sample();
            window.addEventListener('scroll', tracker.onScroll, { passive: true });
        }, 900);
        tracker.flushTimer = setInterval(flush, 4000);
        tracker.flush = flush;

        if (!window._zhProgressUnloadHooked) {
            window._zhProgressUnloadHooked = true;
            window.addEventListener('pagehide', () => {
                if (_progressTracker && _progressTracker.flush) _progressTracker.flush();
            });
        }
    }

    function renderProgressCell(progress) {
        const pct = Math.max(0, Math.min(100, Math.round(progress)));
        const done = pct >= 95;
        const barColor = done ? '#4caf50' : 'var(--zh-accent)';
        const label = done ? '✓ 读完' : `${pct}%`;
        return `
            <div style="display:flex; align-items:center; gap:6px;">
                <div style="flex:1; height:6px; border-radius:3px; background:var(--zh-border); overflow:hidden;">
                    <div style="width:${pct}%; height:100%; background:${barColor};"></div>
                </div>
                <span style="font-size:12px; opacity:0.8; min-width:38px; text-align:right; color:${done ? '#4caf50' : 'inherit'};">${label}</span>
            </div>`;
    }

    function stopReadingProgressTracker() {
        const tracker = _progressTracker;
        if (!tracker) return;
        _progressTracker = null;
        if (tracker.onScroll) window.removeEventListener('scroll', tracker.onScroll);
        if (tracker.flushTimer) clearInterval(tracker.flushTimer);
        if (tracker.flush) tracker.flush();
    }


    function calculateReadingStreaks(records) {
        if (!records || !records.length) return { currentStreak: 0, maxStreak: 0, totalDays: 0 };
        
        // Extract unique YYYY-MM-DD local dates
        const datesSet = new Set();
        records.forEach(r => {
            if (r.readAt) {
                const dateStr = r.readAt.split('T')[0];
                datesSet.add(dateStr);
            }
        });
        
        const sortedDates = Array.from(datesSet).sort((a, b) => b.localeCompare(a));
        if (!sortedDates.length) return { currentStreak: 0, maxStreak: 0, totalDays: 0 };
        
        const todayStr = new Date().toISOString().split('T')[0];
        
        const getPrevDateStr = (dateStr) => {
            const d = new Date(dateStr);
            d.setDate(d.getDate() - 1);
            return d.toISOString().split('T')[0];
        };
        
        let currentStreak = 0;
        let checkDate = todayStr;
        
        const hasToday = sortedDates.includes(todayStr);
        const yesterdayStr = getPrevDateStr(todayStr);
        const hasYesterday = sortedDates.includes(yesterdayStr);
        
        if (hasToday) {
            currentStreak = 1;
            checkDate = yesterdayStr;
            while (sortedDates.includes(checkDate)) {
                currentStreak++;
                checkDate = getPrevDateStr(checkDate);
            }
        } else if (hasYesterday) {
            currentStreak = 1;
            checkDate = getPrevDateStr(yesterdayStr);
            while (sortedDates.includes(checkDate)) {
                currentStreak++;
                checkDate = getPrevDateStr(checkDate);
            }
        } else {
            currentStreak = 0;
        }
        
        let maxStreak = 0;
        let tempStreak = 0;
        let prevDate = null;
        
        const ascDates = Array.from(sortedDates).reverse();
        ascDates.forEach(dateStr => {
            if (!prevDate) {
                tempStreak = 1;
            } else {
                const expectedPrev = getPrevDateStr(dateStr);
                if (prevDate === expectedPrev) {
                    tempStreak++;
                } else if (prevDate !== dateStr) {
                    maxStreak = Math.max(maxStreak, tempStreak);
                    tempStreak = 1;
                }
            }
            prevDate = dateStr;
        });
        maxStreak = Math.max(maxStreak, tempStreak);
        
        return {
            currentStreak,
            maxStreak,
            totalDays: sortedDates.length
        };
    }

    function generateHeatmapData(records) {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - 364);
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        
        const countMap = {};
        records.forEach(r => {
            if (r.readAt) {
                const dateStr = typeof r.readAt === 'string'
                    ? r.readAt.split('T')[0]
                    : new Date(r.readAt).toISOString().split('T')[0];
                countMap[dateStr] = (countMap[dateStr] || 0) + 1;
            }
        });
        
        const cells = [];
        const temp = new Date(start);
        for (let i = 0; i < 371; i++) {
            const dateStr = temp.toISOString().split('T')[0];
            const count = countMap[dateStr] || 0;
            
            let level = 0;
            if (count >= 1 && count <= 2) level = 1;
            else if (count >= 3 && count <= 5) level = 2;
            else if (count >= 6 && count <= 9) level = 3;
            else if (count >= 10) level = 4;
            
            cells.push({
                date: dateStr,
                count,
                level
            });
            temp.setDate(temp.getDate() + 1);
        }
        
        return cells;
    }

    function closePersonalSpace() {
        const wrapper = document.getElementById('immersive-wrapper');
        const spaceContainer = document.getElementById('zh-space-container');
        if (!wrapper) return;

        const performCleanAndRestore = () => {
            if (spaceContainer) {
                spaceContainer.style.display = 'none';
                spaceContainer.remove();
            }

            // Restore classes
            if (_personalSpaceBackup.hasTopNav) {
                wrapper.classList.add('zh-has-top-nav');
            } else {
                wrapper.classList.remove('zh-has-top-nav');
            }
            if (_personalSpaceBackup.hasHomeWide) {
                wrapper.classList.add('zh-home-wide');
            } else {
                wrapper.classList.remove('zh-home-wide');
            }

            let siblingCount = 0;
            // 恢复被隐藏的同级元素的原有显示状态
            Array.from(wrapper.children).forEach(child => {
                if (child.id !== 'zh-space-container') {
                    siblingCount++;
                    child.classList.remove('zh-space-hidden');
                    if (child.hasAttribute('data-zh-space-orig-display')) {
                        child.style.display = child.getAttribute('data-zh-space-orig-display');
                        child.removeAttribute('data-zh-space-orig-display');
                    } else {
                        child.style.display = '';
                    }
                }
            });

            // 还原原来的视图状态，保留滚动位置
            const prevPage = _personalSpaceBackup.context || window._zhPrevPageType || 'home';
            const prevView = _personalSpaceBackup.homeView || _personalSpaceBackup.questionView || _personalSpaceBackup.followView || window._zhPrevView || 'list';

            if (_personalSpaceBackup.homeView !== undefined) _homeState.view = _personalSpaceBackup.homeView;
            if (_personalSpaceBackup.questionView !== undefined) _questionState.view = _personalSpaceBackup.questionView;
            if (_personalSpaceBackup.followView !== undefined) _followState.view = _personalSpaceBackup.followView;

            // 容错：如果确实没有任何兄弟节点，则调用传统的重新渲染方法
            if (siblingCount === 0) {
                if (prevPage === 'home') {
                    if (prevView === 'item') {
                        renderHomeItem(_homeState.currentIndexInGroup, _homeState.currentGroupIndex);
                    } else {
                        renderHomeList({ restoreScroll: true });
                    }
                } else if (prevPage === 'question') {
                    if (prevView === 'list') {
                        renderQuestionList();
                    } else {
                        renderQuestionAnswer(_questionState.currentIndex, false);
                    }
                } else if (prevPage === 'follow') {
                    renderFollowList();
                } else if (prevPage === 'post') {
                    _homeState.view = '';
                }
            }

            const scrollY = _personalSpaceBackup.scrollTop || window._zhPrevScrollY || 0;
            window.scrollTo(0, scrollY);
            if (siblingCount > 0 && prevView === 'list') {
                const activateScrollRefresh = prevPage === 'home'
                    ? prepareHomeScrollRefresh(wrapper)
                    : prevPage === 'follow'
                        ? prepareFollowScrollRefresh(wrapper)
                        : null;
                requestAnimationFrame(() => requestAnimationFrame(() => activateScrollRefresh?.()));
            }

            // 重置备份状态
            _personalSpaceBackup = {
                context: '',
                homeView: '',
                questionView: '',
                followView: '',
                scrollTop: 0,
                hasTopNav: false,
                hasHomeWide: false
            };
            window._zhPrevPageType = '';
            window._zhPrevView = '';
            window._zhPrevScrollY = 0;
        };

        if (spaceContainer) {
            spaceContainer.classList.add('zh-space-exit');
            setTimeout(performCleanAndRestore, 250);
        } else {
            performCleanAndRestore();
        }
    }

    function appendSpaceHeader(container, pageType) {
        const title = document.createElement('h1');
        title.className = 'zh-home-title';
        if (pageType === 'follow') {
            title.textContent = '个人空间 · 动态集锦';
        } else if (pageType === 'post') {
            title.textContent = '个人空间 · 专栏阅读';
        } else if (pageType === 'question') {
            title.textContent = '个人空间 · 问答精选';
        } else {
            title.textContent = '个人空间 · 工作台';
        }
        container.appendChild(title);
    }

    async function renderPersonalSpaceDashboard(activeTab = 'dashboard') {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return;
        disconnectFeedScrollController();

        // 记录进入空间前的原始视图和滚动位置，防止销毁 DOM 导致退出后黑屏/白屏
        if (_homeState.view !== 'personal-space' && _questionState.view !== 'personal-space') {
            const context = isHomePage() ? 'home' : isPostPage() ? 'post' : isQuestionPage() ? 'question' : isFollowPage() ? 'follow' : 'general';
            const view = _homeState.view || _questionState.view || _followState.view || 'list';

            _personalSpaceBackup.context = context;
            _personalSpaceBackup.homeView = _homeState.view || '';
            _personalSpaceBackup.questionView = _questionState.view || '';
            _personalSpaceBackup.followView = _followState.view || '';
            _personalSpaceBackup.scrollTop = window.scrollY;
            if (_homeState.view === 'list') _homeState.listScrollY = window.scrollY;
            _personalSpaceBackup.hasTopNav = wrapper.classList.contains('zh-has-top-nav');
            _personalSpaceBackup.hasHomeWide = wrapper.classList.contains('zh-home-wide');

            window._zhPrevView = view;
            window._zhPrevPageType = context;
            window._zhPrevScrollY = window.scrollY;
        }

        _homeState.view = 'personal-space';

        // 移除原有顶栏，设置宽屏样式
        wrapper.classList.remove('zh-has-top-nav');
        wrapper.classList.add('zh-home-wide');

        // 非破坏性 DOM 挂载：隐藏除空间 container 之外的所有兄弟 DOM 元素，并安全备份 display 属性
        let spaceContainer = document.getElementById('zh-space-container');
        if (!spaceContainer) {
            spaceContainer = document.createElement('div');
            spaceContainer.id = 'zh-space-container';
            wrapper.appendChild(spaceContainer);
        }

        Array.from(wrapper.children).forEach(child => {
            if (child !== spaceContainer) {
                if (!child.hasAttribute('data-zh-space-orig-display')) {
                    child.setAttribute('data-zh-space-orig-display', child.style.display || '');
                }
                child.style.display = 'none';
                child.classList.add('zh-space-hidden');
            }
        });

        spaceContainer.style.display = 'block';
        spaceContainer.innerHTML = '';
        
        const pageType = _personalSpaceBackup.context || window._zhPrevPageType || 'home';
        appendSpaceHeader(spaceContainer, pageType);

        const layout = document.createElement('div');
        layout.className = 'zh-space-layout';

        const sidebar = document.createElement('div');
        sidebar.className = 'zh-space-sidebar';

        const sidebarTitle = document.createElement('div');
        sidebarTitle.className = 'zh-space-sidebar-title';
        sidebarTitle.style.cssText = 'display:flex; flex-direction:column; align-items:center; text-align:center; padding:18px 10px; border-bottom:1px dashed var(--zh-border); margin-bottom:15px; gap:10px;';
        
        const cachedAvatar = crossOriginGet('zh-user-avatar') || '';
        const cachedName = crossOriginGet('zh-user-name') || '个人空间';

        sidebarTitle.innerHTML = `
            <img class="zh-space-avatar" src="${cachedAvatar || 'https://pic1.zhimg.com/v2-ab97017482aa2a5d112b2d282c6b3e39_l.jpg'}" style="width:56px; height:56px; border-radius:50%; border:2px solid var(--zh-accent); box-shadow:0 4px 10px rgba(0,0,0,0.1); object-fit:cover; display:block;" />
            <span class="zh-space-username" style="font-weight:bold; font-size:15px; color:var(--zh-accent); max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block;">${escapeHTML(cachedName)}</span>
        `;
        sidebar.appendChild(sidebarTitle);

        fetchZhihuProfile().then(profile => {
            if (profile) {
                const img = sidebarTitle.querySelector('.zh-space-avatar');
                const span = sidebarTitle.querySelector('.zh-space-username');
                if (img) img.src = profile.avatar_url;
                if (span) span.textContent = profile.name || '个人空间';
            }
        });

        const tabs = [
            { id: 'dashboard', label: '工作台主页', icon: ICONS.home || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>` },
            { id: 'toread_history', label: '待读与历史', icon: ICONS.toread || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>` },
            { id: 'card_library', label: '知识卡片库', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>` },
            { id: 'reading_notes', label: '阅读笔记汇总', icon: ICONS.radar || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>` },
            { id: 'expression_book', label: '表达收藏本', icon: ICONS.expression || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>` },
            { id: 'wiki_history', label: 'Wiki 采集记录', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>` }
        ];

        const tabButtons = {};
        tabs.forEach(tab => {
            const btn = document.createElement('button');
            btn.className = `zh-space-tab-btn ${activeTab === tab.id ? 'is-active' : ''}`;
            btn.innerHTML = `${tab.icon} <span>${tab.label}</span>`;
            btn.addEventListener('click', () => {
                Object.values(tabButtons).forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                renderTabContent(tab.id);
            });
            sidebar.appendChild(btn);
            tabButtons[tab.id] = btn;
        });

        // ═══════════════════════════════════════════════════════════
        // 【UIUX 全局统一】始终在底部显示“返回”按钮，且标签与图标根据当前宿主上下文动态适配
        // ═══════════════════════════════════════════════════════════
        const spacer = document.createElement('div');
        spacer.style.flex = '1';
        sidebar.appendChild(spacer);

        const backBtn = document.createElement('button');
        backBtn.className = 'zh-space-tab-btn';
        backBtn.style.marginTop = 'auto';

        const qView = _personalSpaceBackup.questionView || _questionState.view;
        
        let backLabel = '返回推荐';
        if (pageType === 'post') {
            backLabel = '返回文章';
        } else if (pageType === 'question') {
            backLabel = (qView === 'answer') ? '返回回答' : '返回问答';
        } else if (pageType === 'follow') {
            backLabel = '返回动态';
        }

        backBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> <span>${backLabel}</span>`;
        backBtn.addEventListener('click', closePersonalSpace);
        sidebar.appendChild(backBtn);

        layout.appendChild(sidebar);

        const contentArea = document.createElement('div');
        contentArea.className = 'zh-space-content';
        layout.appendChild(contentArea);
        spaceContainer.appendChild(layout);

        renderTabContent(activeTab);

        async function renderTabContent(tabId) {
            contentArea.innerHTML = '<div style="padding:40px; text-align:center; opacity:0.5;">正在加载...</div>';
            try {
                if (tabId === 'dashboard') {
                    await renderSpaceDashboardTab(contentArea);
                } else if (tabId === 'toread_history') {
                    await renderSpaceToreadHistoryTab(contentArea);
                } else if (tabId === 'card_library') {
                    await renderSpaceCardLibraryTab(contentArea);
                } else if (tabId === 'reading_notes') {
                    await renderSpaceReadingNotesTab(contentArea);
                } else if (tabId === 'expression_book') {
                    await renderSpaceExpressionBookTab(contentArea);
                } else if (tabId === 'wiki_history') {
                    await renderSpaceWikiRunsTab(contentArea);
                }
            } catch (err) {
                contentArea.innerHTML = `<div style="padding:20px; color:red;">渲染失败: ${escapeHTML(err.message)}</div>`;
            }
        }
    }

    async function renderSpaceDashboardTab(container) {
        let allCards = [];
        let allRecords = [];
        let toReadList = [];
        try {
            allCards = await getAllWikiCards();
            allRecords = await getAllReadingRecords();
            toReadList = loadToReadList();
        } catch (e) {
            console.warn('Dashboard 载入数据失败', e);
        }

        container.innerHTML = '';
        const streakInfo = calculateReadingStreaks(allRecords);

        const statsGrid = document.createElement('div');
        statsGrid.className = 'zh-space-stats-grid';
        statsGrid.innerHTML = `
            <div class="zh-space-stat-card">
                <div class="zh-space-stat-val">${streakInfo.currentStreak} 天</div>
                <div class="zh-space-stat-lbl">🔥 当前连续阅读打卡</div>
            </div>
            <div class="zh-space-stat-card">
                <div class="zh-space-stat-val">${streakInfo.maxStreak} 天</div>
                <div class="zh-space-stat-lbl">🏆 历史最长连续打卡</div>
            </div>
            <div class="zh-space-stat-card">
                <div class="zh-space-stat-val">${allRecords.length} 篇</div>
                <div class="zh-space-stat-lbl">📚 累计已读知乎条目</div>
            </div>
            <div class="zh-space-stat-card">
                <div class="zh-space-stat-val">${allCards.length} 张</div>
                <div class="zh-space-stat-lbl">💡 已沉淀 Wiki 知识卡片</div>
            </div>
            <div class="zh-space-stat-card">
                <div class="zh-space-stat-val">${toReadList.length} 篇</div>
                <div class="zh-space-stat-lbl">📌 待读列表文章数</div>
            </div>
        `;
        container.appendChild(statsGrid);

        const heatmapWrapper = document.createElement('div');
        heatmapWrapper.className = 'zh-space-heatmap-wrapper';

        const heatmapHeader = document.createElement('div');
        heatmapHeader.className = 'zh-space-heatmap-header';
        heatmapHeader.innerHTML = `
            <span>📅 知乎阅读热力图 (过去一年)</span>
            <span style="font-size:11px; font-weight:normal; opacity:0.8;">共打卡 ${streakInfo.totalDays} 天</span>
        `;
        heatmapWrapper.appendChild(heatmapHeader);

        const heatmapCells = generateHeatmapData(allRecords);

        const monthsRow = document.createElement('div');
        monthsRow.className = 'zh-space-heatmap-months';
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
        
        const weekMonths = [];
        for (let w = 0; w < 53; w++) {
            const dayIndex = w * 7;
            if (dayIndex < heatmapCells.length) {
                const dateStr = heatmapCells[dayIndex].date;
                const m = parseInt(dateStr.split('-')[1], 10) - 1;
                weekMonths.push(m);
            } else {
                weekMonths.push(-1);
            }
        }
        
        let lastMonth = -1;
        for (let w = 0; w < 53; w++) {
            const currentMonth = weekMonths[w];
            if (currentMonth !== lastMonth && currentMonth !== -1) {
                const monthCol = document.createElement('div');
                monthCol.textContent = monthNames[currentMonth];
                monthCol.style.gridColumnStart = w + 1;
                monthCol.style.gridColumnEnd = `span 4`;
                monthCol.style.whiteSpace = 'nowrap';
                monthsRow.appendChild(monthCol);
                lastMonth = currentMonth;
            }
        }
        heatmapWrapper.appendChild(monthsRow);

        const gridContainer = document.createElement('div');
        gridContainer.className = 'zh-space-heatmap-grid-container';

        const weekdaysCol = document.createElement('div');
        weekdaysCol.className = 'zh-space-heatmap-weekdays';
        weekdaysCol.innerHTML = `
            <span>日</span>
            <span></span>
            <span>二</span>
            <span></span>
            <span>四</span>
            <span></span>
            <span>六</span>
        `;
        gridContainer.appendChild(weekdaysCol);

        const grid = document.createElement('div');
        grid.className = 'zh-space-heatmap-grid';

        heatmapCells.forEach(cell => {
            const cellEl = document.createElement('div');
            cellEl.className = `zh-space-heatmap-day ${cell.level ? 'level-' + cell.level : ''}`;
            cellEl.title = `${cell.date} : 阅读 ${cell.count} 篇`;
            grid.appendChild(cellEl);
        });
        gridContainer.appendChild(grid);
        heatmapWrapper.appendChild(gridContainer);
        container.appendChild(heatmapWrapper);

        const motivation = document.createElement('div');
        motivation.className = 'zh-callout zh-callout-tip';
        motivation.style.margin = '20px 0';
        motivation.innerHTML = `
            <div class="zh-callout-title">💡 沉浸式思考与阅读</div>
            <div class="zh-callout-content">
                “学而不思则罔，思而不学则殆。” 连续打卡不仅是坚持的体现，更是在卡片库中不断沉淀思考、积累智慧的轨迹。今天你沉淀出知识卡片了吗？
            </div>
        `;
        container.appendChild(motivation);
    }

    function parseZhihuUrl(url) {
        url = url.trim();
        const res = {
            url,
            title: '手动添加的内容',
            author: '知乎',
            type: '知乎链接',
            addedAt: new Date().toISOString()
        };
        
        try {
            if (url.includes('zhuanlan.zhihu.com/p/')) {
                res.type = '专栏文章';
                res.contentKind = 'article';
                const match = url.match(/\/p\/(\d+)/);
                if (match) res.title = `知乎专栏文章 #${match[1]}`;
            } else if (url.includes('/answer/')) {
                res.type = '回答';
                res.contentKind = 'answer';
                const match = url.match(/\/question\/(\d+)\/answer\/(\d+)/);
                if (match) res.title = `知乎回答 #${match[2]}`;
            } else if (url.includes('/question/')) {
                res.type = '问题';
                res.contentKind = 'answer';
                const match = url.match(/\/question\/(\d+)/);
                if (match) res.title = `知乎问题 #${match[1]}`;
            }
        } catch (err) {}
        return res;
    }

    async function renderSpaceToreadHistoryTab(container) {
        container.innerHTML = '';
        let subTab = 'toread';
        
        const cardHeader = document.createElement('div');
        cardHeader.className = 'zh-space-table-actions';
        cardHeader.style.borderBottom = '1px dashed var(--zh-border)';
        cardHeader.style.paddingBottom = '10px';
        cardHeader.style.marginBottom = '16px';
        
        const subTabSwitch = document.createElement('div');
        subTabSwitch.style.display = 'flex';
        subTabSwitch.style.gap = '10px';
        
        const toReadBtn = document.createElement('button');
        toReadBtn.className = 'zh-inline-btn zh-btn-active';
        toReadBtn.textContent = '稍后待读列表';
        
        const historyBtn = document.createElement('button');
        historyBtn.className = 'zh-inline-btn';
        historyBtn.textContent = '已读历史记录';
        
        toReadBtn.addEventListener('click', () => {
            subTab = 'toread';
            toReadBtn.classList.add('zh-btn-active');
            historyBtn.classList.remove('zh-btn-active');
            renderListArea();
        });
        
        historyBtn.addEventListener('click', () => {
            subTab = 'history';
            historyBtn.classList.add('zh-btn-active');
            toReadBtn.classList.remove('zh-btn-active');
            renderListArea();
        });
        
        subTabSwitch.appendChild(toReadBtn);
        subTabSwitch.appendChild(historyBtn);
        cardHeader.appendChild(subTabSwitch);
        
        const manualEntryDiv = document.createElement('div');
        manualEntryDiv.style.display = 'flex';
        manualEntryDiv.style.gap = '8px';
        manualEntryDiv.style.alignItems = 'center';
        
        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.placeholder = '输入知乎文章/回答 URL...';
        urlInput.style.cssText = 'padding: 0 12px; font-size: 13px; height: 34px; box-sizing: border-box; border: 1px solid var(--zh-border); border-radius: 4px; background: var(--zh-paper); color: var(--zh-text); width: 220px; outline: none; transition: border-color 0.15s ease;';
        
        const addBtn = document.createElement('button');
        addBtn.className = 'zh-inline-btn';
        addBtn.textContent = '添加待读';
        addBtn.addEventListener('click', () => {
            const val = urlInput.value.trim();
            if (!val) return alert('请输入知乎链接');
            if (!val.startsWith('http://') && !val.startsWith('https://')) return alert('链接格式不正确');
            
            const parsed = parseZhihuUrl(val);
            const list = loadToReadList();
            if (list.some(item => item.url === parsed.url)) {
                alert('该链接已在待读列表中！');
                return;
            }
            list.unshift(parsed);
            saveToReadList(list);
            urlInput.value = '';
            showToast('添加成功');
            if (subTab === 'toread') renderListArea();
        });
        
        manualEntryDiv.appendChild(urlInput);
        manualEntryDiv.appendChild(addBtn);
        cardHeader.appendChild(manualEntryDiv);
        
        container.appendChild(cardHeader);
        
        const listArea = document.createElement('div');
        container.appendChild(listArea);
        
        renderListArea();
        
        async function renderListArea() {
            listArea.innerHTML = '<div style="opacity:0.5; padding:20px;">正在加载列表...</div>';
            
            if (subTab === 'toread') {
                const items = loadToReadList();
                if (!items.length) {
                    listArea.innerHTML = `<div style="padding:40px; text-align:center; opacity:0.5;">待读列表为空。在文章阅读页点击书签图标或在此处手动添加。</div>`;
                    return;
                }
                
                listArea.innerHTML = `
                    <div class="zh-space-table-actions">
                        <span style="font-size:13px; opacity:0.8;">共 ${items.length} 条待读内容</span>
                        <div style="display:flex; gap:8px;">
                            <button id="zh-batch-wiki-toread" class="zh-inline-btn" style="background:var(--zh-accent); color:var(--zh-paper);">🤖 所选进行 Wiki 采集</button>
                            <button id="zh-clear-toread" class="zh-inline-btn">清空待读</button>
                        </div>
                    </div>
                    <div class="zh-space-table-wrap">
                        <table class="zh-space-table">
                            <thead>
                                <tr>
                                    <th style="width: 40px; text-align: center;"><input type="checkbox" id="zh-toread-select-all"></th>
                                    <th>标题</th>
                                    <th>作者</th>
                                    <th>类型</th>
                                    <th>添加时间</th>
                                    <th style="width: 80px; text-align: center;">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map((item, index) => `
                                    <tr>
                                        <td style="text-align: center;"><input type="checkbox" class="zh-toread-checkbox" data-index="${index}"></td>
                                        <td><a href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--zh-accent); text-decoration:none; font-weight:bold;">${escapeHTML(item.title)}</a></td>
                                        <td>${escapeHTML(item.author || '未知')}</td>
                                        <td><span class="zh-home-card-type">${escapeHTML(item.type || '未指定')}</span></td>
                                        <td style="font-size:12px; opacity:0.75;">${item.addedAt ? new Date(item.addedAt).toLocaleString() : '未知'}</td>
                                        <td style="text-align: center;">
                                            <button class="zh-inline-btn zh-toread-delete" data-index="${index}" style="padding:2px 6px; font-size:12px;">移除</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                
                const selectAll = document.getElementById('zh-toread-select-all');
                const checkboxes = listArea.querySelectorAll('.zh-toread-checkbox');
                selectAll.addEventListener('change', () => {
                    checkboxes.forEach(cb => cb.checked = selectAll.checked);
                });
                
                listArea.querySelectorAll('.zh-toread-delete').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.dataset.index, 10);
                        const list = loadToReadList();
                        if (idx >= 0 && idx < list.length) {
                            list.splice(idx, 1);
                            saveToReadList(list);
                            showToast('已移除');
                            renderListArea();
                        }
                    });
                });
                
                document.getElementById('zh-clear-toread').addEventListener('click', () => {
                    if (confirm('确认清空待读列表？')) {
                        saveToReadList([]);
                        showToast('已清空');
                        renderListArea();
                    }
                });
                
                document.getElementById('zh-batch-wiki-toread').addEventListener('click', () => {
                    const selected = [];
                    checkboxes.forEach(cb => {
                        if (cb.checked) {
                            const idx = parseInt(cb.dataset.index, 10);
                            selected.push(items[idx]);
                        }
                    });
                    
                    if (!selected.length) {
                        alert('请先选择要采集的待读条目！');
                        return;
                    }
                    
                    startWikiRun(selected);
                });
                
            } else {
                let records = [];
                try {
                    records = await getAllReadingRecords();
                } catch (err) {
                    listArea.innerHTML = `<div style="color:red; padding:20px;">读取历史记录失败: ${err.message}</div>`;
                    return;
                }
                
                if (!records.length) {
                    listArea.innerHTML = `<div style="padding:40px; text-align:center; opacity:0.5;">未发现已读历史记录。在沉浸模式下阅读文章/回答，即可自动记录阅读打卡轨迹。</div>`;
                    return;
                }
                
                listArea.innerHTML = `
                    <div class="zh-space-table-actions">
                        <span style="font-size:13px; opacity:0.8;">共 ${records.length} 条已读历史记录</span>
                        <div style="display:flex; gap:8px;">
                            <button id="zh-batch-wiki-history" class="zh-inline-btn" style="background:var(--zh-accent); color:var(--zh-paper);">🤖 所选进行 Wiki 采集</button>
                            <button id="zh-clear-history" class="zh-inline-btn">清空历史</button>
                        </div>
                    </div>
                    <div class="zh-space-table-wrap">
                        <table class="zh-space-table">
                            <thead>
                                <tr>
                                    <th style="width: 40px; text-align: center;"><input type="checkbox" id="zh-history-select-all"></th>
                                    <th>标题</th>
                                    <th>作者</th>
                                    <th>品类</th>
                                    <th style="width: 130px;">阅读进度</th>
                                    <th>阅读打卡时间</th>
                                    <th style="width: 80px; text-align: center;">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${records.map((r, index) => `
                                    <tr>
                                        <td style="text-align: center;"><input type="checkbox" class="zh-history-checkbox" data-index="${index}"></td>
                                        <td><a href="${escapeHTML(r.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--zh-accent); text-decoration:none; font-weight:bold;">${escapeHTML(r.title)}</a></td>
                                        <td>${escapeHTML(r.author || '未知')}</td>
                                        <td><span class="zh-home-card-type" style="background: rgba(122,92,216,0.1); color: var(--zh-accent);">${escapeHTML(r.contentKind === 'article' ? '文章' : r.contentKind === 'answer' ? '回答' : '页面')}</span></td>
                                        <td>${renderProgressCell(r.progress || 0)}</td>
                                        <td style="font-size:12px; opacity:0.75;">${r.readAt ? new Date(r.readAt).toLocaleString() : '未知'}</td>
                                        <td style="text-align: center;">
                                            <button class="zh-inline-btn zh-history-delete" data-url="${escapeHTML(r.url)}" style="padding:2px 6px; font-size:12px;">删除</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                
                const selectAll = document.getElementById('zh-history-select-all');
                const checkboxes = listArea.querySelectorAll('.zh-history-checkbox');
                selectAll.addEventListener('change', () => {
                    checkboxes.forEach(cb => cb.checked = selectAll.checked);
                });
                
                listArea.querySelectorAll('.zh-history-delete').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const url = btn.dataset.url;
                        if (confirm('确认删除此条历史记录？')) {
                            try {
                                await deleteReadingRecord(url);
                                showToast('已删除');
                                renderListArea();
                            } catch (e) {
                                alert('删除失败: ' + e.message);
                            }
                        }
                    });
                });
                
                document.getElementById('zh-clear-history').addEventListener('click', async () => {
                    if (confirm('重要提示：这将清空所有的阅读记录，会影响打卡天数 and 热力图绘制！确认继续清空？')) {
                        try {
                            await clearAllReadingRecords();
                            showToast('已清空所有历史');
                            renderListArea();
                        } catch (e) {
                            alert('清空失败: ' + e.message);
                        }
                    }
                });
                
                document.getElementById('zh-batch-wiki-history').addEventListener('click', () => {
                    const selected = [];
                    checkboxes.forEach(cb => {
                        if (cb.checked) {
                            const idx = parseInt(cb.dataset.index, 10);
                            selected.push(records[idx]);
                        }
                    });
                    
                    if (!selected.length) {
                        alert('请先选择要采集的历史条目！');
                        return;
                    }
                    
                    startWikiRun(selected);
                });
            }
        }
    }

    async function renderSpaceCardLibraryTab(container) {
        container.innerHTML = '';
        const searchBar = document.createElement('div');
        searchBar.className = 'zh-wiki-search-bar';
        searchBar.style.margin = '0 0 16px 0';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '输入关键词或进行语义搜索...';
        
        const searchBtn = document.createElement('button');
        searchBtn.textContent = '搜索';
        
        searchBar.appendChild(searchInput);
        searchBar.appendChild(searchBtn);
        container.appendChild(searchBar);

        const tagCloudEl = document.createElement('div');
        tagCloudEl.className = 'zh-wiki-tag-cloud';
        tagCloudEl.style.marginBottom = '16px';
        tagCloudEl.innerHTML = '<span style="opacity:0.5;">加载标签中...</span>';
        container.appendChild(tagCloudEl);

        const gridEl = document.createElement('div');
        gridEl.className = 'zh-wiki-card-grid';
        gridEl.innerHTML = '<div style="padding:20px;opacity:0.5;">加载卡片中...</div>';
        container.appendChild(gridEl);

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

        allCards.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

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
                .slice(0, 30)
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

        renderWikiCardGrid(allCards, gridEl);

        const doSearch = async () => {
            const query = searchInput.value.trim();
            if (!query) {
                renderWikiCardGrid(activeTag ? await getWikiCardsByTag(activeTag) : allCards, gridEl);
                return;
            }
            const embeddingHost = (config.embeddingHost || config.apiHost || '').trim();
            const embeddingKey = (config.embeddingKey || config.apiKey || '').trim();
            if (!embeddingHost || !embeddingKey) {
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
    }

    function showWikiLaunchModal(onConfirm) {
        if (document.getElementById('zh-wiki-launch-modal')) return;
        createModal('zh-wiki-launch-modal', '首页信息流 Wiki · 启动设置', `
            <label style="display:block; margin-bottom:5px;">采集条数:</label>
            <input type="number" id="zh-launch-wiki-max" min="1" value="${config.wikiMaxItems || 100}" style="width:100%; margin-bottom:10px; box-sizing:border-box;">
            <label style="display:block; margin-bottom:5px;">AI 并发数 (0 为不限):</label>
            <input type="number" id="zh-launch-wiki-concurrency" min="0" value="${config.wikiConcurrency ?? 20}" style="width:100%; margin-bottom:10px; box-sizing:border-box;">
            <label style="display:block; margin-bottom:5px;">AI RPM (0 为不限):</label>
            <input type="number" id="zh-launch-wiki-rpm" min="0" value="${config.wikiRpm ?? 300}" style="width:100%; margin-bottom:10px; box-sizing:border-box;">
            <label style="display:block; margin-bottom:5px; cursor:pointer;"><input type="checkbox" id="zh-launch-wiki-final" ${config.wikiFinalSynthesis !== false ? 'checked' : ''}> 生成今日总览</label>
            <label style="display:block; margin-bottom:12px; cursor:pointer;"><input type="checkbox" id="zh-launch-wiki-obsidian" ${config.wikiObsidianOptimized === true ? 'checked' : ''}> Obsidian 导出格式优化 (使用 Frontmatter 与 Callouts)</label>
            <button id="zh-launch-wiki-start" class="zh-inline-btn" style="background:var(--zh-accent); color:var(--zh-paper); width:100%;">开始采集</button>
        `);
        document.getElementById('zh-launch-wiki-start').addEventListener('click', () => {
            saveConfig({
                wikiMaxItems: getFormNumber('zh-launch-wiki-max', 100, 1),
                wikiConcurrency: getFormNumber('zh-launch-wiki-concurrency', 20, 0),
                wikiRpm: getFormNumber('zh-launch-wiki-rpm', 300, 0),
                wikiFinalSynthesis: document.getElementById('zh-launch-wiki-final').checked,
                wikiObsidianOptimized: document.getElementById('zh-launch-wiki-obsidian').checked
            });
            document.getElementById('zh-wiki-launch-modal')?.remove();
            onConfirm();
        });
    }

    async function renderSpaceWikiRunsTab(container) {
        container.innerHTML = '';
        const statusSection = document.createElement('section');
        statusSection.className = 'zh-wiki-history';
        statusSection.style.marginBottom = '20px';
        
        const statusTitle = document.createElement('h3');
        statusTitle.textContent = '当前 Wiki 采集任务';
        statusTitle.style.marginBottom = '12px';
        statusSection.appendChild(statusTitle);
        
        const status = document.createElement('div');
        status.id = 'zh-wiki-progress';
        status.className = 'zh-wiki-progress';
        status.style.marginBottom = '12px';
        
        if (wikiState.running) {
            status.textContent = `信息流 Wiki：${wikiState.progressMessage || '正在运行...'}`;
        } else if (wikiState.finished && wikiState.markdown) {
            status.textContent = `信息流 Wiki：上一次运行已完成，共 ${wikiState.items.length || 0} 条。`;
        } else {
            status.textContent = '信息流 Wiki：未在运行。您可以在“待读与历史”页面中勾选并触发手动采集，或在此开始自动采集首页推荐。';
        }
        statusSection.appendChild(status);
        
        const actions = document.createElement('div');
        actions.className = 'zh-wiki-actions';
        actions.style.marginBottom = '12px';
        
        if (!wikiState.running) {
            actions.appendChild(createWikiActionButton('开始新采集 (知乎首页推荐)', () => {
                if (!isHomePage()) {
                    alert('自动采集知乎首页推荐只能在知乎首页推荐页运行。若需在其他页面运行，请使用“待读与历史”中的勾选采集功能。');
                    return;
                }
                showWikiLaunchModal(() => startWikiRun());
            }));
        } else {
            actions.appendChild(createWikiActionButton(wikiState.paused ? '恢复任务' : '暂停任务', () => {
                setWikiPaused(!wikiState.paused);
                renderPersonalSpaceDashboard('wiki_history');
            }));
            actions.appendChild(createWikiActionButton('刷新进度', () => renderPersonalSpaceDashboard('wiki_history')));
        }
        
        if (wikiState.finished && wikiState.markdown) {
            actions.appendChild(createWikiActionButton('查看本次结果', () => renderWikiResult(wikiState.markdown)));
        }
        
        statusSection.appendChild(actions);
        
        if (wikiState.running || wikiState.log?.length) {
            statusSection.appendChild(renderWikiLog());
        }
        
        container.appendChild(statusSection);
        
        renderWikiHistory(container);
    }

    async function fetchZhihuProfile() {
        try {
            const url = 'https://www.zhihu.com/api/v4/me';
            const xhr = getUserscriptXHR();
            let data;
            if (xhr && !url.startsWith(location.origin)) {
                data = await new Promise((resolve, reject) => {
                    xhr({
                        method: 'GET', url, timeout: 10000, anonymous: false,
                        headers: { 'Accept': 'application/json' },
                        onload: res => {
                            if (res.status >= 200 && res.status < 300) {
                                try { resolve(JSON.parse(res.responseText)); } catch (e) { reject(e); }
                            } else { reject(new Error(`HTTP ${res.status}`)); }
                        },
                        onerror: () => reject(new Error('network error')),
                        ontimeout: () => reject(new Error('timeout'))
                    });
                });
            } else {
                const res = await fetch(url);
                if (!res.ok) throw new Error('Zhihu API Error');
                data = await res.json();
            }
            if (data && data.avatar_url) {
                crossOriginSet('zh-user-avatar', data.avatar_url);
                crossOriginSet('zh-user-name', data.name || '个人空间');
                return data;
            }
        } catch (e) {
            console.warn('获取知乎个人资料 API 失败', e);
        }
        return null;
    }

    async function renderSpaceReadingNotesTab(container) {
        container.innerHTML = '';
        const items = loadRadarReportBook();

        const actions = document.createElement('div');
        actions.className = 'zh-space-table-actions';
        actions.innerHTML = `
            <div style="display:flex; gap:8px;">
                <button id="zh-space-radar-copy" class="zh-inline-btn">复制 Markdown</button>
                <button id="zh-space-radar-download-md" class="zh-inline-btn">下载 Markdown</button>
                <button id="zh-space-radar-download-json" class="zh-inline-btn">下载 JSON</button>
            </div>
            <button id="zh-space-radar-clear" class="zh-inline-btn" style="border-color:red; color:red;">清空全部</button>
        `;
        container.appendChild(actions);

        const countInfo = document.createElement('div');
        countInfo.style.cssText = 'font-size:13px; opacity:0.75; margin-bottom:16px;';
        countInfo.textContent = `共记录了 ${items.length} 篇阅读笔记。`;
        container.appendChild(countInfo);

        const listContainer = document.createElement('div');
        listContainer.style.cssText = 'display:flex; flex-direction:column; gap:16px;';

        if (items.length === 0) {
            listContainer.innerHTML = '<div style="padding:40px; text-align:center; opacity:0.5;">阅读笔记本还是空的哦。在文章页或问答页点击右侧工具栏的雷达图标，即可让 AI 辅助生成阅读笔记！</div>';
        } else {
            items.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'zh-space-stat-card';
                card.style.cssText = 'text-align:left; display:flex; flex-direction:column; gap:10px; padding:20px;';

                const depthLabel = { skim: '略读', read: '细读', study: '精读', skip: '跳过' }[item.depth] || item.depth || '略读';
                const relevanceScore = item.relevance ?? 50;

                const header = document.createElement('div');
                header.style.cssText = 'display:flex; justify-content:space-between; align-items:flex-start; gap:10px;';
                header.innerHTML = `
                    <div style="font-weight:bold; font-size:16px; color:var(--zh-title);">${index + 1}. [${escapeHTML(item.archetype || '')}] ${escapeHTML(item.oneliner || item.title || '')}</div>
                    <button class="zh-inline-btn delete-btn" style="border-color:rgba(255,0,0,0.3); color:red; padding:2px 8px; font-size:12px;">删除</button>
                `;

                header.querySelector('.delete-btn').addEventListener('click', () => {
                    if (!confirm('确认删除该笔记？')) return;
                    const book = loadRadarReportBook();
                    const filtered = book.filter(x => x.sourceKey !== item.sourceKey);
                    saveRadarReportBook(filtered);
                    renderPersonalSpaceDashboard('reading_notes');
                });

                card.appendChild(header);

                const impression = document.createElement('div');
                impression.style.cssText = 'padding-left:12px; border-left:3px solid var(--zh-accent); color:var(--zh-text); line-height:1.7; margin:8px 0;';
                impression.textContent = item.impression || '';
                card.appendChild(impression);

                const footer = document.createElement('div');
                footer.style.cssText = 'display:flex; justify-content:space-between; align-items:center; font-size:12px; opacity:0.75; flex-wrap:wrap; gap:8px;';
                
                const tags = (item.tags || []).map(t => `<span style="display:inline-block; margin-right:6px; padding:1px 6px; border-radius:3px; background:var(--zh-code); color:var(--zh-accent);">#${escapeHTML(t)}</span>`).join('');

                footer.innerHTML = `
                    <div>
                        <span style="font-weight:bold; color:var(--zh-accent); margin-right:12px;">📖 ${depthLabel}</span>
                        <span style="margin-right:12px;">⭐ 相关度: ${relevanceScore}%</span>
                        ${item.savedAt ? `<span>📅 ${new Date(item.savedAt).toLocaleString()}</span>` : ''}
                    </div>
                    <div>${tags}</div>
                `;
                card.appendChild(footer);

                if (item.url) {
                    const urlEl = document.createElement('div');
                    urlEl.style.cssText = 'font-size:12px; opacity:0.5; word-break:break-all; cursor:pointer; text-decoration:underline;';
                    urlEl.textContent = item.url;
                    urlEl.addEventListener('click', () => window.open(item.url, '_blank'));
                    card.appendChild(urlEl);
                }

                listContainer.appendChild(card);
            });
        }
        container.appendChild(listContainer);

        // Bind events
        document.getElementById('zh-space-radar-copy')?.addEventListener('click', async () => {
            await navigator.clipboard.writeText(formatRadarReportBookMarkdown(loadRadarReportBook()));
            showToast('已成功复制 Markdown 到剪贴板！');
        });
        document.getElementById('zh-space-radar-download-md')?.addEventListener('click', () => {
            downloadTextFile(`zhihu-radar-report-book-${new Date().toISOString().slice(0, 10)}.md`, formatRadarReportBookMarkdown(loadRadarReportBook()), 'text/markdown;charset=utf-8');
        });
        document.getElementById('zh-space-radar-download-json')?.addEventListener('click', () => {
            downloadTextFile(`zhihu-radar-report-book-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(loadRadarReportBook(), null, 2), 'application/json;charset=utf-8');
        });
        document.getElementById('zh-space-radar-clear')?.addEventListener('click', () => {
            if (!confirm('确定要清空所有的阅读笔记吗？该操作不可撤销！')) return;
            saveRadarReportBook([]);
            renderPersonalSpaceDashboard('reading_notes');
        });
    }

    async function renderSpaceExpressionBookTab(container) {
        container.innerHTML = '';
        const items = loadExpressionBook();

        const actions = document.createElement('div');
        actions.className = 'zh-space-table-actions';
        actions.innerHTML = `
            <div style="display:flex; gap:8px;">
                <button id="zh-space-expr-copy" class="zh-inline-btn">复制 Markdown</button>
                <button id="zh-space-expr-download-md" class="zh-inline-btn">下载 Markdown</button>
                <button id="zh-space-expr-download-json" class="zh-inline-btn">下载 JSON</button>
            </div>
            <button id="zh-space-expr-clear" class="zh-inline-btn" style="border-color:red; color:red;">清空全部</button>
        `;
        container.appendChild(actions);

        const countInfo = document.createElement('div');
        countInfo.style.cssText = 'font-size:13px; opacity:0.75; margin-bottom:16px;';
        countInfo.textContent = `共记录了 ${items.length} 条表达收藏。`;
        container.appendChild(countInfo);

        const listContainer = document.createElement('div');
        listContainer.style.cssText = 'display:flex; flex-direction:column; gap:16px;';

        if (items.length === 0) {
            listContainer.innerHTML = '<div style="padding:40px; text-align:center; opacity:0.5;">表达收藏本还是空的哦。在沉浸阅读模式下，选中任何中/英文文本划词，右键选择“加入表达收藏本”，即可在此回看和学习！</div>';
        } else {
            items.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'zh-space-stat-card';
                card.style.cssText = 'text-align:left; display:flex; flex-direction:column; gap:10px; padding:20px;';

                const header = document.createElement('div');
                header.style.cssText = 'display:flex; justify-content:space-between; align-items:flex-start; gap:10px;';
                header.innerHTML = `
                    <div style="font-weight:bold; font-size:16px; color:var(--zh-accent);">${index + 1}. ${escapeHTML(item.selectedText || '')}</div>
                    <button class="zh-inline-btn delete-btn" style="border-color:rgba(255,0,0,0.3); color:red; padding:2px 8px; font-size:12px;">删除</button>
                `;

                header.querySelector('.delete-btn').addEventListener('click', () => {
                    if (!confirm('确认删除该条表达收藏？')) return;
                    const book = loadExpressionBook();
                    const filtered = book.filter((_, idx) => idx !== index);
                    saveExpressionBook(filtered);
                    renderPersonalSpaceDashboard('expression_book');
                });

                card.appendChild(header);

                const details = document.createElement('div');
                details.style.cssText = 'font-size:13px; opacity:0.75; margin-bottom:4px;';
                details.textContent = `${item.title || ''} ${item.savedAt ? ' · ' + new Date(item.savedAt).toLocaleString() : ''}`;
                card.appendChild(details);

                const srcBox = document.createElement('div');
                srcBox.style.cssText = 'margin-top:6px;';
                srcBox.innerHTML = `<strong>原文段落：</strong>${escapeHTML(item.sourceText || '')}`;
                card.appendChild(srcBox);

                const trBox = document.createElement('div');
                trBox.style.cssText = 'margin-top:6px;';
                trBox.innerHTML = `<strong>对照译文：</strong>${escapeHTML(item.translatedText || '暂无对照译文')}`;
                card.appendChild(trBox);

                if (item.annotation) {
                    const annBox = document.createElement('div');
                    annBox.style.cssText = 'margin-top:6px; color:var(--zh-accent); padding:8px 12px; background:var(--zh-quote); border-radius:4px; font-size:13.5px;';
                    annBox.innerHTML = `<strong>AI 批注：</strong>${escapeHTML(item.annotation)}`;
                    card.appendChild(annBox);
                }

                listContainer.appendChild(card);
            });
        }
        container.appendChild(listContainer);

        // Bind events
        document.getElementById('zh-space-expr-copy')?.addEventListener('click', async () => {
            await navigator.clipboard.writeText(formatExpressionBookMarkdown(loadExpressionBook()));
            showToast('已成功复制 Markdown 到剪贴板！');
        });
        document.getElementById('zh-space-expr-download-md')?.addEventListener('click', () => {
            downloadTextFile(`zhihu-expression-book-${new Date().toISOString().slice(0, 10)}.md`, formatExpressionBookMarkdown(loadExpressionBook()), 'text/markdown;charset=utf-8');
        });
        document.getElementById('zh-space-expr-download-json')?.addEventListener('click', () => {
            downloadTextFile(`zhihu-expression-book-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(loadExpressionBook(), null, 2), 'application/json;charset=utf-8');
        });
        document.getElementById('zh-space-expr-clear')?.addEventListener('click', () => {
            if (!confirm('确定要清空所有的表达收藏吗？该操作不可撤销！')) return;
            saveExpressionBook([]);
            renderPersonalSpaceDashboard('expression_book');
        });
    }
