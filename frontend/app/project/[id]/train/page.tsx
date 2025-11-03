"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ApiService } from "@/lib/api"

export default function TrainingPage() {
  const params = useParams();
  const project_id = params.id as string;

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
      setIsCreatingDs(false);
    }
  };

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
      setIsTraining(false);
    }
  };

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
        >
          ← Back to Upload
        </Link>
      </div>
    </div>
  );
}