"use client";

import React, { useEffect, useState } from "react";
import { Plus, Image, Video, RefreshCw, LogOut, User } from "lucide-react";
import "../../css/dashboard.css";
import Link from "next/link";
import { getProjectsInfo, ProjectInfo } from "./get_project_info";
import NewProjectForm from "./NewProjectForm";
import UserProjectsManager from "./UserProjectsManager";
import { CircleDot } from "lucide-react";
import { log } from "@/lib/logger";
import { apiRequest } from "@/lib/api-config";
import { useProjectContext } from "@/contexts/ProjectContext";
import { useRouter } from "next/navigation";

const ProjectCard = ({
  id,
  name,
  videoCount,
  imageCount,
  description,
  status,
  isOwned,
}: {
  id: number;
  name: string;
  videoCount: number;
  imageCount: number;
  description?: string;
  status?: string;
  isOwned?: boolean;
}) => {
  return (
    <Link
      className="project-card fade-in project-card-clickable"
      href={`/project/${id}/upload`}
    >
      <div className="project-header">
        <h3 className="project-title">{name}</h3>
        <div className="project-id">ID: {id}</div>
        {description && (
          <div className="project-type" style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
            Type: {description}
          </div>
        )}
        {isOwned !== undefined && (
          <div className="project-ownership" style={{ fontSize: '0.8em', color: isOwned ? '#28a745' : '#ffc107', marginTop: '2px' }}>
            {isOwned ? 'Owned' : 'Shared'}
          </div>
        )}
      </div>
      <div className="media-stats">
        <div className="media-item">
          <div className="media-icon">
            <Image className="icon" />
          </div>
          <div className="media-info">
            <span className="media-count">{imageCount}</span>
            <span className="media-label">Images</span>
          </div>
        </div>
        <div className="media-item">
          <div className="media-icon">
            <Video className="icon" />
          </div>
          <div className="media-info">
            <span className="media-count">{videoCount}</span>
            <span className="media-label">Videos</span>
          </div>
        </div>
        <div className="media-item">
          <div className="media-icon">
            <CircleDot className="icon" />
          </div>
          <div className="media-info">
            <span className="media-count">{status ?? "—"}</span>
            <span className="media-label">Status</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const { projects: contextProjects, refreshAllProjects, updateProject, isLoading: contextLoading, error: contextError } = useProjectContext();
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [isNewProjectFormOpen, setIsNewProjectFormOpen] = useState(false);
  const [userId, setUserId] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 獲取用戶信息
  useEffect(() => {
    const getUserInfo = async () => {
      if (typeof window !== 'undefined' && window.cookieStore) {
        try {
          const userIdCookie = await window.cookieStore.get("userId");
          const usernameCookie = await window.cookieStore.get("username");
          
          if (userIdCookie?.value) {
            setUserId(parseInt(userIdCookie.value));
          }
          if (usernameCookie?.value) {
            setUsername(usernameCookie.value);
          }
        } catch (error) {
          log.error('DASHBOARD', 'Error getting user info from cookies', { error });
        }
      }
    };
    
    getUserInfo();
  }, []);

  // 登出功能
  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      log.info('DASHBOARD', 'User logout initiated', { userId, username });
      
      // 調用後端登出端點
      const response = await apiRequest('/logout', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        log.info('DASHBOARD', 'Logout successful', { userId, username });
      } else {
        log.warn('DASHBOARD', 'Logout API returned error', { result });
      }
    } catch (error) {
      log.error('DASHBOARD', 'Error during logout API call', { error });
    }
    
    // 清除本地 cookie 和狀態
    if (typeof window !== 'undefined' && window.cookieStore) {
      try {
        await window.cookieStore.delete("userId");
        await window.cookieStore.delete("username");
      } catch (error) {
        log.error('DASHBOARD', 'Error clearing cookies', { error });
      }
    }
    
    // 重定向到首頁（登錄頁面）
    router.push("/");
  };

  // Load projects on mount and when context changes
  useEffect(() => {
    const loadProjects = async () => {
      // Only load if we have a valid userId
      if (userId <= 0) {
        log.warn('DASHBOARD', 'No valid userId, skipping project load');
        return;
      }

      setIsLoading(true);
      setApiError(null);
      
      try {
        log.info('DASHBOARD', 'Starting project loading process', { userId });
        
        // Always load fresh data from API for the current user
        log.info('DASHBOARD', 'Loading projects from API for user', { userId });
        const apiProjects = await getProjectsInfo(userId);
        
        log.info('DASHBOARD', 'Received projects from API', { 
          projectCount: apiProjects.length,
          userId 
        });
        
        // Add projects to context
        for (const project of apiProjects) {
          updateProject(project.id.toString(), {
            id: project.id.toString(),
            name: project.name,
            description: project.description || 'No description',
            videoCount: project.videoCount,
            imageCount: project.imageCount,
            status: project.status || 'Active'
          });
        }
        
        // Update local state
        setProjects(apiProjects);
        
      } catch (error) {
        log.error('DASHBOARD', 'Error loading projects', { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        setApiError(`Failed to load projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [userId, updateProject]); // Run when userId changes

  // Update local state when context projects change
  useEffect(() => {
    if (contextProjects.size > 0) {
      const refreshedProjects: ProjectInfo[] = Array.from(contextProjects.values()).map(project => ({
        id: parseInt(project.id),
        name: project.name,
        videoCount: project.videoCount,
        imageCount: project.imageCount,
        description: project.description,
        status: project.status,
        isOwned: true
      }));
      
      setProjects(refreshedProjects);
      
      log.info('DASHBOARD', 'Updated projects from context', { 
        projectCount: refreshedProjects.length,
        projects: refreshedProjects.map(p => ({ id: p.id, name: p.name }))
      });
    }
  }, [contextProjects]);
  // Turn into fetch in the future

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
              {/* 用戶信息 */}
              {username && (
                <div className="flex items-center gap-2 mr-4 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Welcome, {username}</span>
                </div>
              )}
              
              {/* 登出按鈕 */}
              <button
                className="btn-secondary flex items-center gap-2 mr-2"
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Logout"
              >
                <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
              
              {/* 新建項目按鈕 */}
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

      {/* Main Content */}
      <main className="dashboard-main">
        {/* API Error Banner */}
        {(apiError || contextError) && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm">
                  {apiError || contextError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="dashboard-content">
          {/* User Projects Manager */}
          {userId > 0 && username && (
            <UserProjectsManager
              userId={userId}
              username={username}
              onProjectClick={(projectId) => {
                // Navigate to project upload page
                window.location.href = `/project/${projectId}/upload`;
              }}
              onCreateProject={() => setIsNewProjectFormOpen(true)}
            />
          )}
        </div>
      </main>

      {/* New Project Form Modal */}
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
