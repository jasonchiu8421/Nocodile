"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ApiService } from "@/lib/api";
import { log } from "@/lib/logger";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Square,
  MousePointer,
  Trash2,
  Save,
} from "lucide-react";

interface Annotation {
  id: string;
  class: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface Class {
  id: string;
  name: string;
  color: string;
}

function AnnotatePageContent() {
  const { id } = useParams();
  const [currentFrameImage, setCurrentFrameImage] = useState<string>("");
  const [currentFrame, setCurrentFrame] = useState(0);
  const [currentImage, setCurrentImage] = useState(1);
  const [totalImages, setTotalImages] = useState(150); // 動態總幀數
  const [currentVideo, setCurrentVideo] = useState(1);
  const [totalVideos] = useState(10);
  const [selectedTool, setSelectedTool] = useState<"select" | "box">("box");
  const [selectedClass, setSelectedClass] = useState("stop_sign");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [zoom, setZoom] = useState(100);
  const [imageScale, setImageScale] = useState(1);
  const [classes, setClasses] = useState<Class[]>([
    { id: "give_way_sign", name: "give_way_sign", color: "#fbbf24" },
    { id: "pedestrian_child", name: "pedestrian_child", color: "#3b82f6" },
    { id: "zebra_crossing_sign", name: "zebra_crossing_sign", color: "#8b5cf6" },
    { id: "traffic_light_red", name: "traffic_light_red", color: "#10b981" },
    { id: "stop_sign", name: "stop_sign", color: "#ef4444" },
  ]);
  const [newClassName, setNewClassName] = useState("");
  const [classPage, setClassPage] = useState(1);
  const CLASSES_PER_PAGE = 5;
  const [currentVideoId, setCurrentVideoId] = useState("");
  const [annotationStatus, setAnnotationStatus] = useState("not yet started");
  const [lastAnnotatedFrame, setLastAnnotatedFrame] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const projectId = Array.isArray(id) ? id[0] : id;
  const safeProjectId = projectId || "";

  const getClientTimestamp = () => {
    if (typeof window === 'undefined') {
      return "2024-01-01T00:00:00.000Z";
    }
    return new Date().toISOString();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('video_id');
    if (videoId) {
      // 直接使用傳入的視頻 ID（應該是資料庫中的唯一 ID）
      setCurrentVideoId(videoId);
      console.log('🆔 [ANNOTATE] Video ID from params:', videoId);
    } else {
      console.warn('⚠️ [ANNOTATE] No video_id parameter found, getting first available video');
      getFirstAvailableVideoId();
    }
  }, [projectId]);

  const getFirstAvailableVideoId = async () => {
    try {
      if (safeProjectId) {
        const videos = await ApiService.getUploadedVideos(safeProjectId);
        if (videos && videos.length > 0) {
          const firstVideo = videos[0];
          // 後端返回的數據結構：{name, file, path, url}，其中 file 是 video_id
          const videoId = firstVideo.file_id || firstVideo.video_id || firstVideo.id;
          if (videoId && videoId !== "undefined" && videoId !== "" && videoId !== undefined) { 
            setCurrentVideoId(videoId.toString());
            console.log('🆔 [ANNOTATE] Using first available video ID:', videoId);
          } else {
            console.warn('⚠️ [ANNOTATE] No valid video ID found in video data:', firstVideo);
            const defaultVideoId = `1`;
            setCurrentVideoId(defaultVideoId);
            console.log('🆔 [ANNOTATE] Using fallback video ID:', defaultVideoId);
          }
        } else {
          const defaultVideoId = `1`; // 使用數字 ID 而不是字符串
          setCurrentVideoId(defaultVideoId);
          console.log('🆔 [ANNOTATE] No videos found, using default video ID:', defaultVideoId);
        }
      }
    } catch (error) {
      console.error('Error getting first available video ID:', error);
      const defaultVideoId = `1`; // 使用數字 ID 而不是字符串
      setCurrentVideoId(defaultVideoId);
      console.log('🆔 [ANNOTATE] Error occurred, using default video ID:', defaultVideoId);
    }
  };

  useEffect(() => {
    const loadClasses = async () => {
      try {
        if (safeProjectId) {
          const classesData = await ApiService.getClasses(safeProjectId);
          // 確保 classesData 是一個數組
          if (Array.isArray(classesData)) {
            setClasses(classesData);
            log.info('ANNOTATE', 'Classes loaded successfully', { projectId: safeProjectId, classCount: classesData.length });
          } else {
            console.warn('Classes data is not an array:', classesData);
            setClasses([
              { id: "give_way_sign", name: "give_way_sign", color: "#fbbf24" },
              { id: "pedestrian_child", name: "pedestrian_child", color: "#3b82f6" },
              { id: "zebra_crossing_sign", name: "zebra_crossing_sign", color: "#8b5cf6" },
              { id: "traffic_light_red", name: "traffic_light_red", color: "#10b981" },
              { id: "stop_sign", name: "stop_sign", color: "#ef4444" },
            ]);
          }
        }
      } catch (error) {
        console.error('Error loading classes:', error);
        setClasses([
          { id: "give_way_sign", name: "give_way_sign", color: "#fbbf24" },
          { id: "pedestrian_child", name: "pedestrian_child", color: "#3b82f6" },
          { id: "zebra_crossing_sign", name: "zebra_crossing_sign", color: "#8b5cf6" },
          { id: "traffic_light_red", name: "traffic_light_red", color: "#10b981" },
          { id: "stop_sign", name: "stop_sign", color: "#ef4444" },
        ]);
      }
    };
    loadClasses();
  }, [safeProjectId]);

  useEffect(() => {
    if (safeProjectId && currentVideoId) {
      const timer = setTimeout(async () => {
        await checkAnnotationStatus();
        await loadCurrentFrame();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [safeProjectId, currentVideoId]);

  const checkAnnotationStatus = async () => {
    try {
      if (safeProjectId && currentVideoId) {
        const statusData = await ApiService.checkAnnotationStatus(safeProjectId, currentVideoId);
        if (statusData && typeof statusData === 'object') {
          setAnnotationStatus(statusData["annotation status"] || "not yet started");
          setLastAnnotatedFrame(statusData["last annotated frame"] || 0);
          console.log('Annotation status:', statusData);
        } else {
          setAnnotationStatus("not yet started");
          setLastAnnotatedFrame(0);
        }
      }
    } catch (error) {
      console.error('Error checking annotation status:', error);
      setAnnotationStatus("not yet started");
      setLastAnnotatedFrame(0);
    }
  };

  const getNextFrameToAnnotate = async () => {
    try {
      if (!safeProjectId || !currentVideoId || currentVideoId === "" || currentVideoId === "undefined") {
        console.warn('Invalid projectId or videoId', { projectId: safeProjectId, videoId: currentVideoId });
        return;
      }
      
      const frameData = await ApiService.getNextFrameToAnnotate(safeProjectId, currentVideoId, currentFrame);
      console.log('🔍 [FRONTEND] Frame data received:', frameData);
      
      if (frameData && frameData.success) {
        if (frameData.image) {
          // Validate and format the image data properly
          let imageData = frameData.image;
          
          // Check if it's already a data URL
          if (!imageData.startsWith('data:')) {
            // If it's raw base64, add the proper data URL prefix
            if (imageData.startsWith('9j/') || imageData.startsWith('iVBORw0KGgo')) {
              // This looks like base64 data without proper data URL format
              console.warn('⚠️ [FRONTEND] Received malformed base64 data, attempting to fix');
              imageData = `data:image/jpeg;base64,${imageData}`;
            } else {
              // Assume it's base64 and add JPEG data URL prefix
              imageData = `data:image/jpeg;base64,${imageData}`;
            }
          }
          
          // Validate the data URL format
          if (!imageData.startsWith('data:image/')) {
            console.error('❌ [FRONTEND] Invalid image data format:', imageData.substring(0, 100) + '...');
            setCurrentFrameImage("");
            return;
          }
          
          setCurrentFrameImage(imageData);
          setTotalImages(frameData.total_frames || 150); // 動態更新總幀數
          
          // 優先使用 frame_id，如果沒有則使用 frame_num，最後才手動遞增
          if (frameData.frame_id !== undefined) {
            setCurrentFrame(frameData.frame_id);
            setCurrentImage(frameData.frame_id + 1);
            console.log(`✅ [FRONTEND] Key frame loaded: frame ${frameData.frame_id} (total: ${frameData.total_frames})`);
          } else if (frameData.frame_num !== undefined) {
            setCurrentFrame(frameData.frame_num);
            setCurrentImage(frameData.frame_num + 1);
            console.log(`✅ [FRONTEND] Key frame loaded using frame_num: frame ${frameData.frame_num} (total: ${frameData.total_frames})`);
          } else {
            console.warn('⚠️ [FRONTEND] No frame ID provided, using manual increment');
            setCurrentFrame((prev) => prev + 1);
            setCurrentImage((prev) => prev + 1);
          }
        } else {
          console.log('❌ [FRONTEND] No image returned, possible end of video');
          setCurrentFrameImage("");
          setAnnotationStatus("completed");
        }
      } else {
        console.log('❌ [FRONTEND] API returned success=false:', frameData?.message);
        setCurrentFrameImage("");
      }
    } catch (error) {
      console.error('Error getting next frame:', error);
      
      // 檢查是否為431錯誤或其他網路錯誤
      if (error instanceof Error && error.message && error.message.includes('431')) {
        console.warn('⚠️ [FRONTEND] 431 Request Header Fields Too Large - using fallback mechanism');
        // 清除可能過大的本地存儲
        try {
          localStorage.removeItem('large_session_data');
          sessionStorage.clear();
        } catch (storageError) {
          console.warn('Could not clear storage:', storageError);
        }
      }
      
      // 使用fallback機制 - 手動遞增幀數
      console.log('🔄 [FRONTEND] Using fallback: manual frame increment');
      setCurrentFrame((prev) => prev + 1);
      setCurrentImage((prev) => prev + 1);
      setCurrentFrameImage(""); // 清空圖片，讓用戶知道需要重新載入
    }
  };

  const loadCurrentFrame = async () => {
    await getNextFrameToAnnotate();
  };

  // 添加重試機制
  const retryGetNextFrame = async (retryCount = 0, maxRetries = 3) => {
    try {
      await getNextFrameToAnnotate();
    } catch (error) {
      if (retryCount < maxRetries) {
        console.log(`🔄 [FRONTEND] Retrying frame request (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          retryGetNextFrame(retryCount + 1, maxRetries);
        }, 1000 * (retryCount + 1)); // 遞增延遲
      } else {
        console.error('❌ [FRONTEND] Max retries reached, using fallback');
        // 最終fallback：手動遞增幀數
        setCurrentFrame((prev) => prev + 1);
        setCurrentImage((prev) => prev + 1);
      }
    }
  };

  const getNextVideo = async () => {
    try {
      if (safeProjectId && currentVideo < totalVideos) {
        const videoData = await ApiService.getNextVideo(safeProjectId, currentVideoId);
        if (videoData && videoData.success && videoData.next_video_id) {
          setCurrentVideoId(videoData.next_video_id);
          setCurrentVideo((prev) => prev + 1);
          setCurrentImage(1);
          setCurrentFrame(0);
          setAnnotations([]);
          setCurrentFrameImage("");
          setTimeout(async () => {
            await checkAnnotationStatus();
            await loadCurrentFrame();
          }, 100);
          console.log('Next video loaded:', videoData);
        } else {
          console.log('No next video available');
        }
      }
    } catch (error) {
      console.error('Error getting next video:', error);
    }
  };

  const redrawAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    annotations.forEach((annotation) => {
      const classInfo = classes.find((c) => c.id === annotation.class);
      if (!classInfo) return;
      ctx.strokeStyle = classInfo.color;
      ctx.fillStyle = classInfo.color + "20";
      ctx.lineWidth = 2;
      ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
      ctx.fillRect(annotation.x, annotation.y, annotation.width, annotation.height);
    });
    if (currentBox) {
      const currentClass = classes.find((c) => c.id === selectedClass) || classes[0] || {
        id: "default",
        name: "default",
        color: "#3b82f6"
      };
      ctx.strokeStyle = currentClass.color;
      ctx.fillStyle = currentClass.color + "20";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height);
      ctx.fillRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height);
      if (currentBox.width > 50 && currentBox.height > 20) {
        ctx.fillStyle = currentClass.color;
        ctx.font = "bold 12px Arial";
        ctx.fillText(currentClass.name, currentBox.x + 5, currentBox.y + 15);
      }
      ctx.setLineDash([]);
    }
  }, [annotations, currentBox, selectedClass, classes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        redrawAnnotations();
      }
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [redrawAnnotations]);

  useEffect(() => {
    redrawAnnotations();
  }, [redrawAnnotations, currentFrameImage]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(classes.length / CLASSES_PER_PAGE));
    if (classPage > totalPages) {
      setClassPage(totalPages);
    }
  }, [classes, classPage]);

  if (!currentVideoId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Video Selected</h2>
          <p className="text-gray-600 mb-4">Please select a video to annotate from the upload page.</p>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">
              <strong>Debug Info:</strong><br/>
              Project ID: {safeProjectId}<br/>
              Current Video ID: {currentVideoId}<br/>
              URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
            </p>
          </div>
          <div className="space-x-4">
            <Link href={`/project/${safeProjectId}/upload`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
              Go to Upload Page
            </Link>
            <button onClick={() => window.location.reload()} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md">
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentClass = classes.find((c) => c.id === selectedClass) || classes[0] || {
    id: "default",
    name: "default",
    color: "#3b82f6"
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool !== "box") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / imageScale;
    const y = (e.clientY - rect.top) / imageScale;
    setIsDrawing(true);
    setDrawStart({ x, y });
    setCurrentBox({ x, y, width: 0, height: 0 });
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || selectedTool !== "box") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / imageScale;
    const y = (e.clientY - rect.top) / imageScale;
    const width = x - drawStart.x;
    const height = y - drawStart.y;
    setCurrentBox({
      x: Math.min(drawStart.x, x),
      y: Math.min(drawStart.y, y),
      width: Math.abs(width),
      height: Math.abs(height),
    });
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !currentBox || selectedTool !== "box") return;
    if (currentBox.width > 10 && currentBox.height > 10) {
      const newAnnotation: Annotation = {
        id: `annotation_${annotations.length + 1}_${getClientTimestamp().replace(/[^0-9]/g, '')}`,
        class: selectedClass,
        x: currentBox.x,
        y: currentBox.y,
        width: currentBox.width,
        height: currentBox.height,
        color: currentClass.color,
      };
      setAnnotations((prev) => [...prev, newAnnotation]);
    }
    setIsDrawing(false);
    setCurrentBox(null);
    e.preventDefault();
    e.stopPropagation();
  };

  const handleZoom = (newZoom: number) => {
    setZoom(newZoom);
    setImageScale(newZoom / 100);
  };

  const handleNextImage = async () => {
    if (currentFrame < totalImages - 1) { // 使用 currentFrame 和 totalImages
      await handleAutoSave();
      setAnnotations([]);
      await getNextFrameToAnnotate();
      setCurrentImage((prev) => prev + 1);
      console.log(`🔄 [FRONTEND] Key frame updated: ${currentFrame + 1}/${totalImages}`);
    } else {
      console.log('Already at the last frame, switching to next video');
      await getNextVideo();
    }
  };

  const handlePrevImage = () => {
    console.log('Previous frame navigation is disabled');
  };

  const handleAutoSave = async () => {
    if (annotations.length === 0) {
      console.log('No annotations to save, skipping auto-save');
      return;
    }
    setIsAutoSaving(true);
    setSaveStatus('saving');
    try {
      const annotationData = {
        project_id: safeProjectId,
        video_id: currentVideoId,
        frame_num: currentFrame,
        bboxes: annotations.map(ann => ({
          class_name: ann.class,
          x: Number(ann.x),
          y: Number(ann.y),
          width: Number(ann.width),
          height: Number(ann.height)
        }))
      };
      const result = await ApiService.saveAnnotation(annotationData);
      if (result.success) {
        setLastSavedTime(result.savedAt || getClientTimestamp());
        setSaveStatus('saved');
        console.log('Annotations auto-saved successfully', { savedAt: result.savedAt, bboxCount: annotations.length });
      } else {
        setSaveStatus('error');
        saveToLocalStorage(annotationData);
      }
    } catch (error) {
      console.error('Error auto-saving annotations:', error);
      setSaveStatus('error');
      const annotationData = {
        project_id: safeProjectId,
        video_id: currentVideoId,
        frame_num: currentFrame,
        bboxes: annotations.map(ann => ({
          class_name: ann.class,
          x: Number(ann.x),
          y: Number(ann.y),
          width: Number(ann.width),
          height: Number(ann.height)
        }))
      };
      saveToLocalStorage(annotationData);
    } finally {
      setIsAutoSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const saveToLocalStorage = (annotationData: any) => {
    try {
      const key = `annotation_backup_${annotationData.project_id}_${annotationData.video_id}_${annotationData.frame_num}`;
      localStorage.setItem(key, JSON.stringify({
        ...annotationData,
        savedAt: getClientTimestamp(),
        isBackup: true
      }));
      console.log('Annotation saved to local storage as backup');
    } catch (error) {
      console.error('Failed to save to local storage:', error);
    }
  };

  const handleManualSave = async () => {
    if (!safeProjectId || !currentVideoId) {
      console.warn('Cannot save annotations: missing projectId or videoId');
      alert('Cannot save: Missing project or video information');
      return;
    }
    try {
      const annotationData = {
        project_id: safeProjectId,
        video_id: currentVideoId,
        frame_num: currentFrame,
        bboxes: annotations.map(ann => ({
          class_name: ann.class,
          x: Number(ann.x),
          y: Number(ann.y),
          width: Number(ann.width),
          height: Number(ann.height)
        }))
      };
      const result = await ApiService.saveAnnotation(annotationData);
      if (result.success) {
        console.log('Annotations saved successfully', { savedAt: result.savedAt, bboxCount: annotations.length });
        alert(`Annotations saved successfully! (${annotations.length} bounding boxes)`);
      } else {
        saveToLocalStorage(annotationData);
        alert(`Failed to save annotations: ${result.message || 'Unknown error'}. Data backed up locally.`);
      }
    } catch (error) {
      console.error('Error saving annotations:', error);
      const annotationData = {
        project_id: safeProjectId,
        video_id: currentVideoId,
        frame_num: currentFrame,
        bboxes: annotations.map(ann => ({
          class_name: ann.class,
          x: Number(ann.x),
          y: Number(ann.y),
          width: Number(ann.width),
          height: Number(ann.height)
        }))
      };
      saveToLocalStorage(annotationData);
      alert(`Error saving annotations: ${error instanceof Error ? error.message : 'Unknown error'}. Data backed up locally.`);
    }
  };

  const isValidHex = (color: string) => /^#([0-9a-fA-F]{3}){1,2}$/.test(color);

  const generateUniqueColor = (used: Set<string>) => {
    const palette = [
      "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
      "#ec4899", "#14b8a6", "#f97316", "#84cc16", "#06b6d4"
    ];
    for (const c of palette) {
      if (!used.has(c.toLowerCase())) return c;
    }
    const hash = used.size;
    const hue = (hash * 137.508) % 360;
    return `hsl(${Math.floor(hue)}, 70%, 50%)`;
  };

  const handleAddClass = async () => {
    const input = newClassName.trim();
    if (!input) return;
    const entries = input.split(",").map((s) => s.trim()).filter(Boolean);
    for (const entry of entries) {
      const [namePartRaw, colorPartRaw] = entry.split(":").map((s) => s.trim());
      const namePart = namePartRaw || "";
      if (!namePart) continue;
      let chosenColor = "#3b82f6";
      if (colorPartRaw && isValidHex(colorPartRaw)) {
        chosenColor = colorPartRaw.toLowerCase();
      }
      const generatedId = namePart.toLowerCase().replace(/\s+/g, "_");
      if (classes.some((c) => c.id === generatedId)) {
        console.log(`Class '${namePart}' already exists`);
        continue;
      }
      try {
        const result = await ApiService.addClass(safeProjectId, namePart, chosenColor);
        if (result && result.success) {
          const classesData = await ApiService.getClasses(safeProjectId);
          setClasses(classesData);
          setSelectedClass(generatedId);
          console.log('✅ [ANNOTATE] Class added via API');
        } else {
          alert(`Failed to add class: ${result?.message || 'Unknown error'}`);
        }
      } catch (error) {
        alert(`Error adding class: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    setNewClassName("");
  };

  const handleDeleteClass = async (classId: string) => {
    const classToDelete = classes.find(c => c.id === classId);
    if (!classToDelete) return;
    try {
      const result = await ApiService.deleteClass(safeProjectId, classToDelete.name);
      if (result && result.success) {
        const classesData = await ApiService.getClasses(safeProjectId);
        setClasses(classesData);
        if (selectedClass === classId) {
          const remaining = classesData.filter((c) => c.id !== classId);
          setSelectedClass(remaining[0]?.id || "");
        }
        console.log('✅ Class deleted successfully via API');
      } else {
        alert(`無法刪除類別: ${result?.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`刪除類別時發生錯誤: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    try {
      setAnnotations((prev) => prev.filter((ann) => ann.id !== annotationId));
      await handleAutoSave();
      console.log(`✅ [FRONTEND] Annotation ${annotationId} deleted successfully`);
    } catch (error) {
      console.error('❌ [FRONTEND] Error deleting annotation:', error);
    }
  };

  const isLastImage = currentFrame >= totalImages - 1;
  const isLastVideo = currentVideo >= totalVideos;

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="flex flex-col space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevImage}
                  disabled={true}
                  className="flex items-center opacity-50 cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev image
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextImage}
                  disabled={isLastImage || isAutoSaving}
                  className="flex items-center"
                >
                  {isAutoSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-1"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      Next key frame
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
              <span className="font-semibold text-gray-700">
                Frame {currentImage} of {totalImages}
              </span>
              <div className="text-xs text-gray-500 ml-2">
                Debug: currentFrame={currentFrame}, videoId={currentVideoId}
              </div>
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center space-x-3">
              <span className="font-semibold text-gray-700">
                Video {currentVideo} of {totalVideos}
              </span>
              <div className="flex flex-col space-y-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (currentVideo > 1) {
                      setCurrentVideo((prev) => prev - 1);
                      setCurrentImage(1);
                      setCurrentFrame(0);
                      setAnnotations([]);
                      setCurrentFrameImage("");
                      setTimeout(async () => {
                        await checkAnnotationStatus();
                        await loadCurrentFrame();
                      }, 100);
                    }
                  }}
                  disabled={currentVideo <= 1}
                  className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev video
                </Button>
                <Button
                  size="sm"
                  onClick={getNextVideo}
                  disabled={isLastVideo}
                  className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next video
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleManualSave}
              variant="outline"
              size="sm"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
              title="Emergency manual save (auto-save is enabled)"
            >
              <Save className="w-4 h-4 mr-2" />
              Manual Save
            </Button>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-50 border-b border-gray-200 p-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-gray-700">Tools</span>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600">狀態:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  annotationStatus === "not yet started" ? "bg-gray-200 text-gray-700" :
                  annotationStatus === "in progress" ? "bg-yellow-200 text-yellow-700" :
                  annotationStatus === "completed" ? "bg-green-200 text-green-700" :
                  "bg-blue-200 text-blue-700"
                }`}>
                  {annotationStatus}
                </span>
                <span className="text-gray-600">最後註釋幀: {lastAnnotatedFrame}</span>
                {saveStatus === 'saving' ? (
                  <span className="text-blue-600 text-xs flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                    自動保存中...
                  </span>
                ) : saveStatus === 'saved' ? (
                  <span className="text-green-600 text-xs flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                    已保存 {lastSavedTime ? new Date(lastSavedTime).toLocaleTimeString() : ''}
                  </span>
                ) : saveStatus === 'error' ? (
                  <span className="text-red-600 text-xs flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                    保存失敗 (已備份到本地)
                  </span>
                ) : (
                  <span className="text-green-600 text-xs">✓ 自動保存已啟用</span>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={selectedTool === "select" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTool("select")}
                  className="flex items-center"
                >
                  <MousePointer className="w-4 h-4 mr-1" />
                  Select
                </Button>
                <Button
                  variant={selectedTool === "box" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTool("box")}
                  className="flex items-center"
                >
                  <Square className="w-4 h-4 mr-1" />
                  Box
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Zoom</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom(Math.max(25, zoom - 25))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[3rem] text-center">{zoom}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom(Math.min(400, zoom + 25))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div ref={containerRef} className="flex-1 relative bg-white overflow-hidden flex items-center justify-center">
            {currentFrameImage ? (
              <img
                src={currentFrameImage}
                alt={`Frame ${currentImage}`}
                className="max-w-full max-h-full object-contain pointer-events-none"
                style={{ transform: `scale(${imageScale})` }}
              />
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading key frame...</p>
                </div>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 pointer-events-auto"
              style={{ transform: `scale(${imageScale})`, cursor: selectedTool === "box" ? "crosshair" : "default" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>
      </div>
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Classes</h3>
          <div className="flex items-center space-x-2 mb-3">
            <Input
              placeholder="New class name"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
            <Button onClick={handleAddClass} className="bg-blue-600 hover:bg-blue-700 text-white">
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {(() => {
              const totalPages = Math.max(1, Math.ceil(classes.length / CLASSES_PER_PAGE));
              const startIdx = (classPage - 1) * CLASSES_PER_PAGE;
              const pageItems = classes.slice(startIdx, startIdx + CLASSES_PER_PAGE);
              return pageItems;
            })().map((cls) => (
              <div
                key={cls.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  selectedClass === cls.id ? "bg-gray-100 border border-gray-300" : "hover:bg-gray-50"
                }`}
              >
                <div onClick={() => setSelectedClass(cls.id)} className="flex items-center cursor-pointer">
                  <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: cls.color }} />
                  <span className={`text-sm ${selectedClass === cls.id ? "font-semibold" : ""}`}>
                    {cls.name}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClass(cls.id)}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          {classes.length > CLASSES_PER_PAGE && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-600">
                Page {classPage} of {Math.max(1, Math.ceil(classes.length / CLASSES_PER_PAGE))}
              </span>
              <div className="space-x-2">
                <Button
                  size="sm"
                  onClick={() => setClassPage((p) => Math.max(1, p - 1))}
                  disabled={classPage <= 1}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  onClick={() => setClassPage((p) => Math.min(Math.max(1, Math.ceil(classes.length / CLASSES_PER_PAGE)), p + 1))}
                  disabled={classPage >= Math.max(1, Math.ceil(classes.length / CLASSES_PER_PAGE))}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Current Annotations</h3>
          <div className="space-y-2">
            {annotations.map((annotation) => {
              const classInfo = classes.find((c) => c.id === annotation.class);
              return (
                <div key={annotation.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: classInfo?.color }} />
                    <span className="text-sm">{annotation.class}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAnnotation(annotation.id)}
                    className="text-red-600 border-red-600 hover:bg-red-50 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
            {annotations.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                No annotations yet. Select the Box tool and draw on the image.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const AnnotatePage = dynamic(() => Promise.resolve(AnnotatePageContent), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading annotation tool...</p>
      </div>
    </div>
  )
});

export default AnnotatePage;