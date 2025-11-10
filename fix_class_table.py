#!/usr/bin/env python3
"""
快速修复脚本：为 class 表添加 class_num 字段
"""

import os
import pymysql

# 数据库配置 (using env vars with .env defaults)
config = {
    'host': os.getenv('MYSQL_HOST', 'database'),
    'port': int(os.getenv('MYSQL_PORT', '3307')),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', 'rootpassword'),
    'database': os.getenv('MYSQL_DATABASE', 'Nocodiel'),
    'charset': 'utf8mb4'
}

try:
    connection = pymysql.connect(**config)
    cursor = connection.cursor()
    
    # 检查字段是否存在
    try:
        cursor.execute("SELECT class_num FROM class LIMIT 1")
        print("✅ class_num 字段已存在，无需添加")
    except Exception as e:
        # 字段不存在，添加它
        print("🔧 检测到 class 表缺少 class_num 字段，正在添加...")
        cursor.execute("ALTER TABLE class ADD COLUMN class_num INT DEFAULT NULL")
        connection.commit()
        print("✅ 已成功添加 class_num 字段到 class 表")
    
    cursor.close()
    connection.close()
    print("✅ 修复完成！")
    
except Exception as e:
    print(f"❌ 错误: {e}")

