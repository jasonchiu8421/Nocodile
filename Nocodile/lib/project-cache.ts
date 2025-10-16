// Project cache management utility
import { ProjectInfo } from './api';
import { log } from './logger';

export interface CachedProject {
  project_id: number;
  project_name: string;
  project_type: string;
  video_count: number;
  image_count: number;
  status: string;
  ownership: 'owned' | 'shared';
}

export class ProjectCache {
  private static CACHE_KEY = 'userProjects';
  private static CACHE_EXPIRY_KEY = 'userProjectsExpiry';
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Store projects in cache
   */
  static async setProjects(projects: CachedProject[]): Promise<void> {
    if (typeof window === 'undefined' || !window.cookieStore) {
      return;
    }

    try {
      const expiryTime = Date.now() + this.CACHE_DURATION;
      
      await window.cookieStore.set(this.CACHE_KEY, JSON.stringify(projects));
      await window.cookieStore.set(this.CACHE_EXPIRY_KEY, expiryTime.toString());
      
      log.info('PROJECT_CACHE', 'Projects cached successfully', { 
        projectCount: projects.length,
        expiryTime: new Date(expiryTime).toISOString()
      });
    } catch (error) {
      log.error('PROJECT_CACHE', 'Error caching projects', { error });
    }
  }

  /**
   * Get projects from cache
   */
  static async getProjects(): Promise<CachedProject[] | null> {
    if (typeof window === 'undefined' || !window.cookieStore) {
      return null;
    }

    try {
      // Check if cache is expired
      const expiryCookie = await window.cookieStore.get(this.CACHE_EXPIRY_KEY);
      if (expiryCookie?.value) {
        const expiryTime = parseInt(expiryCookie.value);
        if (Date.now() > expiryTime) {
          log.info('PROJECT_CACHE', 'Cache expired, clearing');
          await this.clearCache();
          return null;
        }
      }

      // Get cached projects
      const projectsCookie = await window.cookieStore.get(this.CACHE_KEY);
      if (projectsCookie?.value) {
        const projects = JSON.parse(projectsCookie.value);
        log.info('PROJECT_CACHE', 'Projects retrieved from cache', { 
          projectCount: projects.length 
        });
        return projects;
      }

      return null;
    } catch (error) {
      log.error('PROJECT_CACHE', 'Error reading cached projects', { error });
      return null;
    }
  }

  /**
   * Convert cached projects to ProjectInfo format
   */
  static convertToProjectInfo(cachedProjects: CachedProject[]): ProjectInfo[] {
    return cachedProjects.map(project => ({
      id: project.project_id,
      name: project.project_name,
      videoCount: project.video_count || 0,
      imageCount: project.image_count || 0,
      status: project.status || 'Active',
      description: project.project_type || 'No description',
      isOwned: project.ownership === 'owned'
    }));
  }

  /**
   * Clear project cache
   */
  static async clearCache(): Promise<void> {
    if (typeof window === 'undefined' || !window.cookieStore) {
      return;
    }

    try {
      await window.cookieStore.delete(this.CACHE_KEY);
      await window.cookieStore.delete(this.CACHE_EXPIRY_KEY);
      log.info('PROJECT_CACHE', 'Cache cleared successfully');
    } catch (error) {
      log.error('PROJECT_CACHE', 'Error clearing cache', { error });
    }
  }

  /**
   * Check if cache exists and is valid
   */
  static async hasValidCache(): Promise<boolean> {
    const projects = await this.getProjects();
    return projects !== null && projects.length >= 0;
  }

  /**
   * Update a specific project in cache
   */
  static async updateProject(projectId: number, updates: Partial<CachedProject>): Promise<void> {
    const projects = await this.getProjects();
    if (!projects) return;

    const projectIndex = projects.findIndex(p => p.project_id === projectId);
    if (projectIndex !== -1) {
      projects[projectIndex] = { ...projects[projectIndex], ...updates };
      await this.setProjects(projects);
      log.info('PROJECT_CACHE', 'Project updated in cache', { projectId, updates });
    }
  }

  /**
   * Add a new project to cache
   */
  static async addProject(project: CachedProject): Promise<void> {
    const projects = await this.getProjects();
    if (!projects) {
      await this.setProjects([project]);
    } else {
      projects.push(project);
      await this.setProjects(projects);
    }
    log.info('PROJECT_CACHE', 'Project added to cache', { projectId: project.project_id });
  }

  /**
   * Remove a project from cache
   */
  static async removeProject(projectId: number): Promise<void> {
    const projects = await this.getProjects();
    if (!projects) return;

    const filteredProjects = projects.filter(p => p.project_id !== projectId);
    await this.setProjects(filteredProjects);
    log.info('PROJECT_CACHE', 'Project removed from cache', { projectId });
  }
}
