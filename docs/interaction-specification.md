# 交互规格说明

本文件基于当前已经完成的前端 UI 编写，用于定义各交互元素的预期行为、状态变化、API 集成、校验规则、成功/失败反馈和验证方式。本文件仅描述规格，不涉及代码实现。

## 1. 全局组件

| 组件 | 触发方式 | 预期行为 | 状态变化 | API 调用 | 校验规则 | 成功行为 | 错误行为 | 验证方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BottomNav` | 点击底部导航项 | 跳转到对应页面 | 当前路由变化，选中项随 location 更新 | 无 | 路由必须存在 | 正确页面渲染 | 未知路由回到登录页 | 点击每个导航项，检查 URL 和页面 |
| `PwaInstallPrompt` | 浏览器触发 `beforeinstallprompt` | 显示 PWA 安装 Snackbar | 保存 install prompt event | 无 | 必须存在 prompt event | 点击 Install 后打开浏览器安装提示 | prompt 不可用时关闭提示 | mock `beforeinstallprompt` 事件并点击 Install |
| `MobileAppLayout` logo | 当前无点击交互 | 展示全局品牌 logo | 无 | 无 | logo 资源可访问 | 所有页面顶部显示 logo | 资源缺失时展示 alt 文本 | 逐页视觉检查 |

## 2. 登录与注册

| 组件 | 触发方式 | 预期行为 | 状态变化 | API 调用 | 校验规则 | 成功行为 | 错误行为 | 验证方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `LoginPage` 邮箱输入框 | 输入 | 更新邮箱字段 | `email` value、dirty、error | 无 | 必填，合法邮箱，3-320 字符 | 字段进入合法状态 | 显示行内错误 | 输入非法/合法邮箱 |
| `LoginPage` 密码输入框 | 输入 | 更新密码字段 | `password` value、dirty、error | 无 | 必填，12-256 字符 | 字段进入合法状态 | 显示行内错误 | 输入过短密码 |
| `LoginPage` Remember account | 勾选/取消 | 保存或清除本地账号标识偏好 | `rememberAccount` boolean | localStorage | 保存时应有账号标识 | 下次打开页面自动填充账号 | localStorage 失败时提示 | 刷新页面验证恢复 |
| `LoginPage` Sign in | 提交表单 | 登录用户并恢复 vault 会话 | `submitting`、`session`、`vaultKey`、`error` | `GET /api/crypto/server-public-key`，`POST /api/auth/login`，`GET /api/vault` | 邮箱和密码合法 | 跳转 `/vault` | 显示认证失败、账号锁定或网络错误 | mock 200、401、lockout、network error |
| `LoginPage` Create account | 点击 | 跳转注册页 | 路由变化 | 无 | 无 | 渲染 `/register` | 无 | 点击并断言 URL |
| `RegisterPage` 表单字段 | 输入 | 更新注册表单值 | `email`、`password`、`masterPassword` values | 无 | 邮箱合法，登录密码至少 12 字符，主密码必填 | 字段进入合法状态 | 显示行内错误 | 表单校验测试 |
| `RegisterPage` Create account | 提交表单 | 生成 Vault Key，用主密码加密 Vault Key，注册账号 | `submitting`、`session`、`vaultKey`、`error` | `GET /api/crypto/server-public-key`，`POST /api/auth/register` | 字段必填，密码长度合法 | 跳转 `/vault` | 显示重复邮箱、校验错误或网络错误 | mock 成功/失败响应 |
| `RegisterPage` Sign in | 点击 | 跳转登录页 | 路由变化 | 无 | 无 | 渲染 `/login` | 无 | 点击并断言 URL |

## 3. Vault 首页

| 组件 | 触发方式 | 预期行为 | 状态变化 | API 调用 | 校验规则 | 成功行为 | 错误行为 | 验证方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `VaultPage` 搜索框 | 输入 | 查询或过滤条目 | `searchQuery`、`loading`、`items` | `GET /api/items?q=...` 或本地过滤 | 搜索词 trim | 列表更新为匹配结果 | 显示加载失败或搜索失败状态 | 输入关键字并检查列表 |
| `VaultPage` Filter 按钮 | 点击 | 打开筛选菜单或弹窗 | `filterMenuOpen`、`filters` | 可选 `GET /api/items` | 筛选值必须在允许范围内 | 列表按筛选条件更新 | 保留上一次有效筛选 | 点击并选择筛选项 |
| `VaultPage` Sort 按钮 | 点击 | 打开排序菜单 | `sortMenuOpen`、`sortMode` | 可选 `GET /api/items` | 排序值必须在允许范围内 | 列表按排序方式更新 | 保留上一次有效排序 | 选择不同排序方式 |
| `ImportExportActions` Import | 点击 | 打开导入流程 | `importDialogOpen`、`progress`、`error` | 未来导入 API 或本地解析 | 文件类型、大小、schema 合法 | 显示导入摘要或成功提示 | 显示无效文件或导入失败错误 | 上传合法/非法文件 |
| `ImportExportActions` Export | 点击 | 打开导出确认并导出加密数据 | `exportDialogOpen`、`progress`、`error` | 未来导出 API 或本地导出 | 用户二次确认 | 下载导出文件 | 显示导出失败错误 | 点击导出并检查下载文件 |
| `VaultItemCard` | 点击卡片 | 进入条目详情 | 路由变化 | 无 | item id 必须存在 | 详情页渲染 | 详情页显示 not found | 点击卡片验证跳转 |
| `VaultPage` FAB | 点击 | 进入新建条目页 | 路由变化 | 无 | 无 | 渲染 `/items/new` | 无 | 点击 FAB |

## 4. 条目详情页

| 组件 | 触发方式 | 预期行为 | 状态变化 | API 调用 | 校验规则 | 成功行为 | 错误行为 | 验证方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ItemDetailPage` 页面加载 | 进入路由 | 拉取条目并解密敏感字段 | `loading`、`item`、`secret`、`error` | `GET /api/items/{id}` | item id 合法，Vault Key 可用 | 渲染详情 | 显示 not found 或解密失败 | 加载合法/非法 id |
| 返回按钮 | 点击 | 返回 Vault 首页 | 路由变化 | 无 | 无 | 渲染 `/vault` | 无 | 点击返回 |
| Edit 按钮 | 点击 | 进入编辑页 | 路由变化 | 无 | item id 存在 | 渲染 `/items/:id/edit` | not found | 点击编辑 |
| More actions 按钮 | 点击 | 打开更多操作菜单 | `menuOpen` | 无 | 无 | 菜单显示删除、归档等操作 | 无 | 点击菜单 |
| Open URL 按钮 | 点击 | 打开规范化后的 URL | 无 | 无 | URL 存在且合法 | 新标签页打开 URL | URL 无效时禁用或提示 | 使用合法/非法 URL 测试 |
| Show main password | 点击 | 切换主密码明文/掩码 | `showPrimary` boolean | `POST /api/audit/events` | Vault Key 已解密 | 主密码可见，发送审计事件 | 审计失败不阻断显示 | 点击切换 |
| Copy main password | 点击 | 复制主密码 | Snackbar 状态 | `POST /api/audit/events` | Clipboard 可用 | 成功 Snackbar | Clipboard 失败 Snackbar | mock clipboard |
| Copy username | 点击 | 复制用户名 | Snackbar 状态 | 可选审计事件 | 用户名存在 | 成功 Snackbar | Clipboard 失败 Snackbar | mock clipboard |
| Show secondary password | 点击 | 切换指定副密码明文/掩码 | `visibleSecondaryIds` | `POST /api/audit/events` | secondary id 存在 | 副密码可见 | 审计失败不阻断显示 | 点击切换 |
| Copy secondary password | 点击 | 复制副密码 | Snackbar 状态 | `POST /api/audit/events` | secondary id 存在 | 成功 Snackbar | Clipboard 失败 Snackbar | mock clipboard |
| 删除/归档条目 | 在 More actions 中确认 | 删除或归档条目 | `deleting`、列表缓存失效 | `DELETE /api/items/{id}` 或 `PATCH /api/items/{id}` | 必须二次确认 | 跳转 `/vault` 并提示成功 | 显示删除失败错误 | 确认/取消流程测试 |

## 5. 条目表单页

| 组件 | 触发方式 | 预期行为 | 状态变化 | API 调用 | 校验规则 | 成功行为 | 错误行为 | 验证方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ItemFormPage` 编辑页加载 | 进入编辑路由 | 拉取并解密已有条目 | `loading`、form values、`error` | `GET /api/items/{id}` | item id 合法，Vault Key 可用 | 表单填充已有值 | 显示 not found 或解密失败 | 加载编辑路由 |
| Title 字段 | 输入 | 更新标题 | `title`、dirty、errors | 无 | 必填，1-120 字符 | 字段合法 | 行内错误 | 空标题/超长标题测试 |
| URL 字段 | 输入 | 更新 URL | `url`、dirty、errors | 无 | 可选，最长 2048，建议规范化 | 字段合法 | 行内错误 | URL 校验测试 |
| Username 字段 | 输入 | 更新用户名 | `username`、dirty、errors | 无 | 可选，最长 320 | 字段合法 | 行内错误 | 超长用户名测试 |
| Main password 字段 | 输入 | 更新主密码 | `primaryPassword` | 无 | 新建时必填 | 字段合法 | 行内错误 | 空值提交测试 |
| Generate 按钮 | 点击 | 生成密码并填入主密码字段 | `primaryPassword` 更新 | 无 | 密码生成器配置合法 | 新密码显示在字段中 | 显示生成失败错误 | 点击生成 |
| Add secondary password | 点击 | 新增一个副密码编辑行 | `secondaryPasswords` | 无 | 最多 20 个 | 新行出现 | 达到上限时提示 | 连续点击到上限 |
| 副密码 note/password 字段 | 输入 | 更新对应副密码 | `secondaryPasswords` | 无 | note 建议 1-120，password 必填 | 行进入合法状态 | 行内错误 | 编辑副密码 |
| Move secondary up/down | 点击 | 调整副密码顺序 | `secondaryPasswords.sortOrder` | 无 | 第一项不能上移，最后一项不能下移 | 顺序更新 | 边界按钮禁用 | 点击边界和中间项 |
| Delete secondary | 点击 | 删除副密码行 | `secondaryPasswords` | 无 | secondary id 存在 | 行移除 | 无 | 删除行 |
| Save 按钮 | 提交表单 | 加密敏感字段并创建或更新条目 | `submitting`、`errors` | `POST /api/items` 或 `PATCH /api/items/{id}` | 所有字段校验通过 | 跳转详情页或 Vault，并显示成功提示 | 显示校验、加密或 API 错误 | 成功/失败提交测试 |

## 6. 密码生成器页

| 组件 | 触发方式 | 预期行为 | 状态变化 | API 调用 | 校验规则 | 成功行为 | 错误行为 | 验证方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Length slider | 拖动 | 更新长度并重新生成密码 | `options.length`、`generatedPassword` | 无 | 8-64 | 新密码显示 | 无 | 拖动到最小/最大 |
| 字符集 Checkbox | 勾选/取消 | 更新字符集选项 | `options` | 无 | 至少选择一个字符集 | 选项更新 | 阻止取消最后一个字符集 | 尝试取消全部字符集 |
| Refresh icon / Generate 按钮 | 点击 | 生成新密码 | `generatedPassword` | 无 | 至少选择一个字符集 | 新密码显示 | 显示错误提示 | 点击生成 |
| Copy generated password | 点击 | 复制生成的密码 | Snackbar open | 无 | Clipboard 可用 | 成功 Snackbar | Clipboard 失败 Snackbar | mock clipboard |

## 7. 设置页

| 组件 | 触发方式 | 预期行为 | 状态变化 | API 调用 | 校验规则 | 成功行为 | 错误行为 | 验证方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 修改主密码表单 | 提交 | 用当前主密码解密 Vault Key，再用新主密码重新加密并持久化 | `submitting`、form reset、`error` | `PUT /api/vault` 或未来 settings API | 当前密码必填，新密码必填，确认密码一致，长度至少 12 | 成功 Snackbar | 当前密码错误或 API 错误 | 提交成功/失败用例 |
| Create recovery code | 点击 | 生成并展示恢复码 | `recoveryCode` | 未来 `POST /api/recovery-codes` 或本地生成 | 用户已登录 | 恢复码只显示一次 | 显示生成失败 | 点击生成和关闭 |
| Recovery Done | 点击 | 隐藏当前恢复码 | `recoveryCode=null`、dismissed | 无 | 当前有恢复码 | 恢复码隐藏 | 无 | 点击 Done |
| Import/export actions | 点击 | 与 Vault 页导入/导出一致 | dialog、progress、error | 未来 API | 文件和确认规则 | 成功提示 | 错误提示 | 弹窗和文件流程测试 |
| Sign out session | 点击 | 撤销指定会话 | `sessions`、`revokingId` | `DELETE /api/auth/sessions/{id}` | 不允许撤销当前会话 | 会话从列表移除 | 显示撤销失败 | mock delete |
| Current session 按钮 | 不可点击 | 防止撤销当前会话 | 无 | 无 | 当前会话受保护 | 按钮禁用 | 无 | 断言 disabled |

## 8. 审计日志页

| 组件 | 触发方式 | 预期行为 | 状态变化 | API 调用 | 校验规则 | 成功行为 | 错误行为 | 验证方式 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AuditLogPage` 页面加载 | 进入路由 | 拉取审计日志 | `loading`、`logs`、pagination、`error` | `GET /api/audit/logs` | 用户必须已登录 | 日志列表渲染 | 显示空状态或加载失败 | mock 日志、空列表、错误 |
| 审计日志分页/滚动加载 | 滚动或点击分页 | 加载下一页日志 | `page`、`loadingMore` | `GET /api/audit/logs?page=...` | page 合法 | 追加或替换日志 | 显示分页加载错误 | 分页测试 |

## 9. 全局错误和加载规则

- 所有 API 请求都应该暴露 `loading`、`success`、`error` 状态。
- `401` 应清除登录态并跳转 `/login`。
- 加密或解密失败时不得输出敏感明文。
- Clipboard 失败应显示非阻塞 Snackbar。
- 审计事件失败不应阻断用户复制或查看密码。
- 空状态应区分以下情况：
  - 真实无数据。
  - 搜索无结果。
  - 加载中。
  - 请求失败。
  - 解密失败。
- 所有提交按钮在 `submitting` 时应禁用，避免重复提交。
- 所有 destructive action 需要二次确认。

## 10. 验证策略

建议测试范围：

- API client 单元测试：响应 envelope、错误处理、`401` 行为。
- 表单校验单元测试：登录、注册、条目表单、修改主密码。
- 路由守卫测试：未登录访问受保护页面，已登录访问登录页。
- 组件测试：按钮点击、菜单打开、Snackbar 显示、表单错误显示。
- 集成测试：mock API 下完成登录、加载列表、查看详情、新建/编辑条目。
- 加密流程测试：Vault Key 解密、item secret 加密/解密。
- 手动测试：Clipboard、PWA install、文件导入/导出、浏览器离线状态。

