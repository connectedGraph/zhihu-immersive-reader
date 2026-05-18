    async function callLLMMessages(messages, customKey = null, customHost = null, customModel = null) {
        const keyToUse = customKey || config.apiKey;
        const hostToUse = customHost || config.apiHost;
        const modelToUse = customModel || config.apiModel;

        if (!keyToUse) throw new Error("API Key 未配置！");
        const url = hostToUse.endsWith('/') ? hostToUse + 'chat/completions' : hostToUse + '/chat/completions';

        const payload = JSON.stringify({
            model: modelToUse,
            messages
        });

        if (typeof GM_xmlhttpRequest !== 'undefined') {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: url,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${keyToUse}`
                    },
                    data: payload,
                    timeout: 120000,
                    onload: function(res) {
                        if (res.status >= 200 && res.status < 300) {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (!data.choices || !data.choices[0]) throw new Error("API 响应格式异常");
                                resolve(data.choices[0].message.content.trim());
                            } catch (e) {
                                reject(new Error("API 数据解析失败: " + e.message));
                            }
                        } else {
                            let errMsg = `HTTP ${res.status}: `;
                            try {
                                const errData = JSON.parse(res.responseText);
                                errMsg += (errData.error?.message || res.statusText);
                            } catch(e) {
                                errMsg += res.statusText;
                            }
                            reject(new Error(errMsg));
                        }
                    },
                    onerror: function(err) {
                        reject(new Error("网络或跨域请求失败，请检查网络或 Host 地址"));
                    },
                    ontimeout: function() {
                        reject(new Error("请求超时"));
                    }
                });
            });
        } else {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${keyToUse}` },
                body: payload
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`HTTP ${res.status}: ${errText.substring(0, 300)}`);
            }
            const data = await res.json();
            return data.choices[0].message.content.trim();
        }
    }

    async function callLLM(systemPrompt, userPrompt, customKey = null, customHost = null, customModel = null) {
        return callLLMMessages([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ], customKey, customHost, customModel);
    }

    function isRetryableLLMError(err) {
        const message = String(err?.message || '');
        return /HTTP (429|500|502|503|504)|rate|too many|timeout|超时|网络|network/i.test(message);
    }

    function isContextTooLongError(err) {
        const message = String(err?.message || '');
        return /context|token|length|maximum|max|too large|上下文|长度|过长|超限/i.test(message);
    }

    async function callLLMMessagesWithRetry(messages, options = {}) {
        const retries = Number.isFinite(options.retries) ? options.retries : 2;
        let lastErr = null;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await callLLMMessages(messages, options.apiKey || null, options.apiHost || null, options.apiModel || null);
            } catch (err) {
                lastErr = err;
                if (!isRetryableLLMError(err) || attempt >= retries) break;
                await sleep(800 * (attempt + 1));
            }
        }
        throw lastErr;
    }

    async function callLLMWithRetry(systemPrompt, userPrompt, options = {}) {
        const retries = Number.isFinite(options.retries) ? options.retries : 2;
        let lastErr = null;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                if (options.apiKey || options.apiHost || options.apiModel) {
                    return await callLLMMessages([
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ], options.apiKey, options.apiHost, options.apiModel);
                }
                return await callLLM(systemPrompt, userPrompt);
            } catch (err) {
                lastErr = err;
                if (!isRetryableLLMError(err) || attempt >= retries) break;
                await sleep(800 * (attempt + 1));
            }
        }
        throw lastErr;
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

    async function callEmbeddingAPI(texts) {
        const hostToUse = (config.embeddingHost || config.apiHost || '').trim();
        const keyToUse = (config.embeddingKey || config.apiKey || '').trim();
        const modelToUse = (config.embeddingModel || 'text-embedding-3-small').trim();

        if (!keyToUse) throw new Error('Embedding API Key 未配置');
        if (!hostToUse) throw new Error('Embedding API Host 未配置');

        const url = hostToUse.endsWith('/') ? hostToUse + 'embeddings' : hostToUse + '/embeddings';
        const input = Array.isArray(texts) ? texts : [texts];
        const payload = JSON.stringify({ model: modelToUse, input });

        if (typeof GM_xmlhttpRequest !== 'undefined') {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: url,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${keyToUse}`
                    },
                    data: payload,
                    timeout: 60000,
                    onload: function(res) {
                        if (res.status >= 200 && res.status < 300) {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (!data.data || !Array.isArray(data.data)) throw new Error('Embedding 响应格式异常');
                                const embeddings = data.data
                                    .sort((a, b) => a.index - b.index)
                                    .map(item => item.embedding);
                                resolve(embeddings);
                            } catch (e) {
                                reject(new Error('Embedding 数据解析失败: ' + e.message));
                            }
                        } else {
                            let errMsg = `HTTP ${res.status}: `;
                            try {
                                const errData = JSON.parse(res.responseText);
                                errMsg += (errData.error?.message || res.statusText);
                            } catch(e) {
                                errMsg += res.statusText;
                            }
                            reject(new Error(errMsg));
                        }
                    },
                    onerror: function() {
                        reject(new Error('Embedding 网络请求失败'));
                    },
                    ontimeout: function() {
                        reject(new Error('Embedding 请求超时'));
                    }
                });
            });
        } else {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${keyToUse}` },
                body: payload
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Embedding HTTP ${res.status}: ${errText.substring(0, 300)}`);
            }
            const data = await res.json();
            if (!data.data || !Array.isArray(data.data)) throw new Error('Embedding 响应格式异常');
            return data.data.sort((a, b) => a.index - b.index).map(item => item.embedding);
        }
    }
