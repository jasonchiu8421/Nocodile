"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const page = () => {
  const [classes, setClasses] = useState<string[]>(() => {
    const savedClasses = localStorage.getItem("classes");
    return savedClasses
      ? JSON.parse(savedClasses)
      : ["Owo", "duck", "birds", "hand", "person", "cat", "dog", "car", "tree"];
  });

  const [files, setFiles] = useState<File[]>(() => {
    const savedFiles = localStorage.getItem("files");
    return savedFiles ? JSON.parse(savedFiles) : [];
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles = selectedFiles.filter((file) =>
      ["video/mp4", "video/mov", "video/x-matroska"].includes(file.type)
    );
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles, ...validFiles];
      localStorage.setItem("files", JSON.stringify(updatedFiles));
      return updatedFiles;
    });
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    const validFiles = droppedFiles.filter((file) =>
      ["video/mp4", "video/mov", "video/x-matroska"].includes(file.type)
    );
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles, ...validFiles];
      localStorage.setItem("files", JSON.stringify(updatedFiles));
      return updatedFiles;
    });
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  useEffect(() => {
    //setValue(localStorage.getItem("myKey"));
  }, []);

  const saveValue = () => {
    localStorage.setItem("myKey", "Hello World!");
    //setValue("Hello World!");
  };

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

  return (
    <div className="flex flex-col gap-4">
      <div
        id="classes"
        className="flex flex-col border p-2 rounded-md border-gray-300 gap-4"
      >
        <h2>Add videos</h2>
        <hr />
        <div
          id="upload"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            border: "2px dashed #ccc",
            padding: "20px",
            flexDirection: "column",
            display: "flex",
            alignItems: "center",
            borderRadius: "8px",
          }}
        >
          {files.length === 0 ? (
            <p>Drag and drop videos here</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {files.map((file, index) => (
                <div
                  key={index}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    padding: "10px",
                    width: "150px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: "12px", wordBreak: "break-word" }}>
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => document.getElementById("fileInput")?.click()}
            style={{
              padding: ".5em",
              backgroundColor: "#007BFF",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              bottom: "10px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            {files.length === 0 ? "Add Video" : "Add More"}
          </button>
          <input
            id="fileInput"
            type="file"
            multiple
            accept=".mp4,.mov,.mkv"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
        </div>
      </div>
      <div
        id="classes"
        className="flex flex-col border p-2 rounded-md border-gray-300 gap-4"
      >
        <h2>Tags</h2>
        <hr />
        <div className="flex flex-row gap-2 overflow-x-auto">
          {classes.map((cls, index) => (
            <div key={index} className="border border-gray-300 p-2 min-w-16">
              <div style={{ display: "inline" }}>{cls}</div>
              <button
                style={{ display: "inline", cursor: "pointer" }}
                onClick={() => removeClass(index)}
              >
                <X />
              </button>
            </div>
          ))}
        </div>
        <div>
          <input
            type="text"
            placeholder="Add new tag"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const newTag = (e.target as HTMLInputElement).value
                  .trim()
                  .toLowerCase();
                if (newTag && !classes.includes(newTag)) {
                  addClass(newTag);
                  (e.target as HTMLInputElement).value = "";
                } else if (classes.includes(newTag)) {
                  alert("Tag already exists!");
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default page;
