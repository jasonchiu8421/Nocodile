#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pymysql
from config import config

def check_project_videos(project_id):
    try:
        connection = pymysql.connect(**config.database.get_connection_config())
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        
        # 檢查項目17的視頻記錄
        cursor.execute('SELECT * FROM video WHERE project_id = %s', (project_id,))
        videos = cursor.fetchall()
        
        print(f'項目 {project_id} 的視頻記錄:')
        if videos:
            for video in videos:
                print(f'ID: {video["video_id"]}, 名稱: {video["video_name"]}, 路徑: {video["video_path"]}')
        else:
            print('沒有找到任何視頻記錄')
            
        cursor.close()
        connection.close()
        
    except Exception as e:
        print(f'錯誤: {e}')

if __name__ == "__main__":
    check_project_videos(17)
