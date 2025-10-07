"""
Nocodile 後端配置模組
使用環境變數管理所有配置參數
"""

import os
from typing import Optional

class DatabaseConfig:
    """資料庫配置類"""
    
    def __init__(self):
        # 從環境變數讀取配置，提供預設值
        self.host = os.getenv('MYSQL_HOST', 'mysql')
        self.port = int(os.getenv('MYSQL_PORT', '3306'))
        self.user = os.getenv('MYSQL_USER', 'root')
        self.password = os.getenv('MYSQL_PASSWORD', 'rootpassword')
        self.database = os.getenv('MYSQL_DATABASE', 'nocodile_db')
        self.charset = 'utf8mb4'
        self.autocommit = True
    
    def get_connection_config(self) -> dict:
        """獲取資料庫連接配置"""
        return {
            'host': self.host,
            'port': self.port,
            'user': self.user,
            'password': self.password,
            'database': self.database,
            'charset': self.charset,
            'autocommit': self.autocommit
        }
    
    def get_connection_configs(self) -> list:
        """獲取多個連接配置（用於容錯）"""
        configs = []
        
        # 主要配置（Docker 環境）
        configs.append(self.get_connection_config())
        
        # 本地 Docker 映射端口配置
        if self.host == 'mysql':
            local_config = self.get_connection_config()
            local_config['host'] = 'localhost'
            local_config['port'] = 3307
            configs.append(local_config)
        
        # 本地 MySQL 配置（開發環境）
        local_dev_config = self.get_connection_config()
        local_dev_config['host'] = 'localhost'
        local_dev_config['port'] = 3306
        local_dev_config['password'] = ''
        configs.append(local_dev_config)
        
        return configs

class ServerConfig:
    """服務器配置類"""
    
    def __init__(self):
        self.port = int(os.getenv('BACKEND_PORT', '8888'))
        self.host = os.getenv('BACKEND_HOST', '0.0.0.0')
        self.debug = os.getenv('DEBUG', 'False').lower() == 'true'
        self.log_level = os.getenv('LOG_LEVEL', 'INFO')
        
        # CORS 配置
        self.cors_origins = os.getenv('CORS_ORIGINS', '*').split(',')
        self.cors_credentials = os.getenv('CORS_CREDENTIALS', 'True').lower() == 'true'
        
        # 文件上傳配置
        self.upload_dir = os.getenv('UPLOAD_DIR', './uploads')
        self.max_file_size = int(os.getenv('MAX_FILE_SIZE', '100')) * 1024 * 1024  # MB to bytes
        
        # 模型配置
        self.model_dir = os.getenv('MODEL_DIR', './models')
        self.temp_dir = os.getenv('TEMP_DIR', './temp')

class SecurityConfig:
    """安全配置類"""
    
    def __init__(self):
        # JWT 配置
        self.secret_key = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
        self.algorithm = os.getenv('JWT_ALGORITHM', 'HS256')
        self.access_token_expire_minutes = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '30'))
        
        # 密碼加密
        self.password_salt_rounds = int(os.getenv('PASSWORD_SALT_ROUNDS', '12'))

class Config:
    """主配置類"""
    
    def __init__(self):
        self.database = DatabaseConfig()
        self.server = ServerConfig()
        self.security = SecurityConfig()
    
    def validate(self) -> bool:
        """驗證配置是否有效"""
        try:
            # 檢查必要的環境變數
            required_vars = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE']
            missing_vars = [var for var in required_vars if not os.getenv(var)]
            
            if missing_vars:
                print(f"警告: 缺少必要的環境變數: {', '.join(missing_vars)}")
                print("提示: 請檢查 .env 文件或環境變數設置")
                return False
            
            return True
        except Exception as e:
            print(f"錯誤: 配置驗證失敗: {e}")
            return False

# 創建全局配置實例
config = Config()

# 驗證配置
if not config.validate():
    print("警告: 配置驗證失敗，使用預設配置")
