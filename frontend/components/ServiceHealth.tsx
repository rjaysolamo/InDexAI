"use client";
import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";

export default function ServiceHealth() {
  const [status, setStatus] = useState("Checking service…");
  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const health = await getHealth();
        if (active)
          setStatus(health.trim() === "OK" ? "API online" : "API unavailable");
      } catch {
        if (active) setStatus("API unavailable");
      }
    }
    void check();
    const timer = setInterval(check, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  return (
    <span className="network-badge" role="status">
      <span className="ethereum">◆</span> Ethereum · {status}
    </span>
  );
}
