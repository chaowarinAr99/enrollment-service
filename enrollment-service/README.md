# enrollment-service

Local workspace สำหรับฝึก `unit test + component test + Bruno API test` ของ `enrollment-service`

## What You Can Run

- MongoDB สำหรับ local runtime
- Mountebank สำหรับ mock certificate API
- Express app ของ `enrollment-service`
- Bruno collection สำหรับยิง API flow
- component test structure สำหรับ Mongo จริง + fake `CertificateService`

## Test Taxonomy

- `unit test`
  - mock dependencies ทั้งหมดของ `EnrollmentServiceImpl`
- `component test`
  - ทดสอบ `enrollment-service` ตัวเดียว
  - ใช้ MongoDB จริงสำหรับ `EnrollmentRepository`
  - fake `CourseRepository` และ `CertificateService`
  - ไม่วิ่งไปถึง `certificate-service` หรือ external provider
- `Bruno API test`
  - ยิง API ของ `enrollment-service` ผ่าน HTTP จริง
  - แนะนำให้ใช้ Dockerized runtime เป็น default path
  - ใช้ Mountebank จำลอง certificate API
- `cross-repo integration`
  - ใช้ `enrollment-service` คุยกับ `certificate-service` จริง
  - ชั้นนี้ควรอยู่ฝั่ง integration harness ของ `certificate-service` ไม่ใช่ใน `component/`

## Current Progress

- Unit tests: `38 passed`
- Component tests: `37 passed`
- API test assets (Bruno): ready and organized by `TC01-TC17`
- Dockerized Bruno runner: ready (`npm run test:bruno`)
- Full local regression: ready (`npm run test:all`)

## Prerequisites

ต้องมีอย่างน้อย:

- Node.js
- npm
- Docker

## Environment

ตัวอย่าง environment อยู่ที่:

```text
.env.example
```

ค่าหลักที่ใช้ตอน local run:

```text
PORT=3000
MONGO_URL=mongodb://127.0.0.1:27017
MONGO_DB_NAME=enrollment_service
MONGO_SEED_ON_START=true
CERTIFICATE_API_URL=http://localhost:4545/certificates
CERTIFICATE_API_TIMEOUT_MS=3000
```

## Available Scripts

```bash
npm test
npm run test:unit
npm run test:component
npm run test:bruno
npm run test:bruno:success
npm run test:bruno:alternative
npm run test:api
npm run test:api:local
npm run test:api:success
npm run test:api:success:local
npm run test:api:alternative
npm run test:api:alternative:local
npm run test:api:docker
npm run test:api:success:docker
npm run test:api:alternative:docker
npm run test:all
npm run start
npm run start:dev
npm run mongo:start
npm run mb:start
```

## Local Runtime Fallback

หัวข้อนี้อธิบาย local-process runtime แบบเดิมสำหรับใช้ debug หรือทดลอง flow เองทีละ step

เส้นทางแนะนำหลักของ API layer ยังเป็น:

```bash
npm run test:bruno
```

## Step by Step

### 1. Enter the project

```bash
cd /Users/chaowarin/Downloads/enrollment-service/enrollment-service
```

### 2. Start MongoDB

```bash
npm run mongo:start
```

Mongo จะฟังที่:

```text
mongodb://127.0.0.1:27017
```

### 3. Start Mountebank

เปิดอีก terminal แล้วรัน:

```bash
cd /Users/chaowarin/Downloads/enrollment-service/enrollment-service
npm run mb:start
```

Mountebank admin API จะอยู่ที่:

```text
http://localhost:2525
```

### 4. Load an imposter

ตัวอย่าง success case ของ TC01:

```bash
curl -X POST http://localhost:2525/imposters \
  -H "Content-Type: application/json" \
  -d @mountebank/imposters/certificate-service/success/tc01-generate-certificate-success.json
```

เช็กว่าถูกโหลดแล้ว:

```bash
curl http://localhost:2525/imposters
```

### 5. Start enrollment-service

เปิดอีก terminal แล้วรัน:

```bash
cd /Users/chaowarin/Downloads/enrollment-service/enrollment-service
npm run start
```

service จะฟังที่:

```text
http://localhost:3000
```

หมายเหตุ:
- runtime นี้ใช้ Mongo จริง
- มี seed data ตอน start โดย default
- certificate API จะชี้ไป `http://localhost:4545/certificates`

### 6. Check health before Bruno

```bash
curl http://localhost:3000/health
```

ถ้าพร้อมจะได้ประมาณนี้:

```json
{
  "status": "ok",
  "service": "enrollment-service",
  "mongo": "ok"
}
```

### 7. Open Bruno

Import folder นี้:

```text
/Users/chaowarin/Downloads/enrollment-service/enrollment-service/bruno
```

### 8. Run Bruno success flow

เข้าโฟลเดอร์:

```text
success/TC01_Create_Certificate_Success_course_PHY001
```

รันตามลำดับ:

1. `create-enrollment.bru`
2. `approve-enrollment.bru`
3. `generate-certificate.bru`

### 9. Switch to another certificate scenario

ลบ imposter เดิมก่อน:

```bash
curl -X DELETE http://localhost:2525/imposters/4545
```

แล้วค่อยโหลดตัวใหม่

ตัวอย่าง TC17 API error:

```bash
curl -X POST http://localhost:2525/imposters \
  -H "Content-Type: application/json" \
  -d @mountebank/imposters/certificate-service/alternative/tc17-certificate-api-error.json
```

ตัวอย่าง TC17 timeout:

```bash
curl -X POST http://localhost:2525/imposters \
  -H "Content-Type: application/json" \
  -d @mountebank/imposters/certificate-service/alternative/tc17-certificate-api-timeout.json
```

## Stop Everything

### Stop enrollment-service

ถ้ารันแบบ foreground:

```bash
Ctrl+C
```

### Stop Mountebank

ถ้ารันแบบ foreground:

```bash
Ctrl+C
```

### Stop Mongo container

```bash
docker stop enrollment-mongo
```

## Test Commands

รัน unit tests:

```bash
npm test
```

รัน component tests:

```bash
npm run test:component
```

รัน API tests ผ่าน Bruno CLI:

```bash
npm run test:bruno
```

หมายเหตุ:
- `npm run test:bruno` ตอนนี้ชี้ไป Dockerized runtime โดยตรง
- `npm run test:api:local` คือชื่อที่ชัดที่สุดสำหรับ local-process runtime แบบเดิม
- `npm run test:api` ยังเก็บไว้เป็น alias fallback ไปที่ `test:api:local`

รัน API tests ผ่าน Dockerized runtime:

```bash
npm run test:bruno
```

Dockerized runtime นี้ใช้ host ports ดังนี้:

- `3000` = `enrollment-service`
- `2525` = Mountebank admin API
- `4545` = Mountebank imposter port สำหรับ certificate API
- `27018` = MongoDB สำหรับ API test runtime

รันเฉพาะ success ผ่าน Dockerized runtime:

```bash
npm run test:bruno:success
```

รันเฉพาะ alternative ผ่าน Dockerized runtime:

```bash
npm run test:bruno:alternative
```

รันทุกอย่างรวมกัน:

```bash
npm run test:all
```

## Next Step

ถ้าจะทำ component test ต่อ ให้เริ่มจาก:

```text
component/README.md
```

## Notes

- ถ้าพอร์ต `3000` ถูกใช้อยู่ จะ start server ไม่ได้
- ถ้าพอร์ต `2525` ถูกใช้อยู่ จะ start Mountebank ไม่ได้
- Dockerized Bruno runtime จะใช้ `3000`, `2525`, `4545`, `27018` จาก host
- ถ้า `generate-certificate.bru` fail ให้เช็ก 3 จุดก่อน:
  - `curl http://localhost:3000/health`
  - `curl http://localhost:2525/imposters`
  - imposter ที่โหลดตรงกับ TC ที่กำลังทดสอบหรือไม่
