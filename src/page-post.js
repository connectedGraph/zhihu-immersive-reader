    function hideArticleAdCards(root = document) {
        const scope = root.querySelectorAll ? root : document;
        if (scope.matches && scope.matches('.pc-article-answer-card')) {
            const adCard = scope.closest('.pc-article-answer') || scope;
            adCard.dataset.origDisplay = adCard.style.display || '';
            adCard.style.display = 'none';
            adCard.classList.add('zh-hidden-by-immersive-inner');
        }
        scope.querySelectorAll('.pc-article-answer-card').forEach(card => {
            const adCard = card.closest('.pc-article-answer') || card;
            adCard.dataset.origDisplay = adCard.style.display || '';
            adCard.style.display = 'none';
            adCard.classList.add('zh-hidden-by-immersive-inner');
        });
    }

    function startArticleAdCleanup() {
        hideArticleAdCards(_articleNode || document);
        if (_adCleanupObserver || !_articleNode) return;

        _adCleanupObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) hideArticleAdCards(node);
                });
            });
        });
        _adCleanupObserver.observe(_articleNode, { childList: true, subtree: true });
    }

    function stopArticleAdCleanup() {
        if (_adCleanupObserver) {
            _adCleanupObserver.disconnect();
            _adCleanupObserver = null;
        }
    }


    function findPostCommentsNode(root = document) {
        const scope = root?.querySelector ? root : document;
        const comments = scope.matches?.('.Comments-container')
            ? scope
            : scope.querySelector('.Comments-container');
        if (!comments || comments.closest('#immersive-wrapper')) return null;
        return comments;
    }

    function mountPostCommentsNode(comments, wrapper = document.getElementById('immersive-wrapper')) {
        if (!comments || !wrapper || !comments.parentNode) return false;
        if (comments.closest('#immersive-wrapper') === wrapper) {
            _postCommentsNode = comments;
            return true;
        }

        const previousPlaceholder = document.getElementById('zh-comments-placeholder');
        if (previousPlaceholder) previousPlaceholder.remove();
        if (_postCommentsNode && _postCommentsNode !== comments && _postCommentsNode.closest('#immersive-wrapper')) {
            _postCommentsNode.remove();
        }

        const commentsPlaceholder = document.createElement('span');
        commentsPlaceholder.id = 'zh-comments-placeholder';
        commentsPlaceholder.style.display = 'none';
        comments.parentNode.insertBefore(commentsPlaceholder, comments);

        _postCommentsNode = comments;
        const insertBeforeNode = (_actionBarNode?.parentNode === wrapper)
            ? _actionBarNode.nextSibling
            : null;
        wrapper.insertBefore(comments, insertBeforeNode);
        return true;
    }

    function scrollPostCommentsIntoView() {
        const comments = _postCommentsNode;
        if (!comments) return;
        requestAnimationFrame(() => {
            if (comments.isConnected) comments.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    function syncPostCommentsNode() {
        const wrapper = document.getElementById('immersive-wrapper');
        if (!wrapper || !_postCommentsHostNode || !_postCommentsRequested) return;

        const comments = findPostCommentsNode(_postCommentsHostNode);
        if (comments) {
            if (mountPostCommentsNode(comments, wrapper)) scrollPostCommentsIntoView();
            return;
        }

        const placeholder = document.getElementById('zh-comments-placeholder');
        if (_postCommentsNode && !placeholder) {
            if (_postCommentsNode.closest('#immersive-wrapper')) _postCommentsNode.remove();
            _postCommentsNode = null;
        }
    }

    function schedulePostCommentsSync() {
        if (_postCommentsSyncQueued) return;
        _postCommentsSyncQueued = true;
        queueMicrotask(() => {
            _postCommentsSyncQueued = false;
            if (window._isImmersive) syncPostCommentsNode();
        });
    }

    function requestPostComments() {
        _postCommentsRequested = true;

        if (_postCommentsNode?.closest('#immersive-wrapper')) {
            scrollPostCommentsIntoView();
            return;
        }

        const wrapper = document.getElementById('immersive-wrapper');
        const comments = findPostCommentsNode(_postCommentsHostNode);
        if (mountPostCommentsNode(comments, wrapper)) {
            scrollPostCommentsIntoView();
        } else {
            schedulePostCommentsSync();
        }
    }

    function bindPostCommentsButton() {
        unbindPostCommentsButton();
        const button = _actionBarNode?.querySelector('.BottomActions-CommentBtn');
        if (!button) return;

        _postCommentsButtonNode = button;
        _postCommentsButtonHandler = () => requestPostComments();
        button.addEventListener('click', _postCommentsButtonHandler);
    }

    function unbindPostCommentsButton() {
        if (_postCommentsButtonNode && _postCommentsButtonHandler) {
            _postCommentsButtonNode.removeEventListener('click', _postCommentsButtonHandler);
        }
        _postCommentsButtonNode = null;
        _postCommentsButtonHandler = null;
    }

    function startPostCommentsObserver() {
        stopPostCommentsObserver();
        if (!_postCommentsHostNode) return;

        _postCommentsObserver = new MutationObserver(schedulePostCommentsSync);
        _postCommentsObserver.observe(_postCommentsHostNode, { childList: true, subtree: true });
    }

    function stopPostCommentsObserver() {
        if (_postCommentsObserver) _postCommentsObserver.disconnect();
        _postCommentsObserver = null;
        _postCommentsSyncQueued = false;
        unbindPostCommentsButton();
    }

    function findPostCommentInputNode() {
        const inputs = Array.from(document.querySelectorAll('.InputLike, [contenteditable="true"]'))
            .filter(el => !el.closest('#immersive-wrapper') && !el.closest('.Comments-container') && !el.closest('.AppHeader') && !el.closest('[role="dialog"]'));

        for (const input of inputs) {
            let node = input;
            while (node && node.parentElement && node.parentElement !== document.body) {
                const style = window.getComputedStyle(node);
                if (style.position === 'fixed') return node;
                node = node.parentElement;
            }
        }
        return null;
    }

    function enterPostImmersive() {
        try {
            _articleNode = document.querySelector('.Post-Main.Post-NormalMain') || document.querySelector('.Post-Main') || document.querySelector('.AnswerItem');
            if (!_articleNode) return alert('阁下，未寻得文章主体！');

            _postCommentsHostNode = _articleNode.parentElement;
            _postCommentsRequested = false;
            _actionBarNode = _articleNode.querySelector('.ContentItem-actions') || document.querySelector('.ContentItem-actions');

            const articlePlaceholder = document.createElement('span');
            articlePlaceholder.id = 'zh-article-placeholder';
            articlePlaceholder.style.display = 'none';
            if (_articleNode.parentNode) {
                _articleNode.parentNode.insertBefore(articlePlaceholder, _articleNode);
            }

            if (_actionBarNode) {
                const actionPlaceholder = document.createElement('span');
                actionPlaceholder.id = 'zh-action-placeholder';
                actionPlaceholder.style.display = 'none';
                if (_actionBarNode.parentNode) {
                    _actionBarNode.parentNode.insertBefore(actionPlaceholder, _actionBarNode);
                }

                _actionBarNode.dataset.origCssText = _actionBarNode.style.cssText;
                _actionBarNode.style.cssText = 'position: static !important; box-shadow: none !important; background: transparent !important; margin-top: 40px !important;';
            }

            const wrapper = document.createElement('div');
            wrapper.id = 'immersive-wrapper';
            wrapper.appendChild(_articleNode);
            if (_actionBarNode) wrapper.appendChild(_actionBarNode);

            _postCommentsNode = null;

            _postCommentInputNode = findPostCommentInputNode();
            if (_postCommentInputNode) {
                const inputPlaceholder = document.createElement('span');
                inputPlaceholder.id = 'zh-comment-input-placeholder';
                inputPlaceholder.style.display = 'none';
                if (_postCommentInputNode.parentNode) {
                    _postCommentInputNode.parentNode.insertBefore(inputPlaceholder, _postCommentInputNode);
                }
                wrapper.appendChild(_postCommentInputNode);
            }

            const reactRoot = document.getElementById('root') || document.body;
            Array.from(reactRoot.children).forEach(child => {
                if (child.id !== 'immersive-wrapper' && child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE' && child.tagName !== 'LINK') {
                    child.dataset.origDisplay = child.style.display || '';
                    child.style.display = 'none';
                    child.classList.add('zh-hidden-by-immersive');
                }
            });

            reactRoot.appendChild(wrapper);
            startPostCommentsObserver();
            bindPostCommentsButton();
            document.body.appendChild(createCopyMarkdownBtn());

            const postToreadBtn = createPageToReadBtn(
                location.href,
                document.querySelector('.Post-Title')?.innerText || document.title,
                document.querySelector('.AuthorInfo-name')?.innerText || '',
                '专栏文章'
            );
            postToreadBtn.style.cssText = 'position:absolute;top:18px;right:18px;z-index:3;';
            wrapper.style.position = 'relative';
            wrapper.appendChild(postToreadBtn);

            const tocNode = _articleNode.querySelector('.css-u56wtg') || document.querySelector('.CatalogBtn') || document.querySelector('[aria-label="目录"]');
            if (tocNode) {
                tocNode.classList.add('zh-toc-fixed-style');
                tocNode.addEventListener('click', (e) => {
                    if (e.target === tocNode) {
                        const inner = tocNode.querySelector('a, button');
                        if (inner) inner.click();
                    }
                });
            }

            const timeNode = _articleNode.querySelector('.ContentItem-time') || _articleNode.querySelector('.Post-Sub');
            if (timeNode) {
                let currentNode = timeNode.nextElementSibling;
                while (currentNode) {
                    if (currentNode.id !== 'zh-action-placeholder' && !currentNode.classList.contains('ContentItem-actions')) {
                        currentNode.dataset.origDisplay = currentNode.style.display || '';
                        currentNode.style.display = 'none';
                        currentNode.classList.add('zh-hidden-by-immersive-inner');
                    }
                    currentNode = currentNode.nextElementSibling;
                }
            }

            _articleNode.querySelectorAll('.FollowButton').forEach(btn => {
                btn.dataset.origDisplay = btn.style.display || '';
                btn.style.display = 'none';
                btn.classList.add('zh-hidden-by-immersive-inner');
            });

            ['.pc-article-answer-text-chain', '.pc-article-answer-big-img', '.RichText-MCNLinkCardContainer', '.ecommerce-ad-box', '.MCNLinkCard'].forEach(s => {
                _articleNode.querySelectorAll(s).forEach(ad => {
                    ad.dataset.origDisplay = ad.style.display || '';
                    ad.style.display = 'none';
                    ad.classList.add('zh-hidden-by-immersive-inner');
                });
            });
            startArticleAdCleanup();

            ensureImmersiveStyle();

            // 强制隐藏知乎顶部/底部固定互动栏及侧边栏。
            // 注意：这里只依赖 ensureImmersiveStyle() 注入的 #immersive-style 里的
            // `display:none !important` 规则（见 CHROME_HIDE_SELECTORS），不再手动写 inline style。
            // 若在此追加 inline display:none，React 重渲染会重置 className、抹掉手动添加的
            // zh-hidden-by-immersive class，却保留 inline display:none，导致退出时按 class 的
            // 恢复逻辑漏掉这些元素、顶部导航栏/搜索框残留隐藏（即“退出后搜索栏消失”的 bug）。

            createQuestionToolsPanel();

            setupImageToggles();
            applyTheme(currentThemeIndex);
            window._isImmersive = true;

            if (config.autoSum || config.autoTr) {
                const triggerAutoTranslate = () => {
                    const translateBtn = document.getElementById('zh-translate-btn');
                    if (translateBtn) translateBtn.click();
                };
                if (document.readyState === 'complete') {
                    setTimeout(triggerAutoTranslate, 800);
                } else {
                    window.addEventListener('load', () => setTimeout(triggerAutoTranslate, 800), { once: true });
                }
            }

            logCurrentPageReadingRecord();
        } catch (e) {
            console.error('进入专栏沉浸式阅读失败:', e);
            alert('进入沉浸式阅读失败，原因为: ' + e.message);
            window._isImmersive = false;
        }
    }