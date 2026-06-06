    // ═══════════════════════════════════════════════════════════
    // Wiki Cards IndexedDB 存储
    // ═══════════════════════════════════════════════════════════

    const WIKI_CARDS_DB_NAME = 'zh-wiki-cards-db';
    const WIKI_CARDS_DB_VERSION = 3;
    const WIKI_CARDS_STORE = 'cards';
    const WIKI_TAGS_STORE = 'tags';
    const READING_RECORDS_STORE = 'reading_records';

    let _wikiCardsDbInstance = null;

    function openWikiCardsDB() {
        if (_wikiCardsDbInstance) return Promise.resolve(_wikiCardsDbInstance);
        return new Promise((resolve, reject) => {
            let completed = false;
            const timeoutId = setTimeout(() => {
                if (!completed) {
                    completed = true;
                    reject(new Error('打开 IndexedDB 数据库超时 (5秒)，可能是浏览器数据库锁死。建议刷新页面重试。'));
                }
            }, 5000);

            let request;
            try {
                request = indexedDB.open(WIKI_CARDS_DB_NAME, WIKI_CARDS_DB_VERSION);
            } catch (err) {
                clearTimeout(timeoutId);
                reject(new Error('无法发起 IndexedDB 打开请求: ' + err.message));
                return;
            }
            
            request.onblocked = function() {
                if (!completed) {
                    completed = true;
                    clearTimeout(timeoutId);
                    reject(new Error('IndexedDB 被阻塞，请关闭其他标签页并重试'));
                }
            };

            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(WIKI_CARDS_STORE)) {
                    const cardStore = db.createObjectStore(WIKI_CARDS_STORE, { keyPath: 'id' });
                    cardStore.createIndex('batchId', 'batchId', { unique: false });
                    cardStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                if (!db.objectStoreNames.contains(WIKI_TAGS_STORE)) {
                    db.createObjectStore(WIKI_TAGS_STORE, { keyPath: 'tag' });
                }
                if (!db.objectStoreNames.contains(READING_RECORDS_STORE)) {
                    const recordStore = db.createObjectStore(READING_RECORDS_STORE, { keyPath: 'url' });
                    recordStore.createIndex('readAt', 'readAt', { unique: false });
                }
            };
            request.onsuccess = function(event) {
                if (!completed) {
                    completed = true;
                    clearTimeout(timeoutId);
                    _wikiCardsDbInstance = event.target.result;
                    _wikiCardsDbInstance.onversionchange = function() {
                        if (_wikiCardsDbInstance) {
                            _wikiCardsDbInstance.close();
                            _wikiCardsDbInstance = null;
                        }
                        console.log('检测到数据库版本变更，已主动断开旧版数据库连接。');
                    };
                    resolve(_wikiCardsDbInstance);
                }
            };
            request.onerror = function(event) {
                if (!completed) {
                    completed = true;
                    clearTimeout(timeoutId);
                    reject(new Error('Wiki IndexedDB 打开失败: ' + (event.target.error?.message || '未知错误')));
                }
            };
        });
    }

    function generateWikiCardId() {
        return `wc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    async function saveWikiCard(card) {
        const db = await openWikiCardsDB();
        const cardToSave = {
            ...card,
            id: card.id || generateWikiCardId(),
            createdAt: card.createdAt || new Date().toISOString()
        };
        return new Promise((resolve, reject) => {
            const tx = db.transaction([WIKI_CARDS_STORE, WIKI_TAGS_STORE], 'readwrite');
            tx.objectStore(WIKI_CARDS_STORE).put(cardToSave);
            // Update tags store
            const tags = Array.isArray(cardToSave.tags) ? cardToSave.tags : [];
            const tagStore = tx.objectStore(WIKI_TAGS_STORE);
            tags.forEach(tag => {
                const getReq = tagStore.get(tag);
                getReq.onsuccess = function() {
                    const existing = getReq.result || { tag, cardIds: [], count: 0 };
                    if (!existing.cardIds.includes(cardToSave.id)) {
                        existing.cardIds.push(cardToSave.id);
                        existing.count = existing.cardIds.length;
                    }
                    tagStore.put(existing);
                };
            });
            tx.oncomplete = () => resolve(cardToSave);
            tx.onerror = () => reject(new Error('保存 Wiki 卡片失败'));
        });
    }

    async function saveWikiCards(cards) {
        const results = [];
        for (const card of cards) {
            const saved = await saveWikiCard(card);
            results.push(saved);
        }
        return results;
    }

    async function getAllWikiCards() {
        const db = await openWikiCardsDB();
        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(WIKI_CARDS_STORE, 'readonly');
                const request = tx.objectStore(WIKI_CARDS_STORE).getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(new Error('读取 Wiki 卡片失败'));
            } catch (err) {
                reject(err);
            }
        });
    }

    async function getWikiCardsByTag(tag) {
        const db = await openWikiCardsDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([WIKI_TAGS_STORE, WIKI_CARDS_STORE], 'readonly');
            const tagReq = tx.objectStore(WIKI_TAGS_STORE).get(tag);
            tagReq.onsuccess = function() {
                const tagRecord = tagReq.result;
                if (!tagRecord || !tagRecord.cardIds?.length) {
                    resolve([]);
                    return;
                }
                const cardStore = tx.objectStore(WIKI_CARDS_STORE);
                const cards = [];
                let pending = tagRecord.cardIds.length;
                tagRecord.cardIds.forEach(id => {
                    const cardReq = cardStore.get(id);
                    cardReq.onsuccess = () => {
                        if (cardReq.result) cards.push(cardReq.result);
                        if (--pending === 0) resolve(cards);
                    };
                    cardReq.onerror = () => {
                        if (--pending === 0) resolve(cards);
                    };
                });
            };
            tagReq.onerror = () => reject(new Error('按标签查询失败'));
        });
    }

    async function getAllTags() {
        const db = await openWikiCardsDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(WIKI_TAGS_STORE, 'readonly');
            const request = tx.objectStore(WIKI_TAGS_STORE).getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(new Error('读取标签失败'));
        });
    }

    async function deleteWikiCard(id) {
        const db = await openWikiCardsDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([WIKI_CARDS_STORE, WIKI_TAGS_STORE], 'readwrite');
            const cardStore = tx.objectStore(WIKI_CARDS_STORE);
            const getReq = cardStore.get(id);
            getReq.onsuccess = function() {
                const card = getReq.result;
                cardStore.delete(id);
                if (card && Array.isArray(card.tags)) {
                    const tagStore = tx.objectStore(WIKI_TAGS_STORE);
                    card.tags.forEach(tag => {
                        const tagReq = tagStore.get(tag);
                        tagReq.onsuccess = function() {
                            const tagRecord = tagReq.result;
                            if (tagRecord) {
                                tagRecord.cardIds = tagRecord.cardIds.filter(cid => cid !== id);
                                tagRecord.count = tagRecord.cardIds.length;
                                if (tagRecord.count === 0) tagStore.delete(tag);
                                else tagStore.put(tagRecord);
                            }
                        };
                    });
                }
            };
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(new Error('删除 Wiki 卡片失败'));
        });
    }

    async function clearAllWikiCards() {
        const db = await openWikiCardsDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([WIKI_CARDS_STORE, WIKI_TAGS_STORE], 'readwrite');
            tx.objectStore(WIKI_CARDS_STORE).clear();
            tx.objectStore(WIKI_TAGS_STORE).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(new Error('清空 Wiki 卡片库失败'));
        });
    }

    async function clearAllCardEmbeddings() {
        const db = await openWikiCardsDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(WIKI_CARDS_STORE, 'readwrite');
            const store = tx.objectStore(WIKI_CARDS_STORE);
            let cleared = 0;
            store.openCursor().onsuccess = (e) => {
                const cursor = e.target.result;
                if (!cursor) return;
                const card = cursor.value;
                if (card && card.embedding) {
                    delete card.embedding;
                    cursor.update(card);
                    cleared++;
                }
                cursor.continue();
            };
            tx.oncomplete = () => resolve(cleared);
            tx.onerror = () => reject(new Error('清空向量字段失败'));
        });
    }

    function cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dot += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom === 0 ? 0 : dot / denom;
    }

    async function searchByEmbedding(queryVector, topK = 10) {
        const allCards = await getAllWikiCards();
        const scored = allCards
            .filter(card => card.embedding && card.embedding.length > 0)
            .map(card => ({
                card,
                score: cosineSimilarity(queryVector, card.embedding)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
        return scored;
    }

    async function addReadingRecord(record) {
        const db = await openWikiCardsDB();
        const recordToSave = {
            ...record,
            readAt: record.readAt || new Date().toISOString()
        };
        return new Promise((resolve, reject) => {
            const tx = db.transaction(READING_RECORDS_STORE, 'readwrite');
            tx.objectStore(READING_RECORDS_STORE).put(recordToSave);
            tx.oncomplete = () => resolve(recordToSave);
            tx.onerror = () => reject(new Error('保存阅读历史失败'));
        });
    }

    async function updateReadingProgress(url, progress) {
        const db = await openWikiCardsDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(READING_RECORDS_STORE, 'readwrite');
            const store = tx.objectStore(READING_RECORDS_STORE);
            const getReq = store.get(url);
            getReq.onsuccess = () => {
                const existing = getReq.result;
                if (!existing) { resolve(); return; }
                const next = Math.max(0, Math.min(100, Math.round(progress)));
                if (next <= (existing.progress || 0)) { resolve(); return; }
                existing.progress = next;
                store.put(existing);
            };
            getReq.onerror = () => reject(new Error('读取阅读记录失败'));
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(new Error('更新阅读进度失败'));
        });
    }

    async function getAllReadingRecords() {
        const db = await openWikiCardsDB();
        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction(READING_RECORDS_STORE, 'readonly');
                const req = tx.objectStore(READING_RECORDS_STORE).getAll();
                req.onsuccess = () => {
                    try {
                        const results = req.result || [];
                        results.sort((a, b) => {
                            const dateA = a && a.readAt ? String(a.readAt) : '';
                            const dateB = b && b.readAt ? String(b.readAt) : '';
                            return dateB.localeCompare(dateA);
                        });
                        resolve(results);
                    } catch (sortErr) {
                        console.error('排序阅读历史失败:', sortErr);
                        resolve(req.result || []); // 即使排序失败也必须 resolve，绝不能无限期挂起
                    }
                };
                req.onerror = () => reject(new Error('读取阅读历史失败'));
            } catch (err) {
                reject(err);
            }
        });
    }

    async function deleteReadingRecord(url) {
        const db = await openWikiCardsDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(READING_RECORDS_STORE, 'readwrite');
            tx.objectStore(READING_RECORDS_STORE).delete(url);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(new Error('删除阅读历史失败'));
        });
    }

    async function clearAllReadingRecords() {
        const db = await openWikiCardsDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(READING_RECORDS_STORE, 'readwrite');
            tx.objectStore(READING_RECORDS_STORE).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(new Error('清空阅读历史失败'));
        });
    }
