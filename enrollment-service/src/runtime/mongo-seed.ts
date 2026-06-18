import type { Collection } from 'mongodb';

import type { Course } from '../models/course.js';
import type { Enrollment } from '../models/enrollment.js';
import { createSeedState } from './seed-data.js';

type SeedableCollection<T extends { id: string }> = Collection<T>;

async function upsertById<T extends { id: string }>(
  collection: SeedableCollection<T>,
  document: T,
) {
  await collection.updateOne(
    { id: document.id },
    {
      $set: document,
    },
    { upsert: true },
  );
}

export async function seedMongoCollections(input: {
  coursesCollection: SeedableCollection<Course>;
  enrollmentsCollection: SeedableCollection<Enrollment>;
}) {
  const seedState = createSeedState();

  for (const course of seedState.courses) {
    await upsertById(input.coursesCollection, course);
  }

  for (const enrollment of seedState.enrollments) {
    await upsertById(input.enrollmentsCollection, enrollment);
  }
}
