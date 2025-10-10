"use client";

import React, { useEffect, useState } from "react";
import { Plus, Image, Video } from "lucide-react";
import "../../css/dashboard.css";
import Link from "next/link";
import { getProjectsInfo, ProjectInfo } from "./getProjectsInfo";
import NewProjectForm from "./NewProjectForm";
import { CircleDot } from "lucide-react";

const ProjectCard = ({
  id,
  name,
  videoCount,
  imageCount,
  description,
  status,
}: {
  id: number;
  name: string;
  videoCount: number;
  imageCount: number;
  description?: string;
  status?: string;
}) => {
  return (
    <Link
      className="project-card fade-in project-card-clickable"
      href={`/project/${id}/upload`}
    >
      <div className="project-header">
        <h3 className="project-title">{name}</h3>
        <div className="project-id">ID: {id}</div>
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
        <div className="media-item">
          <div className="media-icon">
            <CircleDot className="icon" />
          </div>
          <div className="media-info">
            <span className="media-count">{status ?? "—"}</span>
            <span className="media-label">Status</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [isNewProjectFormOpen, setIsNewProjectFormOpen] = useState(false);
  const [userId, setUserId] = useState<number>(-1);
  useEffect(() => {
    cookieStore
      .get("userId")
      .then((res) => {
        console.log("dashboard: userid is", res.value);
        setUserId(res.value);
      })
      .then(async () => {
        const test = await getProjectsInfo(userId);
        console.log("fetched projects:", test);
        setProjects(test);
      });
  }, []);
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
              <button
                className="btn-primary"
                onClick={() => setIsNewProjectFormOpen(true)}
              >
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

      {/* New Project Form Modal */}
      <NewProjectForm
        isOpen={isNewProjectFormOpen}
        onClose={() => setIsNewProjectFormOpen(false)}
        onProjectCreated={(newProject) => {
          setProjects((prev) => [
            {
              ...newProject,
              status: (newProject as any).status ?? "Annotating",
            },
            ...prev,
          ]);
        }}
      />
    </div>
  );
}
