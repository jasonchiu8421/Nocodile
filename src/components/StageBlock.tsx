import React from 'react';

interface Props {
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

export function StageBlock({ title, description, color, icon }: Props) {
  // Instead of using string interpolation for dynamic classes, let's use a function
  const getColorClasses = (colorName: string) => {
    switch (colorName) {
      case 'blue':
        return {
          border: 'border-blue-600',
          accent: 'bg-blue-600',
          icon: 'bg-blue-100 text-blue-600',
          highlight: 'bg-blue-600'
        };
      case 'green':
        return {
          border: 'border-green-600',
          accent: 'bg-green-600',
          icon: 'bg-green-100 text-green-600',
          highlight: 'bg-green-600'
        };
      case 'purple':
        return {
          border: 'border-purple-600',
          accent: 'bg-purple-600',
          icon: 'bg-purple-100 text-purple-600',
          highlight: 'bg-purple-600'
        };
      case 'orange':
        return {
          border: 'border-orange-600',
          accent: 'bg-orange-600',
          icon: 'bg-orange-100 text-orange-600',
          highlight: 'bg-orange-600'
        };
      default:
        return {
          border: 'border-gray-600',
          accent: 'bg-gray-600',
          icon: 'bg-gray-100 text-gray-600',
          highlight: 'bg-gray-600'
        };
    }
  };

  const colorClasses = getColorClasses(color);

  return (
    <div 
      className={`relative rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300 border-2 ${colorClasses.border} bg-white overflow-hidden group h-full flex flex-col`}
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
      <div className={`absolute bottom-0 left-0 w-full h-1 ${colorClasses.highlight} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
      
      {/* Circuit dots */}
      <div className="absolute left-0 top-1/2 w-2 h-2 rounded-full bg-gray-300 transform -translate-x-1/2"></div>
      <div className="absolute right-0 top-1/2 w-2 h-2 rounded-full bg-gray-300 transform translate-x-1/2"></div>
    </div>
  );
}
