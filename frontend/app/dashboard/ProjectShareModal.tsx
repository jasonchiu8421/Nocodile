"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Share2, UserPlus, Trash2, Eye, Edit, Users } from "lucide-react";
import { apiRequest } from "../../lib/api-config";
import { log } from "../../lib/logger";

interface ProjectShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  onShareSuccess?: () => void;
  onNameChange?: (newName: string) => void;
}

interface ShareInfo {
  id: number;
  username: string;
  permissions: string;
  shared_at: string;
  user_id: number;
}

export default function ProjectShareModal({ 
  isOpen, 
  onClose, 
  projectId, 
  projectName,
  onShareSuccess,
  onNameChange
}: ProjectShareModalProps) {
  const [username, setUsername] = useState("");
  const [permissions, setPermissions] = useState<"read" | "write">("read");
  const [isSharing, setIsSharing] = useState(false);
  const [shares, setShares] = useState<ShareInfo[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // === 修改名稱狀態 ===
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(projectName);
  const [isSavingName, setIsSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // === 載入分享名單 ===
  const loadShares = useCallback(async () => {
    setIsLoadingShares(true);
    setError(null);

    try {
      const response = await apiRequest('/get_project_shares', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.success) {
        setShares(data.shares || []);
        log.info('PROJECT_SHARE', 'Shares loaded', { projectId, shareCount: data.shares?.length });
      } else {
        throw new Error(data.message || 'Failed to load shares');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      log.error('PROJECT_SHARE', 'Load shares failed', { projectId, error: msg });
      setError(`Loading failed: ${msg}`);
    } finally {
      setIsLoadingShares(false);
    }
  }, [projectId]);

  // === 分享專案 ===
  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError("Please enter your username."); return; }

    setIsSharing(true); setError(null); setSuccess(null);

    try {
      const response = await apiRequest('/share_project', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          shared_with_username: username.trim(),
          permissions
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setUsername(""); setPermissions("read");
        await loadShares();
        onShareSuccess?.();
        log.info('PROJECT_SHARE', 'Shared successfully', { projectId, username: username.trim() });
        console.log(data.message);
      } else {
        throw new Error(data.message || 'Sharing failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      log.error('PROJECT_SHARE', 'Share failed', { projectId, error: msg });
      setError(msg);
    } finally {
      setIsSharing(false);
    }
  };

  // === 取消分享 ===
  const handleUnshare = async (username: string) => {
    if (!confirm(`Are you sure you want to cancel sharing with ${username} ?`)) return;

    try {
      const response = await apiRequest('/unshare_project', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          shared_with_username: username
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        await loadShares();
        log.info('PROJECT_SHARE', 'Unshared', { projectId, username });
        console.log(data.message);
      } else {
        throw new Error(data.message || 'Cancellation failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      log.error('PROJECT_SHARE', 'Unshare failed', { projectId, username, error: msg });
      setError(msg);
    }
  };

// === 修改專案名稱（完全符合後端簽名）===
const saveProjectName = async () => {
  const trimmedName = editingName.trim();
  if (!trimmedName || trimmedName === projectName) {
    setIsEditingName(false);
    return;
  }

  setIsSavingName(true);
  setError(null);

  try {
    // 建立 query string：?new_name=xxx
    const url = new URL('/change_project_name', window.location.origin);
    url.searchParams.append('new_name', trimmedName);

    // Body 只傳 project_id
    const response = await apiRequest(url.pathname + url.search, {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId  // 必須是 project_id
      })
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errData = await response.json();
        errorMsg = errData.message || errData.error || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Modification failed');

    log.info('PROJECT_NAME', 'Renamed successfully', { 
      projectId, 
      oldName: projectName, 
      newName: trimmedName 
    });

    onNameChange?.(trimmedName);
    setSuccess(`Renamed to "${trimmedName}"`);

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    log.error('PROJECT_NAME', 'Rename failed', { projectId, error: msg });
    setError(`Name change failed: ${msg}`);
    setEditingName(projectName); // 還原
  } finally {
    setIsSavingName(false);
    setIsEditingName(false);
  }
};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // === 當 modal 開啟時載入 ===
  useEffect(() => {
    if (isOpen) {
      setEditingName(projectName);
      loadShares();
    }
  }, [isOpen, projectId, projectName, loadShares]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2 flex-1">
            <Share2 className="h-6 w-6 text-blue-600" />
            {isEditingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveProjectName();
                  if (e.key === 'Escape') {
                    setEditingName(projectName);
                    setIsEditingName(false);
                  }
                }}
                className="text-xl font-semibold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none px-1"
                disabled={isSavingName}
                autoFocus
              />
            ) : (
              <h2
                className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => {
                  setIsEditingName(true);
                  setTimeout(() => nameInputRef.current?.focus(), 0);
                }}
                title="Click to edit project name"
              >
                {projectName}
              </h2>
            )}
            {isSavingName && (
              <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 編輯按鈕 */}
        {isEditingName && (
          <div className="flex gap-2 px-6 pb-4">
            <button
              onClick={saveProjectName}
              disabled={isSavingName}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isSavingName ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setEditingName(projectName);
                setIsEditingName(false);
              }}
              disabled={isSavingName}
              className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">Project ID: {projectId}</p>
          </div>

          {/* 分享表單 */}
          <form onSubmit={handleShare} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter the username to share"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSharing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                <select
                  value={permissions}
                  onChange={(e) => setPermissions(e.target.value as "read" | "write")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSharing}
                >
                  <option value="read">Read only</option>
                  <option value="write">Read and write</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSharing || !username.trim()}
              className="mt-4 w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isSharing ? (
                <>Sharing...</>
              ) : (
                <><UserPlus className="h-4 w-4" /> Share project</>
              )}
            </button>
          </form>

          {/* 訊息 */}
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">{success}</div>}

          {/* 分享名單 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Users className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">Shared ({shares.length})</h3>
            </div>

            {isLoadingShares ? (
              <div className="flex justify-center py-8">Loading...</div>
            ) : shares.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Not shared with anyone</div>
            ) : (
              <div className="space-y-3">
                {shares.map((share) => (
                  <div key={share.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {share.permissions === 'write' ? <Edit className="h-4 w-4 text-green-600" /> : <Eye className="h-4 w-4 text-blue-600" />}
                        <span className="font-medium">{share.username}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${share.permissions === 'write' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {share.permissions === 'write' ? 'Read and write' : 'Read only'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500">{formatDate(share.shared_at)}</span>
                      <button onClick={() => handleUnshare(share.username)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
