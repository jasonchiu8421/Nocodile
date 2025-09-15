"use client";

import React from "react";
import { useState, useEffect } from "react";

const page = () => {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(localStorage.getItem("myKey"));
  }, []);

  const saveValue = () => {
    localStorage.setItem("myKey", "Hello World!");
    setValue("Hello World!");
  };

  return (
    <>
      <div>Upload ur vids here</div>
      <div>Tags here</div>
    </>
  );
};

export default page;
