import React from "react";
import { useParams } from "next/navigation";

const AnnotatePage = () => {
  const { url: url } = useParams();
  return <div>AnnotatePage, view {url}</div>;
};

export default AnnotatePage;
