# 数据结构文档

本文档全面概述了 Cherry Studio App 中使用的数据结构，按存储类型组织。

## 目录

- [Preference 系统（偏好设置）](#preference-系统偏好设置)
- [Redux Store 结构](#redux-store-结构)
- [SQLite 数据库架构](#sqlite-数据库架构)
- [数据关系](#数据关系)
- [存储考虑](#存储考虑)

---

## Preference 系统（偏好设置）

Cherry Studio 使用基于 SQLite 的 PreferenceService 管理所有用户配置和应用状态。这是一个高性能、类型安全的解决方案，取代了部分 Redux store。

### 架构概述

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                          │
└───────────────┬─────────────────────────────────────────────┘
                │ usePreference() hooks
                │ (useSyncExternalStore)
                ▼
┌─────────────────────────────────────────────────────────────┐
│               PreferenceService (Singleton)                  │
│  ┌──────────────┬──────────────┬─────────────────────────┐  │
│  │ Lazy Cache   │ Subscribers  │ Request Queue           │  │
│  │ Map<K, V>    │ Map<K, Set>  │ Map<K, Promise<void>>   │  │
│  └──────────────┴──────────────┴─────────────────────────┘  │
│         │                                                     │
│         │ Optimistic Updates with Rollback                   │
│         ▼                                                     │
└─────────────────────────────────────────────────────────────┘
                │
                │ Drizzle ORM
                ▼
┌─────────────────────────────────────────────────────────────┐
│          SQLite Database (preference table)                  │
│   ┌────────┬──────────┬─────────────┬────────────────┐      │
│   │ key    │ value    │ description │ updated_at     │      │
│   ├────────┼──────────┼─────────────┼────────────────┤      │
│   │ TEXT   │ JSON     │ TEXT        │ INTEGER        │      │
│   └────────┴──────────┴─────────────┴────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### PreferenceService 特性

#### 1. **懒加载（Lazy Loading）**
- 首次访问时才从数据库加载
- 减少应用启动时间
- 降低内存占用

#### 2. **乐观更新（Optimistic Updates）**
- UI 立即更新，无需等待数据库写入
- 后台异步同步到 SQLite
- 失败时自动回滚

#### 3. **请求队列（Request Queue）**
- 序列化同一 key 的更新操作
- 防止竞态条件
- 保证数据一致性

#### 4. **React 18 集成**
- 基于 `useSyncExternalStore`
- 完美支持并发渲染
- 自动订阅/取消订阅

#### 5. **类型安全**
- 基于 TypeScript 的类型推断
- 根据 key 自动推导 value 类型
- 编译时类型检查

### Preference 表结构

```sql
CREATE TABLE preference (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT,                      -- JSON 格式存储
  description TEXT,                -- 字段说明
  created_at INTEGER,              -- 创建时间戳
  updated_at INTEGER               -- 更新时间戳
);
```

### Preference 项目定义

应用中共有 **10 个** preference 项，分为 5 个类别：

#### 用户配置（User Configuration）

```typescript
{
  'user.avatar': string              // 用户头像图片路径或 URL
  'user.name': string                // 用户显示名称
  'user.id': string                  // 唯一用户标识符（UUID）
}
```

**默认值：**
- `user.avatar`: `''` (空字符串)
- `user.name`: `'Cherry Studio'`
- `user.id`: 自动生成 UUID

#### UI 配置（UI Configuration）

```typescript
{
  'ui.theme_mode': ThemeMode         // 应用主题模式
}

enum ThemeMode {
  light = 'light',    // 浅色主题
  dark = 'dark',      // 深色主题
  system = 'system'   // 跟随系统
}
```

**默认值：**
- `ui.theme_mode`: `ThemeMode.system`

#### Topic 状态（Topic State）

```typescript
{
  'topic.current_id': string         // 当前活跃的对话话题 ID
}
```

**默认值：**
- `topic.current_id`: `''` (空字符串，表示无活跃话题)

#### WebSearch 配置（Web Search Configuration）

```typescript
{
  'websearch.search_with_time': boolean           // 在搜索查询中添加当前日期
  'websearch.max_results': number                 // 最大搜索结果数量 (1-20)
  'websearch.override_search_service': boolean    // 覆盖默认搜索服务设置
  'websearch.content_limit': number | undefined   // 搜索结果内容长度限制（字符数）
}
```

**默认值：**
- `websearch.search_with_time`: `true`
- `websearch.max_results`: `5`
- `websearch.override_search_service`: `true`
- `websearch.content_limit`: `2000`

#### App 状态（App State）

```typescript
{
  'app.initialized': boolean         // 应用是否已完成首次初始化
  'app.welcome_shown': boolean       // 是否已显示欢迎页面
}
```

**默认值：**
- `app.initialized`: `false`
- `app.welcome_shown`: `false`

### 使用方法

#### 基础用法

```typescript
import { usePreference } from '@/hooks/usePreference'

function ThemeSettings() {
  const [theme, setTheme] = usePreference('ui.theme_mode')

  return (
    <Select
      value={theme}
      onChange={(newTheme) => setTheme(newTheme)}
    />
  )
}
```

#### 批量操作

```typescript
import { useMultiplePreferences } from '@/hooks/usePreference'

function UserProfile() {
  const preferences = useMultiplePreferences([
    'user.avatar',
    'user.name',
    'ui.theme_mode'
  ])

  const { values, setters, isLoading } = preferences

  return (
    <div>
      <Avatar src={values['user.avatar']} />
      <Input
        value={values['user.name']}
        onChange={(e) => setters['user.name'](e.target.value)}
      />
    </div>
  )
}
```

#### 非 React 上下文使用

```typescript
import { preferenceService } from '@/services/PreferenceService'

// 同步读取（从缓存）
const theme = preferenceService.getCached('ui.theme_mode')

// 异步读取（懒加载）
const theme = await preferenceService.get('ui.theme_mode')

// 更新值（乐观更新）
await preferenceService.set('ui.theme_mode', 'dark')
```

#### 专用 Hooks

应用提供了多个专用 hooks 以简化常见用例：

```typescript
// 用户设置
import { useSettings } from '@/hooks/useSettings'
const { avatar, userName, userId, theme, setAvatar, setUserName, setTheme } = useSettings()

// App 状态
import { useAppState } from '@/hooks/useAppState'
const { initialized, welcomeShown, setInitialized, setWelcomeShown } = useAppState()

// WebSearch 设置
import { useWebsearch } from '@/hooks/useWebsearch'
const { searchWithTime, maxResults, setMaxResults } = useWebsearch()

// Topic 状态
import { useCurrentTopic } from '@/hooks/useTopic'
const { currentTopicId, setCurrentTopicId } = useCurrentTopic()
```

### 数据持久化流程

#### 读取流程

```
1. usePreference('key') 调用
   ↓
2. 检查 PreferenceService 缓存
   ↓
3. 缓存命中？
   ├─ 是 → 返回缓存值
   └─ 否 → 从 SQLite 加载
              ↓
          存入缓存
              ↓
          返回值
```

#### 写入流程

```
1. setPreference(newValue) 调用
   ↓
2. 保存旧值（用于回滚）
   ↓
3. 立即更新缓存（乐观更新）
   ↓
4. 通知所有订阅者（UI 更新）
   ↓
5. 异步写入 SQLite
   ├─ 成功 → 完成
   └─ 失败 → 回滚缓存
              ↓
          通知订阅者
              ↓
          抛出错误
```

### 性能优化

1. **懒加载**：只加载使用的 preference，避免一次性加载所有配置
2. **内存缓存**：已加载的值保存在内存中，避免重复数据库查询
3. **请求队列**：合并同一 key 的并发更新，减少数据库写入次数
4. **乐观更新**：UI 立即响应，不等待数据库操作完成

### 类型定义

完整类型定义位于 `src/shared/data/preference/preferenceTypes.ts`：

```typescript
export interface PreferenceSchemas {
  default: {
    // User Configuration
    'user.avatar': string
    'user.name': string
    'user.id': string

    // UI Configuration
    'ui.theme_mode': ThemeMode

    // Topic State
    'topic.current_id': string

    // Web Search Configuration
    'websearch.search_with_time': boolean
    'websearch.max_results': number
    'websearch.override_search_service': boolean
    'websearch.content_limit': number | undefined

    // App State
    'app.initialized': boolean
    'app.welcome_shown': boolean
  }
}

export type PreferenceKeyType = keyof PreferenceSchemas['default']
```

---

## Redux Store 结构

应用状态通过 Redux Toolkit 管理，并通过 AsyncStorage 进行持久化。除 `runtime` 外的所有 slice 都会自动持久化。

### Store Slices

#### `assistant` - 助手管理

```typescript
interface AssistantsState {
  builtInAssistants: Assistant[] // 内置 AI 助手配置
}
```

**说明：**
- 管理系统内置的 AI 助手
- 用户自定义的助手存储在 SQLite `assistants` 表中

#### `runtime` - 临时状态（不持久化）

```typescript
interface RuntimeState {
  websearch: {
    activeSearches: Record<string, WebSearchStatus> // 活跃的网页搜索状态
  }
}

interface WebSearchStatus {
  phase: 'default' | 'fetch_complete' | 'rag' | 'rag_complete' | 'rag_failed' | 'cutoff'
  countBefore?: number
  countAfter?: number
}
```

**说明：**
- 仅存储运行时临时状态
- 应用重启后不持久化
- 主要用于实时 UI 状态同步

---

## SQLite 数据库架构

应用使用 SQLite 与 Drizzle ORM 进行持久数据存储。所有表都使用基于文本的主键以保持一致性。

### 核心表

#### `assistants` - AI 助手配置

```sql
CREATE TABLE assistants (
  id TEXT PRIMARY KEY NOT NULL UNIQUE,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',  -- system: 系统内置, external: 用户创建
  emoji TEXT,
  description TEXT,
  model TEXT,
  default_model TEXT,
  settings TEXT,                        -- JSON 配置
  enable_web_search INTEGER,            -- 0/1 boolean
  enable_generate_image INTEGER,
  knowledge_recognition TEXT,
  tags TEXT,                            -- JSON 数组
  group TEXT,
  websearch_provider_id TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE INDEX idx_assistants_type ON assistants(type);
```

#### `topics` - 对话话题

```sql
CREATE TABLE topics (
  id TEXT PRIMARY KEY NOT NULL UNIQUE,
  assistant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  isLoading INTEGER                     -- 0/1 boolean, 话题是否正在加载
);

-- 性能索引
CREATE INDEX idx_topics_assistant_id ON topics(assistant_id);
CREATE INDEX idx_topics_created_at ON topics(created_at);
CREATE INDEX idx_topics_assistant_id_created_at ON topics(assistant_id, created_at);
CREATE INDEX idx_topics_updated_at ON topics(updated_at);
```

#### `messages` - 聊天消息

```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY NOT NULL UNIQUE,
  role TEXT NOT NULL,                   -- user, assistant, system
  assistant_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  status TEXT NOT NULL,                 -- processing, success, error, 等
  model_id TEXT,
  model TEXT,
  type TEXT,
  useful INTEGER,                       -- 用户反馈 (0/1)
  ask_id TEXT,                         -- 分组相关消息
  mentions TEXT,                       -- 提及的 JSON 数组
  usage TEXT,                          -- JSON 使用统计
  metrics TEXT,                        -- JSON 性能指标
  multi_model_message_style TEXT,
  fold_selected INTEGER
);

-- 性能索引
CREATE INDEX idx_messages_topic_id ON messages(topic_id);
CREATE INDEX idx_messages_assistant_id ON messages(assistant_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

#### `message_blocks` - 消息内容块

消息可以包含多个不同类型的内容块（文本、代码、图片、工具调用等）。

```sql
CREATE TABLE message_blocks (
  id TEXT PRIMARY KEY NOT NULL UNIQUE,
  message_id TEXT NOT NULL,
  type TEXT NOT NULL,                   -- text, code, image, tool, thinking, citation, translation
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  status TEXT NOT NULL,                 -- processing, success, error
  model TEXT,                          -- JSON 模型配置
  metadata TEXT,                       -- JSON 元数据
  error TEXT,                          -- JSON 错误信息

  -- 通用内容字段
  content TEXT,                        -- 主要内容
  language TEXT,                       -- 代码块的编程语言
  url TEXT,                           -- 图片块的 URL
  file TEXT,                          -- 附件的 JSON FileMetadata

  -- 工具块特定
  tool_id TEXT,
  tool_name TEXT,
  arguments TEXT,                      -- JSON 工具参数

  -- 翻译块特定
  source_block_id TEXT,
  source_language TEXT,
  target_language TEXT,

  -- 引用块特定
  response TEXT,                       -- JSON WebSearchResponse
  knowledge TEXT,                      -- JSON KnowledgeReference[]

  -- 思考块特定
  thinking_millsec INTEGER,

  -- 主文本块特定
  knowledge_base_ids TEXT,             -- JSON 字符串数组
  citation_references TEXT             -- JSON 引用参考
);

-- 性能索引
CREATE INDEX idx_message_blocks_message_id ON message_blocks(message_id);
CREATE INDEX idx_message_blocks_type ON message_blocks(type);
```

### 配置表

#### `providers` - LLM 服务提供商

```sql
CREATE TABLE providers (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,                   -- openai, anthropic, google, 等
  name TEXT NOT NULL,
  api_key TEXT,
  api_host TEXT,
  api_version TEXT,
  models TEXT,                         -- 可用模型的 JSON 数组
  enabled INTEGER,                     -- 0/1 boolean
  is_system INTEGER,                   -- 系统提供 vs 用户添加
  is_authed INTEGER,                   -- 认证状态
  rate_limit INTEGER,
  is_not_support_array_content INTEGER,
  notes TEXT,
  created_at INTEGER,
  updated_at INTEGER
);
```

#### `websearch_providers` - 网页搜索服务

```sql
CREATE TABLE websearch_providers (
  id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT,                           -- free, api
  api_key TEXT,
  api_host TEXT,
  engines TEXT,                        -- 搜索引擎的 JSON 数组
  url TEXT,
  basic_auth_username TEXT,
  basic_auth_password TEXT,
  content_limit INTEGER,
  using_browser INTEGER,               -- 0/1 boolean
  created_at INTEGER,
  updated_at INTEGER
);
```

#### `preference` - 用户偏好设置

```sql
CREATE TABLE preference (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT,                          -- JSON 格式存储所有类型
  description TEXT,
  created_at INTEGER,
  updated_at INTEGER
);
```

**说明：**
- 存储所有用户配置和应用状态
- 由 PreferenceService 管理
- 详见本文档 "Preference 系统" 章节

### 存储和知识表

#### `files` - 上传的文件

```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY NOT NULL UNIQUE,
  origin_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  size INTEGER NOT NULL,
  ext TEXT NOT NULL,
  count INTEGER NOT NULL,              -- 引用计数
  type TEXT NOT NULL,                  -- image, document, audio, video
  mime_type TEXT NOT NULL,
  md5 TEXT NOT NULL
);

CREATE INDEX idx_files_md5 ON files(md5);
```

#### `knowledges` - 知识库

```sql
CREATE TABLE knowledges (
  id TEXT PRIMARY KEY NOT NULL UNIQUE,
  name TEXT NOT NULL,
  model TEXT NOT NULL,                 -- 嵌入模型
  dimensions INTEGER NOT NULL,         -- 向量维度
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  version TEXT NOT NULL,
  document_count INTEGER,
  chunk_size INTEGER,
  chunk_overlap INTEGER,
  threshold INTEGER,
  rerank_model TEXT,
  items TEXT NOT NULL                  -- JSON 知识项目数组
);

CREATE INDEX idx_knowledges_name ON knowledges(name);
```

#### `mcp` - MCP (Model Context Protocol) 服务器配置

```sql
CREATE TABLE mcp (
  id TEXT PRIMARY KEY NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,                  -- builtin, custom
  command TEXT NOT NULL,
  args TEXT,                           -- JSON 数组
  env TEXT,                            -- JSON 对象
  enabled INTEGER,                     -- 0/1 boolean
  created_at INTEGER,
  updated_at INTEGER
);

CREATE INDEX idx_mcp_enabled ON mcp(enabled);
```

---

## 数据关系

### 主要关系

```
assistants (1) ──────────< (N) topics
    │                          │
    │                          │
    └──────────< (N) messages <┘
                     │
                     │
                     └──────────< (N) message_blocks

websearch_providers (1) ────────< (N) assistants
                                      (通过 websearch_provider_id)
```

### 数据流

#### 1. 创建新对话

```
用户选择助手
    ↓
创建新 topic
    ↓
设置 topic.assistant_id = assistant.id
    ↓
更新 preference: topic.current_id = topic.id
```

#### 2. 发送消息

```
用户输入消息
    ↓
创建 message (role: user)
    ↓
设置 message.topic_id 和 message.assistant_id
    ↓
创建 message_block (type: text, content: 用户输入)
    ↓
AI 生成回复
    ↓
创建 message (role: assistant)
    ↓
创建多个 message_blocks (text, code, image, 等)
```

#### 3. 网页搜索

```
消息包含搜索请求
    ↓
获取 assistant.websearch_provider_id
    ↓
查询 websearch_providers 表
    ↓
使用提供商 API 执行搜索
    ↓
创建 message_block (type: citation)
    ↓
在 response 字段存储搜索结果 JSON
```

#### 4. 文件上传

```
用户上传文件
    ↓
计算文件 MD5
    ↓
检查 files 表是否存在相同 MD5
    ├─ 存在 → 增加 count（引用计数）
    └─ 不存在 → 创建新记录
    ↓
在 message_block.file 中引用文件 ID
```

---

## 存储考虑

### Preference (SQLite)

**存储位置：** SQLite 数据库 `preference` 表
**管理方式：** PreferenceService
**持久化：** 自动持久化到本地数据库

**优势：**
- 类型安全的 API
- 懒加载，按需读取
- 乐观更新，UI 响应迅速
- 自动回滚机制
- 与 React 18 深度集成

**适用场景：**
- 用户配置（头像、用户名、主题等）
- 应用状态（初始化标志、欢迎页面状态）
- UI 状态（当前话题 ID）
- 功能配置（搜索设置等）

### Redux Store

**存储位置：** AsyncStorage (React Native)
**持久化：** 通过 redux-persist 自动持久化（除 `runtime` slice）

**当前使用：**
- `assistant` slice：内置助手配置
- `runtime` slice：运行时临时状态（不持久化）

**适用场景：**
- 全局共享的运行时状态
- 需要跨组件同步的临时数据
- 不需要持久化的状态

### SQLite 数据库

**存储位置：** 本地设备存储（通过 Expo SQLite）
**管理方式：** Drizzle ORM
**迁移：** 自动管理版本迁移

**优势：**
- 关系型数据，支持复杂查询
- 索引优化，查询性能高
- 事务支持，数据一致性保证
- 本地存储，离线可用

**适用场景：**
- 实体数据（助手、话题、消息）
- 关系数据（一对多、多对多）
- 大量数据存储
- 需要复杂查询的数据

### 存储选择指南

| 数据类型 | 推荐存储 | 原因 |
|---------|---------|------|
| 用户配置 | Preference | 类型安全，乐观更新，懒加载 |
| 应用状态 | Preference | 简单键值对，快速访问 |
| 运行时状态 | Redux (runtime) | 不需要持久化，跨组件共享 |
| 实体数据 | SQLite | 需要关系查询，支持索引 |
| 大量数据 | SQLite | 高效存储和检索 |
| 临时缓存 | Memory/State | 生命周期短，无需持久化 |

---

## 最佳实践

### Preference 使用

```typescript
// ✅ 推荐：使用专用 hooks
const { theme, setTheme } = useSettings()

// ✅ 推荐：批量操作使用 useMultiplePreferences
const prefs = useMultiplePreferences(['user.name', 'user.avatar'])

// ⚠️ 注意：setter 是异步的
await setTheme('dark')  // 或者
setTheme('dark').catch(console.error)

// ❌ 避免：不要在非 React 上下文使用 hooks
// 应该使用 preferenceService.get/set
```

### SQLite 操作

```typescript
// ✅ 推荐：使用 Drizzle ORM
const topics = await db.select().from(topicsTable).where(eq(topicsTable.assistant_id, assistantId))

// ✅ 推荐：使用索引字段查询
const messages = await db.select().from(messagesTable)
  .where(eq(messagesTable.topic_id, topicId))
  .orderBy(desc(messagesTable.created_at))

// ❌ 避免：不要直接使用 SQL 字符串（除非必要）
```

### Redux 使用

```typescript
// ✅ 推荐：只用于运行时状态
dispatch(setWebSearchStatus({ requestId, status }))

// ❌ 避免：不要用于需要持久化的配置
// 应该使用 Preference 系统
```

---

## 数据迁移

从旧版本迁移到新架构时：

1. **Redux → Preference 迁移**：
   - 旧的 `settings`、`topic`、`websearch`、`app` slices 已迁移到 Preference
   - 数据会在首次启动时自动从 Redux AsyncStorage 迁移到 SQLite（如需要）

2. **数据库架构更新**：
   - 使用 Drizzle ORM 自动管理迁移
   - 迁移文件位于 `drizzle/` 目录
   - 应用启动时自动执行待执行的迁移

3. **向后兼容**：
   - PreferenceService 会在读取不存在的 key 时返回默认值
   - 确保平滑升级体验

---

## 总结

Cherry Studio 采用混合存储策略：

- **Preference System (SQLite)**: 管理所有用户配置和应用状态（10 项）
- **Redux Store**: 管理内置助手和运行时状态
- **SQLite Database**: 存储所有实体数据和关系数据

这种架构提供了：
- ✅ 类型安全
- ✅ 高性能
- ✅ 良好的开发体验
- ✅ 数据持久化
- ✅ 离线支持
- ✅ 易于维护和扩展
