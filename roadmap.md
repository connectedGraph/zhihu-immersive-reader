# 主页推荐流 Action 栏（API 模式） Roadmap

## 1. 背景

当前主页沉浸模式的卡片有"双轨"来源：

| 批次 | 来源 | 实现位置 | 是否带 action 栏 |
| --- | --- | --- | --- |
| 第 1 组（DOM 兜底） | 克隆 `#TopstoryContent` 中 React 已渲染节点 | `page-home.js:317 collectHomeFeedItemsFromDOM` → `buildHomeRecord` | 有（原生 `.ContentItem-actions` 一并被克隆） |
| 第 2 组及之后（API 加载） | `GET /api/v3/feed/topstory/recommend` | `page-home.js:281 fetchHomeRecommendApiPage` → `buildHomeApiClone` | 无（脚本自己拼 HTML，只附了"打开原文"链接，见 `page-home.js:185-198`） |

结果：用户只能在第 1 组直接点赞/收藏，后续批次必须跳转原页才能交互。
目标：让 API 卡片也具备赞同 / 反对 / 感谢 / 收藏的能力，全部走知乎写 API，零跳转完成。

## 2. 写 API 速查（已抓包确认 ✅）

> ✅ 关键结论：**所有写接口都不需要 `x-zse-96`**，方案 C 全线可用。
> 只要带 `x-xsrftoken`（=cookie 里 `_xsrf`）+ `credentials:'include'` 即可。
> z_c0 是 HttpOnly，浏览器会自动带上，不需要手动读。

### 2.1 answer ✅

| 操作 | 方法 | 路径 | Body |
| --- | --- | --- | --- |
| 赞同 | POST | `/api/v4/answers/{answer_id}/voters` | `{"type":"up"}` |
| 反对 | POST | `/api/v4/answers/{answer_id}/voters` | `{"type":"down"}` |
| 取消投票 | POST | `/api/v4/answers/{answer_id}/voters` | `{"type":"neutral"}` |
| 感谢 | POST | `/api/v4/answers/{answer_id}/thankers` | `{}` |
| 取消感谢 | DELETE | `/api/v4/answers/{answer_id}/thankers` | — |

注：answer_id 全站唯一，与 question_id 解耦，路径里只用 answer_id。

### 2.2 article ✅

| 操作 | 方法 | 路径 | Body |
| --- | --- | --- | --- |
| 赞同 | POST | `/api/v4/articles/{article_id}/voters` | `{"voting":1}` |
| 反对 | POST | `/api/v4/articles/{article_id}/voters` | `{"voting":-1}` |
| 取消投票 | POST | `/api/v4/articles/{article_id}/voters` | `{"voting":0}` |
| 喜欢（红心） | POST | `/api/v4/articles/{article_id}/likers` | `{}` |
| 取消喜欢 | （待实测，候选 `DELETE /likers` 或 `POST {liking:0}`） | — | — |

注意 voters 字段名与 answer 不同：`type` ↔ `voting`。`/likers` ≠ `/thankers`（后者 article 上是 404）。

### 2.3 收藏 ✅（路径与方法已确认）

| 操作 | 方法 | URL |
| --- | --- | --- |
| 添加收藏 | POST | `/api/v4/collections/{collection_id}/contents?content_id={id}&content_type={article\|answer}` |
| 取消收藏 | DELETE | `/api/v4/collections/{collection_id}/contents/{id}?content_type={article\|answer}` |

要点：
- 添加是 `/contents`（**没**尾随 id），取消是 `/contents/{id}`。
- 参数全在 query string，**body 为空**。
- `collection_id` 必须由用户填（默认收藏夹无 `is_default` 标记，不能可靠地自动选）。**走设置面板**，详见 §4 Phase 1。

### 2.4 状态回填字段（已确认）

从 feed 接口的 `target.relationship` 实测：

| 类型 | 可用字段 |
| --- | --- |
| answer | `voting`（1/0/-1）、`is_thanked`、`is_nothelp` |
| article | 推荐流里 relationship 是空对象 `{}`，没有任何投票/喜欢/收藏字段 |

含义：
- answer 进沉浸模式可直接初始化按钮态。
- article 进沉浸模式只能默认"未操作"态；用户点过之后由本地 record 维护。
- **没有任何字段告诉我们"是否已收藏"**——`is_favorited` 不存在。要查必须单独 GET `collections` 列表（成本高），暂不实现，按"未收藏"显示，由用户自己感知。

### 2.5 响应字段

实测 voters 返回 `{voting, voteup_count, voted_at}` 这类业务字段，不是 `{success:true}`。

实现策略：HTTP 2xx 即视为成功，能从返回里取的计数就更新本地 record；4xx 解析 `error.message` 提示给用户。

## 3. 鉴权（已确认 ✅）

| 项 | 来源 | 处理方式 |
| --- | --- | --- |
| `z_c0` | Cookie（HttpOnly） | 浏览器自动携带，**不要试图用 `document.cookie` 读取**（读不到会误判未登录） |
| `x-xsrftoken` | Cookie 里的 `_xsrf` | 写一个 `getXSRFToken()`，从 `document.cookie` 解析 |
| `x-zse-96` | — | **不需要** ✅。所有写接口（voters/thankers/likers/collections）都不强校验签名。 |
| `x-requested-with: fetch` | — | 非必须，但加上更稳妥 |
| `Content-Type: application/json` | — | 写操作必加（即便 body 是 `{}`） |

判断登录的策略：直接发请求看 401，或读 `d_c0` cookie；不要看 `z_c0`。

## 4. 落地阶段拆分

### Phase 0 — 已完成 ✅

抓包确认 §2 / §3 全部 endpoint 与鉴权方案。剩余可在 Phase 2/3 顺手验证的小尾巴：article 取消喜欢的具体形态。

### Phase 1 — 抽出 zhihu-action.js + 设置项

**新增模块** `src/zhihu-action.js`，导出：

- `getXSRFToken()` —— 从 `document.cookie` 提取 `_xsrf`。
- `zhihuFetch(method, path, { query, body })` —— 统一封装：
  - `credentials: 'include'`
  - 自动加 `x-xsrftoken` / `x-requested-with: fetch`
  - 写操作自动加 `content-type: application/json`
  - HTTP 2xx → `{ok:true, status, data}`，其余 → 抛错带 `error.message`
- 高层 API：
  - `voteAnswer(id, dir)` —— `dir ∈ {'up','down','neutral'}`，POST `/api/v4/answers/{id}/voters` body `{type:dir}`
  - `voteArticle(id, dir)` —— `dir ∈ {1,-1,0}`，POST `/api/v4/articles/{id}/voters` body `{voting:dir}`
  - `thankAnswer(id, on)` —— on=true → POST，on=false → DELETE，路径 `/api/v4/answers/{id}/thankers`
  - `likeArticle(id, on)` —— on=true → POST `/api/v4/articles/{id}/likers` body `{}`；on=false 先 try `DELETE /likers`，失败再 try `POST {liking:0}`（实战时一次性确定）
  - `addCollection(cid, contentId, contentType)` —— POST `/api/v4/collections/{cid}/contents?content_id=&content_type=`
  - `removeCollection(cid, contentId, contentType)` —— DELETE `/api/v4/collections/{cid}/contents/{contentId}?content_type=`

**配置项扩展**（`constants.js` DEFAULT_CONFIG + `ui.js` 设置面板表单）：

- 新增 `defaultCollectionId: ''`（空表示用户未配置，收藏按钮就走"提示去设置面板填 id"或直接降级隐藏）。
- 设置面板加一段：
  - 输入框：知乎默认收藏夹 ID
  - 旁边一个"获取我的收藏夹"按钮，点了之后调用 `GET /api/v4/people/self/collections`，把列表 `[{id, title}]` 渲染成可点击列表，用户点哪个就把 id 填进输入框。

**构建顺序**（`build.js`）：让 `zhihu-action.js` 排在 `api.js` 之后、`page-home.js` 之前。

### Phase 2 — API 卡片 action 栏 UI

**UI 模板**：复用知乎原生 `.ContentItem-actions.css-1ptadse` 结构，确保视觉与第 1 组 DOM 卡片一致。

策略：
- 沿用原生 className（VoteButton / VoteButton--down / ContentItem-action 等），让现有 `.zh-immersive` 样式不必再改。
- **不实现的按钮直接删除节点**：
  - 「分享」「申请转载」「解释这篇内容」「更多 (...)」全部删。
  - 「评论」保留为"打开原文 + 跳到评论锚点"的链接（不做内联评论）。

替换点：
- `buildHomeApiClone` (`page-home.js:173`) 末尾的 actions 区，从只有"打开原文"扩展为完整 action bar。
- 给 `buildHomeApiRecord` 增加字段：`voting`（1/0/-1）、`thanked`、`liked`、`voteup_count`、`thanks_count`、`favlists_count`，从 §2.4 的 `target.relationship` + `target.*_count` 拷过来。
- 沉浸模式的卡片视图（`renderHomeItem` 的 `view` 容器）也走相同的 action 栏组件 —— 抽 `buildActionBar(record)` 复用。

### Phase 3 — 交互与状态同步

- 点击事件：调用 Phase 1 的高层 API；返回成功后：
  - 在内存 record 上更新 `voting` / `thanked` / `liked` 与计数。
  - 当前卡片局部重渲染（不重建整组）。
  - 写回 `_homeFeedCache`（`persistHomeFeedCache`），保证下次进入沉浸模式状态不丢。
- 失败处理：
  - 401 → toast "请先登录知乎"，禁用 action 栏。
  - 收藏点击但未配置 `defaultCollectionId` → toast "请到设置 → 收藏夹 ID 填入"，并禁用收藏按钮。
  - 4xx 其它 → toast `error.message`，按钮恢复原态。
  - 限频：同一 record 同一操作 1 秒内只触发一次，按钮禁用 + spinner。

### Phase 4 — 类型分发

| 类型 | voters | 喜欢/感谢 | 收藏 |
| --- | --- | --- | --- |
| answer | `voteAnswer(id, 'up'\|'down'\|'neutral')` | `thankAnswer(id, on)` | `addCollection(cid, id, 'answer')` |
| article | `voteArticle(id, 1\|-1\|0)` | `likeArticle(id, on)` | `addCollection(cid, id, 'article')` |
| question | 无 voters / 无喜欢 | — | 待确认（暂只显示"打开原文"） |

`buildActionBar(record)` 内部根据 `record.apiTargetType` 决定渲染哪些按钮、绑哪个 handler。

### Phase 5 — 回填与持久化

- 进入沉浸模式时，从 `target.relationship` 取 answer 的 `voting` / `is_thanked` 初始化按钮态。
- article 的 `relationship` 在 feed 里是空对象，按"未操作"渲染。
- "是否已收藏"无法从 feed 字段判断，统一按"未收藏"渲染；用户点过之后由本地 record 维护，并写入 `_homeFeedCache`。
- `persistHomeFeedCache` 已经持久化 groups，record 上挂的状态字段会一并写盘。

### Phase 6 — DOM 卡片对齐（可选，先不做）

第 1 组的 React 原生卡片自带 actions 且自管状态，跟我们 record 不同步。统一接管会丢失原生动效，先保留现状。

## 5. 风险与回退

| 风险 | 触发条件 | 回退 |
| --- | --- | --- |
| 知乎风控触发（短时间大量写） | 用户连点 | 客户端节流 + 同一 id 同一 action 防抖 |
| 写成功但返回字段非预期 | 知乎接口微调 | 宽容解析：HTTP 2xx 即更新本地 state，并尽可能从返回里取计数 |
| 用户没填收藏夹 ID | 收藏按钮触发 | toast 提示去设置面板填，按钮置灰 |
| article "是否已收藏"无法回填 | feed 不返回相关字段 | 默认按"未收藏"显示，操作过程中靠本地 record 维护 |

## 6. 不在本期范围

- 内联评论 / 评论提交：仍跳转原页。
- 自定义收藏夹选择 UI：先只走"用户填的默认收藏夹 id"。
- 关注作者 / 屏蔽 / 举报：不相关。
- DOM 卡片（第 1 组）action 栏接管：保留原生交互。

## 7. 立即可做的下一步

抓包阶段已完成 ✅。下面直接开 Phase 1：

1. 新建 `src/zhihu-action.js`，按 §4 Phase 1 实现 6 个高层 API + `zhihuFetch`。
2. `constants.js` 加 `defaultCollectionId: ''`；`templates.js` / `ui.js` 设置面板加"收藏夹 ID"输入框 + "拉取我的收藏夹"辅助按钮。
3. `build.js` 把新模块插入构建顺序。
4. Phase 1 跑通后再开 Phase 2 改 `page-home.js`。
