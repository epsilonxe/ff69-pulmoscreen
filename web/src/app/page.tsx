"use client";

import { useEffect, useRef, useState } from "react";
import {
  AGE_MAX,
  AGE_MIN,
  API_URL,
  DEFAULT_FORM,
  FormState,
  Gender,
  PredictResponse,
  RISK_LABEL_TH,
  SYMPTOM_FIELDS,
} from "../lib/fields";

const RISK_CHIP: Record<PredictResponse["risk"], string> = {
  low: "bg-emerald-100 text-emerald-800 border-emerald-300",
  moderate: "bg-amber-100 text-amber-800 border-amber-300",
  high: "bg-rose-100 text-rose-800 border-rose-300",
};

export default function Home() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const set = (field: string, value: boolean | Gender | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  // Auto-predict: debounce form changes, cancel any in-flight request.
  useEffect(() => {
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        setResult((await res.json()) as PredictResponse);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError("ไม่สามารถเชื่อมต่อบริการทำนายได้");
      } finally {
        if (abortRef.current === ac) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [form]);

  const positive = result?.label === "YES";
  const pct = result ? (result.probability * 100).toFixed(1) : "0.0";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">PulmoScreen</h1>
        <p className="mt-0.5 text-sm font-medium text-slate-600">
          ระบบคัดกรองความเสี่ยงมะเร็งปอด
        </p>
        <p className="mt-0.5 text-sm text-slate-500">
          ต้นแบบซอฟต์แวร์ด้วยแบบจำลองเครื่องจักรเรียนรู้สูงสุด (โครงการ FF69)
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* ---------- inputs ---------- */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            {/* Sex — two-option selector */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                เพศ
              </label>
              <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
                {(["M", "F"] as Gender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => set("gender", g)}
                    className={`px-5 py-1.5 text-sm font-medium transition ${
                      form.gender === g
                        ? "bg-slate-800 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {g === "M" ? "ชาย" : "หญิง"}
                  </button>
                ))}
              </div>
            </div>

            {/* Age — integer field + slider */}
            <div className="min-w-[220px] flex-1">
              <label
                htmlFor="age"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                อายุ (ปี)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="age"
                  type="number"
                  inputMode="numeric"
                  min={AGE_MIN}
                  max={AGE_MAX}
                  step={1}
                  value={form.age}
                  onChange={(e) =>
                    set(
                      "age",
                      Math.max(
                        AGE_MIN,
                        Math.min(
                          AGE_MAX,
                          Math.round(Number(e.target.value) || 0),
                        ),
                      ),
                    )
                  }
                  className="w-20 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
                />
                <input
                  type="range"
                  min={AGE_MIN}
                  max={AGE_MAX}
                  step={1}
                  value={form.age}
                  onChange={(e) => set("age", Number(e.target.value))}
                  className="flex-1 accent-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Symptoms — compact yes/no chips */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              อาการและปัจจัยเสี่ยง{" "}
              <span className="font-normal text-slate-400">(แตะเพื่อเลือก “มี”)</span>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SYMPTOM_FIELDS.map((s) => {
                const on = Boolean(form[s.field]);
                return (
                  <button
                    key={s.field}
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => set(s.field, !on)}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xs transition ${
                      on
                        ? "border-slate-800 bg-slate-800 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded border text-[10px] ${
                        on
                          ? "border-white/60 bg-white/20"
                          : "border-slate-300"
                      }`}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <span>{s.labelTh}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* ---------- result (sticky) ---------- */}
        <aside
          className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-8 ${
            loading ? "opacity-70" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-500">ผลการทำนาย</h2>
            {loading && (
              <span className="text-xs text-slate-400">กำลังคำนวณ…</span>
            )}
          </div>

          {error ? (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : !result ? (
            <p className="mt-3 text-sm text-slate-400">
              กำลังโหลดผลการทำนาย…
            </p>
          ) : (
            <>
              <p
                className={`mt-2 text-2xl font-bold ${
                  positive ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {positive ? "พบความเสี่ยง (1)" : "ไม่พบความเสี่ยง (0)"}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                การทำนายมะเร็งปอดแบบทวิภาค
              </p>

              <div className="mt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-slate-600">
                    ความน่าจะเป็นที่จะเป็นมะเร็งปอด
                  </span>
                  <span className="text-lg font-semibold text-slate-800">
                    {pct}%
                  </span>
                </div>
                <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      positive ? "bg-rose-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${RISK_CHIP[result.risk]}`}
                >
                  ระดับความเสี่ยง: {RISK_LABEL_TH[result.risk]}
                </span>
                <span className="text-xs text-slate-400">
                  เกณฑ์ตัดสิน &gt; {result.threshold.toFixed(2)}
                </span>
              </div>

              <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
                ผลนี้เป็นการคัดกรองเบื้องต้นจากต้นแบบเพื่อการวิจัย
                ไม่ใช่การวินิจฉัยทางการแพทย์
              </p>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
