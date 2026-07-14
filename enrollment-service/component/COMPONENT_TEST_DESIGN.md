## Component Test Design

เอกสารนี้อธิบายขอบเขตของ `component test` สำหรับ `enrollment-service` หลังจากแยก responsibility ออกจาก `cross-repo integration` ชัดเจนแล้ว

## Goal

component test ของโปรเจกต์นี้มีเป้าหมายเพื่อพิสูจน์ว่า `enrollment-service` ทำงานถูกต้องภายใน service ของตัวเอง โดยครอบคลุม:

- HTTP route และ controller wiring
- business logic ใน `EnrollmentServiceImpl`
- error mapping
- persistence ผ่าน `EnrollmentRepository` + MongoDB จริง
- การเรียก certificate boundary ด้วย request mapping ที่ถูกต้อง

สิ่งที่ component test ไม่ได้พยายามพิสูจน์:

- การทำงานจริงของ `certificate-service`
- การทำงานของ external certificate provider
- การสื่อสารข้าม repo แบบ end-to-end

## Taxonomy

### Unit Test

- SUT: `EnrollmentServiceImpl`
- mock ทั้ง `CourseRepository`, `EnrollmentRepository`, `CertificateService`
- ไม่แตะ HTTP, MongoDB, network

### Component Test

- SUT: `enrollment-service` หนึ่ง service
- real: app, routes, controller, service, `EnrollmentRepository`, MongoDB
- fake/mock: `CourseRepository`, `CertificateService`
- ไม่เรียก `certificate-service` จริง และไม่เรียก external provider

### Cross-repo Integration

- real: `enrollment-service` + `certificate-service`
- real: MongoDB, HTTP ระหว่าง services
- fake: upstream external provider ผ่าน Mountebank

สรุปสั้น:

- component test = ทดสอบ `enrollment-service` อย่างเดียว
- cross-repo integration = ทดสอบ `enrollment-service` คุยกับ `certificate-service` จริง

## SUT Boundary

```text
Component Test: enrollment-service

          fake/mock                    fake/mock
       CourseRepository             CertificateService
               \                          /
                \                        /
                 v                      v

  +--------------------------------------------------+
  |                 SUT: enrollment-service          |
  |                                                  |
  |  HTTP route -> controller -> service -> repo     |
  |                                      |           |
  |                                      v           |
  |                                   MongoDB        |
  +--------------------------------------------------+
```

## Folder Strategy

component test ของ repo นี้ยัง mirror โครงของ Bruno แบบ `TC01-TC17` ในระดับโฟลเดอร์ เพื่อให้ง่ายต่อการ trace business scenario:

```text
component/
  success/
    enrollment-service/
      TC01_Create_Certificate_Success_course_PHY001/
      TC02_Create_Certificate_Success_course_CHE001/
      TC03_Create_Certificate_Success_course_COM001/
  alternative/
    enrollment-service/
      TC04_Create_EmployeeId_Required/
      ...
      TC17_Certificate_Api_Error/
```

ข้อดีของโครงนี้:

- trace กับ Bruno scenarios ได้ง่าย
- เห็น progress เป็นราย TC ชัดเจน
- แยก success / alternative ได้ตรงกับ business intent

## Setup Strategy

### Real Dependencies

- `Express` app จริงจาก `createComponentApp()`
- routes / controller / service จริง
- `MongoEnrollmentRepository`
- MongoDB test database จริง

### Fake / Mock Dependencies

- `CourseRepository`
  - mock ตาม scenario เช่น course เปิด/ปิด/เต็ม/หาไม่เจอ
- `CertificateService`
  - fake boundary object ที่ inject เข้า app factory
  - ใช้ `jest.fn()` เพื่อทั้ง stub response และ assert interaction

### Test Helpers

- `component/setup/app-factory.ts`
  - ประกอบ app พร้อม inject dependencies
- `component/setup/mongo-test-runtime.ts`
  - connect / reset / close Mongo test DB
- `component/setup/fake-certificate-service.ts`
  - helper สำหรับ success / api error / timeout และ request assertion

## Certificate Boundary Policy

ใน component test ของ `enrollment-service`:

- ไม่ใช้ `HttpCertificateService`
- ไม่ใช้ Mountebank
- ไม่จำลอง external provider raw contract โดยตรง

เหตุผล:

- `enrollment-service` ควรรู้แค่ certificate boundary ของตัวเอง
- responsibility เรื่อง HTTP client และ upstream response validation ควรอยู่ใน `certificate-service`
- component test ต้อง isolate ให้อยู่ใน service เดียว

### Success Behavior

`CertificateService.createCertificate(...)` ควรคืนค่า success payload เช่น:

```json
{
  "certificate_id": "CERT001",
  "certificate_url": "https://certificate.example.com/CERT001.pdf",
  "status": "issued",
  "issued_at": "2026-05-15T10:00:00Z"
}
```

### Failure Behavior

fake certificate boundary ควรใช้ domain-level errors เช่น:

- `CertificateApiError`
- `CertificateApiTimeoutError`
- `InvalidCertificateResponseError`

### Pre-boundary Failure

ถ้า business rule fail ก่อน เช่น:

- progress ไม่เท่ากับ `100`
- enrollment ยังไม่ `APPROVED`
- enrollment เป็น `REJECTED`

component test ควร assert ว่า `CertificateService.createCertificate()` ไม่ถูกเรียก

## Scenario Matrix

### Success Cases

- `TC01` `PHY001`
  - fake certificate boundary คืน success payload `CERT001`
- `TC02` `CHE001`
  - fake certificate boundary คืน success payload `CERT002`
- `TC03` `COM001`
  - fake certificate boundary คืน success payload `CERT003`

### Fail Before Certificate Boundary

- `TC13` progress `99`
- `TC14` progress `0`
- `TC15` enrollment not approved
- `TC16` enrollment rejected

ทุกเคสนี้ต้อง assert ว่า certificate boundary ไม่ถูกเรียก

### Downstream Failure Cases

- `TC17` API error
  - fake certificate boundary throw `CertificateApiError`
- `TC17` timeout
  - fake certificate boundary throw `CertificateApiTimeoutError`

## Assertions

component test ทุกเคสควรมีอย่างน้อย 2 ชั้น:

1. HTTP assertions
- status code
- response body

2. DB assertions
- enrollment document state หลัง action

สำหรับ certificate-related scenarios ให้เพิ่ม 1 ชั้น:

3. Boundary assertions
- request mapping ไป `CertificateService.createCertificate()` ถูกต้อง
- หรือ assert ว่าไม่ถูกเรียกใน pre-boundary failures

## Definition of Done

- ใช้ MongoDB จริงสำหรับ `EnrollmentRepository`
- mock `CourseRepository` ตาม scenario
- fake `CertificateService` ตาม scenario
- ไม่ใช้ Mountebank ใน component layer
- ทุก test ตรวจทั้ง response และ DB state
- เคส certificate ต้องตรวจ boundary interaction ตามที่เหมาะสม
- รันผ่านด้วย `npm run test:component`
