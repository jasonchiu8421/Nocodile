"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiService } from '@/lib/api';
import { log } from '@/lib/logger';

interface ProjectDetails {
  id: string;
  name: string;
  description: string;
  videoCount: number;
  imageCount: number;
  status: string;
  lastUpdated: string;
}

interface ProjectContextType {
  projects: Map<string, ProjectDetails>;
  getProject: (projectId: string) => ProjectDetails | null;
  updateProject: (projectId: string, details: Partial<ProjectDetails>) => void;
  refreshProject: (projectId: string) => Promise<void>;
  refreshAllProjects: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<Map<string, ProjectDetails>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load projects from localStorage on mount
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem('nocodile_projects');
        if (stored) {
          const parsed = JSON.parse(stored);
          const projectMap = new Map<string, ProjectDetails>();
          
          Object.entries(parsed).forEach(([key, value]) => {
            projectMap.set(key, value as ProjectDetails);
          });
          
          setProjects(projectMap);
          log.info('PROJECT_CONTEXT', 'Loaded projects from localStorage', { 
            count: projectMap.size 
          });
        }
      } catch (error) {
        log.error('PROJECT_CONTEXT', 'Failed to load projects from localStorage', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    };

    loadFromStorage();
  }, []);

  // Save projects to localStorage whenever projects change
  useEffect(() => {
    try {
      const projectsObj = Object.fromEntries(projects);
      localStorage.setItem('nocodile_projects', JSON.stringify(projectsObj));
      log.debug('PROJECT_CONTEXT', 'Saved projects to localStorage', { 
        count: projects.size 
      });
    } catch (error) {
      log.error('PROJECT_CONTEXT', 'Failed to save projects to localStorage', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }, [projects]);

  const getProject = (projectId: string): ProjectDetails | null => {
    return projects.get(projectId) || null;
  };

  const updateProject = (projectId: string, details: Partial<ProjectDetails>) => {
    setProjects(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(projectId) || {
        id: projectId,
        name: 'Loading...',
        description: 'Loading...',
        videoCount: 0,
        imageCount: 0,
        status: 'Unknown',
        lastUpdated: new Date().toISOString()
      };
      
      const updated = {
        ...existing,
        ...details,
        lastUpdated: new Date().toISOString()
      };
      
      newMap.set(projectId, updated);
      return newMap;
    });
  };

  const refreshProject = async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      log.info('PROJECT_CONTEXT', 'Refreshing project details', { projectId });
      
      const projectDetails = await ApiService.getProjectDetails(parseInt(projectId));
      
      const updatedDetails: ProjectDetails = {
        id: projectId,
        name: projectDetails["project name"] || "Unknown Project",
        description: projectDetails["project type"] || "No description available",
        videoCount: projectDetails["video count"] || 0,
        imageCount: 0, // API doesn't provide image count
        status: projectDetails["status"] || "Active",
        lastUpdated: new Date().toISOString()
      };
      
      updateProject(projectId, updatedDetails);
      
      log.info('PROJECT_CONTEXT', 'Project details refreshed successfully', { 
        projectId, 
        name: updatedDetails.name 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('PROJECT_CONTEXT', 'Failed to refresh project details', { 
        projectId, 
        error: errorMessage 
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAllProjects = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      log.info('PROJECT_CONTEXT', 'Refreshing all projects');
      
      // Get all project IDs from current projects
      const projectIds = Array.from(projects.keys());
      
      if (projectIds.length === 0) {
        log.info('PROJECT_CONTEXT', 'No projects to refresh');
        return;
      }
      
      // Refresh each project
      await Promise.all(projectIds.map(id => refreshProject(id)));
      
      log.info('PROJECT_CONTEXT', 'All projects refreshed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('PROJECT_CONTEXT', 'Failed to refresh all projects', { 
        error: errorMessage 
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const value: ProjectContextType = {
    projects,
    getProject,
    updateProject,
    refreshProject,
    refreshAllProjects,
    isLoading,
    error
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
