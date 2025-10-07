"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ApiService, ClassInfo } from "@/lib/api";
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
  Cloud,
  Pencil,
  Rocket,
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
  
  // 所有hooks必須在條件檢查之前調用
  const [currentImage, setCurrentImage] = useState(1);
  const [totalImages] = useState(150);
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
  const [currentFrame, setCurrentFrame] = useState(0);  // 添加當前幀數狀態
  const [annotationStatus, setAnnotationStatus] = useState("not yet started");
  const [lastAnnotatedFrame, setLastAnnotatedFrame] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // 客戶端專用的時間戳生成器
  const getClientTimestamp = () => {
    if (typeof window === 'undefined') {
      return "2024-01-01T00:00:00.000Z";
    }
    return new Date().toISOString();
  };
  
  // Refs也必須在條件檢查之前調用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 安全地獲取項目ID
  const projectId = Array.isArray(id) ? id[0] : id;
  const safeProjectId = projectId || "";
  
  // 從URL查詢參數獲取video_id，如果沒有則嘗試獲取第一個可用的視頻
  useEffect(() => {
    // 確保在客戶端環境中運行
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('video_id');
    
    console.log('🔍 [ANNOTATE] Current URL:', window.location.href);
    console.log('🔍 [ANNOTATE] URL params:', { videoId });
    
    if (videoId) {
      setCurrentVideoId(videoId);
      console.log('🆔 [ANNOTATE] Video ID from params:', videoId);
    } else {
      console.warn('⚠️ [ANNOTATE] No video_id parameter found in URL, trying to get first available video');
      // 嘗試獲取第一個可用的視頻ID
      getFirstAvailableVideoId();
    }
  }, [projectId]);

  // 獲取第一個可用的視頻ID
  const getFirstAvailableVideoId = async () => {
    try {
      if (id) {
        const projectId = Array.isArray(id) ? id[0] : id;
        const videos = await ApiService.getUploadedVideos(projectId);
        
        if (videos && videos.length > 0) {
          // 使用第一個視頻的ID，或者生成一個默認ID
          const firstVideo = videos[0];
          const videoId = firstVideo.video_id || `video_${projectId}_1`;
          setCurrentVideoId(videoId);
          console.log('🆔 [ANNOTATE] Using first available video ID:', videoId);
        } else {
          // 如果沒有視頻，使用項目ID作為默認視頻ID
          const defaultVideoId = `video_${projectId}_1`;
          setCurrentVideoId(defaultVideoId);
          console.log('🆔 [ANNOTATE] No videos found, using default video ID:', defaultVideoId);
        }
      }
    } catch (error) {
      console.error('Error getting first available video ID:', error);
      // 使用項目ID作為默認視頻ID
      const defaultVideoId = `video_${projectId}_1`;
      setCurrentVideoId(defaultVideoId);
      console.log('🆔 [ANNOTATE] Error occurred, using default video ID:', defaultVideoId);
    }
  };


  // 從API加載類別數據
  useEffect(() => {
    const loadClasses = async () => {
      try {
        if (id) {
          const projectId = Array.isArray(id) ? id[0] : id;
          log.info('ANNOTATE', 'Loading classes for project', { projectId });
          
          const classesData = await ApiService.getClasses(projectId);
          setClasses(classesData);
          
          log.info('ANNOTATE', 'Classes loaded successfully', { 
            projectId, 
            classCount: classesData.length 
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error('ANNOTATE', 'Error loading classes', { 
          projectId: id, 
          error: errorMessage 
        });
        console.error('Error loading classes:', error);
        // 使用默認類別作為後備
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
  }, [id]);

  // 初始化時檢查註釋狀態和加載第一幀
  useEffect(() => {
    if (id) {
      // 延遲一點時間讓頁面完全加載
      const timer = setTimeout(async () => {
        // 按照指定順序：先檢查狀態，再獲取幀
        await checkAnnotationStatus();
        await loadCurrentFrame();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [id, currentVideoId]);

  // 檢查註釋狀態
  const checkAnnotationStatus = async () => {
    try {
      if (id) {
        const projectId = Array.isArray(id) ? id[0] : id;
        
        // 添加額外的安全檢查
        if (!projectId || !currentVideoId) {
          console.warn('Missing project ID or video ID, using fallback data');
          setAnnotationStatus("not yet started");
          setLastAnnotatedFrame(0);
          return;
        }
        
        const statusData = await ApiService.checkAnnotationStatus(projectId, currentVideoId);
        
        setAnnotationStatus(statusData["annotation status"]);
        setLastAnnotatedFrame(statusData["last annotated frame"]);
        
        console.log('Annotation status:', statusData);
        
        // 顯示成功消息
        if (statusData["annotation status"]) {
          console.log(`Status updated: ${statusData["annotation status"]}`);
        }
      }
    } catch (error) {
      console.error('Error checking annotation status:', error);
      // 設置默認狀態
      setAnnotationStatus("not yet started");
      setLastAnnotatedFrame(0);
    }
  };


  // 獲取下一幀進行註釋
  const getNextFrameToAnnotate = async () => {
    try {
      if (id) {
        const projectId = Array.isArray(id) ? id[0] : id;
        if (!projectId) {
          console.warn('No project ID available for getting next frame');
          return;
        }
        
        const frameData = await ApiService.getNextFrameToAnnotate(projectId, currentVideoId, currentFrame);
        console.log('🔍 [FRONTEND] Frame data received:', frameData);
        
        if (frameData.success && frameData.image) {
          // 設置當前幀圖像
          setCurrentFrameImage(frameData.image);
          // 更新當前幀數
          if (frameData.frame_id !== undefined) {
            setCurrentFrame(frameData.frame_id);
            console.log(`✅ [FRONTEND] Next frame loaded: frame ${frameData.frame_id} (total: ${frameData.total_frames})`);
          } else {
            setCurrentFrame(prev => prev + 1);
            console.log('⚠️ [FRONTEND] Next frame loaded (frame ID not provided)');
          }
        } else {
          console.log('❌ [FRONTEND] No more frames to annotate or using fallback data');
          // 如果沒有更多幀，可以顯示提示或禁用導航
        }
      }
    } catch (error) {
      console.error('Error getting next frame:', error);
      // 即使出錯也繼續，因為API已經有fallback
    }
  };

  // 加載當前幀
  const loadCurrentFrame = async () => {
    await getNextFrameToAnnotate();
  };


  // 獲取下一個視頻
  const getNextVideo = async () => {
    try {
      if (id) {
        const projectId = Array.isArray(id) ? id[0] : id;
        if (!projectId) {
          console.warn('No project ID available for getting next video');
          return;
        }
        
        const videoData = await ApiService.getNextVideo(projectId, currentVideoId);
        if (videoData.success && videoData.next_video_id) {
          setCurrentVideoId(videoData.next_video_id);
          setCurrentVideo(prev => prev + 1);
          setCurrentImage(1);
          setAnnotations([]);
          setCurrentFrameImage(""); // 清空當前幀
          console.log('Next video loaded:', videoData);
          
          // 切換視頻後重新檢查狀態和加載第一幀
          setTimeout(async () => {
            await checkAnnotationStatus();
            await loadCurrentFrame();
          }, 100);
        } else {
          console.log('No next video available or using fallback data');
        }
      }
    } catch (error) {
      console.error('Error getting next video:', error);
      // 即使出錯也繼續，因為API已經有fallback
    }
  };

  // 定義redrawAnnotations函數（在useEffect之前）
  const redrawAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing annotations
    annotations.forEach((annotation) => {
      const classInfo = classes.find((c) => c.id === annotation.class);
      if (!classInfo) return;

      ctx.strokeStyle = classInfo.color;
      ctx.fillStyle = classInfo.color + "20";
      ctx.lineWidth = 2;

      ctx.strokeRect(
        annotation.x,
        annotation.y,
        annotation.width,
        annotation.height
      );
      ctx.fillRect(
        annotation.x,
        annotation.y,
        annotation.width,
        annotation.height
      );
    });

    // Draw current box being drawn
    if (currentBox) {
      const currentClass = classes.find((c) => c.id === selectedClass) || classes[0] || {
        id: "default",
        name: "default",
        color: "#3b82f6"
      };
      ctx.strokeStyle = currentClass.color;
      ctx.fillStyle = currentClass.color + "20";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      ctx.strokeRect(
        currentBox.x,
        currentBox.y,
        currentBox.width,
        currentBox.height
      );
      ctx.fillRect(
        currentBox.x,
        currentBox.y,
        currentBox.width,
        currentBox.height
      );

      ctx.setLineDash([]);
    }
  }, [annotations, currentBox, selectedClass, classes]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match container
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        redrawAnnotations();
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [redrawAnnotations]);

  useEffect(() => {
    redrawAnnotations();
  }, [redrawAnnotations]);

  // Keep class page within bounds when classes change
  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(classes.length / CLASSES_PER_PAGE)
    );
    if (classPage > totalPages) {
      setClassPage(totalPages);
    }
  }, [classes, classPage, CLASSES_PER_PAGE]);

  // 如果沒有視頻ID，顯示錯誤信息
  if (!currentVideoId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Video Selected</h2>
          <p className="text-gray-600 mb-4">Please select a video to annotate from the upload page.</p>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">
              <strong>Debug Info:</strong><br/>
              Project ID: {projectId}<br/>
              Current Video ID: {currentVideoId}<br/>
              URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
            </p>
          </div>
          <div className="space-x-4">
            <Link 
              href={`/project/${id}/upload`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Go to Upload Page
            </Link>
            <button 
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentClass =
    classes.find((c) => c.id === selectedClass) || classes[0] || {
      id: "default",
      name: "default", 
      color: "#3b82f6"
    };
  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool !== "box") return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / imageScale;
    const y = (e.clientY - rect.top) / imageScale;

    setIsDrawing(true);
    setDrawStart({ x, y });
    setCurrentBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || selectedTool !== "box") return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

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
  };

  const handleMouseUp = () => {
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
  };

  const handleZoom = (newZoom: number) => {
    setZoom(newZoom);
    setImageScale(newZoom / 100);
  };


  const handleNextImage = async () => {
    if (currentImage < totalImages) {
      // 自動保存當前註釋（無論是否有註釋）
      await handleAutoSave();
      
      setCurrentImage((prev) => prev + 1);
      setAnnotations([]);
      // 獲取下一幀進行註釋
      await getNextFrameToAnnotate();
    } else {
      console.log('Already at the last image');
    }
  };

  // 禁用上一幀功能
  const handlePrevImage = () => {
    console.log('Previous frame navigation is disabled');
  };

  const handleNextVideo = async () => {
    if (currentVideo < totalVideos) {
      // 使用API獲取下一個視頻
      await getNextVideo();
    } else {
      console.log('Already at the last video');
    }
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
  };

  // 改善的自動保存功能（靜默保存，不顯示提示）
  const handleAutoSave = async () => {
    console.log("Auto-saving annotations:", annotations);
    setIsAutoSaving(true);
    setSaveStatus('saving');
    
    const projectId = Array.isArray(id) ? id[0] : id;
    if (!projectId || !currentVideoId) {
      console.warn('Cannot auto-save annotations: missing projectId or videoId');
      setIsAutoSaving(false);
      setSaveStatus('error');
      return;
    }

    try {
      const annotationData = {
        project_id: projectId,
        video_id: currentVideoId,
        frame_num: currentImage,
        bboxes: annotations.map(ann => ({
          class_name: ann.class,
          x: Number(ann.x),
          y: Number(ann.y),
          width: Number(ann.width),
          height: Number(ann.height)
        }))
      };

      console.log('Auto-saving annotation data:', annotationData);
      const result = await ApiService.saveAnnotation(annotationData);
      
      if (result.success) {
        console.log("Annotations auto-saved successfully", {
          savedAt: result.savedAt,
          bboxCount: annotations.length
        });
        setLastSavedTime(result.savedAt || getClientTimestamp());
        setSaveStatus('saved');
        // 靜默保存，不顯示任何提示
      } else {
        console.error("Failed to auto-save annotations:", result.message);
        setSaveStatus('error');
        // 將失敗的標註存到本地儲存作為備份
        saveToLocalStorage(annotationData);
      }
    } catch (error) {
      console.error('Error auto-saving annotations:', error);
      setSaveStatus('error');
      // 將標註存到本地儲存作為備份
      const annotationData = {
        project_id: projectId,
        video_id: currentVideoId,
        frame_num: currentImage,
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
      // 3秒後重置狀態
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // 本地儲存備份功能
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

  // 改善的手動保存功能
  const handleManualSave = async () => {
    console.log("Manual save requested:", annotations);
    
    const projectId = Array.isArray(id) ? id[0] : id;
    if (!projectId || !currentVideoId) {
      console.warn('Cannot save annotations: missing projectId or videoId');
      alert('Cannot save: Missing project or video information');
      return;
    }

    try {
      const annotationData = {
        project_id: projectId,
        video_id: currentVideoId,
        frame_num: currentImage,
        bboxes: annotations.map(ann => ({
          class_name: ann.class,
          x: Number(ann.x),
          y: Number(ann.y),
          width: Number(ann.width),
          height: Number(ann.height)
        }))
      };

      console.log('Manual saving annotation data:', annotationData);
      const result = await ApiService.saveAnnotation(annotationData);
      
      if (result.success) {
        console.log("Annotations saved successfully", {
          savedAt: result.savedAt,
          bboxCount: annotations.length
        });
        alert(`Annotations saved successfully! (${annotations.length} bounding boxes)`);
      } else {
        console.error("Failed to save annotations:", result.message);
        // 嘗試本地備份
        saveToLocalStorage(annotationData);
        alert(`Failed to save annotations: ${result.message || 'Unknown error'}. Data backed up locally.`);
      }
    } catch (error) {
      console.error('Error saving annotations:', error);
      // 嘗試本地備份
      const annotationData = {
        project_id: projectId,
        video_id: currentVideoId,
        frame_num: currentImage,
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
      "#ef4444",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#14b8a6",
      "#f97316",
      "#84cc16",
      "#06b6d4",
      "#8b5cf6",
      "#ec4899",
      "#f43f5e",
      "#6366f1",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
      "#14b8a6"
    ];
    
    // 首先嘗試使用預定義的調色板
    for (const c of palette) {
      if (!used.has(c.toLowerCase())) return c;
    }
    
    // 如果所有預定義顏色都被使用，使用確定性算法而不是隨機數
    const fallbackColors = [
      "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57",
      "#ff9ff3", "#54a0ff", "#5f27cd", "#00d2d3", "#ff9f43",
      "#ee5a24", "#0984e3", "#6c5ce7", "#a29bfe", "#fd79a8"
    ];
    
    for (const c of fallbackColors) {
      if (!used.has(c.toLowerCase())) return c;
    }
    
    // 最後的備用方案：使用確定性算法生成顏色
    const hash = used.size;
    const hue = (hash * 137.508) % 360; // 使用黃金角度確保顏色分佈均勻
    return `hsl(${Math.floor(hue)}, 70%, 50%)`;
  };

  const handleAddClass = async () => {
    const input = newClassName.trim();
    if (!input) return;
    const entries = input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    
    const projectId = Array.isArray(id) ? id[0] : id;
    if (!projectId) return;

    for (const entry of entries) {
      const [namePartRaw, colorPartRaw] = entry.split(":").map((s) => s.trim());
      const namePart = namePartRaw || "";
      if (!namePart) continue;
      
      let chosenColor = "#3b82f6"; // 默認顏色
      if (colorPartRaw && isValidHex(colorPartRaw)) {
        chosenColor = colorPartRaw.toLowerCase();
      }

      const generatedId = namePart.toLowerCase().replace(/\s+/g, "_");
      
      // 檢查是否已存在
      if (classes.some((c) => c.id === generatedId)) {
        console.log(`Class '${namePart}' already exists`);
        continue;
      }

      try {
        const result = await ApiService.addClass(projectId, namePart, chosenColor);
        console.log('📝 [ANNOTATE] Add class result:', result);
        
        if (result.success) {
          // 如果API返回了類別列表，直接使用
          if (result.classes && Array.isArray(result.classes)) {
            setClasses(result.classes);
            setSelectedClass(generatedId);
            console.log('✅ [ANNOTATE] Class added via API, using returned classes');
          } else {
            // 否則重新加載類別列表
            const classesData = await ApiService.getClasses(projectId);
            setClasses(classesData);
            setSelectedClass(generatedId);
            console.log('✅ [ANNOTATE] Class added via API, reloaded classes');
          }
        } else {
          console.error('❌ [ANNOTATE] API returned success=false:', result.message);
          alert(`Failed to add class: ${result.message}`);
        }
      } catch (error) {
        console.error('❌ [ANNOTATE] Error adding class via API:', error);
        alert(`Error adding class: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    setNewClassName("");
  };

  const handleDeleteClass = async (classId: string) => {
    const projectId = Array.isArray(id) ? id[0] : id;
    if (!projectId) return;

    const classToDelete = classes.find(c => c.id === classId);
    if (!classToDelete) return;

    try {
      const result = await ApiService.deleteClass(projectId, classToDelete.name);
      if (result.success) {
        // 重新加載類別列表
        const classesData = await ApiService.getClasses(projectId);
        setClasses(classesData);
        
        // 如果刪除的是當前選中的類別，選擇第一個可用的類別
        if (selectedClass === classId) {
          const remaining = classesData.filter((c) => c.id !== classId);
          setSelectedClass(remaining[0]?.id || "");
        }
      }
    } catch (error) {
      console.error('Error deleting class via API, using local fallback:', error);
      // 本地刪除作為後備
      setClasses((prev) => prev.filter((c) => c.id !== classId));
      if (selectedClass === classId) {
        const remaining = classes.filter((c) => c.id !== classId);
        setSelectedClass(remaining[0]?.id || "");
      }
    }
  };

  const isLastImage = currentImage >= totalImages;
  const isLastVideo = currentVideo >= totalVideos;
  const noNextFrames = isLastImage && isLastVideo;

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Images navigation as column */}
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
                      Next image
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
              <span className="font-semibold text-gray-700">
                Frame {currentImage} of {totalImages}
              </span>
            </div>

            <div className="w-px h-6 bg-gray-200" />

            {/* Videos navigation as column */}
            <div className="flex items-center space-x-3">
              <span className="font-semibold text-gray-700">
                Video {currentVideo} of {totalVideos}
              </span>
              <div className="flex flex-col space-y-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    if (currentVideo > 1) {
                      setCurrentVideo((prev) => prev - 1);
                      setCurrentImage(1);
                      setAnnotations([]);
                      setCurrentFrameImage(""); // 清空當前幀
                      // 重新檢查註釋狀態和加載第一幀
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
                  onClick={handleNextVideo}
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

        {/* Central Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Tools Row */}
          <div className="bg-gray-50 border-b border-gray-200 p-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-gray-700">Tools</span>
              {/* 註釋狀態顯示 */}
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
              {/* 改善的保存狀態指示器 */}
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
              <span className="text-sm font-medium min-w-[3rem] text-center">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom(Math.min(400, zoom + 25))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Image Viewer */}
          <div
            ref={containerRef}
            className="flex-1 relative bg-white overflow-hidden flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ cursor: selectedTool === "box" ? "crosshair" : "default" }}
          >
            {currentFrameImage ? (
              <img
                src={currentFrameImage}
                alt={`Frame ${currentImage}`}
                className="max-w-full max-h-full object-contain"
                style={{ transform: `scale(${imageScale})` }}
              />
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading frame...</p>
                </div>
              </div>
            )}

            {/* Annotation Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ transform: `scale(${imageScale})` }}
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar - Classes and Annotations */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Classes Section */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Classes</h3>
          <div className="flex items-center space-x-2 mb-3">
            <Input
              placeholder="New class name"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
            <Button
              onClick={handleAddClass}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {(() => {
              const totalPages = Math.max(
                1,
                Math.ceil(classes.length / CLASSES_PER_PAGE)
              );
              const startIdx = (classPage - 1) * CLASSES_PER_PAGE;
              const pageItems = classes.slice(
                startIdx,
                startIdx + CLASSES_PER_PAGE
              );
              return pageItems;
            })().map((cls) => (
              <div
                key={cls.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  selectedClass === cls.id
                    ? "bg-gray-100 border border-gray-300"
                    : "hover:bg-gray-50"
                }`}
              >
                <div
                  onClick={() => setSelectedClass(cls.id)}
                  className="flex items-center cursor-pointer"
                >
                  <div
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: cls.color }}
                  />
                  <span
                    className={`text-sm ${selectedClass === cls.id ? "font-semibold" : ""}`}
                  >
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
          {/* Pagination Controls for Classes */}
          {classes.length > CLASSES_PER_PAGE && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-600">
                Page {classPage} of{" "}
                {Math.max(1, Math.ceil(classes.length / CLASSES_PER_PAGE))}
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
                  onClick={() =>
                    setClassPage((p) =>
                      Math.min(
                        Math.max(
                          1,
                          Math.ceil(classes.length / CLASSES_PER_PAGE)
                        ),
                        p + 1
                      )
                    )
                  }
                  disabled={
                    classPage >=
                    Math.max(1, Math.ceil(classes.length / CLASSES_PER_PAGE))
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Current Annotations */}
        <div className="flex-1 p-4">
          <h3 className="font-semibold text-gray-800 mb-4">
            Current Annotations
          </h3>
          <div className="space-y-2">
            {annotations.map((annotation) => {
              const classInfo = classes.find((c) => c.id === annotation.class);
              return (
                <div
                  key={annotation.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: classInfo?.color }}
                    />
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

// 使用動態導入避免 SSR 問題
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
