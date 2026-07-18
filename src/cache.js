    function openQuestionCacheDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error('当前环境不支持 IndexedDB'));
                return;
            }
            const req = indexedDB.open(QUESTION_CACHE_DB, 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(QUESTION_CACHE_STORE)) {
                    db.createObjectStore(QUESTION_CACHE_STORE, { keyPath: 'cacheKey' });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function getQuestionCacheRecord(cacheKey) {
        const db = await openQuestionCacheDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(QUESTION_CACHE_STORE, 'readonly');
            const req = tx.objectStore(QUESTION_CACHE_STORE).get(cacheKey);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
            tx.oncomplete = () => db.close();
            tx.onerror = () => db.close();
        });
    }

    async function putQuestionCacheRecord(record) {
        const db = await openQuestionCacheDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(QUESTION_CACHE_STORE, 'readwrite');
            tx.objectStore(QUESTION_CACHE_STORE).put(record);
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); reject(tx.error); };
        });
    }

    function loadTranslationCache() {
        try {
            const raw = crossOriginGet(TRANSLATION_CACHE_KEY);
            const parsed = raw ? JSON.parse(raw) : null;
            return parsed && typeof parsed === 'object'
                ? { entries: parsed.entries || {}, order: Array.isArray(parsed.order) ? parsed.order : [] }
                : { entries: {}, order: [] };
        } catch (err) {
            console.warn('知乎沉浸式阅读：翻译缓存读取失败', err);
            return { entries: {}, order: [] };
        }
    }

    function saveTranslationCache(cache) {
        const entries = cache.entries || {};
        let order = Array.isArray(cache.order) ? cache.order.filter(key => entries[key]) : Object.keys(entries);
        const seen = new Set();
        order = order.filter(key => {
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        while (order.length > TRANSLATION_CACHE_MAX) {
            const oldKey = order.shift();
            delete entries[oldKey];
        }
        try {
            crossOriginSet(TRANSLATION_CACHE_KEY, JSON.stringify({ entries, order }));
        } catch (err) {
            while (order.length > Math.floor(TRANSLATION_CACHE_MAX / 2)) {
                const oldKey = order.shift();
                delete entries[oldKey];
            }
            try {
                crossOriginSet(TRANSLATION_CACHE_KEY, JSON.stringify({ entries, order }));
            } catch (innerErr) {
                console.warn('知乎沉浸式阅读：翻译缓存写入失败', innerErr);
            }
        }
    }

    function makeTranslationCacheKey(type, content, prompt = null) {
        const promptSignature = type === 'block'
            ? (prompt?.id || 'default') + ':' + stableHash(prompt?.prompt || '') + ':' + String(config.translationContextParagraphs || 0)
            : '';
        const parts = [
            type,
            config.apiHost || '',
            config.apiModel || '',
            config.targetLang || ''
        ];
        if (type === 'block') parts.push(promptSignature);
        parts.push(stableHash(content));
        return parts.join('::');
    }

    function normalizeTranslationCacheText(text) {
        return String(text || '')
            .replace(/\u200b/g, '')
            .replace(/图片已隐藏，点击显示/g, '')
            .replace(/正在高强度研读全文并提取摘要/g, '')
            .replace(/解析队列中/g, '')
            .replace(/▶ 点击请求 AI 翻译此段/g, '')
            .replace(/正在重新生成翻译/g, '')
            .replace(/重新生成/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function getSummaryCacheContent(fullText) {
        return normalizeTranslationCacheText(fullText);
    }

    function getTranslationCache(type, content, prompt = null) {
        const key = makeTranslationCacheKey(type, content, prompt);
        if (_translationMemoryCache.has(key)) {
            console.info(`[Zhihu TR Cache] memory hit: ${type}`);
            return _translationMemoryCache.get(key);
        }
        const cache = loadTranslationCache();
        const value = cache.entries[key]?.value || '';
        if (value) {
            _translationMemoryCache.set(key, value);
            console.info(`[Zhihu TR Cache] localStorage hit: ${type}`);
        } else {
            console.info(`[Zhihu TR Cache] miss: ${type} ${stableHash(content)}`);
        }
        return value;
    }

    function setTranslationCache(type, content, value, prompt = null) {
        if (!value) return;
        const cache = loadTranslationCache();
        const key = makeTranslationCacheKey(type, content, prompt);
        cache.entries[key] = { value, savedAt: Date.now() };
        cache.order = (cache.order || []).filter(item => item !== key);
        cache.order.push(key);
        _translationMemoryCache.set(key, value);
        console.info(`[Zhihu TR Cache] saved: ${type} ${stableHash(content)}`);
        saveTranslationCache(cache);
    }
