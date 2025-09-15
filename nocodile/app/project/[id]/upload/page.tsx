import React from "react";

const page = () => {
  localStorage.setItem("currentStep", "upload");
  return (
    <>
      <div>Upload ur vids here</div>
      <div>Tags here</div>
    </>
  );
};

export default page;
