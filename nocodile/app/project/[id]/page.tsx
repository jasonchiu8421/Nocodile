"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, FolderOpen, Image, Video, Calendar } from "lucide-react";
import Link from "next/link";
import "../../../css/dashboard.css";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id;

  // Mock project data - in a real app, this would be fetched based on the ID
  const project = {
    id: projectId,
    name: "Sample Project",
    description: "This is a sample project description",
    Videos: 75,
    images: 75,
    createdAt: "2024-01-15T10:30:00Z"
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-flex">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="btn-secondary">
                <ArrowLeft className="btn-icon" />
                Back to Projects
              </Link>
              <div>
                <h1 className="header-title">{project.name}</h1>
                <div className="project-id">ID: {project.id}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-grid">
          {/* Project Info Section */}
          <div className="projects-section">
            <div className="section-header">
              <h2 className="section-title">Project Details</h2>
            </div>
            
            <div className="project-card">
              <div className="project-header">
                <div className="flex items-center gap-3">
                  <FolderOpen className="text-blue-500" size={24} />
                  <div>
                    <h3 className="project-title">{project.name}</h3>
                    <div className="project-id">ID: {project.id}</div>
                  </div>
                </div>
              </div>
              
              {project.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600">{project.description}</p>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="media-stats">
                <div className="media-item">
                  <div className="media-icon">
                    <Image className="icon" />
                  </div>
                  <div className="media-info">
                    <span className="media-count">{project.images}</span>
                    <span className="media-label">Images</span>
                  </div>
                </div>
                <div className="media-item">
                  <div className="media-icon">
                    <Video className="icon" />
                  </div>
                  <div className="media-info">
                    <span className="media-count">{project.Videos}</span>
                    <span className="media-label">Videos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
