# PasswdMan2 Development TodoList

## Project Summary

PasswdMan2 是个人密码管理 PWA。MVP 只做普通用户功能，不做团队、管理员、共享、浏览器插件和原生 App。

已确认技术栈：

- Backend: Python + FastAPI
- Database: PostgreSQL
- ORM / Migration: SQLAlchemy + Alembic
- Deployment: Docker Compose + Nginx
- UI Library: MUI
- Secure communication: X25519 + AES-GCM
- E2EE model: 第一版服务端只同步加密后的密码库和被主密码派生密钥加密的 Vault Key

## Questions / Assumptions

- 前端框架默认采用 React + TypeScript + Vite，仍需最终确认。
- 前端包管理器限定为 Yarn 4；后续前端命令使用 `yarn`，不得新增 npm/pnpm lockfile。
- 后续前端 UI 开发必须与当前 Figma 设计稿对齐；评审时需要核对对应 Figma 页面、移动端布局、MUI 组件映射和图标交互规则。
- 登录密码哈希默认采用 Argon2id。
- 会话默认采用 HttpOnly + Secure + SameSite Cookie。
- MVP 不实现完整离线保险库。
- 导入/导出模板和字段映射后续确认。
- 开发中遇到成熟第三方库优先使用，不自行重复实现，尤其是 crypto、hash、PWA、表单校验、测试工具。

## Development TodoList

- [x] T001 [P0] 初始化项目骨架
  Goal: 建立可运行的前端、后端、数据库、Nginx、Docker Compose 基础结构。
  Notes: 前端 React + TypeScript + Vite + MUI；后端 FastAPI；数据库 PostgreSQL；迁移 Alembic。
  Depends on: None.
  Verify: 前后端可启动，Docker Compose 可运行，健康检查通过。

- [x] T002 [P0] 建立后端基础设施
  Goal: FastAPI 配置、日志、统一响应、统一错误、数据库连接、迁移框架完成。
  Notes: 建立 SQLAlchemy Base、Alembic 环境、请求 ID、Cache-Control 工具。
  Depends on: T001.
  Verify: migration 可执行，基础 API 测试通过。

- [x] T003 [P0] 实现 X25519 + AES-GCM 通讯模块
  Goal: 敏感请求和响应可通过应用层加密传输。
  Notes: 服务端公钥接口、key_id、nonce、timestamp、防重放、公钥轮换基础结构。
  Depends on: T002.
  Verify: 加密请求成功；重放、篡改、过期 key 被拒绝。

- [x] T003A [P0] 限定前端包管理器与 Figma 对齐规则
  Goal: 前端包管理器固定为 Yarn 4，并固化后续 UI 开发必须对齐 Figma 设计稿。
  Notes: 前端命令使用 yarn；不得新增 npm/pnpm lockfile；前端 UI 评审必须核对当前 Figma 设计稿、移动端布局、MUI 映射和图标交互规则。
  Depends on: T003.
  Verify: Yarn 4 install/build 通过，文档包含 Figma 对齐要求。

- [x] T004 [P0] 实现普通用户认证与会话
  Goal: 注册、登录、退出、当前会话可用。
  Notes: 登录密码强哈希；失败限流；安全 Cookie；不记录敏感明文。
  Depends on: T002, T003.
  Verify: 认证集成测试通过，Cookie 安全属性正确。

- [x] T005 [P0] 实现“记住账号”
  Goal: 登录页可记住邮箱或账号名。
  Notes: 只保存 identifier，不保存密码、主密码、token、恢复码或密钥；取消勾选后清除。
  Depends on: T004.
  Verify: 本地存储中只有账号标识。

- [ ] T006 [P0] 实现 Vault 初始化与同步模型
  Goal: 用户注册后创建默认个人 Vault，并保存 encrypted_vault_key。
  Notes: 客户端用主密码派生密钥解开 Vault Key；服务端只保存密文。
  Depends on: T003, T004.
  Verify: 数据库无 Vault Key 明文；新设备输入主密码后可解锁。

- [ ] T007 [P1] 实现密码条目后端 API
  Goal: 支持条目创建、列表、详情、更新、归档、收藏、软删除。
  Notes: encrypted_secret 保存主要密码、副密码、副密码备注等密文；校验 user_id 归属。
  Depends on: T006.
  Verify: CRUD、分页、搜索、越权访问测试通过。

- [ ] T008 [P1] 实现客户端 Vault 加解密
  Goal: 前端能用 Vault Key 加密/解密密码条目。
  Notes: secret JSON 包含 primaryPassword、secondaryPasswords、note、sortOrder。
  Depends on: T006, T007.
  Verify: 提交到服务端的是密文，本地解密后字段正确。

- [ ] T009 [P1] 实现移动端优先核心 UI
  Goal: 登录、注册、保险库列表、详情、新建/编辑页面完成。
  Notes: 使用 MUI；底部导航；单列布局；360px-430px 宽度优先；实现和评审必须对齐当前 Figma 设计稿。
  Depends on: T004, T008.
  Verify: 移动端视口无溢出，核心流程可完成。

- [ ] T010 [P1] 实现详情页图标操作规则
  Goal: 详情页字段操作符合设计要求。
  Notes: URL 只保留外链打开图标；Username 只保留复制图标；密码字段用显示/隐藏和复制图标。
  Depends on: T009.
  Verify: 页面不出现字段级文字按钮 Show / Copy / Edit。

- [ ] T011 [P1] 实现副密码管理与复制
  Goal: 每条记录支持多个副密码和副密码备注。
  Notes: 支持添加、删除、编辑、排序；每条副密码有独立复制入口。
  Depends on: T009, T010.
  Verify: 副密码 CRUD 和独立复制测试通过。

- [ ] T012 [P1] 实现密码生成器
  Goal: 可生成强密码并填入表单或复制。
  Notes: 支持长度、大小写、数字、符号、排除易混字符；使用安全随机数。
  Depends on: T009.
  Verify: 生成器可用，离线状态下可用。

- [ ] T013 [P1] 实现审计日志
  Goal: 记录关键安全操作。
  Notes: 登录、退出、创建、更新、删除、查看/复制主要密码、查看/复制副密码、导入/导出入口。
  Depends on: T007, T010, T011.
  Verify: 日志不包含任何敏感明文。

- [ ] T014 [P1] 实现安全设置
  Goal: 支持主密码修改、恢复码、活跃会话查看和退出。
  Notes: 修改主密码需要重新加密 Vault Key；恢复码明文只显示一次。
  Depends on: T006, T013.
  Verify: 主密码修改后旧派生密钥不可解锁，新主密码可解锁。

- [ ] T015 [P1] 实现导入/导出入口
  Goal: 在保险库页和设置页提供入口及安全提示。
  Notes: MVP 不实现完整模板解析；导出前必须提示敏感风险。
  Depends on: T009, T013.
  Verify: 入口可见，触发后有提示和审计记录。

- [ ] T016 [P1] 实现 PWA 基础能力
  Goal: Manifest、Service Worker、离线页、安装提示完成。
  Notes: 只缓存应用壳、静态资源和离线页；敏感 API 必须 no-store。
  Depends on: T001, T009.
  Verify: Lighthouse PWA 基础项通过，离线页可访问，敏感响应未缓存。

- [ ] T017 [P1] 补充测试体系
  Goal: 覆盖关键安全、API、UI、PWA 场景。
  Notes: 后端 pytest；前端组件测试；Playwright 移动端视口测试；crypto 重放/篡改测试。
  Depends on: T003-T016.
  Verify: 全量测试通过。

- [ ] T018 [P2] 完成部署加固
  Goal: Docker Compose + Nginx 具备可部署基线。
  Notes: HTTPS 终止、反向代理、安全响应头、PWA 文件响应头、环境变量注入、数据库备份说明。
  Depends on: T016, T017.
  Verify: Nginx 可代理 frontend/backend，响应头符合要求。

- [ ] T019 [P2] 整理后续功能 backlog
  Goal: 明确非 MVP 功能边界。
  Notes: CSV 导入导出、tags、MFA、WebAuthn、密码健康评分、泄露检测、浏览器插件。
  Depends on: MVP completion.
  Verify: 后续功能没有混入 MVP 验收范围。

## Acceptance Criteria

- 普通用户可注册、登录、解锁保险库、创建和管理密码条目。
- 服务端不保存主密码、Vault Key 明文、主要密码明文、副密码明文、副密码备注明文。
- 敏感通讯使用 X25519 + AES-GCM，并能防重放和篡改。
- 移动端 360px、390px、430px 视口核心页面可用。
- 副密码独立复制、详情页图标操作、导入/导出入口、PWA 安全缓存都满足文档要求。

## Suggested Execution Order

1. T001-T003: 项目骨架、后端基础、加密通讯。
2. T004-T006: 认证、记住账号、Vault Key 模型。
3. T007-T011: 密码条目 API、客户端加解密、核心 UI、副密码。
4. T012-T015: 生成器、审计、安全设置、导入导出入口。
5. T016-T018: PWA、测试、部署。
6. T019: 后续功能规划。
