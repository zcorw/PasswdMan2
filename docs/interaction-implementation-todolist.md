# 交互实现 TodoList

本 TodoList 基于当前 UI、交互缺口分析和交互规格说明编写。顺序按依赖关系排列，建议从上到下执行。每个任务都包含范围、预计改动文件、完成标准、验证方式和风险。

## 1. 建立前端 API client 基础层

**Scope**

- 封装统一 `fetch` client。
- 支持 API response envelope 解析。
- 支持 `credentials: 'include'`。
- 统一处理 HTTP error、业务 error、网络 error。
- 为后续 auth、items、audit、vault 调用提供基础。

**Files likely to change**

- `frontend/src/lib/apiClient.ts`
- `frontend/src/lib/apiTypes.ts`
- `frontend/src/lib/apiClient.test.ts`
- `frontend/src/vite-env.d.ts`

**Done Criteria**

- 所有 API 请求通过统一 client 发出。
- 成功响应返回 `data`。
- 错误响应返回结构化错误对象。
- `401` 可被调用方识别。
- 默认携带 cookie。

**Verification Method**

- 单元测试覆盖成功响应、错误响应、网络失败、非 JSON 响应。
- 手动调用 `/api/health` 验证 client 可用。

**Risk**

- 后端 response envelope 结构如果有差异，会影响所有后续集成。
- 错误处理抽象过早复杂化会拖慢实现。

## 2. 建立加密传输 API helper

**Scope**

- 获取 `/api/crypto/server-public-key`。
- 使用 `cryptoTransport.ts` 加密敏感 payload。
- 封装 `encryptedPost`、`encryptedPatch` 等 helper。
- 缓存 server public key，并处理 key 过期。

**Files likely to change**

- `frontend/src/lib/cryptoTransport.ts`
- `frontend/src/lib/encryptedApiClient.ts`
- `frontend/src/lib/encryptedApiClient.test.ts`
- `frontend/src/lib/apiClient.ts`

**Done Criteria**

- 登录、注册、条目 create/update 所需加密请求能力可复用。
- server key 过期时能重新获取。
- 加密失败和接口失败能返回明确错误。

**Verification Method**

- 单元测试 mock server key，验证 envelope 字段存在。
- 后端测试环境下调用加密接口验证可解密。

**Risk**

- 加密 envelope 字段必须与后端严格匹配。
- key 缓存策略错误可能导致偶发解密失败。

## 3. 实现认证状态管理

**Scope**

- 管理当前 session、user、auth loading、auth error。
- 应用启动时调用 `/api/auth/session` 恢复登录态。
- 提供 login、register、logout 方法。
- 保留 remembered account 本地逻辑。

**Files likely to change**

- `frontend/src/features/auth/authStore.tsx`
- `frontend/src/features/auth/authApi.ts`
- `frontend/src/features/auth/authTypes.ts`
- `frontend/src/lib/rememberAccount.ts`
- `frontend/src/App.tsx`
- `frontend/src/main.tsx`

**Done Criteria**

- 应用启动后能识别已登录/未登录。
- login/register/logout 有统一状态。
- auth 错误可被页面显示。
- remembered account 仍只保存账号标识。

**Verification Method**

- 组件/单元测试覆盖 session restore、login success、login failure、logout。
- 手动刷新页面，验证 session 保持。

**Risk**

- session cookie 与 CORS/同源配置有关，开发环境可能出现 cookie 未携带问题。
- auth 状态如果和 Vault Key 状态耦合过紧，后续维护困难。

## 4. 实现受保护路由

**Scope**

- 未登录用户访问 `/vault`、`/items/*`、`/generator`、`/audit-log`、`/settings` 时跳转 `/login`。
- 已登录用户访问 `/login`、`/register` 时可跳转 `/vault`。
- auth loading 时显示过渡状态。

**Files likely to change**

- `frontend/src/routes.tsx`
- `frontend/src/features/auth/ProtectedRoute.tsx`
- `frontend/src/features/auth/PublicOnlyRoute.tsx`
- `frontend/src/routes.test.tsx`

**Done Criteria**

- 受保护页面不会在未登录状态暴露。
- 登录态恢复期间不会闪现错误页面。
- 未知路由仍有合理 fallback。

**Verification Method**

- 路由测试覆盖未登录、已登录、loading 三种状态。
- 手动打开受保护 URL 验证跳转。

**Risk**

- 如果路由守卫阻塞过度，可能影响 PWA 离线页面或登录恢复体验。

## 5. 实现 Vault Key 生命周期管理

**Scope**

- 注册时生成 Vault Key。
- 用主密码加密 Vault Key。
- 登录后从 `/api/vault` 获取 encryptedVaultKey。
- 用户输入主密码后解密 Vault Key，并保存在内存。
- 退出登录时清除 Vault Key。

**Files likely to change**

- `frontend/src/lib/vaultCrypto.ts`
- `frontend/src/features/vault/vaultKeyStore.tsx`
- `frontend/src/features/vault/vaultApi.ts`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`

**Done Criteria**

- 注册能生成并提交 encryptedVaultKey。
- 登录后能解密 Vault Key。
- Vault Key 不进入 localStorage。
- logout 后内存中的 Vault Key 被清除。

**Verification Method**

- 单元测试覆盖 encrypt/decrypt/rewrap。
- 集成测试覆盖注册后登录、刷新后重新解锁。

**Risk**

- 主密码和登录密码在 UI 上可能混淆。
- Vault Key 丢失会导致条目无法解密，需要清晰错误提示。

## 6. 接入 LoginPage

**Scope**

- 将登录表单改为受控表单。
- 添加字段校验。
- 调用 auth login。
- 处理 submitting、error、success。
- 登录成功后跳转 `/vault`。

**Files likely to change**

- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/features/auth/authStore.tsx`
- `frontend/src/features/auth/authApi.ts`
- `frontend/src/lib/rememberAccount.ts`
- `frontend/src/pages/LoginPage.test.tsx`

**Done Criteria**

- 登录不再直接 navigate。
- 无效邮箱/短密码阻止提交。
- 后端返回错误时页面显示错误。
- Remember account 行为保留。

**Verification Method**

- 组件测试覆盖字段校验、提交成功、提交失败。
- 手动使用真实后端登录。

**Risk**

- 当前 UI 没有明确主密码解锁步骤；如果登录密码和主密码不同，需要额外 UI 决策。

## 7. 接入 RegisterPage

**Scope**

- 将注册表单改为受控表单。
- 添加校验。
- 生成 Vault Key。
- 用主密码加密 Vault Key。
- 调用注册 API。
- 成功后进入 `/vault`。

**Files likely to change**

- `frontend/src/pages/RegisterPage.tsx`
- `frontend/src/features/auth/authStore.tsx`
- `frontend/src/features/auth/authApi.ts`
- `frontend/src/features/vault/vaultKeyStore.tsx`
- `frontend/src/pages/RegisterPage.test.tsx`

**Done Criteria**

- 注册不再直接 navigate。
- 注册成功后用户处于登录/可用状态。
- 重复邮箱等错误可显示。
- encryptedVaultKey 由前端生成并提交。

**Verification Method**

- 组件测试覆盖校验和提交。
- 后端集成测试注册新账号。

**Risk**

- 如果后端注册后不自动设置 session，需要额外登录流程确认。

## 8. 实现 Vault items API 与数据映射

**Scope**

- 封装 `/api/items` list/detail/create/update/delete。
- 将后端 item 数据映射到前端 `VaultItem`。
- 解密 `encryptedSecret` 合并到 UI 模型。
- 去除 `mockVaultItems` 依赖。

**Files likely to change**

- `frontend/src/features/vault/itemsApi.ts`
- `frontend/src/features/vault/itemMapper.ts`
- `frontend/src/types/vault.ts`
- `frontend/src/data/mockVault.ts`
- `frontend/src/pages/VaultPage.tsx`
- `frontend/src/pages/ItemDetailPage.tsx`
- `frontend/src/pages/ItemFormPage.tsx`

**Done Criteria**

- Vault 首页从后端加载条目。
- 条目详情从后端加载并解密。
- mock 数据不再用于生产页面。
- 解密失败有明确状态。

**Verification Method**

- 单元测试覆盖 mapper 和解密。
- 集成测试 mock `/api/items`。
- 手动创建后端数据并查看页面。

**Risk**

- 后端只保存 encryptedSecret，前端必须正确维护非敏感字段和敏感字段边界。

## 9. 实现 VaultPage 搜索、筛选、排序

**Scope**

- 搜索框受控。
- Filter 菜单或弹窗。
- Sort 菜单或弹窗。
- 显示真实 item count。
- 支持 loading、empty、no results、error。

**Files likely to change**

- `frontend/src/pages/VaultPage.tsx`
- `frontend/src/components/vault/VaultFilterMenu.tsx`
- `frontend/src/components/vault/VaultSortMenu.tsx`
- `frontend/src/features/vault/itemsApi.ts`
- `frontend/src/pages/VaultPage.test.tsx`

**Done Criteria**

- 输入搜索词会更新列表。
- 筛选和排序可操作。
- 列表数量真实。
- 空状态和错误状态明确。

**Verification Method**

- 组件测试覆盖搜索、筛选、排序。
- mock API 验证 query params 或本地过滤结果。

**Risk**

- 后端当前支持的过滤字段有限，UI 筛选能力需要与后端能力对齐。

## 10. 实现 ItemDetailPage 完整交互

**Scope**

- 加载真实条目。
- 显示/隐藏主密码和副密码。
- 复制字段并显示 Snackbar。
- 发送查看/复制审计事件。
- More actions 菜单。
- 删除或归档条目。

**Files likely to change**

- `frontend/src/pages/ItemDetailPage.tsx`
- `frontend/src/components/data-display/SecondaryPasswordRow.tsx`
- `frontend/src/features/audit/clientAudit.ts`
- `frontend/src/features/audit/auditApi.ts`
- `frontend/src/features/vault/itemsApi.ts`
- `frontend/src/pages/ItemDetailPage.test.ts`

**Done Criteria**

- Show 按钮真实切换明文。
- Copy 成功/失败有提示。
- 审计事件发送到后端。
- More actions 能删除或归档条目。
- not found 和 decrypt failure 有 UI。

**Verification Method**

- mock clipboard 测试复制。
- mock audit API 测试事件发送。
- mock delete API 测试删除流程。

**Risk**

- 密码明文显示状态要避免误留在 UI。
- 审计失败不应阻断主操作。

## 11. 实现 ItemFormPage 创建和编辑

**Scope**

- 表单全部改为受控。
- 编辑页加载并解密已有条目。
- 保存时加密敏感字段。
- 新建调用 `POST /api/items`。
- 编辑调用 `PATCH /api/items/{id}`。
- 添加字段校验和错误显示。

**Files likely to change**

- `frontend/src/pages/ItemFormPage.tsx`
- `frontend/src/components/form/SecondaryPasswordEditor.tsx`
- `frontend/src/features/vault/itemsApi.ts`
- `frontend/src/features/vault/itemValidation.ts`
- `frontend/src/features/vault/secondaryPasswords.ts`
- `frontend/src/pages/ItemFormPage.test.tsx`

**Done Criteria**

- 新建条目能保存到后端。
- 编辑条目能更新后端。
- 副密码新增、删除、排序能被保存。
- 校验失败不提交。
- 保存中按钮禁用。

**Verification Method**

- 表单组件测试。
- mock create/update API 测试成功和失败。
- 手动新建、编辑、刷新后验证数据存在。

**Risk**

- 受控表单改造较大，容易影响现有布局。
- 加密字段合并不当可能丢失副密码。

## 12. 实现 SettingsPage 会话管理

**Scope**

- 替换 `mockSessions`。
- 加载 `/api/auth/sessions`。
- 撤销指定 session。
- 当前 session 按钮禁用。
- loading、empty、error、revoking 状态。

**Files likely to change**

- `frontend/src/pages/SettingsPage.tsx`
- `frontend/src/features/auth/sessionsApi.ts`
- `frontend/src/data/mockSessions.ts`
- `frontend/src/pages/SettingsPage.test.tsx`

**Done Criteria**

- 会话列表来自后端。
- 撤销非当前会话后列表更新。
- 当前会话不能撤销。
- 错误有提示。

**Verification Method**

- mock sessions API 测试加载和删除。
- 手动多会话登录后撤销。

**Risk**

- 后端 session 时间字段格式需要前端格式化。

## 13. 实现 SettingsPage 修改主密码

**Scope**

- 使用真实 encryptedVaultKey 和当前内存 Vault Key。
- 校验当前主密码、新主密码、确认密码。
- rewrap encryptedVaultKey。
- 调用 `PUT /api/vault` 持久化新的 encryptedVaultKey。

**Files likely to change**

- `frontend/src/pages/SettingsPage.tsx`
- `frontend/src/features/vault/vaultApi.ts`
- `frontend/src/features/vault/vaultKeyStore.tsx`
- `frontend/src/lib/vaultCrypto.ts`
- `frontend/src/pages/SettingsPage.test.tsx`

**Done Criteria**

- 输入正确当前主密码可以更新 encryptedVaultKey。
- 输入错误当前主密码显示错误。
- 新密码确认不一致阻止提交。
- 成功后清空表单。

**Verification Method**

- 单元测试 rewrap。
- mock API 测试成功/失败。
- 手动修改后重新登录验证可解密。

**Risk**

- 如果更新 encryptedVaultKey 失败但本地状态已变，会导致状态不一致。

## 14. 实现 AuditLogPage API 接入

**Scope**

- 替换 `mockAuditLogs`。
- 加载 `/api/audit/logs`。
- 支持 loading、empty、error。
- 后续可加分页。

**Files likely to change**

- `frontend/src/pages/AuditLogPage.tsx`
- `frontend/src/features/audit/auditApi.ts`
- `frontend/src/data/mockAuditLogs.ts`
- `frontend/src/pages/AuditLogPage.test.tsx`

**Done Criteria**

- 审计日志来自后端。
- 空日志显示空状态。
- 加载失败显示错误。
- action label 映射保持可读。

**Verification Method**

- mock API 测试三种状态。
- 手动执行登录、创建、复制后检查日志。

**Risk**

- 后端 action 名称和前端 label 映射可能不完整。

## 15. 实现全局通知与错误展示

**Scope**

- 提供统一 Snackbar/Alert 机制。
- 页面可触发 success/error/info。
- 替换散落的局部提示逻辑。

**Files likely to change**

- `frontend/src/components/common/AppSnackbar.tsx`
- `frontend/src/features/ui/notificationStore.tsx`
- `frontend/src/App.tsx`
- 多个页面文件

**Done Criteria**

- 复制、保存、删除、登录失败等都有统一反馈。
- 不同 severity 显示一致。
- 多个通知不会互相覆盖或丢失。

**Verification Method**

- 组件测试触发不同类型通知。
- 手动执行常见操作检查提示。

**Risk**

- 全局通知如果设计不当，可能导致局部错误上下文不清晰。

## 16. 实现导入流程

**Scope**

- Import 按钮打开文件选择。
- 校验文件类型、大小和 JSON schema。
- 解析导入文件。
- 展示导入摘要。
- 用户确认后创建或更新条目。

**Files likely to change**

- `frontend/src/components/common/ImportExportActions.tsx`
- `frontend/src/features/import-export/importVault.ts`
- `frontend/src/features/import-export/importValidation.ts`
- `frontend/src/features/vault/itemsApi.ts`
- `frontend/src/components/common/ImportDialog.tsx`

**Done Criteria**

- 可选择导入文件。
- 无效文件显示错误。
- 合法文件显示摘要。
- 确认后数据进入 Vault。

**Verification Method**

- 单元测试文件解析和 schema 校验。
- 手动导入合法/非法文件。

**Risk**

- 导入可能涉及敏感数据，错误日志不能输出明文。
- 重复条目的合并策略需要明确。

## 17. 实现导出流程

**Scope**

- Export 按钮打开确认弹窗。
- 生成加密导出文件。
- 触发浏览器下载。
- 记录导出审计事件。

**Files likely to change**

- `frontend/src/components/common/ImportExportActions.tsx`
- `frontend/src/features/import-export/exportVault.ts`
- `frontend/src/features/audit/auditApi.ts`
- `frontend/src/components/common/ExportDialog.tsx`

**Done Criteria**

- 用户确认后下载文件。
- 文件不包含未加密敏感明文。
- 导出成功/失败有提示。
- 审计事件发送。

**Verification Method**

- 单元测试导出 payload。
- 手动导出并检查文件结构。

**Risk**

- 导出文件格式需要与未来导入格式保持兼容。

## 18. 完善 PasswordGeneratorPage 错误处理

**Scope**

- 处理生成异常。
- 处理 Clipboard 失败。
- 保证最后一个字符集不能取消。
- 补充无障碍反馈。

**Files likely to change**

- `frontend/src/pages/PasswordGeneratorPage.tsx`
- `frontend/src/features/password-generator/passwordGenerator.ts`
- `frontend/src/features/password-generator/passwordGenerator.test.ts`

**Done Criteria**

- 生成失败不会导致页面崩溃。
- Clipboard 失败有提示。
- 至少一个字符集规则稳定。

**Verification Method**

- 单元测试生成器边界。
- 组件测试复制成功/失败。

**Risk**

- 当前生成器逻辑已较完整，改动应保持小范围。

## 19. 增加路由级加载和空状态组件

**Scope**

- 创建通用 loading、empty、error 组件。
- 在 Vault、Detail、Audit、Settings 中使用。

**Files likely to change**

- `frontend/src/components/common/PageState.tsx`
- `frontend/src/pages/VaultPage.tsx`
- `frontend/src/pages/ItemDetailPage.tsx`
- `frontend/src/pages/AuditLogPage.tsx`
- `frontend/src/pages/SettingsPage.tsx`

**Done Criteria**

- 各页面状态展示一致。
- 空状态和错误状态文案清晰。
- retry 动作可选。

**Verification Method**

- mock loading/empty/error 状态截图或组件测试。

**Risk**

- 通用组件过度抽象可能限制页面定制。

## 20. 全链路回归测试

**Scope**

- 覆盖注册、登录、创建条目、查看详情、复制密码、编辑条目、删除条目、查看审计、退出登录。
- 覆盖刷新页面后的 session 恢复。

**Files likely to change**

- `frontend/src/**/*.test.tsx`
- `frontend/src/**/*.test.ts`
- 可选 `frontend/e2e/*`
- `docs/testing.md`

**Done Criteria**

- 核心交互路径有自动化测试。
- 手动测试清单更新。
- 关键回归风险被覆盖。

**Verification Method**

- `yarn test --run`
- `yarn build`
- 后端 `pytest`
- 手动浏览器全流程验证。

**Risk**

- 如果没有端到端测试框架，需要先决定是否引入 Playwright。
- 加密、cookie session、PWA 缓存会让测试环境更复杂。

