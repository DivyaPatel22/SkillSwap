"use client";

import React, { useEffect, useState } from "react";
import Image from 'next/image';


interface Profile {
  name: string;
  bio: string;
  avatar_url: string;
  time_credits: number;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      
        const res = await fetch("http://localhost:5000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
     
      setLoading(false);
    }
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        Please <a href="/login" className="text-blue-600 underline">login</a> to view your dashboard.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Welcome, {profile.name || "User"}</h1>
      <div className="flex items-center space-x-6 mb-8">
        {profile.avatar_url ? (
          <Image src="https://tse2.mm.bing.net/th/id/OIP.7cRYFyLoDEDh4sRtM73vvwHaDg?rs=1&pid=ImgDetMain&o=7&rm=3" alt="Description" width={400} height={300} />

        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
            No Avatar
          </div>
        )}
        <div>
          <p className="text-lg">{profile.bio || "No bio available."}</p>
          <p className="mt-2 font-semibold">Time Credits: {profile.time_credits ?? 0}</p>
        </div>
      </div>
      {/* Additional dashboard content like active swaps, requests can be added here */}
    </div>
  );
}
