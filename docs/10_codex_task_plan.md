# Codex 开发任务计划

## 全局开发原则

- 开发过程中如果某个功能已有成熟、活跃维护、许可证兼容且安全记录良好的第三方仓库或库，应优先直接采用，不要自行重复实现；采用前需要确认维护状态、许可证、依赖体积、安全风险和与当前技术栈的兼容性。
- 安全关键能力优先使用被广泛验证的库，例如密码哈希、X25519、AES-GCM、随机数、PWA 缓存工具、表单校验、测试工具等；业务规则、产品流程和项目特有的数据模型仍按本文档实现。
- 引入第三方依赖时需要在 README 或相关开发文档中记录用途、版本范围、替代方案和必要的安全注意事项。

## 阶段 1：项目骨架与基础约定

- 输入文档：01_project_overview.md、08_non_functional_requirements.md
- 输出：项目初始化文件、README、环境变量示例、基础目录结构、FastAPI 后端骨架、Docker Compose、Nginx 配置、PWA Manifest、基础 Service Worker、应用图标占位
- 边界：不实现业务功能，只建立可运行骨架
- 验收标准：本地开发服务器可启动，基础测试命令可执行，浏览器可识别 Manifest，Service Worker 在本地可注册

执行提示：

```text
根据 docs/01_project_overview.md 和 docs/08_non_functional_requirements.md 初始化 PasswdMan2 PWA 项目骨架。前端使用 React + TypeScript + Vite + MUI，后端使用 Python + FastAPI，部署使用 Docker Compose，Nginx 作为反向代理。建立前端、后端、数据库迁移、测试目录、README、docker-compose.yml、nginx 配置、MUI Theme、manifest.webmanifest、基础 Service Worker 和应用图标占位。不要实现业务功能。完成后运行项目自检命令，并说明 Docker Compose 启动方式和 PWA 本地验证方式。
```

## 阶段 2：普通用户认证与会话

- 输入文档：05_api_spec.md、07_security_and_permissions.md
- 输出：注册、登录、退出、当前会话 API、服务端公钥接口、加密通讯基础模块和页面
- 边界：只实现普通用户账号，不实现管理员或团队角色
- 验收标准：用户可注册、登录、退出；登录页可记住账号并自动填充；取消记住账号会清除本地账号标识；错误格式统一；失败登录限流；敏感认证请求通过非对称加密通讯机制传输

执行提示：

```text
根据 docs/05_api_spec.md 和 docs/07_security_and_permissions.md 实现普通用户认证模块。范围包括注册、登录、退出、当前会话接口、服务端 X25519 公钥接口、客户端 X25519 + AES-GCM 加密请求工具和服务端解密中间件，以及对应页面。登录页需要支持“记住账号”，只在客户端本地保存邮箱或账号名，不能保存登录密码、主密码、会话令牌、恢复码或任何密钥；取消勾选后清除本地保存的账号标识。不要实现管理员、团队或角色权限。使用安全密码哈希，不记录敏感明文。敏感认证请求必须通过 X25519 + AES-GCM 机制传输。补充单元测试和基础集成测试。
```

## 阶段 3：个人保险库与密码条目

- 输入文档：03_page_and_feature_spec.md、04_data_model.md、05_api_spec.md
- 输出：Vault 和 PasswordItem 数据模型、API、列表页、详情页、编辑表单
- 边界：只实现当前普通用户的默认个人保险库，不实现团队共享；UI 先按移动端实现，再做桌面增强
- 验收标准：可创建、查看、编辑、归档、删除条目；每条记录支持主要密码、多个副密码和副密码备注；每条副密码有独立复制入口；保险库或设置页提供导入/导出入口；搜索、收藏和归档筛选可用；不实现 tags 创建/编辑/筛选；手机端 360px 宽度下无内容溢出；条目创建、更新、详情读取的敏感载荷使用非对称加密通讯机制

执行提示：

```text
根据 docs/03_page_and_feature_spec.md、docs/04_data_model.md 和 docs/05_api_spec.md 实现个人保险库和密码条目模块。包含数据库迁移、API、移动端优先的前端列表、详情、新建和编辑流程，再补充桌面响应式增强。每条密码记录必须支持主要密码、多个副密码和每个副密码的备注；每条副密码必须有独立复制入口，并靠近对应副密码备注和值。第一版服务端只同步加密后的密码库和被主密码派生密钥加密的 Vault Key；用户在任意设备输入主密码后，本地派生密钥解开 Vault Key，再用 Vault Key 解密同步来的密码数据。保险库页或设置页必须提供导入/导出入口，导入/导出的文件模板后续确认。不要实现 tags 创建、编辑、筛选或批量管理，tags 仅可作为后期预留字段。主要密码、副密码和副密码备注都属于敏感字段。敏感字段保存前加密，并且条目创建、更新、详情读取等敏感通讯必须走 X25519 + AES-GCM 通讯机制。所有资源必须校验当前 user_id 归属。补充 CRUD、越权访问、副密码增删改、副密码复制、加密载荷校验和移动端视口测试。
```

## 阶段 4：密码生成器与安全交互

- 输入文档：03_page_and_feature_spec.md、06_ui_ux_requirements.md
- 输出：密码生成器组件、复制按钮、显示/隐藏密码交互
- 边界：不做浏览器自动填充
- 验收标准：可配置长度和字符集；复制成功有提示；密码自动隐藏；移动端使用底部抽屉或独立页面且触控目标足够

执行提示：

```text
根据 docs/03_page_and_feature_spec.md 和 docs/06_ui_ux_requirements.md 实现移动端优先的密码生成器、复制敏感字段、显示/隐藏密码交互。密码生成器在手机端使用底部抽屉或独立页面，主要按钮触控目标不小于 44px。确保图标按钮有可访问名称，补充组件测试。
```

## 阶段 5：审计日志与个人安全设置

- 输入文档：07_security_and_permissions.md、03_page_and_feature_spec.md
- 输出：AuditLog 模型、日志记录、审计日志页、安全设置页
- 边界：只实现普通用户查看本人日志和管理本人安全设置
- 验收标准：关键操作写入审计日志；用户只能查看自己的日志；日志不包含敏感明文

执行提示：

```text
根据 docs/07_security_and_permissions.md 和 docs/03_page_and_feature_spec.md 实现审计日志和个人安全设置模块。记录登录、条目创建、查看主要密码、查看副密码、复制主要密码、复制副密码、更新、删除、修改设置、退出会话等操作。补充权限测试，确保日志不包含敏感明文。
```

## 阶段 6：个人效率增强功能

- 输入文档：09_mvp_and_roadmap.md
- 输出：导入导出、密码健康评分、重复密码检测等后续功能
- 边界：MVP 后执行，不进入第一版交付
- 验收标准：每个增强功能独立开关、独立测试、不会影响核心保险库稳定性

执行提示：

```text
根据 docs/09_mvp_and_roadmap.md 选择一个个人效率增强功能实现，例如 CSV 导入导出或密码健康评分。保持功能边界独立，不引入团队、管理员或共享概念。补充对应测试和文档。
```

## 阶段 7：PWA 完整验收

- 输入文档：08_non_functional_requirements.md、06_ui_ux_requirements.md、07_security_and_permissions.md
- 输出：离线页、安装提示、缓存策略测试、PWA 验收说明
- 边界：不实现离线完整保险库，不缓存敏感明文数据
- 验收标准：Manifest 有效；Service Worker 可注册；静态资源可离线加载；敏感 API no-store；离线页可访问

执行提示：

```text
根据 docs/08_non_functional_requirements.md、docs/06_ui_ux_requirements.md 和 docs/07_security_and_permissions.md 完成 PWA 验收能力。实现离线页、安装提示、Service Worker 静态资源缓存策略和敏感 API no-store 保护。不要缓存明文密码、恢复码、主密码相关数据或完整保险库。补充 PWA 验证说明和必要测试。
```
