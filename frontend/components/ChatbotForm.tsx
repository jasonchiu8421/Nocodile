"use client";

import React, { useState } from "react";
import { X, Bot, Plus, Save } from "lucide-react";

interface Project {
  id: number;
  name: string;
  Videos: number;
  images: number;
}

interface ChatbotFormProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onChatbotCreated: (chatbot: any) => void;
}

export default function ChatbotForm({ isOpen, onClose, projects, onChatbotCreated }: ChatbotFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectId: "",
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: "",
    isPublic: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const generateProjectId = () => {
    // Generate a unique project ID based on timestamp and random number
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `CHATBOT_${timestamp}_${random}`.toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate unique chatbot ID
      const chatbotId = generateProjectId();
      
      const newChatbot = {
        id: chatbotId,
        ...formData,
        projectId: formData.projectId || projects[0]?.id.toString(),
        createdAt: new Date().toISOString(),
        status: "active"
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onChatbotCreated(newChatbot);
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        projectId: "",
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: "",
        isPublic: false
      });
      
      onClose();
    } catch (error) {
      console.error("Error creating chatbot:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content chatbot-form-modal">
        <div className="modal-header">
          <div className="modal-title">
            <Bot className="modal-icon" />
            <h2>Create New Chatbot</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="chatbot-form">
          <div className="form-section">
            <h3 className="form-section-title">Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Chatbot Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter chatbot name"
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
                className="form-textarea"
                placeholder="Describe what this chatbot does"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="projectId" className="form-label">
                Associate with Project *
              </label>
              <select
                id="projectId"
                name="projectId"
                value={formData.projectId}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} (ID: {project.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">AI Configuration</h3>
            
            <div className="form-group">
              <label htmlFor="model" className="form-label">
                AI Model
              </label>
              <select
                id="model"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="temperature" className="form-label">
                  Temperature: {formData.temperature}
                </label>
                <input
                  type="range"
                  id="temperature"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleInputChange}
                  min="0"
                  max="2"
                  step="0.1"
                  className="form-range"
                />
                <div className="range-labels">
                  <span>Focused</span>
                  <span>Creative</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="maxTokens" className="form-label">
                  Max Tokens
                </label>
                <input
                  type="number"
                  id="maxTokens"
                  name="maxTokens"
                  value={formData.maxTokens}
                  onChange={handleInputChange}
                  className="form-input"
                  min="100"
                  max="4000"
                  step="100"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="systemPrompt" className="form-label">
                System Prompt
              </label>
              <textarea
                id="systemPrompt"
                name="systemPrompt"
                value={formData.systemPrompt}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Define the chatbot's behavior and personality..."
                rows={4}
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Settings</h3>
            
            <div className="form-group">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="form-checkbox"
                />
                <span className="checkbox-text">Make this chatbot public</span>
              </label>
            </div>
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
              disabled={isSubmitting || !formData.name || !formData.projectId}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Create Chatbot
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
