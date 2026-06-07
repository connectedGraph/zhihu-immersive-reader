# 知乎沉浸阅读 (Zhihu Immersive Reader)

> 一叶孤舟，一卷宣纸。

将知乎网页转化为极简沉浸式阅读环境。去除广告、侧边栏和视觉噪音，专注内容本身。

适配页面：知乎首页推荐流(zhihu.com)、关注动态页 (`/follow`)、问答页 (`/question/`)、专栏文章页 (`/p/`)。

[![Demo](https://img.shields.io/badge/演示-脚本演示-FF69B4?style=for-the-badge&logo=youtube&logoColor=white)](https://zhuanlan.zhihu.com/p/2039743943340991262)
[![Landing Page](https://img.shields.io/badge/官网-Landing%20页-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://6767.chat/zhihu-immersive-reader/)
[![Greasy Fork](https://img.shields.io/badge/Greasy%20Fork-安装脚本-4BBA64?style=for-the-badge&logo=greasyfork&logoColor=white)](https://greasyfork.org/zh-CN/scripts/573678)
[![License](https://img.shields.io/badge/license-MIT-007EC6?style=for-the-badge)](LICENSE)
---

## 功能概览

### 沉浸阅读

- 一键进入沉浸模式 (`Ctrl+E`)，退出时淡出动画过渡
- 5 套内置主题配色：宣纸、竹简、牛皮、暗血、简白，一键切换
- 支持自定义主题：取色器逐项配色或粘贴 JSON 主题对象导入，附字段说明与一键复制模板，持久化到本地
- 智能清理文中广告、引流卡片和底部推荐
- 图片可主动折叠，点击占位符弹出全屏预览
- 保留原生操作栏（点赞、收藏）和目录导航

### 首页推荐流

- 宽幅双列卡片网格布局，支持单列/双列切换
- 每组 6 篇，上下篇切换支持跨组自动加载
- 切换动画（淡入 + 上滑）
- 待读列表 (ToRead)：收藏感兴趣的推荐内容，侧栏一键查看
- API 加载的卡片内置互动栏：赞同 / 反对 / 感谢（回答）/ 喜欢（文章）/ 收藏 / 评论跳转，无需跳转原页即可完成互动

### 关注动态页 (/follow)

- 纯 API 驱动（`/api/v3/moments`），推特风格 moment 时间线：动态发起者头像 + 动作行（赞同了回答 / 关注了问题 / 发布了想法 等）+ 内容卡
- 按 `verb` / `action_text_tpl` / `target` 综合分类，支持回答、文章、问题、想法 (pin)；自动展开 feed_group、跳过广告
- 跟随 `paging.next` 翻页，分组加载，单列 / 双列布局切换（双列卡片定高对齐）
- 首页 ↔ 关注 分段开关（标题同行右上角，主题适配）：在首页 (`/`) 双向就地切换不刷新、各自数据独立保留；从 `/follow` 切回首页则跳转重载

### 翻译辅助

- 逐段中外对照翻译，自动注入全文摘要作为上下文
- 划词翻译 + 表达收藏本
- 兼容所有 OpenAI 格式 API（DeepSeek、中转站等）

### 阅读笔记

- 基于当前文章/回答生成结构化阅读笔记
- 支持用户先写草稿，AI 在此基础上润色和补充
- 输出包含：内容原型、深度标签、核心标签、笔记正文
- 笔记可导出为 Markdown 文件

### 复制 Markdown

- 文章页和回答页右上角提供一键复制 Markdown 按钮
- 回答自动附带原问题标题
- 图片以 `![图片#编号](url)` 格式保留，可下拉选择忽略图片的复制模式

### 零损分享

- 将当前沉浸阅读页面导出为 SVG / PNG / HTML
- 保留主题配色和排版，适合跨平台分享

### 信息流 Wiki

从首页推荐流批量构建个人学习卡片库。下面是完整 pipeline：

#### Wiki Pipeline

```
采集 → 全文抓取 → LLM 结构化 → 向量嵌入 → 持久存储 → 检索浏览
```

1. **采集**：通过知乎推荐 API 批量拉取首页内容（可配置上限，默认 100 条）
2. **全文抓取**：对每条推荐使用 `GM_xmlhttpRequest` 跨域抓取原文 HTML，解析 `initialState` 和 DOM 提取正文、问题补充、回答等结构化字段；抓取失败时回退到 API 返回的摘要
3. **LLM 学习卡片生成**：将全文送入 LLM，输出严格 JSON 结构——内容类型、一句话结论、核心知识点、可迁移场景、证据例子、入库判断、标签、可信度评估；并发度和 RPM 可配置，支持暂停/恢复
4. **向量嵌入**：调用独立配置的 Embedding API（默认 `text-embedding-3-small`），为每张卡片计算向量表示
5. **总览合成**：对有效卡片生成趋势雷达 + 学习萃取总览（可关闭）
6. **持久存储**：卡片及向量写入 IndexedDB，标签索引独立维护
7. **检索浏览**：支持按标签分类浏览、语义搜索（余弦相似度排序）；历史运行记录可回溯

整个流程在浏览器端完成，数据不离开本地。

---

## 快捷键

| 按键 | 功能 |
|------|------|
| `Ctrl+E` / `Cmd+E` | 进入/退出沉浸模式 |
| `Ctrl+H` / `Cmd+H` | 显示/隐藏侧边工具栏 |
| `T` | 展开/收起翻译面板 |
| `←` / `→` | 上一篇 / 下一篇 |

---

## 安装指南
在安装本脚本之前，请确保您的浏览器已经安装了以下油猴扩展管理器中的任意一个：

* [Tampermonkey](https://www.tampermonkey.net/) (推荐)
* [Violentmonkey](https://violentmonkey.github.io/)

### 一键安装
点击下方的链接即可直接跳转安装：

👉 **[点击这里安装脚本 (Greasy Fork)](https://greasyfork.org/zh-CN/scripts/573678)**

### 手动安装
1. 点击上面的安装链接进入脚本详情页。
2. 点击页面上的 **“安装脚本”** 按钮。
3. 在弹出的扩展管理窗口中确认安装即可。

## 使用说明
* 安装完成后，请刷新目标网页。
---

## 配置

侧栏齿轮按钮打开设置面板：

- **主 API**：Host / Key / Model（用于翻译、摘要、Wiki 卡片生成）
- **Embedding API**：独立的 Host / Key / Model（用于 Wiki 语义搜索，留空则复用主 API）
- **Wiki 参数**：最大条目数、并发数、RPM 限制、是否生成总览
- **阅读偏好**：目标翻译语言、自动摘要、自动翻译、图片自动隐藏、分享格式
- **自定义主题**：取色器逐项配色或粘贴 JSON 主题对象导入，附字段说明浮窗与一键复制模板
- **知乎互动 · 收藏夹**：填入默认收藏夹 ID，支持一键拉取账号下所有收藏夹列表并选择

---

## 开发

源码拆分为模块化文件，位于 `src/` 目录。构建单文件发布版本：

```bash
node build.js
```

输出 `dist/bundle.user.js`，可直接用于 Greasyfork 发布。

---

## 更新日志

### 2026-06-07 · v5.0.2

- **fix**: 修复问答页回答 URL 抓取错误——`getAnswerKey` 优先取到了作者主页 `meta[itemprop="url"]`(属于 Person schema) 而非回答链接，导致待读/历史/Wiki 记录的 URL 指向个人主页；现优先匹配 `a[href*="/answer/"]`
- **fix**: 修复 `zhuanlan.zhihu.com` 与 `www.zhihu.com` 个人空间数据不同步的 P0 问题——所有个人空间相关存储（待读列表、表达收藏本、阅读笔记、Wiki 历史、翻译缓存、自定义主题、布局偏好、用户信息、API 配置组）统一迁移至 GM 跨域存储，localStorage 保留为写穿缓存
- **fix**: 阅读历史 (IndexedDB) 新增 GM 同步层——写入/更新/删除时同步推送 GM 存储，读取时自动合并其他域的记录，确保专栏页的阅读记录在主站个人空间中可见

### 2026-06-07 · v5.0.1

- **fix**: 修复专栏文章页 (`zhuanlan /p`) 进入沉浸模式时互动栏 (`.ContentItem-actions`) 残留在个人空间顶部的 bug——根因为 CSS `display: flex !important` 优先级高于个人空间的 inline `display:none`，引入 `.zh-space-hidden { display: none !important }` class 彻底压制
- **fix**: 修复开启"展卷时自动生成全文摘要/翻译"后直接进入文章页不显示摘要与翻译卡片的 bug——改用 `window load` 事件确认页面完整加载后再触发，替代硬编码延迟；并加入防御性 `zh-show-tr` class 重断言
- **fix**: 修复专栏页 (`zhuanlan.zhihu.com`) 调用知乎写 API（赞同/收藏等）及用户信息接口因跨域失败的问题，自动检测跨域场景并切换为 `GM_xmlhttpRequest`
- **fix**: 修复从专栏页进入个人空间后退出沉浸模式时文章内容丢失无法还原的问题（退出时先清理个人空间对 wrapper 子元素的隐藏状态）
- **fix**: 沉浸模式下 CSS 强制隐藏知乎原生侧边栏 (`.CornerButtons`, `.GlobalSideBar`) 及顶部/底部固定栏

### 2026-06-07 · v5.0.0

- **feat**: 新增 **个人空间** 功能，集成阅读打卡热力图、阅读记录历史与 Wiki 任务工作台
- **feat**: 引入 **阅读历史与进度追踪**，基于 IndexedDB 自动记录阅读历史并实时更新滚动进度百分比（支持标记“✓ 读完”）
- **feat**: 优化 **Wiki 学习卡片生成 Pipeline**，系统 Prompt 大幅精简 57% 以减少 token 消耗，新增 `credibilityNotes`（可信度说明）与 `personalReflection`（个人反思）字段，并新增“综述”内容分类
- **feat**: 安全升级 Embedding 模型切换逻辑，当变更向量模型时提醒用户清理或重建旧向量，防止不同模型向量不兼容导致语义搜索失效
- **feat**: 阅读笔记 (Radar) 全面支持关注动态正文生成，并加强了生成界面的条件校验，防止非正文页 URL 记录污染
- **opt**: 自动拦截并过滤知乎官方失效的 HTTPDNS 跨域请求，保持开发者控制台的整洁

### 2026-05-31 · v4.3.2

- **feat**: 新增关注动态页 (`/follow`) 适配——纯 API (`/api/v3/moments`) 的推特风格 moment 时间线，按 `verb` / `action_text_tpl` / `target` 分类动态，支持回答 / 文章 / 问题 / 想法 (pin)，展开 feed_group 并跳过广告，跟随 `paging.next` 翻页
- **feat**: 关注动态页支持单列 / 双列布局切换，双列卡片定高对齐
- **feat**: 首页推荐 ↔ 关注动态 分段开关（标题同行右上角，多主题适配）；在首页 (`/`) 双向就地切换不刷新并各自保留数据，从 `/follow` 切回则跳转重载
- **feat**: 设置面板新增自定义主题——取色器逐项配色 / 粘贴 JSON 主题对象导入（兼容单引号、无引号 key），附字段说明浮窗与一键复制模板，持久化到 localStorage 并加入主题循环
- **fix**: 关注动态 actor 头像豁免「主动隐藏图片」功能
- **fix**: 主动隐藏图片时收缩 zhihu 懒加载图外层 figure 预留的空白高度
- **fix**: 简白主题改用更高对比度的配色

### 2026-05-27

- **feat**: 首页推荐流 API 卡片内置互动栏（赞同 / 反对 / 感谢 / 喜欢 / 收藏），无需跳转原页
- **feat**: 设置面板新增「知乎互动 · 收藏夹」区块，支持一键拉取账号收藏夹列表
- **feat**: 待读列表 (ToRead) 推广到所有页面，回答页/文章页右上角可直接将当前页加入待读
- **feat**: 阅读笔记按钮推广到全局（含首页推荐流）
- **fix**: `/p/{pid}/edit` 编辑页禁用 Ctrl+E 沉浸模式快捷键，避免与知乎公式插入冲突
- **fix**: 主题配色切换后持久化到 localStorage + GM_setValue，刷新/跨子域不丢失
