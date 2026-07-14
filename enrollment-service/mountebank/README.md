# Mountebank Setup

โฟลเดอร์นี้ใช้สำหรับ mock external certificate API เพื่อให้ `enrollment-service` ทดสอบ `generateCertificate()` ผ่าน HTTP/API flow ได้โดยไม่ต้องรัน `certificate-service` จริง

## Test Taxonomy Note

Mountebank ใน repo นี้มีหน้าที่สำหรับ:

- Bruno / API flow ของ `enrollment-service`
- local runtime ที่ต้องการจำลอง certificate API ผ่าน HTTP จริง
- cross-repo-compatible local setup ที่ยังไม่ใช้ provider จริง

Mountebank ใน repo นี้ไม่ได้เป็นส่วนหนึ่งของ `component test` อีกต่อไป

- `component test`
  - ใช้ fake `CertificateService`
  - ไม่วิ่งไปถึง external provider
- `Bruno API test`
  - ใช้ Mountebank เพื่อจำลอง certificate API
- `cross-repo integration`
  - ใช้ `enrollment-service` คุยกับ `certificate-service` จริง
  - ถ้าต้อง fake upstream provider ให้ทำในฝั่ง `certificate-service`

## Purpose

ใช้ Mountebank เพื่อจำลอง response ของ certificate API ในหลายสถานการณ์ เช่น:

- success
- invalid response
- API error
- timeout

แนวทางนี้เหมาะกับ:

- API test ผ่าน Bruno
- การฝึก external dependency simulation
- การทดสอบ certificate flow แบบควบคุมผลลัพธ์ได้ผ่าน local runtime
- การเตรียม local environment ที่ compatible กับ cross-repo integration

## Structure

```text
mountebank/
  README.md
  imposters/
    certificate-service/
      success/
        tc01-generate-certificate-success.json
        tc02-generate-certificate-success.json
        tc03-generate-certificate-success.json
      alternative/
        tc16-invalid-certificate-response.json
        tc17-certificate-api-error.json
        tc17-certificate-api-timeout.json
```

หมายเหตุ:
- TC13, TC14, TC15 ไม่จำเป็นต้องใช้ imposter เพราะ service ควร fail ก่อนเรียก external API

## Service Under Test

Bruno จะยิงเข้า `enrollment-service` ที่ endpoint:

- `POST /enrollments/:enrollmentId/certificate`

แต่ภายใน `enrollment-service` จะเรียก external certificate API ต่ออีกทอดหนึ่ง
ดังนั้นต้องตั้งค่าให้ `enrollment-service` ชี้ไปที่ Mountebank แทน certificate service จริงในชั้น Bruno/API runtime นี้

## Expected External Contract

`enrollment-service` คาดหวัง response จาก external certificate API ในรูปแบบนี้:

```json
{
  "certificate_id": "CERT001",
  "certificate_url": "https://certificate.example.com/CERT001.pdf",
  "status": "issued",
  "issued_at": "2026-05-15T10:00:00Z"
}
```

## Imposter Scenarios

### 1. Success

ใช้กับ:
- TC01
- TC02
- TC03

Behavior:
- ตอบ `200`
- body ถูกต้องครบทุก field

Expected result:
- `generateCertificate()` สำเร็จ
- enrollment ถูก update เป็น `CERTIFICATE_ISSUED`

### 2. Invalid Response

ใช้กับ:
- direct runtime / ad-hoc invalid-response checks เท่านั้น
- ไม่ได้ถูกใช้ใน Bruno default flow ปัจจุบัน

Behavior:
- ตอบ `200`
- body ผิด shape หรือข้อมูลไม่ครบ

ตัวอย่าง:

```json
{
  "status": "issued"
}
```

Expected result:
- service throw `InvalidCertificateResponseError`
- enrollment ถูก update เป็น `CERTIFICATE_FAILED`

### 3. API Error

ใช้กับ:
- TC17

Behavior:
- ตอบ `500` หรือ `502`

ตัวอย่าง:

```json
{
  "message": "API Server Down"
}
```

Expected result:
- service throw `CertificateApiError`
- enrollment ถูก update เป็น `CERTIFICATE_FAILED`

### 4. Timeout

ใช้กับ:
- TC17

Behavior:
- delay response จนเกิน client timeout

Expected result:
- service throw `CertificateApiTimeoutError`
- enrollment ถูก update เป็น `CERTIFICATE_FAILED`

## TC Mapping

| TC | Bruno Scenario | Mountebank Imposter | Expected Result |
| --- | --- | --- | --- |
| TC01 | Certificate success PHY001 | `success/tc01-generate-certificate-success.json` | `CERTIFICATE_ISSUED` |
| TC02 | Certificate success CHE001 | `success/tc02-generate-certificate-success.json` | `CERTIFICATE_ISSUED` |
| TC03 | Certificate success COM001 | `success/tc03-generate-certificate-success.json` | `CERTIFICATE_ISSUED` |
| TC13 | Progress 99 | not required | fail before external call |
| TC14 | Progress 0 | not required | fail before external call |
| TC15 | Enrollment not approved | not required | fail before external call |
| TC17 | Certificate API error | `alternative/tc17-certificate-api-error.json` | `CERTIFICATE_FAILED` |
| TC17 | Certificate API timeout | `alternative/tc17-certificate-api-timeout.json` | `CERTIFICATE_FAILED` |

หมายเหตุ:
- imposter `tc16-invalid-certificate-response.json` ยังเก็บไว้สำหรับจำลอง invalid upstream response แบบเฉพาะกิจ
- แต่ Bruno/API default flow ปัจจุบันไม่ได้ map `TC16` ไปที่ invalid response แล้ว

## Test Flow

ลำดับการใช้งานโดยทั่วไป:

1. start Mountebank
2. load imposter ที่ต้องการ
3. start `enrollment-service`
4. ตั้งค่า external certificate API URL ให้ชี้มาที่ Mountebank
5. รัน Bruno scenario
6. ตรวจ response และสถานะ enrollment

## Commands

ตัวอย่างคำสั่งด้านล่างใช้ `npx` เพื่อไม่ต้องติดตั้ง Mountebank แบบ global

### 1. Start Mountebank

```bash
npx mountebank --port 2525 --allowInjection
```

Mountebank admin API จะอยู่ที่:

```text
http://localhost:2525
```

### 2. Load an imposter

โหลด success imposter สำหรับ TC01:

```bash
curl -X POST http://localhost:2525/imposters \
  -H "Content-Type: application/json" \
  -d @mountebank/imposters/certificate-service/success/tc01-generate-certificate-success.json
```

โหลด invalid response imposter สำหรับ TC16:

```bash
curl -X POST http://localhost:2525/imposters \
  -H "Content-Type: application/json" \
  -d @mountebank/imposters/certificate-service/alternative/tc16-invalid-certificate-response.json
```

โหลด API error imposter สำหรับ TC17:

```bash
curl -X POST http://localhost:2525/imposters \
  -H "Content-Type: application/json" \
  -d @mountebank/imposters/certificate-service/alternative/tc17-certificate-api-error.json
```

โหลด timeout imposter สำหรับ TC17:

```bash
curl -X POST http://localhost:2525/imposters \
  -H "Content-Type: application/json" \
  -d @mountebank/imposters/certificate-service/alternative/tc17-certificate-api-timeout.json
```

### 3. List loaded imposters

```bash
curl http://localhost:2525/imposters
```

### 4. Delete one imposter

imposters ชุดนี้ฟังที่ port `4545`

```bash
curl -X DELETE http://localhost:2525/imposters/4545
```

### 5. Reset before switching scenario

ก่อนเปลี่ยนจาก TC หนึ่งไปอีก TC หนึ่ง แนะนำให้ลบ imposter เก่าก่อนแล้วค่อยโหลดตัวใหม่

```bash
curl -X DELETE http://localhost:2525/imposters/4545
```

## Enrollment Service Config

ฝั่ง `enrollment-service` ควรชี้ certificate client ไปที่ Mountebank ด้วย environment variables เหล่านี้:

```bash
CERTIFICATE_API_URL=http://localhost:4545/certificates
CERTIFICATE_API_TIMEOUT_MS=3000
```

ค่า default ใน source ถูกตั้งไว้แล้วเป็น:

```text
http://localhost:4545/certificates
```

ดังนั้นถ้าไม่ override ค่า environment และคุณใช้ imposter ที่ฟังบน port `4545` ก็จะตรงกันพอดี

## Step-by-step Example

ตัวอย่างลำดับสำหรับทดสอบ Bruno success TC01:

1. เปิด Mountebank

```bash
npx mountebank --port 2525 --allowInjection
```

2. โหลด imposter success ของ TC01

```bash
curl -X POST http://localhost:2525/imposters \
  -H "Content-Type: application/json" \
  -d @mountebank/imposters/certificate-service/success/tc01-generate-certificate-success.json
```

3. รัน `enrollment-service` โดยให้เห็น environment นี้

```bash
CERTIFICATE_API_URL=http://localhost:4545/certificates CERTIFICATE_API_TIMEOUT_MS=3000 <your-start-command>
```

4. เปิด Bruno แล้วรันลำดับนี้
- `create-enrollment.bru`
- `approve-enrollment.bru`
- `generate-certificate.bru`

5. ถ้าจะเปลี่ยนไปทดสอบ TC16 หรือ TC17
- ลบ imposter เดิม
- โหลด imposter ใหม่
- รัน Bruno case ที่เกี่ยวข้อง

## Wiring Note

ใน source ตอนนี้มี `HttpCertificateService` ที่อ่าน config จาก:

- `CERTIFICATE_API_URL`
- `CERTIFICATE_API_TIMEOUT_MS`

ดังนั้นจุดที่ต้องทำต่อใน application wiring คือ instantiate client นี้แล้ว inject เข้า `EnrollmentServiceImpl`

## Recommended Checks

ทุกครั้งที่ทดสอบ certificate flow ควรตรวจ:

- HTTP status code
- response body
- certificate fields
- enrollment state หลังเรียกใช้งาน
- กรณี fail ต้องตรวจว่า status ถูก update เป็น `CERTIFICATE_FAILED`

## Notes

- ใช้ imposter แยกตาม scenario เพื่อให้อ่านง่ายและ trace กับ TC ได้ชัด
- อย่าใช้ certificate service จริงในรอบ component/API tests ที่ต้องการควบคุมผลลัพธ์
- ถ้า test case ควร fail ก่อนเรียก external API ให้ยืนยันด้วยว่า mock external ไม่ถูกเรียก
