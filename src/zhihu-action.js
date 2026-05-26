    /**
     * ============================================================================
     * 知乎写操作 API（赞同 / 反对 / 感谢 / 喜欢 / 收藏）
     *   - 同源请求，credentials:'include' 自动带 z_c0
     *   - 必须手动加 x-xsrftoken（= cookie 里的 _xsrf）
     *   - 不需要 x-zse-96，所有 voters/thankers/likers/collections 接口实测放行
     * ============================================================================
     */

    const ZHIHU_API_BASE = 'https://www.zhihu.com';

    function getXSRFToken() {
        const match = document.cookie.match(/(?:^|;\s*)_xsrf=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    }

    function buildZhihuActionUrl(path, query) {
        const url = path.startsWith('http')
            ? new URL(path)
            : new URL(path, ZHIHU_API_BASE);
        if (query && typeof query === 'object') {
            Object.entries(query).forEach(([k, v]) => {
                if (v === undefined || v === null) return;
                url.searchParams.set(k, String(v));
            });
        }
        return url.href;
    }

    async function zhihuFetch(method, path, options = {}) {
        const xsrf = getXSRFToken();
        if (!xsrf) {
            const err = new Error('缺少 _xsrf cookie，请先登录知乎');
            err.code = 'NO_XSRF';
            throw err;
        }

        const headers = {
            'x-xsrftoken': xsrf,
            'x-requested-with': 'fetch',
            'accept': 'application/json, text/plain, */*'
        };
        let body;
        if (options.body !== undefined) {
            headers['content-type'] = 'application/json';
            body = JSON.stringify(options.body);
        }

        const url = buildZhihuActionUrl(path, options.query);
        const res = await fetch(url, {
            method,
            credentials: 'include',
            headers,
            body
        });

        const text = await res.text();
        let data = null;
        if (text) {
            try { data = JSON.parse(text); } catch (err) { data = text; }
        }

        if (!res.ok) {
            const message = (data && typeof data === 'object' && (data.error?.message || data.message))
                || (typeof data === 'string' && data.slice(0, 200))
                || `HTTP ${res.status}`;
            const err = new Error(`知乎接口错误：${message}`);
            err.status = res.status;
            err.data = data;
            throw err;
        }

        return { status: res.status, data };
    }

    function voteAnswer(answerId, dir) {
        if (!answerId) throw new Error('voteAnswer 缺少 answerId');
        if (!['up', 'down', 'neutral'].includes(dir)) throw new Error(`voteAnswer 非法方向：${dir}`);
        return zhihuFetch('POST', `/api/v4/answers/${answerId}/voters`, { body: { type: dir } });
    }

    function voteArticle(articleId, dir) {
        if (!articleId) throw new Error('voteArticle 缺少 articleId');
        if (![1, -1, 0].includes(dir)) throw new Error(`voteArticle 非法方向：${dir}`);
        return zhihuFetch('POST', `/api/v4/articles/${articleId}/voters`, { body: { voting: dir } });
    }

    function thankAnswer(answerId, on) {
        if (!answerId) throw new Error('thankAnswer 缺少 answerId');
        return on
            ? zhihuFetch('POST', `/api/v4/answers/${answerId}/thankers`, { body: {} })
            : zhihuFetch('DELETE', `/api/v4/answers/${answerId}/thankers`);
    }

    async function likeArticle(articleId, on) {
        if (!articleId) throw new Error('likeArticle 缺少 articleId');
        if (on) {
            return zhihuFetch('POST', `/api/v4/articles/${articleId}/likers`, { body: {} });
        }
        try {
            return await zhihuFetch('DELETE', `/api/v4/articles/${articleId}/likers`);
        } catch (err) {
            if (err.status === 404 || err.status === 405) {
                return zhihuFetch('POST', `/api/v4/articles/${articleId}/likers`, { body: { liking: 0 } });
            }
            throw err;
        }
    }

    function normalizeContentType(type) {
        if (type === 'answer' || type === 'article') return type;
        throw new Error(`未支持的收藏类型：${type}`);
    }

    function addCollection(collectionId, contentId, contentType) {
        if (!collectionId) {
            const err = new Error('未配置收藏夹 ID，请到设置面板填入');
            err.code = 'NO_COLLECTION_ID';
            throw err;
        }
        if (!contentId) throw new Error('addCollection 缺少 contentId');
        const t = normalizeContentType(contentType);
        return zhihuFetch('POST', `/api/v4/collections/${collectionId}/contents`, {
            query: { content_id: contentId, content_type: t }
        });
    }

    function removeCollection(collectionId, contentId, contentType) {
        if (!collectionId) {
            const err = new Error('未配置收藏夹 ID，请到设置面板填入');
            err.code = 'NO_COLLECTION_ID';
            throw err;
        }
        if (!contentId) throw new Error('removeCollection 缺少 contentId');
        const t = normalizeContentType(contentType);
        return zhihuFetch('DELETE', `/api/v4/collections/${collectionId}/contents/${contentId}`, {
            query: { content_type: t }
        });
    }

    async function fetchMyCollections(limit = 20) {
        const me = await zhihuFetch('GET', '/api/v4/me');
        const urlToken = me.data?.url_token;
        if (!urlToken) {
            const err = new Error('未获取到当前用户 url_token，请确认已登录');
            err.code = 'NO_URL_TOKEN';
            throw err;
        }
        const include = 'data[*].updated_time,answer_count,follower_count,creator,description,is_following,comment_count,created_time';
        const res = await zhihuFetch('GET', `/api/v4/people/${urlToken}/collections`, {
            query: { include, offset: 0, limit }
        });
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        return list.map(item => ({
            id: String(item.id),
            title: item.title || '(未命名收藏夹)',
            answerCount: item.answer_count ?? item.item_count ?? 0,
            isDefault: item.is_default === true
        }));
    }

    // ─── Action Bar 渲染层 ───────────────────────────────────────────────

    const ACTION_ICONS = {
        up: '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M13.792 3.681c-.781-1.406-2.803-1.406-3.584 0l-7.79 14.023c-.76 1.367.228 3.046 1.791 3.046h15.582c1.563 0 2.55-1.68 1.791-3.046l-7.79-14.023Z" clip-rule="evenodd"></path></svg>',
        down: '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M13.792 20.319c-.781 1.406-2.803 1.406-3.584 0L2.418 6.296c-.76-1.367.228-3.046 1.791-3.046h15.582c1.563 0 2.55 1.68 1.791 3.046l-7.79 14.023Z" clip-rule="evenodd"></path></svg>',
        comment: '<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.37c5.67 0 10.266 4.085 10.267 9.125 0 2.08-.786 3.997-2.105 5.532a1.064 1.064 0 0 0-.247.91l.644 3.056c.24 1.157-.66 1.58-1.444 1.157l-2.925-1.584c-.53-.287-1.153-.338-1.743-.21-.784.172-1.604.265-2.447.265-5.67 0-10.268-4.087-10.268-9.126C1.732 6.455 6.33 2.37 12 2.37Z"></path></svg>',
        star: '<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="currentColor"><path d="M10.424 2.828c.7-1.213 2.452-1.213 3.152 0l2.47 4.285c.038.064.1.109.172.124l4.839 1.027c1.37.29 1.912 1.956.974 2.997l-3.312 3.674a.26.26 0 0 0-.065.201l.52 4.92c.146 1.393-1.27 2.422-2.55 1.852l-4.518-2.014a.26.26 0 0 0-.212 0l-4.518 2.014c-1.28.57-2.696-.46-2.55-1.853l.52-4.919a.26.26 0 0 0-.065-.2L1.969 11.26c-.938-1.041-.396-2.707.974-2.997l4.839-1.027a.26.26 0 0 0 .171-.124l2.471-4.285Z"></path></svg>',
        heart: '<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M16.984 3.324c1.73.315 3.125 1.472 4.04 2.978 1.893 3.116.758 6.989-1.384 9.556a23.241 23.241 0 0 1-3.96 3.737c-.66.486-1.308.895-1.902 1.196-.579.294-1.166.517-1.695.57a.845.845 0 0 1-.145.002c-.529-.038-1.127-.267-1.708-.564a14.407 14.407 0 0 1-1.947-1.232 23.512 23.512 0 0 1-4.081-3.88C2.165 13.207 1.139 9.536 2.85 6.514 3.742 4.94 5.14 3.71 6.896 3.348c1.606-.332 3.363.094 5.103 1.394 1.696-1.267 3.409-1.704 4.985-1.418Z" clip-rule="evenodd"></path></svg>'
    };

    const _actionThrottles = new Map();

    function isActionThrottled(key) {
        const now = Date.now();
        if (_actionThrottles.has(key) && now - _actionThrottles.get(key) < 1000) return true;
        _actionThrottles.set(key, now);
        return false;
    }

    function buildActionBar(record) {
        const bar = document.createElement('div');
        bar.className = 'ContentItem-actions zh-api-action-bar';
        bar.dataset.recordKey = record.key || '';

        const isAnswer = record.apiTargetType === 'answer';
        const isArticle = record.apiTargetType === 'article';
        const hasVote = isAnswer || isArticle;
        const hasThank = isAnswer;
        const hasLike = isArticle;

        const voteCount = record.voteup_count ?? 0;
        const isVotedUp = record.voting === 1;
        const isVotedDown = record.voting === -1;

        let html = '';

        if (hasVote) {
            html += `<button class="zh-action-btn zh-action-vote-up${isVotedUp ? ' is-active' : ''}" data-action="vote-up" title="赞同">
                <span style="display:inline-flex;align-items:center">${ACTION_ICONS.up}</span>
                ${isVotedUp ? '已赞同' : '赞同'}${voteCount > 0 ? ' ' + voteCount : ''}
            </button>`;
            html += `<button class="zh-action-btn zh-action-vote-down${isVotedDown ? ' is-active' : ''}" data-action="vote-down" title="反对">
                <span style="display:inline-flex;align-items:center">${ACTION_ICONS.down}</span>
            </button>`;
        }

        if (record.comment_count != null) {
            html += `<a class="zh-action-btn zh-action-comment" href="${escapeHTML(record.url || '#')}" target="_blank" rel="noopener noreferrer" title="查看评论">
                <span style="display:inline-flex;align-items:center">${ACTION_ICONS.comment}</span>
                ${record.comment_count > 0 ? record.comment_count + ' 评论' : '评论'}
            </a>`;
        }

        html += `<button class="zh-action-btn zh-action-collect${record.collected ? ' is-active' : ''}" data-action="collect" title="收藏">
            <span style="display:inline-flex;align-items:center">${ACTION_ICONS.star}</span>
            ${record.collected ? '已收藏' : '收藏'}${record.favlists_count > 0 ? ' ' + record.favlists_count : ''}
        </button>`;

        if (hasThank) {
            html += `<button class="zh-action-btn zh-action-thank${record.thanked ? ' is-active' : ''}" data-action="thank" title="感谢">
                <span style="display:inline-flex;align-items:center">${ACTION_ICONS.heart}</span>
                ${record.thanked ? '已感谢' : '感谢'}
            </button>`;
        }
        if (hasLike) {
            html += `<button class="zh-action-btn zh-action-like${record.liked ? ' is-active' : ''}" data-action="like" title="喜欢">
                <span style="display:inline-flex;align-items:center">${ACTION_ICONS.heart}</span>
                ${record.liked ? '已喜欢' : '喜欢'}
            </button>`;
        }

        html += `<a class="zh-action-btn zh-action-open" href="${escapeHTML(record.url || '#')}" target="_blank" rel="noopener noreferrer">打开原文</a>`;

        bar.innerHTML = html;
        bindActionBar(bar, record);
        return bar;
    }

    function bindActionBar(bar, record) {
        bar.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const action = btn.dataset.action;
                const throttleKey = `${record.key}::${action}`;
                if (isActionThrottled(throttleKey)) return;
                btn.disabled = true;
                btn.style.opacity = '0.5';
                try {
                    await executeAction(record, action);
                    refreshActionBar(bar, record);
                } catch (err) {
                    console.warn('知乎互动失败:', action, err);
                    if (err.code === 'NO_COLLECTION_ID') {
                        showToast('请先到设置面板填入收藏夹 ID');
                    } else if (err.code === 'NO_XSRF' || err.status === 401) {
                        showToast('请先登录知乎');
                    } else {
                        showToast('操作失败：' + (err.message || err).slice(0, 60));
                    }
                } finally {
                    btn.disabled = false;
                    btn.style.opacity = '';
                }
            });
        });
    }

    async function executeAction(record, action) {
        const id = record.apiTargetId;
        const isAnswer = record.apiTargetType === 'answer';
        const isArticle = record.apiTargetType === 'article';

        switch (action) {
            case 'vote-up': {
                const newDir = record.voting === 1 ? 'neutral' : 'up';
                if (isAnswer) {
                    await voteAnswer(id, newDir === 'up' ? 'up' : 'neutral');
                } else {
                    await voteArticle(id, newDir === 'up' ? 1 : 0);
                }
                record.voting = newDir === 'up' ? 1 : 0;
                if (newDir === 'up') record.voteup_count = (record.voteup_count || 0) + 1;
                else record.voteup_count = Math.max(0, (record.voteup_count || 0) - 1);
                break;
            }
            case 'vote-down': {
                const newDir = record.voting === -1 ? 'neutral' : 'down';
                if (record.voting === 1) record.voteup_count = Math.max(0, (record.voteup_count || 0) - 1);
                if (isAnswer) {
                    await voteAnswer(id, newDir === 'down' ? 'down' : 'neutral');
                } else {
                    await voteArticle(id, newDir === 'down' ? -1 : 0);
                }
                record.voting = newDir === 'down' ? -1 : 0;
                break;
            }
            case 'thank': {
                const on = !record.thanked;
                await thankAnswer(id, on);
                record.thanked = on;
                break;
            }
            case 'like': {
                const on = !record.liked;
                await likeArticle(id, on);
                record.liked = on;
                break;
            }
            case 'collect': {
                const cid = config.defaultCollectionId;
                const contentType = isAnswer ? 'answer' : 'article';
                if (record.collected) {
                    await removeCollection(cid, id, contentType);
                    record.collected = false;
                } else {
                    await addCollection(cid, id, contentType);
                    record.collected = true;
                }
                break;
            }
        }
        persistHomeFeedCache();
    }

    function refreshActionBar(bar, record) {
        const newBar = buildActionBar(record);
        bar.innerHTML = newBar.innerHTML;
        bindActionBar(bar, record);
    }
