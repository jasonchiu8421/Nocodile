# API Integration Guide

## 概述
這個文件說明了如何將前端儀表板連接到後端 API。

## 已完成的集成

### 1. API 服務 (`lib/api.ts`)
- 創建了 `ApiService` 類來處理所有後端 API 調用
- 包含以下功能：
  - `getProjectsInfo()` - 獲取用戶的所有項目
  - `getProjectDetails()` - 獲取特定項目的詳細信息
  - `createProject()` - 創建新項目
  - `changeProjectName()` - 更改項目名稱

### 2. 儀表板頁面 (`app/dashboard/page.tsx`)
- 更新為使用異步 API 調用
- 從 cookie 中獲取用戶 ID
- 動態加載項目列表

### 3. 項目信息服務 (`app/dashboard/get_project_info.ts`)
- 重構為使用真實的 API 調用
- 移除了硬編碼的測試數據

### 4. 新建項目表單 (`app/dashboard/NewProjectForm.tsx`)
- 更新為使用真實的 API 調用
- 添加了項目類型選擇
- 移除了項目 ID 生成（由後端處理）

## 後端 API 端點

### 已連接的端點：
- `POST /get_projects_info` - 獲取用戶項目列表
- `POST /get_project_details` - 獲取項目詳細信息
- `POST /create_project` - 創建新項目
- `POST /change_project_name` - 更改項目名稱

## 設置說明

### 1. 啟動後端服務器
```bash
cd backend/Nocodile/Backend/Nocodile/backend
python server.py
```
服務器將在 `http://localhost:8889` 運行

### 2. 啟動前端開發服務器
```bash
cd backend/Nocodile/Frontend/Nocodile/nocodile
npm run dev
```
前端將在 `http://localhost:3000` 運行

### 3. 測試 API 連接
打開 `test-api.html` 文件在瀏覽器中測試 API 連接

## 數據庫設置

確保 MySQL 數據庫正在運行，並且：
1. 數據庫名稱：`object_detection`
2. 用戶名：`root`
3. 密碼：`12345678`

如果數據庫未運行，前端仍會加載，但會顯示空項目列表。

## 功能特性

### 儀表板功能：
- ✅ 顯示用戶的所有項目
- ✅ 顯示項目統計信息（視頻數量、狀態）
- ✅ 創建新項目
- ✅ 項目卡片點擊導航

### 新建項目功能：
- ✅ 項目名稱輸入
- ✅ 項目類型選擇（對象檢測、分類、分割）
- ✅ 項目描述（可選）
- ✅ 實時 API 調用

## 錯誤處理

- API 調用失敗時會顯示控制台錯誤
- 數據庫連接失敗時前端仍可正常運行
- 項目創建失敗時會顯示用戶友好的錯誤消息

## 下一步

1. 添加項目編輯功能
2. 添加項目刪除功能
3. 添加項目共享功能
4. 改進錯誤處理和用戶反饋
5. 添加加載狀態指示器
