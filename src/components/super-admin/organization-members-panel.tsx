"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type OrgMember = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  phone: string | null;
  access_lms?: boolean | null;
  access_connect?: boolean | null;
  access_care?: boolean | null;
};

type Props = {
  orgId: string;
  title: string;
  members: OrgMember[];
  maxVisible?: number;
};

const ROLE_OPTIONS = [
  { value: "admin", label: "admin" },
  { value: "student", label: "student" },
  { value: "tutor", label: "tutor" },
  { value: "mentor", label: "mentor" },
];

const ACCESS_FIELDS = [
  { key: "access_lms", label: "Accès LMS" },
  { key: "access_connect", label: "Accès Connect" },
  { key: "access_care", label: "Accès Care" },
] as const;

export function OrganizationMembersPanel({ orgId, title, members, maxVisible = 10 }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [memberState, setMemberState] = useState<Record<string, OrgMember>>(() =>
    members.reduce<Record<string, OrgMember>>((acc, member) => {
      acc[member.id] = member;
      return acc;
    }, {})
  );

  const visibleMembers = useMemo(() => members.slice(0, maxVisible), [members, maxVisible]);

  const handleRoleChange = async (userId: string, role: string) => {
    const previous = memberState[userId]?.role;
    setMemberState((prev) => ({ ...prev, [userId]: { ...prev[userId], role } }));
    try {
      const response = await fetch(
        `/api/super/organisations/${orgId}/members/${userId}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }
      );
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du rôle");
      }
      toast.success("Rôle mis à jour");
    } catch (error) {
      console.error("Error updating member role:", error);
      setMemberState((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], role: previous ?? prev[userId].role },
      }));
      toast.error("Erreur lors de la mise à jour du rôle");
    }
  };

  const handleAccessToggle = async (
    userId: string,
    field: (typeof ACCESS_FIELDS)[number]["key"],
    value: boolean
  ) => {
    const previous = Boolean((memberState[userId] as any)?.[field]);
    setMemberState((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value },
    }));
    try {
      const response = await fetch(`/api/super/utilisateurs/${userId}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value }),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de l'accès");
      }
      toast.success("Accès mis à jour");
    } catch (error) {
      console.error("Error updating access:", error);
      setMemberState((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], [field]: previous },
      }));
      toast.error("Erreur lors de la mise à jour de l'accès");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const response = await fetch(`/api/super/organisations/${orgId}/members/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }
      toast.success("Membre retiré de l'organisation");
      setMemberState((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-2">
      {visibleMembers.map((member) => {
        const data = memberState[member.id] ?? member;
        const isExpanded = expandedId === member.id;
        return (
          <div key={member.id} className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{data.fullName || data.email}</p>
                <p className="text-sm text-gray-600">{data.email}</p>
                {data.phone && <p className="text-xs text-gray-500">{data.phone}</p>}
              </div>
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : member.id)}
                className="text-xs text-gray-400 hover:text-gray-700"
              >
                →
              </button>
            </div>

            {isExpanded && (
              <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-gray-500">Rôle</label>
                  <select
                    value={data.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  {ACCESS_FIELDS.map((field) => (
                    <div
                      key={field.key}
                      className="flex items-center justify-between rounded-md border border-gray-100 bg-white px-3 py-2"
                    >
                      <span className="text-sm text-gray-700">{field.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean((data as any)?.[field.key])}
                        onChange={(e) => handleAccessToggle(member.id, field.key, e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    Retirer
                  </button>
                  <Link
                    href={`/super/utilisateurs/${member.id}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Voir le profil →
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {members.length > maxVisible && (
        <p className="text-sm text-gray-600 text-center pt-2">
          +{members.length - maxVisible} autres membres
        </p>
      )}
    </div>
  );
}
