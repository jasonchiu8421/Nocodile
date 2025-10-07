"use client";

import React, { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Plus, X, Save } from "lucide-react";
import Link from "next/link";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { uploadedVid, getUploadedVidsAsync } from "./getUploadedVids";
import { ApiService } from "@/lib/api";

const UploadPage = () => {
  const { id: project_id } = useParams();
  if (!project_id) return <div>Invalid project ID</div>;
  
  const [pendingVideos, setPendingVideos] = useState<File[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<uploadedVid[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  // Test API connection
  const testApiConnection = useCallback(async () => {
    try {
      console.log("Testing API connection...");
      await ApiService.findWorkingBackendUrl();
      setApiStatus('connected');
      console.log("API connection successful");
      return true;
    } catch (error) {
      console.error("API connection failed:", error);
      setApiStatus('disconnected');
      return false;
    }
  }, []);

  // Load videos from backend API
  const loadVideosFromBackend = useCallback(async () => {
    if (isLoadingVideos) return;
    
    setIsLoadingVideos(true);
    try {
      console.log("Loading videos from backend for project:", project_id);
      
      // Test connection first
      const isConnected = await testApiConnection();
      if (!isConnected) {
        alert("Cannot connect to backend API. Please check if the backend server is running.");
        return;
      }
      
      const backendVideos = await getUploadedVidsAsync(Number(project_id));
      
      if (backendVideos.length > 0) {
        setUploadedVideos(backendVideos);
        setHasLoaded(true);
        console.log("Loaded", backendVideos.length, "videos from backend");
        alert(`Successfully loaded ${backendVideos.length} video(s) from backend!`);
      } else {
        console.log("No videos found in backend");
        alert("No videos found in backend for this project.");
      }
    } catch (error) {
      console.error("Failed to load videos from backend:", error);
      alert("Failed to load videos from backend. Please try again.");
    } finally {
      setIsLoadingVideos(false);
    }
  }, [project_id, isLoadingVideos, testApiConnection]);

  // Load videos from localStorage ONLY when user clicks load button
  const loadVideosFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem("uploadedVideos");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const dummyFile = new File([], "dummy.mp4", { type: "video/mp4" });
          const loadedVideos = parsed.map((item: any) => ({
            url: item.url || "",
            title: item.title || "Unknown Video",
            file: dummyFile,
            fallbackUrl: item.fallbackUrl,
            video_id: item.video_id
          }));
          setUploadedVideos(loadedVideos);
          setHasLoaded(true);
          console.log("Loaded", loadedVideos.length, "videos from localStorage");
        }
      } else {
        console.log("No videos found in localStorage");
      }
    } catch (error) {
      console.warn("Failed to load videos from localStorage:", error);
    }
  }, []);

  // Save videos to localStorage ONLY when user clicks save button
  const saveVideosToStorage = useCallback(() => {
    try {
      const serializableVideos = uploadedVideos.map(vid => ({
        url: vid.url,
        title: vid.title,
        fallbackUrl: vid.fallbackUrl,
        video_id: vid.video_id
      }));
      localStorage.setItem("uploadedVideos", JSON.stringify(serializableVideos));
      console.log("Saved", uploadedVideos.length, "videos to localStorage");
      alert(`Saved ${uploadedVideos.length} videos to localStorage!`);
    } catch (error) {
      console.warn("Failed to save videos to localStorage:", error);
      alert("Failed to save videos to localStorage");
    }
  }, [uploadedVideos]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedPendingVideos = Array.from(event.target.files || []);
    const validPendingVideos = selectedPendingVideos.filter((file) => {
      const isValidType = ["video/mp4", "video/mov", "video/x-matroska"].includes(file.type);
      const isValidSize = file.size <= 100 * 1024 * 1024;
      
      if (!isValidType) {
        alert(`File ${file.name} is not a supported video format. Please use MP4, MOV, or MKV.`);
      }
      if (!isValidSize) {
        alert(`File ${file.name} is too large. Maximum size is 100MB.`);
      }
      
      return isValidType && isValidSize;
    });
    
    setPendingVideos(prev => [...prev, ...validPendingVideos]);
    event.target.value = '';
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    const validPendingVideos = droppedFiles.filter((file) => {
      const isValidType = ["video/mp4", "video/mov", "video/x-matroska"].includes(file.type);
      const isValidSize = file.size <= 100 * 1024 * 1024;
      
      if (!isValidType) {
        alert(`File ${file.name} is not a supported video format. Please use MP4, MOV, or MKV.`);
      }
      if (!isValidSize) {
        alert(`File ${file.name} is too large. Maximum size is 100MB.`);
      }
      
      return isValidType && isValidSize;
    });
    
    setPendingVideos(prev => [...prev, ...validPendingVideos]);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const removePendingVideo = useCallback((fileToRemove: File) => {
    setPendingVideos(prev => prev.filter(file => file !== fileToRemove));
  }, []);

  const handleUpload = useCallback(async () => {
    if (pendingVideos.length === 0) {
      alert("No videos to upload");
      return;
    }

    setIsUploading(true);
    try {
      console.log("Starting upload of", pendingVideos.length, "videos");
      
      // Try to upload to backend using ApiService
      try {
        // Test connection first
        const isConnected = await testApiConnection();
        if (!isConnected) {
          throw new Error("Cannot connect to backend API");
        }
        
        // Upload each video individually using ApiService
        const uploadPromises = pendingVideos.map(async (file, index) => {
          try {
            const result = await ApiService.uploadVideo(project_id as string, file);
            console.log(`Backend upload successful for ${file.name}:`, result);
            
            return {
              url: URL.createObjectURL(file), // Use blob URL for preview
              title: file.name,
              file: file,
              video_id: result.video_id,
              video_path: result.video_path
            };
          } catch (error) {
            console.error(`Upload failed for ${file.name}:`, error);
            throw error;
          }
        });
        
        const uploadedResults = await Promise.all(uploadPromises);
        console.log("All backend uploads successful:", uploadedResults);
        
        setUploadedVideos(prev => [...prev, ...uploadedResults]);
        setPendingVideos([]);
        
        console.log("Upload completed:", uploadedResults.length, "videos");
        alert(`Successfully uploaded ${uploadedResults.length} video(s) to backend!`);
        return;
      } catch (backendError) {
        console.warn("Backend upload failed, falling back to local storage:", backendError);
        alert("Backend upload failed. Videos will be saved locally only.");
      }
      
      // Fallback: simulate upload by converting pending videos to uploaded format
      const newUploadedVideos: uploadedVid[] = pendingVideos.map((file, index) => ({
        url: URL.createObjectURL(file),
        title: file.name,
        file: file,
        video_id: `temp_${index}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`
      }));

      setUploadedVideos(prev => [...prev, ...newUploadedVideos]);
      setPendingVideos([]);
      
      console.log("Local upload completed:", newUploadedVideos.length, "videos");
      alert(`Videos saved locally: ${newUploadedVideos.length} video(s)`);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [pendingVideos, project_id]);

  const removeUploadedVideo = useCallback((videoToRemove: uploadedVid) => {
    // Revoke the blob URL to prevent memory leaks
    if (videoToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(videoToRemove.url);
    }
    setUploadedVideos(prev => prev.filter(vid => vid !== videoToRemove));
  }, []);

  const PendingCard = React.memo(({
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
            <a className="cursor-pointer hover:underline">{file.name}</a>
          </PopoverTrigger>
          <PopoverContent className="w-[80vh]">
            <video controls poster="" className="w-full">
              <source src={URL.createObjectURL(file)} type="video/mp4" />
              Your browser does not support the video tag.
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
  });

  const UploadedCard = React.memo(({ vid, onRemove }: { vid: uploadedVid; onRemove: (vid: uploadedVid) => void }) => {
    return (
      <div className="items-center flex flex-row border mb-4 p-4 rounded-md border-gray-300 w-full justify-between">
        <video controls poster="" className="w-[200px]">
          <source src={vid.url} type="video/mp4" />
        </video>
        <div className="flex flex-row gap-2">
          <Link
            href={`/project/${project_id}/annotate?video_id=${vid.video_id || encodeURIComponent(vid.url)}`}
            className="btn-secondary w-fit"
          >
            Annotate this video
          </Link>
          <button onClick={() => onRemove(vid)}>
            <X />
          </button>
        </div>
      </div>
    );
  });

  return (
    <div className="flex flex-col gap-4">
      {/* API Status and Control Buttons */}
      <div className="flex flex-col gap-2 p-4 border-2 border-blue-500 rounded-md bg-blue-50">
        <div className="flex flex-row items-center gap-2">
          <span className="text-sm font-medium">API Status:</span>
          <span className={`px-2 py-1 rounded text-xs ${
            apiStatus === 'connected' ? 'bg-green-200 text-green-800' :
            apiStatus === 'disconnected' ? 'bg-red-200 text-red-800' :
            'bg-gray-200 text-gray-800'
          }`}>
            {apiStatus === 'connected' ? '✅ Connected' :
             apiStatus === 'disconnected' ? '❌ Disconnected' :
             '❓ Unknown'}
          </span>
          <button
            onClick={testApiConnection}
            className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
          >
            Test Connection
          </button>
        </div>
        <div className="flex flex-row gap-2">
          <button
            onClick={loadVideosFromBackend}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={isLoadingVideos || hasLoaded}
          >
            <Plus size={16} className="inline mr-2" />
            {isLoadingVideos ? "Loading..." : hasLoaded ? "Videos Loaded" : "Load from Backend"}
          </button>
          <button
            onClick={loadVideosFromStorage}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            disabled={hasLoaded}
          >
            <Plus size={16} className="inline mr-2" />
            {hasLoaded ? "Videos Loaded" : "Load from localStorage"}
          </button>
          <button
            onClick={saveVideosToStorage}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            disabled={uploadedVideos.length === 0}
          >
            <Save size={16} className="inline mr-2" />
            Save to localStorage ({uploadedVideos.length} videos)
          </button>
        </div>
      </div>

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
                  key={`${video.name}-${index}`}
                  file={video}
                  rpv={removePendingVideo}
                />
              ))
            : null}

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
              className="flex-grow btn-primary text-center disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col border p-4 rounded-md border-gray-300 gap-4 overflow-x-auto w-full">
        <h2>Uploaded videos ({uploadedVideos.length})</h2>
        <hr />
        <div>
          {uploadedVideos.length === 0 ? (
            <p className="text-gray-500">No videos uploaded yet. Upload some videos or load from localStorage.</p>
          ) : (
            uploadedVideos.map((vid, index) => (
              <UploadedCard key={vid.video_id || index} vid={vid} onRemove={removeUploadedVideo} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;