"use client";

import React from "react";
import Link from "next/link";
import { 
  FolderOpen, 
  Image, 
  BarChart3, 
  Settings,
  ArrowRight,
  Play,
  Upload
} from "lucide-react";

const style = {
  backgroundColor: "white",
  borderTop: "1px solid #eaeaea",
};
const Home = () => {
  let [isLoggedIn, setIsLoggedIn] = React.useState(false);
  let [email, setEmail] = React.useState("");
  let [password, setPassword] = React.useState("");

  const handleLogin = () => {
    console.warn("submit POST req", { email, password });
    setIsLoggedIn(true);
  };

  if (isLoggedIn) {
    return (
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Nocodile AI</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">歡迎回來, {email}</span>
                <button 
                  onClick={() => setIsLoggedIn(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  登出
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              選擇您要開始的工作
            </h2>
            <p className="text-lg text-gray-600">
              快速建立AI模型，從資料註解到模型訓練，一站式解決方案
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 專案管理 */}
            <Link href="/dashboard" className="group">
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200 hover:border-blue-300">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FolderOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">專案管理</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  建立和管理您的AI專案，每個專案都有唯一的專案ID
                </p>
                <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                  <span className="text-sm font-medium">開始管理專案</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* 資料註解 */}
            <Link href="/annotate" className="group">
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200 hover:border-green-300">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Image className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">資料註解</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  上傳圖片和影片，進行標註和註解，為AI訓練準備資料
                </p>
                <div className="flex items-center text-green-600 group-hover:text-green-700">
                  <span className="text-sm font-medium">開始註解資料</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* 模型訓練 */}
            <Link href="/workflow" className="group">
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200 hover:border-purple-300">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Play className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">模型訓練</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  使用您的註解資料訓練AI模型，自動化整個訓練流程
                </p>
                <div className="flex items-center text-purple-600 group-hover:text-purple-700">
                  <span className="text-sm font-medium">開始訓練模型</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* 資料分析 */}
            <Link href="/dashboard" className="group">
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200 hover:border-orange-300">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">資料分析</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  分析您的資料品質和模型效能，獲得詳細的統計報告
                </p>
                <div className="flex items-center text-orange-600 group-hover:text-orange-700">
                  <span className="text-sm font-medium">查看分析報告</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* 設定 */}
            <Link href="/dashboard" className="group">
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200 hover:border-gray-400">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Settings className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">系統設定</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  管理您的帳戶設定、API金鑰和系統偏好設定
                </p>
                <div className="flex items-center text-gray-600 group-hover:text-gray-700">
                  <span className="text-sm font-medium">進入設定</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* 快速上傳 */}
            <div className="group">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-blue-200">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-200 rounded-lg">
                    <Upload className="w-6 h-6 text-blue-700" />
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">快速上傳</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  拖放檔案快速上傳，支援批次處理多個檔案
                </p>
                <div className="flex items-center text-blue-700 group-hover:text-blue-800">
                  <span className="text-sm font-medium">拖放檔案到這裡</span>
                  <Upload className="w-4 h-4 ml-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="items-center flex flex-col min-w-screen">
      <div className="flex flex-col items-center py-2 w-fit bg-white p-16 m-12 border-t-4 border-blue-600 shadow-lg">
        <h1>Nocodile AI</h1>
        <small>Train your AI model in minutes!</small>
        <form className="flex flex-col items-cente justify-center py-2 gap-2">
          <div>
            <label>Email address:</label>
            <br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label>Password:</label>
            <br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600"
            onClick={handleLogin}
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
};

export default Home;
