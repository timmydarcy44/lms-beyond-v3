import { TrainingCoursesCms } from "@/components/super-admin/training-cms/training-courses-cms";

export function SuperTrainingCoursesManager({ catalog = "business" }: { catalog?: "business" | "online" }) {
  return <TrainingCoursesCms catalog={catalog} />;
}
