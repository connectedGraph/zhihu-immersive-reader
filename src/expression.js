    function removeSelectionContextMenu() {
        const menu = document.getElementById('zh-selection-context-menu');
        if (menu) menu.remove();
    }

    function getSelectionAnchorElement() {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return null;
        const node = selection.anchorNode || selection.getRangeAt(0).commonAncestorContainer;
        return node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement || null;
    }

    function findPrevElementSibling(el) {
        let current = el?.previousSibling || null;
        while (current) {
            if (current.nodeType === Node.ELEMENT_NODE) return current;
            current = current.previousSibling;
        }
        return null;
    }

    function findNextElementSibling(el) {
        let current = el?.nextSibling || null;
        while (current) {
            if (current.nodeType === Node.ELEMENT_NODE) return current;
            current = current.nextSibling;
        }
        return null;
    }

    function getExpressionContextFromSelection(selectedText, fallbackContextText = '') {
        const anchorEl = getSelectionAnchorElement();
        const translationCard = anchorEl?.closest?.('.zh-tr-card');
        let sourceNode = null;
        let translatedNode = null;

        if (translationCard) {
            translatedNode = translationCard;
            const prev = findPrevElementSibling(translationCard);
            sourceNode = prev && isTranslatableBlock(prev) ? prev : null;
        } else {
            sourceNode = anchorEl?.closest?.('h1, h2, h3, h4, p, table, ul, ol, blockquote') || null;
            let next = sourceNode ? findNextElementSibling(sourceNode) : null;
            if (next?.classList?.contains('zh-tr-card')) translatedNode = next;
        }

        const sourceText = normalizeTranslationCacheText(sourceNode?.innerText || sourceNode?.textContent || fallbackContextText || '');
        const translatedText = normalizeTranslationCacheText(translatedNode?.innerText || translatedNode?.textContent || '');
        return {
            selectedText: normalizeTranslationCacheText(selectedText),
            sourceText,
            translatedText,
            selectedInTranslation: !!translationCard
        };
    }

    function loadExpressionBook() {
        try {
            const raw = crossOriginGet(EXPRESSION_BOOK_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            console.warn('知乎沉浸式阅读：表达本读取失败', err);
            return [];
        }
    }

    function saveExpressionBook(items) {
        const safeItems = (Array.isArray(items) ? items : []).slice(0, EXPRESSION_BOOK_MAX);
        try {
            crossOriginSet(EXPRESSION_BOOK_KEY, JSON.stringify(safeItems));
            return true;
        } catch (err) {
            try {
                crossOriginSet(EXPRESSION_BOOK_KEY, JSON.stringify(safeItems.slice(0, Math.floor(EXPRESSION_BOOK_MAX / 2))));
                return true;
            } catch (innerErr) {
                console.warn('知乎沉浸式阅读：表达本写入失败', innerErr);
                return false;
            }
        }
    }

    function getCurrentPageTitleForExpression() {
        return (_questionState.questionTitle || document.querySelector('#immersive-wrapper h1, h1')?.innerText || document.title || '知乎内容').replace(/\s+/g, ' ').trim();
    }

    function openSaveExpressionModal(selectedText, contextText) {
        const context = getExpressionContextFromSelection(selectedText, contextText);
        if (!context.selectedText) {
            alert('没有可收藏的划词内容。');
            return;
        }

        const modalId = 'zh-save-expr-modal-' + Date.now();
        const modalHTML = `
            <div style="margin-bottom: 12px; font-size: 13px; opacity: 0.8; max-height: 100px; overflow: auto; background: var(--zh-quote); padding: 8px; border-radius: 4px;">
                <strong>【选中词句】</strong>：${escapeHTML(context.selectedText)}
            </div>
            <div style="margin-bottom: 8px;"><strong>批注/释义（可选）：</strong></div>
            <textarea id="zh-expr-annotation-input" style="width:100%; height:80px; margin-bottom:12px; padding:8px; box-sizing:border-box; background:var(--zh-code); border:1px solid var(--zh-border); border-radius:4px; color:var(--zh-text); outline:none; resize:vertical; font-family:inherit;"></textarea>
            
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <button id="zh-expr-ai-btn" class="zh-test-btn" style="width:auto; margin:0; padding:6px 12px; font-size:13px;">✨ AI 自动生成批注</button>
                <div style="display:flex; gap:8px;">
                    <button id="zh-expr-cancel-btn" class="zh-inline-btn" style="background:transparent; border-color:var(--zh-border); color:var(--zh-text);">取消</button>
                    <button id="zh-expr-save-btn" class="zh-modal-btn" style="width:auto; padding:6px 16px;">确认保存</button>
                </div>
            </div>
        `;

        const modal = createModal(modalId, '📝 收藏至表达本', modalHTML);

        const aiBtn = document.getElementById('zh-expr-ai-btn');
        const saveBtn = document.getElementById('zh-expr-save-btn');
        const cancelBtn = document.getElementById('zh-expr-cancel-btn');
        const annotationInput = document.getElementById('zh-expr-annotation-input');

        aiBtn.addEventListener('click', async () => {
            aiBtn.disabled = true;
            aiBtn.innerText = '正在生成...';
            aiBtn.style.opacity = '0.7';
            try {
                const draft = annotationInput.value.trim();
                const sys = "你是一个语言学习/阅读助手。请对用户提取的词句进行简明批注，包含：1. 释义与语境分析 2. 其他常见用法/搭配（如果有）。如果用户提供了草稿批注/方向，请优先沿着草稿的理解方向润色、补全和压缩，不要无视草稿另起炉灶。请保持精简，总计不超过150字。输出纯文本。";
                const usr = `【原文段落】：\n${context.sourceText}\n\n【选中词句】：\n${context.selectedText}${draft ? `\n\n【用户草稿批注/方向】：\n${draft}` : ''}`;
                const res = await callLLM(sys, usr);
                annotationInput.value = res;
            } catch (err) {
                alert('AI 批注生成失败：' + err.message);
            } finally {
                aiBtn.disabled = false;
                aiBtn.innerText = '✨ 重新生成批注';
                aiBtn.style.opacity = '1';
            }
        });

        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });

        saveBtn.addEventListener('click', () => {
            const items = loadExpressionBook();
            const entry = {
                id: `expr-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
                savedAt: new Date().toISOString(),
                selectedText: context.selectedText,
                sourceText: context.sourceText,
                translatedText: context.translatedText,
                selectedInTranslation: context.selectedInTranslation,
                url: location.href,
                title: getCurrentPageTitleForExpression(),
                annotation: annotationInput.value.trim()
            };
            const dupKey = `${stableHash(entry.url)}::${stableHash(entry.selectedText)}::${stableHash(entry.sourceText)}::${stableHash(entry.translatedText)}`;
            const filtered = items.filter(item => `${stableHash(item.url)}::${stableHash(item.selectedText)}::${stableHash(item.sourceText)}::${stableHash(item.translatedText)}` !== dupKey);
            filtered.unshift(entry);
            
            if (saveExpressionBook(filtered)) {
                showCollectOverlay(`已加入表达本：${entry.selectedText.slice(0, 24)}`);
                setTimeout(removeCollectOverlay, 1500);
                if (document.getElementById('zh-expression-book-modal')) {
                    const exprModal = document.getElementById('zh-expression-book-modal');
                    exprModal.remove();
                    showExpressionBookModal();
                }
            } else {
                alert('表达本保存失败，可能是 localStorage 空间不足。');
            }
            modal.remove();
        });
    }

    function formatExpressionBookMarkdown(items = loadExpressionBook()) {
        const lines = ['# 知乎表达收藏本', '', `导出时间：${new Date().toLocaleString()}`, `条目数量：${items.length}`, ''];
        items.forEach((item, index) => {
            lines.push(`## ${index + 1}. ${item.selectedText || '未命名表达'}`);
            lines.push(`- 来源：${item.title || '知乎内容'}`);
            lines.push(`- 链接：${item.url || ''}`);
            lines.push(`- 收藏时间：${item.savedAt ? new Date(item.savedAt).toLocaleString() : ''}`);
            lines.push(`- 划词位置：${item.selectedInTranslation ? '译文' : '原文'}`);
            lines.push('');
            if (item.annotation) {
                lines.push('**AI 批注**');
                lines.push('');
                lines.push(`> ${String(item.annotation).replace(/\n/g, '\n> ')}`);
                lines.push('');
            }
            lines.push('**原段落**');
            lines.push('');
            lines.push(`> ${String(item.sourceText || '').replace(/\n/g, '\n> ') || '未捕获'}`);
            lines.push('');
            lines.push('**译文段落**');
            lines.push('');
            lines.push(`> ${String(item.translatedText || '').replace(/\n/g, '\n> ') || '暂无译文'}`);
            lines.push('');
        });
        return lines.join('\n');
    }

    function showExpressionBookModal() {
        if (document.getElementById('zh-expression-book-modal')) return;
        const items = loadExpressionBook();
        const rows = items.slice(0, 80).map((item, index) => `
            <div style="border:1px solid var(--zh-border);background:var(--zh-quote);border-radius:4px;padding:10px;margin-bottom:10px;">
                <div style="font-weight:bold;color:var(--zh-accent);">${index + 1}. ${escapeHTML(item.selectedText || '')}</div>
                <div style="font-size:13px;opacity:.75;">${escapeHTML(item.title || '')} · ${item.savedAt ? escapeHTML(new Date(item.savedAt).toLocaleString()) : ''}</div>
                <div style="margin-top:8px;"><strong>原文：</strong>${escapeHTML((item.sourceText || '').slice(0, 220))}</div>
                <div style="margin-top:6px;"><strong>译文：</strong>${escapeHTML((item.translatedText || '暂无译文').slice(0, 220))}</div>
                ${item.annotation ? `<div style="margin-top:6px;color:var(--zh-accent);"><strong>AI批注：</strong>${escapeHTML(item.annotation)}</div>` : ''}
            </div>
        `).join('');
        const modal = createModal('zh-expression-book-modal', '表达收藏本', `
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
                <button id="zh-expr-copy-md" class="zh-inline-btn">复制 Markdown</button>
                <button id="zh-expr-download-md" class="zh-inline-btn">下载 Markdown</button>
                <button id="zh-expr-download-json" class="zh-inline-btn">下载 JSON</button>
                <button id="zh-expr-clear" class="zh-inline-btn">清空</button>
            </div>
            <div style="font-size:13px;opacity:.75;margin-bottom:12px;">共 ${items.length} 条。列表只预览前 80 条，导出包含全部。</div>
            <div>${rows || '<div style="opacity:.7;">表达本还是空的。划词右键可以加入。</div>'}</div>
        `);
        document.getElementById('zh-expr-copy-md')?.addEventListener('click', async () => {
            await navigator.clipboard.writeText(formatExpressionBookMarkdown(loadExpressionBook()));
            alert('Markdown 已复制。');
        });
        document.getElementById('zh-expr-download-md')?.addEventListener('click', () => {
            downloadTextFile(`zhihu-expression-book-${new Date().toISOString().slice(0, 10)}.md`, formatExpressionBookMarkdown(loadExpressionBook()), 'text/markdown;charset=utf-8');
        });
        document.getElementById('zh-expr-download-json')?.addEventListener('click', () => {
            downloadTextFile(`zhihu-expression-book-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(loadExpressionBook(), null, 2), 'application/json;charset=utf-8');
        });
        document.getElementById('zh-expr-clear')?.addEventListener('click', () => {
            if (!confirm('确认清空表达本？')) return;
            saveExpressionBook([]);
            modal.remove();
            showExpressionBookModal();
        });
    }