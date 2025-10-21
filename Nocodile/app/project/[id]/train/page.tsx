"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function TrainingPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [trainProgress, setTrainProgress] = useState(0); // 0 not start, 1-99 in progress, 100 done

  const handleTraining = async () => {
    if (trainProgress == 0) {
      setTrainProgress(0.001);
    }
    console.log(":3");
    setInterval(() => {
      setTrainProgress((prev) => {
        if (prev < 100) {
          return prev + 10;
        } else {
          return prev;
        }
      });
    }, 1000);
  };
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Training Page</h1>
      <p>Project ID: {projectId}</p>
      <button
        onClick={handleTraining}
        className="btn-primary"
        disabled={trainProgress > 0}
      >
        Train model
      </button>
      <progress value={trainProgress} max="100" className="w-full mt-4" />

      <div className="mt-4">
        <Link
          href={`/project/${projectId}/upload`}
          className="text-blue-600 hover:underline"
        >
          ← Back to Upload
        </Link>
      </div>
    </div>
  );
}
