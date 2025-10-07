"use client";

import React, { useEffect, useState } from "react";
import { Plus, Image, Video, RefreshCw } from "lucide-react";
import "../../css/dashboard.css";
import Link from "next/link";
import { getProjectsInfo, ProjectInfo } from "./get_project_info";
import NewProjectForm from "./NewProjectForm";
import { CircleDot } from "lucide-react";
import { log } from "@/lib/logger";
import { useProjectContext } from "@/contexts/ProjectContext";

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
  const { projects: contextProjects, refreshAllProjects, updateProject, isLoading: contextLoading, error: contextError } = useProjectContext();
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [isNewProjectFormOpen, setIsNewProjectFormOpen] = useState(false);
  const [userId, setUserId] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  // Load projects on mount and when context changes
  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      setApiError(null);
      
      try {
        const userId = 1;
        setUserId(userId);
        
        log.info('DASHBOARD', 'Starting project loading process', { userId });
        
        // If we have cached projects, show them immediately
        if (contextProjects.size > 0) {
          log.info('DASHBOARD', 'Using cached projects from context', { 
            count: contextProjects.size 
          });
          
          const cachedProjects: ProjectInfo[] = Array.from(contextProjects.values()).map(project => ({
            id: parseInt(project.id),
            name: project.name,
            videoCount: project.videoCount,
            imageCount: project.imageCount,
            description: project.description,
            status: project.status,
            isOwned: true
          }));
          
          setProjects(cachedProjects);
        }
        
        // If no cached projects, load from API first
        if (contextProjects.size === 0) {
          log.info('DASHBOARD', 'No cached projects, loading from API');
          const apiProjects = await getProjectsInfo(userId);
          
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
        } else {
          // Always try to refresh from API to get latest data
          log.info('DASHBOARD', 'Refreshing projects from API');
          await refreshAllProjects();
        }
        
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
  }, []); // Only run on mount

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

        {/* Main Grid */}
        <div className="dashboard-grid">
          {/* Projects Section */}
          <div className="projects-section">
            <div className="section-header">
              <h2 className="section-title">Recent Projects</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => refreshAllProjects()}
                  disabled={contextLoading}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${contextLoading ? 'animate-spin' : ''}`} />
                  {contextLoading ? 'Refreshing...' : 'Refresh All'}
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading projects...</span>
              </div>
            ) : (
              <div className="projects-grid">
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No projects found. Create your first project to get started!</p>
                  </div>
                ) : (
                  projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      id={project.id}
                      name={project.name}
                      videoCount={project.videoCount}
                      imageCount={project.imageCount}
                      description={project.description}
                      status={project.status}
                      isOwned={project.isOwned}
                    />
                  ))
                )}
              </div>
            )}
          </div>
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
