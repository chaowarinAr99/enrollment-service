import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGO_DB_NAME ?? 'enrollment_service';

const courses = [
  {
    id: 'PHY001',
    title: 'Physic with sir title',
    status: 'OPEN',
    seatLimit: 99,
    enrolledCount: 0,
  },
  {
    id: 'CHE001',
    title: 'Chemistry with sir title',
    status: 'OPEN',
    seatLimit: 99,
    enrolledCount: 1,
  },
  {
    id: 'COM001',
    title: 'Computer with sir title',
    status: 'OPEN',
    seatLimit: 99,
    enrolledCount: 98,
  },
  {
    id: 'MTH001',
    title: 'Math with sir title',
    status: 'CLOSED',
    seatLimit: 99,
    enrolledCount: 0,
  },
  {
    id: 'BIO001',
    title: 'Biology with sir title',
    status: 'OPEN',
    seatLimit: 99,
    enrolledCount: 99,
  },
];

const enrollments = [
  {
    id: 'ENR009',
    employeeId: 'EMP009',
    courseId: 'PHY001',
    status: 'PENDING_APPROVAL',
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    certificateStatus: null,
    certificateUrl: null,
    createdAt: '2026-05-15T09:00:00Z',
    updatedAt: '2026-05-15T09:00:00Z',
  },
  {
    id: 'ENR010',
    employeeId: 'EMP010',
    courseId: 'CHE001',
    status: 'APPROVED',
    approvedBy: 'HR001',
    approvedAt: '2026-05-15T10:00:00Z',
    rejectedBy: null,
    rejectedAt: null,
    certificateStatus: null,
    certificateUrl: null,
    createdAt: '2026-05-15T09:00:00Z',
    updatedAt: '2026-05-15T10:00:00Z',
  },
];

async function main() {
  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db(dbName);
  await db.dropDatabase();

  await db.collection('courses').insertMany(courses);
  await db.collection('enrollments').insertMany(enrollments);

  await client.close();
}

main().catch((error) => {
  console.error('Failed to reset API runtime seed', error);
  process.exit(1);
});
