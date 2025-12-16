"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  full_name?: string | null;
  email?: string | null;
};

type SubscriptionRow = {
  id: string;
  student_id: string;
  student_name: string;
  email?: string | null;
  plan_name: string;
  zoom_sessions?: number | null;
  status: string;
  period: string;
};

type AddStudentResponse = {
  ok?: boolean;
  student?: {
    id: number;
    class_id: number;
    student_id: string;
    enrolled_at?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  } | null;
  error?: string | null;
};

export default function AssignStudentToClassPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  // unwrap params (support sync or Promise)
  const { id: classId } = use(params as Promise<{ id: string }>);

  const router = useRouter();
  const [students, setStudents] = useState<Profile[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedSubscription, setSelectedSubscription] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // For manual entry fallback
  const [manualStudentId, setManualStudentId] = useState<string>("");

  useEffect(() => {
    fetchStudents();
    fetchAllSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  async function fetchStudents() {
    try {
      const res = await fetch("/api/adm/profiles?role=student", {
        credentials: "same-origin",
      });

      const text = await res.text();
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        setStudents([]);
        return;
      }
      const json = JSON.parse(text) as { ok?: boolean; profiles?: Profile[] };
      setStudents(json.profiles ?? []);
    } catch (err) {
      console.error("fetchStudents", err);
      setStudents([]);
    }
  }

  // helper: baca string dari object (safe)
  function getStringFromRecord(
    rec: Record<string, unknown> | undefined | null,
    keys: string[],
    fallback = ""
  ): string {
    if (!rec || typeof rec !== "object") return fallback;
    for (const k of keys) {
      const v = rec[k];
      if (typeof v === "string" && v.trim() !== "") return v;
      // jika v adalah number, konversi ke string
      if (typeof v === "number") return String(v);
    }
    return fallback;
  }

  async function fetchAllSubscriptions() {
    try {
      const res = await fetch("/api/adm/subscriptions", {
        credentials: "same-origin",
      });
      const text = await res.text();
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        setSubscriptions([]);
        return;
      }

      const parsed = JSON.parse(text) as unknown;
      if (!parsed || typeof parsed !== "object") {
        setSubscriptions([]);
        return;
      }

      const json = parsed as { ok?: boolean; subscriptions?: unknown[] };
      const subsRaw = (json.subscriptions ?? []) as Array<
        Record<string, unknown>
      >;

      const mapped: SubscriptionRow[] = subsRaw.map((s) => {
        // pastikan s adalah object
        const sRec =
          typeof s === "object" && s !== null
            ? (s as Record<string, unknown>)
            : {};
        const rawPlan =
          sRec["plan"] && typeof sRec["plan"] === "object"
            ? (sRec["plan"] as Record<string, unknown>)
            : undefined;
        const rawProfile =
          sRec["student_name"] && typeof sRec["student_name"] === "string"
            ? undefined
            : sRec["_raw"] && typeof sRec["_raw"] === "object"
            ? (sRec["_raw"] as Record<string, unknown>)
            : undefined;

        return {
          id: getStringFromRecord(sRec, ["id"]),
          student_id: getStringFromRecord(sRec, ["student_id", "user_id"]),
          student_name: getStringFromRecord(
            sRec,
            ["student_name", "full_name"],
            getStringFromRecord(
              rawProfile,
              ["name", "full_name"],
              getStringFromRecord(sRec, ["student_id"])
            )
          ),
          email: ((): string | null => {
            const v = getStringFromRecord(sRec, ["email", "contact_email"], "");
            return v === "" ? null : v;
          })(),
          plan_name: getStringFromRecord(
            sRec,
            ["plan_name"],
            getStringFromRecord(rawPlan, ["name"], "")
          ),
          zoom_sessions: ((): number | null => {
            const z = rawPlan
              ? rawPlan["zoom_sessions_per_month"] ?? rawPlan["zoom_sessions"]
              : sRec["zoom_sessions"];
            if (typeof z === "number") return z;
            if (
              typeof z === "string" &&
              z.trim() !== "" &&
              !Number.isNaN(Number(z))
            )
              return Number(z);
            return null;
          })(),
          status: getStringFromRecord(sRec, ["status"]),
          period: getStringFromRecord(sRec, ["period"]),
        };
      });

      setSubscriptions(mapped);
    } catch (err) {
      console.error("fetchSubscriptions", err);
      setSubscriptions([]);
    }
  }
  async function handleAdd() {
    setError(null);
    setMsg(null);

    const studentId = selectedStudent || manualStudentId;
    if (!studentId) {
      setError("Pilih atau masukkan Student UUID terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        student_id: studentId,
        subscription_id: selectedSubscription || null,
      };
      const res = await fetch(`/api/adm/classes/${classId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const ct = res.headers.get("content-type") ?? "";

      if (!ct.includes("application/json")) {
        const messagePreview = text.slice(0, 400);
        setError("Respons server tidak valid: " + messagePreview);
        return;
      }

      const json = JSON.parse(text) as AddStudentResponse;

      if (!res.ok) {
        const errMsg = json?.error ?? `HTTP ${res.status}`;
        setError(`Gagal menambahkan student: ${errMsg}`);
        return;
      }

      if (!json.ok) {
        setError(`Gagal: ${json.error ?? "Unknown error"}`);
        return;
      }

      setMsg("Student berhasil ditambahkan ke kelas.");
      // clear selection
      setSelectedStudent("");
      setManualStudentId("");
      setSelectedSubscription(null);

      // kembali ke daftar students dan refresh
      router.push(`/dashboard/admin/classes/${classId}/students`);
    } catch (err) {
      console.error("add student", err);
      setError("Terjadi kesalahan. Cek console.");
    } finally {
      setLoading(false);
    }
  }

  const filteredSubscriptions = selectedStudent
    ? subscriptions.filter((s) => s.student_id === selectedStudent)
    : subscriptions;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        Assign Student to Class — {classId}
      </h1>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Pilih Student</h2>

          <p className="text-sm text-gray-600 mt-2">
            Pilih dari daftar (lebih mudah) atau masukkan UUID manual.
          </p>

          <select
            className="mt-3 w-full border p-2 rounded bg-gray-900"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="">-- pilih student --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name ?? s.email ?? s.id}
              </option>
            ))}
          </select>

          {!selectedStudent && (
            <div className="text-sm text-yellow-600 mt-2">
              Pilih student terlebih dahulu untuk melihat subscription yang
              cocok.
            </div>
          )}

          <div className="mt-3">
            <label className="block text-sm">Atau masukkan Student UUID</label>
            <input
              className="w-full border p-2 rounded mt-2"
              placeholder="uuid student (mis. d30bd895-...)"
              value={manualStudentId}
              onChange={(e) => setManualStudentId(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Subscription (opsional)</h2>
          <p className="text-sm text-gray-600 mt-2">
            Pilih subscription yang terkait (opsional). Jika tidak, biarkan
            kosong.
          </p>

          <select
            className="mt-3 w-full border p-2 rounded"
            value={selectedSubscription ?? ""}
            onChange={(e) => setSelectedSubscription(e.target.value || null)}
          >
            <option value="">-- tidak menggunakan subscription --</option>
            {filteredSubscriptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.student_name} • {s.plan_name} ({s.status})
              </option>
            ))}
          </select>

          <div className="mt-6">
            <button
              onClick={handleAdd}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
            >
              {loading ? "Menambahkan..." : "Add Student to Class"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {msg && (
          <div className="p-3 bg-green-100 text-green-800 rounded">{msg}</div>
        )}
        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded">{error}</div>
        )}
      </div>

      <div className="mt-8 text-sm text-gray-600">
        <strong>Catatan:</strong> Jika `/api/profiles?role=student` atau
        `/api/adm/subscriptions` belum tersedia di backend, daftar dropdown akan
        kosong. Kamu tetap bisa memasukkan UUID student manual.
      </div>
    </div>
  );
}
