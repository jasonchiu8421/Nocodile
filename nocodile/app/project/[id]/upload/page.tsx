"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, X } from "lucide-react";
import Link from "next/link";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { uploadedVid, getUploadedVids } from "./getUploadedVids";

const UploadPage = () => {
  const { id: project_id } = useParams();

  const [pendingVideos, setPendingVideos] = useState<File[]>(() => {
    // for some reason this doesnt work because json.parse becomes [{}] which makes the video tag bug
    /*
    const stuff = localStorage.getItem("pendingVideos");
    if (!stuff) return [];
    return JSON.parse(stuff);
    */

    const stuff = JSON.parse(localStorage.getItem("pendingVideos") || []);
    if (Object.keys(stuff[0]).length === 0) return [];
    return stuff;
  });

  const [uploadedVideos, setUploadedVideos] = useState<uploadedVid[]>(() => {
    const stuff = JSON.parse(localStorage.getItem("uploadedVideos") || []);
    if (Object.keys(stuff[0]).length === 0) return [];
    return stuff;
  });

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
        "pendingVideos",
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
    /*fetch("http://localhost:5000/upload", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });*/
    const res = getUploadedVids(parseInt(project_id));

    // check responses, update uploadedVideos state
    setUploadedVideos(res);
    setPendingVideos([]);
  };

  //save vals
  useEffect(() => {
    console.warn("save values to localstorage ");
    localStorage.setItem("uploadedVideos", JSON.stringify(uploadedVideos));
  }, [pendingVideos, uploadedVideos]);

  const PendingCard = ({
    file,
    rpv,
  }: {
    file: File;
    rpv: (file: File) => void;
  }) => {
    return (
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
  };

  const UploadedCard = (vid: uploadedVid) => {
    return (
      <div className="items-center flex flex-row border mb-4 p-4 rounded-md border-gray-300 w-full justify-between">
        <video controls poster="" className="w-[200px]">
          <source src={vid.url} type="video/mp4" />
        </video>
        <div className="flex flex-row gap-2">
          <Link
            href={`/project/${project_id}/annotate/${vid.url}`}
            className="btn-secondary w-fit"
          >
            Annotate this video
          </Link>
          <button>
            <X />
          </button>
        </div>
      </div>
    );
  };
  return (
    <div className="flex flex-col gap-4">
      <div
        id="classes"
        className="flex flex-col border p-4 rounded-md border-gray-300 gap-4 overflow-x-auto w-full"
      >
        <h2>Add Videos Here</h2>
        <div
          id="upload"
          className="flex flex-col justify-center border border-dashed p-4 rounded-md border-gray-300 gap-2"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {pendingVideos && pendingVideos.length > 0
            ? pendingVideos.map((video, index) => (
                <PendingCard
                  key={index}
                  file={video}
                  rpv={removePendingVideo}
                />
              ))
            : /*<Plus />*/ null}

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
            className="flex-grow btn-primary text-center"
          >
            {pendingVideos.length === 0 ? "Add Video" : "Add More"}
          </button>
          {pendingVideos.length === 0 ? null : (
            <button
              className="flex-grow btn-primary text-center"
              onClick={handleUpload}
            >
              Upload
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col border p-4 rounded-md border-gray-300 gap-4 overflow-x-auto w-full">
        <h2>Uploaded videos</h2>
        <hr />
        <div>
          {uploadedVideos.map((vid, index) => (
            <UploadedCard key={index} {...vid} />
          ))}
        </div>
        <p>
          fetch uploaded videos from server display gallery map each to similar
          popover button to move onto annotate (route to annotate page)
        </p>
      </div>
    </div>
  );
};

export default UploadPage;
