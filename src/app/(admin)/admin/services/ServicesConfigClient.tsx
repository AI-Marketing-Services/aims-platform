"use client";

import { useEffect, useState, useCallback } from "react";
import { Save, ExternalLink, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface ServiceArm {
  id: string;
  slug: string;
  name: string;
  pillar: string;
  status: string;
  asanaProjectGid: string | null;
  asanaAssigneeGid: string | null;
  asanaTaskTemplate: { name?: string; notes?: string; subtasks?: string[] } | null;
  ctaUrl: string | null;
  defaultAssignee: string | null;
}

interface AsanaUser {
  gid: string;
  name: string;
  email: string;
}

interface AsanaProject {
  gid: string;
  name: string;
}

interface SaveState {
  [id: string]: "idle" | "saving" | "saved" | "error";
}

export default function ServicesConfigClient() {
  const [services, setServices] = useState<ServiceArm[]>([]);
  const [users, setUsers] = useState<AsanaUser[]>([]);
  const [projects, setProjects] = useState<AsanaProject[]>([]);
  const [edits, setEdits] = useState<Record<string, Partial<ServiceArm>>>({});
  const [saveState, setSaveState] = useState<SaveState>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/services").then((r) => r.json()),
      fetch("/api/admin/asana/users").then((r) => r.json()),
      fetch("/api/admin/asana/projects").then((r) => r.json()),
    ]).then(([svcs, asanaUsers, asanaProjects]) => {
      setServices(svcs);
      setUsers(Array.isArray(asanaUsers) ? asanaUsers.filter((u: AsanaUser) => u.name && !u.name.includes("@")) : []);
      setProjects(Array.isArray(asanaProjects) ? asanaProjects : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getVal = useCallback(<K extends keyof ServiceArm>(svc: ServiceArm, key: K): ServiceArm[K] => {
    return (edits[svc.id]?.[key] ?? svc[key]) as ServiceArm[K];
  }, [edits]);

  const setEdit = useCallback((id: string, key: keyof ServiceArm, value: unknown) => {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value },
    }));
  }, []);

  const save = useCallback(async (svc: ServiceArm) => {
    setSaveState((p) => ({ ...p, [svc.id]: "saving" }));
    try {
      const patch = { ...svc, ...edits[svc.id], id: svc.id };
      const res = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      // Update local services state so it reflects the saved data
      setServices((prev) =>
        prev.map((s) => (s.id === svc.id ? { ...s, ...updated } : s))
      );
      // Clear edits for this service since they're now saved
      setEdits((prev) => {
        const next = { ...prev };
        delete next[svc.id];
        return next;
      });
      setSaveState((p) => ({ ...p, [svc.id]: "saved" }));
      setTimeout(() => setSaveState((p) => ({ ...p, [svc.id]: "idle" })), 2000);
    } catch {
      setSaveState((p) => ({ ...p, [svc.id]: "error" }));
    }
  }, [edits]);

  // Group by pillar
  const grouped = services.reduce<Record<string, ServiceArm[]>>((acc, svc) => {
    acc[svc.pillar] = acc[svc.pillar] ?? [];
    acc[svc.pillar].push(svc);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading services and Asana data...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([pillar, svcs]) => (
        <div key={pillar}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {pillar.replace(/_/g, " ")}
          </h2>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">CTA URL</th>
                  <th className="px-4 py-3">Asana Project</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3 text-right">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {svcs.map((svc) => {
                  const state = saveState[svc.id] ?? "idle";
                  const isExpanded = expandedId === svc.id;
                  const template = (getVal(svc, "asanaTaskTemplate") as ServiceArm["asanaTaskTemplate"]) ?? {};

                  return (
                    <>
                      <tr key={svc.id} className="group hover:bg-gray-50">
                        {/* Service name */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : svc.id)}
                            className="text-left"
                          >
                            <p className="font-semibold text-gray-900">{svc.name}</p>
                            <p className="text-xs text-gray-400">{svc.slug}</p>
                          </button>
                        </td>

                        {/* CTA URL */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="url"
                              placeholder="https://..."
                              value={(getVal(svc, "ctaUrl") as string) ?? ""}
                              onChange={(e) => setEdit(svc.id, "ctaUrl", e.target.value)}
                              className="w-48 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            {getVal(svc, "ctaUrl") && (
                              <a href={getVal(svc, "ctaUrl") as string} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5 text-gray-400 hover:text-green-600" />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Asana Project */}
                        <td className="px-4 py-3">
                          <select
                            value={(getVal(svc, "asanaProjectGid") as string) ?? ""}
                            onChange={(e) => setEdit(svc.id, "asanaProjectGid", e.target.value)}
                            className="w-48 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                          >
                            <option value="">— No project —</option>
                            {projects.map((p) => (
                              <option key={p.gid} value={p.gid}>{p.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* Assignee */}
                        <td className="px-4 py-3">
                          <select
                            value={(getVal(svc, "asanaAssigneeGid") as string) ?? ""}
                            onChange={(e) => setEdit(svc.id, "asanaAssigneeGid", e.target.value)}
                            className="w-44 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                          >
                            <option value="">— Unassigned —</option>
                            {users.map((u) => (
                              <option key={u.gid} value={u.gid}>{u.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* Save button */}
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => save(svc)}
                            disabled={state === "saving"}
                            className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {state === "saving" && <RefreshCw className="h-3 w-3 animate-spin" />}
                            {state === "saved" && <CheckCircle2 className="h-3 w-3" />}
                            {state === "error" && <AlertCircle className="h-3 w-3" />}
                            {state === "saving" ? "Saving..." : state === "saved" ? "Saved!" : state === "error" ? "Error" : <><Save className="h-3 w-3" /> Save</>}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded: Task Template */}
                      {isExpanded && (
                        <tr key={`${svc.id}-expanded`} className="bg-green-50">
                          <td colSpan={5} className="px-4 py-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Asana Task Template <span className="ml-2 font-normal normal-case text-gray-400">Variables: {"{{client}}"}, {"{{service}}"}, {"{{tier}}"}, {"{{email}}"}, {"{{amount}}"}</span>
                            </p>
                            <div className="grid gap-3 lg:grid-cols-3">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Task Name</label>
                                <input
                                  type="text"
                                  placeholder="New Client: {{client}} — {{service}}"
                                  value={template?.name ?? ""}
                                  onChange={(e) => setEdit(svc.id, "asanaTaskTemplate", { ...template, name: e.target.value })}
                                  className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Task Notes / Description</label>
                                <textarea
                                  rows={3}
                                  placeholder={"Client: {{client}}\nEmail: {{email}}\nService: {{service}}"}
                                  value={template?.notes ?? ""}
                                  onChange={(e) => setEdit(svc.id, "asanaTaskTemplate", { ...template, notes: e.target.value })}
                                  className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Subtasks (one per line)</label>
                                <textarea
                                  rows={3}
                                  placeholder={"Send welcome email\nSchedule kickoff call\nSet up tracking"}
                                  value={(template?.subtasks ?? []).join("\n")}
                                  onChange={(e) => setEdit(svc.id, "asanaTaskTemplate", {
                                    ...template,
                                    subtasks: e.target.value.split("\n").filter(Boolean),
                                  })}
                                  className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
