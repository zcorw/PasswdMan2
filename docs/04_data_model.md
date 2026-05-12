# 数据模型

## 实体列表

- User：普通用户账号。
- Vault：个人保险库。
- PasswordItem：密码条目。
- AuditLog：审计日志。
- Session：登录会话。
- RecoveryCode：恢复码。

## User

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| email | string | 登录邮箱，唯一 |
| password_hash | string | 登录密码哈希 |
| master_key_salt | string | 主密钥派生盐 |
| encrypted_user_key | text | 被主密码保护的用户密钥 |
| mfa_enabled | boolean | 是否启用 MFA，MVP 可为 false |
| status | enum | active, locked, disabled |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

## Vault

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| user_id | uuid | 所属普通用户 |
| name | string | 保险库名称 |
| encrypted_vault_key | text | 被主密码派生密钥加密后的 Vault Key |
| key_derivation_salt | string | 主密码派生密钥使用的盐 |
| key_derivation_params | json | KDF 参数，例如算法、迭代次数、内存参数 |
| encryption_version | integer | 加密方案版本 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

## PasswordItem

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| vault_id | uuid | 所属个人保险库 |
| title | string | 标题 |
| url | string | 网址 |
| username | string | 用户名，可加密或半加密 |
| encrypted_secret | text | 主要密码、副密码列表、TOTP、备注等敏感内容密文 |
| tags | json nullable | 标签数组，后期开发预留字段，MVP 可不使用 |
| favorite | boolean | 是否收藏 |
| status | enum | active, archived, deleted |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### PasswordItem.encrypted_secret 明文结构

加密前建议使用结构化 JSON，客户端使用 Vault Key 整体加密后写入 `encrypted_secret`。服务端不应依赖其中明文字段做查询，也不具备解密能力。

```json
{
  "primaryPassword": "main-password",
  "secondaryPasswords": [
    {
      "id": "local-uuid",
      "password": "secondary-password",
      "note": "支付密码",
      "sortOrder": 1
    }
  ],
  "totpSecret": "optional-totp-secret",
  "secureNote": "optional-note",
  "customFields": []
}
```

- `primaryPassword`：主要密码，可为空但建议填写。
- `secondaryPasswords`：副密码数组，MVP 建议最多 20 条。
- `secondaryPasswords.password`：副密码值，属于敏感字段。
- `secondaryPasswords.note`：副密码备注，属于敏感字段，建议填写，长度 1-120。
- `secondaryPasswords.sortOrder`：副密码展示顺序。

## AuditLog

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| user_id | uuid | 操作用户 |
| action | enum | login, logout, item_create, item_view_primary_password, item_copy_primary_password, item_view_secondary_password, item_copy_secondary_password, item_update, item_delete, settings_update |
| target_type | string | 目标类型 |
| target_id | uuid | 目标 ID |
| target_detail | string nullable | 可选目标细节，例如 secondary_password_id，不记录敏感明文 |
| ip_address | string | IP |
| user_agent | string | 浏览器标识 |
| created_at | datetime | 创建时间 |

## Session

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| user_id | uuid | 所属用户 |
| token_hash | string | 会话令牌哈希 |
| ip_address | string | IP |
| user_agent | string | 浏览器标识 |
| status | enum | active, expired, revoked |
| expires_at | datetime | 过期时间 |
| created_at | datetime | 创建时间 |

## RecoveryCode

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| user_id | uuid | 所属用户 |
| code_hash | string | 恢复码哈希 |
| status | enum | unused, used |
| used_at | datetime nullable | 使用时间 |
| created_at | datetime | 创建时间 |

## 约束与关系

- User.email 唯一。
- User 1:N Vault，MVP 默认创建 1 个个人保险库。
- Vault 1:N PasswordItem。
- User 1:N Session。
- User 1:N AuditLog。
- User 1:N RecoveryCode。
- PasswordItem.status 为 deleted 时默认软删除。

## 第一版密钥模型

- 用户输入主密码后，客户端本地使用 `key_derivation_salt` 和 `key_derivation_params` 派生 Key Encryption Key。
- 客户端使用派生出的 Key Encryption Key 解密 `Vault.encrypted_vault_key`，得到 Vault Key。
- 客户端使用 Vault Key 解密 `PasswordItem.encrypted_secret`。
- 服务端只保存 `encrypted_vault_key` 和 `encrypted_secret`，不保存主密码、Key Encryption Key、Vault Key 或任何明文密码数据。
- 用户在任意设备登录后，必须输入主密码才能在本地解开 Vault Key 并解密同步来的密码数据。
- 如果用户丢失主密码和恢复材料，服务端无法恢复保险库明文。

## 验证规则

- email 必须合法且唯一。
- PasswordItem.title 必填，长度 1-120。
- PasswordItem.url 若填写，应为合法 URL。
- PasswordItem.secondaryPasswords 最多 20 条。
- 副密码备注建议必填，长度 1-120。
- tags 为后期开发项；若启用，单个长度不超过 32，最多 20 个。
- 审计日志不可由普通业务接口修改或删除。
