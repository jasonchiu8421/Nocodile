# 🗄️ MySQL 數據庫設置

這個文件夾包含了 MySQL 數據庫的所有配置和腳本，數據將存儲在項目文件夾中。

## 📁 文件夾結構

```
database/
├── data/           # MySQL 數據文件存儲位置
├── logs/           # MySQL 日誌文件
├── backup/         # 數據庫備份文件
├── scripts/        # 數據庫腳本
│   ├── init_database.sql    # 數據庫初始化腳本
│   ├── setup_mysql.py       # MySQL 安裝和設置腳本
│   └── start_mysql.bat      # MySQL 啟動腳本
├── my.cnf          # MySQL 配置文件
└── README.md       # 本說明文件
```

## 🚀 快速開始

### 方法 1: 自動設置 (推薦)

1. **運行設置腳本**：
   ```bash
   python database/scripts/setup_mysql.py
   ```

2. **啟動 MySQL 服務**：
   ```bash
   database/scripts/start_mysql.bat
   ```

3. **啟動後端服務器**：
   ```bash
   python server.py
   ```

### 方法 2: 手動設置

1. **安裝 MySQL**：
   - 下載 MySQL Community Server
   - 安裝時選擇 "Developer Default" 配置
   - 設置 root 密碼為 `12345678`

2. **初始化數據庫**：
   ```bash
   mysql -u root -p12345678 < database/scripts/init_database.sql
   ```

3. **啟動後端服務器**：
   ```bash
   python server.py
   ```

## ⚙️ 配置說明

### MySQL 配置文件 (my.cnf)

- **數據目錄**: `database/data/`
- **端口**: 3306
- **字符集**: utf8mb4
- **日誌文件**: `database/logs/`

### 數據庫結構

- **數據庫名稱**: `object_detection`
- **用戶表**: `users`
- **項目表**: `project`
- **視頻表**: `videos`
- **圖片表**: `images`
- **共享項目表**: `shared_projects`

## 🔧 故障排除

### 問題 1: MySQL 服務無法啟動

**解決方案**：
1. 檢查 MySQL 是否正確安裝
2. 以管理員身份運行命令提示符
3. 手動啟動服務：`net start mysql`

### 問題 2: 數據庫連接失敗

**解決方案**：
1. 檢查 MySQL 服務是否運行
2. 確認用戶名和密碼正確
3. 檢查端口 3306 是否被占用

### 問題 3: 權限問題

**解決方案**：
1. 以管理員身份運行 PowerShell
2. 確保有足夠的權限創建文件夾
3. 檢查防火牆設置

## 📊 示例數據

數據庫初始化後會包含以下示例數據：

- **用戶**: testuser (ID: 1)
- **項目**: 
  - Object Detection Project (ID: 1)
  - Image Classification (ID: 2)
  - Video Analysis (ID: 3)
- **視頻和圖片**: 每個項目都有示例媒體文件

## 🔄 備份和恢復

### 備份數據庫
```bash
mysqldump -u root -p12345678 object_detection > database/backup/backup_$(date +%Y%m%d_%H%M%S).sql
```

### 恢復數據庫
```bash
mysql -u root -p12345678 object_detection < database/backup/backup_file.sql
```

## 📝 注意事項

1. **數據安全**: 數據存儲在項目文件夾中，請定期備份
2. **密碼安全**: 默認密碼為 `12345678`，生產環境請更改
3. **端口衝突**: 確保端口 3306 未被其他服務占用
4. **權限設置**: 確保應用程序有讀寫數據庫文件夾的權限

## 🆘 獲取幫助

如果遇到問題，請檢查：

1. MySQL 服務是否正在運行
2. 數據庫連接配置是否正確
3. 文件夾權限是否足夠
4. 防火牆設置是否阻止連接

更多信息請參考 MySQL 官方文檔。
