// get_project_details.ts
import { apiRequest } from '../../lib/api-config';
import { log } from '../../lib/logger';

// **後端回傳的精確 Type**（**為什麼要有？** 編輯器自動提示 + 防錯）
export interface ProjectDetails {
  "project name": string;
  "project type": string;
  "video count": number;
  "status": string;
}

export async function getProjectDetails(projectId: number): Promise<ProjectDetails | null> {
  try {
    log.info('PROJECT_DETAILS', 'Fetching details for project', { projectId });
    
    // **為什麼用 POST + JSON？** 與 `get_projects_info` **完全一致**，後端期待
    const response = await apiRequest('/get_project_details', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId })
    });

    if (!response.ok) {
      log.warn('PROJECT_DETAILS', 'API returned error status', {
        status: response.status,
        projectId
      });
      return null;  // **為什麼 return null？** UI 可顯示「載入失敗」，不崩潰
    }

    const data = await response.json();
    return {
      "project name": data["project name"],
      "project type": data["project type"],
      "video count": data["video count"],
      "status": data["status"]
    };
  } catch (error) {
    log.error('PROJECT_DETAILS', 'Error fetching details', { error, projectId });
    return null;
  }
}