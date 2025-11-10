"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
<<<<<<< HEAD
import { ApiService } from "@/lib/api"
=======
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
        {title} (Click to expand/collapse)
      </summary>
      <pre className="mt-2 overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
};
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f

export default function TrainingPage() {
  const params = useParams();
  const project_id = params.id as string;
<<<<<<< HEAD

  const [createDsProgress, setCreateDsProgress] = useState(0);
  const [trainProgress, setTrainProgress] = useState(0);
  const [isCreatingDs, setIsCreatingDs] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  // useRef 儲存 interval ID
  const createDsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const trainIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 清除函數
  const clearCreateDsPolling = () => {
    if (createDsIntervalRef.current) {
      clearInterval(createDsIntervalRef.current);
      createDsIntervalRef.current = null;
    }
  };

  const clearTrainPolling = () => {
    if (trainIntervalRef.current) {
      clearInterval(trainIntervalRef.current);
      trainIntervalRef.current = null;
    }
  };

  // 建立資料集
  const handleCreateDs = async () => {
    if (isCreatingDs) return; // 防止重複點擊

    setIsCreatingDs(true);
    setCreateDsProgress(0);

    try {

      await ApiService.createDataset(project_id);

      const res = await fetch("/create_dataset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id }),
      });

      if (!res.ok) throw new Error("建立資料集失敗");

      // 開始輪詢進度
      createDsIntervalRef.current = setInterval(async () => {
        try {
        const data = await ApiService.getAutoAnnotationProgress(project_id);
        setCreateDsProgress(data.progress || 0);

          // 進度完成 → 停止輪詢
          if (data.progress >= 100) {
            clearCreateDsPolling();
            setIsCreatingDs(false);
          }
        } catch (err) {
          console.error("輪詢錯誤:", err);
          // 可選：顯示錯誤訊息
        }
      }, 1000);
    } catch (err) {
      console.error("建立資料集失敗:", err);
      alert("無法建立資料集");
=======
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
      console.log("create_dataset Start Backhaul:", startResp);

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
              alert("The dataset is complete!");
            }
            return;
          }

          // 超過 30 分鐘自動放棄
          if (pollCount > 1800) {
            clearAllPolling();
            setIsCreatingDs(false);
            alert("Data set creation timed out. Please check the logs in the backend.");
          }
        } catch (err: any) {
          console.error("Polling auto annotation failed", err);
          setLastAutoAnnotResp({ error: err.message });
        }
      }, 2000); // 每 2 秒問一次
    } catch (err: any) {
      console.error("create_dataset Start Backhaul failed", err);
      setLastCreateDsResp({ error: err.message });
      alert(err.message || "Unable to start data set creation");
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
      setIsCreatingDs(false);
    }
  };

<<<<<<< HEAD
  // 訓練模型
  const handleTraining = async () => {
    if (isTraining) return;

    setIsTraining(true);
    setTrainProgress(0);

    try {

      await ApiService.startTraining(project_id);
      trainIntervalRef.current = setInterval(async () => {
        try {
        const data = await ApiService.getTrainingProgress(project_id);
        setTrainProgress(data.progress || 0);

        if (data.progress >= 100) {
          clearTrainPolling();
          setIsTraining(false);
        }
      }catch (err) {
          console.error("訓練輪詢錯誤:", err);
        }
      }, 1000);
    } catch (err) {
      console.error("訓練啟動失敗:", err);
      alert("無法開始訓練");
=======
  // === 2. 開始訓練（真正輪詢 training progress）===
  const handleTraining = async () => {
    if (isTraining) return;
    setIsTraining(true);
    setTrainProgress(0);
    clearAllPolling();

    try {
      const startResp = await ApiService.startTraining(project_id);
      setLastTrainStartResp(startResp);
      console.log("train Start Backhaul:", startResp);

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
            alert("The model training is complete!");
            return;
          }

          if (pollCount > maxPolls) {
            clearAllPolling();
            setIsTraining(false);
            alert("Training timed out. Please check the status manually.");
          }
        } catch (err: any) {
          console.error("Polling training progress failed", err);
          setLastTrainProgressResp({ error: err.message });
        }
      }, 3000); // 每 3 秒問一次
    } catch (err: any) {
      console.error("train Start Backhaul failed", err);
      setLastTrainStartResp({ error: err.message });
      alert(err.message || "Unable to start training");
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
      setIsTraining(false);
    }
  };

<<<<<<< HEAD
  // 元件卸載時清除所有 interval
  useEffect(() => {
    return () => {
      clearCreateDsPolling();
      clearTrainPolling();
    };
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Training Page</h1>
      <p>Project ID: {project_id}</p>

      <button
        onClick={handleCreateDs}
        disabled={isCreatingDs}
        className="btn-primary"
      >
        {isCreatingDs ? "建立中..." : "Create a dataset"}
      </button>
      <progress value={createDsProgress} max="100" className="w-full mt-4" />

      <button
        onClick={handleTraining}
        disabled={isTraining}
        className="btn-primary"
      >
        {isTraining ? "訓練中..." : "Train model"}
      </button>
      <progress value={trainProgress} max="100" className="w-full mt-4" />

      <div className="mt-4">
        <Link
          href={`/project/${project_id}/upload`}
          className="text-blue-600 hover:underline"
=======
  // === 元件卸載時清除 ===
  useEffect(() => {
    return () => clearAllPolling();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Training Page (Debug Mode)</h1>
      <p className="mb-4">Project ID: <code className="bg-gray-200 px-2">{project_id}</code></p>

      {/* Create Dataset Section */}
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
          {isCreatingDs ? "Establish data collection..." : "Create Dataset"}
        </button>

        <progress value={createDsProgress} max="100" className="w-full h-6 mt-3" />
        <div className="text-sm mt-1">{createDsProgress.toFixed(1)}%</div>

        <DebugResponse data={lastCreateDsResp} title="API: /create_dataset Start Backhaul" />
        <DebugResponse data={lastAutoAnnotResp} title="API: /get_auto_annotation_progress Real-time Progress" />
      </section>

      {/* Training model block */}
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
          {isTraining ? "Training in progress..." : "Start Training"}
        </button>

        <progress value={trainProgress} max="100" className="w-full h-6 mt-3" />
        <div className="text-sm mt-1">{trainProgress.toFixed(1)}%</div>

        <DebugResponse data={lastTrainStartResp} title="API: /train Start Backhaul" />
        <DebugResponse data={lastTrainProgressResp} title="API: /get_training_progress Real-time Progress" />
      </section>

      {/* Back button */}
      <div className="mt-8">
        <Link
          href={`/project/${project_id}/upload`}
          className="text-blue-600 hover:underline font-medium"
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
        >
          ← Back to Upload
        </Link>
      </div>
<<<<<<< HEAD
    </div>
  );
}
=======

      {/* Force Clear button (for debugging) */}
      <div className="mt-10 text-right">
        <button
          onClick={clearAllPolling}
          className="text-red-600 underline text-sm"
        >
          [Debug] Force stop all polling
        </button>
      </div>
    </div>
  );
}
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
