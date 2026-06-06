# File Routine — 文件职责与依赖关系

## 拆分评价

现有的模块拆分**结构合理**，按以下维度分类：
- **配置层**：constants, styles, templates
- **状态层**：state, api-profiles, cache
- **工具层**：utils, api, zhihu-action
- **UI层**：ui, toolbar, events
- **功能层**：translation, expression, radar, share, wiki, wiki-store
- **页面层**：page-home, page-follow, page-post, page-question

**优点**：职责清晰，依赖单向，易于维护和扩展。
**可优化**：wiki.js (1551 行) 可考虑拆分为 wiki-collect.js + wiki-process.js + wiki-search.js，但当前规模可接受。

---

## 文件依赖关系图

```
note.js (头部)
    ↓
constants.js ← 全局常量（主题、配置、选择器、图标）
    ↓
styles.js ← CSS 样式（依赖 constants 中的 CSS 变量名）
    ↓
templates.js ← HTML 模板（依赖 constants 中的选择器和图标）
    ↓
[IIFE 开始]
    ↓
state.js ← 全局状态、配置加载（依赖 constants）
    ↓
api-profiles.js ← API 配置组管理（依赖 state）
    ↓
utils.js ← 工具函数（页面检测、DOM 操作、缓存键生成）
    ↓
api.js ← LLM API 引擎（依赖 state, utils, api-profiles）
    ↓
zhihu-action.js ← 知乎交互 API（赞同、感谢、收藏）
    ↓
cache.js ← 翻译缓存、IndexedDB（依赖 state, utils）
    ↓
ui.js ← 模态框、主题、图片切换（依赖 constants, templates, state, utils）
    ↓
translation.js ← 翻译 & 摘要（依赖 api, cache, ui, utils）
    ↓
expression.js ← 表达收藏本（依赖 cache, ui, utils）
    ↓
radar.js ← 信息雷达（依赖 api, cache, ui, utils）
    ↓
share.js ← 零损分享（依赖 ui, utils, templates）
    ↓
page-post.js ← 文章页（依赖 utils, ui, translation, share）
    ↓
page-question.js ← 问题页（依赖 utils, ui, translation, share, cache）
    ↓
page-home.js ← 首页推荐（依赖 utils, ui, zhihu-action, cache, translation）
    ↓
page-follow.js ← 关注动态页（依赖 utils, ui, zhihu-action, cache, page-home 的解析函数）
    ↓
wiki-store.js ← Wiki IndexedDB 存储（依赖 cache, utils）
    ↓
wiki.js ← Wiki 功能（依赖 api, cache, ui, utils, wiki-store, page-home）
    ↓
toolbar.js ← 工具栏 & 沉浸模式（依赖 ui, state, utils, templates）
    ↓
events.js ← 键盘快捷键 & 右键菜单（依赖 所有页面模块、toolbar、translation、share、radar、wiki）
```

---

## 文件详细说明

### 第一阶段：全局配置（无 IIFE）

#### `note.js` (26 行)
**职责**：Tampermonkey 脚本头部元数据
- `@name`, `@version`, `@match`, `@grant` 等
- 不在 IIFE 内，全局作用域

**导出**：无（纯元数据）

---

#### `constants.js` (101 行)
**职责**：所有常量定义
- `THEMES`：5 套内置主题 + 自定义主题加载
- `DEFAULT_CONFIG`：默认配置对象
- `THEME_VAR_GUIDE`：主题 CSS 变量说明
- `EXPORT_HIDDEN_SELECTORS`：分享导出时隐藏的选择器
- `ICONS`：工具栏按钮 SVG 图标

**导出**：
```javascript
THEMES, DEFAULT_CONFIG, THEME_VAR_GUIDE, EXPORT_HIDDEN_SELECTORS, ICONS
CUSTOM_THEMES_KEY, THEME_STORAGE_KEY
HOME_BATCH_SIZE, FOLLOW_BATCH_SIZE
HOME_RECOMMEND_API, FOLLOW_MOMENTS_API
TRANSLATION_CACHE_KEY, EXPRESSION_BOOK_KEY, RADAR_REPORT_BOOK_KEY
API_PROFILES_KEY, TOREAD_LIST_KEY
```

**依赖**：无

---

#### `styles.js` (345 行)
**职责**：所有 CSS 样式（注入到 `<style>` 标签）
- 沉浸模式样式
- 工具栏、模态框、卡片布局
- 主题 CSS 变量应用
- 响应式设计

**导出**：无（直接注入 DOM）

**依赖**：constants（CSS 变量名）

---

#### `templates.js` (164 行)
**职责**：所有 HTML 模板字符串
- 工具栏 HTML
- 设置面板 HTML
- 主题选择器 HTML
- 模态框框架 HTML
- Wiki 面板 HTML

**导出**：
```javascript
TOOLBAR_HTML, SETTINGS_PANEL_HTML, THEME_PICKER_HTML, MODAL_TEMPLATE_HTML, WIKI_PANEL_HTML
```

**依赖**：constants（选择器、图标）

---

### 第二阶段：状态与配置（IIFE 内）

#### `state.js` (132 行)
**职责**：全局状态初始化与配置管理
- `config`：从 GM_setValue / localStorage 加载
- 页面状态：`_articleNode`, `_questionState`, `_homeFeedCache`, `_followFeedCache`
- 缓存：翻译、问题答案、分享图片
- IndexedDB 存储名称常量
- 配置同步监听（GM_addValueChangeListener, storage 事件）

**导出**：
```javascript
config, _articleNode, _actionBarNode, _questionState, _homeFeedCache, _followFeedCache
_translationMemoryCache, _questionAnswerCache, _shareImageDataUrlCache
QUESTION_CACHE_DB, WIKI_HISTORY_KEY, HOME_BATCH_SIZE, FOLLOW_BATCH_SIZE
```

**依赖**：constants（DEFAULT_CONFIG）

---

#### `api-profiles.js` (164 行)
**职责**：API 配置组管理
- 预设 API 配置（DeepSeek, OpenAI, Claude 等）
- 配置组的增删改查
- 配置持久化到 localStorage

**导出**：
```javascript
getApiProfiles(), addApiProfile(), removeApiProfile(), updateApiProfile()
getDefaultApiProfile(), setDefaultApiProfile()
```

**依赖**：state, constants

---

### 第三阶段：工具函数

#### `utils.js` (458 行)
**职责**：通用工具函数
- **页面检测**：`isHomePage()`, `isFollowPage()`, `isQuestionPage()`, `isPostPage()`
- **DOM 操作**：`waitForElement()`, `getDocumentHeight()`, `forceScrollToBottom()`
- **缓存键生成**：`getQuestionCacheKey()`, `getHomeCacheKey()`
- **哈希**：`stableHash()`
- **表单**：`getFormNumber()`
- **异步**：`sleep()`
- **HTML 清理**：`sanitizeLLMHTML()`
- **URL 规范化**：`normalizeUrl()`

**导出**：所有上述函数

**依赖**：state, constants

---

#### `api.js` (289 行)
**职责**：LLM API 引擎
- 支持 OpenAI 兼容 API（DeepSeek、中转站等）
- 翻译、摘要、读书笔记生成
- 并发控制 & RPM 限制
- 重试逻辑（指数退避）
- 流式响应处理

**导出**：
```javascript
callLLMAPI(prompt, options), translateText(), summarizeText(), generateReadingNotes()
```

**依赖**：state, api-profiles, utils

---

#### `zhihu-action.js` (331 行)
**职责**：知乎交互 API（写操作）
- 赞同 / 反对 / 感谢 / 喜欢 / 收藏
- 取消赞同 / 取消收藏
- 获取收藏夹列表
- 添加到收藏夹

**导出**：
```javascript
voteUpAnswer(), voteDownAnswer(), thankAnswer(), likeArticle(), collectContent()
getCollections(), addToCollection()
```

**依赖**：utils, state

---

### 第四阶段：缓存与存储

#### `cache.js` (135 行)
**职责**：翻译缓存 & IndexedDB 管理
- 翻译缓存：localStorage 存储，LRU 淘汰
- 表达收藏本：localStorage 存储
- 雷达报告缓存
- IndexedDB 初始化与操作（问题答案、Wiki 卡片）

**导出**：
```javascript
getTranslationCache(), setTranslationCache()
getExpressionBook(), addExpressionEntry()
initIndexedDB(), queryIndexedDB(), saveToIndexedDB()
```

**依赖**：state, utils, constants

---

### 第五阶段：UI 与交互

#### `ui.js` (535 行)
**职责**：UI 组件与交互
- **主题管理**：`loadCustomThemes()`, `applyTheme()`, `addCustomTheme()`, `parseThemeJSON()`
- **模态框**：`showModal()`, `closeModal()`, `showSettingsPanel()`
- **图片切换**：`setupImageToggles()`, `showImagePreview()`
- **HTML 清理**：`sanitizeLLMHTML()`
- **通知**：`showNotification()`, `showToast()`

**导出**：所有上述函数

**依赖**：constants, templates, state, utils

---

#### `toolbar.js` (308 行)
**职责**：工具栏与沉浸模式
- 工具栏创建与管理
- 沉浸模式进入 / 退出（淡出动画）
- 工具栏显示 / 隐藏
- 按钮事件绑定

**导出**：
```javascript
initToolbar(), toggleImmersiveMode(), toggleToolbarVisibility()
```

**依赖**：ui, state, utils, templates, constants

---

#### `events.js` (94 行)
**职责**：全局事件处理
- 键盘快捷键：Ctrl+E (沉浸), Ctrl+H (工具栏), T (翻译), ← / → (翻页)
- 右键菜单：复制 Markdown、导出、分享
- 页面初始化触发

**导出**：无（直接注册事件监听）

**依赖**：所有页面模块、toolbar、translation、share、radar、wiki

---

### 第六阶段：功能模块

#### `translation.js` (275 行)
**职责**：翻译 & 摘要
- 逐段翻译（中外对照）
- 全文摘要
- 缓存管理
- 翻译面板 UI

**导出**：
```javascript
translateArticle(), summarizeArticle(), showTranslationPanel()
```

**依赖**：api, cache, ui, utils

---

#### `expression.js` (238 行)
**职责**：表达收藏本
- 收藏表达短语
- 浏览收藏本
- 导出为 JSON / CSV

**导出**：
```javascript
addExpression(), getExpressions(), showExpressionBook()
```

**依赖**：cache, ui, utils

---

#### `radar.js` (497 行)
**职责**：信息雷达（趋势分析）
- 从首页推荐批量提取关键词
- 生成趋势雷达图
- 学习萃取总览
- 可视化展示

**导出**：
```javascript
generateRadar(), showRadarPanel()
```

**依赖**：api, cache, ui, utils

---

#### `share.js` (689 行)
**职责**：零损分享
- 导出当前沉浸页面为 SVG / PNG / HTML
- 保留主题配色和排版
- 隐藏工具栏、按钮等

**导出**：
```javascript
exportAsSVG(), exportAsPNG(), exportAsHTML()
```

**依赖**：ui, utils, templates, constants

---

### 第七阶段：页面适配

#### `page-post.js` (250 行)
**职责**：文章页 (/p/{id})
- 提取文章标题、正文、作者
- 展开折叠内容
- 集成翻译、读书笔记、分享、Markdown 导出

**导出**：
```javascript
initPostPage()
```

**依赖**：utils, ui, translation, share, cache

---

#### `page-question.js` (667 行)
**职责**：问题页 (/question/{id})
- 提取问题标题、回答列表
- 回答导航（← / →）
- 缓存问题答案
- 集成翻译、读书笔记、分享、Markdown 导出

**导出**：
```javascript
initQuestionPage(), getNextAnswer(), getPreviousAnswer()
```

**依赖**：utils, ui, translation, share, cache

---

#### `page-home.js` (891 行)
**职责**：首页推荐流 (/）
- 从 `/api/v3/feed/topstory/recommend` 拉取推荐
- 渲染双列卡片网格
- 分页与跨组导航
- 内置互动栏（赞同、感谢、收藏等）
- 待读列表 (ToRead)
- 与关注页切换

**导出**：
```javascript
initHomePage(), getHomeItemUrl(), getHomeItemTitle(), getHomeItemAuthor()
normalizeHomeApiNextUrl(), expandHomeFeedItem()
```

**依赖**：utils, ui, zhihu-action, cache, translation

---

#### `page-follow.js` (591 行)
**职责**：关注动态页 (/follow)
- 从 `/api/v3/moments` 拉取动态（纯 API）
- 按 verb / action_text_tpl / target 分类
- 渲染推特风格时间线
- 单列 / 双列布局切换
- 内置互动栏

**导出**：
```javascript
initFollowPage(), getMomentActionText(), classifyMomentAction()
```

**依赖**：utils, ui, zhihu-action, cache, page-home（复用解析函数）

---

### 第八阶段：Wiki 功能

#### `wiki-store.js` (192 行)
**职责**：Wiki IndexedDB 存储
- 卡片存储 / 查询 / 更新 / 删除
- 向量存储
- 标签索引
- 历史记录管理

**导出**：
```javascript
saveWikiCard(), queryWikiCards(), deleteWikiCard()
saveWikiVector(), queryByVector()
getWikiHistory(), saveWikiHistory()
```

**依赖**：cache, utils

---

#### `wiki.js` (1551 行)
**职责**：Wiki 完整流程
1. **采集**：从首页推荐 API 批量拉取
2. **全文抓取**：跨域 fetch + HTML 解析
3. **LLM 结构化**：生成学习卡片 JSON
4. **向量嵌入**：调用 Embedding API
5. **存储**：IndexedDB + 标签索引
6. **检索**：标签浏览 + 语义搜索（余弦相似度）

**导出**：
```javascript
startWikiPipeline(), pauseWikiPipeline(), resumeWikiPipeline()
queryWikiByTag(), searchWikiSemantic()
showWikiPanel()
```

**依赖**：api, cache, ui, utils, wiki-store, page-home

---

## 加载顺序与初始化

### 脚本启动流程

```
1. note.js 加载（Tampermonkey 元数据）
2. constants.js 加载（全局常量）
3. styles.js 加载（CSS 注入）
4. templates.js 加载（HTML 模板）
5. IIFE 开始
6. state.js 执行（配置加载、全局状态初始化）
7. api-profiles.js 加载（API 配置组）
8. utils.js 加载（工具函数）
9. api.js 加载（LLM 引擎）
10. zhihu-action.js 加载（知乎交互）
11. cache.js 加载（缓存初始化）
12. ui.js 加载（UI 组件）
13. translation.js 加载（翻译功能）
14. expression.js 加载（表达收藏本）
15. radar.js 加载（信息雷达）
16. share.js 加载（分享功能）
17. page-post.js 加载（文章页逻辑）
18. page-question.js 加载（问题页逻辑）
19. page-home.js 加载（首页逻辑）
20. page-follow.js 加载（关注页逻辑）
21. wiki-store.js 加载（Wiki 存储）
22. wiki.js 加载（Wiki 功能）
23. toolbar.js 加载（工具栏初始化）
24. events.js 执行（事件监听 + 页面初始化）
```

### 页面初始化

在 `events.js` 中，根据当前页面类型调用对应的初始化函数：

```javascript
if (isHomePage()) initHomePage();
else if (isFollowPage()) initFollowPage();
else if (isQuestionPage()) initQuestionPage();
else if (isPostPage()) initPostPage();
```

---

## 跨模块通信

### 全局状态（state.js）
所有模块通过 `config` 和全局变量通信：
```javascript
config.apiHost, config.apiKey, config.apiModel  // API 配置
_homeFeedCache, _followFeedCache                 // 页面缓存
_translationMemoryCache                          // 翻译缓存
```

### 事件驱动（events.js）
- 键盘快捷键触发页面导航、翻译、分享
- 右键菜单触发导出、复制等操作

### 回调与 Promise
- `api.js` 返回 Promise，支持异步操作
- `ui.js` 提供模态框回调处理用户输入

---

## 添加新功能的步骤

### 1. 添加新页面适配
```
1. 创建 src/page-{name}.js
2. 实现 init{Name}Page() 函数
3. 在 build.js 中添加到 modules 列表
4. 在 events.js 中添加页面检测和初始化调用
```

### 2. 添加新 API 功能
```
1. 在 api.js 中添加新函数
2. 在 state.js 中添加配置字段（如需）
3. 在 ui.js 中添加设置面板选项
4. 在相关页面模块中调用
```

### 3. 添加新缓存类型
```
1. 在 cache.js 中添加 IndexedDB store 或 localStorage 键
2. 实现 get/set 函数
3. 在相关模块中调用
```

### 4. 添加新快捷键
```
1. 在 events.js 的 keydown 监听中添加条件
2. 调用对应的功能函数
```

---

## 性能优化建议

| 模块 | 优化方向 |
|------|--------|
| `wiki.js` | 可拆分为 wiki-collect.js (采集) + wiki-process.js (处理) + wiki-search.js (检索) |
| `page-home.js` | 虚拟滚动优化大列表渲染 |
| `page-follow.js` | 图片懒加载，避免一次性加载所有头像 |
| `ui.js` | 模态框使用 Web Components 或 Shadow DOM 隔离样式 |
| `cache.js` | IndexedDB 查询添加分页，避免一次性加载全部数据 |

