"use client";
import React, { useState, useEffect } from "react";
import { RefreshCw, Plus, FolderOpen, Users, Crown, Share2 } from "lucide-react";
import { ProjectInfo } from "../../lib/api";
import { getProjectsInfo } from "./get_project_info";
import { log } from "../../lib/logger";
import { ProjectCache } from "../../lib/project-cache";
import ProjectShareModal from "./ProjectShareModal";

interface UserProjectsManagerProps {
  userId: number;
  username: string;
  onProjectClick: (projectId: number) => void;
  onCreateProject: () => void;
}

export default function UserProjectsManager({
  userId,
  username,
  onProjectClick,
  onCreateProject
}: UserProjectsManagerProps) {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);

  const loadProjects = async () => {
    if (userId <= 0) return;
    setIsLoading(true);
    setError(null);
    try {
      log.info('USER_PROJECTS', 'Loading projects for user', { userId, username });

      let userProjects: ProjectInfo[] = [];
      const cachedProjects = await ProjectCache.getProjects();
      if (cachedProjects && cachedProjects.length > 0) {
        userProjects = ProjectCache.convertToProjectInfo(cachedProjects);
        log.info('USER_PROJECTS', 'Using cached projects', {
          userId,
          username,
          projectCount: userProjects.length
        });
      } else {
        log.info('USER_PROJECTS', 'No cached projects, fetching from API');
        userProjects = await getProjectsInfo(userId);

        // === 修正點：正確映射到 ProjectCache 格式 ===
        if (userProjects.length > 0) {
          const projectsToCache = userProjects.map(project => ({
            project_id: project.id,                    // ← 正確
            project_name: project.name,                // ← 正確
            video_count: project.videoCount,   // ← 正確
            project_type: "object_dectection",    //hard code now JimmyFix
            status: project.status || 'Active', // ← 防 undefined
            ownership: project.isOwned ? 'owned' : 'shared' as 'owned' | 'shared'
          }));

          try {
            await ProjectCache.setProjects(projectsToCache);
            log.info('PROJECT_CACHE', 'Projects cached successfully', { count: projectsToCache.length });
          } catch (cacheError) {
            log.warn('PROJECT_CACHE', 'Failed to cache projects', { cacheError });
          }
        }
      }

      log.info('USER_PROJECTS', 'Projects loaded successfully', {
        userId,
        username,
        projectCount: userProjects.length
      });
      setProjects(userProjects);
      setLastUpdated(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('USER_PROJECTS', 'Error loading projects', {
        userId,
        username,
        error: errorMessage
      });
      setError(`Failed to load projects: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [userId]);
  
  const handleShareProject = (project: ProjectInfo) => {
    setSelectedProject(project);
    setShareModalOpen(true);
  };

  const handleShareSuccess = () => {
    loadProjects();
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
    setSelectedProject(null);
  };

  const ownedProjects = projects.filter(p => p.isOwned === true);
  const sharedProjects = projects.filter(p => p.isOwned === false);

  return (
    <div className="user-projects-manager">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {username}'s Projects
            </h2>
          </div>
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading projects...</span>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && (
        <div className="space-y-6">
          {/* Owned Projects */}
          {ownedProjects.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Crown className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-medium text-gray-900">
                  Owned Projects ({ownedProjects.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ownedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => onProjectClick(project.id)}
                    onShare={() => handleShareProject(project)}
                    canShare={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Shared Projects */}
          {sharedProjects.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Users className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-medium text-gray-900">
                  Shared Projects ({sharedProjects.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sharedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => onProjectClick(project.id)}
                    canShare={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Projects */}
          {projects.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No projects found
              </h3>
              <p className="text-gray-600 mb-4">
                Get started by creating your first project
              </p>
              <button
                onClick={onCreateProject}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Project</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Share Modal */}
      {selectedProject && (
        <ProjectShareModal
          isOpen={shareModalOpen}
          onClose={handleCloseShareModal}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          onShareSuccess={handleShareSuccess}
        />
      )}
    </div>
  );
}

// === ProjectCard ===
interface ProjectCardProps {
  project: ProjectInfo;
  onClick: () => void;
  onShare?: () => void;
  canShare?: boolean;
}

function ProjectCard({ project, onClick, onShare, canShare = false }: ProjectCardProps) {
  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.();
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 truncate">{project.name}</h4>
          <span className="text-xs text-gray-500">#{project.id}</span>
        </div>
        {canShare && onShare && (
          <button
            onClick={handleShareClick}
            className="ml-2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Share project"
          >
            <Share2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>{project.videoCount} videos</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${
          project.status === 'Active' ? 'bg-green-100 text-green-800' :
          project.status === 'Training' ? 'bg-blue-100 text-blue-800' :
          project.status === 'Complete' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {project.status || 'Unknown'}
        </span>
      </div>
    </div>
  );
}