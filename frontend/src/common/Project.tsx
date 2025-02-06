interface Project {
  id: number;
  name: string;
  thumbnail: string;
}

export const placeholderProjects: Project[] = [
  {
    id: 1,
    name: 'Summer Vlog',
    thumbnail: 'https://picsum.photos/800/600',
  },
  {
    id: 2,
    name: 'Product Review',
    thumbnail: 'https://picsum.photos/800/600',
  },
  {
    id: 3,
    name: 'Travel Documentary',
    thumbnail: 'https://picsum.photos/800/600',
  },
  {
    id: 4,
    name: 'Tutorial Series',
    thumbnail: 'https://picsum.photos/800/600',
  },
  {
    id: 5,
    name: 'Funny Videos',
    thumbnail: 'https://picsum.photos/800/600',
  },
];

export default Project;
