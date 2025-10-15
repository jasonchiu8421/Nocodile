# Nocodile Docker Setup

## 🐳 **Docker Compose 配置說明**

### **問題修復：**

1. **缺少Dockerfile文件** ✅
   - 創建了 `nocodile/Dockerfile` 用於前端
   - 修復了 `backend/Dockerfile` 的端口配置

2. **錯誤的構建上下文** ✅
   - 調整了Docker Compose的構建路徑
   - 正確指向前端和後端代碼

3. **端口配置問題** ✅
   - 後端：8888端口（匹配server.py）
   - 前端：3000端口（Next.js默認）
   - MySQL：3306端口

### **服務配置：**

#### **Backend (Python FastAPI)**
- 端口：8888
- 數據庫：MySQL
- 環境變量：已配置

#### **Frontend (Next.js)**
- 端口：3000
- API URL：http://backend:8888
- 環境：production

#### **MySQL Database**
- 端口：3306
- 數據庫：nocodile_db
- 持久化存儲：mysql-data volume

### **使用方法：**

#### **方法1：使用批處理文件**
```bash
# 在 Frontend/Nocodile 目錄中運行
start-docker.bat
```

#### **方法2：手動命令**
```bash
# 在 Frontend/Nocodile 目錄中運行
docker-compose -f docker-compose.yml up --build
```

#### **方法3：後台運行**
```bash
docker-compose -f docker-compose.yml up -d --build
```

### **訪問地址：**

- **前端應用**：http://localhost:3000
- **後端API**：http://localhost:8888
- **MySQL數據庫**：localhost:3306

### **常用命令：**

```bash
# 停止服務
docker-compose -f docker-compose.yml down

# 查看日誌
docker-compose -f docker-compose.yml logs

# 重新構建
docker-compose -f docker-compose.yml up --build

# 清理所有容器和卷
docker-compose -f docker-compose.yml down -v
```

### **故障排除：**

1. **端口衝突**：確保8888、3000、3306端口未被占用
2. **構建失敗**：檢查Dockerfile路徑是否正確
3. **數據庫連接**：等待MySQL完全啟動後再訪問應用

### **文件結構：**
```
Frontend/Nocodile/
├── docker-compose.yml      # Docker Compose配置
├── start-docker.bat        # Windows啟動腳本
├── nocodile/
│   ├── Dockerfile          # 前端Dockerfile
│   └── ...                 # Next.js應用代碼
└── ../../Backend/Nocodile/backend/
    ├── Dockerfile          # 後端Dockerfile
    └── ...                 # Python應用代碼
```
