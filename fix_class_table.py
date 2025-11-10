#!/usr/bin/env python3
"""
快速修复脚本：为 class 表添加 class_num 字段
"""

import pymysql

# 数据库配置
config = {
    'host': 'localhost',
    'user': 'root',
    'password': '12345678',
    'database': 'Nocodile',
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

