"use client";

import React, { useState } from "react";
import { X, Plus, Save, FolderOpen } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  Videos: number;
  images: number;
  createdAt: string;
}

interface NewProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

export default function NewProjectForm({ isOpen, onClose, onProjectCreated }: NewProjectFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectId: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateProjectId = () => {
    // Generate a unique project ID based on timestamp and random number
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `PROJ_${timestamp}_${random}`.toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate unique project ID if not provided
      const projectId = formData.projectId || generateProjectId();
      
      const newProject: Project = {
        id: projectId,
        name: formData.name,
        description: formData.description,
        Videos: 0,
        images: 0,
        createdAt: new Date().toISOString()
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onProjectCreated(newProject);
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        projectId: ""
      });
      
      onClose();
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateId = () => {
    setFormData(prev => ({
      ...prev,
      projectId: generateProjectId()
    }));
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
            <label htmlFor="projectId" className="form-label">
              Project ID *
            </label>
            <div className="input-group">
              <input
                type="text"
                id="projectId"
                name="projectId"
                value={formData.projectId}
                onChange={handleInputChange}
                placeholder="PROJ_ABC123_DEF456"
                className="form-input"
                required
              />
              <button
                type="button"
                onClick={handleGenerateId}
                className="btn-secondary generate-btn"
                disabled={isSubmitting}
              >
                <Plus className="btn-icon" />
                Generate
              </button>
            </div>
            <small className="form-help">
              Leave empty to auto-generate a unique Project ID
            </small>
          </div>

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
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter project description (optional)"
              className="form-textarea"
              rows={3}
            />
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
