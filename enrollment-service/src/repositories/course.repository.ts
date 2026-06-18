import type { Course } from '../models/course.js';

export interface CourseRepository {
  findById(courseId: string): Promise<Course | null>;
}
