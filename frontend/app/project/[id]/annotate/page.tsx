"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
<<<<<<< HEAD
import { useParams } from "next/navigation";
=======
import { useParams, useRouter } from "next/navigation";
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
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
<<<<<<< HEAD
  x: number;
  y: number;
  width: number;
  height: number;
=======
    x: number;
    y: number;
    width: number;
    height: number;
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
  color: string;
}

interface Class {
  id: string;
  name: string;
  color: string;
}

function AnnotatePageContent() {
  const { id } = useParams();
<<<<<<< HEAD
=======
  const router = useRouter();
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
  const [currentFrameImage, setCurrentFrameImage] = useState<string>("");
  const [currentFrame, setCurrentFrame] = useState(0);
  const [currentImage, setCurrentImage] = useState(1);
  const [totalImages, setTotalImages] = useState(150); // 動態總幀數
<<<<<<< HEAD
=======
  const [currentVideo, setCurrentVideo] = useState(1);
  const [totalVideos, setTotalVideos] = useState(1); // 初始值设为1，后续从后端获取真实值
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
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
<<<<<<< HEAD
        const videos = await ApiService.getUploadedVideos(safeProjectId);
        if (videos && videos.length > 0) {
          const firstVideo = videos[0];
          // 後端返回的數據結構：{name, file, path, url}，其中 file 是 video_id
          const videoId = firstVideo.video_id || firstVideo.id || firstVideo.file_id;
          if (videoId && videoId !== "undefined" && videoId !== "" && videoId !== undefined) { 
=======
        const videos = await ApiService.getProjectVideos(parseInt(safeProjectId));
        // 更新视频总数
        if (videos && videos.length > 0) {
          setTotalVideos(videos.length);
          console.log(`📹 [ANNOTATE] Total videos in project: ${videos.length}`);
        } else {
          setTotalVideos(0);
          console.warn('⚠️ [ANNOTATE] No videos found in project');
        }
        
        if (videos && videos.length > 0) {
          const firstVideo = videos[0];
          // 後端返回的數據結構：{name, video_id, path, url}
          const videoId = firstVideo.video_id;
          if (videoId !== undefined && videoId !== null && videoId !== 0) { 
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
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
<<<<<<< HEAD
      } catch (error) {
=======
  } catch (error) {
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
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

<<<<<<< HEAD
=======
  // 监听当前视频状态，如果完成则检查所有视频
  useEffect(() => {
    if (annotationStatus === 'manual annotation completed' || annotationStatus === 'completed') {
      console.log('📊 [STATUS] Current video completed, checking all videos...');
      // 延迟检查，确保后端状态已更新
      const timer = setTimeout(() => {
        checkAllVideosCompleted();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [annotationStatus, safeProjectId]); // 添加 safeProjectId 作为依赖，确保项目变化时也检查

  // 页面加载时，如果状态已经是完成，也检查一次
  useEffect(() => {
    if (safeProjectId && currentVideoId && 
        (annotationStatus === 'manual annotation completed' || annotationStatus === 'completed')) {
      console.log('📊 [INIT] Video already completed on page load, checking all videos...');
      const timer = setTimeout(() => {
        checkAllVideosCompleted();
      }, 2000); // 延迟更久，确保页面完全加载
      return () => clearTimeout(timer);
    }
  }, [safeProjectId, currentVideoId]); // 只在项目或视频变化时检查

>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
  const checkAnnotationStatus = async () => {
    try {
      if (safeProjectId && currentVideoId) {
        const statusData = await ApiService.checkAnnotationStatus(safeProjectId, currentVideoId);
        if (statusData && typeof statusData === 'object') {
<<<<<<< HEAD
          setAnnotationStatus(statusData["annotation status"] || "not yet started");
          setLastAnnotatedFrame(statusData["last annotated frame"] || 0);
          console.log('Annotation status:', statusData);
=======
          const newStatus = statusData["annotation status"] || "not yet started";
          const newLastFrame = statusData["last annotated frame"] || 0;
          setAnnotationStatus(newStatus);
          setLastAnnotatedFrame(newLastFrame);
          console.log('📊 [STATUS] Annotation status updated:', { status: newStatus, lastFrame: newLastFrame });
          
          // 如果当前视频已完成，立即检查所有视频（但不要重复检查）
          if ((newStatus === 'manual annotation completed' || newStatus === 'completed') && 
              (annotationStatus !== 'manual annotation completed' && annotationStatus !== 'completed')) {
            console.log('🎉 [STATUS] Video just completed, will check all videos...');
            // 延迟检查，确保状态已更新
            setTimeout(() => {
              checkAllVideosCompleted();
            }, 800);
          }
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
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
          
<<<<<<< HEAD
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
=======
          // 計算關鍵幀索引（從1開始）
          // 視頻幀號（frame_num）需要轉換為關鍵幀索引
          // 例如：視頻幀號30，FPS=30，關鍵幀索引 = (30/30) + 1 = 2
          const fps = frameData.fps || 30; // 默認30 FPS
          let videoFrameNum = 0;
          let keyFrameIndex = 1;
          
          // 優先使用 frame_id，如果沒有則使用 frame_num
          if (frameData.frame_id !== undefined) {
            videoFrameNum = frameData.frame_id;
          } else if (frameData.frame_num !== undefined) {
            videoFrameNum = frameData.frame_num;
          }
          
          // 計算關鍵幀索引：關鍵幀索引 = (視頻幀號 / FPS) + 1
          if (fps > 0 && videoFrameNum >= 0) {
            keyFrameIndex = Math.floor(videoFrameNum / fps) + 1;
          }
          
          setCurrentFrame(videoFrameNum);
          setCurrentImage(keyFrameIndex);
          console.log(`✅ [FRONTEND] Key frame loaded: video frame ${videoFrameNum} (key frame ${keyFrameIndex}/${frameData.total_frames}, fps=${fps})`);
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
        } else {
          console.log('❌ [FRONTEND] No image returned, possible end of video');
          setCurrentFrameImage("");
          setAnnotationStatus("completed");
<<<<<<< HEAD
        }
      } else {
        console.log('❌ [FRONTEND] API returned success=false:', frameData?.message);
=======
          // 检查是否所有视频都已完成标注
          checkAllVideosCompleted();
        }
      } else {
        console.log('❌ [FRONTEND] API returned success=false:', frameData?.message);
        if (frameData?.message === "All frames have been annotated.") {
          setAnnotationStatus("completed");
          // 检查是否所有视频都已完成标注
          checkAllVideosCompleted();
        }
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
        setCurrentFrameImage("");
      }
    } catch (error) {
      console.error('Error getting next frame:', error);
      
      // 檢查是否為431錯誤或其他網路錯誤
      if (error instanceof Error && error.message && error.message.includes('431')) {
        console.warn('⚠️ [FRONTEND] 431 Request Header Fields Too Large - using fallback mechanism');
<<<<<<< HEAD
        // 清除可能過大的本地存儲
        try {
          localStorage.removeItem('large_session_data');
          sessionStorage.clear();
        } catch (storageError) {
=======
          // 清除可能過大的本地存儲
          try {
            localStorage.removeItem('large_session_data');
            sessionStorage.clear();
          } catch (storageError) {
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
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

<<<<<<< HEAD
=======
  const checkAllVideosCompleted = async () => {
    try {
      // 检查所有视频是否都已完成标注
      if (safeProjectId) {
        console.log('🔍 [CHECK] Checking if all videos are completed...');
        const videos = await ApiService.getProjectVideos(parseInt(safeProjectId));
        console.log(`📹 [CHECK] Found ${videos.length} video(s) in project`);
        
        if (videos.length === 0) {
          console.log('⚠️ [CHECK] No videos found in project');
          return;
        }
        
        let allCompleted = true;
        const videoStatuses: { [key: number]: string } = {};
        
        for (const video of videos) {
          try {
            const statusData = await ApiService.checkAnnotationStatus(
              safeProjectId,
              video.video_id.toString()
            );
            if (statusData && statusData['annotation status']) {
              const status = statusData['annotation status'];
              videoStatuses[video.video_id] = status;
              console.log(`📊 [CHECK] Video ${video.video_id} status: ${status}`);
              if (status !== 'completed' && status !== 'manual annotation completed') {
                allCompleted = false;
                console.log(`⏳ [CHECK] Video ${video.video_id} is not completed yet`);
              }
            } else {
              allCompleted = false;
              console.log(`❌ [CHECK] Video ${video.video_id} has no status data`);
              break;
            }
          } catch (error) {
            console.error(`❌ [CHECK] Error checking video ${video.video_id}:`, error);
            allCompleted = false;
            break;
          }
        }
        
        console.log(`✅ [CHECK] All videos completed: ${allCompleted}`);
        console.log(`📋 [CHECK] Video statuses:`, videoStatuses);
        
        if (allCompleted && videos.length > 0) {
          console.log('🎉 [ANNOTATE] All videos completed! Showing confirmation dialog...');
          // 显示完成提示并询问是否跳转到训练页面
          const shouldGoToTrain = confirm('🎉 所有视频标注已完成！\n\n是否跳转到训练页面？\n\n点击"确定"跳转，点击"取消"继续查看。');
          if (shouldGoToTrain) {
            console.log('🚀 [ANNOTATE] User confirmed, navigating to train page...');
            router.push(`/project/${safeProjectId}/train`);
          } else {
            console.log('⏸️ [ANNOTATE] User cancelled navigation');
          }
        } else {
          console.log(`⏳ [CHECK] Not all videos completed yet (${videos.length} total)`);
        }
      }
    } catch (error) {
      console.error('❌ [ANNOTATE] Error checking all videos completed:', error);
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
          console.log('✅ [ANNOTATE] Next video loaded:', videoData);
        } else {
          console.log('⚠️ [ANNOTATE] No next video available:', videoData?.message || 'Unknown error');
          // 如果没有下一个视频，检查是否所有视频都已完成
          await checkAllVideosCompleted();
          if (!videoData?.message || !videoData.message.includes('没有更多视频')) {
            alert(videoData?.message || '没有更多视频了');
          }
        }
      } else {
        console.log('⚠️ [ANNOTATE] Already at last video or no videos available');
        // 检查是否所有视频都已完成
        await checkAllVideosCompleted();
      }
    } catch (error) {
      console.error('❌ [ANNOTATE] Error getting next video:', error);
    }
  };

>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
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

<<<<<<< HEAD
  const handleMouseUp = (e: React.MouseEvent) => {
=======
  const handleMouseUp = async (e: React.MouseEvent) => {
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
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
<<<<<<< HEAD
      setAnnotations((prev) => [...prev, newAnnotation]);
=======
      const updatedAnnotations = [...annotations, newAnnotation];
      setAnnotations(updatedAnnotations);
      
      // 自动保存标注（延迟保存，避免频繁请求）
      setTimeout(async () => {
        try {
          if (!safeProjectId || !currentVideoId) {
            console.warn('Cannot auto-save: missing projectId or videoId');
            return;
          }
          const annotationData = {
            project_id: safeProjectId,
            video_id: currentVideoId,
            frame_num: currentFrame,
            bboxes: updatedAnnotations.map(ann => ({
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
            console.log('✅ [AUTO-SAVE] Annotation saved after drawing:', { savedAt: result.savedAt, bboxCount: updatedAnnotations.length });
            
            // 如果标注完成，更新状态并检查是否所有视频都已完成
            if (result.is_completed) {
              console.log('🎉 [AUTO-SAVE] Video annotation completed!');
              setAnnotationStatus(result.annotation_status || 'completed');
              setLastAnnotatedFrame(result.last_annotated_frame || currentFrame);
              // 延迟检查所有视频是否完成，给后端时间更新状态
              setTimeout(() => {
                checkAllVideosCompleted();
              }, 500);
            }
          } else {
            console.warn('⚠️ [AUTO-SAVE] Failed to save annotation:', result.message);
            setSaveStatus('error');
          }
        } catch (error) {
          console.error('❌ [AUTO-SAVE] Error saving annotation:', error);
          setSaveStatus('error');
        }
      }, 500); // 延迟500ms保存，避免频繁请求
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
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
<<<<<<< HEAD
    if (currentFrame < totalImages - 1) { // 使用 currentFrame 和 totalImages
      await handleAutoSave();
      setAnnotations([]);
      await getNextFrameToAnnotate();
      setCurrentImage((prev) => prev + 1);
      console.log(`🔄 [FRONTEND] Key frame updated: ${currentFrame + 1}/${totalImages}`);
    } else {
      console.log('Already at the last frame, switching to next video');
=======
    // 使用 currentImage（关键帧索引）而不是 currentFrame（视频帧号）来判断
    if (currentImage < totalImages) {
      // 先保存当前帧的标注
      console.log('💾 [FRONTEND] Saving annotations before moving to next frame...');
      await handleAutoSave();
      
      // 等待保存完成（给一点时间确保保存成功）
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 清空当前标注
      setAnnotations([]);
      
      // 获取下一帧（这会自动更新 currentImage）
      console.log('🔄 [FRONTEND] Loading next frame...');
      await getNextFrameToAnnotate();
      
      console.log(`✅ [FRONTEND] Key frame updated: ${currentImage}/${totalImages}`);
    } else {
      console.log('📹 [FRONTEND] Already at the last frame, checking if all videos completed...');
      // 保存当前帧的标注
      await handleAutoSave();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 重新检查标注状态
      await checkAnnotationStatus();
      
      // 尝试切换到下一个视频
      await getNextVideo();
      
      // 如果没有下一个视频，检查是否所有视频都已完成
      // getNextVideo 内部已经会调用 checkAllVideosCompleted，但为了确保，我们也在这里检查一次
      if (currentVideo >= totalVideos) {
        // 再次检查状态，确保获取最新状态
        await checkAnnotationStatus();
        await checkAllVideosCompleted();
      }
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
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
<<<<<<< HEAD
=======
        
        // 如果标注完成，更新状态并检查是否所有视频都已完成
        if (result.is_completed) {
          console.log('🎉 [AUTO-SAVE] Video annotation completed!');
          setAnnotationStatus(result.annotation_status || 'completed');
          setLastAnnotatedFrame(result.last_annotated_frame || currentFrame);
          // 延迟检查所有视频是否完成，给后端时间更新状态
          setTimeout(() => {
            checkAllVideosCompleted();
          }, 500);
        } else if (result.annotation_status) {
          // 更新状态（即使未完成）
          setAnnotationStatus(result.annotation_status);
          setLastAnnotatedFrame(result.last_annotated_frame || currentFrame);
        }
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
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
<<<<<<< HEAD
      } catch (error) {
=======
    } catch (error) {
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
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

<<<<<<< HEAD
  const isLastImage = currentFrame >= totalImages - 1;
=======
  const isLastImage = currentImage >= totalImages;
  const isLastVideo = currentVideo >= totalVideos;
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f

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
<<<<<<< HEAD
=======
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
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
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
<<<<<<< HEAD
                <span className="text-gray-600">state:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  annotationStatus === "not yet started" ? "bg-gray-200 text-gray-700" :
                  annotationStatus === "in progress" ? "bg-yellow-200 text-yellow-700" :
                  annotationStatus === "completed" ? "bg-green-200 text-green-700" :
=======
                <span className="text-gray-600">狀態:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  annotationStatus === "not yet started" ? "bg-gray-200 text-gray-700" :
                  annotationStatus === "in progress" ? "bg-yellow-200 text-yellow-700" :
                  annotationStatus === "completed" || annotationStatus === "manual annotation completed" ? "bg-green-200 text-green-700" :
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
                  "bg-blue-200 text-blue-700"
                }`}>
                  {annotationStatus}
                </span>
<<<<<<< HEAD
                <span className="text-gray-600">last annotated frame: {lastAnnotatedFrame}</span>
                {saveStatus === 'saving' ? (
                  <span className="text-blue-600 text-xs flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                    Saving automatically...
=======
                <span className="text-gray-600">最後註釋幀: {lastAnnotatedFrame}</span>
                {(annotationStatus === "completed" || annotationStatus === "manual annotation completed") && (
                  <Button
                    onClick={async () => {
                      await checkAllVideosCompleted();
                    }}
                    size="sm"
                    className="ml-2 bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    🎉 前往训练页面
                  </Button>
                )}
                {saveStatus === 'saving' ? (
                  <span className="text-blue-600 text-xs flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                    自動保存中...
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
                  </span>
                ) : saveStatus === 'saved' ? (
                  <span className="text-green-600 text-xs flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
<<<<<<< HEAD
                    saved{lastSavedTime ? new Date(lastSavedTime).toLocaleTimeString() : ''}
=======
                    已保存 {lastSavedTime ? new Date(lastSavedTime).toLocaleTimeString() : ''}
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
                  </span>
                ) : saveStatus === 'error' ? (
                  <span className="text-red-600 text-xs flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
<<<<<<< HEAD
                    Failed to save (backed up locally)
                  </span>
                ) : (
                  <span className="text-green-600 text-xs">✓ Autosave is enabled</span>
=======
                    保存失敗 (已備份到本地)
                  </span>
                ) : (
                  <span className="text-green-600 text-xs">✓ 自動保存已啟用</span>
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={selectedTool === "select" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTool("select")}
                  className="flex items-center"
                >
<<<<<<< HEAD
                  <Square className="w-4 h-4 mr-1" />
                  Box
=======
                  <MousePointer className="w-4 h-4 mr-1" />
                  Select
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
                </Button>
                <Button
                  variant={selectedTool === "box" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTool("box")}
                  className="flex items-center"
                >
<<<<<<< HEAD
                  <MousePointer className="w-4 h-4 mr-1" />
                  Select
=======
                  <Square className="w-4 h-4 mr-1" />
                  Box
>>>>>>> 4b0b29dd73b0423ffd1b03ad0ac276adbdf0714f
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