"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ApiService } from "@/lib/api";

// 除錯用的 JSON 顯示元件
const DebugResponse: React.FC<{ data: any; title: string }> = ({ data, title }) => {
  const [collapsed, setCollapsed] = useState(true);
  if (!data) return null;

  return (
    <details className="mt-2 text-xs font-mono bg-gray-900 text-gray-100 p-3 rounded">
      <summary
        className="cursor-pointer select-none font-bold text-green-400"
        onClick={() => setCollapsed(!collapsed)}
      >
        {title} (點擊展開/收合)
      </summary>
      <pre className="mt-2 overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
};

export default function TrainingPage() {
  const params = useParams();
  const project_id = params.id as string;
  const numId = Number(project_id);

  // === 狀態 ===
  const [isCreatingDs, setIsCreatingDs] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  const [createDsProgress, setCreateDsProgress] = useState(0);
  const [trainProgress, setTrainProgress] = useState(0);

  // 儲存後端完整回傳（除錯用）
  const [lastCreateDsResp, setLastCreateDsResp] = useState<any>(null);
  const [lastAutoAnnotResp, setLastAutoAnnotResp] = useState<any>(null);
  const [lastTrainStartResp, setLastTrainStartResp] = useState<any>(null);
  const [lastTrainProgressResp, setLastTrainProgressResp] = useState<any>(null);

  // interval refs
  const createDsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const trainIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // === 清除函數 ===
  const clearAllPolling = () => {
    if (createDsIntervalRef.current) clearInterval(createDsIntervalRef.current);
    if (trainIntervalRef.current) clearInterval(trainIntervalRef.current);
    createDsIntervalRef.current = null;
    trainIntervalRef.current = null;
  };

  // === 1. 建立資料集（真正輪詢 auto annotation 進度）===
  const handleCreateDs = async () => {
    if (isCreatingDs) return;
    setIsCreatingDs(true);
    setCreateDsProgress(0);
    clearAllPolling();

    try {
      // 步驟 1：啟動後端背景任務
      const startResp = await ApiService.createDataset(numId);
      setLastCreateDsResp(startResp);
      console.log("create_dataset 啟動回傳:", startResp);

      // 步驟 2：真正輪詢自動標註進度（這才是真實進度！）
      let pollCount = 0;
      createDsIntervalRef.current = setInterval(async () => {
        try {
          pollCount++;
          const progResp = await ApiService.getAutoAnnotationProgress(project_id);
          setLastAutoAnnotResp(progResp);

          const prog = progResp.progress ?? 0;
          setCreateDsProgress(Math.min(prog, 100));

          // 成功條件
          if (prog >= 100 || progResp.success === false) {
            clearAllPolling();
            setIsCreatingDs(false);
            if (prog >= 100) {
              alert("資料集建立完成！");
            }
            return;
          }

          // 超過 30 分鐘自動放棄
          if (pollCount > 1800) {
            clearAllPolling();
            setIsCreatingDs(false);
            alert("資料集建立逾時，請至後台檢查日誌");
          }
        } catch (err: any) {
          console.error("輪詢 auto annotation 失敗", err);
          setLastAutoAnnotResp({ error: err.message });
        }
      }, 2000); // 每 2 秒問一次
    } catch (err: any) {
      console.error("create_dataset 啟動失敗", err);
      setLastCreateDsResp({ error: err.message });
      alert(err.message || "無法啟動資料集建立");
      setIsCreatingDs(false);
    }
  };

  // === 2. 開始訓練（真正輪詢 training progress）===
  const handleTraining = async () => {
    if (isTraining) return;
    setIsTraining(true);
    setTrainProgress(0);
    clearAllPolling();

    try {
      const startResp = await ApiService.startTraining(project_id);
      setLastTrainStartResp(startResp);
      console.log("train 啟動回傳:", startResp);

      let pollCount = 0;
      const maxPolls = 7200; // 最多 2 小時

      trainIntervalRef.current = setInterval(async () => {
        try {
          pollCount++;
          const progResp = await ApiService.getTrainingProgress(project_id);
          setLastTrainProgressResp(progResp);

          setTrainProgress(progResp.progress ?? 0);

          if (
            progResp.progress >= 100 ||
            progResp.is_completed ||
            progResp.status === "Training completed"
          ) {
            clearAllPolling();
            setIsTraining(false);
            setTrainProgress(100);
            alert("模型訓練完成！");
            return;
          }

          if (pollCount > maxPolls) {
            clearAllPolling();
            setIsTraining(false);
            alert("訓練逾時，請手動檢查狀態");
          }
        } catch (err: any) {
          console.error("訓練進度輪詢錯誤", err);
          setLastTrainProgressResp({ error: err.message });
        }
      }, 3000); // 每 3 秒問一次
    } catch (err: any) {
      console.error("訓練啟動失敗", err);
      setLastTrainStartResp({ error: err.message });
      alert(err.message || "無法開始訓練");
      setIsTraining(false);
    }
  };

  // === 元件卸載時清除 ===
  useEffect(() => {
    return () => clearAllPolling();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Training Page (除錯模式)</h1>
      <p className="mb-4">Project ID: <code className="bg-gray-200 px-2">{project_id}</code></p>

      {/* 建立資料集區塊 */}
      <section className="mb-8 p-5 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-3">1. Create Dataset</h2>
        <button
          onClick={handleCreateDs}
          disabled={isCreatingDs}
          className={`px-6 py-3 rounded font-medium ${
            isCreatingDs
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {isCreatingDs ? "建立資料集中..." : "Create Dataset"}
        </button>

        <progress value={createDsProgress} max="100" className="w-full h-6 mt-3" />
        <div className="text-sm mt-1">{createDsProgress.toFixed(1)}%</div>

        <DebugResponse data={lastCreateDsResp} title="API: /create_dataset 啟動回傳" />
        <DebugResponse data={lastAutoAnnotResp} title="API: /get_auto_annotation_progress 即時進度" />
      </section>

      {/* 訓練模型區塊 */}
      <section className="mb-8 p-5 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-3">2. Train Model</h2>
        <button
          onClick={handleTraining}
          disabled={isTraining}
          className={`px-6 py-3 rounded font-medium ${
            isTraining
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {isTraining ? "訓練進行中..." : "Start Training"}
        </button>

        <progress value={trainProgress} max="100" className="w-full h-6 mt-3" />
        <div className="text-sm mt-1">{trainProgress.toFixed(1)}%</div>

        <DebugResponse data={lastTrainStartResp} title="API: /train 啟動回傳" />
        <DebugResponse data={lastTrainProgressResp} title="API: /get_training_progress 即時回傳" />
      </section>

      {/* 返回按鈕 */}
      <div className="mt-8">
        <Link
          href={`/project/${project_id}/upload`}
          className="text-blue-600 hover:underline font-medium"
        >
          ← Back to Upload
        </Link>
      </div>

      {/* 強制清除按鈕（除錯用） */}
      <div className="mt-10 text-right">
        <button
          onClick={clearAllPolling}
          className="text-red-600 underline text-sm"
        >
          [除錯] 強制停止所有輪詢
        </button>
      </div>
    </div>
  );
}