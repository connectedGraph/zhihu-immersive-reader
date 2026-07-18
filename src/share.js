
    function getCurrentThemeVarsText() {
        const vars = THEMES[currentThemeIndex]?.vars || THEMES[0].vars;
        return Object.entries(vars).map(([key, value]) => `${key}: ${value};`).join('\n');
    }

    function getZeroLossShareCSS() {
        return `
            :root { ${getCurrentThemeVarsText()} }
            :root { --zh-meta: #736b58; --zh-link: #a13d3d; }
            * { box-sizing: border-box; }
            body, .zh-share-svg-root { margin: 0; background: var(--zh-bg); color: var(--zh-text); font-family: 'Times New Roman', 'STKaiti', 'KaiTi', '楷体', serif; padding: 40px 20px; }
            .zh-share-page { width: 860px; margin: 0 auto; padding: 60px 80px; background: var(--zh-paper); border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,.08); border-left: 4px solid var(--zh-accent); color: var(--zh-text); }
            .zh-share-question-title { font-size: 32px; font-weight: bold; color: var(--zh-title); margin: 0 0 30px; padding-bottom: 20px; border-bottom: 2px solid var(--zh-accent); line-height: 1.5; letter-spacing: 0; }
            .ContentItem-meta { background: var(--zh-quote); padding: 20px 25px; border-radius: 8px; margin-bottom: 40px; border: 1px solid var(--zh-border); }
            .AuthorInfo { display: flex; align-items: center; gap: 15px; }
            .AuthorInfo-avatar { width: 50px; height: 50px; object-fit: cover; border-radius: 5px; border: 2px solid var(--zh-paper); box-shadow: 0 2px 5px rgba(0,0,0,.1); }
            .AuthorInfo-content { flex: 1; min-width: 0; }
            .AuthorInfo-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
            .AuthorInfo-name a, .AuthorInfo-name { font-size: 18px; font-weight: bold; color: var(--zh-title); text-decoration: none; border: 0; }
            .AuthorInfo-badgeText { font-size: 14px; color: var(--zh-meta); line-height: 1.45; }
            .zh-share-meta-lines { margin-top: 12px; display: grid; gap: 6px; font-family: sans-serif; font-size: 13px; color: var(--zh-accent); }
            .zh-share-meta-line { display: flex; align-items: center; gap: 6px; }
            .zh-share-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; padding-top: 18px; border-top: 1px dashed var(--zh-border); font-family: sans-serif; }
            .zh-share-action-chip { border: 1px solid var(--zh-border); color: var(--zh-accent); background: var(--zh-quote); border-radius: 999px; padding: 4px 10px; font-size: 13px; line-height: 1.4; }
            .RichContent-inner, .Post-RichTextContainer, .RichText { font-size: 18px; line-height: 2; color: var(--zh-text); text-align: justify; }
            .RichContent-inner p, .Post-RichTextContainer p, .RichText p { margin: 1.4em 0; }
            .RichContent-inner a, .Post-RichTextContainer a, .RichText a { color: var(--zh-link); text-decoration: none; border-bottom: 1px dashed var(--zh-link); }
            .RichContent-inner blockquote, .Post-RichTextContainer blockquote, .RichText blockquote { border-left: 4px solid var(--zh-accent); background: var(--zh-quote); padding: 15px 20px; margin: 25px 0; font-style: italic; color: #4a4539; }
            .zh-share-page pre, .zh-share-page code { background: var(--zh-code); font-family: Consolas, monospace; }
            .zh-share-page pre { padding: 1em 1.2em; border-radius: 6px; overflow-x: auto; line-height: 1.5; }
            .zh-share-page img { max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,.1); }
            .zh-share-page img.Avatar, .zh-share-page .Avatar img, .zh-share-page .AuthorInfo-avatarWrapper img { width: 50px; height: 50px; min-width: 50px; object-fit: cover; border-radius: 5px; box-shadow: none; }
            .zh-share-page .css-4gq0sj, .zh-share-page .css-2dtzk2, .zh-share-page .ZDI--FourPointedStar16, .zh-share-page .Button, .zh-share-page .Popover, .zh-share-page .ModalLoading-content, .zh-share-page .css-8atqhb, .zh-share-page .ContentItem-actions { display: none !important; }
            .ContentItem-time { margin-top: 40px; font-size: 14px; color: var(--zh-meta); font-family: sans-serif; }
            .ContentItem-time a { color: inherit; text-decoration: none; border: 0; }
            .zh-share-warning { margin-top: 24px; padding: 10px 14px; border: 1px dashed var(--zh-border); border-radius: 6px; background: var(--zh-quote); color: var(--zh-meta); font-size: 13px; line-height: 1.6; font-family: sans-serif; }
            .zh-share-source { margin-top: 30px; padding-top: 20px; border-top: 1px dashed var(--zh-border); color: var(--zh-meta); font-size: 13px; word-break: break-all; font-family: Consolas, monospace; }
            .zh-share-page table { width: 100%; border-collapse: collapse; }
            .zh-share-page th, .zh-share-page td { border: 1px solid var(--zh-border); padding: 6px 8px; }
            @media (max-width: 768px) { body { padding: 0; } .zh-share-page { width: 100%; padding: 30px 20px; border-left: none; border-top: 4px solid var(--zh-accent); border-radius: 0; } }
        `;
    }

    function cleanupZeroLossShareClone(root) {
        const removeSelectors = [
            'script',
            'style',
            'noscript',
            'iframe',
            'video',
            'audio',
            'canvas',
            'object',
            'embed',
            '.zh-tr-card',
            '.zh-img-placeholder',
            '.zh-question-toolbar',
            '.zh-home-toolbar',
            '.zh-reader-top-nav',
            '#zh-article-placeholder',
            '#zh-action-placeholder',
            '#zh-comments-placeholder',
            '#zh-comment-input-placeholder',
            '[id^="zh-live-node-placeholder"]',
            '.zh-question-detail',
            '.Comments-container',
            '.CommentEditor',
            '.RichText-MCNLinkCardContainer',
            '.pc-article-answer-card',
            '.pc-article-answer-text-chain',
            '.pc-article-answer-big-img',
            '.ecommerce-ad-box',
            '.MCNLinkCard',
            '.Button',
            '.Popover',
            '.FollowButton',
            '.OptionsButton',
            '.ModalLoading-content',
            '.ContentItem-actions',
            '.RichContent-collapsedText',
            '.css-4gq0sj',
            '.css-2dtzk2',
            '.css-8atqhb',
            '.ZDI--FourPointedStar16',
            'meta',
            '.zh-hidden-by-immersive-inner',
            ...EXPORT_HIDDEN_SELECTORS
        ];
        removeSelectors.forEach(selector => {
            try {
                root.querySelectorAll(selector).forEach(el => el.remove());
            } catch (err) {
                console.warn('知乎零损分享：跳过不兼容的导出隐藏选择器', selector, err);
            }
        });

        root.querySelectorAll('img').forEach(img => {
            const realSrc = img.getAttribute('data-original') || img.getAttribute('data-actualsrc') || img.getAttribute('data-src') || img.getAttribute('src');
            if (realSrc) img.setAttribute('src', realSrc);
        });

        root.querySelectorAll('*').forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                const name = attr.name.toLowerCase();
                const value = attr.value || '';
                if (
                    name.startsWith('on')
                    || name === 'contenteditable'
                    || name === 'tabindex'
                    || name === 'style'
                    || name.startsWith('data-')
                    || name.startsWith('aria-')
                    || name === 'role'
                    || name === 'itemprop'
                    || name === 'itemscope'
                    || name === 'itemtype'
                ) {
                    el.removeAttribute(attr.name);
                    return;
                }
                if ((name === 'href' || name === 'src') && value && !/^(data:|blob:|#|mailto:|javascript:)/i.test(value)) {
                    try { el.setAttribute(attr.name, new URL(value, location.href).href); } catch (err) {}
                }
            });
        });

        root.querySelectorAll('img').forEach(img => {
            img.classList.remove('zh-img-hidden');
            img.removeAttribute('data-zh-img-hidden');
        });

        return root;
    }

    function normalizeShareText(text) {
        return String(text || '').replace(/\u200b/g, '').replace(/\s+/g, ' ').trim();
    }

    function getShareImageSrc(img) {
        if (!img) return '';
        return img.getAttribute('src') || img.getAttribute('data-original') || img.getAttribute('data-actualsrc') || img.getAttribute('data-src') || '';
    }

    function findShareAuthorRoot(root) {
        return root?.querySelector?.('.ContentItem-meta .AuthorInfo[itemtype*="Person"], .AnswerItem-authorInfo .AuthorInfo, .Post-Header .AuthorInfo, .AuthorInfo[itemtype*="Person"], .AuthorInfo') || null;
    }

    function extractShareAuthor(root) {
        const authorRoot = findShareAuthorRoot(root);
        if (!authorRoot) return null;
        const avatar = authorRoot.querySelector('img.Avatar, .AuthorInfo-avatarWrapper img, img');
        const name = authorRoot.querySelector('meta[itemprop="name"]')?.content
            || authorRoot.querySelector('.AuthorInfo-name, .UserLink.AuthorInfo-name, .UserLink-link')?.innerText
            || '';
        const headline = authorRoot.querySelector('.AuthorInfo-badgeText, .AuthorInfo-detail, .AuthorInfo-badge')?.innerText || '';
        const url = authorRoot.querySelector('meta[itemprop="url"]')?.content
            || authorRoot.querySelector('a[href*="/people/"], .UserLink-link[href]')?.href
            || '';
        const avatarSrc = getShareImageSrc(avatar);
        if (!name && !avatarSrc && !headline) return null;
        return {
            name: normalizeShareText(name) || '知乎作者',
            headline: normalizeShareText(headline),
            url,
            avatarSrc,
            avatarAlt: avatar?.alt || normalizeShareText(name)
        };
    }

    function getShareMetaLines(root) {
        const lines = [];
        const voteLine = normalizeShareText(root?.querySelector?.('.ContentItem-meta .css-dvccr2, .ContentItem-meta .css-1lr85n')?.innerText);
        const columnLine = normalizeShareText(root?.querySelector?.('.ContentItem-meta .css-140fcia, .css-3ibr72 .css-1b0xgmx')?.innerText);
        const upvote = root?.querySelector?.('meta[itemprop="upvoteCount"]')?.content;
        const comment = root?.querySelector?.('meta[itemprop="commentCount"]')?.content;
        if (voteLine) lines.push(voteLine);
        else if (upvote) lines.push(`${upvote} 人赞同`);
        if (columnLine) lines.push(columnLine);
        if (comment) lines.push(`${comment} 条评论`);
        return Array.from(new Set(lines.filter(Boolean))).slice(0, 4);
    }

    function buildShareAuthorCard(root) {
        const author = extractShareAuthor(root);
        const lines = getShareMetaLines(root);
        if (!author && !lines.length) return null;

        const card = document.createElement('div');
        card.className = 'ContentItem-meta';
        if (author) {
            const info = document.createElement('div');
            info.className = 'AuthorInfo';
            const avatarWrap = document.createElement(author.url ? 'a' : 'span');
            avatarWrap.className = 'AuthorInfo-avatarWrapper';
            if (author.url) {
                avatarWrap.href = author.url;
                avatarWrap.target = '_blank';
                avatarWrap.rel = 'noopener noreferrer';
            }
            if (author.avatarSrc) {
                const img = document.createElement('img');
                img.className = 'Avatar AuthorInfo-avatar';
                img.src = author.avatarSrc;
                img.alt = author.avatarAlt || author.name;
                avatarWrap.appendChild(img);
            }
            const content = document.createElement('div');
            content.className = 'AuthorInfo-content';
            const head = document.createElement('div');
            head.className = 'AuthorInfo-head';
            const name = document.createElement(author.url ? 'a' : 'span');
            name.className = 'AuthorInfo-name';
            if (author.url) {
                name.href = author.url;
                name.target = '_blank';
                name.rel = 'noopener noreferrer';
            }
            name.textContent = author.name;
            head.appendChild(name);
            content.appendChild(head);
            if (author.headline) {
                const detail = document.createElement('div');
                detail.className = 'AuthorInfo-badgeText';
                detail.textContent = author.headline;
                content.appendChild(detail);
            }
            info.appendChild(avatarWrap);
            info.appendChild(content);
            card.appendChild(info);
        }

        if (lines.length) {
            const meta = document.createElement('div');
            meta.className = 'zh-share-meta-lines';
            lines.forEach(line => {
                const item = document.createElement('div');
                item.className = 'zh-share-meta-line';
                item.textContent = line;
                meta.appendChild(item);
            });
            card.appendChild(meta);
        }
        return card;
    }

    function getShareRichSource(root) {
        return root?.querySelector?.('.RichContent-inner, .Post-RichTextContainer .RichText, .Post-RichTextContainer, .RichText.ztext, .RichText, [itemprop="text"]') || null;
    }

    function buildShareBody(root) {
        const source = getShareRichSource(root);
        if (!source) return null;
        const rich = document.createElement('div');
        rich.className = 'RichContent';
        const inner = document.createElement('div');
        inner.className = 'RichContent-inner';
        const clone = cleanupZeroLossShareClone(source.cloneNode(true));
        if (clone.classList.contains('RichContent-inner')) {
            Array.from(clone.childNodes).forEach(node => inner.appendChild(node));
        } else {
            inner.appendChild(clone);
        }
        rich.appendChild(inner);
        cleanupZeroLossShareClone(rich);
        return rich;
    }

    function getShareActionLabels(root) {
        const action = root?.matches?.('.ContentItem-actions, .RichContent-actions')
            ? root
            : root?.querySelector?.('.ContentItem-actions, .RichContent-actions');
        if (!action) return [];
        const blocked = /^(反对|更多|分享|收起|展开|举报|添加评论|写评论)$/;
        const labels = Array.from(action.querySelectorAll('button, a, [aria-label]'))
            .map(el => normalizeShareText(el.innerText || el.getAttribute('aria-label') || el.textContent))
            .filter(text => text && !blocked.test(text) && text.length <= 24);
        return Array.from(new Set(labels)).slice(0, 6);
    }

    function buildShareActions(root) {
        const labels = getShareActionLabels(root);
        if (!labels.length) return null;
        const box = document.createElement('div');
        box.className = 'zh-share-actions';
        labels.forEach(label => {
            const chip = document.createElement('span');
            chip.className = 'zh-share-action-chip';
            chip.textContent = label;
            box.appendChild(chip);
        });
        return box;
    }

    function buildShareTime(root) {
        const time = root?.querySelector?.('.ContentItem-time, .Post-Sub, time');
        if (!time) return null;
        const clone = cleanupZeroLossShareClone(time.cloneNode(true));
        clone.classList.add('ContentItem-time');
        return clone;
    }

    function appendShareTitle(container, text) {
        const title = document.createElement('h1');
        title.className = 'zh-share-question-title';
        title.textContent = normalizeShareText(text) || '知乎内容';
        container.appendChild(title);
        return title.textContent;
    }

    function getZeroLossShareContent() {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper) throw new Error('请先进入沉浸模式。');

        const container = document.createElement('div');
        container.className = 'zh-share-content';
        let title = document.title || '知乎分享';
        let sourceType = '';
        let contentRoot = null;
        let actionRoot = null;

        if (isPostPage()) {
            const article = (_articleNode && _articleNode.closest('#immersive-wrapper'))
                ? _articleNode
                : wrapper.querySelector('.Post-Main.Post-NormalMain, .Post-Main, .Post-RichTextContainer');
            if (!article) throw new Error('未找到可分享的文章正文。');
            contentRoot = article;
            actionRoot = (_actionBarNode && _actionBarNode.closest('#immersive-wrapper'))
                ? _actionBarNode
                : wrapper.querySelector('.ContentItem-actions, .RichContent-actions');
            title = appendShareTitle(container, article.querySelector('h1, .Post-Title')?.innerText || document.title || '知乎文章');
            sourceType = 'article';
        } else if (isQuestionPage()) {
            if (_questionState.view !== 'answer') throw new Error('请先打开某个回答正文，再使用零损分享。');
            const answerView = wrapper.querySelector('.zh-question-answer-view');
            if (!answerView) throw new Error('未找到可分享的回答正文。');
            contentRoot = answerView;
            actionRoot = answerView;
            title = appendShareTitle(container, wrapper.querySelector('.zh-question-title, h1')?.innerText || document.title || '知乎回答');
            sourceType = 'answer';
        } else {
            throw new Error('零损分享目前只支持 /p 文章页和回答正文页。');
        }

        const authorCard = buildShareAuthorCard(contentRoot);
        if (authorCard) container.appendChild(authorCard);
        const body = buildShareBody(contentRoot);
        if (!body) throw new Error('未找到可分享的正文。');
        container.appendChild(body);
        const time = buildShareTime(contentRoot);
        if (time) container.appendChild(time);
        const actions = buildShareActions(actionRoot || contentRoot);
        if (actions) container.appendChild(actions);

        const source = document.createElement('div');
        source.className = 'zh-share-source';
        source.textContent = `来源：${location.href}`;
        container.appendChild(source);
        return { title, sourceType, node: container };
    }

    function blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('图片转 dataURL 失败'));
            reader.readAsDataURL(blob);
        });
    }

    function gmFetchBlob(url) {
        return new Promise((resolve, reject) => {
            const xhr = getUserscriptXHR();
            if (!xhr) {
                fetch(url, { credentials: 'include', cache: 'force-cache' })
                    .then(res => res.ok ? res.blob() : Promise.reject(new Error(`HTTP ${res.status}`)))
                    .then(resolve)
                    .catch(reject);
                return;
            }

            xhr({
                method: 'GET',
                url,
                timeout: 30000,
                anonymous: false,
                responseType: 'blob',
                headers: { 'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' },
                onload: res => {
                    if (res.status < 200 || res.status >= 300) {
                        reject(new Error(`HTTP ${res.status}`));
                        return;
                    }
                    if (res.response instanceof Blob) {
                        resolve(res.response);
                        return;
                    }
                    reject(new Error('图片响应不是 Blob'));
                },
                onerror: err => reject(new Error(`图片抓取失败：${err?.error || err?.message || '未知错误'}`)),
                ontimeout: () => reject(new Error('图片抓取超时'))
            });
        });
    }

    async function fetchShareImageDataURL(src) {
        if (!src || /^(data:|blob:)/i.test(src)) return src;
        const absolute = new URL(src, location.href).href;
        if (_shareImageDataUrlCache.has(absolute)) return _shareImageDataUrlCache.get(absolute);
        const promise = gmFetchBlob(absolute).then(blobToDataURL);
        _shareImageDataUrlCache.set(absolute, promise);
        return promise;
    }

    function getShareSrcsetFirstUrl(srcset) {
        return String(srcset || '').split(',')[0]?.trim().split(/\s+/)[0] || '';
    }

    function buildShareImagePlaceholderDataURL(width = 640, height = 360) {
        const rawW = Number.parseFloat(width);
        const rawH = Number.parseFloat(height);
        const w = Math.max(80, Math.round(Number.isFinite(rawW) ? rawW : 640));
        const h = Math.max(50, Math.round(Number.isFinite(rawH) ? rawH : Math.min(w * 0.56, 360)));
        const label = w < 140 || h < 80 ? '图' : '图片未能内嵌';
        const fontSize = w < 140 || h < 80 ? 13 : 15;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" rx="8" fill="#f0ebe1"/><rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="8" fill="none" stroke="#d4cbb8" stroke-dasharray="8 8"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="${fontSize}" fill="#736b58">${label}</text></svg>`;
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    function getImageFallbackSize(img) {
        const rect = img.getBoundingClientRect?.();
        return {
            width: Number(img.getAttribute('width')) || Math.round(rect?.width || 0) || (img.classList?.contains('Avatar') ? 50 : 640),
            height: Number(img.getAttribute('height')) || Math.round(rect?.height || 0) || (img.classList?.contains('Avatar') ? 50 : 360)
        };
    }

    async function inlineShareImages(root, options = {}) {
        const stats = { replaced: 0 };
        const replaceImgWithPlaceholder = img => {
            const size = getImageFallbackSize(img);
            img.setAttribute('src', buildShareImagePlaceholderDataURL(size.width, size.height));
            img.setAttribute('alt', `${img.getAttribute('alt') || '图片'}（PNG 导出时未能内嵌，已用占位图替换）`);
            stats.replaced++;
        };

        root.querySelectorAll('source').forEach(el => el.remove());
        const imgs = Array.from(root.querySelectorAll('img'));
        const tasks = imgs.map(img => async () => {
            const src = img.getAttribute('src') || getShareSrcsetFirstUrl(img.getAttribute('srcset')) || img.src;
            img.removeAttribute('srcset');
            img.removeAttribute('loading');
            img.removeAttribute('decoding');
            img.removeAttribute('crossorigin');
            if (!src) {
                if (options.strict) replaceImgWithPlaceholder(img);
                return;
            }
            try {
                const dataUrl = await fetchShareImageDataURL(src);
                if (dataUrl) img.setAttribute('src', dataUrl);
            } catch (err) {
                console.warn('知乎零损分享：图片内嵌失败', src, err);
                if (options.strict) {
                    replaceImgWithPlaceholder(img);
                } else {
                    img.setAttribute('src', src);
                }
            }
        });

        for (let i = 0; i < tasks.length; i += 4) {
            await Promise.all(tasks.slice(i, i + 4).map(task => task()));
        }

        const svgImages = Array.from(root.querySelectorAll('image'));
        await Promise.all(svgImages.map(async image => {
            const href = image.getAttribute('href') || image.getAttribute('xlink:href') || image.getAttributeNS?.('http://www.w3.org/1999/xlink', 'href');
            if (!href || /^(data:|blob:|#)/i.test(href)) return;
            try {
                const dataUrl = await fetchShareImageDataURL(href);
                image.setAttribute('href', dataUrl);
                image.setAttributeNS?.('http://www.w3.org/1999/xlink', 'href', dataUrl);
            } catch (err) {
                console.warn('知乎零损分享：SVG 图片内嵌失败', href, err);
                if (options.strict) {
                    const dataUrl = buildShareImagePlaceholderDataURL(image.getAttribute('width'), image.getAttribute('height'));
                    image.setAttribute('href', dataUrl);
                    image.setAttributeNS?.('http://www.w3.org/1999/xlink', 'href', dataUrl);
                    stats.replaced++;
                }
            }
        }));

        if (options.strict) {
            root.querySelectorAll('a[href]').forEach(a => a.removeAttribute('href'));
            root.querySelectorAll('img').forEach(img => {
                const src = img.getAttribute('src') || '';
                if (src && !/^data:/i.test(src)) replaceImgWithPlaceholder(img);
            });
            root.querySelectorAll('image').forEach(image => {
                const href = image.getAttribute('href') || image.getAttribute('xlink:href') || '';
                if (href && !/^data:/i.test(href)) {
                    const dataUrl = buildShareImagePlaceholderDataURL(image.getAttribute('width'), image.getAttribute('height'));
                    image.setAttribute('href', dataUrl);
                    image.setAttributeNS?.('http://www.w3.org/1999/xlink', 'href', dataUrl);
                    stats.replaced++;
                }
            });
        }
        return stats;
    }

    function stripShareImagesForPng(root) {
        let removed = 0;
        root.querySelectorAll('a[href]').forEach(a => a.removeAttribute('href'));
        root.querySelectorAll('picture, source, link').forEach(el => el.remove());
        root.querySelectorAll('img, image, svg use, svg').forEach(el => {
            if (el.tagName.toLowerCase() === 'use') { el.remove(); return; }
            if (el.tagName.toLowerCase() === 'svg') {
                const hasExtRef = el.querySelector('use[href], use[xlink\\:href], image[href], image[xlink\\:href]');
                if (hasExtRef) { el.remove(); removed++; return; }
                return;
            }
            removed++;
            el.remove();
        });
        root.querySelectorAll('*').forEach(el => {
            ['src', 'href', 'xlink:href', 'poster', 'background'].forEach(attr => {
                const val = el.getAttribute(attr);
                if (val && !/^(data:|blob:|#|$)/i.test(val.trim())) {
                    el.removeAttribute(attr);
                }
            });
        });
        root.querySelectorAll('figure').forEach(figure => {
            if (!normalizeShareText(figure.innerText || figure.textContent)) figure.remove();
        });
        root.querySelectorAll('a, span').forEach(el => {
            if (!el.children.length && !normalizeShareText(el.textContent)) el.remove();
        });
        root.querySelectorAll('p, div').forEach(el => {
            if (el.classList?.contains('zh-share-content') || el.classList?.contains('zh-share-page')) return;
            if (!el.children.length && !normalizeShareText(el.textContent)) el.remove();
        });
        return { removed };
    }

    async function renderZeroLossSharePage(contentNode, options = {}) {
        const frame = document.createElement('div');
        frame.style.cssText = 'position:absolute;left:-12000px;top:0;width:900px;visibility:hidden;pointer-events:none;';
        const style = document.createElement('style');
        style.textContent = getZeroLossShareCSS();
        const root = document.createElement('div');
        root.className = 'zh-share-svg-root';
        const page = document.createElement('div');
        page.className = 'zh-share-page';
        page.appendChild(contentNode);
        frame.appendChild(style);
        root.appendChild(page);
        frame.appendChild(root);
        document.body.appendChild(frame);
        let imageFallbackCount = 0;
        let imageRemovedCount = 0;
        if (options.stripImages) {
            const stripStats = stripShareImagesForPng(page);
            imageRemovedCount = stripStats.removed || 0;
            if (imageRemovedCount > 0) {
                const note = document.createElement('div');
                note.className = 'zh-share-warning';
                note.textContent = `${options.format === 'webp' ? 'WebP' : 'PNG'} 长图说明：为保证浏览器稳定导出，已忽略 ${imageRemovedCount} 张图片；HTML/SVG 导出通常可保留原图链接。`;
                const source = page.querySelector('.zh-share-source');
                if (source?.parentNode) source.parentNode.insertBefore(note, source);
                else page.appendChild(note);
            }
        } else if (options.inlineImages) {
            const imageStats = await inlineShareImages(page, { strict: false });
            imageFallbackCount = imageStats?.replaced || 0;
        }
        const width = 900;
        const height = Math.max(640, Math.ceil(root.scrollHeight + 2));
        const html = page.outerHTML;
        const xhtml = serializeZeroLossShareXHTML(page);
        frame.remove();
        return { width, height, html, xhtml, imageFallbackCount, imageRemovedCount };
    }

    function serializeZeroLossShareXHTML(pageNode) {
        const root = document.createElement('div');
        root.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
        root.className = 'zh-share-svg-root';
        const style = document.createElement('style');
        style.textContent = getZeroLossShareCSS();
        root.appendChild(style);
        root.appendChild(pageNode.cloneNode(true));
        return new XMLSerializer().serializeToString(root);
    }

    function buildZeroLossShareHTML(page) {
        return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>知乎零损分享 - 纯净阅读版</title>
<style>${getZeroLossShareCSS()}</style>
</head>
<body>${page.html}</body>
</html>`;
    }

    function buildZeroLossShareSVG(page) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}" height="${page.height}" viewBox="0 0 ${page.width} ${page.height}">
<foreignObject width="100%" height="100%">
${page.xhtml}
</foreignObject>
</svg>`;
    }

    function renderSvgToImageBlob(svgText, width, height, mimeType, quality = 0.92) {
        return new Promise((resolve, reject) => {
            const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => {
                try {
                    const maxSide = 30000;
                    const preferredScale = Math.min(window.devicePixelRatio || 1, 2);
                    const scale = Math.min(preferredScale, maxSide / Math.max(width, height));
                    if (!Number.isFinite(scale) || scale <= 0) throw new Error('画布尺寸异常');

                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, Math.ceil(width * scale));
                    canvas.height = Math.max(1, Math.ceil(height * scale));
                    const ctx = canvas.getContext('2d');
                    if (!ctx) throw new Error('无法创建 Canvas');
                    ctx.setTransform(scale, 0, 0, scale, 0, 0);
                    ctx.drawImage(img, 0, 0, width, height);
                    URL.revokeObjectURL(url);
                    canvas.toBlob(blob => {
                        if (!blob) {
                            reject(new Error(`${mimeType === 'image/webp' ? 'WebP' : 'PNG'} Blob 生成失败`));
                            return;
                        }
                        if (mimeType === 'image/webp' && blob.type !== 'image/webp') {
                            reject(new Error('当前浏览器不支持 WebP Canvas 导出，请改用 PNG、SVG 或 HTML 格式。'));
                            return;
                        }
                        resolve(blob);
                    }, mimeType, quality);
                } catch (err) {
                    URL.revokeObjectURL(url);
                    if (err.message?.includes('Tainted') || err.name === 'SecurityError') {
                        reject(new Error(`${mimeType === 'image/webp' ? 'WebP' : 'PNG'} 导出被浏览器安全策略阻止（Canvas 被污染）。请尝试使用 SVG 或 HTML 格式导出。`));
                    } else {
                        reject(err);
                    }
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('SVG 渲染为 PNG 失败'));
            };
            img.src = url;
        });
    }

    async function runZeroLossShare() {
        try {
            const content = getZeroLossShareContent();
            const format = ['html', 'svg', 'png', 'webp'].includes(config.shareExportFormat) ? config.shareExportFormat : 'svg';
            const isRasterFormat = format === 'png' || format === 'webp';
            if (isRasterFormat) showCollectOverlay(`正在准备 ${format === 'webp' ? 'WebP' : 'PNG'} 长图...`);
            const page = await renderZeroLossSharePage(content.node, {
                inlineImages: format === 'svg',
                stripImages: isRasterFormat,
                format
            });
            const filename = `${sanitizeShareFilename(content.title || content.sourceType)}.${format}`;
            if (format === 'html') {
                downloadTextFile(filename, buildZeroLossShareHTML(page), 'text/html;charset=utf-8');
            } else if (isRasterFormat) {
                showCollectOverlay(`正在渲染 ${format === 'webp' ? 'WebP' : 'PNG'} 长图...`);
                const svgText = buildZeroLossShareSVG(page);
                const blob = await renderSvgToImageBlob(
                    svgText,
                    page.width,
                    page.height,
                    format === 'webp' ? 'image/webp' : 'image/png'
                );
                downloadBlobFile(filename, blob);
            } else {
                downloadTextFile(filename, buildZeroLossShareSVG(page), 'image/svg+xml;charset=utf-8');
            }
            const imageTip = page.imageRemovedCount ? `（已忽略 ${page.imageRemovedCount} 张图片）` : (page.imageFallbackCount ? `（${page.imageFallbackCount} 张图片已占位）` : '');
            showCollectOverlay(`零损分享已导出：${filename}${imageTip}`);
            setTimeout(removeCollectOverlay, 1600);
        } catch (err) {
            removeCollectOverlay();
            alert(`零损分享失败：${err.message}`);
        }
    }
