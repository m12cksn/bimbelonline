// src/app/dashboard/student/classes/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ClassRow = {
  id: number;
  name: string;
};

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/student/classes");
      const json = await res.json();
      if (res.ok && json.ok) {
        setClasses(json.classes ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Classes</h1>

      {classes.length === 0 && (
        <p className="text-gray-400">Belum tergabung di kelas</p>
      )}

      {classes.map((c) => (
        <Link
          key={c.id}
          href={`/dashboard/student/classes/${c.id}/zoom`}
          className="block border rounded p-4 hover:bg-slate-800"
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
