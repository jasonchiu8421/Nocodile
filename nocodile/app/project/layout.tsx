import React from "react";

const steps = ["Dashboard", "Upload", "Annotate", "Training", "Deploy"];

const layout = ({ children }) => {
  return (
    <main style={{ display: "flex", height: "100vh" }}>
      <nav
        style={{ width: "20%", backgroundColor: "#f4f4f4", padding: "1rem" }}
      >
        <h2>Workflow Steps</h2>
        <ol className="flex flex-col gap-2 min-h-4">
          {steps.map((step, index) => (
            <li key={index} style={{ margin: "1rem 0" }}>
              <a href={`#${step.toLowerCase()}`}>{step}</a>
            </li>
          ))}
        </ol>
      </nav>

      <section style={{ flex: 1, padding: "2rem" }}>{children}</section>
    </main>
  );
};

export default layout;
