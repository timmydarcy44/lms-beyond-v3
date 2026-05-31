export type BriefingActionType = "email" | "call" | "linkedin";

export type BriefingEmail = {
  subject: string;
  body: string;
};

export type BriefingCallScript = {
  hook: string;
  pitch: string;
  objection_time: string;
  objection_interest: string;
  goal: string;
};

export type BriefingPriority = {
  rank: number;
  company: string;
  why_today: string;
  action_type: BriefingActionType;
  contact_name: string | null;
  contact_role: string;
  email: BriefingEmail | null;
  call_script: BriefingCallScript | null;
  linkedin_message: string | null;
  prospect_id?: string;
  contact_email?: string | null;
};

export type BriefingDoNotContact = {
  company: string;
  reason: string;
};

export type DailyBriefing = {
  pipeline_status: {
    total: number;
    actions_overdue: number;
    actions_today: number;
    top_insight: string;
  };
  priorities: BriefingPriority[];
  max_priorities: number;
  do_not_contact_today: BriefingDoNotContact[];
  daily_tip: string;
};

export type BriefingApiResponse = {
  briefing: DailyBriefing;
  generated_at: string;
};
