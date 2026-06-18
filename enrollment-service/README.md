# enrollment-service

Local runtime สำหรับฝึก `unit test + Bruno API test + component test + Mountebank` ของ `enrollment-service`

## What You Can Run

- MongoDB สำหรับ local runtime
- Mountebank สำหรับ mock certificate API
- Express app ของ `enrollment-service`
- Bruno collection สำหรับยิง API flow
- component test structure สำหรับ Mongo จริง + Mountebank

## Current Progress

- Unit tests: `38 passed`
- Component tests: `37 passed`
- API test assets (Bruno): ready and organized by `TC01-TC17`
- API CLI runner: ready (`npm run test:api`)
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
npm run test:api
npm run test:api:success
npm run test:api:alternative
npm run test:all
npm run start
npm run start:dev
npm run mongo:start
npm run mb:start
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
npm run test:api
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
- ถ้า `generate-certificate.bru` fail ให้เช็ก 3 จุดก่อน:
  - `curl http://localhost:3000/health`
  - `curl http://localhost:2525/imposters`
  - imposter ที่โหลดตรงกับ TC ที่กำลังทดสอบหรือไม่
