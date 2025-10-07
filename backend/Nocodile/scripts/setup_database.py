#!/usr/bin/env python3
"""
Nocodile 資料庫設置腳本
使用 Python 代碼生成和初始化資料庫
"""

import os
import sys
import subprocess
from pathlib import Path

def run_database_script():
    """運行資料庫生成腳本"""
    print("🚀 開始設置 Nocodile 資料庫...")
    print("=" * 50)
    
    # 獲取腳本路徑
    script_path = Path(__file__).parent.parent / "Backend" / "Nocodile" / "database" / "create_object_detection_db.py"
    
    if not script_path.exists():
        print(f"❌ 找不到資料庫腳本: {script_path}")
        return False
    
    print(f"📁 腳本路徑: {script_path}")
    
    try:
        # 運行 Python 腳本
        result = subprocess.run([sys.executable, str(script_path)], 
                              capture_output=True, text=True, cwd=script_path.parent)
        
        print("📋 腳本輸出:")
        print(result.stdout)
        
        if result.stderr:
            print("⚠️ 錯誤信息:")
            print(result.stderr)
        
        if result.returncode == 0:
            print("✅ 資料庫設置成功！")
            return True
        else:
            print(f"❌ 資料庫設置失敗 (退出碼: {result.returncode})")
            return False
            
    except Exception as e:
        print(f"❌ 執行腳本時出錯: {e}")
        return False

def check_docker_status():
    """檢查 Docker 狀態"""
    print("🐳 檢查 Docker 狀態...")
    
    try:
        # 檢查 MySQL 容器是否運行
        result = subprocess.run(
            ["docker", "ps", "--filter", "name=mysql", "--format", "{{.Names}}"],
            capture_output=True, text=True
        )
        
        if result.returncode == 0 and result.stdout.strip():
            print("✅ MySQL 容器正在運行")
            return True
        else:
            print("❌ MySQL 容器未運行")
            print("💡 請先運行: docker-compose up -d mysql")
            return False
            
    except Exception as e:
        print(f"❌ 檢查 Docker 狀態時出錯: {e}")
        return False

def main():
    """主函數"""
    print("🗄️ Nocodile 資料庫設置工具")
    print("=" * 60)
    
    # 檢查 Docker 狀態
    if not check_docker_status():
        print("\n💡 請先啟動 MySQL 容器:")
        print("   docker-compose up -d mysql")
        return False
    
    # 運行資料庫腳本
    success = run_database_script()
    
    if success:
        print("\n🎉 資料庫設置完成！")
        print("💡 現在可以啟動完整的應用程式:")
        print("   docker-compose up -d")
    else:
        print("\n❌ 資料庫設置失敗")
        print("💡 請檢查錯誤信息並重試")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
