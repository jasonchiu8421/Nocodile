"use client";
import Link from "next/link";
//layout for project sidebar
import { useEffect, useState } from "react";
import React from "react";
import { useParams } from "next/navigation";
import { useProcessingContext, ProcessingProvider } from "@/contexts/ProcessingContext";

// 內部組件：使用 context
const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { id: curProjId } = useParams();
  const { isProcessing } = useProcessingContext();

  useEffect(() => {
    //setCurProjId(localStorage.getItem("curProjId"));
  }, []);

  return (
    <main style={{ display: "flex", height: "100vh" }}>
      <nav
        style={{ width: "20%", backgroundColor: "#f4f4f4", padding: "1rem" }}
      >
        <div style={{ padding: "16px 24px", background: "#fff", borderRadius: "16px", boxShadow: "0 1px 4px rgba(16, 30, 54, 0.05)" }}>
        <h2 style={{ fontWeight: 600, marginBottom: "18px", fontSize: "18px", color: "#222" }}>Workflow Steps</h2>
        <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <li style={{ fontWeight: 500, marginBottom: "18px", fontSize: "18px", color: "#222" }}>
            <Link 
              href={`/dashboard`}
              className={isProcessing ? "pointer-events-none opacity-50 cursor-not-allowed" : ""}
              onClick={(e) => {
                if (isProcessing) {
                  e.preventDefault();
                }
              }}
            >
              Return to dashboard
            </Link>
          </li>
          <li style={{ fontWeight: 500, marginBottom: "18px", fontSize: "18px", color: "#222" }}>
            <Link 
              href={`/project/${curProjId}/annotate`}
              className={isProcessing ? "pointer-events-none opacity-50 cursor-not-allowed" : ""}
              onClick={(e) => {
                if (isProcessing) {
                  e.preventDefault();
                }
              }}
            >
              Annotate
            </Link>
          </li>
          <li style={{ fontWeight: 500, marginBottom: "18px", fontSize: "18px", color: "#222" }}>
            <Link 
              href={`/project/${curProjId}/train`}
              className={isProcessing ? "pointer-events-none opacity-50 cursor-not-allowed" : ""}
              onClick={(e) => {
                if (isProcessing) {
                  e.preventDefault();
                }
              }}
            >
              Training
            </Link>
          </li>
          <li style={{ fontWeight: 500, marginBottom: "18px", fontSize: "18px", color: "#222" }}>
            <Link 
              href={`/project/${curProjId}/deploy`}
              className={isProcessing ? "pointer-events-none opacity-50 cursor-not-allowed" : ""}
              onClick={(e) => {
                if (isProcessing) {
                  e.preventDefault();
                }
              }}
            >
              Deploy
            </Link>
          </li>
        </ol>
        </div>
      </nav>

      <section style={{ flex: 1, padding: "2rem", backgroundColor: "#fff" }}>
        {children}
      </section>
    </main>
  );
};

// 外層組件：提供 Provider
const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProcessingProvider>
      <LayoutContent>
        {children}
      </LayoutContent>
    </ProcessingProvider>
  );
};

export default layout;
