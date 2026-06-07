    /**
     * ============================================================================
     * 翻译 & 摘要核心逻辑
     * ============================================================================
     */
    async function generateSummary(fullText) {
        if (_articleSummary) return _articleSummary;
        const cacheContent = getSummaryCacheContent(fullText);
        const cached = getTranslationCache('summary', cacheContent);
        if (cached) {
            _articleSummary = cached;
            window._articleSummary = _articleSummary;
            return _articleSummary;
        }
        const sys = "你是一个阅读助手。请将文章提炼为100字左右的摘要，主要用于提供上下文。不要有任何多余的客套话。";
        _articleSummary = await callLLMWithRetry(sys, fullText, { retries: 2 });
        setTranslationCache('summary', cacheContent, _articleSummary);
        window._articleSummary = _articleSummary;
        return _articleSummary;
    }

function getActiveTranslationRoot() {
    if (_homeState.view === 'list') {
        alert('请先从首页推荐列表中选择一条内容，再开启翻译。');
        document.body.classList.remove('zh-show-tr');
        window._trVisible = false;
        const translateBtn = document.getElementById('zh-translate-btn');
        if (translateBtn) translateBtn.classList.remove('zh-btn-active');
        return null;
    }

    if (_homeState.view === 'item') {
        return document.querySelector('#immersive-wrapper .zh-home-card-view .RichText.ztext')
            || document.querySelector('#immersive-wrapper .zh-home-card-view .RichText')
            || document.querySelector('#immersive-wrapper .zh-home-card-view .RichContent-inner')
            || document.querySelector('#immersive-wrapper .zh-home-card-view');
    }

    if (_questionState.view === 'list') {
        alert('请先从回答列表中选择一个回答，再开启翻译。');
        document.body.classList.remove('zh-show-tr');
        window._trVisible = false;
        const translateBtn = document.getElementById('zh-translate-btn');
        if (translateBtn) translateBtn.classList.remove('zh-btn-active');
        return null;
    }

    if (_questionState.view === 'answer') {
        return document.querySelector('#immersive-wrapper');
    }

    return document.querySelector('#immersive-wrapper') || document.querySelector('.RichText') || _articleNode;
}

function isTranslatableBlock(node) {
    if (!(node instanceof Element)) return false;
    if (node.closest('.zh-tr-card, .zh-question-toolbar, .zh-home-toolbar, .ContentItem-actions, .Reward, .AuthorInfo, .Popover, button, .zh-collect-status, #zh-tools-panel, #immersive-exit-btn')) return false;
    if (node.querySelector(':scope > .zh-tr-card')) return false;
    const tag = node.tagName;
    if (!/^(H1|H2|H3|H4|P|TABLE|UL|OL|BLOCKQUOTE)$/.test(tag)) return false;
    const text = (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim();
    const minLen = /^H[1-4]$/.test(tag) ? 2 : 5;
    if (text.length < minLen) return false;
    if (/^(上一篇|下一篇|返回|当前第|查看全部回答|再加载)/.test(text)) return false;
    return true;
}

function collectTranslationNodes(root) {
    if (!root) return [];
    const nodes = [];
    if (isTranslatableBlock(root)) nodes.push(root);
    root.querySelectorAll('h1, h2, h3, h4, p, table, ul, ol, blockquote').forEach(node => {
        if (!isTranslatableBlock(node)) return;
        if (nodes.some(parent => parent !== node && parent.contains(node))) return;
        nodes.push(node);
    });
    return nodes;
}

function getNodeCacheContent(node) {
    const tag = node?.tagName || 'NODE';
    const text = normalizeTranslationCacheText(node?.innerText || node?.textContent || '');
    return `${location.hostname}${location.pathname.replace(/\/$/, '')}\n${tag}\n${text}`;
}

function buildTranslationPrompt(node) {
    return `CONTENT_TO_TRANSLATE_ONLY_BEGIN\n${node.outerHTML}\nCONTENT_TO_TRANSLATE_ONLY_END`;
}

function buildTranslationMessages(systemPrompt, node) {
    const messages = [
        { role: 'system', content: systemPrompt }
    ];

    if (_articleSummary) {
        messages.push({
            role: 'user',
            content: `CONTEXT_SUMMARY_FOR_REFERENCE_ONLY_DO_NOT_TRANSLATE:\n${_articleSummary}\nEND_CONTEXT_SUMMARY`
        });
    }

    messages.push({
        role: 'user',
        content: buildTranslationPrompt(node)
    });

    return messages;
}

function cleanTranslationOutput(content) {
    let text = String(content || '').trim();
    text = text
        .replace(/^\s*(【?Previous Summary】?|Previous Summary|CONTEXT_SUMMARY_FOR_REFERENCE_ONLY_DO_NOT_TRANSLATE)\s*[:：]?[\s\S]*?(【?Content to Translate】?|Content to Translate|CONTENT_TO_TRANSLATE_ONLY_BEGIN)\s*[:：]?/i, '')
        .replace(/^\s*(【?待翻译内容】?|待翻译内容|CONTENT_TO_TRANSLATE_ONLY_BEGIN)\s*[:：]?/i, '')
        .replace(/\s*(CONTENT_TO_TRANSLATE_ONLY_END|END_CONTEXT_SUMMARY)\s*$/i, '')
        .trim();
    return text || content;
}

function renderParagraphTranslationCard(card, translation, regenerateHandler) {
    card.innerHTML = sanitizeLLMHTML(translation);
    const actions = document.createElement('div');
    actions.className = 'zh-tr-actions';

    const speakBtn = document.createElement('button');
    speakBtn.type = 'button';
    speakBtn.className = 'zh-tr-regen-btn zh-tr-speak-btn';
    speakBtn.title = '朗读翻译内容';
    speakBtn.setAttribute('aria-label', '朗读翻译');
    speakBtn.innerHTML = ICONS.speak;
    speakBtn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        toggleSpeakTranslation(card, speakBtn);
    });
    actions.appendChild(speakBtn);

    const regenBtn = document.createElement('button');
    regenBtn.type = 'button';
    regenBtn.className = 'zh-tr-regen-btn';
    regenBtn.title = '重新请求 AI 翻译，并覆盖本地翻译缓存';
    regenBtn.setAttribute('aria-label', '重新生成翻译');
    regenBtn.innerHTML = ICONS.regenerate;
    regenBtn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        regenerateHandler?.();
    });
    actions.appendChild(regenBtn);
    card.appendChild(actions);
}

function toggleSpeakTranslation(card, btn) {
    const synth = window.speechSynthesis;
    if (!synth) { alert('当前浏览器不支持语音合成 API'); return; }

    if (synth.speaking) {
        synth.cancel();
        btn.innerHTML = ICONS.speak;
        btn.title = '朗读翻译内容';
        return;
    }

    const text = (card.innerText || card.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = config.targetLang?.includes('英') || config.targetLang?.toLowerCase().includes('en') ? 'en-US' : 'zh-CN';
    utterance.rate = 1;

    btn.innerHTML = ICONS.speakStop;
    btn.title = '停止朗读';

    utterance.onend = () => { btn.innerHTML = ICONS.speak; btn.title = '朗读翻译内容'; };
    utterance.onerror = () => { btn.innerHTML = ICONS.speak; btn.title = '朗读翻译内容'; };

    synth.speak(utterance);
}

async function processTranslation() {
    // 防止重复生成
    if (document.getElementById('zh-tr-summary-card')) return;

    // 摘取全文内容
    const richTextContainer = getActiveTranslationRoot();
    if (!richTextContainer) return;
    const initialNodes = collectTranslationNodes(richTextContainer);
    const fullText = normalizeTranslationCacheText(initialNodes.map(node => node.innerText || node.textContent || '').join('\n\n') || richTextContainer.innerText || '');

    // 1. 优先注入摘要卡片 DOM
    const summaryCard = document.createElement('div');
    summaryCard.id = 'zh-tr-summary-card';
    summaryCard.className = 'zh-tr-card zh-summary-card';
    summaryCard.innerHTML = `<strong>【AI 全文摘要】</strong><br><span id="zh-sum-text"><span class="zh-spinner"></span>正在高强度研读全文并提取摘要...</span>`;
    
    // 兼容性挂载，确保能找到容器
    if (richTextContainer) richTextContainer.prepend(summaryCard);

    // 防御：确保翻译卡片可见（知乎 React 可能在初始渲染时覆盖 body class）
    if (window._trVisible && !document.body.classList.contains('zh-show-tr')) {
        document.body.classList.add('zh-show-tr');
    }

    const timeoutPromise = (promise, ms, errMessage) => {
        let timeoutId;
        const delay = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(errMessage)), ms);
        });
        return Promise.race([
            promise.then(val => { clearTimeout(timeoutId); return val; }),
            delay
        ]);
    };

    try {
        // 2. 【修改】改为阻塞模式，等待摘要生成完成，并加上 15 秒超时守护
        const sumText = await timeoutPromise(generateSummary(fullText), 15000, "AI 摘要生成超时，已自动跳过背景提取以保障流畅度");
        document.getElementById('zh-sum-text').innerText = sumText;
    } catch (e) {
        document.getElementById('zh-sum-text').innerHTML = `<span style="color:var(--zh-accent); font-weight:bold;">${escapeHTML(e.message)}</span>`;
        _articleSummary = '';
        window._articleSummary = '';
    }

    // 3. 【注意】以下代码在摘要生成完成后才执行
    // 再次确保翻译卡片可见（摘要生成期间 body class 可能被外部脚本覆盖）
    if (window._trVisible && !document.body.classList.contains('zh-show-tr')) {
        document.body.classList.add('zh-show-tr');
    }
    const nodes = initialNodes.length ? initialNodes : collectTranslationNodes(richTextContainer);
    const sysTr = `你是一个翻译专家。请翻译到目标语言：【${config.targetLang}】。
只翻译 CONTENT_TO_TRANSLATE_ONLY_BEGIN 和 CONTENT_TO_TRANSLATE_ONLY_END 之间的内容。
CONTEXT_SUMMARY_FOR_REFERENCE_ONLY_DO_NOT_TRANSLATE 只用于理解上下文，绝对不能翻译、复述、输出或改写。
输出中不得出现 Previous Summary、Content to Translate、CONTEXT_SUMMARY、CONTENT_TO_TRANSLATE 等边界标题。
如果是表格则输出完整HTML表格结构；遇到公式块、代码块请原文保留，不可随意篡改。输出纯内容，不要markdown格式的标记。`;

    // 4. 并发处理所有节点（保持全并发，不加await）
    Array.from(nodes).forEach((node, i) => {
        const cacheContent = getNodeCacheContent(node);
        const cachedTranslation = getTranslationCache('block', cacheContent);
        let currentTranslation = cachedTranslation || '';

        const trCard = document.createElement('div');
        trCard.className = 'zh-tr-card zh-para-tr';
        trCard.dataset.zhTrFor = stableHash(cacheContent);
        node.after(trCard);

        const requestAndRender = (isRegenerate = false) => {
            trCard.innerHTML = `<span class="zh-spinner"></span><span style="opacity:0.8;">${isRegenerate ? '正在重新生成翻译...' : '正在请求 AI 接口研读...'}</span>`;
            callLLMMessagesWithRetry(buildTranslationMessages(sysTr, node), { retries: 2 })
                .then(content => {
                    const cleaned = cleanTranslationOutput(content);
                    currentTranslation = cleaned;
                    setTranslationCache('block', cacheContent, cleaned);
                    renderParagraphTranslationCard(trCard, cleaned, () => requestAndRender(true));
                })
                .catch(err => {
                    if (currentTranslation) {
                        renderParagraphTranslationCard(trCard, currentTranslation, () => requestAndRender(true));
                        const errLine = document.createElement('div');
                        errLine.style.cssText = 'margin-top:8px; color:#b33; font-size:13px;';
                        errLine.textContent = `重新生成失败：${err.message}`;
                        trCard.appendChild(errLine);
                    } else {
                        trCard.innerHTML = `<span style="color:red">请求失败: ${err.message}</span><div style="margin-top:8px;"><button class="zh-tr-retry-btn" style="cursor:pointer; border:1px solid var(--zh-border); border-radius:4px; padding:4px 10px; background:transparent; color:var(--zh-accent);">重试</button></div>`;
                        trCard.querySelector('.zh-tr-retry-btn')?.addEventListener('click', () => requestAndRender(false));
                    }
                });
        };

        if (cachedTranslation) {
            renderParagraphTranslationCard(trCard, cachedTranslation, () => requestAndRender(true));
            return;
        }

        if (config.autoTr) {
            // 【全并发核心】直接发起 messages harness，不用 await！
            trCard.innerHTML = `<span class="zh-spinner"></span><span style="opacity:0.6;">解析队列中...</span>`;
            requestAndRender(false);

        } else {
            // 手动点击模式
            const btnId = 'zh-tr-btn-' + i;
            trCard.innerHTML = `<span id="${btnId}" style="opacity:0.8; cursor:pointer; color: var(--zh-accent); display:flex; align-items:center;">▶ 点击请求 AI 翻译此段</span>`;

            setTimeout(() => {
                const triggerBtn = document.getElementById(btnId);
                if(triggerBtn) {
                    triggerBtn.addEventListener('click', () => {
                        requestAndRender(false);
                    });
                }
            }, 0);
        }
    });
}