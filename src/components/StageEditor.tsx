import React from "react";
import { Button } from "components/Button";

interface StageEditorProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClose: () => void;
}

export const StageEditor: React.FC<StageEditorProps> = ({
  title,
  description,
  icon,
  color,
  onClose,
}) => {
  // Get color classes based on the color prop
  const getColorClasses = (colorName: string) => {
    const baseColors: Record<string, Record<string, string>> = {
      blue: {
        border: 'border-blue-600',
        bg: 'bg-blue-50',
        accent: 'bg-blue-600',
        text: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      green: {
        border: 'border-green-600',
        bg: 'bg-green-50',
        accent: 'bg-green-600',
        text: 'text-green-600',
        button: 'bg-green-600 hover:bg-green-700'
      },
      purple: {
        border: 'border-purple-600',
        bg: 'bg-purple-50',
        accent: 'bg-purple-600',
        text: 'text-purple-600',
        button: 'bg-purple-600 hover:bg-purple-700'
      },
      orange: {
        border: 'border-orange-600',
        bg: 'bg-orange-50',
        accent: 'bg-orange-600',
        text: 'text-orange-600',
        button: 'bg-orange-600 hover:bg-orange-700'
      }
    };

    return baseColors[colorName] || baseColors.blue;
  };

  const colorClasses = getColorClasses(color);

  return (
    <div className={`w-full h-full flex flex-col ${colorClasses.bg}`}>
      {/* Header */}
      <div className={`px-6 py-4 flex justify-between items-center border-b ${colorClasses.border}`}>
        <div className="flex items-center">
          <div className={`p-2 rounded-md bg-white ${colorClasses.text} mr-3`}>
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-sm text-gray-600">Configure your {title.toLowerCase()} settings</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
          Back to Workspace
        </Button>
      </div>

      {/* Main content area */}
      <div className="flex-grow p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">{title} Configuration</h3>
            <p className="text-gray-600">{description}</p>
          </div>

          {/* Placeholder content - this would be replaced with actual configuration UI */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
            <h4 className="text-lg font-medium mb-4">Module Settings</h4>

            {/* Sample content based on the module type */}
            {title === "Data Management" && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg border-gray-200">
                  <h5 className="font-medium mb-2">Upload Dataset</h5>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${colorClasses.text} mb-2`}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <p className="text-sm text-gray-600 text-center mb-2">Drag & drop your MNIST dataset files here</p>
                    <Button size="sm">Browse Files</Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg border-gray-200">
                  <h5 className="font-medium mb-2">Dataset Preview</h5>
                  <div className="grid grid-cols-4 gap-2">
                    {Array(8).fill(0).map((_, i) => (
                      <div key={i} className="aspect-square bg-gray-200 rounded flex items-center justify-center text-gray-400">
                        {i}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {title === "Preprocessing" && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg border-gray-200">
                  <h5 className="font-medium mb-2">Image Normalization</h5>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span>Scale pixel values (0-255) to range (0-1)</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span>Center data around mean</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 border rounded-lg border-gray-200">
                  <h5 className="font-medium mb-2">Data Augmentation</h5>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span>Random rotation (±10°)</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span>Random shift (±2 pixels)</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span>Random zoom (±10%)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {title === "Model Training" && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg border-gray-200">
                  <h5 className="font-medium mb-2">Network Architecture</h5>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm mb-1">Convolutional Layers</label>
                      <select className="w-full border rounded-md p-2">
                        <option>2 layers (simple)</option>
                        <option>3 layers (balanced)</option>
                        <option>4 layers (complex)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Dense Layers</label>
                      <select className="w-full border rounded-md p-2">
                        <option>1 layer (128 units)</option>
                        <option>2 layers (128, 64 units)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg border-gray-200">
                  <h5 className="font-medium mb-2">Training Parameters</h5>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm mb-1">Epochs</label>
                      <input type="range" min="1" max="20" defaultValue="10" className="w-full" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>1</span>
                        <span>10</span>
                        <span>20</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Batch Size</label>
                      <select className="w-full border rounded-md p-2">
                        <option>32</option>
                        <option>64</option>
                        <option>128</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {title === "Completed Model" && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg border-gray-200">
                  <h5 className="font-medium mb-2">Model Performance</h5>
                  <div className="h-40 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-gray-400">Accuracy & Loss Charts</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg border-gray-200">
                  <h5 className="font-medium mb-2">Test Your Model</h5>
                  <div className="flex space-x-4">
                    <div className="w-40 h-40 border rounded-lg border-gray-300 flex items-center justify-center">
                      <span className="text-gray-400">Draw a digit here</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h6 className="font-medium mb-2">Prediction Results</h6>
                      <div className="space-y-1">
                        {Array(3).fill(0).map((_, i) => (
                          <div key={i} className="flex items-center">
                            <div className="w-8 text-center font-medium">{i}</div>
                            <div className="flex-1 bg-gray-200 h-4 rounded-full overflow-hidden">
                              <div
                                className={`${colorClasses.accent} h-full rounded-full`}
                                style={{ width: `${90 - (i * 35)}%` }}
                              ></div>
                            </div>
                            <div className="w-12 text-right text-sm">
                              {90 - (i * 35)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer with action buttons */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button className={colorClasses.button}>
          Save Configuration
        </Button>
      </div>
    </div>
  );
};
