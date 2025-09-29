type ProjectInfo = {
  id: number;
  name: string;
  videoCount: number;
  imageCount: number;
};
export function getProjectsInfo(userId: number) {
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
    { id: 1, name: "Road Sign Detection", videoCount: 75, imageCount: 75 },
    { id: 2, name: "Vehicle Classification", videoCount: 45, imageCount: 45 },
    { id: 3, name: "Pedestrain Tracking", videoCount: 100, imageCount: 100 },
    { id: 4, name: "No Name for this project", videoCount: 30, imageCount: 30 },
    { id: 5, name: "Hello", videoCount: 10000, imageCount: 100000 },
  ];
  return projects;
}
