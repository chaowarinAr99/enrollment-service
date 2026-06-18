export type CourseStatus = 'OPEN' | 'CLOSED';

export type Course = {
  id: string;
  title: string;
  status: CourseStatus;
  seatLimit: number;
  enrolledCount: number;
};
