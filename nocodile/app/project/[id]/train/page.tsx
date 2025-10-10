"use client";

import { useParams } from "next/dist/client/components/navigation";
import React, { useEffect, useState } from "react";

const TrainingPage = () => {
  const [isTraining, setIsTraining] = useState(false);

  const { id: projectId } = useParams();
  console.log("project id", projectId);

  if (!projectId) return <div>Invalid project ID</div>;

  const handleStart = /*async () => {
      fetch(`/api/train/`, {
      body: JSON.stringify({ projectID: projectId }), //???????????????
      method: "POST",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("server response:", data);
        // Optionally, update UI to reflect training status
      });
  };*/ () => {
    let res = { success: true }; //mock response
    if (res.success) {
      setIsTraining(true);
      // Simulate training duration
      setTimeout(() => {
        setIsTraining(false);
        alert("Training completed!");
      }, 5000); // Simulate a 5-second training process
    } else {
      alert("Failed to start training. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1>Train model</h1>
        <p>
          Are all your videos all annotated? <span>Yes/No</span>
        </p>
        <button
          onClick={() => {
            fetch("/create_dataset", {
              method: "POST",
              body: JSON.stringify({
                project_id: projectId,
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                console.log("Dataset creation response:", data);
                if (data.success) {
                  alert("Dataset created successfully!");
                } else {
                  alert(data.message);
                }
              });
          }}
        >
          Create a dataset here
        </button>
        <button
          className="btn-primary"
          onClick={handleStart}
          /*{isTraining ? disabled: null}*/
        >
          {isTraining ? "Training..." : "Start training"}
        </button>
      </div>
    </div>
  );
};

export default TrainingPage;
