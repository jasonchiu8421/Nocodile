import React from "react";
import { CircuitBackground } from "./components/CircuitBackground";
import { StageBlock } from "./components/StageBlock";
import { WireConnection } from "./components/WireConnection";
import { Button } from "./components/Button";
import { useNavigate } from "react-router-dom";

// Icons for the stage blocks
const DataIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5z"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
);

const PreprocessIcon = () => (
  <svg xmlns="http://www.whttps://databutton.com/projects/20dfd603-3cc0-450c-893e-459a95d164e8/ui/app/build3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6" y2="6"/><line x1="6" y1="18" x2="6" y2="18"/></svg>
);

const TrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
);

const CompleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

export default function App() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Navigate to the workspace page
    navigate('/workspace');
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <CircuitBackground />
      
      {/* Hero Section */}
      <header className="pt-20 pb-16 px-4 relative">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gray-900 leading-tight">
            NeuralCraft <span className="text-blue-600">Academy</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-8">
            Build and train your own neural network through an interactive, hands-on approach to understanding AI.
          </p>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={handleGetStarted}
            className="relative overflow-hidden group"
          >
            <span className="relative z-10">Get Started</span>
            <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-400 transform transition-transform duration-300 origin-left group-hover:scale-x-100"></span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 flex-grow">
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 relative inline-block mx-auto">
            <span className="relative z-10">Build Your Neural Network</span>
            <span className="absolute bottom-0 left-0 w-full h-2 bg-yellow-300 transform -rotate-1"></span>
          </h2>
          
          <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-2 mb-12">
            <div className="md:w-1/4">
              <StageBlock 
                title="Data Management" 
                description="Upload and explore the MNIST dataset, visualize digit samples, and understand the data you're working with." 
                color="blue"
                icon={<DataIcon />}
              />
            </div>
            
            <WireConnection className="md:w-[5%] hidden md:flex" />
            
            <div className="md:w-1/4">
              <StageBlock 
                title="Preprocessing" 
                description="Transform raw image data into a format ideal for neural networks through normalization and augmentation." 
                color="green"
                icon={<PreprocessIcon />}
              />
            </div>
            
            <WireConnection className="md:w-[5%] hidden md:flex" />
            
            <div className="md:w-1/4">
              <StageBlock 
                title="Model Training" 
                description="Configure and train your convolutional neural network, adjusting parameters and watching it learn in real-time." 
                color="purple"
                icon={<TrainIcon />}
              />
            </div>
            
            <WireConnection className="md:w-[5%] hidden md:flex" />
            
            <div className="md:w-1/4">
              <StageBlock 
                title="Completed Model" 
                description="Test your trained model on new digit images and visualize how it makes predictions." 
                color="orange"
                icon={<CompleteIcon />}
              />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-w-3xl mx-auto">
            <h3 className="text-2xl font-semibold mb-3 text-gray-800">How It Works</h3>
            <p className="text-gray-700 mb-4">
              In NeuralCraft Academy, you'll learn by building. Connect the stages of neural network development like circuits on a board, then dive into each component to understand what's happening under the hood.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-4">
              <li><span className="font-medium">Interactive Learning:</span> Connect components and see real-time data flow</li>
              <li><span className="font-medium">Visual Understanding:</span> Watch your neural network learn through dynamic visualizations</li>
              <li><span className="font-medium">Hands-on Approach:</span> Adjust parameters and see their effects immediately</li>
              <li><span className="font-medium">Real AI Skills:</span> Build foundations for understanding more complex neural networks</li>
            </ul>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white bg-opacity-70 py-6 relative z-10">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} NeuralCraft Academy. Educational tool for learning neural networks.</p>
        </div>
      </footer>
    </div>
  );
}
