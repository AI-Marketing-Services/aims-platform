const ASANA_BASE = "https://app.asana.com/api/1.0";
const PAT = process.env.ASANA_PAT;
const WORKSPACE_GID = process.env.ASANA_WORKSPACE_GID;

function isConfigured(): boolean {
  if (!PAT || !WORKSPACE_GID) {
    console.warn("[Asana] Missing ASANA_PAT or ASANA_WORKSPACE_GID - skipping Asana API call");
    return false;
  }
  return true;
}

function asanaHeaders() {
  return {
    Authorization: `Bearer ${PAT}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function asanaGet(path: string) {
  const res = await fetch(`${ASANA_BASE}${path}`, {
    headers: asanaHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Asana GET ${path} failed: ${res.status}`);
  return res.json();
}

async function asanaPost(path: string, body: object) {
  const res = await fetch(`${ASANA_BASE}${path}`, {
    method: "POST",
    headers: asanaHeaders(),
    body: JSON.stringify({ data: body }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Asana POST ${path} failed: ${res.status} - ${err}`);
  }
  return res.json();
}

export async function listWorkspaceUsers(): Promise<Array<{ gid: string; name: string; email: string }>> {
  if (!isConfigured()) return [];
  const data = await asanaGet(`/workspaces/${WORKSPACE_GID}/users?opt_fields=gid,name,email`);
  return data.data ?? [];
}

export async function listWorkspaceProjects(): Promise<Array<{ gid: string; name: string }>> {
  if (!isConfigured()) return [];
  const data = await asanaGet(`/projects?workspace=${WORKSPACE_GID}&opt_fields=gid,name&limit=100`);
  return data.data ?? [];
}

export interface CreateTaskParams {
  projectGid: string;
  assigneeGid?: string;
  name: string;
  notes: string;
  subtasks?: string[];
  dueDate?: string; // YYYY-MM-DD
}

export async function createAsanaTask(params: CreateTaskParams) {
  if (!isConfigured()) return null;

  const task = await asanaPost("/tasks", {
    name: params.name,
    notes: params.notes,
    projects: [params.projectGid],
    assignee: params.assigneeGid ?? null,
    due_on: params.dueDate ?? null,
    workspace: WORKSPACE_GID,
  });

  const taskGid = task.data?.gid;
  if (!taskGid) return task;

  // Create subtasks if provided
  if (params.subtasks && params.subtasks.length > 0) {
    for (const subtaskName of params.subtasks) {
      await asanaPost(`/tasks/${taskGid}/subtasks`, {
        name: subtaskName,
        assignee: params.assigneeGid ?? null,
      }).catch(console.error);
    }
  }

  return task;
}

export interface FulfillmentContext {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  tier?: string;
  monthlyAmount: number;
  subscriptionId: string;
  portalUrl: string;
  asanaProjectGid: string;
  asanaAssigneeGid?: string;
  asanaTaskTemplate?: {
    name?: string;
    notes?: string;
    subtasks?: string[];
  };
}

export async function createFulfillmentTask(ctx: FulfillmentContext) {
  if (!isConfigured()) return null;

  const taskName = ctx.asanaTaskTemplate?.name
    ? ctx.asanaTaskTemplate.name
        .replace("{{client}}", ctx.clientName)
        .replace("{{service}}", ctx.serviceName)
        .replace("{{tier}}", ctx.tier ?? "")
    : `New Client: ${ctx.clientName} - ${ctx.serviceName}${ctx.tier ? ` (${ctx.tier})` : ""}`;

  const defaultNotes = [
    `New subscription purchased - fulfillment required.`,
    ``,
    `Client: ${ctx.clientName} (${ctx.clientEmail})`,
    `Service: ${ctx.serviceName}${ctx.tier ? ` - ${ctx.tier}` : ""}`,
    `Monthly Amount: $${ctx.monthlyAmount}/mo`,
    ``,
    `Portal: ${ctx.portalUrl}`,
    `Subscription ID: ${ctx.subscriptionId}`,
  ].join("\n");

  const notes = ctx.asanaTaskTemplate?.notes
    ? ctx.asanaTaskTemplate.notes
        .replace("{{client}}", ctx.clientName)
        .replace("{{email}}", ctx.clientEmail)
        .replace("{{service}}", ctx.serviceName)
        .replace("{{tier}}", ctx.tier ?? "")
        .replace("{{amount}}", String(ctx.monthlyAmount))
        .replace("{{portal}}", ctx.portalUrl)
    : defaultNotes;

  const dueDate = new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0];

  return createAsanaTask({
    projectGid: ctx.asanaProjectGid,
    assigneeGid: ctx.asanaAssigneeGid,
    name: taskName,
    notes,
    subtasks: ctx.asanaTaskTemplate?.subtasks,
    dueDate,
  });
}
