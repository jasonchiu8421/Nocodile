"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const AnnotatePage = () => {
  const { url: url } = useParams();

  const [classes, setClasses] = useState<string[]>(["Owo", "duck", "birds"]);

  const removeClass = (index: number) => {
    setClasses((prevClasses) => {
      const updatedClasses = prevClasses.filter((_, i) => i !== index);
      localStorage.setItem("classes", JSON.stringify(updatedClasses));
      return updatedClasses;
    });
  };

  const addClass = (newTag: string) => {
    setClasses((prevClasses) => {
      const updatedClasses = [...prevClasses, newTag];
      localStorage.setItem("classes", JSON.stringify(updatedClasses));
      return updatedClasses;
    });
  };
  useEffect(() => {
    setClasses(
      localStorage.getItem("classes")
        ? JSON.parse(localStorage.getItem("classes")!)
        : []
    );
  }, []);

  return <div>AnnotatePage, view {url}</div>;
};

export default AnnotatePage;
