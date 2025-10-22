"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function TrainingPage() {
  const params = useParams();
  const project_id = params.id as string;
  const [trainProgress, setTrainProgress] = useState(0); // 0, 0001-100

  //todo untested
  const handleCreateDs = async () => {
    fetch("/create_dataset", {
      method: "POST",
      body: JSON.stringify({ project_id }),
    });
  };
  const handleTraining = async () => {
    if (trainProgress == 0) {
      await fetch("/train", {
        method: "POST",
        body: JSON.stringify({ project_id }),
      });
      setTrainProgress(0.001);
    }
    //todo untested
    setInterval(() => {
      fetch("/get_training_progress", {
        method: "POST",
        body: JSON.stringify({ project_id }),
      })
        .then((res) => res.json())
        .then((data) => {
          setTrainProgress(data.progress);
        });
    }, 1000);
  };
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Training Page</h1>
      <p>Project ID: {project_id}</p>
      <button onClick={handleCreateDs} className="btn-primary">
        Create a dataset
      </button>
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
          href={`/project/${project_id}/upload`}
          className="text-blue-600 hover:underline"
        >
          ← Back to Upload
        </Link>
      </div>
    </div>
  );
}
