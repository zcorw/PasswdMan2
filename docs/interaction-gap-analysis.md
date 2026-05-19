# 交互缺口分析

本文件基于当前前端 UI、组件、mock 数据和后端 API 实现进行整理。当前项目的界面结构已经基本完成，但大量交互仍停留在本地状态、mock 数据或占位逻辑阶段。

## 1. 页面结构

当前前端路由结构如下：

- `/login`：登录页 `LoginPage`
- `/register`：注册页 `RegisterPage`
- `/vault`：密码库首页 `VaultPage`
- `/items/new`：新建条目页 `ItemFormPage`
- `/items/:itemId`：条目详情页 `ItemDetailPage`
- `/items/:itemId/edit`：编辑条目页 `ItemFormPage`
- `/generator`：密码生成器页 `PasswordGeneratorPage`
- `/audit-log`：审计日志页 `AuditLogPage`
- `/settings`：设置页 `SettingsPage`

共享布局：

- `MobileAppLayout`：移动端主布局，包含全局 logo header。
- `BottomNav`：底部导航。
- `PwaInstallPrompt`：PWA 安装提示。

当前主要问题：

- 页面数据仍主要来自 `mockVaultItems`、`mockSessions`、`mockAuditLogs`。
- 前端尚未建立统一 API client。
- 页面没有统一的登录态、Vault Key、加载、错误、空状态管理。

## 2. 组件

主要 UI 组件：

- `VaultItemCard`：密码库列表卡片。
- `FieldActionRow`：详情页字段展示与操作按钮。
- `SecondaryPasswordRow`：副密码展示行。
- `SecondaryPasswordEditor`：副密码编辑行。
- `IconActionButton`：图标按钮封装。
- `ImportExportActions`：导入/导出按钮与占位弹窗。
- `BottomNav`：底部导航。
- `PwaInstallPrompt`：PWA 安装提示。

已有功能模块：

- `vaultCrypto.ts`：Vault Key、条目敏感字段加密/解密。
- `cryptoTransport.ts`：前后端加密传输 envelope。
- `rememberAccount.ts`：本地记住账号标识。
- `passwordGenerator.ts`：本地密码生成器。
- `secondaryPasswords.ts`：副密码数组增删改排序逻辑。
- `clientAudit.ts`：客户端审计元数据清洗，目前未完整接入后端。

## 3. 交互元素

已经有本地交互的元素：

- 底部导航跳转。
- 密码库卡片点击进入详情。
- 新建条目 FAB 跳转。
- 返回 Vault 按钮。
- 编辑按钮跳转。
- 打开 URL 按钮。
- 复制用户名、主密码、副密码按钮。
- 密码生成器选项、滑块、生成和复制。
- 条目表单中的副密码新增、删除、上移、下移。
- 登录页记住账号复选框。
- 设置页恢复码本地生成。
- 设置页会话删除，仅本地 mock。
- 导入/导出弹窗，仅占位。
- PWA 安装提示。

尚未完整实现的交互：

- 登录、注册真实认证。
- 路由守卫和会话恢复。
- Vault 首页搜索、筛选、排序。
- 条目创建、更新、删除持久化。
- 显示/隐藏密码。
- 更多操作菜单。
- 导入/导出文件流程。
- 活跃会话列表和撤销接口。
- 审计日志接口。
- 修改主密码与真实 Vault Key rewrap 持久化。
- 各页面加载、错误、空状态。

## 4. 必需状态

全局状态：

- `auth`：未知、加载中、已登录、未登录。
- `session`：当前用户、当前会话、过期时间。
- `vault`：加密 Vault Key、解密后的 Vault Key、vault revision。
- `items`：条目列表、分页、搜索条件、筛选条件、排序方式。
- `selectedItem`：当前条目详情与解密后的敏感字段。
- `auditLogs`：审计日志列表和分页。
- `sessions`：活跃会话列表。
- `crypto`：服务端公钥缓存、加密传输请求状态。
- `ui`：全局 loading、error、success notification。

页面状态：

- 登录/注册：表单值、校验错误、提交中、认证失败、账号锁定。
- Vault：首页加载中、空密码库、搜索无结果、接口错误。
- 详情页：加载中、未找到、解密失败、密码显示状态、复制反馈。
- 表单页：字段值、dirty 状态、校验错误、保存中、保存失败。
- 生成器：字符集选择错误、复制成功/失败。
- 设置页：会话加载、撤销中、主密码修改中、恢复码生命周期。
- 审计页：加载中、空日志、接口错误。

## 5. 必需用户动作

认证相关：

- 注册账号。
- 登录。
- 退出登录。
- 页面加载时恢复当前会话。
- 未登录访问受保护页面时跳转登录页。
- 只在本地记住账号标识，不保存密码。

Vault 与条目：

- 加载密码库条目。
- 搜索条目。
- 筛选条目。
- 排序条目。
- 新建条目。
- 编辑条目。
- 删除或归档条目。
- 查看条目详情。
- 显示/隐藏主密码。
- 显示/隐藏副密码。
- 复制字段并记录审计事件。
- 打开 URL。
- 新增、删除、排序副密码。
- 在表单中生成密码。

设置：

- 修改主密码。
- 生成恢复码。
- 查看活跃会话。
- 撤销指定会话。
- 导入密码库数据。
- 导出密码库数据。

审计：

- 加载审计日志。
- 后续可考虑分页、筛选、按动作类型过滤。

## 6. 缺失事件处理

### VaultPage

- 搜索输入框没有状态，也没有触发过滤或 API 查询。
- Filter 按钮没有菜单或弹窗。
- Sort 按钮没有菜单或弹窗。
- 条目数量 `38 items` 是硬编码。
- 列表仍使用 `mockVaultItems`。

### VaultItemCard

- 卡片跳转可用，但数据来自 mock。
- 没有 skeleton、禁用态或加载态。

### ItemDetailPage

- “Show main password” 没有 `onClick`。
- 副密码 “Show” 按钮没有 `onClick`。
- “More actions” 没有菜单。
- 没有删除或归档动作。
- 没有从 API 加载详情。
- 没有后端 not found 状态处理。
- 复制动作没有成功/失败反馈。
- 复制和查看密码没有发送后端审计事件。

### ItemFormPage

- 提交表单只跳转页面，不调用 create/update API。
- 多数字段使用 `defaultValue`，不是受控表单。
- 编辑时没有解密并填充主密码和副密码。
- 生成密码只更新本地 `primaryPassword`。
- 没有保存中、保存成功、保存失败状态。

### LoginPage

- 提交只保存 remembered account 并跳转。
- 密码字段未受控。
- 没有调用登录 API。
- 没有使用加密传输。
- 没有会话状态管理。
- 没有错误提示。

### RegisterPage

- 提交只跳转。
- 没有生成 Vault Key。
- 没有用主密码加密 Vault Key。
- 没有调用注册 API。
- 没有重复邮箱、弱密码等错误处理。

### SettingsPage

- 修改主密码使用 demo 生成的 Vault Key，不是真实 Vault Key。
- 会话列表来自 mock。
- 撤销会话仅本地删除。
- 恢复码仅本地生成；当前后端没有对应实现。

### ImportExportActions

- 目前只是说明弹窗。
- 没有文件选择。
- 没有导入解析。
- 没有导出下载。
- 没有导入确认。
- 没有导入/导出进度和错误状态。

## 7. 必需 API 集成

当前后端已实现的接口：

- `GET /api/crypto/server-public-key`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `GET /api/auth/sessions`
- `DELETE /api/auth/sessions/{session_id}`
- `GET /api/vault`
- `PUT /api/vault`
- `GET /api/items`
- `POST /api/items`
- `GET /api/items/{item_id}`
- `PATCH /api/items/{item_id}`
- `DELETE /api/items/{item_id}`
- `GET /api/audit/logs`
- `POST /api/audit/events`

前端需要补齐：

- 统一 API client。
- 统一响应 envelope 解析。
- `credentials: 'include'`，保证 cookie session 可用。
- 获取服务端公钥。
- 用 `cryptoTransport.ts` 加密登录、注册、条目 create/update payload。
- 全局处理 `401`，跳转登录页。
- 加载 vault 并解密 Vault Key。
- 加载 items 并解密 `encryptedSecret`。
- create/update item 时加密敏感字段。
- copy/view password 时发送 `/api/audit/events`。
- 替换所有 mock 数据。

文档与当前后端实现存在差异：

- 文档提到 `/api/settings/security`、`/api/settings/master-password/change`、`/api/recovery-codes`、`/api/exports/password-items`，但当前后端未实现这些接口。
- 当前会话接口是 `/api/auth/sessions`，不是 `/api/sessions`。
- 当前审计日志接口是 `/api/audit/logs`，不是 `/api/audit-logs`。

## 8. 校验规则

后端已强制的规则：

- 邮箱：3-320 字符，合法邮箱格式，自动 trim 和小写。
- 登录密码：12-256 字符。
- 注册必须包含 `encryptedVaultKey`。
- 条目标题：1-120 字符，自动 trim。
- URL：可选，最长 2048 字符。
- 用户名：可选，最长 320 字符。
- `encryptedSecret`：创建时必填，最长 5 MB。
- 条目状态：只能是 `active` 或 `archived`。
- Vault `encryptedData`：最长 5 MB。
- 审计 metadata：最多 20 个字段。
- 客户端审计 action 只能使用 allowlist。

前端需要补齐的校验：

- 登录/注册必填字段。
- 密码最短 12 字符。
- 注册或修改密码时确认密码一致。
- 主密码、当前密码、新密码必填。
- 条目标题必填。
- 副密码 note 建议 1-120 字符。
- 副密码数量建议最多 20 个。
- URL 格式或自动规范化。
- 密码生成器至少选择一个字符集。
- 导入文件类型、大小、schema 校验。
- 导出前二次确认。

## 9. 错误、加载、空状态

缺失或不完整的状态：

- 应用启动时 session loading。
- 未登录访问受保护页面的重定向。
- 登录/注册失败：错误密码、重复邮箱、账号锁定、网络错误。
- Vault 列表加载中。
- 空密码库。
- 搜索无结果。
- 条目列表加载失败。
- 条目详情加载中。
- 条目不存在。
- 条目解密失败。
- 条目保存中、保存失败。
- 复制成功/失败 Snackbar。
- 密码显示/隐藏状态。
- 删除确认弹窗。
- 设置页会话加载失败。
- 撤销会话失败。
- 修改主密码失败。
- 审计日志加载中、空日志、加载失败。
- 导入/导出进度、失败、成功。
- API 不可达状态。
- 与 PWA 离线页区分的运行时离线提示。

## 10. 建议实现顺序

建议按以下顺序补齐交互：

1. 建立 API client、响应 envelope 解析、错误模型。
2. 接入 `/api/crypto/server-public-key` 和加密传输 helper。
3. 实现登录、注册、退出、当前会话恢复。
4. 实现受保护路由。
5. 实现 Vault Key 解密与内存态管理。
6. 替换 Vault 列表 mock，接入 `/api/items`。
7. 实现条目详情加载、解密、复制、显示/隐藏、审计事件。
8. 实现条目新建和编辑保存。
9. 实现搜索、筛选、排序。
10. 实现设置页会话列表和撤销。
11. 实现审计日志页。
12. 最后处理导入/导出和恢复码相关能力。

## 结论

当前项目的 UI shell 和核心视觉已经具备，但交互层仍需要系统性补齐。关键缺口不是单个按钮没有事件，而是缺少统一的数据访问层、认证状态、Vault Key 生命周期、加密/解密数据流、表单校验，以及完整的 loading/error/empty 状态。

