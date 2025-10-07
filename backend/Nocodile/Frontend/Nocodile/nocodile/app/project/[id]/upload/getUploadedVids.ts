import { log } from '@/lib/logger';
import { ApiService } from '@/lib/api';

export type uploadedVid = { 
  url: string; 
  title: string; 
  file: File; 
  fallbackUrl?: string;
  video_id?: string;
};

// Synchronous version - returns empty array (for compatibility)
export function getUploadedVids(projectId: number): uploadedVid[] {
  log.info('UPLOAD_API', 'Fetching uploaded videos (synchronous fallback)', { projectId });
  
  // Return empty array since we only want real database data
  log.warn('UPLOAD_API', 'Using empty array (backend API not called due to synchronous constraint)', { projectId });
  return [];
}

// Async version using ApiService
export async function getUploadedVidsAsync(projectId: number): Promise<uploadedVid[]> {
  log.info('UPLOAD_API', 'Fetching uploaded videos (async)', { projectId });
  
  try {
    const backendVideos = await ApiService.getUploadedVideos(projectId.toString());
    
    if (backendVideos.length > 0) {
      log.info('UPLOAD_API', 'Successfully fetched videos from backend', { 
        projectId, 
        count: backendVideos.length 
      });
      
      // Transform backend response to uploadedVid format
      const uploadedVideos: uploadedVid[] = backendVideos.map((item: any) => ({
        url: item.path || item.file || item.url || '',
        title: item.name || item.title || 'Unknown Video',
        file: new File([], item.name || 'video.mp4', { type: 'video/mp4' }),
        fallbackUrl: item.fallbackUrl,
        video_id: item.video_id || item.id || null
      }));
      
      return uploadedVideos;
    } else {
      log.warn('UPLOAD_API', 'No videos found in backend, returning empty array', { projectId });
      return [];
    }
  } catch (error) {
    log.error('UPLOAD_API', 'Failed to fetch videos from backend, returning empty array', { 
      projectId, 
      error: error instanceof Error ? error.message : String(error) 
    });
    return [];
  }
}
