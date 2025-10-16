import { ApiService } from '../../lib/api';
import { apiRequest } from '../../lib/api-config';
import type { ProjectInfo } from '../../lib/api';
import { log } from '../../lib/logger';

export type StatusType =
  | "No uploads"
  | "Annotating"
  | "Annotation Completed"
  | "Training"
  | "Finish training"
  | "Complete";

export { ProjectInfo };

export async function getProjectsInfo(userId: number): Promise<ProjectInfo[]> {
  try {
    log.info('PROJECT_INFO', 'Fetching projects for user', { userId });
    
    // Use the new API configuration system
    const response = await apiRequest('/get_projects_info', {
      method: 'POST',
      body: JSON.stringify({ userID: userId.toString() })
    });

    if (!response.ok) {
      log.warn('PROJECT_INFO', 'API returned error status', { 
        status: response.status,
        userId 
      });
      return [];
    }

    const data = await response.json();
    log.info('PROJECT_INFO', 'Received projects data', { 
      ownedProjects: data['owned projects']?.length || 0,
      sharedProjects: data['shared projects']?.length || 0,
      userId 
    });

    // Transform the response to match our ProjectInfo interface
    const ownedProjects = data['owned projects'] || [];
    const sharedProjects = data['shared projects'] || [];
    
    const allProjects = [...ownedProjects, ...sharedProjects];
    const projectDetails = allProjects.map((project: any) => ({
      id: project.project_id || project.id,
      name: project.project_name || 'Unknown Project',
      videoCount: project.video_count || 0,
      imageCount: project.image_count || 0,
      status: project.project_status || project.status || 'Unknown',
      description: project.project_type || 'No description',
      isOwned: project.ownership === 'owned',
    }));

    log.info('PROJECT_INFO', 'Successfully processed projects', { 
      totalProjects: projectDetails.length,
      userId 
    });

    return projectDetails;
  } catch (error) {
    log.error('PROJECT_INFO', 'Error fetching projects', { 
      error: error instanceof Error ? error.message : String(error),
      userId 
    });
    return [];
  }
}
