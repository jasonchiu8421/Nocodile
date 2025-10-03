import React from "react";

const TrainingPage = () => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1>Train model</h1>
        <p>
          Are all your videos all annotated? <span>Yes/No</span>
        </p>
        <button className="btn-primary">Start training</button>
      </div>
    </div>
  );
};

export default TrainingPage;
