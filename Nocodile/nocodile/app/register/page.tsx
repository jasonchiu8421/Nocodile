"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { log } from "@/lib/logger";
import { apiRequest } from "@/lib/api-config";
import { Eye, EyeOff, User, Lock, CheckCircle } from "lucide-react";

const Register = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 檢查是否已登錄
  useEffect(() => {
    if (typeof window !== 'undefined' && window.cookieStore) {
      window.cookieStore.get("userId").then((val) => {
        if (val?.value) {
          router.push("/dashboard");
        }
      });
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除錯誤信息當用戶開始輸入
    if (errorMsg) {
      setErrorMsg("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 基本驗證
    if (!formData.username.trim()) {
      setErrorMsg("請輸入用戶名");
      return;
    }
    if (formData.username.length < 3) {
      setErrorMsg("用戶名至少需要3個字符");
      return;
    }
    if (!formData.password) {
      setErrorMsg("請輸入密碼");
      return;
    }
    if (formData.password.length < 6) {
      setErrorMsg("密碼至少需要6個字符");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("密碼確認不匹配");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg("");
    
    try {
      log.info('REGISTER', 'Registration attempt started', { username: formData.username });
      
      const response = await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password,
          confirm_password: formData.confirmPassword
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        log.info('REGISTER', 'Registration successful', { 
          userId: data.userID, 
          projectCount: data.projects?.length || 0 
        });
        
        // 設置用戶 ID 到 cookie
        if (typeof window !== 'undefined' && window.cookieStore) {
          await window.cookieStore.set("userId", String(data.userID));
          await window.cookieStore.set("username", formData.username.trim());
          
          // 存儲項目信息到 cookie（新用戶通常沒有項目）
          if (data.projects && data.projects.length > 0) {
            await window.cookieStore.set("userProjects", JSON.stringify(data.projects));
          }
        }
        
        // 重定向到儀表板
        router.push("/dashboard");
      } else {
        const errorMessage = data.message || "註冊失敗";
        setErrorMsg(errorMessage);
        log.warn('REGISTER', 'Registration failed', { message: errorMessage });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrorMsg("註冊失敗: " + errorMessage);
      log.error('REGISTER', 'Registration error', { error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Nocodile AI</h1>
          <p className="text-gray-600 mt-2">創建您的帳戶開始使用</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                用戶名
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="請輸入用戶名"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密碼
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="請輸入密碼"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                確認密碼
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="請再次輸入密碼"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{errorMsg}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  註冊中...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  創建帳戶
                </>
              )}
            </button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                已有帳戶？{' '}
                <Link
                  href="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  立即登錄
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
