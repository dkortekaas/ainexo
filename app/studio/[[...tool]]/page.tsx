"use client";

import { NextStudio } from "next-sanity/studio";
import { useEffect, useState } from "react";

// Opt out of static generation for this route
export const dynamic = "force-dynamic";

export default function StudioPage() {
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Dynamically import and create config to handle missing env vars gracefully
    import("@/sanity/config")
      .then((module) => {
        try {
          // Use the createSanityConfig function which validates env vars
          const config = module.createSanityConfig();
          setConfig(config);
        } catch (err: any) {
          setError(err.message || "Failed to create Sanity configuration");
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load Sanity configuration");
      });
  }, []);

  if (error) {
    return (
      <div
        style={{
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <h1 style={{ color: "#ef4444", marginBottom: "1rem" }}>
          Sanity Configuration Error
        </h1>
        <p style={{ marginBottom: "1rem", color: "#6b7280" }}>{error}</p>
        <div
          style={{
            backgroundColor: "#f3f4f6",
            padding: "1rem",
            borderRadius: "0.5rem",
            marginTop: "1rem",
          }}
        >
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: "600",
              marginBottom: "0.5rem",
            }}
          >
            Required Environment Variables:
          </h2>
          <ul
            style={{
              listStyle: "disc",
              paddingLeft: "1.5rem",
              color: "#374151",
            }}
          >
            <li>
              <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code>
            </li>
            <li>
              <code>NEXT_PUBLIC_SANITY_DATASET</code>
            </li>
          </ul>
          <p
            style={{
              marginTop: "1rem",
              fontSize: "0.875rem",
              color: "#6b7280",
            }}
          >
            Please add these to your <code>.env.local</code> file or Vercel
            environment variables.
          </p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div
        style={{
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#6b7280" }}>Loading Sanity Studio...</p>
      </div>
    );
  }

  return <NextStudio config={config} />;
}
