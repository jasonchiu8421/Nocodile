"use client";

import React from "react";
import Link from "next/link";

const steps = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Upload", href: "/upload" },
  { label: "Annotate", href: "/annotate" },
  { label: "Train", href: "/training" },
  { label: "Deploy", href: "/deploy" },
];

export default function DeployPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/templogo.png" alt="Nocodile AI" className="h-8 w-8" />
            <span className="font-semibold">Nocodile AI</span>
          </div>
          <div className="flex-1 max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + New Project
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="bg-white rounded-xl border border-gray-200 p-4 h-fit">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Workflow Steps</h2>
          <ol className="space-y-1">
            {steps.map((step) => (
              <li key={step.label}>
                <Link
                  href={step.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 ${
                    step.label === "Deploy" ? "bg-blue-50 text-blue-700 border border-blue-200" : ""
                  }`}
                >
                  <span className="w-6 text-center">
                    {String(steps.findIndex((s) => s.label === step.label) + 1)}.
                  </span>
                  <span>{step.label}</span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>

        {/* Main content */}
        <main className="space-y-6">
          {/* My Projects / Metrics */}
          <section className="space-y-3">
            <h1 className="text-lg font-semibold">My Projects</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-sm font-medium text-gray-600">Model Performance</div>
                <div className="mt-2 text-3xl font-bold text-green-600">92% mAP</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-sm font-medium text-gray-600">Precision</div>
                <div className="mt-2 text-2xl font-bold text-green-600">94%</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-sm font-medium text-gray-600">Recall</div>
                <div className="mt-2 text-2xl font-bold text-orange-600">89%</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-sm font-medium text-gray-600">F1-Score</div>
                <div className="mt-2 text-2xl font-bold text-purple-600">91%</div>
              </div>
            </div>
          </section>

          {/* Deploy Your Model */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <h2 className="text-lg font-semibold">Deploy Your Model</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Option 1 */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold">Option 1: Deploy to Car Model</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Download the trained model file compatible with your vehicle's system.
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-500">Model format: ONNX</div>
                  <button className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Download Model File
                  </button>
                </div>
              </div>

              {/* Option 2 */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold">Option 2: Cloud API</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Use our hosted API for inference. Here's how to get started:
                </p>
                <pre className="mt-3 bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
{`curl -X POST "https://api.autovision.ai/v1/predict" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/image.jpg"`}
                </pre>
                <Link href="#" className="mt-2 inline-flex text-blue-600 hover:underline">
                  Get API Key
                </Link>
              </div>
            </div>

            {/* Bottom buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between pt-2">
              <div className="flex gap-3">
                <Link
                  href="/training"
                  className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Back to Training
                </Link>
                <Link
                  href="#"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                >
                  Configure Behavior Rules
                </Link>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
              >
                Create New Project
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}


