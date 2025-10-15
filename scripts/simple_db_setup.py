#!/usr/bin/env python3
"""
Simple Nocodile Database Setup Script
Creates database and tables using Python
"""

import os
import sys
import pymysql
from pathlib import Path

def create_database():
    """Create database and tables"""
    print("Starting Nocodile database setup...")
    
    # Database configurations to try
    configs = [
        {
            'host': 'localhost',
            'port': 3307,
            'user': 'root',
            'password': 'rootpassword',
            'database': 'object_detection',
            'charset': 'utf8mb4'
        },
        {
            'host': 'localhost',
            'port': 3306,
            'user': 'root',
            'password': 'rootpassword',
            'database': 'object_detection',
            'charset': 'utf8mb4'
        }
    ]
    
    connection = None
    
    # Try to connect
    for i, config in enumerate(configs, 1):
        try:
            print(f"Trying config {i}: {config['host']}:{config['port']}")
            connection = pymysql.connect(**config)
            print(f"Connected successfully with config {i}")
            break
        except Exception as e:
            print(f"Config {i} failed: {e}")
            continue
    
    if not connection:
        print("All connection attempts failed")
        return False
    
    try:
        cursor = connection.cursor()
        
        # Create database if not exists
        print("Creating database...")
        cursor.execute("CREATE DATABASE IF NOT EXISTS object_detection CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        cursor.execute("USE object_detection")
        
        # Create users table
        print("Creating users table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        # Create project table
        print("Creating project table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS project (
                project_id INT AUTO_INCREMENT PRIMARY KEY,
                project_name VARCHAR(100) NOT NULL,
                project_type VARCHAR(50) DEFAULT 'object_detection',
                project_owner_id INT NOT NULL,
                project_status VARCHAR(50) DEFAULT 'Not started',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_owner_id) REFERENCES users (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        # Create videos table
        print("Creating videos table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS videos (
                video_id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                video_name VARCHAR(255) NOT NULL,
                video_path VARCHAR(500) NOT NULL,
                annotation_status VARCHAR(50) DEFAULT 'yet to start',
                last_annotated_frame INT DEFAULT -1,
                upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES project (project_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        # Create images table
        print("Creating images table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS images (
                image_id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                image_name VARCHAR(255) NOT NULL,
                image_path VARCHAR(500) NOT NULL,
                upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES project (project_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        # Create project_shared_users table
        print("Creating project_shared_users table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS project_shared_users (
                share_id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                user_id INT NOT NULL,
                shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES project (project_id),
                FOREIGN KEY (user_id) REFERENCES users (user_id),
                UNIQUE(project_id, user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        # Create class table
        print("Creating class table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS class (
                class_id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                class_name VARCHAR(100) NOT NULL,
                color VARCHAR(7) DEFAULT '#3b82f6',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES project (project_id),
                UNIQUE(project_id, class_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        # Insert sample data
        print("Inserting sample data...")
        
        # Sample user
        cursor.execute("""
            INSERT IGNORE INTO users (user_id, username, password_hash, email) 
            VALUES (1, 'testuser', 'hashed_password_123', 'test@example.com')
        """)
        
        # Sample projects
        cursor.execute("""
            INSERT IGNORE INTO project (project_id, project_name, project_type, project_owner_id, project_status) 
            VALUES 
            (1, 'Object Detection Project', 'object_detection', 1, 'In Progress'),
            (2, 'Image Classification', 'classification', 1, 'Not started'),
            (3, 'Video Analysis', 'object_detection', 1, 'Completed')
        """)
        
        # Sample videos
        cursor.execute("""
            INSERT IGNORE INTO videos (project_id, video_name, video_path) 
            VALUES 
            (1, 'sample_video1.mp4', '/videos/project1/sample_video1.mp4'),
            (1, 'sample_video2.mp4', '/videos/project1/sample_video2.mp4'),
            (3, 'analysis_video.mp4', '/videos/project3/analysis_video.mp4')
        """)
        
        # Sample images
        cursor.execute("""
            INSERT IGNORE INTO images (project_id, image_name, image_path) 
            VALUES 
            (1, 'sample_image1.jpg', '/images/project1/sample_image1.jpg'),
            (1, 'sample_image2.jpg', '/images/project1/sample_image2.jpg'),
            (2, 'class_image1.jpg', '/images/project2/class_image1.jpg')
        """)
        
        connection.commit()
        print("Database setup completed successfully!")
        
        # Show created tables
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"Created {len(tables)} tables:")
        for table in tables:
            print(f"  - {table[0]}")
        
        cursor.close()
        return True
        
    except Exception as e:
        print(f"Error during database setup: {e}")
        return False
    finally:
        if connection:
            connection.close()

def main():
    """Main function"""
    print("Nocodile Database Setup Tool")
    print("=" * 40)
    
    success = create_database()
    
    if success:
        print("\nDatabase setup completed successfully!")
        print("You can now start the Nocodile application.")
    else:
        print("\nDatabase setup failed!")
        print("Please check the error messages and try again.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
