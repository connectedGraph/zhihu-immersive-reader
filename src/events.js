    /**
     * ============================================================================
     * 事件监听：键盘快捷键 & 划词右键菜单
     * ============================================================================
     */
    function isEditPage() {
        return /\/p\/\d+\/edit/.test(location.pathname) || /\/edit/.test(location.pathname);
    }

    window.addEventListener('keydown', function(e) {
        const key = typeof e.key === 'string' ? e.key.toLowerCase() : '';
        const typing = isTypingTarget(e.target);
        if (key === 'escape') removeSelectionContextMenu();
        if (!key) return;

        if (window._isImmersive && _homeState.view === 'item' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
            if (key === 'j' || key === 'arrowright') {
                e.preventDefault();
                navigateHomeItem(1);
                return;
            }
            if (key === 'k' || key === 'arrowleft') {
                e.preventDefault();
                navigateHomeItem(-1);
                return;
            }
        }

        if (window._isImmersive && _followState.view === 'item' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
            if (key === 'j' || key === 'arrowright') {
                e.preventDefault();
                navigateFollowItem(1);
                return;
            }
            if (key === 'k' || key === 'arrowleft') {
                e.preventDefault();
                navigateFollowItem(-1);
                return;
            }
        }

        if (window._isImmersive && _questionState.view === 'answer' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
            if (key === 'j' || key === 'arrowright') {
                e.preventDefault();
                navigateQuestionAnswer(1);
                return;
            }
            if (key === 'k' || key === 'arrowleft') {
                e.preventDefault();
                navigateQuestionAnswer(-1);
                return;
            }
        }

        if (e.ctrlKey || e.metaKey) {
            if (key === 'e' && !e.altKey) {
                // 仅 Ctrl/Cmd+E 进入沉浸模式；Ctrl+Alt+E 是知乎编辑器插入公式的快捷键，必须放行
                if (isEditPage()) return;
                e.preventDefault();
                window.toggleImmersiveMode();
            } else if (key === 'h' && window._isImmersive) {
                e.preventDefault();
                window._uiHidden = !window._uiHidden;
                document.body.classList.toggle('zh-ui-hidden', window._uiHidden);
            }
        }

        //  T 切换翻译面板 
        if (key === 't' && window._isImmersive && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            const translateBtn = document.getElementById('zh-translate-btn');
            if(translateBtn) translateBtn.click();
        }
        
    });

    // 划词右键菜单
    document.addEventListener('contextmenu', function(e) {
        if(!window._isImmersive) return;
        const sel = window.getSelection().toString().trim();
        if(!sel) return;

        const anchorNode = window.getSelection().anchorNode;
        const anchorEl = anchorNode && anchorNode.nodeType === Node.ELEMENT_NODE ? anchorNode : anchorNode?.parentElement;
        const paraNode = anchorEl ? anchorEl.closest('p, blockquote, li, table') : null;
        const contextText = paraNode ? paraNode.innerText : "无额外上下文";

        e.preventDefault();
        showSelectionContextMenu(e, sel, contextText);
    });



    // 启动：仅在尚未配置收藏夹时后台尝试获取知乎默认收藏夹，不阻塞沉浸模式进入。
    autoInitializeDefaultCollection();

    // 启动：非编辑页且允许默认进入沉浸模式时自动进入（设置页可关闭默认进入，仍可用 Ctrl+E 手动展卷）
    if (!isEditPage() && config.defaultEnterImmersive !== false) window.toggleImmersiveMode();
})();
