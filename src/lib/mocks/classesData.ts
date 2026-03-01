export type ClassStudentRow = {
  id: string;
  name: string;
  avatar_url: string;
  tests_status: string;
  matching_avg: number;
};

export type ClassCard = {
  id: string;
  name: string;
  student_count: number;
  completion_rate: number;
  cover_url: string;
  students: ClassStudentRow[];
};

export const classesData: ClassCard[] = [
  {
    id: "bts-mco-1",
    name: "BTS MCO 1",
    student_count: 24,
    completion_rate: 78,
    cover_url:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    students: [
      {
        id: "mock-10",
        name: "Valentin Lamaille",
        avatar_url:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&h=300&fit=crop",
        tests_status: "Tests complets · MAI 78",
        matching_avg: 82,
      },
      {
        id: "mock-01",
        name: "Jean Durand",
        avatar_url:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
        tests_status: "MAI complet · Stress modéré",
        matching_avg: 88,
      },
      {
        id: "mock-05",
        name: "Ines Saidi",
        avatar_url:
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=300&q=80",
        tests_status: "MAI complet · DYS en cours",
        matching_avg: 79,
      },
    ],
  },
  {
    id: "bts-ndrc-2",
    name: "BTS NDRC 2",
    student_count: 18,
    completion_rate: 71,
    cover_url:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    students: [
      {
        id: "mock-02",
        name: "Sarah Benguigi",
        avatar_url:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
        tests_status: "MAI complet · Stress faible",
        matching_avg: 84,
      },
      {
        id: "mock-06",
        name: "Hugo Bernard",
        avatar_url:
          "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=300&q=80",
        tests_status: "MAI complet · DYS en cours",
        matching_avg: 76,
      },
    ],
  },
  {
    id: "bac-3-commerce-marketing",
    name: "Bac+3 Commerce & Marketing",
    student_count: 15,
    completion_rate: 83,
    cover_url:
      "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1200&q=80",
    students: [
      {
        id: "mock-04",
        name: "Camille Duval",
        avatar_url:
          "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80",
        tests_status: "MAI complet · Stress modéré",
        matching_avg: 86,
      },
      {
        id: "mock-07",
        name: "Maya Rossi",
        avatar_url:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
        tests_status: "MAI complet · Stress élevé",
        matching_avg: 81,
      },
    ],
  },
  {
    id: "bachelor-management-sport",
    name: "Bachelor Management du Sport",
    student_count: 20,
    completion_rate: 76,
    cover_url:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
    students: [
      {
        id: "mock-03",
        name: "Yanis El Khouri",
        avatar_url:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
        tests_status: "MAI complet · DYS détecté",
        matching_avg: 74,
      },
      {
        id: "mock-08",
        name: "Leo Garcia",
        avatar_url:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
        tests_status: "MAI en cours · Stress faible",
        matching_avg: 69,
      },
    ],
  },
  {
    id: "master-strategie-digitale",
    name: "Master Stratégie Digitale",
    student_count: 12,
    completion_rate: 88,
    cover_url:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
    students: [
      {
        id: "mock-09",
        name: "Nina Perret",
        avatar_url:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
        tests_status: "MAI complet · Stress faible",
        matching_avg: 90,
      },
    ],
  },
];
