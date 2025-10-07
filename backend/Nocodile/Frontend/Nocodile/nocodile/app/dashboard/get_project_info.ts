import { ApiService } from '../../lib/api';
import type { ProjectInfo } from '../../lib/api';

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
    return await ApiService.getProjectsInfo(userId);
  } catch (error) {
    console.error('Error fetching projects:', error);
    // Return empty array on error
    return [];
  }
}
