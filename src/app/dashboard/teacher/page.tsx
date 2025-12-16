// app/dashboard/teacher/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TeacherClass = {
  id: number;
  name: string;
  subject: string;
  grade: string;
};

export default function TeacherDashboardPage() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [stats, setStats] = useState<{
    classes: number;
    students: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchAll() {
      try {
        const [classesRes, statsRes] = await Promise.all([
          fetch("/api/teacher/classes"),
          fetch("/api/teacher/stats"),
        ]);

        if (!isMounted) return;

        const classesJson = await classesRes.json();
        const statsJson = await statsRes.json();

        setClasses(classesJson.classes ?? []);
        setStats(statsJson);
      } catch (err) {
        console.error("fetch teacher dashboard data error", err);
      }
    }

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Teacher</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Kelas</div>
          <div className="text-2xl font-semibold">{stats?.classes ?? "-"}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Total Murid</div>
          <div className="text-2xl font-semibold">{stats?.students ?? "-"}</div>
        </div>
      </div>

      {/* Class list */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Kelas yang Diampu</h2>

        <table className="w-full border rounded">
          <thead className="bg-gray-100 text-gray-900">
            <tr>
              <th className="p-3 text-left">Nama Kelas</th>
              <th className="p-3 text-left">Mapel</th>
              <th className="p-3 text-left">Kelas</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  Belum ada kelas
                </td>
              </tr>
            )}

            {classes.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.subject}</td>
                <td className="p-3">{c.grade}</td>
                <td className="p-3 text-right">
                  <Link
                    href={`/dashboard/teacher/classes/${c.id}`}
                    className="text-blue-600"
                  >
                    Lihat
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
