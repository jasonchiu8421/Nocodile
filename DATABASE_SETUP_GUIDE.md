# Nocodile 数据库初始化指南

## 📋 概述

Nocodile 项目使用 MySQL 数据库存储用户、项目、视频、标注等数据。本指南将帮助您完成数据库的初始化设置。

## 🎯 数据库结构

数据库包含以下表：
- `user` - 用户账号信息
- `project` - AI 项目信息
- `class` - 对象检测类别
- `video` - 视频文件信息
- `bbox` - 边界框标注数据
- `project_shared_users` - 项目共享用户关联表

## 🚀 初始化方法

### 方法 1: 使用 Docker Compose（推荐）

这是最简单的方法，适用于 Docker 环境：

```bash
# 1. 进入项目根目录
cd /Users/lubitong/Desktop/noco2/Nocodile

# 2. 启动数据库服务（会自动初始化）
docker-compose up -d database

# 3. 等待数据库就绪后，运行初始化脚本
docker-compose run --rm backend python database/create_object_detection_db.py

# 或者直接启动所有服务（后端会自动初始化数据库）
docker-compose up
```

**注意**: 根据 `docker-compose.yml`，后端服务启动时会自动执行数据库初始化。

### 方法 2: 手动运行初始化脚本

如果您不使用 Docker，可以手动运行初始化脚本：

#### 步骤 1: 确保 MySQL 已安装并运行

```bash
# 检查 MySQL 是否运行
mysql --version

# 启动 MySQL（根据您的系统）
# macOS:
brew services start mysql
# 或
sudo /usr/local/mysql/support-files/mysql.server start

# Linux:
sudo systemctl start mysql
# 或
sudo service mysql start
```

#### 步骤 2: 配置数据库连接

根据您的环境，设置以下环境变量或修改 `backend/config.py`:

```bash
# 方式 1: 使用环境变量
export MYSQL_HOST=localhost
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export MYSQL_DATABASE=Nocodile
export MYSQL_PORT=3306

# 方式 2: 修改 backend/config.py 中的默认值
# 或修改 backend/server.py 中的硬编码配置（第 203-209 行）
```

**当前配置**（在 `server.py` 中）:
```python
config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'noconoconocodile',  # ⚠️ 请根据实际情况修改
    'database': 'Nocodile',           # ⚠️ 注意：数据库名是 'Nocodile'（大写N）
    'charset': 'utf8mb4'
}
```

#### 步骤 3: 运行初始化脚本

```bash
# 进入项目目录
cd /Users/lubitong/Desktop/noco2/Nocodile

# 运行初始化脚本
python database/create_object_detection_db.py
```

或者使用其他脚本：

```bash
# 使用简化脚本
python scripts/simple_db_setup.py

# 使用完整设置脚本
python scripts/setup_database.py
```

### 方法 3: 使用 SQL 脚本（高级）

如果您熟悉 SQL，也可以直接使用 MySQL 客户端：

```bash
# 连接到 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE IF NOT EXISTS Nocodile CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 使用数据库
USE Nocodile;

# 然后运行 create_object_detection_db.py 中的 SQL 语句
```

## ⚙️ 配置说明

### 数据库配置位置

1. **后端代码中** (`backend/server.py` 第 203-209 行):
   ```python
   config = {
       'host': 'localhost',
       'user': 'root',
       'password': 'noconoconocodile',
       'database': 'Nocodile',
       'charset': 'utf8mb4'
   }
   ```

2. **配置文件** (`backend/config.py`):
   - 使用环境变量或默认值
   - 默认数据库名: `object_detection`

3. **初始化脚本** (`database/create_object_detection_db.py`):
   - 优先使用环境变量
   - 默认数据库名: `nocodile_db`

### ⚠️ 重要提示

**数据库名称不一致问题**:
- `server.py` 使用: `Nocodile` (大写N)
- `config.py` 默认: `object_detection`
- `create_object_detection_db.py` 默认: `nocodile_db`

**建议统一为**: `Nocodile`（与 server.py 保持一致）

## 🔍 验证数据库初始化

### 检查数据库是否创建成功

```bash
# 连接到 MySQL
mysql -u root -p

# 查看数据库
SHOW DATABASES;

# 使用数据库
USE Nocodile;

# 查看表
SHOW TABLES;

# 应该看到以下表:
# - user
# - project
# - class
# - video
# - bbox
# - project_shared_users
```

### 检查表结构

```bash
# 查看某个表的结构
DESCRIBE user;
DESCRIBE project;
```

## 🐛 常见问题

### 问题 1: 连接失败

**错误**: `pymysql.Error: (2003, "Can't connect to MySQL server")`

**解决方案**:
1. 确保 MySQL 服务正在运行
2. 检查主机和端口配置
3. 检查防火墙设置
4. 验证用户名和密码

### 问题 2: 数据库不存在

**错误**: `Unknown database 'Nocodile'`

**解决方案**:
1. 确保先运行初始化脚本创建数据库
2. 或者手动创建数据库:
   ```sql
   CREATE DATABASE Nocodile CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

### 问题 3: 权限错误

**错误**: `Access denied for user 'root'@'localhost'`

**解决方案**:
1. 检查用户名和密码是否正确
2. 确保用户有创建数据库的权限:
   ```sql
   GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost';
   FLUSH PRIVILEGES;
   ```

### 问题 4: 外键约束错误

**错误**: `Cannot add foreign key constraint`

**解决方案**:
- 初始化脚本会自动处理外键约束
- 如果仍有问题，检查表的创建顺序

## 📝 快速开始命令

### 完整初始化流程（Docker）

```bash
# 1. 启动数据库
docker-compose up -d database

# 2. 等待数据库就绪（约 10-30 秒）
sleep 15

# 3. 初始化数据库
docker-compose run --rm backend python database/create_object_detection_db.py

# 4. 启动所有服务
docker-compose up
```

### 完整初始化流程（本地）

```bash
# 1. 设置环境变量
export MYSQL_HOST=localhost
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export MYSQL_DATABASE=Nocodile

# 2. 运行初始化脚本
cd /Users/lubitong/Desktop/noco2/Nocodile
python database/create_object_detection_db.py

# 3. 验证
mysql -u root -p -e "USE Nocodile; SHOW TABLES;"
```

## 🔄 重置数据库

如果需要重置数据库（删除所有数据并重新初始化）：

```bash
# 警告：这将删除所有数据！

# 方法 1: 使用 Docker
docker-compose down -v  # 删除所有卷（包括数据库数据）
docker-compose up -d database
docker-compose run --rm backend python database/create_object_detection_db.py

# 方法 2: 手动删除
mysql -u root -p -e "DROP DATABASE IF EXISTS Nocodile;"
python database/create_object_detection_db.py
```

## 📚 相关文件

- `database/create_object_detection_db.py` - 主要初始化脚本
- `scripts/simple_db_setup.py` - 简化版初始化脚本
- `scripts/setup_database.py` - 完整设置脚本
- `backend/config.py` - 数据库配置
- `backend/server.py` - 后端服务器（包含数据库连接配置）
- `docker-compose.yml` - Docker 配置

## ✅ 初始化检查清单

- [ ] MySQL 服务已启动
- [ ] 数据库连接配置正确
- [ ] 运行初始化脚本
- [ ] 验证数据库和表已创建
- [ ] 测试后端连接数据库
- [ ] 创建测试用户（可选）

## 🎉 完成

数据库初始化完成后，您可以：
1. 启动后端服务
2. 启动前端服务
3. 通过前端注册新用户
4. 开始创建项目

如有问题，请检查日志文件或联系开发团队。

