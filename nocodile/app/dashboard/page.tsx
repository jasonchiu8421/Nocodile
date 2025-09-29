"use client";

import React, { useState } from "react";
import { Plus, Image, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import "../../css/dashboard.css";
import Link from "next/link";
import { getProjectsInfo } from "../home/get_project_info";

const ProjectCard = ({
  id,
  name,
  videoCount,
  imageCount,
}: {
  id: number;
  name: string;
  videoCount: number;
  imageCount: number;
}) => {
  const router = useRouter();

  return (
    <Link
      className="project-card fade-in project-card-clickable"
      href={`/project/${id}/upload`}
    >
      <div className="project-header">
        <h3 className="project-title">{name}</h3>
      </div>
      <div className="media-stats">
        <div className="media-item">
          <div className="media-icon">
            <Image className="icon" />
          </div>
          <div className="media-info">
            <span className="media-count">{imageCount}</span>
            <span className="media-label">Images</span>
          </div>
        </div>
        <div className="media-item">
          <div className="media-icon">
            <Video className="icon" />
          </div>
          <div className="media-info">
            <span className="media-count">{videoCount}</span>
            <span className="media-label">Videos</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const projects = getProjectsInfo(98989898); // Replace with actual user ID
  // Turn into fetch in the future

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-flex">
            <div className="flex items-center">
              <h1 className="header-title">My Projects</h1>
            </div>
            <div className="header-actions">
              <button className="btn-primary">
                <Plus />
                <span>New Project</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Main Grid */}
        <div className="dashboard-grid">
          {/* Projects Section */}
          <div className="projects-section">
            <div className="section-header">
              <h2 className="section-title">Recent Projects</h2>
              <div className="flex items-center space-x-2"></div>
            </div>
            <div className="projects-grid">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  videoCount={project.videoCount}
                  imageCount={project.imageCount}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
