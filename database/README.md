# Nocodile Database Container

這個資料夾包含 Nocodile 的專用資料庫容器設置。

## 運作方式

當您執行 `docker compose up` 時，會自動：

1. **建置資料庫容器** - 使用自定義 Dockerfile 建置包含 Python 的 MySQL 容器
2. **自動初始化** - 容器啟動時自動執行 `create_object_detection_db.py`
3. **創建資料庫和表格** - 創建 `nocodile` 資料庫和所有必要的表格
4. **創建初始使用者** - 同時創建 30 個測試使用者 (user1-user30)，密碼為 "password123"

## 檔案說明

- `Dockerfile` - 資料庫容器的建置配置（基於 MySQL 8.0 + Python）
- `create_object_detection_db.py` - 主要的資料庫初始化腳本
- `.dockerignore` - Docker 建置時忽略的檔案
- `README.md` - 本說明文件

## 資料庫結構

資料庫包含以下表格：
- `user` - 使用者帳號
- `project` - AI 專案
- `class` - 物件檢測類別
- `video` - 影片檔案
- `bbox` - 邊界框註解
- `project_shared_users` - 專案共享使用者關聯

## 使用方法

### 啟動整個系統
```bash
docker compose up
```

### 只啟動資料庫容器
```bash
docker compose up -d database
```

### 資料庫管理命令
```bash
# 查看資料庫日誌
docker compose logs database

# 連接到資料庫
docker compose exec database mysql -u root -p nocodile

# 備份資料庫
docker compose exec database mysqldump -u root -p nocodile > backup.sql

# 還原資料庫
docker compose exec -T database mysql -u root -p nocodile < backup.sql
```

資料庫會在第一次執行時自動初始化。後續執行會使用現有的資料庫。

## 測試使用者

創建 30 個測試使用者，憑證如下：
- 使用者名稱：`user1` 到 `user30`
- 密碼：`password123`

密碼使用 PBKDF2-HMAC-SHA256 演算法進行安全雜湊。

## 特色功能

- **自動等待 MySQL 就緒** - 在 Docker 環境中自動等待資料庫完全啟動
- **智能環境偵測** - 自動偵測是否在 Docker 環境中運行
- **完整的錯誤處理** - 包含重試機制和詳細的錯誤訊息
- **一鍵初始化** - 包含資料庫創建、表格創建、使用者創建
