"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function TrainingPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Training Page</h1>
      <p>Project ID: {projectId}</p>
      <p>This is a simplified training page for testing.</p>
      
      <div className="mt-4">
        <Link href={`/project/${projectId}/upload`} className="text-blue-600 hover:underline">
          ← Back to Upload
        </Link>
      </div>
    </div>
  );
}