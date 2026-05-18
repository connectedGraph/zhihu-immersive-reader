    function stableHash(text) {
        const str = String(text || '');
        let h1 = 0xdeadbeef;
        let h2 = 0x41c6ce57;
        for (let i = 0; i < str.length; i++) {
            const ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return `${(h2 >>> 0).toString(36)}${(h1 >>> 0).toString(36)}`;
    }

    function getFormNumber(id, fallback, min = 0) {
        const el = document.getElementById(id);
        const raw = (el?.value || '').trim();
        if (raw === '') return fallback;
        const value = Number(raw);
        return Number.isFinite(value) ? Math.max(min, value) : fallback;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function isQuestionPage() {
        return /\/question\/\d+/.test(location.pathname);
    }

    function isHomePage() {
        const host = location.hostname.replace(/^www\./, '');
        return host === 'zhihu.com' && location.pathname === '/';
    }

    function isPostPage() {
        return /\/p\/[^/]+/.test(location.pathname);
    }

    function isAnswerUrl() {
        return /\/question\/\d+\/answer\/\d+/.test(location.pathname);
    }

    function getMainQuestionUrl() {
        const match = location.href.match(/^(https?:\/\/[^?#]+\/question\/\d+)/);
        return match ? match[1] : location.origin + location.pathname.replace(/\/answer\/.*/, '');
    }

    function getQuestionCacheKey() {
        return `${getMainQuestionUrl().replace(/[#?].*$/, '')}::preview=${config.answerPreviewMode || 'excerpt'}`;
    }

    function getQuestionMainPageCacheKey() {
        return `${location.origin}${location.pathname.replace(/\/answer\/.*/, '').replace(/[#?].*$/, '')}::preview=${config.answerPreviewMode || 'excerpt'}`;
    }

    function getDocumentHeight() {
        return Math.max(
            document.body?.scrollHeight || 0,
            document.documentElement?.scrollHeight || 0,
            document.body?.offsetHeight || 0,
            document.documentElement?.offsetHeight || 0
        );
    }

    function forceScrollToBottom() {
        const height = getDocumentHeight();
        window.scrollTo(0, height);
        document.documentElement.scrollTop = height;
        document.body.scrollTop = height;
    }

    async function waitForElement(selector, timeout = 15000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const el = document.querySelector(selector);
            if (el) return el;
            await sleep(200);
        }
        return null;
    }

    async function waitForHomeFeedItems(targetCount = HOME_BATCH_SIZE, timeout = 25000, statusEl = null) {
        const start = Date.now();
        let lastCount = 0;
        let lastChangedAt = start;

        while (Date.now() - start < timeout) {
            const items = getHomeFeedItems();
            if (items.length >= targetCount) return items;

            if (items.length !== lastCount) {
                lastCount = items.length;
                lastChangedAt = Date.now();
            }

            if (statusEl) {
                statusEl.textContent = items.length
                    ? `正在等待首页推荐流稳定... ${Math.min(items.length, targetCount)}/${targetCount}`
                    : '正在等待首页推荐卡片...';
            }

            if (items.length > 0 && Date.now() - lastChangedAt > 1400) return items;
            await sleep(250);
        }

        return getHomeFeedItems();
    }

    function escapeHTML(text) {
        return String(text ?? '').replace(/[&<>"']/g, ch => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[ch]));
    }

    function saveConfig(newCfg) {
        config = Object.assign(config, newCfg);
        const json = JSON.stringify(config);
        if (typeof GM_setValue === 'function') GM_setValue('zh-immersive-config', json);
        localStorage.setItem('zh-immersive-config', json);
    }

    function cleanupAnswerClone(clone) {
        clone.querySelectorAll('script, style, .pc-article-answer-card, .pc-article-answer-text-chain, .pc-article-answer-big-img, .ecommerce-ad-box, .MCNLinkCard').forEach(el => el.remove());
        clone.querySelectorAll('.ContentItem-actions').forEach(el => {
            el.style.position = 'static';
            el.style.boxShadow = 'none';
            el.style.background = 'transparent';
        });
        clone.querySelectorAll('img').forEach(img => {
            const realSrc = img.getAttribute('data-original') || img.getAttribute('data-actualsrc');
            if (realSrc) img.src = realSrc;
        });
        return clone;
    }

    function createLivePlaceholder(node, prefix) {
        const placeholder = document.createElement('span');
        placeholder.id = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        placeholder.style.display = 'none';
        node.parentNode.insertBefore(placeholder, node);
        return placeholder;
    }

    function restoreLiveMount() {
        if (!_liveMountState) return;
        const { node, placeholder, origCssText } = _liveMountState;
        if (node && placeholder?.parentNode) {
            node.style.cssText = origCssText || '';
            placeholder.parentNode.insertBefore(node, placeholder);
            placeholder.remove();
        }
        _liveMountState = null;
    }

    function mountLiveNode(node, target) {
        restoreLiveMount();
        if (!node || !node.parentNode || !target) return false;
        _liveMountState = {
            node,
            placeholder: createLivePlaceholder(node, 'zh-live-node-placeholder'),
            origCssText: node.style.cssText || ''
        };
        node.style.display = '';
        node.style.position = 'static';
        node.style.boxShadow = 'none';
        node.style.background = 'transparent';
        target.appendChild(node);
        return true;
    }

    function cloneFromHTML(html) {
        const template = document.createElement('template');
        template.innerHTML = html || '<div></div>';
        return template.content.firstElementChild || document.createElement('div');
    }

    function getElementPageTop(el) {
        const rect = el.getBoundingClientRect();
        return Math.max(0, Math.round(window.scrollY + rect.top));
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


    function downloadBlobFile(filename, blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function downloadTextFile(filename, content, mime = 'text/plain;charset=utf-8') {
        downloadBlobFile(filename, new Blob([content], { type: mime }));
    }

    function sanitizeShareFilename(name) {
        return String(name || 'zhihu-share')
            .replace(/[\\/:*?"<>|]/g, '_')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 80) || 'zhihu-share';
    }

    function showCollectOverlay(text) {
        let overlay = document.getElementById('zh-question-collect-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'zh-question-collect-overlay';
            overlay.style.cssText = 'position:fixed;right:24px;bottom:24px;z-index:99999999;padding:12px 16px;background:#111;color:#fff;border-radius:4px;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.24);';
            document.body.appendChild(overlay);
        }
        overlay.textContent = text;
        return overlay;
    }

    function removeCollectOverlay() {
        const overlay = document.getElementById('zh-question-collect-overlay');
        if (overlay) overlay.remove();
    }

    function showToast(text, duration = 2200) {
        const existing = document.getElementById('zh-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.id = 'zh-toast';
        toast.textContent = text;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('zh-toast-show'));
        setTimeout(() => {
            toast.classList.remove('zh-toast-show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    function showConfirm(message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'zh-confirm-overlay';
        overlay.innerHTML = `
            <div class="zh-confirm-box">
                <p class="zh-confirm-text">${message}</p>
                <div class="zh-confirm-actions">
                    <button class="zh-confirm-btn" data-action="cancel">不保存，直接离开</button>
                    <button class="zh-confirm-btn zh-confirm-btn-primary" data-action="confirm">保存设置</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => {
            overlay.remove();
            if (onConfirm) onConfirm();
        });
        overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            overlay.remove();
            if (onCancel) onCancel();
        });
    }

    function isTypingTarget(target) {
        const el = target instanceof Element ? target : target?.parentElement;
        return !!el?.closest('input, textarea, select, [contenteditable="true"]');
    }

    function domToMarkdown(root, options = {}) {
        const includeImages = options.includeImages !== false;
        let imgCounter = 0;
        const lines = [];

        function processNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent.replace(/\n/g, ' ');
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return '';
            const tag = node.tagName;
            if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'BUTTON'].includes(tag)) return '';
            if (node.classList.contains('zh-hidden-by-immersive-inner') ||
                node.classList.contains('zh-tr-card') ||
                node.classList.contains('ContentItem-actions') ||
                node.classList.contains('zh-question-toolbar') ||
                node.classList.contains('zh-reader-top-nav') ||
                node.classList.contains('zh-img-placeholder')) return '';

            if (tag === 'IMG') {
                if (!includeImages) return '';
                const src = node.getAttribute('data-original') || node.getAttribute('data-actualsrc') || node.src || '';
                if (!src || /^data:/.test(src)) return '';
                imgCounter++;
                return `![图片#${imgCounter}](${src})`;
            }
            if (tag === 'BR') return '\n';
            if (tag === 'HR') return '\n---\n';

            const children = Array.from(node.childNodes).map(processNode).join('');

            if (tag === 'FIGURE') {
                return '\n' + children.trim() + '\n';
            }
            if (/^H[1-6]$/.test(tag)) {
                const level = parseInt(tag[1]);
                const prefix = '#'.repeat(level);
                return `\n${prefix} ${children.trim()}\n`;
            }
            if (tag === 'P') return '\n' + children.trim() + '\n';
            if (tag === 'BLOCKQUOTE') {
                return '\n' + children.trim().split('\n').map(l => '> ' + l).join('\n') + '\n';
            }
            if (tag === 'PRE') {
                const code = node.querySelector('code');
                const lang = code?.className?.match(/language-(\w+)/)?.[1] || '';
                const text = (code || node).textContent;
                return `\n\`\`\`${lang}\n${text}\n\`\`\`\n`;
            }
            if (tag === 'CODE' && node.parentElement?.tagName !== 'PRE') {
                return '`' + node.textContent + '`';
            }
            if (tag === 'STRONG' || tag === 'B') return `**${children.trim()}**`;
            if (tag === 'EM' || tag === 'I') return `*${children.trim()}*`;
            if (tag === 'S' || tag === 'DEL') return `~~${children.trim()}~~`;
            if (tag === 'A') {
                const href = node.getAttribute('href') || '';
                const text = children.trim();
                if (!href || href.startsWith('javascript:')) return text;
                return `[${text}](${href})`;
            }
            if (tag === 'UL' || tag === 'OL') return '\n' + children + '\n';
            if (tag === 'LI') {
                const parent = node.parentElement;
                const prefix = parent?.tagName === 'OL'
                    ? `${Array.from(parent.children).indexOf(node) + 1}. `
                    : '- ';
                return prefix + children.trim() + '\n';
            }
            if (tag === 'TABLE') return '\n' + tableToMarkdown(node) + '\n';
            if (tag === 'DIV' || tag === 'SECTION' || tag === 'ARTICLE') {
                return '\n' + children + '\n';
            }
            return children;
        }

        function tableToMarkdown(table) {
            const rows = Array.from(table.querySelectorAll('tr'));
            if (!rows.length) return '';
            const result = [];
            rows.forEach((row, i) => {
                const cells = Array.from(row.querySelectorAll('th, td'))
                    .map(cell => cell.textContent.replace(/\|/g, '\\|').replace(/\n/g, ' ').trim());
                result.push('| ' + cells.join(' | ') + ' |');
                if (i === 0) {
                    result.push('| ' + cells.map(() => '---').join(' | ') + ' |');
                }
            });
            return result.join('\n');
        }

        const raw = processNode(root);
        return raw.replace(/\n{3,}/g, '\n\n').trim();
    }

    function getArticleTitle() {
        const titleEl = document.querySelector('#immersive-wrapper .Post-Title') ||
                        document.querySelector('#immersive-wrapper h1');
        return titleEl?.textContent?.trim() || document.title.replace(/ - 知乎$/, '').trim();
    }

    function copyMarkdownFromPage(includeImages) {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) return;

        let md = '';
        if (_questionState.view === 'answer') {
            const title = _questionState.questionTitle || getArticleTitle();
            md = `# ${title}\n\n`;
            const answerView = wrapper.querySelector('.zh-question-answer-view');
            if (answerView) {
                const answer = _questionState.answers[_questionState.currentIndex];
                if (answer?.author) md += `> 作者: ${answer.author}\n\n`;
                md += domToMarkdown(answerView, { includeImages });
            }
        } else {
            const title = getArticleTitle();
            const richText = wrapper.querySelector('.Post-RichTextContainer') ||
                             wrapper.querySelector('.RichText.ztext') ||
                             wrapper.querySelector('.RichText') ||
                             wrapper.querySelector('.Post-Main');
            md = `# ${title}\n\n`;
            if (richText) md += domToMarkdown(richText, { includeImages });
        }

        navigator.clipboard.writeText(md).then(() => {
            showToast(includeImages ? 'Markdown 已复制（含图片）' : 'Markdown 已复制（无图片）');
        }).catch(() => {
            showToast('复制失败，请手动复制');
        });
    }

    function createCopyMarkdownBtn() {
        const container = document.createElement('div');
        container.className = 'zh-copy-md-container';

        const mainBtn = document.createElement('button');
        mainBtn.className = 'zh-copy-md-btn';
        mainBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>复制 MD</span>';
        mainBtn.title = '复制为 Markdown（含图片）';
        mainBtn.addEventListener('click', () => copyMarkdownFromPage(true));

        const dropBtn = document.createElement('button');
        dropBtn.className = 'zh-copy-md-drop';
        dropBtn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>';
        dropBtn.title = '更多选项';

        const menu = document.createElement('div');
        menu.className = 'zh-copy-md-menu';
        menu.innerHTML = '<div class="zh-copy-md-option" data-mode="images">复制 Markdown（含图片）</div><div class="zh-copy-md-option" data-mode="no-images">复制 Markdown（忽略图片）</div>';

        menu.addEventListener('click', (e) => {
            const option = e.target.closest('.zh-copy-md-option');
            if (!option) return;
            const mode = option.dataset.mode;
            copyMarkdownFromPage(mode === 'images');
            menu.classList.remove('zh-copy-md-menu-show');
        });

        dropBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('zh-copy-md-menu-show');
        });

        document.addEventListener('click', () => menu.classList.remove('zh-copy-md-menu-show'));

        container.appendChild(mainBtn);
        container.appendChild(dropBtn);
        container.appendChild(menu);
        return container;
    }