    const THEME_STORAGE_KEY = 'zh-immersive-theme-index';
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
    }

    function sanitizeLLMHTML(content) {
        const template = document.createElement('template');
        template.innerHTML = String(content || '');

        const allowedTags = new Set([
            'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD', 'CAPTION', 'COLGROUP', 'COL',
            'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'CODE', 'PRE', 'BLOCKQUOTE',
            'UL', 'OL', 'LI', 'SPAN', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SUP', 'SUB'
        ]);
        const allowedAttrs = new Set(['colspan', 'rowspan', 'scope', 'align']);
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
        }

        unsafeNodes.forEach(el => el.replaceWith(document.createTextNode(el.textContent || '')));
        return template.innerHTML;
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
                    <button class="zh-modal-close" id="${id}-close-btn">×</button>
                </div>
                <div class="zh-modal-body">${innerHTML}</div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById(`${id}-close-btn`).addEventListener('click', () => {
            if (onClose) onClose();
            else overlay.remove();
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
            wikiMaxItems: getFormNumber('zh-cfg-wiki-max', 100, 1),
            wikiConcurrency: getFormNumber('zh-cfg-wiki-concurrency', 20, 0),
            wikiRpm: getFormNumber('zh-cfg-wiki-rpm', 300, 0),
            wikiFinalSynthesis: document.getElementById('zh-cfg-wiki-final').checked,
            embeddingHost: (document.getElementById('zh-cfg-embedding-host')?.value || '').trim(),
            embeddingModel: (document.getElementById('zh-cfg-embedding-model')?.value || '').trim() || 'text-embedding-3-small',
            embeddingKey: (document.getElementById('zh-cfg-embedding-key')?.value || '').trim(),
            defaultCollectionId: (document.getElementById('zh-cfg-collection-id')?.value || '').trim()
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
            '【段落翻译提示词模板】',
            `你是一个翻译专家。请翻译到目标语言：【${config.targetLang}】。注意：如果是表格则输出完整HTML表格结构；遇到公式块、代码块请原文保留，不可随意篡改。输出纯内容，不要markdown格式的标记。`
        ].join('\n\n');
        createModal('zh-prompts-modal', '当前系统提示词预览', `<pre style="white-space:pre-wrap;word-break:break-word;background:var(--zh-code);border:1px solid var(--zh-border);border-radius:4px;padding:12px;max-height:60vh;overflow:auto;">${escapeHTML(content)}</pre>`);
    }

    function showSettingsModal() {
        if(document.getElementById('zh-settings-modal')) return;

        const getFormSnapshot = () => JSON.stringify(readSettingsFromForm());
        let initialSnapshot = '';

        function closeSettingsModal() {
            document.getElementById('zh-settings-modal')?.remove();
        }

        function tryClose() {
            if (initialSnapshot && getFormSnapshot() !== initialSnapshot) {
                showConfirm('设置有未保存的改动，是否保存？', () => {
                    saveConfig(readSettingsFromForm());
                    if (window._isImmersive) setupImageToggles();
                    closeSettingsModal();
                    showToast('设置已保存');
                }, closeSettingsModal);
            } else {
                closeSettingsModal();
            }
        }

        createModal('zh-settings-modal', '⚙️ 设置偏好', SETTINGS_MODAL_HTML(config), tryClose);
        requestAnimationFrame(() => { initialSnapshot = getFormSnapshot(); });

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
                initialSnapshot = getFormSnapshot();
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

        // 保存配置按钮
        document.getElementById('zh-save-settings-btn').addEventListener('click', () => {
            saveConfig(readSettingsFromForm());
            if (window._isImmersive) setupImageToggles();
            initialSnapshot = getFormSnapshot();
            closeSettingsModal();
            showToast('设置已保存');
        });
    }

    function showHelpModal() {
        if(document.getElementById('zh-help-modal')) return;
        createModal('zh-help-modal', '❓ 卷轴指南', HELP_MODAL_HTML);
    }
