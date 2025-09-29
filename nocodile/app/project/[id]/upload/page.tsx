"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const UploadPage = () => {
  const { id: project_id } = useParams();

  // default placeholders befoer localstorage is loaded
  const [classes, setClasses] = useState<string[]>(["Owo", "duck", "birds"]);
  const [pendingVideos, setPendingVideos] = useState<File[]>([]); // files before upload, NOT saved to servr
  const [uploadedVideos, setUploadedVideos] = useState<String[]>([]); // list of links to uplaoded vidoes

  useEffect(() => {
    setClasses(
      localStorage.getItem("classes")
        ? JSON.parse(localStorage.getItem("classes")!)
        : []
    );
    setPendingVideos(
      localStorage.getItem("pendingVideos")
        ? JSON.parse(localStorage.getItem("pendingVideos")!)
        : []
    );
  }, []);

  // shorten this.....
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedPendingVideos = Array.from(event.target.files || []);
    const validPendingVideos = selectedPendingVideos.filter((file) =>
      ["video/mp4", "video/mov", "video/x-matroska"].includes(file.type)
    );
    setPendingVideos((prevPendingVideos) => {
      const updatedPendingVideos = [
        ...prevPendingVideos,
        ...validPendingVideos,
      ];
      localStorage.setItem(
        "pendingPendingVideos",
        JSON.stringify(updatedPendingVideos)
      );
      return updatedPendingVideos;
    });
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    const validPendingVideos = droppedFiles.filter((file) =>
      ["video/mp4", "video/mov", "video/x-matroska"].includes(file.type)
    );
    setPendingVideos((prevPendingVideos) => {
      const updatedPendingVideos = [
        ...prevPendingVideos,
        ...validPendingVideos,
      ];
      localStorage.setItem(
        "pendingVideos",
        JSON.stringify(updatedPendingVideos)
      );
      return updatedPendingVideos;
    });
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removePendingVideo = (fileToRemove: File) => {
    setPendingVideos((prevPendingVideos) => {
      const updatedPendingVideos = prevPendingVideos.filter(
        (file) => file !== fileToRemove
      );
      localStorage.setItem(
        "pendingVideos",
        JSON.stringify(updatedPendingVideos)
      );
      return updatedPendingVideos;
    });
  };

  const handleUpload = async () => {
    const vids = pendingVideos;
    const body = { projectID: project_id, files: vids };
    console.warn("upload", body);
    fetch("http://localhost:5000/upload", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
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

  const PendingCard = ({
    file,
    rpv,
  }: {
    file: File;
    rpv: (file: File) => void;
  }) => (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "10px",
        borderRadius: "4px",
        position: "relative",
        width: "100%",
      }}
    >
      <Popover>
        <PopoverTrigger>
          <a>{file.name}</a>
        </PopoverTrigger>
        <PopoverContent className="w-[80vh]">
          <video controls poster="">
            <source src={URL.createObjectURL(file)} type="video/mp4" />
          </video>
        </PopoverContent>
      </Popover>
      <button
        onClick={() => rpv(file)}
        style={{ padding: "5px", position: "absolute", top: 5, right: 5 }}
      >
        <X size={20} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div
        id="classes"
        className="flex flex-col border p-4 rounded-md border-gray-300 gap-4 overflow-x-auto w-full"
      >
        <h2>Add Videos</h2>
        <div
          id="upload"
          className="flex flex-col border border-dashed p-4 rounded-md border-gray-300 gap-2"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {pendingVideos.map((video, index) => (
            <PendingCard key={index} file={video} rpv={removePendingVideo} />
          ))}

          <input
            id="pendingVideos"
            type="file"
            multiple
            accept=".mp4,.mov,.mkv"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
        </div>

        <div className={"flex flex-row gap-4"}>
          <button
            onClick={() => document.getElementById("pendingVideos")?.click()}
            className="flex-grow btn-primary"
          >
            {pendingVideos.length === 0 ? "Add Video" : "Add More"}
          </button>
          {pendingVideos.length === 0 ? null : (
            <button className="flex-grow btn-primary" onClick={handleUpload}>
              Upload
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col border p-4 rounded-md border-gray-300 gap-4 overflow-x-auto w-full">
        <h2>Uploaded videos</h2>
        <hr />
        <p>
          fetch uploaded videos from server display gallery map each to similar
          popover button to move onto annotate (route to annotate page)
        </p>
      </div>
    </div>
  );
};

export default UploadPage;
