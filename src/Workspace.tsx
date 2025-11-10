import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CircuitBackground } from "components/CircuitBackground";
import { Button } from "components/Button";
import { StageEditor } from "components/StageEditor";

// Icons for the stage blocks
const DataIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5z"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
);

const PreprocessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6" y2="6"/><line x1="6" y1="18" x2="6" y2="18"/></svg>
);

const TrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
);

const CompleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

interface WireProps {
  isConnected: boolean;
  onClick: () => void;
}

const Wire = ({ isConnected, onClick }: WireProps) => {
  return (
    <div 
      className="flex-1 flex items-center justify-center cursor-pointer" 
      onClick={onClick}
    >
      <div className={`h-0.5 w-full ${isConnected ? 'bg-blue-500' : 'bg-gray-300 border-dashed border-2 border-gray-400'} relative overflow-hidden`}>
        {isConnected && (
          <div className="absolute top-0 left-0 h-full w-8 bg-blue-500 opacity-75 animate-pulse-wire"></div>
        )}
      </div>
    </div>
  );
};

interface StageProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  isConfigured: boolean;
  onClick: () => void;
}

const Stage = ({ title, description, icon, color, isConfigured, onClick }: StageProps) => {
  // Color configurations based on status and color
  const getColorClasses = (colorName: string, configured: boolean) => {
    const baseColors: Record<string, Record<string, string>> = {
      blue: {
        border: 'border-blue-600',
        accent: 'bg-blue-600',
        icon: 'bg-blue-100 text-blue-600',
        highlight: 'bg-blue-600'
      },
      green: {
        border: 'border-green-600',
        accent: 'bg-green-600',
        icon: 'bg-green-100 text-green-600',
        highlight: 'bg-green-600'
      },
      purple: {
        border: 'border-purple-600',
        accent: 'bg-purple-600',
        icon: 'bg-purple-100 text-purple-600',
        highlight: 'bg-purple-600'
      },
      orange: {
        border: 'border-orange-600',
        accent: 'bg-orange-600',
        icon: 'bg-orange-100 text-orange-600',
        highlight: 'bg-orange-600'
      }
    };

    const defaultColors = {
      border: 'border-gray-400',
      accent: 'bg-gray-400',
      icon: 'bg-gray-100 text-gray-600',
      highlight: 'bg-gray-400'
    };

    return configured ? (baseColors[colorName] || defaultColors) : defaultColors;
  };

  const colorClasses = getColorClasses(color, isConfigured);
  
  return (
    <div 
      onClick={onClick}
      className={`relative rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300 border-2 ${colorClasses.border} bg-white overflow-hidden cursor-pointer group h-full flex flex-col`}
    >
      <div className="absolute top-0 right-0 w-16 h-16">
        <div className={`absolute top-0 right-0 w-16 h-16 ${colorClasses.accent} transform rotate-45 translate-x-8 -translate-y-8`}></div>
      </div>
      <div className="flex items-center mb-3">
        <div className={`p-2 rounded-md ${colorClasses.icon} mr-3`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <p className="text-gray-600 mb-4 flex-grow">{description}</p>
      
      {/* Status indicator */}
      <div className="flex items-center mt-2">
        <div className={`w-3 h-3 rounded-full mr-2 ${isConfigured ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        <span className="text-sm text-gray-600">{isConfigured ? 'Configured' : 'Not Configured'}</span>
      </div>
      
      {/* Hover effect */}
      <div className={`absolute bottom-0 left-0 w-full h-1 ${colorClasses.highlight} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
      
      {/* Circuit dots */}
      <div className="absolute left-0 top-1/2 w-2 h-2 rounded-full bg-gray-300 transform -translate-x-1/2"></div>
      <div className="absolute right-0 top-1/2 w-2 h-2 rounded-full bg-gray-300 transform translate-x-1/2"></div>
    </div>
  );
};

// Define stage types and their metadata
type StageType = 'dataManagement' | 'preprocessing' | 'modelTraining' | 'completedModel';

interface StageMetadata {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export default function Workspace() {
  const navigate = useNavigate();
  
  // State for tracking which stages are configured and which wires are connected
  const [stageStatus, setStageStatus] = useState({
    dataManagement: false,
    preprocessing: false,
    modelTraining: false,
    completedModel: false
  });
  
  const [wireConnections, setWireConnections] = useState({
    wire1: false, // Between data management and preprocessing
    wire2: false, // Between preprocessing and model training
    wire3: false  // Between model training and completed model
  });

  // State for the zoom transition animation
  const [expandedStage, setExpandedStage] = useState<StageType | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [stageRect, setStageRect] = useState({ top: 0, left: 0, width: 0, height: 0 });
  
  // Refs to store module elements
  const stageRefs = {
    dataManagement: useRef<HTMLDivElement>(null),
    preprocessing: useRef<HTMLDivElement>(null),
    modelTraining: useRef<HTMLDivElement>(null),
    completedModel: useRef<HTMLDivElement>(null),
  };
  
  // Stage metadata
  const stageMetadata: Record<StageType, StageMetadata> = {
    dataManagement: {
      title: "Data Management",
      description: "Upload and explore the MNIST dataset, visualize digit samples, and understand the data you're working with.",
      icon: <DataIcon />,
      color: "blue"
    },
    preprocessing: {
      title: "Preprocessing",
      description: "Transform raw image data into a format ideal for neural networks through normalization and augmentation.",
      icon: <PreprocessIcon />,
      color: "green"
    },
    modelTraining: {
      title: "Model Training",
      description: "Configure and train your convolutional neural network, adjusting parameters and watching it learn in real-time.",
      icon: <TrainIcon />,
      color: "purple"
    },
    completedModel: {
      title: "Completed Model",
      description: "Test your trained model on new digit images and visualize how it makes predictions.",
      icon: <CompleteIcon />,
      color: "orange"
    }
  };

  // Handle stage clicks - trigger the zoom animation and open the editor
  const handleStageClick = (stageName: StageType) => {
    if (isTransitioning || expandedStage) return;
    
    const stageRef = stageRefs[stageName];
    if (stageRef && stageRef.current) {
      // Get the current position and size of the clicked stage
      const rect = stageRef.current.getBoundingClientRect();
      setStageRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
      
      // Start the transition
      setIsTransitioning(true);
      
      // After a short delay, set the expanded stage
      setTimeout(() => {
        setExpandedStage(stageName);
        setIsTransitioning(false);
      }, 500); // Match this to the animation duration in CSS
    }
  };
  
  // Handle stage editor close
  const handleEditorClose = () => {
    if (isTransitioning) return;  
    
    // Mark the current stage as configured when it's closed
    if (expandedStage) {
      setStageStatus(prev => ({
        ...prev,
        [expandedStage]: true
      }));
    }
    
    // Start the transition back
    setIsTransitioning(true);
    setExpandedStage(null);
    
    // After the transition is complete, reset the transitioning state
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500); // Match this to the animation duration in CSS
  };

  // Handle wire clicks to connect/disconnect stages
  const handleWireClick = (wireName: keyof typeof wireConnections) => {
    console.log(`Clicked on ${wireName}`);
    // Toggle wire connection status
    setWireConnections(prev => ({
      ...prev,
      [wireName]: !prev[wireName]
    }));
  };

  // Navigate back to home
  const handleBackClick = () => {
    navigate('/');
  };

  // Effect to handle document body scrolling when a stage is expanded
  useEffect(() => {
    if (expandedStage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [expandedStage]);

  return (
    <div className="relative min-h-screen flex flex-col bg-gray-50">
      <CircuitBackground className="opacity-30" />
      
      {/* Stage Editor Overlay */}
      {(expandedStage || isTransitioning) && (
        <div 
          className={`fixed inset-0 z-40 ${expandedStage ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
          style={{ 
            pointerEvents: expandedStage ? 'auto' : 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.1)'
          }}
        >
          {expandedStage && (
            <StageEditor 
              title={stageMetadata[expandedStage].title}
              description={stageMetadata[expandedStage].description}
              icon={stageMetadata[expandedStage].icon}
              color={stageMetadata[expandedStage].color}
              onClose={handleEditorClose}
            />
          )}
        </div>
      )}
      
      {/* Transition Element - Shown during the zoom animation */}
      {isTransitioning && !expandedStage && (
        <div 
          className="fixed z-50 bg-white shadow-lg stage-zoom-exit border-2 border-gray-400"
          style={{
            top: stageRect.top,
            left: stageRect.left,
            width: stageRect.width,
            height: stageRect.height,
          }}
        />
      )}

      {/* Transition Element - Shown during the zoom animation */}
      {isTransitioning && expandedStage && (
        <div 
          className="fixed inset-0 z-50 bg-white shadow-lg stage-zoom-enter border-2"
          style={{
            top: stageRect.top,
            left: stageRect.left,
            width: stageRect.width,
            height: stageRect.height,
            borderColor: `var(--${stageMetadata[expandedStage].color}-600, #666)`,
          }}
        />
      )}
      
      {/* Header with back button */}
      <header className="bg-white shadow-sm py-4 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBackClick}
              className="mr-4"
            >
              &larr; Back
            </Button>
            <h1 className="text-2xl font-bold">Neural Network Workspace</h1>
          </div>
          
          <div className="text-sm text-gray-600">
            {/* This could show current status or progress */}
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
              Ready to build
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex-grow flex flex-col">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Build Your Neural Network</h2>
          <p className="text-gray-600">
            Click on each module to configure it, then connect the stages by clicking on the dashed lines between them.
          </p>
        </div>
        
        {/* Neural Network Stages */}
        <div className="flex flex-col lg:flex-row items-stretch gap-4 mb-12 mt-8 flex-grow">
          {/* Data Management Stage */}
          <div className="lg:w-1/4" ref={stageRefs.dataManagement}>
            <Stage 
              title="Data Management" 
              description="Upload and explore the MNIST dataset, visualize digit samples, and understand the data you're working with." 
              color="blue"
              icon={<DataIcon />}
              isConfigured={stageStatus.dataManagement}
              onClick={() => handleStageClick('dataManagement')}
            />
          </div>
          
          {/* Wire 1 */}
          <div className="lg:w-[5%] hidden lg:block">
            <Wire 
              isConnected={wireConnections.wire1} 
              onClick={() => handleWireClick('wire1')}
            />
          </div>
          
          {/* Preprocessing Stage */}
          <div className="lg:w-1/4" ref={stageRefs.preprocessing}>
            <Stage 
              title="Preprocessing" 
              description="Transform raw image data into a format ideal for neural networks through normalization and augmentation." 
              color="green"
              icon={<PreprocessIcon />}
              isConfigured={stageStatus.preprocessing}
              onClick={() => handleStageClick('preprocessing')}
            />
          </div>
          
          {/* Wire 2 */}
          <div className="lg:w-[5%] hidden lg:block">
            <Wire 
              isConnected={wireConnections.wire2} 
              onClick={() => handleWireClick('wire2')}
            />
          </div>
          
          {/* Model Training Stage */}
          <div className="lg:w-1/4" ref={stageRefs.modelTraining}>
            <Stage 
              title="Model Training" 
              description="Configure and train your convolutional neural network, adjusting parameters and watching it learn in real-time." 
              color="purple"
              icon={<TrainIcon />}
              isConfigured={stageStatus.modelTraining}
              onClick={() => handleStageClick('modelTraining')}
            />
          </div>
          
          {/* Wire 3 */}
          <div className="lg:w-[5%] hidden lg:block">
            <Wire 
              isConnected={wireConnections.wire3} 
              onClick={() => handleWireClick('wire3')}
            />
          </div>
          
          {/* Completed Model Stage */}
          <div className="lg:w-1/4" ref={stageRefs.completedModel}>
            <Stage 
              title="Completed Model" 
              description="Test your trained model on new digit images and visualize how it makes predictions." 
              color="orange"
              icon={<CompleteIcon />}
              isConfigured={stageStatus.completedModel}
              onClick={() => handleStageClick('completedModel')}
            />
          </div>
        </div>
        
        {/* Instructions Panel */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Instructions</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li><span className="font-medium">Configure each module:</span> Click on a stage block to enter its detailed configuration view</li>
            <li><span className="font-medium">Connect the stages:</span> Click on the dashed lines between stages to create data flow connections</li>
            <li><span className="font-medium">Complete all stages:</span> Configure each module and connect all stages to build your neural network</li>
            <li><span className="font-medium">Interactive learning:</span> Observe how changes in each stage affect the neural network's performance</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-4 px-4 shadow-inner">
        <div className="container mx-auto text-center text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} NeuralCraft Academy. Educational tool for learning neural networks.</p>
        </div>
      </footer>
    </div>
  );
}
