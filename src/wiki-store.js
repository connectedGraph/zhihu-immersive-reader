    // ═══════════════════════════════════════════════════════════
    // Wiki Cards IndexedDB 存储
    // ═══════════════════════════════════════════════════════════

    const WIKI_CARDS_DB_NAME = 'zh-wiki-cards-db';
    const WIKI_CARDS_DB_VERSION = 1;
    const WIKI_CARDS_STORE = 'cards';
    const WIKI_TAGS_STORE = 'tags';

    let _wikiCardsDbInstance = null;

    function openWikiCardsDB() {
        if (_wikiCardsDbInstance) return Promise.resolve(_wikiCardsDbInstance);
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(WIKI_CARDS_DB_NAME, WIKI_CARDS_DB_VERSION);
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
            };
            request.onsuccess = function(event) {
                _wikiCardsDbInstance = event.target.result;
                resolve(_wikiCardsDbInstance);
            };
            request.onerror = function(event) {
                reject(new Error('Wiki IndexedDB 打开失败: ' + (event.target.error?.message || '未知错误')));
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
            const tx = db.transaction(WIKI_CARDS_STORE, 'readonly');
            const request = tx.objectStore(WIKI_CARDS_STORE).getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(new Error('读取 Wiki 卡片失败'));
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
