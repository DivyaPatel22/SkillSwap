"use client";

import React, { useEffect, useState } from "react";

interface Skill {
  id: number;
  skill_name: string;
  description: string;
  user_name: string;
  user_id: number;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSkills() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        setError("Please login to browse skills.");
        return;
      }
      
        const res = await fetch("http://localhost:5000/api/skills/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSkills(data);
        } else {
          setError("Failed to load skills.");
        }
      
      setLoading(false);
    }
    fetchSkills();
  }, []);

  async function handleRequestSwap(skillId: number) {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to request a swap.");
      return;
    }
    
      const res = await fetch("http://localhost:5000/api/swap-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ skill_id: skillId }),
      });
      if (res.ok) {
        alert("Swap request sent.");
      } else {
        alert("Failed to send swap request.");
      }
    
  }

  if (loading) {
    return <div className="p-8 text-center">Loading skills...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Browse Skills</h1>
      {skills.length === 0 ? (
        <p>No skills available.</p>
      ) : (
        <ul>
          {skills.map((skill) => (
            <li key={skill.id} className="mb-4 border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold">{skill.skill_name}</h2>
              <p>{skill.description}</p>
              <p className="text-sm text-gray-600">Offered by: {skill.user_name}</p>
              <button
                onClick={() => handleRequestSwap(skill.id)}
                className="mt-2 bg-black text-white py-1 px-3 rounded hover:bg-gray-800 transition"
              >
                Request Swap
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
