# 备份与恢复说明

本文说明 PasswdMan2 在 VPS 上如何设置 PostgreSQL 定时备份，以及如何做安全的恢复演习。

## 文件位置约定

以下文件必须放在同一个目录下，例如 `/opt/passwdman2`：

```text
/opt/passwdman2/
  .env
  docker-compose.yml
  backup-postgres.sh
  restore-postgres-test.sh
```

脚本会自动读取同级 `.env`，并在同级 `docker-compose.yml` 所在目录执行 `docker compose`。

## .env 配置

在 VPS 的 `/opt/passwdman2/.env` 中配置：

```env
BACKUP_DIR=/opt/passwdman2-backups
BACKUP_RETENTION_DAYS=14

RESTORE_TEST_CONTAINER=passwdman2-restore-test-db
RESTORE_TEST_DB=passwdman2_restore_test
RESTORE_TEST_PASSWORD=restore_test_password
RESTORE_TEST_PORT=15432
RESTORE_TEST_USER=passwdman2
KEEP_RESTORE_TEST_CONTAINER=false
```

数据库连接相关变量沿用项目已有配置：

```env
POSTGRES_DB=passwdman2
POSTGRES_USER=passwdman2
POSTGRES_PASSWORD=<strong-password>
```

## 准备备份目录

建议备份目录不要放在项目部署目录内部。

```bash
sudo mkdir -p /opt/passwdman2-backups
sudo chown -R deploy:deploy /opt/passwdman2-backups
chmod 700 /opt/passwdman2-backups
```

如果使用其他部署用户，请把 `deploy:deploy` 换成实际用户。

## 授权脚本

```bash
cd /opt/passwdman2
chmod +x backup-postgres.sh restore-postgres-test.sh
```

## 手动执行备份

```bash
cd /opt/passwdman2
./backup-postgres.sh
```

备份成功后会生成：

```text
/opt/passwdman2-backups/passwdman2-postgres-YYYYmmddTHHMMSSZ.dump
```

脚本不会创建 `latest.dump` 软链接，方便把备份目录同步到不支持软链接的存储，例如 Google Drive。

## 设置定时备份

建议使用运行 Docker Compose 的部署用户设置 cron。

切换到部署用户：

```bash
sudo -iu deploy
```

确认该用户可以执行 Docker：

```bash
docker ps
```

编辑定时任务：

```bash
crontab -e
```

每天凌晨 3 点执行备份：

```cron
0 3 * * * /opt/passwdman2/backup-postgres.sh >> /opt/passwdman2-backups/backup.log 2>&1
```

查看日志：

```bash
tail -n 100 /opt/passwdman2-backups/backup.log
```

查看当前 cron：

```bash
crontab -l
```

## 恢复演习

不要在生产 PostgreSQL 容器上直接执行恢复演习。

`restore-postgres-test.sh` 会启动一个独立临时 PostgreSQL 容器，把备份恢复进去，然后做基本校验。默认不会触碰生产 compose 的 `postgres` 容器。

使用最新备份演习：

```bash
cd /opt/passwdman2
./restore-postgres-test.sh
```

不传参数时，脚本会从 `BACKUP_DIR` 中查找 `passwdman2-postgres-*.dump`，按文件名排序后使用最后一条记录。备份文件名包含 UTC 时间戳，所以最后一条就是最新备份。

使用指定备份文件演习：

```bash
cd /opt/passwdman2
./restore-postgres-test.sh /opt/passwdman2-backups/passwdman2-postgres-20260520T030000Z.dump
```

默认演习完成后，临时容器会自动停止。

如果希望保留临时容器用于人工检查，把 `.env` 改成：

```env
KEEP_RESTORE_TEST_CONTAINER=true
```

然后可以连接测试库：

```bash
docker exec -it passwdman2-restore-test-db psql -U passwdman2 -d passwdman2_restore_test
```

检查完成后手动停止：

```bash
docker stop passwdman2-restore-test-db
```

## 生产恢复注意事项

生产恢复会覆盖线上数据，不能当作日常演习执行。

真正需要恢复生产时，建议先：

1. 停止应用访问或进入维护窗口。
2. 复制当前生产数据库备份。
3. 在独立临时容器中用 `restore-postgres-test.sh` 验证目标备份可恢复。
4. 确认恢复时间点和数据丢失范围。
5. 再对生产数据库执行恢复。

生产恢复命令应根据事故情况单独确认，不建议写入自动脚本。

## 安全建议

- 备份文件包含加密 vault 数据和账号元数据，应按敏感数据处理。
- 备份目录权限建议为 `700`，备份文件权限建议为 `600`。
- 不要把 `.env`、备份文件、数据库 dump 上传到 Git。
- 建议额外同步一份备份到另一台服务器或对象存储。
- 建议定期执行恢复演习，确认备份不是损坏文件。
