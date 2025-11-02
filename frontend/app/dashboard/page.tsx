"use client";
import React, { useEffect, useState, useCallback, memo, useRef } from "react";
import { Plus, Image, Video, RefreshCw, LogOut, User } from "lucide-react";
import "../../css/dashboard.css";
import Link from "next/link";
import { getProjectsInfo, ProjectInfo } from "./get_project_info";
import { getProjectDetails, type ProjectDetails } from "./get_project_details";
import NewProjectForm from "./NewProjectForm";
import UserProjectsManager from "./UserProjectsManager";
import { CircleDot } from "lucide-react";
import { log } from "@/lib/logger";
import { apiRequest } from "@/lib/api-config";
import { useProjectContext } from "@/contexts/ProjectContext";
import { redirect, useRouter } from "next/navigation";

// === ProjectCard：支援即時更新 + memo 優化 ===
const ProjectCard = memo(
  ({
    id,
    name,
    videoCount,
    status,
    isOwned,
  }: {
    id: number;
    name: string;
    videoCount: number;
    status?: string;
    isOwned?: boolean;
  }) => {
    const [details, setDetails] = useState<ProjectDetails | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const loadDetails = useCallback(async () => {
      if (details || isLoadingDetails) return;

      setIsLoadingDetails(true);
      try {
        const freshDetails = await getProjectDetails(id);
        if (freshDetails) {
          setDetails(freshDetails);
        }
      } catch (error) {
        log.error("PROJECT_CARD", `Failed to load details for project ${id}`, {
          error,
        });
      } finally {
        setIsLoadingDetails(false);
      }
    }, [id, details]); // ← 正確依賴

    return (
      <Link
        className="project-card fade-in project-card-clickable"
        href={`/project/${id}/upload`}
        onMouseEnter={loadDetails}
      >
        <div className="project-header">
          <h3 className="project-title">{details?.["project name"] || name}</h3>
          <div className="project-id">ID: {id}</div>

          {isOwned !== undefined && (
            <div
              className="project-ownership"
              style={{
                fontSize: "0.8em",
                color: isOwned ? "#28a745" : "#ffc107",
                marginTop: "2px",
              }}
            >
              {isOwned ? "Owned" : "Shared"}
            </div>
          )}
        </div>

        <div className="media-stats">
          <div className="media-item">
            <div className="media-icon">
              <Video className="icon" />
            </div>
            <div className="media-info">
              <span className="media-count">
                {details?.["video count"] !== undefined
                  ? details["video count"]
                  : videoCount}
              </span>
              <span className="media-label">Videos</span>
            </div>
          </div>

          <div className="media-item">
            <div className="media-icon">
              <CircleDot className="icon" />
            </div>
            <div className="media-info">
              <span className="media-count">
                {details?.["status"] || status || "—"}
              </span>
              <span className="media-label">Status</span>
            </div>
          </div>
        </div>
      </Link>
    );
  },
  (prev, next) =>
    prev.id === next.id &&
    prev.name === next.name &&
    prev.videoCount === next.videoCount &&
    prev.status === next.status &&
    prev.isOwned === next.isOwned
);

// === Dashboard 主頁面 ===
export default function Dashboard() {
  const router = useRouter();
  const {
    projects: contextProjects,
    updateProject,
    isLoading: contextLoading,
    error: contextError,
  } = useProjectContext();
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [isNewProjectFormOpen, setIsNewProjectFormOpen] = useState(false);
  const [userId, setUserId] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  const lastLoadTimeRef = useRef<number>(0); // 記錄上次成功載入時間
  const isLoadingRef = useRef(false); // 防止重複 loading
  const loadIntervalRef = useRef<NodeJS.Timeout | null>(null); // 10秒定時器
  const stableUpdateProject = useCallback(updateProject, []); // 穩定化的 updateProject

  // kick out if not logged in
  // === 獲取用戶資訊 ===
  useEffect(() => {
    const getUserInfo = async () => {
      if (typeof window !== "undefined" && window.cookieStore) {
        const userIdCookie = await window.cookieStore.get("userId");
        const usernameCookie = await window.cookieStore.get("username");
        if (!usernameCookie) {
          console.warn("disjfkljkls");
          redirect("/login");
        }
        if (userIdCookie?.value) setUserId(parseInt(userIdCookie.value));
        if (usernameCookie?.value) setUsername(usernameCookie.value);
      }
    };
    getUserInfo();
  }, []);

  // === 完整節流載入函數 ===
  const loadProjectsWithThrottle = useCallback(async () => {
    // 步驟1：防止重複 loading
    if (isLoadingRef.current) {
      log.warn("DASHBOARD", "Load already in progress, skipping");
      return;
    }

    // 步驟2：10秒節流
    const now = Date.now();
    if (lastLoadTimeRef.current > 0 && now - lastLoadTimeRef.current < 10000) {
      log.info(
        "DASHBOARD",
        `Too soon to reload (${now - lastLoadTimeRef.current}ms)`
      );
      return;
    }

    // 步驟3：開始 loading
    isLoadingRef.current = true;
    setIsLoading(true);
    setApiError(null);

    try {
      if (userId <= 0) throw new Error("Invalid userId");

      const apiProjects = await getProjectsInfo(userId);

      // 更新 context
      apiProjects.forEach((project) => {
        stableUpdateProject(project.id.toString(), {
          id: project.id.toString(),
          name: project.name,
          videoCount: project.videoCount,
          status: project.status || "Active",
        });
      });

      // 更新本地狀態
      setProjects(apiProjects);
      lastLoadTimeRef.current = now;
      setLastUpdateTime(new Date());

      log.info("DASHBOARD", `Loaded ${apiProjects.length} projects`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      setApiError(`Failed to load projects: ${msg}`);
      log.error("DASHBOARD", "Load failed", { error, userId });
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [userId, stableUpdateProject]);

  // === 登出功能 ===
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apiRequest("/logout", { method: "POST" });
    } catch (error) {
      log.error("DASHBOARD", "Error during logout", { error });
    }
    if (typeof window !== "undefined" && window.cookieStore) {
      await window.cookieStore.delete("userId");
      await window.cookieStore.delete("username");
    }
    redirect("/login");
  };

  // === 初始載入 ===
  useEffect(() => {
    if (userId > 0) {
      loadProjectsWithThrottle();
    }
  }, [userId, loadProjectsWithThrottle]);

  // === 10秒自動更新 ===
  useEffect(() => {
    if (userId <= 0) return;

    const interval = setInterval(() => {
      loadProjectsWithThrottle();
    }, 10000);

    return () => clearInterval(interval);
  }, [userId, loadProjectsWithThrottle]);

  // === context 更新（僅顯示）===
  useEffect(() => {
    if (!isLoadingRef.current && contextProjects.size > 0) {
      const list = Array.from(contextProjects.values()).map((p) => ({
        id: parseInt(p.id),
        name: p.name,
        videoCount: p.videoCount,
        status: p.status,
        isOwned: true,
      }));
      setProjects(list);
    }
  }, [contextProjects]);

  // === 手動刷新按鈕 ===
  const handleManualRefresh = useCallback(() => {
    loadProjectsWithThrottle();
  }, [loadProjectsWithThrottle]);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-flex">
            <div className="flex items-center">
              <h1 className="header-title">My Projects</h1>
            </div>
            <div className="header-actions">
              {username && (
                <div className="flex items-center gap-2 mr-4 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Welcome, {username}</span>
                </div>
              )}
              <button
                className="btn-secondary flex items-center gap-2 mr-2"
                onClick={handleManualRefresh}
                disabled={isLoading}
                title="Refresh projects (updates every 10 seconds automatically)"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
              </button>
              <button
                className="btn-secondary flex items-center gap-2 mr-2"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut
                  className={`w-4 h-4 ${isLoggingOut ? "animate-spin" : ""}`}
                />
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </button>
              <button
                className="btn-primary"
                onClick={() => setIsNewProjectFormOpen(true)}
              >
                <Plus />
                <span>New Project</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="dashboard-main">
        {(apiError || contextError) && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
            <p className="text-sm">{apiError || contextError}</p>
          </div>
        )}

        <div className="dashboard-content">
          {/* 共享專案區塊（如果有 userId 才顯示） */}
          {userId > 0 && username && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Shared with Me</h2>{" "}
              {/* h2: 明顯標題 */}
              <UserProjectsManager
                userId={userId}
                username={username}
                onProjectClick={(projectId) => {
                  window.location.href = `/project/${projectId}/upload`;
                }}
                onCreateProject={() => setIsNewProjectFormOpen(true)}
              />
            </section>
          )}
        </div>
      </main>

      {/* New Project Modal */}
      <NewProjectForm
        isOpen={isNewProjectFormOpen}
        onClose={() => setIsNewProjectFormOpen(false)}
        userId={userId}
        onProjectCreated={(newProject) => {
          setProjects((prev) => [
            {
              ...newProject,
              status: (newProject as any).status ?? "Not started",
            },
            ...prev,
          ]);
        }}
      />
    </div>
  );
}
