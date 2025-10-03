"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoggedIn(cookieStore.get("userId") !== undefined);
    if (!isLoggedIn) {
      router.push("/login");
    } else {
      router.push("/dashboard");
    }
  }, []);
  return (
    <div>
      <p>if not logged in, direct to /login else show dashboard</p>
      <Link href="/login">Login</Link>
    </div>
  );
  return (
    <div className="font-sans min-w-screen min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Nocodile AI</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard"
          className="flex p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold">Dashboard</div>
            <div className="text-sm opacity-90">專案管理</div>
          </div>
        </Link>

        <Link
          href="/annotate"
          className="flex p-6 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🏷️</div>
            <div className="font-semibold">Annotate</div>
            <div className="text-sm opacity-90">資料註解</div>
          </div>
        </Link>

        <Link
          href="/deploy"
          className="flex p-6 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-lg"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🚀</div>
            <div className="font-semibold">Deploy</div>
            <div className="text-sm opacity-90">部署模型</div>
          </div>
        </Link>

        <Link
          href="/blocks"
          className="flex p-6 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors shadow-lg"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🧱</div>
            <div className="font-semibold">Blocks</div>
            <div className="text-sm opacity-90">區塊介面</div>
          </div>
        </Link>

        <Link
          href="/workflow"
          className="flex p-6 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">⚡</div>
            <div className="font-semibold">Workflow</div>
            <div className="text-sm opacity-90">工作流程</div>
          </div>
        </Link>

        <Link
          href="/home"
          className="flex p-6 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors shadow-lg"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🏠</div>
            <div className="font-semibold">Home</div>
            <div className="text-sm opacity-90">主頁面</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
