export type ProjectInfo = {
  id: number;
  name: string;
  videoCount: number;
  imageCount: number;
  description?: string;
  status?: StatusType;
};
export type StatusType =
  | "No uploads"
  | "Annotating"
  | "Annotation Completed"
  | "Training"
  | "Finish training"
  | "Complete";
export function getProjectsInfo(userId: number): ProjectInfo[] {
  //IT WILL BE ASYNC.......
  //: Promise<ProjectInfo> {
  /*
  const res = await fetch(
    `http://localhost:5000/get_projects_info?user_id=${userId}`,
    {
      cache: "no-store",
    }
  );*/

  // Get this from server
  const projects = [
    {
      id: 1,
      name: "Road Sign Detection",
      videoCount: 75,
      imageCount: 75,
      description: "Detect various road signs in images and videos",
      status: "In Progress",
    },
    {
      id: 2,
      name: "Vehicle Classification",
      videoCount: 45,
      imageCount: 45,
      description: "Classify vehicles in images and videos",
      status: "Complete",
    },
    {
      id: 3,
      name: "Pedestrian Tracking",
      videoCount: 100,
      imageCount: 100,
      description: "Track pedestrians in images and videos",
      status: "In Progress",
    },
    {
      id: 4,
      name: "No Name for this project",
      videoCount: 30,
      imageCount: 30,
      description: "No description available",
      status: "No uploads",
    },
    {
      id: 5,
      name: "Hello",
      videoCount: 10000,
      imageCount: 100000,
      description: "No description available",
      status: "No uploads",
    },
  ];
  return projects;
}
