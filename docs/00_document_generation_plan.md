# 文档生成计划

## 项目类型分析

- 项目类型：个人密码管理 PWA 站点
- 复杂度：中等，安全要求高
- 推荐拆分策略：生成 01-11 全套文档，团队协作、管理员后台、企业能力全部排除在 MVP 外
- 术语基准：
  - 产品名：PasswdMan2
  - 用户角色：访客、普通用户
  - 核心模块：认证模块、个人保险库模块、密码条目模块、密码生成器模块、审计日志模块、设置模块
  - 核心实体：User、Vault、PasswordItem、AuditLog、RecoveryCode、Session
  - 通讯安全：客户端与服务端通讯必须采用非对称加密机制保护敏感请求与响应，HTTPS 是基础要求但不能替代业务层加密要求
  - 应用形态：PWA，包含 Web App Manifest、Service Worker、可安装体验、基础离线壳和安全缓存策略
  - UI 设计基准：移动端优先，手机端是主体验，桌面端作为响应式增强

## 范围修订

- 用户明确提出：MVP 只实现普通用户功能，不考虑团队与管理员。
- 用户明确提出：客户端与服务端通讯要用非对称加密方式通讯。
- 用户明确提出：项目以 PWA 形式开发。
- 用户明确提出：项目 UI 以移动端为主进行设计。
- AI 推理建议：所有团队共享、团队管理员、系统管理员、后台管理能力均作为非目标处理，不进入数据模型、API、页面和开发任务。

## 将生成以下文档

| 文件名 | 用途 | 内容范围 |
|---|---|---|
| 01_project_overview.md | 项目总览 | 个人密码管理背景、目标、MVP、非目标 |
| 02_user_scenarios_and_flows.md | 用户流程 | 访客与普通用户场景、主流程、异常流程 |
| 03_page_and_feature_spec.md | 页面与功能 | 登录、注册、个人保险库、条目、生成器、设置、日志 |
| 04_data_model.md | 数据模型 | User、Vault、PasswordItem、AuditLog、RecoveryCode、Session |
| 05_api_spec.md | API 规格 | 个人用户 API、个人资源权限、分页筛选 |
| 06_ui_ux_requirements.md | UI/UX 要求 | 个人密码工作台、交互、响应式、可访问性 |
| 07_security_and_permissions.md | 安全与权限 | 个人账号认证、个人资源授权、加密、审计 |
| 08_non_functional_requirements.md | 非功能要求 | 性能、可用性、兼容性、日志、备份、部署 |
| 09_mvp_and_roadmap.md | MVP 与路线图 | 个人版 MVP、排除项、后续迭代 |
| 10_codex_task_plan.md | Codex 开发任务 | 个人版开发阶段、边界、验收标准 |
| 11_figma_generation_prompt.md | Figma 生成提示 | 个人密码管理站点页面与组件生成要求 |
