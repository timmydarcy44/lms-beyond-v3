"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PatientTask } from "@/lib/care/patient-space";

export function PatientTaskList({ tasks }: { tasks: PatientTask[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function toggle(task: PatientTask) {
    setPending(task.id);
    await fetch(`/api/care/patient/tasks/${task.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.doneAt }),
    });
    setPending(null);
    router.refresh();
  }

  return (
    <ul className="patient-tasks">
      {tasks.map((task) => (
        <li key={task.id}>
          <label>
            <input
              type="checkbox"
              checked={Boolean(task.doneAt)}
              disabled={pending === task.id}
              onChange={() => toggle(task)}
              aria-label={task.label}
            />
            <span>
              <strong>{task.label}</strong>
              {task.hint ? <small>{task.hint}</small> : null}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
