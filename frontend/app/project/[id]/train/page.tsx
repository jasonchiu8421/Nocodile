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

const handleCreateDs = async () => {
  if (isCreatingDs) return;

  setIsCreatingDs(true);
  setCreateDsProgress(0);

  try {
    // 1. 啟動建立資料集（後台任務）
    await ApiService.createDataset(Number(project_id));

    // 2. 顯示進度動畫，然後停止（因為是後台任務，無法實時追蹤進度）
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      if (progress <= 90) {
        setCreateDsProgress(progress);
      } else {
        clearInterval(progressInterval);
      }
    }, 500);

    // 3. 等待一段時間後，檢查項目狀態或直接完成
    setTimeout(() => {
      clearInterval(progressInterval);
      setCreateDsProgress(100);
      setTimeout(() => {
        setIsCreatingDs(false);
        setCreateDsProgress(0);
        alert("資料集創建任務已啟動！請稍後檢查項目狀態。");
      }, 1000);
    }, 5000); // 5秒後完成進度顯示

  } catch (err: any) {
    console.error("建立資料集失敗:", err);
    alert(err.message || "無法建立資料集");
    setIsCreatingDs(false);
    setCreateDsProgress(0);
  }
};

  // 訓練模型
  const handleTraining = async () => {
    if (isTraining) return;

    setIsTraining(true);
    setTrainProgress(0);

    try {
      await ApiService.startTraining(project_id);
      
      let pollCount = 0;
      const maxPolls = 3600; // 最多輪詢1小時（3600秒）
      
      trainIntervalRef.current = setInterval(async () => {
        try {
          pollCount++;
          
          // 超時保護：如果輪詢超過1小時，停止輪詢
          if (pollCount > maxPolls) {
            clearTrainPolling();
            setIsTraining(false);
            alert("訓練時間過長，請手動檢查訓練狀態。");
            return;
          }
          
          const data = await ApiService.getTrainingProgress(project_id);
          setTrainProgress(data.progress || 0);
          
          // 檢查是否完成：進度達到100% 或 is_completed 為 true
          if (data.progress >= 100 || data.is_completed) {
            clearTrainPolling();
            setIsTraining(false);
            alert("訓練完成！");
          } else if (data.status && 
                     data.status !== "Training in progress" && 
                     data.status !== "Training completed" &&
                     data.status !== "Data is ready") {
            // 如果狀態不是訓練相關的狀態，也停止輪詢
            clearTrainPolling();
            setIsTraining(false);
            console.log("訓練狀態異常，停止輪詢:", data.status);
          }
        } catch (err) {
          console.error("訓練輪詢錯誤:", err);
          // 如果連續錯誤多次，停止輪詢
          if (pollCount > 10) {
            clearTrainPolling();
            setIsTraining(false);
            alert("無法獲取訓練進度，請手動檢查。");
          }
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