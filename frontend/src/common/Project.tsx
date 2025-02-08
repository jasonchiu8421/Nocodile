export interface Project {
  id: number;
  name: string;
}

const placeholderProjects: Project[] = [
  {
    id: 1,
    name: 'Summer Vlog',
  },
  {
    id: 2,
    name: 'Product Review',
  },
  {
    id: 3,
    name: 'Travel Documentary',
  },
  {
    id: 4,
    name: 'Tutorial Series',
  },
  {
    id: 5,
    name: 'Funny Videos',
  },
];

// Utility function to simulate delay in API calls
function simulateDelay<T>(data: T, delay: number = 500): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

// Retrieve all projects
export async function getProjects(): Promise<Project[]> {
  return simulateDelay([...placeholderProjects]);
}

// Retrieve a single project by id
export async function getProject(id: number): Promise<Project | undefined> {
  const project = placeholderProjects.find((p) => p.id === id);
  return simulateDelay(project);
}

// Create a new project
export async function createProject(
  projectData: Omit<Project, 'id'>,
): Promise<Project> {
  const newId =
    placeholderProjects.length > 0
      ? Math.max(...placeholderProjects.map((p) => p.id)) + 1
      : 1;
  const newProject: Project = { id: newId, ...projectData };
  placeholderProjects.push(newProject);
  return simulateDelay(newProject);
}

// Update an existing project
export async function updateProject(
  updatedProject: Project,
): Promise<Project | null> {
  const index = placeholderProjects.findIndex(
    (p) => p.id === updatedProject.id,
  );
  if (index > -1) {
    placeholderProjects[index] = updatedProject;
    return simulateDelay(updatedProject);
  }
  return simulateDelay(null);
}

// Delete a project
export async function deleteProject(id: number): Promise<boolean> {
  const index = placeholderProjects.findIndex((p) => p.id === id);
  if (index > -1) {
    placeholderProjects.splice(index, 1);
    return simulateDelay(true);
  }
  return simulateDelay(false);
}
