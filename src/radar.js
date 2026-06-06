    function loadRadarReportBook() {
        try {
            const raw = localStorage.getItem(RADAR_REPORT_BOOK_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            console.warn('知乎沉浸式阅读：阅读笔记本读取失败', err);
            return [];
        }
    }

    function saveRadarReportBook(items) {
        const safeItems = (Array.isArray(items) ? items : []).slice(0, RADAR_REPORT_BOOK_MAX);
        try {
            localStorage.setItem(RADAR_REPORT_BOOK_KEY, JSON.stringify(safeItems));
            return true;
        } catch (err) {
            try {
                localStorage.setItem(RADAR_REPORT_BOOK_KEY, JSON.stringify(safeItems.slice(0, Math.floor(RADAR_REPORT_BOOK_MAX / 2))));
                return true;
            } catch (innerErr) {
                console.warn('知乎沉浸式阅读：阅读笔记本写入失败', innerErr);
                return false;
            }
        }
    }

    function getRadarReportSystemPrompt() {
        return `你是一个阅读笔记助手。帮用户为当前文章写一份简洁的阅读笔记。

输出要求：
- oneliner：一句话概括这篇内容的核心观点或价值
- impression：读完最值得记住的感受或启发（2-3句）
- tags：3-4个关键词标签

archetype 只能选：trick / tutorial / analysis / opinion / trend / noise。
depth：只能选 skim / read / study / skip。
relevance：0-100（对用户的相关度）。

请输出严格 JSON，不要 Markdown，不要代码块。字段：
archetype, oneliner, impression, depth, relevance, tags。`;
    }

    function getRadarReportWithDraftSystemPrompt() {
        return `你是一个阅读笔记助手。用户已经写了一些笔记草稿，请基于用户的草稿方向进行润色、补充和扩展。

规则：
1. 优先沿着用户草稿的思路和方向写，不要无视草稿另起炉灶
2. 润色用户已有的表达，使其更精炼
3. 在用户草稿基础上补充用户可能遗漏的要点
4. 保持用户的语气和视角

输出要求：
- oneliner：一句话概括（可基于用户草稿润色）
- impression：读后感/笔记正文（基于用户草稿扩展，3-5句）
- tags：3-4个关键词标签

archetype 只能选：trick / tutorial / analysis / opinion / trend / noise。
depth：只能选 skim / read / study / skip。
relevance：0-100。

请输出严格 JSON，不要 Markdown，不要代码块。字段：
archetype, oneliner, impression, depth, relevance, tags。`;
    }

    function normalizeRadarTags(value) {
        return normalizeWikiTags(value).slice(0, 4);
    }

    function normalizeRadarDepth(value) {
        const depth = String(value || '').trim();
        return ['skim', 'read', 'study', 'skip'].includes(depth) ? depth : 'skim';
    }

    function normalizeRadarArchetype(value) {
        const archetype = String(value || '').trim();
        return ['trick', 'tutorial', 'analysis', 'opinion', 'trend', 'noise'].includes(archetype) ? archetype : 'opinion';
    }

    function getCurrentRadarSource() {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) throw new Error('请先进入沉浸模式。');

        // 只在能定位到具体文章/回答/动态 URL 的正文视图下允许生成笔记，
        // 个人空间、Wiki、未进入正文的推荐流/关注流列表等都禁止（否则会把页面 URL 错记为笔记来源）。
        const inHomeItem = _homeState.view === 'item';
        const inFollowItem = _followState.view === 'item';
        const inAnswer = _questionState.view === 'answer' || isAnswerUrl();
        const inPost = isPostPage() && _homeState.view !== 'item' && _followState.view === '' && _questionState.view !== 'answer';
        if (!inHomeItem && !inFollowItem && !inAnswer && !inPost) {
            throw new Error('请先打开一篇文章 / 回答 / 关注动态的正文，再生成阅读笔记。');
        }

        // 首页推荐流正文视图
        if (inHomeItem) {
            const homeItem = _homeState.items[_homeState.currentIndex];
            const root = document.querySelector('#immersive-wrapper .zh-home-card-view') || wrapper;
            const sourceText = normalizeText(root?.innerText || root?.textContent || '');
            if (!sourceText || sourceText.length < 20) throw new Error('当前内容太短，无法生成阅读笔记。');
            const url = homeItem?.url || homeItem?.key || location.href;
            const title = (homeItem?.title || document.querySelector('#immersive-wrapper h1, h2')?.innerText || '知乎内容').replace(/\s+/g, ' ').trim();
            return {
                sourceType: homeItem?.type || 'article',
                title,
                url,
                sourceText,
                sourceKey: `home::${stableHash(url)}::${stableHash(sourceText)}`
            };
        }

        // 关注动态正文视图
        if (inFollowItem) {
            const followItem = _followState.items[_followState.currentIndex];
            const root = document.querySelector('#immersive-wrapper .zh-home-card-view, #immersive-wrapper .zh-follow-card-view') || wrapper;
            const sourceText = normalizeText(followItem?.text || root?.innerText || root?.textContent || '');
            if (!sourceText || sourceText.length < 20) throw new Error('当前内容太短，无法生成阅读笔记。');
            const url = followItem?.url || followItem?.key;
            if (!url) throw new Error('无法定位当前动态的链接，暂不能生成阅读笔记。');
            const title = (followItem?.title || document.querySelector('#immersive-wrapper h1, h2')?.innerText || '知乎动态').replace(/\s+/g, ' ').trim();
            return {
                sourceType: followItem?.type || 'article',
                title,
                url,
                sourceText,
                sourceKey: `follow::${stableHash(url)}::${stableHash(sourceText)}`
            };
        }

        const isAnswer = inAnswer;
        const sourceType = isAnswer ? 'answer' : 'article';
        const answer = isAnswer ? _questionState.answers[_questionState.currentIndex] : null;
        const title = (isAnswer
            ? (_questionState.questionTitle || document.querySelector('#immersive-wrapper h1, h1')?.innerText)
            : (document.querySelector('#immersive-wrapper h1, h1')?.innerText || document.title || '知乎文章')
        || '知乎内容').replace(/\s+/g, ' ').trim();

        const articleRoot = wrapper.querySelector('.Post-RichTextContainer .RichText, .Post-RichTextContainer, .Post-RichText, .RichText.ztext, .RichText') || wrapper;
        const root = isAnswer
            ? (document.querySelector('#immersive-wrapper .zh-question-answer-view') || wrapper)
            : articleRoot;
        const sourceText = normalizeText(answer?.text || root?.innerText || root?.textContent || '');
        if (!sourceText || sourceText.length < 20) throw new Error('当前内容太短，无法生成阅读笔记。');

        const url = (answer?.key && /^https?:\/\//.test(answer.key)) ? answer.key : location.href;
        return {
            sourceType,
            title,
            url,
            sourceText,
            sourceKey: `${sourceType}::${stableHash(url)}::${stableHash(sourceText)}`
        };
    }

    function findRadarReportForSource(source) {
        const items = loadRadarReportBook();
        return items.find(item => item.sourceKey === source.sourceKey)
            || items.find(item => item.url === source.url && item.sourceType === source.sourceType);
    }

    function buildRadarReportUserPrompt(source, userDraft = '') {
        const tags = String(config.radarInterestTags || '').trim();
        const parts = [
            `页面类型：${source.sourceType}`,
            `标题：${source.title}`,
            `来源 URL：${source.url}`,
            tags ? `用户兴趣标签：${tags}` : '',
            `正文前 6000 字：\n${source.sourceText.slice(0, 6000)}`
        ];
        if (userDraft.trim()) {
            parts.push(`\n【用户笔记草稿】：\n${userDraft.trim()}`);
        }
        return parts.filter(Boolean).join('\n\n');
    }

    function fallbackRadarReport(raw, source) {
        const text = String(raw || '').replace(/\s+/g, ' ').trim();
        return {
            archetype: 'opinion',
            oneliner: text.slice(0, 120) || source.sourceText.slice(0, 120) || '这条内容需要人工判断。',
            impression: '这条内容需要人工判断是否值得保留。',
            depth: 'skim',
            relevance: 50,
            offTagHighlight: false,
            highlightReason: '',
            tags: [],
            rawJson: raw || ''
        };
    }

    function normalizeRadarReport(data, source, raw = '') {
        const parsed = data && typeof data === 'object' ? data : fallbackRadarReport(raw, source);
        const relevance = Number(parsed.relevance);
        return {
            id: `radar-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            savedAt: new Date().toISOString(),
            url: source.url,
            title: source.title,
            sourceType: source.sourceType,
            sourceText: source.sourceText,
            sourceKey: source.sourceKey,
            archetype: normalizeRadarArchetype(parsed.archetype),
            oneliner: String(parsed.oneliner || fallbackRadarReport(raw, source).oneliner).replace(/\s+/g, ' ').trim(),
            impression: String(parsed.impression || '这条内容需要人工判断是否值得保留。').replace(/\s+/g, ' ').trim(),
            depth: normalizeRadarDepth(parsed.depth),
            relevance: Number.isFinite(relevance) ? Math.max(0, Math.min(100, Math.round(relevance))) : 50,
            offTagHighlight: !!parsed.offTagHighlight,
            highlightReason: String(parsed.highlightReason || '').replace(/\s+/g, ' ').trim(),
            tags: normalizeRadarTags(parsed.tags),
            rawJson: raw || JSON.stringify(parsed)
        };
    }

    async function generateRadarReport(source, onProgress = null, userDraft = '') {
        if (!config.apiKey) throw new Error('请先在设置里配置 API Key。');
        const hasDraft = !!userDraft.trim();
        onProgress?.({ phase: 'prepare', message: hasDraft ? '基于你的笔记草稿润色生成...' : '准备生成阅读笔记...' });
        const sysPrompt = hasDraft ? getRadarReportWithDraftSystemPrompt() : getRadarReportSystemPrompt();
        const messages = [
            { role: 'system', content: sysPrompt },
            { role: 'user', content: buildRadarReportUserPrompt(source, userDraft) }
        ];
        onProgress?.({ phase: 'request', message: '正在发送 API 请求...' });
        const raw = await callLLMMessages(messages);
        onProgress?.({ phase: 'response', message: '已收到 API 响应，正在解析...' });
        const parsed = parseJSONFromText(raw);
        const report = normalizeRadarReport(parsed, source, raw);
        if (hasDraft) report.userDraft = userDraft.trim();
        onProgress?.({ phase: 'done', message: '阅读笔记已生成。' });
        return report;
    }

    function getRadarJob(source) {
        return radarJobState.get(source.sourceKey) || null;
    }

    function setRadarJob(source, patch) {
        const prev = getRadarJob(source) || {
            sourceKey: source.sourceKey,
            status: 'idle',
            phase: '',
            message: '',
            startedAt: '',
            finishedAt: '',
            report: null,
            error: '',
            promise: null
        };
        const next = { ...prev, ...patch };
        radarJobState.set(source.sourceKey, next);
        return next;
    }

    function startRadarReportJob(source, userDraft = '') {
        const existing = getRadarJob(source);
        if (existing?.status === 'running' && existing.promise) return existing;
        const startedAt = new Date().toISOString();
        const hasDraft = !!userDraft.trim();
        const job = setRadarJob(source, {
            status: 'running',
            phase: 'prepare',
            message: hasDraft ? '基于草稿生成笔记...' : '准备生成阅读笔记...',
            startedAt,
            finishedAt: '',
            report: existing?.report || findRadarReportForSource(source) || null,
            error: ''
        });
        job.promise = generateRadarReport(source, patch => setRadarJob(source, patch), userDraft)
            .then(report => {
                setRadarJob(source, {
                    status: 'done',
                    phase: 'done',
                    message: '报告已生成，确认后可保存。',
                    finishedAt: new Date().toISOString(),
                    report,
                    error: ''
                });
                return report;
            })
            .catch(err => {
                setRadarJob(source, {
                    status: 'error',
                    phase: 'error',
                    message: `生成失败：${err.message}`,
                    finishedAt: new Date().toISOString(),
                    error: err.message
                });
                throw err;
            });
        radarJobState.set(source.sourceKey, job);
        return job;
    }

    function formatRadarReportMarkdown(report) {
        if (!report) return '';
        const tags = (report.tags || []).map(tag => `#${String(tag).replace(/^#/, '').replace(/\s+/g, '_')}`).join(' ');
        const depthLabel = { skim: '略读', read: '细读', study: '精读', skip: '跳过' }[report.depth] || report.depth || '略读';
        const lines = [
            `### [${report.archetype || 'opinion'}] ${report.title || '知乎内容'}`,
            `> ${report.impression || report.oneliner || ''}`,
            '',
            `📖 ${depthLabel} · 🏷 ${tags || '无'} · 🔗 ${report.url || ''}`
        ];
        if (report.userDraft) {
            lines.push('', `**我的笔记：** ${report.userDraft}`);
        }
        return lines.join('\n');
    }

    function formatRadarReportBookMarkdown(items = loadRadarReportBook()) {
        const lines = ['# 知乎阅读笔记本', '', `导出时间：${new Date().toLocaleString()}`, `条目数量：${items.length}`, ''];
        items.forEach(item => {
            lines.push(formatRadarReportMarkdown(item), '');
        });
        return lines.join('\n');
    }

    function saveRadarReport(report) {
        if (!report) return false;
        const items = loadRadarReportBook();
        const filtered = items.filter(item => item.sourceKey !== report.sourceKey);
        filtered.unshift({ ...report, savedAt: new Date().toISOString() });
        return saveRadarReportBook(filtered);
    }

    function renderRadarReportHTML(report) {
        if (!report) return '<div style="opacity:.75;">当前内容还没有生成阅读笔记。</div>';
        const tags = (report.tags || []).map(tag => `<span style="display:inline-block;margin:2px 4px 2px 0;padding:1px 6px;border-radius:3px;background:var(--zh-code);color:var(--zh-accent);font-size:12px;">#${escapeHTML(tag)}</span>`).join('');
        const depthLabel = { skim: '略读', read: '细读', study: '精读', skip: '跳过' }[report.depth] || report.depth || '略读';
        return `
            <div style="border:1px solid var(--zh-border);background:var(--zh-quote);border-radius:6px;padding:14px 16px;margin-bottom:12px;">
                <div style="font-weight:bold;color:var(--zh-title);margin-bottom:8px;font-size:15px;">${escapeHTML(report.oneliner || report.title)}</div>
                <div style="margin:8px 0;padding-left:12px;border-left:3px solid var(--zh-accent);color:var(--zh-text);line-height:1.7;">${escapeHTML(report.impression || '')}</div>
                <div style="margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span style="font-size:12px;padding:2px 8px;border-radius:3px;background:var(--zh-accent);color:var(--zh-paper);">${escapeHTML(report.archetype || 'opinion')}</span>
                    <span style="font-size:12px;opacity:.75;">📖 ${escapeHTML(depthLabel)}</span>
                    ${tags}
                </div>
                <div style="margin-top:8px;font-size:12px;opacity:.6;word-break:break-all;">${escapeHTML(report.url || '')}</div>
            </div>
        `;
    }

    function showRadarReportBookModal() {
        if (document.getElementById('zh-radar-book-modal')) return;
        const items = loadRadarReportBook();
        const rows = items.slice(0, 80).map((item, index) => `
            <div style="border:1px solid var(--zh-border);background:var(--zh-quote);border-radius:4px;padding:10px;margin-bottom:10px;">
                <div style="font-weight:bold;color:var(--zh-accent);">${index + 1}. [${escapeHTML(item.archetype || '')}] ${escapeHTML(item.oneliner || item.title || '')}</div>
                <div style="margin-top:6px;">${escapeHTML(item.impression || '')}</div>
                <div style="font-size:13px;opacity:.75;margin-top:6px;">${escapeHTML(item.depth || 'skim')} · ⭐ ${escapeHTML(item.relevance ?? 50)} · ${escapeHTML(item.savedAt ? new Date(item.savedAt).toLocaleString() : '')}</div>
            </div>
        `).join('');
        const modal = createModal('zh-radar-book-modal', '阅读笔记本', `
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
                <button id="zh-radar-copy-md" class="zh-inline-btn">复制 Markdown</button>
                <button id="zh-radar-download-md" class="zh-inline-btn">下载 Markdown</button>
                <button id="zh-radar-download-json" class="zh-inline-btn">下载 JSON</button>
                <button id="zh-radar-clear" class="zh-inline-btn">清空</button>
            </div>
            <div style="font-size:13px;opacity:.75;margin-bottom:12px;">共 ${items.length} 条。列表只预览前 80 条，导出包含全部。</div>
            <div>${rows || '<div style="opacity:.7;">阅读笔记本还是空的。点击 R 可以生成当前文章/回答报告。</div>'}</div>
        `);
        document.getElementById('zh-radar-copy-md')?.addEventListener('click', async () => {
            await navigator.clipboard.writeText(formatRadarReportBookMarkdown(loadRadarReportBook()));
            alert('Markdown 已复制。');
        });
        document.getElementById('zh-radar-download-md')?.addEventListener('click', () => {
            downloadTextFile(`zhihu-radar-report-book-${new Date().toISOString().slice(0, 10)}.md`, formatRadarReportBookMarkdown(loadRadarReportBook()), 'text/markdown;charset=utf-8');
        });
        document.getElementById('zh-radar-download-json')?.addEventListener('click', () => {
            downloadTextFile(`zhihu-radar-report-book-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(loadRadarReportBook(), null, 2), 'application/json;charset=utf-8');
        });
        document.getElementById('zh-radar-clear')?.addEventListener('click', () => {
            if (!confirm('确认清空阅读笔记本？')) return;
            saveRadarReportBook([]);
            modal.remove();
            showRadarReportBookModal();
        });
    }

    function showRadarReportModal() {
        if (document.getElementById('zh-radar-report-modal')) return;
        let source;
        try {
            source = getCurrentRadarSource();
        } catch (err) {
            alert(err.message);
            return;
        }
        const savedReport = findRadarReportForSource(source) || null;
        const existingJob = getRadarJob(source);
        let currentReport = existingJob?.report || savedReport || null;
        const modal = createModal('zh-radar-report-modal', '阅读笔记', `
            <div style="margin-bottom:12px;">
                <label style="display:block;margin-bottom:5px;font-weight:bold;color:var(--zh-accent);">我的笔记 / 想法：</label>
                <textarea id="zh-radar-user-draft" style="width:100%;height:80px;padding:8px;box-sizing:border-box;background:var(--zh-code);border:1px solid var(--zh-border);border-radius:4px;color:var(--zh-text);outline:none;resize:vertical;font-family:inherit;font-size:14px;line-height:1.6;" placeholder="写下你的想法、关键词或笔记方向，AI 会基于此润色补充...">${escapeHTML(currentReport?.userDraft || '')}</textarea>
                <div style="font-size:12px;opacity:.6;margin-top:4px;">留空则 AI 自动生成；写了内容则 AI 会沿着你的方向润色扩展。</div>
            </div>
            <div id="zh-radar-report-content">${renderRadarReportHTML(currentReport)}</div>
            <div id="zh-radar-report-status" style="font-size:13px;opacity:.75;margin:8px 0 12px;">${existingJob?.message || (currentReport ? '已读取本地笔记。' : '')}</div>
            <div class="zh-radar-actions" style="display:flex;gap:8px;flex-wrap:wrap;">
                <button id="zh-radar-generate" class="zh-inline-btn zh-radar-generate-btn zh-export-hidden">${currentReport ? 'AI 重新生成' : 'AI 生成笔记'}</button>
                <button id="zh-radar-save" class="zh-inline-btn">保存</button>
                <button id="zh-radar-copy-current" class="zh-inline-btn">复制 Markdown</button>
                <button id="zh-radar-open-book" class="zh-inline-btn">笔记本</button>
            </div>
        `);
        const contentEl = document.getElementById('zh-radar-report-content');
        const statusEl = document.getElementById('zh-radar-report-status');
        const generateBtn = document.getElementById('zh-radar-generate');
        const draftInput = document.getElementById('zh-radar-user-draft');
        const render = (message = '') => {
            if (contentEl) contentEl.innerHTML = renderRadarReportHTML(currentReport);
            if (statusEl && message) statusEl.textContent = message;
        };
        const syncFromJob = () => {
            const job = getRadarJob(source);
            if (!job) return;
            currentReport = job.report || currentReport;
            if (contentEl) contentEl.innerHTML = renderRadarReportHTML(currentReport);
            if (statusEl) {
                statusEl.textContent = job.message || (job.status === 'running' ? '正在生成...' : '');
                if (job.status === 'error') statusEl.innerHTML = `<span style="color:red">${escapeHTML(job.message || job.error || '生成失败')}</span>`;
            }
            if (generateBtn) {
                generateBtn.disabled = job.status === 'running';
                generateBtn.textContent = job.status === 'running' ? '生成中...' : (currentReport ? 'AI 重新生成' : 'AI 生成笔记');
            }
        };
        syncFromJob();
        const radarSyncTimer = setInterval(() => {
            if (!document.getElementById('zh-radar-report-modal')) {
                clearInterval(radarSyncTimer);
                return;
            }
            syncFromJob();
        }, 500);

        generateBtn?.addEventListener('click', async () => {
            const draft = draftInput?.value || '';
            const job = startRadarReportJob(source, draft);
            syncFromJob();
            try {
                currentReport = await job.promise;
                render('笔记已生成。');
            } catch (err) {
                if (statusEl) statusEl.innerHTML = `<span style="color:red">生成失败：${escapeHTML(err.message)}</span>`;
            } finally {
                syncFromJob();
            }
        });

        document.getElementById('zh-radar-save')?.addEventListener('click', () => {
            if (!currentReport) return alert('请先生成笔记。');
            currentReport.userDraft = (draftInput?.value || '').trim();
            if (saveRadarReport(currentReport)) {
                showCollectOverlay('阅读笔记已保存。');
                setTimeout(removeCollectOverlay, 1400);
                render('已保存。');
            } else {
                alert('保存失败，可能是 localStorage 空间不足。');
            }
        });
        document.getElementById('zh-radar-copy-current')?.addEventListener('click', async () => {
            if (!currentReport) return alert('请先生成笔记。');
            await navigator.clipboard.writeText(formatRadarReportMarkdown(currentReport));
            showCollectOverlay('Markdown 已复制');
            setTimeout(removeCollectOverlay, 1200);
        });
        document.getElementById('zh-radar-open-book')?.addEventListener('click', () => {
            modal.remove();
            showRadarReportBookModal();
        });
    }

    function showSelectionContextMenu(event, selectedText, contextText) {
        removeSelectionContextMenu();

        const menu = document.createElement('div');
        menu.id = 'zh-selection-context-menu';
        menu.className = 'zh-context-menu';
        menu.innerHTML = `
            <div class="zh-context-menu-item" id="zh-context-analyze">🔎 AI 划词解析</div>
            <div class="zh-context-menu-item" id="zh-context-save-expression">★ 加入表达本</div>
        `;
        document.body.appendChild(menu);

        const maxLeft = window.innerWidth - menu.offsetWidth - 8;
        const maxTop = window.innerHeight - menu.offsetHeight - 8;
        menu.style.left = `${Math.max(8, Math.min(event.clientX, maxLeft))}px`;
        menu.style.top = `${Math.max(8, Math.min(event.clientY, maxTop))}px`;

        document.getElementById('zh-context-analyze').addEventListener('click', () => {
            removeSelectionContextMenu();
            runSelectionAnalysis(selectedText, contextText);
        });

        document.getElementById('zh-context-save-expression').addEventListener('click', () => {
            openSaveExpressionModal(selectedText, contextText);
            removeSelectionContextMenu();
        });

        setTimeout(() => {
            document.addEventListener('click', removeSelectionContextMenu, { once: true });
        }, 0);
    }

    async function runSelectionAnalysis(selectedText, contextText) {
        const modalId = 'zh-selection-modal-' + Date.now();
        S2translate(modalId, '🔎 划词解析', `<div id="${modalId}-content"><span class="zh-spinner"></span>正在研读并解析，请稍候...</div>`);

        try {
            const sys = "你是一个专业阅读助手。请针对用户划词部分进行针对性的解释，不超过100字。输出纯文本，不要Markdown语法，尽量精简易懂。回答语言：中文";
            const usr = `【所在段落上下文】：\n${contextText}\n\n【用户划词需要解析的部分】：\n${selectedText}`;
            const res = await callLLM(sys, usr);
            const contentEl = document.getElementById(`${modalId}-content`);
            if (contentEl) contentEl.innerText = res;
        } catch (err) {
            const contentEl = document.getElementById(`${modalId}-content`);
            if (contentEl) contentEl.innerHTML = `<span style="color:red">解析失败：${err.message}</span>`;
        }
    }