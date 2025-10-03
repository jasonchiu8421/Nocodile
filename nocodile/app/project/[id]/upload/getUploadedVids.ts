export type uploadedVid = { url: string; title: string; file: File };
export function getUploadedVids(projectId: number): uploadedVid[] {
  /*return fetch(`http://localhost:5000/projects/${projectId}/videos`)
    .then((response) => response.json())
    .then((data) => {
      const uploadedVideos: uploadedVid[] = data.map((item: any) => ({
        url: item.url,
        title: item.title,
        file: item.file,
      }));
      return uploadedVideos;
    });*/

  const placeholderVids: uploadedVid[] = [
    {
      url: "https://www.w3schools.com/html/mov_bbb.mp4",
      title: "Big Buck Bunny",
      file: new File([], "mov_bbb.mp4"),
    },
    {
      url: "https://archive.org/download/electricsheep-flock-248-32500-4/00248%3D32644%3D27831%3D27829.mp4",
      title: "me fr",
      file: new File([], "me_fr.mp4"),
    },
  ];
  return placeholderVids;
}
