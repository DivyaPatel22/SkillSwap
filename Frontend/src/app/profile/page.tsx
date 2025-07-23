"use client";

import React, { useEffect, useState } from "react";

interface Profile {
  name: string;
  bio: string;
  avatar_url: string;
}

interface Skill {
  id: number;
  skill_name: string;
  description: string;
  is_offered: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillDesc, setNewSkillDesc] = useState("");
  const [newSkillOffered, setNewSkillOffered] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfileAndSkills() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      
        const profileRes = await fetch("http://localhost:5000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data);
          setName(data.name || "");
          setBio(data.bio || "");
          setAvatarUrl(data.avatar_url || "");
        }
        const skillsRes = await fetch("http://localhost:5000/api/skills", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (skillsRes.ok) {
          const skillsData = await skillsRes.json();
          setSkills(skillsData);
        }
      
      setLoading(false);
    }
    fetchProfileAndSkills();
  }, []);

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      return;
    }
  
      const res = await fetch("http://localhost:5000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, bio, avatar_url: avatarUrl }),
      });
      if (!res.ok) {
        setError("Failed to update profile");
      }
    
  }

  async function handleAddSkill(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      return;
    }
    
      const res = await fetch("http://localhost:5000/api/skills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          skill_name: newSkillName,
          description: newSkillDesc,
          is_offered: newSkillOffered,
        }),
      });
      if (res.ok) {
        const skill = await res.json();
        setSkills([...skills, skill]);
        setNewSkillName("");
        setNewSkillDesc("");
        setNewSkillOffered(true);
      } else {
        setError("Failed to add skill");
      }
    
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      {error && <div className="mb-4 text-red-600 font-semibold">{error}</div>}
      <form onSubmit={handleProfileUpdate} className="mb-8">
        <label className="block mb-2 font-semibold" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          type="text"
          className="w-full p-2 border border-gray-300 rounded mb-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="block mb-2 font-semibold" htmlFor="bio">
          Bio
        </label>
        <textarea
          id="bio"
          className="w-full p-2 border border-gray-300 rounded mb-4"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <label className="block mb-2 font-semibold" htmlFor="avatarUrl">
          Avatar URL
        </label>
        <input
          id="avatarUrl"
          type="text"
          className="w-full p-2 border border-gray-300 rounded mb-4"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
        <button
          type="submit"
          className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
        >
          Update Profile
        </button>
      </form>

      <h2 className="text-2xl font-bold mb-4">Your Skills</h2>
      <ul className="mb-6">
        {skills.map((skill) => (
          <li key={skill.id} className="mb-2 border-b border-gray-200 pb-2">
            <strong>{skill.skill_name}</strong> - {skill.description} (
            {skill.is_offered ? "Offered" : "Requested"})
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddSkill}>
        <h3 className="text-xl font-semibold mb-4">Add New Skill</h3>
        <label className="block mb-2 font-semibold" htmlFor="skillName">
          Skill Name
        </label>
        <input
          id="skillName"
          type="text"
          className="w-full p-2 border border-gray-300 rounded mb-4"
          value={newSkillName}
          onChange={(e) => setNewSkillName(e.target.value)}
          required
        />
        <label className="block mb-2 font-semibold" htmlFor="skillDesc">
          Description
        </label>
        <textarea
          id="skillDesc"
          className="w-full p-2 border border-gray-300 rounded mb-4"
          value={newSkillDesc}
          onChange={(e) => setNewSkillDesc(e.target.value)}
        />
        <label className="block mb-2 font-semibold" htmlFor="isOffered">
          Offering Skill?
        </label>
        <select
          id="isOffered"
          className="w-full p-2 border border-gray-300 rounded mb-6"
          value={newSkillOffered ? "offered" : "requested"}
          onChange={(e) => setNewSkillOffered(e.target.value === "offered")}
        >
          <option value="offered">Offered</option>
          <option value="requested">Requested</option>
        </select>
        <button
          type="submit"
          className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
        >
          Add Skill
        </button>
      </form>
    </div>
  );
}
