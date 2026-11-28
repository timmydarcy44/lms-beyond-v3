import { TrainingCoursesCms } from "@/components/super-admin/training-cms/training-courses-cms";

export function SuperTrainingCoursesManager({ catalog = "business" }: { catalog?: "business" | "online" | "care" }) {
  return <TrainingCoursesCms catalog={catalog} />;
}
