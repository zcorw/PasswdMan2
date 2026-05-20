# 导入导出文件格式说明

PasswdMan2 当前导入导出模板使用 CSV 格式。模板保留了原始文件中的 8 个字段，并追加了 PasswdMan2 专用字段。

模板文件：

```text
docs/password-import-export-template.csv
```

## 表头

```csv
name,login_uri,login_username,login_password,remark,fields,folder,type,passwdman2_secondary_passwords,passwdman2_totp_secret,passwdman2_secure_note,passwdman2_custom_fields,passwdman2_favorite,passwdman2_status
```

## 字段说明

| 字段 | 是否必填 | 说明 |
| --- | --- | --- |
| `name` | 是 | 条目名称，对应 PasswdMan2 的标题。最多 120 个字符。 |
| `login_uri` | 否 | 登录网址，对应 URL。 |
| `login_username` | 否 | 登录用户名。 |
| `login_password` | 是 | 主密码。导入后会用当前 Vault Key 加密保存。 |
| `remark` | 否 | 备注。导入时如果 `passwdman2_secure_note` 为空，会作为安全备注导入。 |
| `fields` | 否 | 原模板保留字段。可填写 JSON 数组形式的自定义字段。 |
| `folder` | 否 | 原模板保留字段。当前项目暂不使用。 |
| `type` | 否 | 原模板保留字段。建议填写 `login`。 |
| `passwdman2_secondary_passwords` | 否 | 副密码列表，JSON 数组。 |
| `passwdman2_totp_secret` | 否 | TOTP secret。 |
| `passwdman2_secure_note` | 否 | 安全备注。优先级高于 `remark`。 |
| `passwdman2_custom_fields` | 否 | 自定义字段，JSON 数组。优先级高于 `fields`。 |
| `passwdman2_favorite` | 否 | 是否收藏。支持 `true`、`1`、`yes`、`y`。其它值按 `false` 处理。 |
| `passwdman2_status` | 否 | 条目状态。支持 `active`、`archived`。为空时按 `active` 处理。 |

## 副密码格式

`passwdman2_secondary_passwords` 必须是 JSON 数组。每个对象支持：

```json
[
  {
    "note": "Recovery code",
    "password": "secondary-secret"
  }
]
```

也兼容 `value` 字段：

```json
[
  {
    "note": "Recovery code",
    "value": "secondary-secret"
  }
]
```

## 自定义字段格式

`passwdman2_custom_fields` 和 `fields` 必须是 JSON 数组。数组内每一项必须是对象。

示例：

```json
[
  {
    "label": "Email",
    "value": "user@example.com"
  },
  {
    "label": "Account ID",
    "value": "123456"
  }
]
```

## CSV 转义规则

如果字段内容包含逗号、双引号或换行，需要用双引号包裹整个字段。

字段内部的双引号需要写成两个双引号。

例如：

```csv
name,login_uri,login_username,login_password,remark,fields,folder,type,passwdman2_secondary_passwords,passwdman2_totp_secret,passwdman2_secure_note,passwdman2_custom_fields,passwdman2_favorite,passwdman2_status
GitHub,https://github.com,pack.william,primary-secret,secure note,,dev,login,"[{""note"":""Recovery"",""password"":""secondary-secret""}]",totp-secret,secure note,"[{""label"":""Email"",""value"":""pack@example.com""}]",true,active
```

## 最小可导入示例

```csv
name,login_uri,login_username,login_password,remark,fields,folder,type,passwdman2_secondary_passwords,passwdman2_totp_secret,passwdman2_secure_note,passwdman2_custom_fields,passwdman2_favorite,passwdman2_status
GitHub,https://github.com,pack.william,primary-secret,,,,,,,,,,active
```

## 空行处理

完全为空的模板行会被忽略。例如：

```csv
,,,,,,,,,,,,,
```

## 导入限制

- 单次最多导入 100 个条目。
- `name` 必须存在且不能超过 120 个字符。
- `login_password` 必须存在。
- `passwdman2_secondary_passwords` 最多 20 条。
- JSON 字段必须是合法 JSON，否则导入会失败。

## 安全说明

CSV 导入文件包含明文密码。导入完成后应从本地下载目录、聊天记录、云盘同步目录等位置删除该文件。

CSV 导出文件也包含明文密码。导出前必须解锁 Vault，因为应用需要使用 Vault Key 解密条目后再生成 CSV。

不要把 CSV 导入/导出文件提交到 Git，也不要上传到不可信位置。
