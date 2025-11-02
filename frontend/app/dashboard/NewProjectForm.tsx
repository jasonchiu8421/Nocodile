"use client";

import React, { useState } from "react";
import { X, Plus, Save, FolderOpen } from "lucide-react";
import { ApiService, ProjectInfo } from "../../lib/api";
import { apiRequest } from "../../lib/api-config";
import { log } from "../../lib/logger";

interface Project {
  id: number;
  name: string;
  videoCount: number;
  status?: string;
}

interface NewProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
  userId: number;
}

export default function NewProjectForm({ isOpen, onClose, onProjectCreated, userId }: NewProjectFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    projectType: "object_detection"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      log.info('NEW_PROJECT', 'Creating new project', { 
        userId, 
        projectName: formData.name, 
        projectType: formData.projectType 
      });

      // Use the new API configuration system
      const response = await apiRequest('/create_project', {
        method: 'POST',
        body: JSON.stringify({
          userID: userId.toString(),
          project_name: formData.name,
          project_type: formData.projectType,
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      log.info('NEW_PROJECT', 'Project created successfully', { 
        projectId: data.project_id,
        projectName: formData.name 
      });
      
      if (data.success) {
        const newProject: Project = {
          id: data.project_id,
          name: formData.name,
          videoCount: 0,
          status: "Not started"
        };
        
        onProjectCreated(newProject);
        
        // Reset form
        setFormData({
          name: "",
          projectType: "object_detection"
        });
        
        onClose();
      } else {
        console.error("Failed to create project:", response);
        alert("Failed to create project. Please try again.");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Error creating project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content project-form-modal">
        <div className="modal-header">
          <div className="modal-title">
            <FolderOpen className="modal-icon" />
            <h2>Create New Project</h2>
          </div>
          <button 
            className="modal-close" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter project name"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="projectType" className="form-label">
              Project Type *
            </label>
            <select
              id="projectType"
              name="projectType"
              value={formData.projectType}
              onChange={handleInputChange}
              className="form-input"
              required
            >
              <option value="object_detection">Object Detection</option>
              <option value="classification">Classification</option>
              <option value="segmentation">Segmentation</option>
            </select>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !formData.name}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="btn-icon" />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
