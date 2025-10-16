"use client";

import React, { useState, useEffect } from "react";
import { X, Share2, UserPlus, Trash2, Eye, Edit, Users } from "lucide-react";
import { apiRequest } from "../../lib/api-config";
import { log } from "../../lib/logger";

interface ProjectShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  onShareSuccess?: () => void;
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
  onShareSuccess 
}: ProjectShareModalProps) {
  const [username, setUsername] = useState("");
  const [permissions, setPermissions] = useState<"read" | "write">("read");
  const [isSharing, setIsSharing] = useState(false);
  const [shares, setShares] = useState<ShareInfo[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load existing shares when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      loadShares();
    }
  }, [isOpen, projectId]);

  const loadShares = async () => {
    setIsLoadingShares(true);
    setError(null);
    
    try {
      const response = await apiRequest('/get_project_shares', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setShares(data.shares || []);
        log.info('PROJECT_SHARE', 'Shares loaded successfully', { 
          projectId, 
          shareCount: data.shares?.length || 0 
        });
      } else {
        throw new Error(data.message || 'Failed to load shares');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('PROJECT_SHARE', 'Error loading shares', { 
        projectId, 
        error: errorMessage 
      });
      setError(`Failed to load shares: ${errorMessage}`);
    } finally {
      setIsLoadingShares(false);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setIsSharing(true);
    setError(null);
    setSuccess(null);

    try {
      log.info('PROJECT_SHARE', 'Sharing project', { 
        projectId, 
        projectName, 
        username: username.trim(), 
        permissions 
      });

      const response = await apiRequest('/share_project', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          shared_with_username: username.trim(),
          permissions: permissions
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        setUsername("");
        setPermissions("read");
        await loadShares(); // Reload shares
        onShareSuccess?.();
        log.info('PROJECT_SHARE', 'Project shared successfully', { 
          projectId, 
          username: username.trim() 
        });
      } else {
        throw new Error(data.message || 'Failed to share project');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('PROJECT_SHARE', 'Error sharing project', { 
        projectId, 
        username: username.trim(), 
        error: errorMessage 
      });
      setError(errorMessage);
    } finally {
      setIsSharing(false);
    }
  };

  const handleUnshare = async (username: string) => {
    if (!confirm(`Are you sure you want to unshare this project with ${username}?`)) {
      return;
    }

    try {
      log.info('PROJECT_SHARE', 'Unsharing project', { 
        projectId, 
        username 
      });

      const response = await apiRequest('/unshare_project', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          shared_with_username: username
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        await loadShares(); // Reload shares
        log.info('PROJECT_SHARE', 'Project unshared successfully', { 
          projectId, 
          username 
        });
      } else {
        throw new Error(data.message || 'Failed to unshare project');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('PROJECT_SHARE', 'Error unsharing project', { 
        projectId, 
        username, 
        error: errorMessage 
      });
      setError(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Share2 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Share Project
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {projectName}
            </h3>
            <p className="text-sm text-gray-600">
              Project ID: {projectId}
            </p>
          </div>

          {/* Share Form */}
          <form onSubmit={handleShare} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username to share with"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSharing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permissions
                </label>
                <select
                  value={permissions}
                  onChange={(e) => setPermissions(e.target.value as "read" | "write")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSharing}
                >
                  <option value="read">Read Only</option>
                  <option value="write">Read & Write</option>
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSharing || !username.trim()}
              className="mt-4 w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isSharing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Share Project</span>
                </>
              )}
            </button>
          </form>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Shared Users List */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Users className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Shared With ({shares.length})
              </h3>
            </div>

            {isLoadingShares ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading shares...</span>
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Share2 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p>No users have access to this project yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {share.permissions === 'write' ? (
                          <Edit className="h-4 w-4 text-green-600" />
                        ) : (
                          <Eye className="h-4 w-4 text-blue-600" />
                        )}
                        <span className="font-medium text-gray-900">
                          {share.username}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        share.permissions === 'write' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {share.permissions === 'write' ? 'Read & Write' : 'Read Only'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500">
                        {formatDate(share.shared_at)}
                      </span>
                      <button
                        onClick={() => handleUnshare(share.username)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Remove access"
                      >
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
