# Bruno Collection

ชุดนี้ไว้รันทดสอบ API ของ `enrollment-service` หลังจาก local runtime พร้อมแล้ว

runtime ที่ collection นี้คาดหวัง:

- `enrollment-service` รันที่ `http://localhost:3000`
- MongoDB พร้อมใช้งาน
- ถ้าทดสอบ certificate flow ให้มี Mountebank imposter ที่ `http://localhost:4545/certificates`

## วิธีใช้
1. เปิด Bruno
2. Import โฟลเดอร์ `/Users/chaowarin/Downloads/enrollment-service/enrollment-service/bruno`
3. เช็กก่อนว่า `GET http://localhost:3000/health` ตอบ `200`
4. รันเคสใน `success/` ก่อน เช่น `success/TC01_Create_Certificate_Success_course_PHY001`
5. ระบบจะเซ็ต `enrollmentId` ให้อัตโนมัติจาก response
6. จากนั้นค่อยรันเคสใน `alternative/` เช่น `alternative/TC04_Create_EmployeeId_Required`

## Recommended Path

เส้นทางแนะนำหลักสำหรับ Bruno/API layer คือ Dockerized runtime:

```bash
npm run test:bruno
```

หรือแยกเฉพาะ:

```bash
npm run test:bruno:success
npm run test:bruno:alternative
```

เหตุผล:

- reproducible กว่า local process orchestration
- ลดปัญหา process ค้างและ environment ไม่ตรงกัน
- align กับ API/integration style ที่ใกล้ production มากขึ้น

## Local Runtime ทางเลือก

ถ้าต้อง debug แบบ local-process orchestration เดิม ยังใช้ได้ผ่าน:

```bash
npm run test:api:local
```

รันจาก root ของโปรเจกต์นี้:

```bash
npm run mongo:start
npm run mb:start
npm run start
```

runtime แบบ Docker จะยก:

- `enrollment-service`
- MongoDB
- Mountebank

ผ่าน `docker-compose.api-test.yml` แล้วค่อยรัน Bruno จาก host machine

host ports ที่ runtime นี้ใช้:

- `3000` = `enrollment-service`
- `2525` = Mountebank admin API
- `4545` = certificate API imposter
- `27018` = MongoDB

ถ้าจะทดสอบ certificate success flow ให้โหลด imposter ก่อน:

```bash
curl -X POST http://localhost:2525/imposters \
  -H "Content-Type: application/json" \
  -d @mountebank/imposters/certificate-service/success/tc01-generate-certificate-success.json
```

อ่านขั้นตอนเต็มได้ที่:

```text
/Users/chaowarin/Downloads/enrollment-service/enrollment-service/README.md
```

และคู่มือ Mountebank อยู่ที่:

```text
/Users/chaowarin/Downloads/enrollment-service/enrollment-service/mountebank/README.md
```

## ลำดับการรันที่แนะนำ

### Success flow

1. `create-enrollment.bru`
2. `approve-enrollment.bru`
3. `generate-certificate.bru`

### Alternative flow

เริ่มจากเคส create/approve/reject ที่ไม่พึ่ง external API ก่อน แล้วค่อยรันเคส certificate เช่น:

- `TC13_Certificate_Progress_99`
- `TC14_Certificate_Progress_0`
- `TC15_Certificate_Not_Approved`
- `TC16_Certificate_Course_Reject`
- `TC17_Certificate_Api_Error`

## หมายเหตุ
- ถ้ายังไม่มี `enrollmentId` ให้รัน `success/TC01_Create_Certificate_Success_course_PHY001/create-enrollment.bru` ก่อน
- ถ้าจะทดสอบเคสอื่น ให้เปลี่ยนค่าของ `employeeId` หรือ `courseId`
- ถ้าจะสลับ imposter ของ Mountebank ให้ลบตัวเก่าก่อน:

```bash
curl -X DELETE http://localhost:2525/imposters/4545
```

- ถ้า `generate-certificate.bru` fail ให้เช็ก 3 จุดก่อน:
  - `curl http://localhost:3000/health`
  - `curl http://localhost:2525/imposters`
  - imposter ที่โหลดตรงกับ TC ที่กำลังทดสอบหรือไม่

## โครงสร้าง
- `success/` = เคสปกติ
- `alternative/` = เคส error / validation / business rule
