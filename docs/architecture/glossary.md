# GLOSSARY — 项目术语表

本表用于你我之间的沟通对齐：我说中文术语，你能直接定位到源码。
列含义：**中文名** | **代码标识 / 英文** | **一句话定义** | **主要文件**。

> 约定：说术语时优先用「中文名」；涉及底层时可用「代码标识」。
> 模块名与用户可见概念不一致的，已在「备注」标出（例如 radar = 阅读笔记）。

---

## 一、页面类型（4 种适配页）

| 中文名 | 代码标识 | 定义 | 主要文件 |
|--------|----------|------|----------|
| 推荐流 / 首页 | `home` / `isHomePage()` | `zhihu.com/` 推荐流，拉 `topstory/recommend`，双列卡片网格 + 内置互动栏 | `page-home.js` |
| 关注流 / 关注动态 | `follow` / `isFollowPage()` | `/follow`，纯 API 拉 `moments`，推特风格时间线（某人做了某事） | `page-follow.js` |
| 问题页 | `question` / `isQuestionPage()` | `/question/{id}`，提取标题 + 回答列表，← / → 切换回答 | `page-question.js` |
| 文章页 | `post` / `isPostPage()` | `/p/{id}`，专栏文章正文提取 | `page-post.js` |

---

## 二、核心功能（用户可见）

| 中文名 | 代码标识 | 定义 | 主要文件 |
|--------|----------|------|----------|
| 沉浸模式 | `_isImmersive` / `toggleImmersiveMode()` | 去广告/侧栏的极简阅读态，`Ctrl/Cmd+E` 进出 | `toolbar.js` |
| 工具栏 | toolbar | 右侧悬浮按钮组，`Ctrl/Cmd+H` 显隐 | `toolbar.js` `templates.js` |
| 翻译 / 摘要 | `translateArticle()` / `summarizeArticle()` | 逐段中外对照翻译 + 全文摘要，`T` 切换面板 | `translation.js` `api.js` |
| 阅读笔记 / 笔记本 | **radar**（旧名「信息雷达」）`R` | LLM 为当前文章/回答/动态生成一句话概括+感想+标签，存「阅读笔记本」 | `radar.js` |
| 表达本 / 表达收藏本 | expression | 收藏好的表达短语/句式，可导出 | `expression.js` |
| 零损分享 | share | 把当前沉浸页导出为 SVG / PNG / HTML，保留主题排版 | `share.js` |
| Wiki / 卡片库 | wiki | 批量采集→全文抓取→LLM 结构化学习卡片→向量嵌入→IndexedDB | `wiki.js` `wiki-store.js` |
| 待读 / ToRead | `TOREAD_LIST_KEY` | 稍后读列表（上限 200），右上角入口 | `page-home.js` |
| API 配置组 | api-profiles | 多套 LLM API（host/key/model）预设，可切换默认 | `api-profiles.js` |
| 主题 | THEMES / 自定义主题 | 5 套内置主题（宣纸/竹简/牛皮/暗血/简白）+ CSS 变量自定义 | `constants.js` `ui.js` |
| 知乎写操作 | zhihu-action | 赞同/反对/感谢/喜欢/收藏 + 收藏夹，调知乎官方 API | `zhihu-action.js` |

---

## 三、数据结构 / 流转概念

| 中文名 | 代码标识 | 定义 | 主要文件 |
|--------|----------|------|----------|
| 动态 | moment | 关注流的单元：「某人(actor) 做了(verb) 某事(target)」 | `page-follow.js` |
| 动作类型 | verb / action_text_tpl | 判断动态类型（如 `MEMBER_ANSWER_QUESTION`=回答了问题） | `page-follow.js` |
| 想法 | pin（`target.type='pin'`） | 知乎短内容「想法」，关注流中的一种 target | `page-follow.js` |
| 动态分组 | feed_group | 一条聚合多个 feed 的组，需展开成扁平列表并跳广告 | `page-follow.js` |
| 卡片 | item / card | 推荐流/关注流里渲染的单条内容块 | `page-home.js` |
| 批次 | `HOME_BATCH_SIZE`(6) / `FOLLOW_BATCH_SIZE`(8) | 每次分页拉取的条数 | `state.js` |
| 分页游标 | `apiNextUrl` / `paging.next` | 跟随知乎返回的下一页地址做翻页 | `page-home.js` `page-follow.js` |
| 学习卡片 | wiki card | Wiki 结构化产物 JSON：类型/结论/关键词/场景/证据/标签/置信度 | `wiki.js` `wiki-store.js` |
| 向量 / 语义检索 | embedding / 余弦相似度 | 卡片嵌入向量，支持语义搜索（默认 `text-embedding-3-small`） | `wiki.js` |
| 全文抓取 | fetchFullText | Wiki 跨域 fetch + HTML 解析，失败降级到 API 摘要 | `wiki.js` |

---

## 四、状态对象（调试/定位用）

| 中文名 | 代码标识 | 定义 | 主要文件 |
|--------|----------|------|----------|
| 推荐流状态 | `_homeState` | 当前推荐流的 items/分页/视图/采集态 | `state.js` |
| 关注流状态 | `_followState` | 当前关注流的 items/分组/视图 | `state.js` |
| 问题页状态 | `_questionState` | 答案列表/当前索引/标题/滚动位置 | `state.js` |
| Wiki 运行态 | `wikiState` | 一次 Wiki 流程的进度/阶段/日志/历史 | `state.js` `wiki.js` |
| 配置 | `config` | 全局配置（GM_setValue + localStorage 双写） | `state.js` `constants.js` |

---

## 备注（命名 ≠ 概念的坑）

- **radar.js = 阅读笔记功能**：模块/常量仍叫 `radar`、`RADAR_REPORT_BOOK`，但用户可见概念是「阅读笔记 / 阅读笔记本」，快捷键 `R`。CLAUDE.md 里「信息雷达/趋势分析」的描述已过时，以本表为准。
- **推荐流 vs 关注流**：都叫 feed，但推荐流走 DOM+API 混合，关注流是纯 API。说「首页」默认指推荐流。
- **卡片**有两义：① 流里的内容块（item/card）；② Wiki 的学习卡片（wiki card）。歧义时我会带上下文，你也可追问。
