# API 规格

## API 设计原则

- 使用 REST 风格 JSON API。
- 所有受保护接口必须携带认证凭据。
- MVP 只提供普通用户自己的个人资源接口。
- 客户端与服务端通讯必须采用 X25519 + AES-GCM 保护敏感请求与响应；HTTPS 是基础传输要求，但敏感业务载荷仍需应用层加密。
- 敏感字段尽量传输密文，服务端只保存密文。
- 写操作返回最新资源状态。
- 列表接口统一支持分页、MVP 筛选和排序。
- API 响应需提供明确的缓存策略，敏感接口必须禁止 Service Worker 和浏览器持久缓存明文响应。

## 非对称加密通讯

- 客户端必须先通过公开接口获取服务端当前有效公钥。
- 敏感写入请求必须通过 X25519 密钥交换协商一次性对称会话密钥，再用 AES-GCM 加密载荷。
- 服务端响应中如包含敏感信息，应使用客户端临时公钥加密，或使用协商出的会话密钥加密。
- 加密载荷必须包含 nonce、timestamp、key_id、algorithm，服务端需防重放攻击。
- 公钥需要支持版本号和轮换，客户端请求必须带 key_id。
- 注册、登录、主密码修改、恢复码生成、密码条目创建、密码条目更新、密码条目详情读取、保险库同步必须纳入该机制。

### GET /api/crypto/server-public-key

响应：

```json
{
  "data": {
    "keyId": "key_2026_05",
    "algorithm": "X25519+AES-GCM",
    "publicKey": "base64-or-pem",
    "expiresAt": "2026-06-01T00:00:00Z"
  },
  "error": null,
  "requestId": "req_..."
}
```

## 通用响应

```json
{
  "data": {},
  "error": null,
  "requestId": "req_..."
}
```

## 错误码

| code | HTTP | 说明 |
|---|---:|---|
| VALIDATION_ERROR | 400 | 参数错误 |
| UNAUTHORIZED | 401 | 未登录 |
| FORBIDDEN | 403 | 无权访问该个人资源 |
| NOT_FOUND | 404 | 资源不存在 |
| RATE_LIMITED | 429 | 请求过于频繁 |
| INTERNAL_ERROR | 500 | 服务端错误 |

## 认证接口

| 方法 | URL | 说明 |
|---|---|---|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| POST | /api/auth/logout | 退出 |
| GET | /api/auth/session | 当前会话 |

## 记住账号

- 记住账号是客户端本地功能，不需要专门的服务端 API。
- 客户端只允许保存邮箱或账号名，例如 `rememberedLoginIdentifier`。
- 客户端不得保存登录密码、主密码、会话令牌、恢复码、私钥、解密后的保险库密钥。
- 登录请求仍必须完整经过非对称加密通讯机制。
- 用户取消“记住账号”后，客户端必须删除本地保存的账号标识。

## 个人保险库接口

| 方法 | URL | 说明 |
|---|---|---|
| GET | /api/vault | 当前用户默认个人保险库 |
| PATCH | /api/vault | 更新个人保险库名称 |

### GET /api/vault/sync

返回当前用户可同步的加密保险库数据：

```json
{
  "data": {
    "vault": {
      "id": "vault-id",
      "name": "Personal",
      "encryptedVaultKey": "...",
      "keyDerivationSalt": "...",
      "keyDerivationParams": {
        "algorithm": "Argon2id",
        "memory": 65536,
        "iterations": 3,
        "parallelism": 1
      },
      "encryptionVersion": 1
    },
    "items": [
      {
        "id": "item-id",
        "title": "GitHub",
        "url": "https://github.com",
        "username": "pack.william",
        "encryptedSecret": "...",
        "favorite": true,
        "status": "active",
        "updatedAt": "2026-05-12T00:00:00Z"
      }
    ]
  },
  "error": null,
  "requestId": "req_..."
}
```

- 服务端只返回密文密码库和被主密码派生密钥加密的 Vault Key。
- 客户端在本地输入主密码，派生密钥，解密 Vault Key，再解密 `encryptedSecret`。
- 服务端不得接收或返回 Vault Key 明文。

## 导入/导出接口

MVP 至少提供界面入口；API 可在实现导入/导出功能时补齐。

| 方法 | URL | 说明 |
|---|---|---|
| POST | /api/imports/password-items | 导入密码条目，后续迭代 |
| POST | /api/exports/password-items | 创建导出任务或返回加密导出文件，后续迭代 |

- 导入/导出接口必须纳入非对称加密通讯机制。
- 导出响应不得被 Service Worker 或浏览器持久缓存。
- 导出操作必须记录审计日志。
- MVP 若只做入口，可返回 `NOT_IMPLEMENTED` 或显示前端占位说明。

## 密码条目接口

| 方法 | URL | 说明 |
|---|---|---|
| GET | /api/items | 当前用户条目列表 |
| POST | /api/items | 创建条目 |
| GET | /api/items/{itemId} | 条目详情 |
| PATCH | /api/items/{itemId} | 更新条目 |
| DELETE | /api/items/{itemId} | 软删除条目 |

### POST /api/items 与 PATCH /api/items/{itemId}

请求中的敏感内容必须位于加密载荷内。解密后的业务结构建议如下：

```json
{
  "title": "Example",
  "url": "https://example.com",
  "username": "user@example.com",
  "secret": {
    "primaryPassword": "main-password",
    "secondaryPasswords": [
      {
        "id": "local-uuid",
        "password": "secondary-password",
        "note": "支付密码",
        "sortOrder": 1
      }
    ],
    "totpSecret": "",
    "secureNote": "",
    "customFields": []
  },
  "tags": [],
  "favorite": false
}
```

- `secret.primaryPassword`：主要密码。
- `secret.secondaryPasswords`：副密码数组，每项包含副密码值和副密码备注。
- `secret.secondaryPasswords.note`：用于说明副密码用途，建议必填。
- `secret.secondaryPasswords` MVP 建议最多 20 条。
- 服务端保存时不得把 `secret` 明文落库；客户端应使用 Vault Key 加密后提交 `encrypted_secret`。

### GET /api/items

查询参数：

- q：搜索关键词。
- favorite：true/false。
- status：active, archived。
- page：页码，默认 1。
- pageSize：每页数量，默认 20，最大 100。
- sort：updatedAtDesc, titleAsc, createdAtDesc。

Tags 说明：

- `tags` 为后期开发项，MVP API 可忽略该字段或返回空数组。
- MVP 不要求支持 `tag` 查询参数、标签创建、标签编辑或标签筛选。

## 安全设置接口

| 方法 | URL | 说明 |
|---|---|---|
| GET | /api/settings/security | 查看安全设置摘要 |
| POST | /api/settings/master-password/change | 修改主密码 |
| GET | /api/sessions | 查看活跃会话 |
| DELETE | /api/sessions/{sessionId} | 退出指定会话 |
| POST | /api/recovery-codes | 生成恢复码 |

## 审计日志接口

| 方法 | URL | 说明 |
|---|---|---|
| GET | /api/audit-logs | 查看本人审计日志 |

## 权限要求

- 普通用户只能访问自己拥有的 Vault、PasswordItem、Session、AuditLog、RecoveryCode。
- API 必须在服务端校验资源归属。
- 对不存在或不属于当前用户的资源，可返回 404 以减少资源枚举风险。
- 对要求加密载荷的接口，未加密、key_id 失效、nonce 重放、签名或认证标签校验失败时必须拒绝请求。
- 副密码与副密码备注属于敏感资源，权限、加密通讯、缓存和审计规则与主要密码一致。

## 幂等性要求

- POST 创建接口建议支持 Idempotency-Key。
- DELETE 软删除重复调用应返回成功或资源已删除状态。

## PWA 缓存要求

- `/manifest.webmanifest`、应用图标、静态 JS/CSS、离线页可缓存。
- `/api/auth/*`、`/api/items*`、`/api/settings/*`、`/api/audit-logs` 默认不得被持久缓存。
- 对敏感 API 响应设置 `Cache-Control: no-store`。
- Service Worker 不得把包含明文密码、恢复码、主密码相关数据的响应写入 Cache Storage 或 IndexedDB。
