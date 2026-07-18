    const THEME_STORAGE_KEY = 'zh-immersive-theme-index';

    // 启动时把用户自定义主题追加进 THEMES（mutate，不重新赋值 const）
    function loadCustomThemes() {
        try {
            const raw = crossOriginGet(CUSTOM_THEMES_KEY);
            const list = raw ? JSON.parse(raw) : [];
            if (Array.isArray(list)) {
                list.forEach(t => {
                    if (t && t.name && t.vars && !THEMES.some(x => x.name === t.name)) THEMES.push(t);
                });
            }
        } catch (e) {}
    }
    loadCustomThemes();

    function saveCustomThemes() {
        const custom = THEMES.filter(t => t.custom);
        try { crossOriginSet(CUSTOM_THEMES_KEY, JSON.stringify(custom)); } catch (e) {}
    }

    function addCustomTheme(name, vars) {
        const theme = { name, vars, custom: true };
        THEMES.push(theme);
        saveCustomThemes();
        return THEMES.length - 1;
    }

    // 容错解析主题对象：先严格 JSON，失败再把单引号/无引号 key normalize 后重试
    function parseThemeJSON(raw) {
        const text = String(raw).trim().replace(/;$/, '');
        try { return JSON.parse(text); } catch (e) {}
        try {
            const normalized = text
                .replace(/'/g, '"')
                .replace(/([{,]\s*)([A-Za-z_$][\w$-]*)\s*:/g, '$1"$2":')
                .replace(/,\s*([}\]])/g, '$1');
            return JSON.parse(normalized);
        } catch (e) { return null; }
    }

    function removeCustomTheme(name) {
        const idx = THEMES.findIndex(t => t.custom && t.name === name);        if (idx < 0) return;
        THEMES.splice(idx, 1);
        saveCustomThemes();
        if (currentThemeIndex >= THEMES.length) applyTheme(0);
    }

    let currentThemeIndex = (() => {
        try {
            if (typeof GM_getValue === 'function') {
                const gm = GM_getValue(THEME_STORAGE_KEY, null);
                if (gm !== null) { const idx = parseInt(gm, 10); if (idx >= 0 && idx < THEMES.length) return idx; }
            }
            const saved = localStorage.getItem(THEME_STORAGE_KEY);
            const idx = saved !== null ? parseInt(saved, 10) : 0;
            return (idx >= 0 && idx < THEMES.length) ? idx : 0;
        } catch (e) { return 0; }
    })();
    function applyTheme(index) {
        const safeIndex = (index >= 0 && index < THEMES.length) ? index : 0;
        currentThemeIndex = safeIndex;
        const theme = THEMES[safeIndex];
        const root = document.documentElement;
        for (let key in theme.vars) root.style.setProperty(key, theme.vars[key], 'important');
        try { localStorage.setItem(THEME_STORAGE_KEY, String(safeIndex)); } catch (e) {}
        try { if (typeof GM_setValue === 'function') GM_setValue(THEME_STORAGE_KEY, String(safeIndex)); } catch (e) {}
        applyReadingFont(config).catch(err => console.warn('知乎沉浸式阅读：字体加载失败', err));
    }

    let _activeCustomFontFace = null;
    let _loadedCustomFontKey = '';
    let _fontApplyRequestId = 0;

    function getFontPreset(id) {
        return FONT_PRESETS.find(item => item.id === id) || FONT_PRESETS[0];
    }

    function getStoredCustomFont() {
        try {
            const raw = crossOriginGet(CUSTOM_FONT_STORAGE_KEY);
            if (!raw) return null;
            const record = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return record && record.dataUrl ? record : null;
        } catch (e) {
            return null;
        }
    }

    function persistCustomFont(record) {
        crossOriginSet(CUSTOM_FONT_STORAGE_KEY, JSON.stringify(record));
        const stored = getStoredCustomFont();
        if (!stored || stored.name !== record.name || stored.size !== record.size || stored.lastModified !== record.lastModified || stored.dataUrl?.length !== record.dataUrl.length) {
            throw new Error('字体文件未能写入扩展存储，请改用体积更小的 WOFF2 文件');
        }
    }

    function dataUrlToArrayBuffer(dataUrl) {
        const comma = String(dataUrl || '').indexOf(',');
        if (comma < 0) throw new Error('字体文件数据不完整');
        const bytes = atob(String(dataUrl).slice(comma + 1));
        const buffer = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
        return buffer.buffer;
    }

    function readFontFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
                name: file.name,
                type: file.type || '',
                size: file.size,
                lastModified: file.lastModified || 0,
                dataUrl: String(reader.result || '')
            });
            reader.onerror = () => reject(new Error('无法读取字体文件'));
            reader.readAsDataURL(file);
        });
    }

    function requestFontArrayBuffer(url) {
        const parsed = new URL(url, location.href);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('字体地址仅支持 HTTP 或 HTTPS');
        const gmRequest = typeof GM_xmlhttpRequest === 'function'
            ? GM_xmlhttpRequest
            : (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function' ? GM.xmlHttpRequest.bind(GM) : null);
        if (!gmRequest) {
            return fetch(parsed.href).then(response => {
                if (!response.ok) throw new Error(`字体下载失败（HTTP ${response.status}）`);
                return response.arrayBuffer();
            });
        }
        return new Promise((resolve, reject) => {
            gmRequest({
                method: 'GET',
                url: parsed.href,
                responseType: 'arraybuffer',
                timeout: 30000,
                onload: response => {
                    if (response.status && (response.status < 200 || response.status >= 300)) {
                        reject(new Error(`字体下载失败（HTTP ${response.status}）`));
                        return;
                    }
                    if (!response.response) {
                        reject(new Error('字体地址没有返回文件数据'));
                        return;
                    }
                    resolve(response.response);
                },
                ontimeout: () => reject(new Error('字体下载超时')),
                onerror: () => reject(new Error('字体下载失败，请检查直链是否可访问'))
            });
        });
    }

    async function applyReadingFont(settings = config, options = {}) {
        const requestId = ++_fontApplyRequestId;
        const preset = getFontPreset(settings.fontPreset);
        const root = document.documentElement;
        root.style.setProperty('--zh-reader-font', preset.stack, 'important');

        const source = ['url', 'file'].includes(settings.customFontSource) ? settings.customFontSource : 'none';
        if (source === 'none') return { custom: false, name: preset.name };

        let fontData;
        let fontKey;
        let fontName = settings.customFontName || '自定义字体';
        if (source === 'url') {
            const url = String(settings.customFontUrl || '').trim();
            if (!url) throw new Error('请填写字体文件直链');
            const parsed = new URL(url, location.href);
            if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('字体地址仅支持 HTTP 或 HTTPS');
            fontKey = `url:${parsed.href}`;
            try { fontName = decodeURIComponent(parsed.pathname.split('/').pop()) || fontName; } catch (e) {}
            if (_loadedCustomFontKey !== fontKey) fontData = await requestFontArrayBuffer(parsed.href);
        } else {
            const record = options.customFontRecord || getStoredCustomFont();
            if (!record?.dataUrl) throw new Error('请先选择本地字体文件');
            fontKey = `file:${record.name || ''}:${record.size || record.dataUrl.length}:${record.lastModified || 0}`;
            fontName = record.name || fontName;
            if (_loadedCustomFontKey !== fontKey) fontData = dataUrlToArrayBuffer(record.dataUrl);
        }

        if (requestId !== _fontApplyRequestId) return { custom: false, name: fontName, stale: true };
        if (_loadedCustomFontKey !== fontKey) {
            const fontFace = new FontFace('ZhImmersiveCustomFont', fontData);
            await fontFace.load();
            if (requestId !== _fontApplyRequestId) return { custom: false, name: fontName, stale: true };
            if (_activeCustomFontFace) document.fonts.delete(_activeCustomFontFace);
            document.fonts.add(fontFace);
            _activeCustomFontFace = fontFace;
            _loadedCustomFontKey = fontKey;
        }
        root.style.setProperty('--zh-reader-font', `'ZhImmersiveCustomFont', ${preset.stack}`, 'important');
        return { custom: true, name: fontName };
    }

    function sanitizeLLMHTML(content) {
        const template = document.createElement('template');
        template.innerHTML = String(content || '');

        const allowedTags = new Set([
            'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD', 'CAPTION', 'COLGROUP', 'COL',
            'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'CODE', 'PRE', 'BLOCKQUOTE',
            'UL', 'OL', 'LI', 'SPAN', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SUP', 'SUB',
            'MATH', 'SEMANTICS', 'MROW', 'MI', 'MO', 'MN', 'MSUP', 'MSUB', 'MFRAC', 'MSQRT',
            'MOVER', 'MUNDER', 'MUNDEROVER', 'MTABLE', 'MTR', 'MTD', 'MTEXT', 'MSPACE', 'ANNOTATION'
        ]);
        const allowedAttrs = new Set(['colspan', 'rowspan', 'scope', 'align', 'class', 'data-tex', 'encoding']);
        const allowedClasses = /^(ztext-math|math|katex|MathJax)/;
        const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
        const unsafeNodes = [];

        while (walker.nextNode()) {
            const el = walker.currentNode;
            if (!allowedTags.has(el.tagName)) {
                unsafeNodes.push(el);
                continue;
            }

            Array.from(el.attributes).forEach(attr => {
                const name = attr.name.toLowerCase();
                if (name.startsWith('on') || name === 'style' || !allowedAttrs.has(name)) {
                    el.removeAttribute(attr.name);
                }
            });
            if (el.hasAttribute('class')) {
                const classes = el.getAttribute('class').split(/\s+/).filter(c => allowedClasses.test(c));
                if (classes.length) el.setAttribute('class', classes.join(' '));
                else el.removeAttribute('class');
            }
        }

        unsafeNodes.forEach(el => el.replaceWith(document.createTextNode(el.textContent || '')));
        return template.innerHTML;
    }

    function triggerMathJaxTypeset(el) {
        if (window.MathJax) {
            if (MathJax.typesetPromise) MathJax.typesetPromise([el]).catch(() => {});
            else if (MathJax.Hub) MathJax.Hub.Queue(['Typeset', MathJax.Hub, el]);
        }
    }

    function getImagePlaceholder(img) {
        const next = img.nextElementSibling;
        return next && next.classList.contains('zh-img-placeholder') ? next : null;
    }

    function isImageToggleExcluded(img) {
        const classText = String(img.className || '');
        if (img.classList.contains('Avatar') || /(^|\s|-)avatar(\s|-|$)/i.test(classText)) return true;
        return !!img.closest([
            '.Post-Header',
            '.css-34mzkj',
            '.AuthorInfo',
            '.ContentItem-meta',
            '.AnswerItem-authorInfo',
            '.AuthorInfo-avatarWrapper',
            '.UserLink',
            '.Avatar',
            '[class*="Avatar"]',
            '[class*="avatar"]',
            '.zh-answer-list-meta',
            '.zh-home-card-meta',
            '.zh-moment-action',
            '.zh-home-api-item .AuthorInfo',
            '.Reward',
            '.ContentItem-actions',
            '.zh-home-list',
            '.zh-question-list'
        ].join(', '));
    }

    function clearImageToggle(img) {
        const placeholder = getImagePlaceholder(img);
        if (placeholder) placeholder.remove();
        img.classList.remove('zh-img-hidden');
        delete img.dataset.zhImgHidden;
    }

    function setImageHidden(img, hidden) {
        if (hidden && isImageToggleExcluded(img)) {
            clearImageToggle(img);
            return;
        }
        const placeholder = getImagePlaceholder(img);
        img.classList.toggle('zh-img-hidden', hidden);
        img.dataset.zhImgHidden = hidden ? '1' : '0';
        if (placeholder) placeholder.style.display = hidden ? 'flex' : 'none';
    }

    function setupImageToggles() {
        document.querySelectorAll('#immersive-wrapper img').forEach(img => {
            const realSrc = img.getAttribute('data-original') || img.getAttribute('data-actualsrc');
            if (realSrc) img.src = realSrc;

            if (isImageToggleExcluded(img)) {
                clearImageToggle(img);
                return;
            }

            let placeholder = getImagePlaceholder(img);
            if (!placeholder) {
                placeholder = document.createElement('div');
                placeholder.className = 'zh-img-placeholder';
                placeholder.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span>查看图片</span>';
                img.insertAdjacentElement('afterend', placeholder);
            }

            placeholder.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (config.imageMode === 'collapse') {
                    setImageHidden(img, false);
                } else {
                    showImagePreview(img.src || realSrc);
                }
            };

            if (!img.dataset.zhImageToggleReady) {
                img.addEventListener('click', (event) => {
                    if (!window._isImmersive || img.classList.contains('zh-img-hidden') || isImageToggleExcluded(img)) return;
                    event.preventDefault();
                    event.stopPropagation();
                    if (config.imageMode === 'collapse') {
                        setImageHidden(img, true);
                    } else {
                        showImagePreview(img.src || realSrc);
                    }
                });
                img.dataset.zhImageToggleReady = '1';
            }

            setImageHidden(img, !!config.autoHideImages);
        });
    }

    function showImagePreview(src) {
        if (!src) return;
        const overlay = document.createElement('div');
        overlay.className = 'zh-img-preview-overlay';
        overlay.innerHTML = `<img src="${src}" class="zh-img-preview-img">`;
        overlay.addEventListener('click', () => overlay.remove());
        document.body.appendChild(overlay);
    }

    function resetImageToggles() {
        document.querySelectorAll('.zh-img-placeholder').forEach(placeholder => placeholder.remove());
        document.querySelectorAll('img.zh-img-hidden').forEach(img => {
            img.classList.remove('zh-img-hidden');
            delete img.dataset.zhImgHidden;
        });
    }

    /**
     * ============================================================================
     * 模态框 / UI 构建函数 (使用常量区的HTML模板)
     * ============================================================================
     */
    function createModal(id, title, innerHTML, onClose) {
        const overlay = document.createElement('div');
        overlay.id = id;
        overlay.className = 'zh-modal-overlay';
        overlay.innerHTML = `
            <div class="zh-modal">
                <div class="zh-modal-header">
                    <span>${title}</span>
                    <button class="zh-modal-close" id="${id}-close-btn" type="button" aria-label="关闭" title="关闭">×</button>
                </div>
                <div class="zh-modal-body">${innerHTML}</div>
            </div>
        `;
        document.body.appendChild(overlay);

        const closeWithAnim = () => {
            overlay.classList.add('zh-modal-closing');
            setTimeout(() => {
                if (onClose) onClose();
                else overlay.remove();
            }, 200);
        };

        document.getElementById(`${id}-close-btn`).addEventListener('click', closeWithAnim);
        
        // 点击遮罩背景也可以关闭模态窗
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeWithAnim();
            }
        });

        return overlay;
    }

    //

function S2translate(id, title, innerHTML) {
    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = 'zh-modal-overlay';
    
    // 1. 布局调整：推到左下角，并修复溢出问题
    overlay.style.alignItems = 'flex-end';       // 垂直方向靠底
    overlay.style.justifyContent = 'flex-start'; // 水平方向靠左
    overlay.style.padding = '24px';              // 距离左下角留出 24px 的安全边距
    // ⚠️ 关键修复：强行改变盒模型，防止 padding 撑爆 100% 的 height，导致模态框被挤出屏幕
    overlay.style.boxSizing = 'border-box';      

    // 2. 结构优化：限制最大高度，内容超长时内部滚动
    overlay.innerHTML = `
        <div class="zh-modal" style="margin: 0; max-height: 100%; display: flex; flex-direction: column;">
            <div class="zh-modal-header" style="flex-shrink: 0; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.1);">
                <span style="font-weight: bold;">${title}</span>
                <button class="zh-modal-close" id="${id}-close-btn" style="background: transparent; border: none; font-size: 20px; cursor: pointer;">×</button>
            </div>
            <div class="zh-modal-body" style="padding: 15px; overflow-y: auto; flex-grow: 1;">
                ${innerHTML}
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // 3. 点击 ❌ 按钮关闭
    document.getElementById(`${id}-close-btn`).addEventListener('click', () => {
        overlay.remove();
    });

    // 4. 点击遮罩层关闭 (Click Outside to Close)
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            overlay.remove();
        }
    });

    return overlay;
}

    function readApiSettingsFromForm() {
        return {
            apiHost: (document.getElementById('zh-cfg-host')?.value || '').trim(),
            apiKey: (document.getElementById('zh-cfg-key')?.value || '').trim(),
            apiModel: (document.getElementById('zh-cfg-model')?.value || '').trim()
        };
    }

    function readSettingsFromForm() {
        const shareFormat = document.getElementById('zh-cfg-share-format')?.value || 'svg';
        const imageMode = document.getElementById('zh-cfg-image-mode')?.value || 'preview';
        const fontPreset = document.querySelector('input[name="zh-font-preset"]:checked')?.value || 'classic-serif';
        const customFontSource = document.querySelector('input[name="zh-custom-font-source"]:checked')?.value || 'none';
        const homeFeedMode = document.querySelector('input[name="zh-home-feed-mode"]:checked')?.value || 'scroll';
        const fontFileInput = document.getElementById('zh-cfg-font-file');
        const translationPrompts = Array.from(document.querySelectorAll('#zh-translation-prompt-list .zh-translation-prompt-row'))
            .map((row, index) => ({
                id: row.dataset.promptId || `translation-prompt-${index + 1}`,
                name: (row.querySelector('.zh-translation-prompt-name')?.value || '').trim(),
                prompt: (row.querySelector('.zh-translation-prompt-text')?.value || '').trim(),
                enabled: !!row.querySelector('.zh-translation-prompt-check')?.checked
            }))
            .filter(item => item.prompt)
            .map((item, index) => ({
                ...item,
                name: item.name || `Prompt ${index + 1}`
            }));
        return {
            ...readApiSettingsFromForm(),
            targetLang: document.getElementById('zh-cfg-lang').value,
            radarInterestTags: (document.getElementById('zh-cfg-radar-tags')?.value || '').trim(),
            autoSum: document.getElementById('zh-cfg-autosum').checked,
            autoTr: document.getElementById('zh-cfg-autotr').checked,
            autoHideImages: document.getElementById('zh-cfg-auto-hide-images').checked,
            imageMode: imageMode === 'collapse' ? 'collapse' : 'preview',
            shareExportFormat: ['html', 'svg', 'png', 'webp'].includes(shareFormat) ? shareFormat : 'svg',
            answerPreviewMode: document.getElementById('zh-cfg-answer-preview').value,
            embeddingHost: (document.getElementById('zh-cfg-embedding-host')?.value || '').trim(),
            embeddingModel: (document.getElementById('zh-cfg-embedding-model')?.value || '').trim() || 'text-embedding-3-small',
            embeddingKey: (document.getElementById('zh-cfg-embedding-key')?.value || '').trim(),
            defaultCollectionId: (document.getElementById('zh-cfg-collection-id')?.value || '').trim(),
            fontPreset: FONT_PRESETS.some(item => item.id === fontPreset) ? fontPreset : 'classic-serif',
            customFontSource: ['url', 'file'].includes(customFontSource) ? customFontSource : 'none',
            customFontUrl: (document.getElementById('zh-cfg-font-url')?.value || '').trim(),
            customFontName: fontFileInput?.dataset.fontName || config.customFontName || '',
            homeFeedMode: homeFeedMode === 'scroll' ? 'scroll' : 'paged',
            translationPrompts: normalizeTranslationPromptLibrary(translationPrompts),
            translationContextParagraphs: Math.max(0, Math.min(3, Number(document.getElementById('zh-cfg-translation-context')?.value) || 0))
        };
    }

    function showPromptPreviewModal() {
        if (document.getElementById('zh-prompts-modal')) return;
        const content = [
            '【学习卡片系统提示词】',
            getWikiLearningCardSystemPrompt(),
            '',
            '【总览系统提示词】',
            getWikiSynthesisSystemPrompt(),
            '',
            '【阅读笔记系统提示词】',
            getRadarReportSystemPrompt(),
            '',
            '【翻译摘要提示词】',
            '你是一个阅读助手。请将文章提炼为100字左右的摘要，主要用于提供上下文。不要有任何多余的客套话。',
            '',
            '【段落翻译提示词库】',
            getTranslationPromptLibrary().map((item, index) => `${index + 1}. ${item.name} [${item.enabled !== false ? 'enabled' : 'disabled'}]\n${item.prompt.replace(/\{\{targetLang\}\}/g, config.targetLang || 'English')}`).join('\n\n')
        ].join('\n\n');
        createModal('zh-prompts-modal', '当前系统提示词预览', `<pre style="white-space:pre-wrap;word-break:break-word;background:var(--zh-code);border:1px solid var(--zh-border);border-radius:4px;padding:12px;max-height:60vh;overflow:auto;">${escapeHTML(content)}</pre>`);
    }

    function showSettingsModal() {
        if(document.getElementById('zh-settings-modal')) return;

        let pendingFontRecord = null;
        let pendingFontToken = '';
        const getFormSnapshot = () => JSON.stringify({ settings: readSettingsFromForm(), pendingFontToken });
        let initialSnapshot = '';

        function closeSettingsModal() {
            applyReadingFont(config).catch(err => console.warn('知乎沉浸式阅读：恢复字体失败', err));
            document.getElementById('zh-settings-modal')?.remove();
        }

        async function commitSettingsSave(onDone) {
            const next = readSettingsFromForm();
            if (!next.translationPrompts.length) {
                showToast('至少保留一条有效翻译提示词');
                activateSettingsSection('reading');
                return;
            }
            const saveButton = document.getElementById('zh-save-settings-btn');
            const saveStatus = document.getElementById('zh-settings-save-status');
            if (saveButton) saveButton.disabled = true;
            if (saveStatus) saveStatus.textContent = '正在验证并应用设置...';
            const prevModel = (config.embeddingModel || '').trim();
            const nextModel = (next.embeddingModel || '').trim();
            try {
                const fontResult = await applyReadingFont(next, { customFontRecord: pendingFontRecord });
                if (fontResult.stale) throw new Error('字体选择在保存过程中发生变化，请重新保存');
                if (fontResult.custom) next.customFontName = fontResult.name;
                if (next.customFontSource === 'file' && pendingFontRecord) persistCustomFont(pendingFontRecord);
                if (nextModel && prevModel && nextModel !== prevModel) {
                    let hasEmbeddings = false;
                    try {
                        hasEmbeddings = (await getAllWikiCards()).some(c => c.embedding && c.embedding.length);
                    } catch (e) {}
                    if (hasEmbeddings) {
                        const ok = window.confirm(`检测到 Embedding 模型从「${prevModel}」改为「${nextModel}」。\n\n不同模型生成的向量互不兼容，旧向量将无法用于语义搜索。\n\n点「确定」：清空全部已有向量（卡片正文保留），之后可重新跑 Embedding；\n点「取消」：保留旧向量，本次不更换模型。`);
                        if (!ok) {
                            next.embeddingModel = prevModel;
                        } else {
                            const cleared = await clearAllCardEmbeddings();
                            showToast(`已清空 ${cleared} 条旧向量`);
                        }
                    }
                }
                saveConfig(next);
                if (window._isImmersive) setupImageToggles();
                if (window._isImmersive && isHomePage() && _homeState.view === 'list') renderHomeList({ preserveScroll: true });
                if (window._isImmersive && isFollowPage() && _followState.view === 'list') renderFollowList({ preserveScroll: true });
                onDone?.();
                showToast('设置已保存');
            } catch (e) {
                const message = e?.message || String(e);
                if (saveStatus) saveStatus.textContent = `无法保存：${message}`;
                showToast(`设置未保存：${message}`);
                activateSettingsSection('appearance');
            } finally {
                if (saveButton?.isConnected) saveButton.disabled = false;
            }
        }

        function tryClose() {
            if (initialSnapshot && getFormSnapshot() !== initialSnapshot) {
                showConfirm('设置有未保存的改动，是否保存？', () => {
                    commitSettingsSave(closeSettingsModal);
                }, closeSettingsModal);
            } else {
                closeSettingsModal();
            }
        }

        createModal('zh-settings-modal', '设置', SETTINGS_MODAL_HTML(config), tryClose);
        const settingsModal = document.getElementById('zh-settings-modal');
        const fontFileInput = document.getElementById('zh-cfg-font-file');
        if (fontFileInput) fontFileInput.dataset.fontName = config.customFontName || '';

        function activateSettingsSection(sectionName) {
            settingsModal.querySelectorAll('.zh-settings-nav-btn').forEach(button => {
                button.classList.toggle('is-active', button.dataset.section === sectionName);
            });
            settingsModal.querySelectorAll('.zh-settings-section').forEach(section => {
                const active = section.dataset.section === sectionName;
                section.hidden = !active;
                section.classList.toggle('is-active', active);
            });
            const scroll = settingsModal.querySelector('.zh-settings-scroll');
            if (scroll) scroll.scrollTop = 0;
        }

        settingsModal.querySelectorAll('.zh-settings-nav-btn').forEach(button => {
            button.addEventListener('click', () => activateSettingsSection(button.dataset.section));
        });
        document.getElementById('zh-cancel-settings-btn').addEventListener('click', tryClose);
        function updateSettingsDirtyStatus() {
            const status = document.getElementById('zh-settings-save-status');
            if (status && initialSnapshot) status.textContent = getFormSnapshot() === initialSnapshot ? '没有未保存的修改' : '有未保存的修改';
        }
        settingsModal.addEventListener('input', updateSettingsDirtyStatus);
        requestAnimationFrame(() => { initialSnapshot = getFormSnapshot(); });

        function setFontStatus(message, error = false) {
            const status = document.getElementById('zh-font-load-status');
            if (!status) return;
            status.textContent = message;
            status.style.color = error ? '#b42318' : 'var(--zh-text)';
            status.style.opacity = error ? '1' : '.68';
        }

        function syncFontSourcePanels() {
            const source = document.querySelector('input[name="zh-custom-font-source"]:checked')?.value || 'none';
            settingsModal.querySelectorAll('.zh-custom-font-panel').forEach(panel => {
                panel.hidden = panel.dataset.fontSource !== source;
            });
        }

        async function previewCurrentFont() {
            try {
                setFontStatus('正在加载字体...');
                const result = await applyReadingFont(readSettingsFromForm(), { customFontRecord: pendingFontRecord });
                setFontStatus(result.custom ? `已加载：${result.name}` : `已预览：${result.name}`);
            } catch (e) {
                setFontStatus(e?.message || String(e), true);
            }
        }

        settingsModal.querySelectorAll('input[name="zh-font-preset"]').forEach(input => {
            input.addEventListener('change', () => {
                settingsModal.querySelectorAll('.zh-font-preset').forEach(label => {
                    label.classList.toggle('is-selected', label.contains(input) && input.checked);
                });
                previewCurrentFont();
            });
        });
        settingsModal.querySelectorAll('input[name="zh-custom-font-source"]').forEach(input => {
            input.addEventListener('change', () => {
                syncFontSourcePanels();
                if (input.checked && input.value !== 'url') previewCurrentFont();
            });
        });
        syncFontSourcePanels();

        function refreshTranslationPromptRows() {
            settingsModal.querySelectorAll('.zh-translation-prompt-row').forEach((row, index) => {
                row.dataset.promptIndex = String(index);
                if (!row.dataset.promptId) row.dataset.promptId = `translation-prompt-${index + 1}`;
                const deleteButton = row.querySelector('.zh-translation-prompt-delete');
                if (deleteButton && !deleteButton.dataset.bound) {
                    deleteButton.dataset.bound = '1';
                    deleteButton.addEventListener('click', () => {
                        const rows = settingsModal.querySelectorAll('.zh-translation-prompt-row');
                        if (rows.length <= 1) {
                            showToast('至少保留一条翻译提示词');
                            return;
                        }
                        row.remove();
                        refreshTranslationPromptRows();
                        updateSettingsDirtyStatus();
                    });
                }
            });
        }

        refreshTranslationPromptRows();
        document.getElementById('zh-add-translation-prompt')?.addEventListener('click', () => {
            const list = document.getElementById('zh-translation-prompt-list');
            if (!list) return;
            const row = document.createElement('div');
            row.className = 'zh-translation-prompt-row';
            row.dataset.promptId = `translation-prompt-${Date.now()}`;
            row.innerHTML = `
                <div class="zh-translation-prompt-toolbar">
                    <label class="zh-settings-toggle zh-translation-prompt-enabled"><span><b>启用轮换</b></span><input type="checkbox" class="zh-translation-prompt-check" checked><i></i></label>
                    <input type="text" class="zh-translation-prompt-name" placeholder="提示词名称">
                    <button type="button" class="zh-inline-btn zh-translation-prompt-delete" title="删除提示词">删除</button>
                </div>
                <textarea class="zh-translation-prompt-text" rows="4" placeholder="使用 {{targetLang}} 代表目标语言"></textarea>`;
            list.appendChild(row);
            refreshTranslationPromptRows();
            row.querySelector('.zh-translation-prompt-name')?.focus();
            updateSettingsDirtyStatus();
        });

        fontFileInput?.addEventListener('change', async () => {
            const file = fontFileInput.files?.[0];
            if (!file) return;
            const supported = /\.(woff2?|ttf|otf)$/i.test(file.name);
            if (!supported) {
                fontFileInput.value = '';
                setFontStatus('仅支持 WOFF2、WOFF、TTF 或 OTF 文件', true);
                return;
            }
            if (file.size > 25 * 1024 * 1024) {
                fontFileInput.value = '';
                setFontStatus('字体文件不能超过 25 MB，建议使用 WOFF2 压缩版本', true);
                return;
            }
            try {
                setFontStatus('正在读取字体文件...');
                pendingFontRecord = await readFontFile(file);
                pendingFontToken = `${file.name}:${file.size}:${file.lastModified}`;
                fontFileInput.dataset.fontName = file.name;
                document.getElementById('zh-font-file-name').textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
                const fileSourceRadio = settingsModal.querySelector('input[name="zh-custom-font-source"][value="file"]');
                if (fileSourceRadio) fileSourceRadio.checked = true;
                syncFontSourcePanels();
                updateSettingsDirtyStatus();
                await previewCurrentFont();
            } catch (e) {
                setFontStatus(e?.message || String(e), true);
            }
        });

        document.getElementById('zh-preview-font-url').addEventListener('click', previewCurrentFont);

        // 绑定眼睛图标的切换事件
        document.getElementById('zh-toggle-eye').addEventListener('click', function() {
            const input = document.getElementById('zh-cfg-key');
            if (input.type === 'password') {
                input.type = 'text';
                this.innerHTML = `<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"></path></svg>`;
            } else {
                input.type = 'password';
                this.innerHTML = `<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            }
        });
        bindApiProfileControls();

        // 测试 API 按钮
        document.getElementById('zh-test-api-btn').addEventListener('click', async function() {
            const apiSettings = readApiSettingsFromForm();
            const resDiv = document.getElementById('zh-test-res');
            resDiv.style.display = 'block';
            resDiv.style.color = 'var(--zh-text)';
            resDiv.innerHTML = `<span class="zh-spinner"></span>正在向主机发送问候...`;

            try {
                const testRes = await callLLM("你是一个连通性测试助手。请只回答'✅ 连接成功！'", "Test", apiSettings.apiKey, apiSettings.apiHost, apiSettings.apiModel);
                saveConfig(apiSettings);
                if (initialSnapshot) {
                    const savedSnapshot = JSON.parse(initialSnapshot);
                    Object.assign(savedSnapshot.settings, apiSettings);
                    initialSnapshot = JSON.stringify(savedSnapshot);
                }
                updateSettingsDirtyStatus();
                resDiv.style.color = 'green';
                resDiv.innerText = `${testRes || '✅ 连接成功！'}\n已同步本次 Host / Key / Model，后续摘要会使用这套配置。`;
            } catch (err) {
                resDiv.style.color = 'red';
                resDiv.innerText = '❌ ' + err.message;
            }
        });

        document.getElementById('zh-preview-prompts-btn').addEventListener('click', showPromptPreviewModal);

        document.getElementById('zh-fetch-collections-btn').addEventListener('click', async () => {
            const status = document.getElementById('zh-fetch-collections-status');
            const list = document.getElementById('zh-collections-list');
            const input = document.getElementById('zh-cfg-collection-id');
            status.textContent = '正在拉取...';
            status.style.color = 'var(--zh-text)';
            list.innerHTML = '';
            try {
                const collections = await fetchMyCollections(50);
                if (!collections.length) {
                    status.textContent = '未拉到任何收藏夹（可能未登录或账号下没有收藏夹）。';
                    return;
                }
                const def = collections.find(c => c.isDefault);
                status.textContent = def
                    ? `共 ${collections.length} 个，默认收藏夹「${def.title}」(id=${def.id})。点击列表项可改填其它。`
                    : `共 ${collections.length} 个收藏夹，点击即可填入 ID。`;
                if (def && !input.value.trim()) input.value = def.id;
                list.innerHTML = collections.map(c => `
                    <div class="zh-collection-row" data-cid="${escapeHTML(c.id)}" style="display:flex;justify-content:space-between;gap:8px;padding:6px 8px;border:1px solid var(--zh-border);border-radius:4px;margin-bottom:4px;cursor:pointer;background:var(--zh-quote);">
                        <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(c.title)}${c.isDefault ? ' <span style="color:var(--zh-accent);font-size:11px;border:1px solid var(--zh-accent);padding:0 4px;border-radius:3px;margin-left:4px;">默认</span>' : ''}</span>
                        <span style="opacity:.6;font-size:12px;flex-shrink:0;">${c.answerCount} 项 · id=${escapeHTML(c.id)}</span>
                    </div>
                `).join('');
                list.querySelectorAll('.zh-collection-row').forEach(row => {
                    row.addEventListener('click', () => {
                        const cid = row.getAttribute('data-cid');
                        input.value = cid;
                        status.style.color = 'green';
                        status.textContent = `已填入收藏夹 ID：${cid}（记得保存）`;
                    });
                });
            } catch (err) {
                status.style.color = 'red';
                status.textContent = '拉取失败：' + (err.message || err);
            }
        });

        // 自定义主题：渲染已有列表 + 添加/删除
        function renderCustomThemeList() {
            const box = document.getElementById('zh-custom-theme-list');
            if (!box) return;
            const customs = THEMES.filter(t => t.custom);
            box.innerHTML = customs.length
                ? customs.map(t => `
                    <div class="zh-custom-theme-row" data-name="${escapeHTML(t.name)}" style="display:flex; align-items:center; gap:8px; padding:6px 8px; border:1px solid var(--zh-border); border-radius:4px; margin-bottom:4px; background:var(--zh-quote);">
                        <span style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(t.name)}</span>
                        <span style="display:inline-flex; gap:3px;">${THEME_VAR_GUIDE.slice(0,5).map(v => `<span style="width:14px;height:14px;border-radius:3px;border:1px solid var(--zh-border);background:${escapeHTML(t.vars[v.key] || '#000')};"></span>`).join('')}</span>
                        <button type="button" class="zh-inline-btn zh-apply-theme" style="padding:3px 8px; font-size:12px;">应用</button>
                        <button type="button" class="zh-inline-btn zh-del-theme" style="padding:3px 8px; font-size:12px;">删除</button>
                    </div>
                `).join('')
                : '<div style="opacity:.6;">还没有自定义主题。</div>';
            box.querySelectorAll('.zh-custom-theme-row').forEach(row => {
                const name = row.getAttribute('data-name');
                row.querySelector('.zh-apply-theme').addEventListener('click', () => {
                    applyTheme(THEMES.findIndex(t => t.name === name));
                    showToast(`已应用主题「${name}」`);
                });
                row.querySelector('.zh-del-theme').addEventListener('click', () => {
                    removeCustomTheme(name);
                    renderCustomThemeList();
                    showToast('已删除主题');
                });
            });
        }
        renderCustomThemeList();

        document.getElementById('zh-add-theme-btn').addEventListener('click', () => {
            const name = (document.getElementById('zh-theme-name').value || '').trim();
            if (!name) { showToast('请先填写主题名'); return; }
            if (THEMES.some(t => t.name === name)) { showToast('已存在同名主题'); return; }
            const vars = {};
            document.querySelectorAll('#zh-theme-var-grid .zh-theme-var').forEach(inp => {
                vars[inp.getAttribute('data-var')] = inp.value;
            });
            const idx = addCustomTheme(name, vars);
            applyTheme(idx);
            document.getElementById('zh-theme-name').value = '';
            renderCustomThemeList();
            showToast(`已添加并应用「${name}」`);
        });

        document.getElementById('zh-theme-tutorial-btn').addEventListener('click', showThemeTutorialModal);

        document.getElementById('zh-import-theme-btn').addEventListener('click', () => {
            const raw = (document.getElementById('zh-theme-json').value || '').trim();
            if (!raw) { showToast('请先粘贴 JSON'); return; }
            const obj = parseThemeJSON(raw);
            if (!obj || !obj.name || !obj.vars || typeof obj.vars !== 'object') { showToast('JSON 格式不对，需含 name 和 vars'); return; }
            const name = String(obj.name).trim();
            if (THEMES.some(t => t.name === name)) { showToast('已存在同名主题'); return; }
            const vars = {};
            THEME_VAR_GUIDE.forEach(v => { vars[v.key] = obj.vars[v.key] || v.def; });
            const idx = addCustomTheme(name, vars);
            applyTheme(idx);
            document.getElementById('zh-theme-json').value = '';
            renderCustomThemeList();
            showToast(`已导入并应用「${name}」`);
        });

        // 保存配置按钮
        document.getElementById('zh-save-settings-btn').addEventListener('click', () => {
            commitSettingsSave(() => {
                initialSnapshot = getFormSnapshot();
                closeSettingsModal();
            });
        });
    }

    function showThemeTutorialModal() {
        if (document.getElementById('zh-theme-tutorial-modal')) return;
        const template = JSON.stringify({
            name: '🌙 我的主题',
            vars: Object.fromEntries(THEME_VAR_GUIDE.map(v => [v.key, v.def]))
        }, null, 2);
        const rows = THEME_VAR_GUIDE.map(v => `
            <div style="display:flex; gap:8px; padding:6px 0; border-bottom:1px dashed var(--zh-border);">
                <code style="color:var(--zh-accent); flex-shrink:0; width:120px;">${escapeHTML(v.key)}</code>
                <span><b>${escapeHTML(v.label)}</b> — ${escapeHTML(v.desc)}</span>
            </div>
        `).join('');
        createModal('zh-theme-tutorial-modal', '🎨 主题模板与字段说明', `
            <div style="font-size:13px; line-height:1.7; margin-bottom:12px;">复制下面的模板，把每个颜色改成你想要的值（支持 #RRGGBB），再粘回导入框点「导入 JSON 主题」。单引号、无引号 key 也能识别。</div>
            <pre style="background:var(--zh-code); border:1px solid var(--zh-border); border-radius:4px; padding:12px; font-size:12px; overflow:auto; max-height:240px; margin:0 0 8px;"><code>${escapeHTML(template)}</code></pre>
            <button id="zh-copy-theme-template" type="button" class="zh-inline-btn" style="padding:6px 12px; font-size:13px; margin-bottom:16px;">一键复制模板</button>
            <div style="font-weight:bold; color:var(--zh-accent); margin-bottom:6px;">字段说明</div>
            <div style="font-size:13px;">${rows}</div>
        `);
        document.getElementById('zh-copy-theme-template').addEventListener('click', () => {
            navigator.clipboard.writeText(template).then(() => showToast('模板已复制')).catch(() => showToast('复制失败'));
        });
    }

    function showHelpModal() {
        if(document.getElementById('zh-help-modal')) return;
        createModal('zh-help-modal', '❓ 卷轴指南', HELP_MODAL_HTML);
    }
