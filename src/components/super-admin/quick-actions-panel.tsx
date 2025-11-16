"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Shield, GraduationCap, Users, UserPlus, Settings, Edit, Layers, BookOpen, FileText, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { OrganizationContentAssignmentModal } from "./organization-content-assignment-modal";

type QuickActionChild = {
  id: string;
  label: string;
  icon: typeof Users;
  href?: string;
  action?: () => void;
  variant?: "default" | "danger";
};

type QuickAction = {
  id: string;
  label: string;
  icon: typeof Users;
  description?: string;
  children?: QuickActionChild[];
};

type QuickActionsPanelProps = {
  organizationId: string;
  organizationName?: string;
};

export function QuickActionsPanel({ organizationId, organizationName }: QuickActionsPanelProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>("members");
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: "members",
      label: "Gérer les Membres",
      icon: Users,
      description: "Ajouter ou retirer des membres de l'organisation",
      children: [
        {
          id: "add-member",
          label: "Ajouter un membre",
          icon: UserPlus,
          href: `/super/organisations/${organizationId}/add-member`,
        },
        {
          id: "view-admins",
          label: "Voir les administrateurs",
          icon: Shield,
          href: `/super/organisations/${organizationId}#admins`,
        },
        {
          id: "view-instructors",
          label: "Voir les formateurs",
          icon: GraduationCap,
          href: `/super/organisations/${organizationId}#instructors`,
        },
      ],
    },
    {
      id: "content",
      label: "Gérer le Contenu",
      icon: GraduationCap,
      description: "Formations, parcours, ressources et tests",
      children: [
        {
          id: "view-courses",
          label: "Voir les formations",
          icon: GraduationCap,
          href: `/super/organisations/${organizationId}#courses`,
        },
        {
          id: "view-paths",
          label: "Voir les parcours",
          icon: Layers,
          href: `/super/organisations/${organizationId}#paths`,
        },
        {
          id: "view-resources",
          label: "Voir les ressources",
          icon: BookOpen,
          href: `/super/organisations/${organizationId}#resources`,
        },
        {
          id: "view-tests",
          label: "Voir les tests",
          icon: FileText,
          href: `/super/organisations/${organizationId}#tests`,
        },
        {
          id: "assign-content",
          label: "Assigner du contenu",
          icon: Plus,
          action: () => {
            setAssignmentModalOpen(true);
          },
        },
      ],
    },
    {
      id: "settings",
      label: "Paramètres",
      icon: Settings,
      description: "Options avancées de l'organisation",
      children: [
        {
          id: "view-details",
          label: "Voir les détails",
          icon: Edit,
          href: `/super/organisations/${organizationId}`,
        },
        {
          id: "features",
          label: "Fonctionnalités Premium",
          icon: Sparkles,
          href: `/super/organisations/${organizationId}/features`,
        },
      ],
    },
  ];

  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className="space-y-1">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
        Actions Rapides
      </h2>
      {quickActions.map((action) => {
        const Icon = action.icon;
        const isExpanded = expanded === action.id;

        return (
          <div key={action.id} className="mb-1">
            <button
              type="button"
              onClick={() => toggleExpand(action.id)}
              className={cn(
                "w-full rounded-lg px-4 py-3 flex items-center justify-between text-left transition-all duration-200 group",
                isExpanded 
                  ? "bg-gray-200 text-gray-900" 
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-gray-300"
              )}
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icon className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isExpanded ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"
                )} />
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm font-medium truncate",
                    isExpanded ? "text-gray-900" : "text-gray-700 group-hover:text-gray-900"
                  )}>
                    {action.label}
                  </div>
                </div>
              </div>
              <div className="ml-2 shrink-0">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                )}
              </div>
            </button>

            {isExpanded && action.children && (
              <div className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1">
                {action.children.map((child) => {
                  const ChildIcon = child.icon;

                  if (child.href) {
                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          console.log("[QuickActionsPanel] Navigating to:", child.href);
                          router.push(child.href);
                        }}
                        className="w-full text-left block rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                      >
                        <div className="flex items-center gap-2.5">
                          <ChildIcon className="h-3.5 w-3.5 text-gray-500 group-hover:text-gray-700 transition" />
                          <span>{child.label}</span>
                        </div>
                      </button>
                    );
                  }

                  if (child.action) {
                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={child.action}
                        className={cn(
                          "w-full rounded-lg px-3 py-2.5 text-sm transition-colors flex items-center gap-2.5 text-left",
                          child.variant === "danger"
                            ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                        )}
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                      >
                        <ChildIcon className="h-3.5 w-3.5" />
                        <span>{child.label}</span>
                      </button>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>
        );
      })}
      <OrganizationContentAssignmentModal
        organizationId={organizationId}
        organizationName={organizationName || "l'organisation"}
        open={assignmentModalOpen}
        onClose={() => setAssignmentModalOpen(false)}
      />
    </div>
  );
}
