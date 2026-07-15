# enrollment-service

Backend service สำหรับจัดการ internal course enrollments, approval/rejection flows, และ certificate readiness checks

## Workspace Note

โฟลเดอร์นี้เป็น workspace root ส่วน source project หลักอยู่ที่:

```text
enrollment-service/
```

## Test Taxonomy

- `unit test`
  - mock ทุก dependency ของ `EnrollmentServiceImpl`
- `component test`
  - ทดสอบ `enrollment-service` ตัวเดียว
  - ใช้ Mongo จริงสำหรับ `EnrollmentRepository`
  - fake `CourseRepository` และ `CertificateService`
- `Bruno API test`
  - ยิง HTTP flow ของ `enrollment-service`
  - ใช้ Dockerized runtime เป็นเส้นทางหลัก
  - ใช้ Mountebank จำลอง certificate API
- `cross-repo integration`
  - ทดสอบ `enrollment-service` คุยกับ `certificate-service` จริง
  - ownership ของ integration harness อยู่ฝั่ง `certificate-service`

อ่านรายละเอียดเพิ่มได้ที่:

- `enrollment-service/README.md`
- `enrollment-service/component/README.md`
- `enrollment-service/unit/README.md`
- `enrollment-service/mountebank/README.md`

## Quick Start for New Developer

ถ้าคุณเพิ่ง clone repo นี้และต้องการเริ่ม run project/test ให้เริ่มตามลำดับนี้

### 1. Install dependencies

```bash
npm install
```

### 2. Run unit tests

ใช้เช็ก business logic หลักของ `EnrollmentServiceImpl`

```bash
npm run test:unit
```

### 3. Run component tests

ใช้เช็ก `enrollment-service` ตัวเดียวผ่าน app จริง โดย:
- ใช้ MongoDB จริงสำหรับ `EnrollmentRepository`
- fake `CourseRepository`
- fake `CertificateService`

```bash
npm run test:component
```

### 4. Run Bruno/API tests

เส้นทางแนะนำหลักสำหรับ API layer คือ Dockerized runtime

```bash
npm run test:bruno
```

คำสั่งนี้จะยก runtime สำหรับ API test ให้เอง และรัน Bruno flow ของ `enrollment-service`

host ports ที่ใช้:
- `3000` = `enrollment-service`
- `2525` = Mountebank admin API
- `4545` = certificate API imposter
- `27018` = MongoDB สำหรับ API test runtime

### 5. Run everything

```bash
npm run test:all
```

คำสั่งนี้จะรัน:
- `unit`
- `component`
- `Bruno/API`

## Test Levels

### Unit Test
- command: `npm run test:unit`
- ทดสอบเฉพาะ `EnrollmentServiceImpl`
- mock ทุก dependency

### Component Test
- command: `npm run test:component`
- ทดสอบ `enrollment-service` ตัวเดียว
- ใช้ MongoDB จริงสำหรับ `EnrollmentRepository`
- fake `CourseRepository` และ `CertificateService`

### Bruno/API Test
- command: `npm run test:bruno`
- ทดสอบ API ผ่าน HTTP จริง
- ใช้ Dockerized runtime เป็น default path
- ใช้ Mountebank จำลอง certificate API

## Useful Commands

รันเฉพาะ Bruno happy path:

```bash
npm run test:bruno:success
```

รันเฉพาะ Bruno alternative path:

```bash
npm run test:bruno:alternative
```

ถ้าต้องการ debug local-process runtime แบบเดิม:

```bash
npm run test:api:local
```

## Notes

- `component test` ไม่ใช้ Docker
- `Bruno/API test` ใช้ Docker เป็น default
- `cross-repo integration` ไม่ได้อยู่ใน repo นี้โดยตรง
- integration harness ระหว่าง `enrollment-service` กับ `certificate-service` อยู่ฝั่ง `certificate-service`
