"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

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
  Settings,
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

export default function AnnotatePage() {
  const searchParams = useSearchParams();

  const videoId = searchParams.get("v");
  console.log("videoId is", videoId);

  /*fetch(things)*/
  /*
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
  }, []);*/

  //return <div>AnnotatePage, view {url}</div>;

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
    {
      id: "zebra_crossing_sign",
      name: "zebra_crossing_sign",
      color: "#8b5cf6",
    },
    { id: "traffic_light_red", name: "traffic_light_red", color: "#10b981" },
    { id: "stop_sign", name: "stop_sign", color: "#ef4444" },
  ]);
  const [newClassName, setNewClassName] = useState("");
  const [classPage, setClassPage] = useState(1);
  const CLASSES_PER_PAGE = 5;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentClass =
    classes.find((c) => c.id === selectedClass) || classes[4];

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
  }, []);

  const redrawAnnotations = () => {
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
  };

  useEffect(() => {
    redrawAnnotations();
  }, [annotations, currentBox, selectedClass]);

  // Keep class page within bounds when classes change
  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(classes.length / CLASSES_PER_PAGE)
    );
    if (classPage > totalPages) {
      setClassPage(totalPages);
    }
  }, [classes]);
  {
    /* I love vibe coding without ever looking at if it ever connects to other parts of the app!!!!!!!*/
  }
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
        id: Date.now().toString(),
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

  const handlePrevImage = () => {
    if (currentImage > 1) {
      setCurrentImage((prev) => prev - 1);
      setAnnotations([]);
    }
  };

  const handleNextImage = () => {
    if (currentImage < totalImages) {
      setCurrentImage((prev) => prev + 1);
      setAnnotations([]);
    }
  };

  const handleNextVideo = () => {
    if (currentVideo < totalVideos) {
      setCurrentVideo((prev) => prev + 1);
      setCurrentImage(1);
      setAnnotations([]);
    }
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
  };

  const handleSave = () => {
    console.log("Saving annotations:", annotations);
    // Implement save functionality
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
    ];
    for (const c of palette) {
      if (!used.has(c.toLowerCase())) return c;
    }
    // Fallback: generate random distinct hex not in used
    for (let i = 0; i < 100; i++) {
      const rand = `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, "0")}`;
      if (!used.has(rand.toLowerCase())) return rand;
    }
    // As a last resort, return a palette color (will duplicate if necessary)
    return palette[0];
  };

  const handleAddClass = () => {
    const input = newClassName.trim();
    if (!input) return;
    const entries = input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    let lastAddedId: string | null = null;
    const usedColors = new Set(classes.map((c) => c.color.toLowerCase()));

    const nextClasses = [...classes];

    for (const entry of entries) {
      const [namePartRaw, colorPartRaw] = entry.split(":").map((s) => s.trim());
      const namePart = namePartRaw || "";
      if (!namePart) continue;
      const generatedId = namePart.toLowerCase().replace(/\s+/g, "_");
      if (nextClasses.some((c) => c.id === generatedId)) {
        lastAddedId = generatedId;
        continue;
      }
      let chosenColor: string | undefined;
      if (colorPartRaw && isValidHex(colorPartRaw)) {
        const hex = colorPartRaw.toLowerCase();
        if (!usedColors.has(hex)) {
          chosenColor = hex;
        }
      }
      if (!chosenColor) {
        chosenColor = generateUniqueColor(usedColors);
      }
      usedColors.add(chosenColor.toLowerCase());
      nextClasses.push({ id: generatedId, name: namePart, color: chosenColor });
      lastAddedId = generatedId;
    }

    setClasses(nextClasses);
    if (lastAddedId) setSelectedClass(lastAddedId);
    // Jump to page containing the latest additions
    const totalPages = Math.max(
      1,
      Math.ceil(nextClasses.length / CLASSES_PER_PAGE)
    );
    setClassPage(totalPages);
    setNewClassName("");
  };

  const handleDeleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    if (selectedClass === id) {
      const remaining = classes.filter((c) => c.id !== id);
      setSelectedClass(remaining[0]?.id || "");
    }
  };

  /*setCurrentImage(
    fetch("http://localhost:5000/get_current_image", { body: videoId }).then(
      (res) => res.json()
    )
  );*/

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
                  disabled={currentImage <= 1}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev image
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextImage}
                  disabled={isLastImage}
                  className="flex items-center"
                >
                  Next image
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <span className="font-semibold text-gray-700">
                {currentImage} of {totalImages}
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
                  onClick={() => {
                    if (currentVideo > 1) {
                      setCurrentVideo((prev) => prev - 1);
                      setCurrentImage(1);
                      setAnnotations([]);
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
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Central Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Tools Row */}
          <div className="bg-gray-50 border-b border-gray-200 p-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-gray-700">Tools</span>
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
            <img
              ref={imageRef}
              src="https://via.placeholder.com/800x600/4f46e5/ffffff?text=Street+Scene+with+Stop+Sign"
              alt="Annotation target"
              className="max-w-full max-h-full object-contain"
              style={{ transform: `scale(${imageScale})` }}
            />

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
