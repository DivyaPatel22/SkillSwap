"use client";

import React, { useEffect, useState } from "react";

interface SwapRequest {
  id: number;
  skill_name: string;
  requester_name: string;
  responder_name: string;
  status: string;
}

export default function SwapRequestsPage() {
  const [incoming, setIncoming] = useState<SwapRequest[]>([]);
  const [outgoing, setOutgoing] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRequests() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        setError("Please login to view swap requests.");
        return;
      }
      
        const resIncoming = await fetch("http://localhost:5000/api/swap-requests/incoming", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const resOutgoing = await fetch("http://localhost:5000/api/swap-requests/outgoing", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resIncoming.ok && resOutgoing.ok) {
          const dataIncoming = await resIncoming.json();
          const dataOutgoing = await resOutgoing.json();
          setIncoming(dataIncoming);
          setOutgoing(dataOutgoing);
        } else {
          setError("Failed to load swap requests.");
        }
      
      setLoading(false);
    }
    fetchRequests();
  }, []);

  async function handleUpdateRequest(id: number, action: "accept" | "reject") {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to update requests.");
      return;
    }
    
      const res = await fetch(`http://localhost:5000/api/swap-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        alert(`Request ${action}ed.`);
        // Refresh requests
        setLoading(true);
        await fetchRequests();
        setLoading(false);
      } else {
        alert("Failed to update request.");
      }
    
  }

  async function fetchRequests() {
    const token = localStorage.getItem("token");
    if (!token) return;
    
      const resIncoming = await fetch("http://localhost:5000/api/swap-requests/incoming", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resOutgoing = await fetch("http://localhost:5000/api/swap-requests/outgoing", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resIncoming.ok && resOutgoing.ok) {
        const dataIncoming = await resIncoming.json();
        const dataOutgoing = await resOutgoing.json();
        setIncoming(dataIncoming);
        setOutgoing(dataOutgoing);
      }
    
  }

  if (loading) {
    return <div className="p-8 text-center">Loading swap requests...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Swap Requests</h1>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Incoming Requests</h2>
        {incoming.length === 0 ? (
          <p>No incoming requests.</p>
        ) : (
          <ul>
            {incoming.map((req) => (
              <li key={req.id} className="mb-4 border-b border-gray-200 pb-4">
                <p>
                  <strong>{req.requester_name}</strong> wants to swap for <strong>{req.skill_name}</strong>.
                </p>
                <p>Status: {req.status}</p>
                {req.status === "pending" && (
                  <div className="mt-2 space-x-2">
                    <button
                      onClick={() => handleUpdateRequest(req.id, "accept")}
                      className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700 transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleUpdateRequest(req.id, "reject")}
                      className="bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700 transition"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-4">Outgoing Requests</h2>
        {outgoing.length === 0 ? (
          <p>No outgoing requests.</p>
        ) : (
          <ul>
            {outgoing.map((req) => (
              <li key={req.id} className="mb-4 border-b border-gray-200 pb-4">
                <p>
                  You requested <strong>{req.skill_name}</strong> from <strong>{req.responder_name}</strong>.
                </p>
                <p>Status: {req.status}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
