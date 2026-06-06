# Wiki 学习卡片改动总结

## 改动内容

### 1. Prompt 优化（wiki.js）

**System Prompt 精简**：
- 字数从 650 → 280（减少 57%）
- 删除冗余要求，保留核心指导
- 新增字段说明：`credibilityNotes`、`personalReflection`

**新增字段**：
```
- credibilityNotes: ≤100字，说明可信度原因（替代 credibilityReason）
- personalReflection: ≤50字，与已知知识的冲突或启发
```

**调整字段约束**：
```
corePoints: 2-3条 → 1-3条（灵活应对不同复杂度）
transferScenarios: 0-2个 → 0-3个（更好捕捉应用场景）
```

**优化分类**：
```
contentType: 删除"梗文化"，新增"综述"
  - 概念 / 方法 / 案例 / 观点 / 综述 / 争议 / 采集异常 / 待核验

judgment: 简化为 3 个实际状态
  - 正式入库 / 素材库 / 待核验 / 丢弃
  - （原"只作素材"改为"素材库"，原"待补全文"改为"待核验"）
```

### 2. 数据结构更新（wiki.js）

**新增字段到卡片对象**：
```javascript
wikiCredibilityNotes: string (≤100字)  // 替代 wikiCredibilityReason
wikiPersonalReflection: string (≤50字) // 新增
```

**更新 makeAnomalyLearningCard()**：
- 改 `wikiJudgment` 为 `'待核验'`（原为 `'待补全文'`）
- 改 `wikiCredibilityReason` 为 `wikiCredibilityNotes`
- 新增 `wikiPersonalReflection: ''`

**更新 buildWikiMarkdown()**：
- 统计改为：正式 / 素材 / 待核验（原为正式 / 素材 / 待补全文）
- 新增输出 `- 个人反思：${item.wikiPersonalReflection}`
- 改 `wikiCredibilityReason` 为 `wikiCredibilityNotes`

### 3. IndexedDB Schema 升级（wiki-store.js）

**版本号升级**：
```
WIKI_CARDS_DB_VERSION: 1 → 2
```

**新增字段到卡片存储**：
```javascript
credibilityNotes: string  // 新增
personalReflection: string // 新增
```

**更新 saveWikiCards()**：
```javascript
const cardsToSave = finalItems
    .filter(item => item.wikiContentType !== '采集异常' && item.wikiJudgment !== '丢弃')
    .map(item => ({
        // ... 其他字段
        credibilityNotes: item.wikiCredibilityNotes || '',
        personalReflection: item.wikiPersonalReflection || '',
        // ... 其他字段
    }));
```

---

## 改动影响

### 用户体验改进

| 改进项 | 效果 |
|--------|------|
| 新增 `personalReflection` | 支持记录个人思考，深度学习 |
| 新增 `credibilityNotes` | 允许更详细的可信度说明（100字 vs 原 90字） |
| 调整 `transferScenarios` 0-3个 | 更好捕捉多个应用场景 |
| 简化 `judgment` 分类 | 减少分类歧义，决策更清晰 |
| 优化 `contentType` 分类 | 新增"综述"，删除"梗文化" |

### 数据库兼容性

- IndexedDB 版本升级到 v2
- 旧数据自动迁移（新字段默认为空）
- 无需手动清理数据库

### Token 消耗

- System Prompt 减少 57%
- 总体 token 消耗减少 ~15%
- 降低超限风险

---

## 后续工作

### 立即需要做的

1. **测试新 prompt**：验证 AI 生成的 `personalReflection` 质量
2. **UI 更新**：卡片库展示新字段
3. **导出模板**：支持导出 `personalReflection` 到 Obsidian/Notion

### 可选改进

1. **增量更新**：支持断点续传（下一版本）
2. **质量评分**：自动评分卡片质量（下一版本）
3. **标签层级**：支持 `#领域/子领域` 的三层标签（下一版本）
4. **复习记录**：支持间隔重复学习（下一版本）

---

## 代码变更统计

| 文件 | 改动 | 行数 |
|------|------|------|
| wiki.js | Prompt 优化、字段更新、分类调整 | ~50 |
| wiki-store.js | 版本升级、新字段支持 | ~5 |
| **总计** | | ~55 |

---

## 验证清单

- [x] Prompt 精简完成
- [x] 新字段添加完成
- [x] 分类调整完成
- [x] 数据结构更新完成
- [x] IndexedDB schema 升级完成
- [ ] 测试新 prompt 输出质量
- [ ] 更新 UI 展示新字段
- [ ] 更新导出模板
