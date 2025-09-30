"use client";

import React, { useState } from "react";
import { 
  Plus,
  Video,
  CircleDot
} from "lucide-react";
import { useRouter } from "next/navigation";
import "../../css/dashboard.css";
import NewProjectForm from "../../components/NewProjectForm";

// Mock data for demonstration
const initialProjects = [
  { id: "PROJ_1", name: "Road Sign Detection", Videos: 75, description: "AI model for detecting road signs in images and videos", createdAt: "2024-01-15T10:30:00Z",Status:"Completed"},
  { id: "PROJ_2", name: "Vehicle Classification", Videos: 45, description: "Classify different types of vehicles", createdAt: "2024-01-20T14:15:00Z",Status:"Annotating"},
  { id: "PROJ_3", name: "Pedestrain Tracking", Videos: 100, description: "Track pedestrians in video streams", createdAt: "2024-01-25T09:45:00Z",Status:"Training"},
  { id: "PROJ_4", name: "No Name for this project", Videos: 30,  description: "", createdAt: "2024-02-01T16:20:00Z",Status:"Completed"},
  { id: "PROJ_5", name: "Hello", Videos: 10000, description: "Test project", createdAt: "2024-02-05T11:10:00Z", Status:"Annotating"}
];

const ProjectCard = ({ id, name, Videos, Status, description }: {
  id: string;
  name: string;
  Videos: number;
  Status?: string;
  description?: string;
}) => {
  const router = useRouter();

  const handleProjectClick = () => {
    router.push(`/project/${id}`);
  };

  return (
    <div className="project-card fade-in project-card-clickable" onClick={handleProjectClick}>
      <div className="project-header">
        <h3 className="project-title">{name}</h3>
        <div className="project-id">ID: {id}</div>
        {description && (
          <p className="project-description">{description}</p>
        )}
      </div>
      <div className="media-stats">
        <div className="media-item">
          <div className="media-icon">
            <Video className="icon" />
          </div>
          <div className="media-info">
            <span className="media-count">{Videos}</span>
            <span className="media-label">Videos</span>
          </div>
        </div>
        <div className="media-item">
          <div className="media-icon">
            <CircleDot className="icon" />
          </div>
          <div className="media-info">
            <span className="media-count">{Status ?? "—"}</span>
            <span className="media-label">Status</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState(initialProjects);
  const [isNewProjectFormOpen, setIsNewProjectFormOpen] = useState(false);

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
              <div className="flex items-center space-x-2">
              </div>
            </div>
            <div className="projects-grid">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  Videos={project.Videos}
                  Status={project.Status}
                  description={project.description}
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
          setProjects(prev => [{ ...newProject, Status: (newProject as any).Status ?? "Annotating" }, ...prev]);
        }}
      />
    </div>
  );
}
