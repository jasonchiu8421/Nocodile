"use client";
import Link from "next/link";
//layout for project sidebar
import { useEffect, useState } from "react";
import React from "react";
import { useParams } from "next/navigation";

const layout = ({ children }: { children: React.ReactNode }) => {
  const { id: curProjId } = useParams();

  useEffect(() => {
    //setCurProjId(localStorage.getItem("curProjId"));
  }, []);

  // const saveValue = () => {
  //   localStorage.setItem("myKey", "Hello World!");
  //   setValue("Hello World!");
  //};

  return (
    <main style={{ display: "flex", height: "100vh" }}>
      <nav
        style={{ width: "20%", backgroundColor: "#f4f4f4", padding: "1rem" }}
      >
        <h2>Workflow Steps</h2>
        <ol className="flex flex-col gap-2 min-h-4">
          <li>
            <Link href={`/dashboard`}>Return to dashboard</Link>
          </li>
          <li>
            <Link href={`/project/${curProjId}/upload`}>Upload</Link>
          </li>
          <li>
            <Link href={`/project/${curProjId}/annotate`}>Annotate</Link>
          </li>
          <li>
            <Link href={`/project/${curProjId}/training`}>Training</Link>
          </li>
          <li>
            <Link href={`/project/${curProjId}/deploy`}>Deploy</Link>
          </li>
        </ol>
      </nav>

      <section style={{ flex: 1, padding: "2rem", backgroundColor: "#fff" }}>
        {children}
      </section>
    </main>
  );
};

export default layout;
