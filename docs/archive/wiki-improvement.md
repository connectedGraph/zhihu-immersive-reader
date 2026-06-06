# Wiki.js 改进方案讨论

## 当前痛点分析

### 1. **功能耦合度高**（1551 行）
- 采集、抓取、摘要、嵌入、存储、检索全混在一个文件
- 难以独立测试、维护、扩展
- 单个阶段出错影响整个流程

### 2. **状态管理混乱**
- `wikiState` 全局对象，字段众多且职责不清
- 进度更新、日志、错误处理分散在各处
- 难以追踪状态变化

### 3. **错误处理不完善**
- 采集异常、抓取失败、AI 生成失败处理逻辑重复
- 没有统一的重试策略
- 错误恢复能力弱（无断点续传）

### 4. **性能瓶颈**
- 全文抓取和 AI 摘要串行执行（虽然内部并发，但阶段间无法并行）
- 向量嵌入是后置操作，不能提前计算
- 没有增量更新机制（每次都重新处理所有条目）

### 5. **UX 问题**
- 进度反馈不够细粒度
- 无法中途修改参数（如 RPM、并发数）
- 卡片库搜索功能基础（只有文本搜索 + 向量搜索）

### 6. **数据质量**
- 学习卡片生成的 prompt 过长，容易超 token 限制
- 没有人工审核机制
- 没有卡片去重、合并逻辑

---

## 改进方案

### 方案 A：模块拆分（推荐）

拆分为 5 个专用模块：

```
wiki-collect.js      (采集首页推荐)
wiki-fetch.js        (全文抓取 + 降级策略)
wiki-process.js      (AI 摘要 + 向量嵌入)
wiki-search.js       (卡片库检索 + 标签管理)
wiki-state.js        (状态管理 + 进度追踪)
```

**优点**：
- 职责单一，易于维护
- 可独立测试
- 支持阶段间并行
- 便于添加新功能（如人工审核、卡片合并）

**工作量**：中等（需要重构状态管理和阶段协调）

---

### 方案 B：增量更新 + 断点续传

**核心改进**：
1. 每条推荐记录 hash，避免重复处理
2. 支持暂停后恢复（记录已完成的阶段）
3. 新增条目只走必要的阶段

**实现**：
```javascript
// 记录每条条目的处理状态
{
  id: 'item-hash',
  status: 'pending' | 'fetched' | 'summarized' | 'embedded' | 'saved',
  phases: {
    fetch: { status, error, result },
    summarize: { status, error, result },
    embed: { status, error, result }
  }
}
```

**优点**：
- 减少重复计算
- 支持长期运行（可分多天采集）
- 失败恢复快

**工作量**：小（在现有基础上增加状态追踪）

---

### 方案 C：智能降级 + 质量评分

**核心改进**：
1. 抓取失败时自动降级（API 摘要 → 卡片文本 → 放弃）
2. 为每条卡片评分（基于来源、正文长度、AI 置信度）
3. 只保存高质量卡片到正式库，低质量卡片进待审核库

**实现**：
```javascript
// 质量评分
{
  qualityScore: 0-100,
  factors: {
    sourceQuality: 'full_text' | 'api' | 'fallback',
    contentLength: number,
    aiConfidence: number,
    credibility: 'high' | 'medium' | 'low'
  }
}
```

**优点**：
- 自动过滤低质内容
- 用户可设置质量阈值
- 便于后续人工审核

**工作量**：小（添加评分逻辑）

---

### 方案 D：卡片库高级功能

**新增功能**：
1. **卡片去重**：相似度检测，自动合并重复卡片
2. **人工审核**：标记卡片为"已审核"、"需修改"、"丢弃"
3. **关联图谱**：卡片间的知识关联（基于标签、向量相似度）
4. **导出模板**：支持导出为 Obsidian、Notion、Anki 格式
5. **订阅更新**：定期自动采集，增量更新卡片库

**工作量**：大（需要新的 UI 和数据结构）

---

## 我的建议

**短期（立即做）**：
- ✅ 方案 B：增量更新 + 断点续传（工作量小，收益大）
- ✅ 方案 C：智能降级 + 质量评分（工作量小，提升用户体验）

**中期（下一个版本）**：
- ✅ 方案 A：模块拆分（为长期维护打基础）

**长期（可选）**：
- 方案 D：高级功能（取决于用户反馈）

---

## 具体改进建议

### 1. 优化 Prompt（立即做）

当前 prompt 过长，容易超 token 限制。建议：

```javascript
// 简化版 prompt（针对不同内容类型）
const WIKI_CARD_PROMPTS = {
  answer: `来源：知�hu 回答
问题：{question}
回答：{content}

请输出 JSON：{contentType, oneSentence, corePoints, judgment, tags, credibility}`,
  
  article: `来源：知乎文章
标题：{title}
正文：{content}

请输出 JSON：{contentType, oneSentence, corePoints, judgment, tags, credibility}`,
  
  question: `来源：知乎问题
问题：{title}
补充：{detail}
回答摘录：{answers}

请输出 JSON：{contentType, oneSentence, corePoints, judgment, tags, credibility}`
};
```

**收益**：减少 token 消耗 30-40%，降低超限风险

---

### 2. 添加质量评分（立即做）

```javascript
function scoreWikiCard(item) {
  let score = 50; // 基础分
  
  // 来源质量
  if (item.fullTextSource === '全文抓取') score += 30;
  else if (item.fullTextSource === '推荐 API 正文') score += 15;
  else score -= 20;
  
  // 内容长度
  const len = (item.fullText || '').length;
  if (len >= 2000) score += 15;
  else if (len >= 500) score += 5;
  else score -= 10;
  
  // AI 置信度
  if (item.wikiCredibility === '高') score += 10;
  else if (item.wikiCredibility === '低') score -= 15;
  
  // 入库判断
  if (item.wikiJudgment === '正式入库') score += 10;
  else if (item.wikiJudgment === '待补全文') score -= 30;
  
  return Math.max(0, Math.min(100, score));
}
```

**收益**：用户可设置质量阈值，自动过滤低质卡片

---

### 3. 支持增量更新（下一个版本）

```javascript
async function startWikiRunIncremental() {
  const lastRunId = getLastWikiRunId();
  const lastItems = lastRunId ? await getWikiItemsByRunId(lastRunId) : [];
  const lastHashes = new Set(lastItems.map(item => stableHash(item.url)));
  
  // 采集新条目
  const allItems = await collectWikiHomeItems();
  const newItems = allItems.filter(item => !lastHashes.has(stableHash(item.url)));
  
  // 只处理新条目
  const fetched = await runLimited(newItems.map(item => () => fetchFullTextForItem(item)));
  const summarized = await runLimited(fetched.map(item => () => summarizeWikiItem(item)));
  
  // 合并结果
  const allCards = [...lastItems, ...summarized];
  return buildWikiMarkdown(allCards);
}
```

**收益**：支持长期运行，减少重复计算

---

### 4. 改进卡片库搜索（下一个版本）

```javascript
// 支持多维度搜索
async function searchWikiCards(query, filters = {}) {
  let results = await getAllWikiCards();
  
  // 文本搜索
  if (query) {
    const lower = query.toLowerCase();
    results = results.filter(card =>
      card.title.toLowerCase().includes(lower) ||
      card.oneSentence.toLowerCase().includes(lower) ||
      card.tags.some(t => t.toLowerCase().includes(lower))
    );
  }
  
  // 过滤器
  if (filters.contentType) {
    results = results.filter(c => c.contentType === filters.contentType);
  }
  if (filters.credibility) {
    results = results.filter(c => c.credibility === filters.credibility);
  }
  if (filters.judgment) {
    results = results.filter(c => c.judgment === filters.judgment);
  }
  if (filters.minQualityScore) {
    results = results.filter(c => (c.qualityScore || 0) >= filters.minQualityScore);
  }
  
  // 排序
  if (filters.sortBy === 'quality') {
    results.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
  } else if (filters.sortBy === 'recent') {
    results.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
  
  return results;
}
```

**收益**：用户可精确查找卡片

---

## 总结

| 方案 | 工作量 | 收益 | 优先级 |
|------|--------|------|--------|
| 优化 Prompt | 小 | 减少 token 消耗 | ⭐⭐⭐ |
| 质量评分 | 小 | 自动过滤低质 | ⭐⭐⭐ |
| 增量更新 | 中 | 支持长期运行 | ⭐⭐ |
| 模块拆分 | 大 | 便于维护扩展 | ⭐⭐ |
| 高级搜索 | 中 | 提升用户体验 | ⭐ |

**建议先做优先级 ⭐⭐⭐ 的两项，快速见效。**

你倾向于哪个方向？或者有其他痛点想解决？
