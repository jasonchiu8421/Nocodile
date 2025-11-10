import os
import pymysql
import threading

# Database config (using env vars with .env defaults)
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
    print("数据库连接成功！")
except pymysql.Error as e:
    print(f"数据库连接失败: {e}")
    connection = None

_db_lock = threading.Lock()

def reconnect_database():
    """重新连接数据库（线程安全）"""
    global connection
    with _db_lock:
        try:
            if connection:
                try:
                    connection.close()
                except:
                    pass
            connection = pymysql.connect(**config)
            logger.info("数据库重新连接成功！")
            return True
        except pymysql.Error as e:
            logger.error(f"数据库重新连接失败: {e}")
            connection = None
            return False

def get_db_cursor(cursor_type=pymysql.cursors.DictCursor):
    """安全地获取数据库游标，确保连接有效（线程安全）"""
    global connection
    with _db_lock:
        # 在锁内检查连接（避免死锁，因为 is_db_connection_valid 也使用锁）
        if not connection:
            # logger.warning("数据库连接不存在，尝试重新连接...")
            if not reconnect_database():
                raise Exception("无法建立数据库连接")
        
        # 检查连接是否有效（使用 ping，不获取锁）
        try:
            connection.ping(reconnect=False)
        except (pymysql.err.InterfaceError, pymysql.err.OperationalError, AttributeError, OSError) as e:
            # logger.warning(f"连接检查失败，尝试重连: {e}")
            if not reconnect_database():
                raise Exception("无法重新连接数据库")
        
        try:
            return connection.cursor(cursor_type)
        except (pymysql.err.InterfaceError, pymysql.err.OperationalError, OSError) as e:
            # logger.warning(f"获取游标时连接错误，尝试重连: {e}")
            if reconnect_database():
                try:
                    return connection.cursor(cursor_type)
                except Exception as e2:
                    # logger.error(f"重连后仍无法获取游标: {e2}")
                    raise Exception(f"无法获取数据库游标: {e2}")
            else:
                raise Exception("无法重新连接数据库")
            
cursor = connection.cursor(pymysql.cursors.DictCursor)
query = "SELECT class_name, color FROM class WHERE project_id = %d"
cursor.execute(query, (2,))
rows = cursor.fetchall()
classes = {item["class_name"]: item["color"] for item in rows}
print(classes)