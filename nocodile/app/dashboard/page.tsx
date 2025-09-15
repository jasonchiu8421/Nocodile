"use client";

import React, { useState } from "react";
import { Plus, Image, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import "../../css/dashboard.css";

// Mock data for demonstration
const projects = [
  { id: 1, name: "Road Sign Detection", Videos: 75, images: 75 },
  { id: 2, name: "Vehicle Classification", Videos: 45, images: 45 },
  { id: 3, name: "Pedestrain Tracking", Videos: 100, images: 100 },
  { id: 4, name: "No Name for this project", Videos: 30, images: 30 },
  { id: 5, name: "Hello", Videos: 10000, images: 100000 },
];

const ProjectCard = ({
  id,
  name,
  Videos,
  images,
}: {
  id: number;
  name: string;
  Videos: number;
  images: number;
}) => {
  const router = useRouter();

  //todo change the id to be dynamic
  const handleProjectClick = () => {
    router.push(`/workflow/${id}`);
  };

  return (
    <div
      className="project-card fade-in project-card-clickable"
      onClick={handleProjectClick}
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
            <span className="media-count">{images}</span>
            <span className="media-label">Images</span>
          </div>
        </div>
        <div className="media-item">
          <div className="media-icon">
            <Video className="icon" />
          </div>
          <div className="media-info">
            <span className="media-count">{Videos}</span>
            <span className="media-label">Videos</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");

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
                  Videos={project.Videos}
                  images={project.images}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
