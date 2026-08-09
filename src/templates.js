// ----- UI组件的HTML模板 (用于模态框等) -----
const escapeSettingsAttr = value => String(value ?? '').replace(/[&<>"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
}[ch]));

const SETTINGS_MODAL_HTML = (cfg) => {
    const fontPreset = FONT_PRESETS.some(item => item.id === cfg.fontPreset) ? cfg.fontPreset : 'classic-serif';
    const customFontSource = ['none', 'url', 'file'].includes(cfg.customFontSource) ? cfg.customFontSource : 'none';
    const homeFeedMode = cfg.homeFeedMode === 'scroll' ? 'scroll' : 'paged';
    const translationPrompts = normalizeTranslationPromptLibrary(cfg.translationPrompts);
    const translationContextParagraphs = Math.max(0, Math.min(3, Number(cfg.translationContextParagraphs) || 0));
    return `
    <div class="zh-settings-page">
        <aside class="zh-settings-sidebar" aria-label="设置分类">
            <div class="zh-settings-sidebar-label">设置分类</div>
            <nav class="zh-settings-nav">
                <button type="button" class="zh-settings-nav-btn is-active" data-section="reading"><span>个性化</span><small>阅读与首页</small></button>
                <button type="button" class="zh-settings-nav-btn" data-section="appearance"><span>字体与外观</span><small>排版与主题</small></button>
                <button type="button" class="zh-settings-nav-btn" data-section="ai"><span>AI 服务</span><small>主模型与配置组</small></button>
                <button type="button" class="zh-settings-nav-btn" data-section="knowledge"><span>知识库</span><small>向量与提示词</small></button>
                <button type="button" class="zh-settings-nav-btn" data-section="zhihu"><span>知乎互动</span><small>默认收藏夹</small></button>
            </nav>
        </aside>

        <div class="zh-settings-workspace">
            <div class="zh-settings-scroll">
                <section class="zh-settings-section is-active" data-section="reading">
                    <header class="zh-settings-section-header">
                        <div><span class="zh-settings-kicker">PERSONALIZATION</span><h2>阅读与首页</h2></div>
                        <p>控制推荐流、翻译、图片和列表预览。</p>
                    </header>
                    <div class="zh-settings-subsection">
                        <h3>首页推荐与问题回答浏览</h3>
                        <div class="zh-segmented-control" role="radiogroup" aria-label="首页推荐与问题回答浏览模式">
                            <label><input type="radio" name="zh-home-feed-mode" value="paged" ${homeFeedMode === 'paged' ? 'checked' : ''}><span>分组翻页</span></label>
                            <label><input type="radio" name="zh-home-feed-mode" value="scroll" ${homeFeedMode === 'scroll' ? 'checked' : ''}><span>连续滚动</span></label>
                        </div>
                        <p class="zh-settings-note zh-settings-note-compact">首页推荐与问题回答共用此模式。连续滚动仅在到达列表底部后开始累计；继续向下滚动约一个完整视口宽度，自动加载下一批 6 条内容。分组翻页使用独立的手动加载按钮。</p>
                    </div>
                    <div class="zh-settings-divider"></div>
                    <div class="zh-settings-subsection"><h3>进入沉浸模式</h3></div>
                    <div class="zh-settings-toggle-list">
                        <label class="zh-settings-toggle"><span><b>默认进入沉浸模式</b><small>打开知乎页面时自动展卷，关闭后页面保持原样</small></span><input type="checkbox" id="zh-cfg-default-enter-immersive" ${cfg.defaultEnterImmersive !== false ? 'checked' : ''}><i></i></label>
                    </div>
                    <p class="zh-settings-note zh-settings-note-compact">关闭后仍可随时按 <b>Ctrl + E</b> 手动进入沉浸阅读。</p>
                    <div class="zh-settings-divider"></div>
                    <div class="zh-settings-subsection"><h3>阅读辅助</h3></div>
                    <div class="zh-settings-form-grid">
                        <label class="zh-settings-field zh-settings-field-wide">
                            <span>目标翻译语言 / 提示词</span>
                            <input type="text" id="zh-cfg-lang" value="${escapeSettingsAttr(cfg.targetLang)}" placeholder="文言文 / 英文 / 现代汉语解释">
                        </label>
                        <label class="zh-settings-field zh-settings-field-wide">
                            <span>阅读笔记兴趣标签</span>
                            <input type="text" id="zh-cfg-radar-tags" value="${escapeSettingsAttr(cfg.radarInterestTags || '')}" placeholder="AI工具、提示词工程、LLM训练、GitHub精选">
                        </label>
                    </div>
                    <div class="zh-settings-divider"></div>
                    <div class="zh-settings-subsection">
                        <h3>翻译提示词库</h3>
                        <p class="zh-settings-note">启用的提示词会按顺序循环用于段落翻译。提示词切换后会使用独立缓存；可在下方直接编辑。每段译文控制在 100 words 内。</p>
                        <div class="zh-settings-form-grid">
                            <label class="zh-settings-field">
                                <span>上下文段落</span>
                                <select id="zh-cfg-translation-context">
                                    <option value="0" ${translationContextParagraphs === 0 ? 'selected' : ''}>不加入</option>
                                    <option value="1" ${translationContextParagraphs === 1 ? 'selected' : ''}>前后各 1 段</option>
                                    <option value="2" ${translationContextParagraphs === 2 ? 'selected' : ''}>前后各 2 段</option>
                                    <option value="3" ${translationContextParagraphs === 3 ? 'selected' : ''}>前后各 3 段</option>
                                </select>
                                <small>仅供模型理解语气和上下文，不会要求翻译这些段落。</small>
                            </label>
                        </div>
                        <div id="zh-translation-prompt-list" class="zh-translation-prompt-list">
                            ${translationPrompts.map((item, index) => `
                                <div class="zh-translation-prompt-row" data-prompt-index="${index}">
                                    <div class="zh-translation-prompt-toolbar">
                                        <label class="zh-settings-toggle zh-translation-prompt-enabled"><span><b>启用轮换</b></span><input type="checkbox" class="zh-translation-prompt-check" ${item.enabled !== false ? 'checked' : ''}><i></i></label>
                                        <input type="text" class="zh-translation-prompt-name" value="${escapeSettingsAttr(item.name)}" placeholder="提示词名称">
                                        <button type="button" class="zh-inline-btn zh-translation-prompt-delete" title="删除提示词">删除</button>
                                    </div>
                                    <textarea class="zh-translation-prompt-text" rows="4" placeholder="使用 {{targetLang}} 代表目标语言">${escapeSettingsAttr(item.prompt)}</textarea>
                                </div>
                            `).join('')}
                        </div>
                        <div class="zh-settings-inline-actions">
                            <button type="button" id="zh-add-translation-prompt" class="zh-inline-btn">添加提示词</button>
                            <small>建议每段提示词保持简洁；系统会自动补充边界、表格和代码保护规则。</small>
                        </div>
                    </div>
                    <div class="zh-settings-divider"></div>
                    <div class="zh-settings-toggle-list">
                        <label class="zh-settings-toggle"><span><b>自动生成全文摘要</b><small>进入沉浸阅读后生成上下文摘要</small></span><input type="checkbox" id="zh-cfg-autosum" ${cfg.autoSum ? 'checked' : ''}><i></i></label>
                        <label class="zh-settings-toggle"><span><b>自动生成全文翻译</b><small>下次展卷生效，会产生较多模型调用</small></span><input type="checkbox" id="zh-cfg-autotr" ${cfg.autoTr ? 'checked' : ''}><i></i></label>
                        <label class="zh-settings-toggle"><span><b>自动折叠正文图片</b><small>进入沉浸阅读时隐藏正文图片</small></span><input type="checkbox" id="zh-cfg-auto-hide-images" ${cfg.autoHideImages ? 'checked' : ''}><i></i></label>
                    </div>
                    <div class="zh-settings-divider"></div>
                    <div class="zh-settings-form-grid">
                        <label class="zh-settings-field">
                            <span>图片交互方式</span>
                            <select id="zh-cfg-image-mode">
                                <option value="preview" ${cfg.imageMode !== 'collapse' ? 'selected' : ''}>弹出预览</option>
                                <option value="collapse" ${cfg.imageMode === 'collapse' ? 'selected' : ''}>原位展开</option>
                            </select>
                        </label>
                        <label class="zh-settings-field">
                            <span>分享导出格式</span>
                            <select id="zh-cfg-share-format">
                                <option value="png" ${cfg.shareExportFormat === 'png' ? 'selected' : ''}>PNG 长图</option>
                                <option value="webp" ${cfg.shareExportFormat === 'webp' ? 'selected' : ''}>WebP 长图</option>
                                <option value="svg" ${!['html', 'png', 'webp'].includes(cfg.shareExportFormat) ? 'selected' : ''}>SVG</option>
                                <option value="html" ${cfg.shareExportFormat === 'html' ? 'selected' : ''}>HTML</option>
                            </select>
                        </label>
                        <label class="zh-settings-field">
                            <span>回答列表预览</span>
                            <select id="zh-cfg-answer-preview">
                                <option value="excerpt" ${cfg.answerPreviewMode !== 'ai' ? 'selected' : ''}>摘录回答前文</option>
                                <option value="ai" ${cfg.answerPreviewMode === 'ai' ? 'selected' : ''}>AI 摘要</option>
                            </select>
                        </label>
                    </div>
                </section>

                <section class="zh-settings-section" data-section="appearance" hidden>
                    <header class="zh-settings-section-header">
                        <div><span class="zh-settings-kicker">APPEARANCE</span><h2>字体与外观</h2></div>
                        <p>选择本机字体栈，或载入自己的字体文件。</p>
                    </header>
                    <div class="zh-settings-subsection">
                        <h3>阅读字体</h3>
                        <div class="zh-font-preset-grid">
                            ${FONT_PRESETS.map(item => `
                                <label class="zh-font-preset ${item.id === fontPreset ? 'is-selected' : ''}" style="--zh-font-option:${item.stack}">
                                    <input type="radio" name="zh-font-preset" value="${item.id}" ${item.id === fontPreset ? 'checked' : ''}>
                                    <span class="zh-font-preset-sample">永 Aa</span>
                                    <span class="zh-font-preset-copy"><b>${item.name}</b><small>${item.desc}</small></span>
                                </label>
                            `).join('')}
                        </div>
                        <div id="zh-font-preview" class="zh-font-preview">
                            <span>字体预览</span>
                            <p>不疾而速，沉静而有力量。The quick brown fox jumps over the lazy dog.</p>
                        </div>
                    </div>
                    <div class="zh-settings-divider"></div>
                    <div class="zh-settings-subsection">
                        <h3>自定义字体</h3>
                        <div class="zh-segmented-control" role="radiogroup" aria-label="自定义字体来源">
                            <label><input type="radio" name="zh-custom-font-source" value="none" ${customFontSource === 'none' ? 'checked' : ''}><span>不使用</span></label>
                            <label><input type="radio" name="zh-custom-font-source" value="url" ${customFontSource === 'url' ? 'checked' : ''}><span>远程直链</span></label>
                            <label><input type="radio" name="zh-custom-font-source" value="file" ${customFontSource === 'file' ? 'checked' : ''}><span>本地文件</span></label>
                        </div>
                        <div class="zh-custom-font-panel" data-font-source="url" ${customFontSource === 'url' ? '' : 'hidden'}>
                            <label class="zh-settings-field zh-settings-field-wide"><span>字体文件地址</span><input type="url" id="zh-cfg-font-url" value="${escapeSettingsAttr(cfg.customFontUrl || '')}" placeholder="https://cdn.example.com/font.woff2"></label>
                            <div class="zh-settings-inline-actions"><button type="button" id="zh-preview-font-url" class="zh-inline-btn">加载预览</button><small>使用字体文件直链，不是字体展示页或 CSS 地址。</small></div>
                        </div>
                        <div class="zh-custom-font-panel" data-font-source="file" ${customFontSource === 'file' ? '' : 'hidden'}>
                            <label class="zh-font-file-picker" for="zh-cfg-font-file">
                                <input type="file" id="zh-cfg-font-file" accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf">
                                <span><b>选择字体文件</b><small id="zh-font-file-name">${escapeSettingsAttr(cfg.customFontName || '支持 WOFF2、WOFF、TTF、OTF，建议不超过 10 MB')}</small></span>
                            </label>
                        </div>
                        <div id="zh-font-load-status" class="zh-settings-status" aria-live="polite"></div>
                    </div>
                    <div class="zh-settings-divider"></div>
                    <div class="zh-settings-subsection">
                        <h3>自定义主题</h3>
                        <div id="zh-theme-var-grid" class="zh-theme-var-grid">
                            ${THEME_VAR_GUIDE.map(v => `
                                <label class="zh-theme-var-row">
                                    <input type="color" class="zh-theme-var" data-var="${v.key}" value="${v.def}">
                                    <span><b>${v.label}</b><small>${v.desc}</small></span>
                                </label>
                            `).join('')}
                        </div>
                        <div class="zh-settings-inline-actions">
                            <input type="text" id="zh-theme-name" placeholder="主题名称">
                            <button id="zh-add-theme-btn" type="button" class="zh-inline-btn">添加主题</button>
                        </div>
                        <details class="zh-settings-details">
                            <summary>通过 JSON 导入主题</summary>
                            <div class="zh-settings-inline-actions"><button id="zh-theme-tutorial-btn" type="button" class="zh-inline-btn">查看模板与字段说明</button></div>
                            <textarea id="zh-theme-json" rows="5" placeholder="粘贴包含 name 和 vars 的主题对象"></textarea>
                            <button id="zh-import-theme-btn" type="button" class="zh-inline-btn">导入主题</button>
                        </details>
                        <div id="zh-custom-theme-list" class="zh-settings-list"></div>
                    </div>
                </section>

                <section class="zh-settings-section" data-section="ai" hidden>
                    <header class="zh-settings-section-header">
                        <div><span class="zh-settings-kicker">AI SERVICE</span><h2>主模型服务</h2></div>
                        <p>翻译、摘要和学习卡片共用这套 OpenAI 兼容配置。</p>
                    </header>
                    <div class="zh-settings-form-grid">
                        <label class="zh-settings-field zh-settings-field-wide"><span>API Host</span><input type="url" id="zh-cfg-host" value="${escapeSettingsAttr(cfg.apiHost)}" placeholder="https://api.example.com/v1"></label>
                        <label class="zh-settings-field"><span>模型名称</span><input type="text" id="zh-cfg-model" value="${escapeSettingsAttr(cfg.apiModel)}" placeholder="deepseek-chat"></label>
                        <label class="zh-settings-field"><span>API Key</span><div class="zh-pwd-wrap"><input type="password" id="zh-cfg-key" value="${escapeSettingsAttr(cfg.apiKey)}" placeholder="sk-xxxx"><button id="zh-toggle-eye" type="button" class="zh-eye-icon" title="显示 API Key"><svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button></div></label>
                    </div>
                    <button id="zh-test-api-btn" class="zh-test-btn">测试 API 连通性</button>
                    <div id="zh-test-res" class="zh-test-res"></div>
                    <div class="zh-settings-divider"></div>
                    <div class="zh-settings-subsection">
                        <h3>API 配置组</h3>
                        <div class="zh-settings-form-grid">
                            <label class="zh-settings-field"><span>已保存配置</span><select id="zh-api-profile-select"></select></label>
                            <label class="zh-settings-field"><span>配置名称</span><input type="text" id="zh-api-profile-name" placeholder="DeepSeek / OpenAI / 本地中转"></label>
                        </div>
                        <div class="zh-settings-inline-actions">
                            <button id="zh-api-profile-apply" type="button" class="zh-inline-btn">应用配置</button>
                            <button id="zh-api-profile-save" type="button" class="zh-inline-btn">保存当前配置</button>
                            <button id="zh-api-profile-new" type="button" class="zh-inline-btn">新建</button>
                            <button id="zh-api-profile-delete" type="button" class="zh-inline-btn">删除</button>
                        </div>
                        <div id="zh-api-profile-status" class="zh-settings-status">配置组仅包含 Host、Model 和 Key。</div>
                    </div>
                </section>

                <section class="zh-settings-section" data-section="knowledge" hidden>
                    <header class="zh-settings-section-header">
                        <div><span class="zh-settings-kicker">KNOWLEDGE</span><h2>知识库与向量</h2></div>
                        <p>配置语义搜索使用的 Embedding 服务。</p>
                    </header>
                    <div class="zh-settings-form-grid">
                        <label class="zh-settings-field zh-settings-field-wide"><span>Embedding Host</span><input type="url" id="zh-cfg-embedding-host" value="${escapeSettingsAttr(cfg.embeddingHost || '')}" placeholder="留空则复用主 API Host"></label>
                        <label class="zh-settings-field"><span>Embedding 模型</span><input type="text" id="zh-cfg-embedding-model" value="${escapeSettingsAttr(cfg.embeddingModel || 'text-embedding-3-small')}" placeholder="text-embedding-3-small"><small>更换模型后，已有向量需要重新生成。</small></label>
                        <label class="zh-settings-field"><span>Embedding Key</span><input type="password" id="zh-cfg-embedding-key" value="${escapeSettingsAttr(cfg.embeddingKey || '')}" placeholder="留空则复用主 API Key"></label>
                    </div>
                    <div class="zh-settings-divider"></div>
                    <div class="zh-settings-subsection">
                        <h3>Wiki 采集</h3>
                        <p class="zh-settings-note">采集条数、并发、RPM、今日总览和 Obsidian 格式在“个人空间 → Wiki 采集”启动时设置。</p>
                        <button id="zh-preview-prompts-btn" type="button" class="zh-inline-btn">查看当前系统提示词</button>
                    </div>
                </section>

                <section class="zh-settings-section" data-section="zhihu" hidden>
                    <header class="zh-settings-section-header">
                        <div><span class="zh-settings-kicker">ZHIHU</span><h2>知乎互动</h2></div>
                        <p>指定推荐流一键收藏使用的收藏夹。</p>
                    </header>
                    <label class="zh-settings-field zh-settings-field-wide"><span>默认收藏夹 ID</span><input type="text" id="zh-cfg-collection-id" value="${escapeSettingsAttr(cfg.defaultCollectionId || '')}" placeholder="例如 905152952"></label>
                    <div class="zh-settings-inline-actions">
                        <button id="zh-fetch-collections-btn" type="button" class="zh-inline-btn">拉取我的收藏夹</button>
                        <span id="zh-fetch-collections-status" class="zh-settings-status"></span>
                    </div>
                    <div id="zh-collections-list" class="zh-settings-list zh-collections-list"></div>
                </section>
            </div>

            <footer class="zh-settings-footer">
                <span id="zh-settings-save-status">修改仅在保存后生效</span>
                <div>
                    <button id="zh-cancel-settings-btn" type="button" class="zh-settings-secondary-btn">取消</button>
                    <button id="zh-save-settings-btn" type="button" class="zh-settings-primary-btn">保存并应用</button>
                </div>
            </footer>
        </div>
    </div>
    `;
};

const HELP_MODAL_HTML = `
    <div style="line-height:1.9;">
        <h3 style="margin:0 0 8px; color:var(--zh-accent);">基础阅读</h3>
        <ul style="padding-left:20px; margin:0 0 14px;">
            <li><strong>Ctrl + E</strong>：展卷 / 收卷，切换沉浸阅读。</li>
            <li><strong>Ctrl + H</strong>：隐藏 / 显示侧边工具栏和退出按钮，适合截图、打印或专注阅读。</li>
            <li><strong>T</strong>：展开 / 收起段落翻译卡片；未自动翻译时，可逐段点击请求。</li>
            <li><strong>← / →</strong>：上一篇 / 下一篇（首页推荐流和问答列表均可用，支持跨组切换）。</li>
            <li><strong>J / K</strong>：同上，下一篇 / 上一篇（Vim 风格）。</li>
            <li><strong>图片</strong>：点击正文图片可折叠，再点击占位条恢复显示；头像和作者信息不会被主动隐藏。可在设置中切换"弹出预览"或"原位展开"两种模式。</li>
            <li><strong>打印 / PDF</strong>：沉浸模式下已隐藏站点 UI，并为正文保留打印边距。</li>
        </ul>

        <h3 style="margin:0 0 8px; color:var(--zh-accent);">AI 与积累</h3>
        <ul style="padding-left:20px; margin:0 0 14px;">
            <li><strong>表达收藏本图标</strong>：打开表达本，查看划词积累；支持复制 Markdown、下载 Markdown / JSON、清空。</li>
            <li><strong>划词右键</strong>：选中文字后右键，可进行 AI 划词解析，也可把原文、译文、上下文和 AI 批注加入表达本。</li>
            <li><strong>阅读笔记图标</strong>：为当前文章或回答生成短报告，记录 archetype、oneliner、impression、depth、relevance 和标签；报告可保存、复看、导出。</li>
            <li><strong>分享图标</strong>：导出当前文章或回答的纯净分享稿，支持 HTML、SVG、PNG 和 WebP 长图。PNG/WebP 为稳定下载会忽略正文图片，并在导出结果中标注。</li>
        </ul>

        <h3 style="margin:0 0 8px; color:var(--zh-accent);">首页与 Wiki</h3>
        <ul style="padding-left:20px; margin:0 0 14px;">
            <li><strong>首页推荐</strong>：首组沿用页面已有 DOM，后续通过推荐 API 每批加载 6 条；可在个性化设置中选择分组翻页或连续滚动。</li>
            <li><strong>Wiki 图标</strong>：仅在首页显示。用于把已加载推荐流抓取全文、生成学习卡片和可复制/下载的 Markdown 日志。</li>
            <li><strong>Wiki Beta</strong>：当前仍偏实验功能，适合尝鲜和个人工作流验证，性能与体验还没有大量优化。</li>
        </ul>

        <h3 style="margin:0 0 8px; color:var(--zh-accent);">设置与仓库</h3>
        <ul style="padding-left:20px; margin:0;">
            <li><strong>设置图标</strong>：打开分类设置页，配置阅读字体、OpenAI 兼容 API、翻译、外观、知识库和知乎互动。</li>
            <li><strong>API 配置组</strong>：设置页可保存多组 Host / Model / Key，按需应用到当前 API 表单；不会改动翻译语言、Wiki 数量或其它阅读偏好。</li>
            <li><strong>仓库图标</strong>：侧边工具栏可直接跳转项目仓库。</li>
            <li><strong>仓库地址：</strong><a href="https://github.com/connectedGraph/zhihu-immersive-reader" target="_blank" rel="noopener noreferrer" style="color:var(--zh-accent);">https://github.com/connectedGraph/zhihu-immersive-reader</a></li>
        </ul>
    </div>
`;
