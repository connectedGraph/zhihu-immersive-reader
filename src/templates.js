// ----- UI组件的HTML模板 (用于模态框等) -----
const SETTINGS_MODAL_HTML = (cfg) => `
    <label style="display:block; margin-bottom:5px;">API Host (记得带 /v1):</label>
    <input type="text" id="zh-cfg-host" value="${cfg.apiHost}" style="width:100%; margin-bottom:15px; box-sizing:border-box;">
    
    <label style="display:block; margin-bottom:5px;">模型名称 (Model):</label>
    <input type="text" id="zh-cfg-model" value="${cfg.apiModel}" placeholder="gpt-3.5-turbo / deepseek-chat" style="width:100%; margin-bottom:15px; box-sizing:border-box;">

    <label style="display:block; margin-bottom:5px;">API Key:</label>
    <div class="zh-pwd-wrap">
        <input type="password" id="zh-cfg-key" value="${cfg.apiKey}" placeholder="sk-xxxx">
        <div id="zh-toggle-eye" class="zh-eye-icon" title="显示/隐藏">
            <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        </div>
    </div>

    <button id="zh-test-api-btn" class="zh-test-btn">⚡ 测试 API 连通性</button>
    <div id="zh-test-res" class="zh-test-res"></div>

    <div style="border:1px dashed var(--zh-border); border-radius:4px; padding:10px 12px; margin:0 0 15px; background:var(--zh-quote);">
        <div style="font-weight:bold; color:var(--zh-accent); margin-bottom:8px;">API 配置组</div>
        <label style="display:block; margin-bottom:5px;">已保存配置:</label>
        <select id="zh-api-profile-select" style="width:100%; margin-bottom:8px; box-sizing:border-box; background:var(--zh-code); border:1px solid var(--zh-border); color:var(--zh-text); padding:8px; border-radius:4px;"></select>
        <label style="display:block; margin-bottom:5px;">配置名称:</label>
        <input type="text" id="zh-api-profile-name" placeholder="例如：DeepSeek / OpenAI / 本地中转" style="width:100%; margin-bottom:10px; box-sizing:border-box;">
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button id="zh-api-profile-apply" type="button" class="zh-inline-btn" style="padding:6px 10px; font-size:13px;">应用配置</button>
            <button id="zh-api-profile-save" type="button" class="zh-inline-btn" style="padding:6px 10px; font-size:13px;">保存当前为配置</button>
            <button id="zh-api-profile-new" type="button" class="zh-inline-btn" style="padding:6px 10px; font-size:13px;">新建配置</button>
            <button id="zh-api-profile-delete" type="button" class="zh-inline-btn" style="padding:6px 10px; font-size:13px;">删除配置</button>
        </div>
        <div id="zh-api-profile-status" style="font-size:12px; opacity:.75; margin-top:8px;">配置组只保存 Host / Model / Key，不影响翻译语言和其它偏好。</div>
    </div>
    
    <label style="display:block; margin-bottom:5px;">目标翻译语言 / 提示词:</label>
    <input type="text" id="zh-cfg-lang" value="${cfg.targetLang}" style="width:100%; margin-bottom:15px; box-sizing:border-box;" placeholder="文言文 / 英文 / 现代汉语解释">
    <label style="display:block; margin-bottom:5px;">阅读笔记兴趣标签:</label>
    <input type="text" id="zh-cfg-radar-tags" value="${cfg.radarInterestTags || ''}" style="width:100%; margin-bottom:15px; box-sizing:border-box;" placeholder="AI工具、提示词工程、LLM训练、GitHub精选">
    
    <label style="display:block; margin-bottom:5px; cursor:pointer;"><input type="checkbox" id="zh-cfg-autosum" ${cfg.autoSum ? 'checked' : ''}> 展卷时自动生成全文摘要</label>
    <label style="display:block; margin-bottom:5px; cursor:pointer;"><input type="checkbox" id="zh-cfg-autotr" ${cfg.autoTr ? 'checked' : ''}> 展卷时异步生成全文翻译 (慎选，耗量大)下次生效</label>
    <label style="display:block; margin-bottom:5px; cursor:pointer;"><input type="checkbox" id="zh-cfg-auto-hide-images" ${cfg.autoHideImages ? 'checked' : ''}> 展卷时自动折叠正文图片</label>
    <label style="display:block; margin-bottom:5px;">图片折叠后的交互方式:</label>
    <select id="zh-cfg-image-mode" style="width:100%; margin-bottom:20px; box-sizing:border-box; background:var(--zh-code); border:1px solid var(--zh-border); color:var(--zh-text); padding:8px; border-radius:4px;">
        <option value="preview" ${cfg.imageMode !== 'collapse' ? 'selected' : ''}>弹出预览（点击占位符全屏查看，点击其他区域收回）</option>
        <option value="collapse" ${cfg.imageMode === 'collapse' ? 'selected' : ''}>原位展开（点击占位符在原文位置展开图片，再点图片收起）</option>
    </select>
    <label style="display:block; margin-bottom:5px;">零损分享导出格式:</label>
    <select id="zh-cfg-share-format" style="width:100%; margin-bottom:20px; box-sizing:border-box; background:var(--zh-code); border:1px solid var(--zh-border); color:var(--zh-text); padding:8px; border-radius:4px;">
        <option value="png" ${cfg.shareExportFormat === 'png' ? 'selected' : ''}>PNG 长图（本地渲染 + 公共 API 兜底）</option>
        <option value="webp" ${cfg.shareExportFormat === 'webp' ? 'selected' : ''}>WebP 长图（本地渲染 + 公共 API 兜底）</option>
        <option value="svg" ${!['html', 'png', 'webp'].includes(cfg.shareExportFormat) ? 'selected' : ''}>SVG（html2svg）</option>
        <option value="html" ${cfg.shareExportFormat === 'html' ? 'selected' : ''}>HTML</option>
    </select>
    
    <label style="display:block; margin-bottom:5px;">回答列表预览:</label>
    <select id="zh-cfg-answer-preview" style="width:100%; margin-bottom:20px; box-sizing:border-box; background:var(--zh-code); border:1px solid var(--zh-border); color:var(--zh-text); padding:8px; border-radius:4px;">
        <option value="excerpt" ${cfg.answerPreviewMode !== 'ai' ? 'selected' : ''}>摘录回答前文</option>
        <option value="ai" ${cfg.answerPreviewMode === 'ai' ? 'selected' : ''}>AI 摘要</option>
    </select>

    <div style="border-top:1px dashed var(--zh-border); margin:16px 0; padding-top:14px;">
        <div style="font-weight:bold; color:var(--zh-accent); margin-bottom:10px;">首页信息流 Wiki</div>
        <label style="display:block; margin-bottom:5px;">采集条数:</label>
        <input type="number" id="zh-cfg-wiki-max" min="1" value="${cfg.wikiMaxItems || 100}" style="width:100%; margin-bottom:10px; box-sizing:border-box;">

        <label style="display:block; margin-bottom:5px;">AI 并发数 (0 为不限):</label>
        <input type="number" id="zh-cfg-wiki-concurrency" min="0" value="${cfg.wikiConcurrency ?? 20}" style="width:100%; margin-bottom:10px; box-sizing:border-box;">

        <label style="display:block; margin-bottom:5px;">AI RPM (0 为不限):</label>
        <input type="number" id="zh-cfg-wiki-rpm" min="0" value="${cfg.wikiRpm ?? 300}" style="width:100%; margin-bottom:10px; box-sizing:border-box;">

        <label style="display:block; margin-bottom:5px; cursor:pointer;"><input type="checkbox" id="zh-cfg-wiki-final" ${cfg.wikiFinalSynthesis !== false ? 'checked' : ''}> 生成今日总览</label>
        <button id="zh-preview-prompts-btn" type="button" class="zh-test-btn">查看当前系统提示词</button>
    </div>

    <div style="border-top:1px dashed var(--zh-border); margin:16px 0; padding-top:14px;">
        <div style="font-weight:bold; color:var(--zh-accent); margin-bottom:10px;">Embedding 向量配置（语义搜索）</div>
        <label style="display:block; margin-bottom:5px;">Embedding Host (带 /v1):</label>
        <input type="text" id="zh-cfg-embedding-host" value="${cfg.embeddingHost || ''}" placeholder="https://api.openai.com/v1" style="width:100%; margin-bottom:10px; box-sizing:border-box;">
        <label style="display:block; margin-bottom:5px;">Embedding 模型:</label>
        <input type="text" id="zh-cfg-embedding-model" value="${cfg.embeddingModel || 'text-embedding-3-small'}" placeholder="text-embedding-3-small" style="width:100%; margin-bottom:10px; box-sizing:border-box;">
        <label style="display:block; margin-bottom:5px;">Embedding Key (留空则复用 LLM Key):</label>
        <input type="password" id="zh-cfg-embedding-key" value="${cfg.embeddingKey || ''}" placeholder="留空则使用上方 API Key" style="width:100%; margin-bottom:10px; box-sizing:border-box;">
    </div>
    
    <div style="border-top:1px dashed var(--zh-border); margin:16px 0; padding-top:14px;">
        <div style="font-weight:bold; color:var(--zh-accent); margin-bottom:10px;">知乎互动 · 收藏夹</div>
        <label style="display:block; margin-bottom:5px;">默认收藏夹 ID（用于一键收藏推荐流卡片）：</label>
        <input type="text" id="zh-cfg-collection-id" value="${cfg.defaultCollectionId || ''}" placeholder="例如 905152952" style="width:100%; margin-bottom:10px; box-sizing:border-box;">
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
            <button id="zh-fetch-collections-btn" type="button" class="zh-inline-btn" style="padding:6px 10px; font-size:13px;">拉取我的收藏夹</button>
            <span id="zh-fetch-collections-status" style="font-size:12px; opacity:.7; align-self:center;"></span>
        </div>
        <div id="zh-collections-list" style="font-size:13px; line-height:1.7; max-height:160px; overflow:auto;"></div>
        <div style="font-size:12px; opacity:.7; margin-top:6px;">点击列表中的收藏夹即可填入 ID。需登录知乎账号后操作。</div>
    </div>

    <button id="zh-save-settings-btn" class="zh-modal-btn">保存并应用配置</button>
`;

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
            <li><strong>分享图标</strong>：导出当前文章或回答的纯净分享稿，支持 HTML、SVG、PNG 长图。PNG 为稳定下载会忽略正文图片，并在导出结果中标注。</li>
        </ul>

        <h3 style="margin:0 0 8px; color:var(--zh-accent);">首页与 Wiki</h3>
        <ul style="padding-left:20px; margin:0 0 14px;">
            <li><strong>首页推荐</strong>：首组沿用页面已有 DOM，后续通过推荐 API 手动加载，每组 5 条，可在列表右上角切换推荐组。</li>
            <li><strong>Wiki 图标</strong>：仅在首页显示。用于把已加载推荐流抓取全文、生成学习卡片和可复制/下载的 Markdown 日志。</li>
            <li><strong>Wiki Beta</strong>：当前仍偏实验功能，适合尝鲜和个人工作流验证，性能与体验还没有大量优化。</li>
        </ul>

        <h3 style="margin:0 0 8px; color:var(--zh-accent);">设置与仓库</h3>
        <ul style="padding-left:20px; margin:0;">
            <li><strong>设置图标</strong>：配置 OpenAI 兼容 API Host、模型、API Key、目标翻译语言、阅读笔记兴趣标签、分享格式、Wiki 参数等。</li>
            <li><strong>API 配置组</strong>：设置页可保存多组 Host / Model / Key，按需应用到当前 API 表单；不会改动翻译语言、Wiki 数量或其它阅读偏好。</li>
            <li><strong>仓库图标</strong>：侧边工具栏可直接跳转项目仓库。</li>
            <li><strong>仓库地址：</strong><a href="https://github.com/connectedGraph/zhihu-immersive-reader" target="_blank" rel="noopener noreferrer" style="color:var(--zh-accent);">https://github.com/connectedGraph/zhihu-immersive-reader</a></li>
        </ul>
    </div>
`;
