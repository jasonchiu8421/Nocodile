#!/usr/bin/env python3
"""
簡單的資料庫連接測試腳本
"""

import os
import sys
import pymysql

def test_connection():
    """測試資料庫連接"""
    print("🔍 測試資料庫連接...")
    
    # 從環境變數或使用預設值
    configs = [
        {
            'host': os.getenv('MYSQL_HOST', 'localhost'),
            'port': int(os.getenv('MYSQL_PORT', '3306')),
            'user': os.getenv('MYSQL_USER', 'root'),
            'password': os.getenv('MYSQL_PASSWORD', '12345678'),
            'database': os.getenv('MYSQL_DATABASE', 'Nocodile'),
            'charset': 'utf8mb4'
        },
        {
            'host': 'localhost',
            'port': 3307,
            'user': 'root',
            'password': '12345678',
            'database': 'Nocodile',
            'charset': 'utf8mb4'
        }
    ]
    
    for i, config in enumerate(configs, 1):
        try:
            print(f"嘗試配置 {i}: {config['host']}:{config['port']}")
            connection = pymysql.connect(**config)
            print(f"✅ 連接成功！")
            
            cursor = connection.cursor()
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()[0]
            print(f"📊 MySQL 版本: {version}")
            
            cursor.execute("SHOW DATABASES")
            databases = cursor.fetchall()
            print(f"📋 可用資料庫: {[db[0] for db in databases]}")
            
            cursor.close()
            connection.close()
            return True
            
        except Exception as e:
            print(f"❌ 配置 {i} 失敗: {e}")
            continue
    
    print("🚫 所有連接都失敗")
    return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
