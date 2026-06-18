# Component Test Design

เอกสารนี้เป็น version ที่แก้ไขแล้วของ design สำหรับ component test ของ `enrollment-service`

เป้าหมายของ component test ในโปรเจกต์นี้:

- ยิง API จริงเข้า app
- ใช้ MongoDB จริงเฉพาะ `EnrollmentRepository`
- mock `CourseRepository`
- mock external certificate API ด้วย Mountebank imposter
- ตรวจทั้ง HTTP response และ state ใน database

## Scope

flow ตัวอย่างนี้ครอบคลุม:

1. create enrollment
2. get enrollment by id
3. approve enrollment
4. get enrollment by id หลัง approve
5. generate certificate
6. get enrollment by id หลัง generate certificate

## Folder Strategy

component test ของ repo นี้ตั้งใจให้ mirror โครงของ Bruno แบบ `TC01-TC17` ในระดับโฟลเดอร์ เช่น:

```text
component/
  success/
    enrollment-service/
      TC01_Create_Certificate_Success_course_PHY001/
  alternative/
    enrollment-service/
      TC09_Create_Duplicate_PHY001/
      TC12_Approve_Invalid_Status/
      TC13_Certificate_Progress_99/
      TC17_Certificate_Api_Error/
```

ข้อดีของโครงนี้:

- trace กับ Bruno ได้ง่าย
- เห็น progress เป็นราย TC ชัด
- เปิดทางให้เติมเคสที่ยังไม่ implement เป็น placeholder folder ได้

## Pre-conditions

- Mongo test database ต้องถูก reset ก่อนเริ่ม test
- `enrollments` test data ที่จำเป็นต้องถูก insert จากใน test suite เอง
- `CourseRepository` ถูก mock ตาม scenario ที่ต้องการทดสอบ
- Mountebank ต้องโหลด imposter success สำหรับ certificate API
- app ต้องถูกสร้างจาก test app factory ไม่ใช้ process ที่รันแยกจากภายนอก

## External Certificate API Contract

component test ของ certificate flow ต้องใช้ imposter ที่ตรงกับ implementation ปัจจุบันของ service

### Expected request from enrollment-service

Method:

```text
POST
```

Path:

```text
/certificates
```

Body:

```json
{
  "refId": "ENR001",
  "learnerId": "EMP001",
  "courseRef": "PHY001"
}
```

### Expected success response from imposter

```json
{
  "certificate_id": "CERT001",
  "certificate_url": "https://certificate.example.com/CERT001.pdf",
  "status": "issued",
  "issued_at": "2026-05-15T10:00:00Z"
}
```

## Flow A: Create Enrollment Success

### Step A1

Endpoint:

```text
POST /enrollments
```

Header:

```text
Content-Type: application/json
```

Request Body:

```json
{
  "employeeId": "EMP001",
  "courseId": "PHY001"
}
```

Expected HTTP Response:

Status:

```text
201
```

Body:

```json
{
  "enrollmentId": "ENR001",
  "employeeId": "EMP001",
  "courseId": "PHY001",
  "status": "PENDING_APPROVAL"
}
```

HTTP Assertions:

- `res.status` = `201`
- `res.body.enrollmentId` is string
- `res.body.employeeId` = `EMP001`
- `res.body.courseId` = `PHY001`
- `res.body.status` = `PENDING_APPROVAL`

DB Assertions:

- document exists in `enrollments`
- `employeeId` = `EMP001`
- `courseId` = `PHY001`
- `status` = `PENDING_APPROVAL`
- `approvedBy` = `null`
- `approvedAt` = `null`
- `rejectedBy` = `null`
- `rejectedAt` = `null`
- `certificateStatus` = `null`
- `certificateUrl` = `null`

## Flow B: Get Enrollment By Id After Create

### Step B1

Endpoint:

```text
GET /enrollments/ENR001
```

Expected HTTP Response:

Status:

```text
200
```

Body:

```json
{
  "id": "ENR001",
  "employeeId": "EMP001",
  "courseId": "PHY001",
  "status": "PENDING_APPROVAL",
  "approvedBy": null,
  "approvedAt": null,
  "rejectedBy": null,
  "rejectedAt": null,
  "certificateStatus": null,
  "certificateUrl": null,
  "createdAt": "2026-05-15T10:00:00Z",
  "updatedAt": "2026-05-15T10:00:00Z"
}
```

HTTP Assertions:

- `res.status` = `200`
- `res.body.id` = `ENR001`
- `res.body.employeeId` = `EMP001`
- `res.body.courseId` = `PHY001`
- `res.body.status` = `PENDING_APPROVAL`
- `res.body.approvedBy` = `null`
- `res.body.approvedAt` = `null`
- `res.body.rejectedBy` = `null`
- `res.body.rejectedAt` = `null`
- `res.body.certificateStatus` = `null`
- `res.body.certificateUrl` = `null`
- `res.body.createdAt` matches ISO date
- `res.body.updatedAt` matches ISO date

## Flow C: Approve Enrollment Success

### Step C1

Endpoint:

```text
PATCH /enrollments/ENR001/approve
```

Request Body:

```json
{
  "approvedBy": "HR001"
}
```

Expected HTTP Response:

Status:

```text
200
```

Body:

```json
{
  "enrollmentId": "ENR001",
  "status": "APPROVED",
  "approvedBy": "HR001",
  "approvedAt": "2026-05-15T10:00:00Z"
}
```

HTTP Assertions:

- `res.status` = `200`
- `res.body.enrollmentId` = `ENR001`
- `res.body.status` = `APPROVED`
- `res.body.approvedBy` = `HR001`
- `res.body.approvedAt` matches ISO date

DB Assertions:

- document exists in `enrollments`
- `status` = `APPROVED`
- `approvedBy` = `HR001`
- `approvedAt` matches ISO date

## Flow D: Get Enrollment By Id After Approve

### Step D1

Endpoint:

```text
GET /enrollments/ENR001
```

Expected HTTP Response:

```json
{
  "id": "ENR001",
  "employeeId": "EMP001",
  "courseId": "PHY001",
  "status": "APPROVED",
  "approvedBy": "HR001",
  "approvedAt": "2026-05-15T10:00:00Z",
  "rejectedBy": null,
  "rejectedAt": null,
  "certificateStatus": null,
  "certificateUrl": null,
  "createdAt": "2026-05-15T10:00:00Z",
  "updatedAt": "2026-05-15T10:00:00Z"
}
```

Important correction:

- หลัง approve แล้ว `status` ต้องเป็น `APPROVED`
- ไม่ใช่ `PENDING_APPROVAL`

HTTP Assertions:

- `res.body.id` = `ENR001`
- `res.body.status` = `APPROVED`
- `res.body.approvedBy` = `HR001`
- `res.body.approvedAt` matches ISO date
- `res.body.certificateStatus` = `null`
- `res.body.certificateUrl` = `null`

## Flow E: Generate Certificate Success

### Step E1

Endpoint:

```text
POST /enrollments/ENR001/certificate
```

Request Body:

```json
{
  "progress": 100
}
```

Expected HTTP Response:

Status:

```text
200
```

Body:

```json
{
  "enrollmentId": "ENR001",
  "certificateStatus": "CERTIFICATE_ISSUED",
  "certificate": {
    "certificateId": "CERT001",
    "certificateUrl": "https://certificate.example.com/CERT001.pdf",
    "issuedAt": "2026-05-15T10:00:00Z"
  }
}
```

HTTP Assertions:

- `res.status` = `200`
- `res.body.enrollmentId` = `ENR001`
- `res.body.certificateStatus` = `CERTIFICATE_ISSUED`
- `res.body.certificate.certificateId` = `CERT001`
- `res.body.certificate.certificateUrl` matches `^https://certificate.example.com/.*\.pdf$`
- `res.body.certificate.issuedAt` matches ISO date

DB Assertions:

- document exists in `enrollments`
- `certificateStatus` = `CERTIFICATE_ISSUED`
- `certificateUrl` = `https://certificate.example.com/CERT001.pdf`

## Flow F: Get Enrollment By Id After Generate Certificate

### Step F1

Endpoint:

```text
GET /enrollments/ENR001
```

Expected HTTP Response:

```json
{
  "id": "ENR001",
  "employeeId": "EMP001",
  "courseId": "PHY001",
  "status": "APPROVED",
  "approvedBy": "HR001",
  "approvedAt": "2026-05-15T10:00:00Z",
  "rejectedBy": null,
  "rejectedAt": null,
  "certificateStatus": "CERTIFICATE_ISSUED",
  "certificateUrl": "https://certificate.example.com/CERT001.pdf",
  "createdAt": "2026-05-15T10:00:00Z",
  "updatedAt": "2026-05-15T10:00:00Z"
}
```

Important correction:

- หลัง generate certificate แล้ว
  - `certificateStatus` ต้องเป็น `CERTIFICATE_ISSUED`
  - `certificateUrl` ต้องไม่ใช่ `null`
- `status` ของ enrollment ยังคงเป็น `APPROVED`

HTTP Assertions:

- `res.body.id` = `ENR001`
- `res.body.employeeId` = `EMP001`
- `res.body.courseId` = `PHY001`
- `res.body.status` = `APPROVED`
- `res.body.approvedBy` = `HR001`
- `res.body.approvedAt` matches ISO date
- `res.body.certificateStatus` = `CERTIFICATE_ISSUED`
- `res.body.certificateUrl` = `https://certificate.example.com/CERT001.pdf`

DB Assertions:

- persisted document has `status = APPROVED`
- persisted document has `certificateStatus = CERTIFICATE_ISSUED`
- persisted document has `certificateUrl = https://certificate.example.com/CERT001.pdf`

## Corrected Mountebank Imposter Example

```json
{
  "predicates": [
    {
      "equals": {
        "method": "POST",
        "path": "/certificates",
        "body": {
          "refId": "ENR001",
          "learnerId": "EMP001",
          "courseRef": "PHY001"
        }
      }
    }
  ],
  "responses": [
    {
      "is": {
        "statusCode": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "certificate_id": "CERT001",
          "certificate_url": "https://certificate.example.com/CERT001.pdf",
          "status": "issued",
          "issued_at": "2026-05-15T10:00:00Z"
        }
      }
    }
  ]
}
```

## What Should Be Checked In Component Tests

component test ทุกเคสควรมี 2 ชั้น:

1. HTTP Assertions
- status code
- response body

2. DB Assertions
- document ถูกสร้าง/อัปเดตจริงใน Mongo
- state transition ถูกต้อง
- field สำคัญ persist ถูกต้อง

## Current Definition In This Repo

component test ของ repo นี้ตอนนี้ใช้ขอบเขตแบบ hybrid:

- `CourseRepository` = mock
- `EnrollmentRepository` = real Mongo
- `Certificate API` = real Mountebank imposter หรือ real HTTP client ที่ชี้ไป imposter

เหตุผล:

- `CourseRepository` ทำหน้าที่ read-only ใน flow ปัจจุบัน
- สิ่งที่ต้องพิสูจน์ persistence จริงคือ `EnrollmentRepository`
- certificate flow ต้องพิสูจน์การคุยกับ external dependency ผ่าน contract จริง

## Current Implemented TCs

- `TC01_Create_Certificate_Success_course_PHY001`
  - create enrollment
  - approve enrollment
  - get enrollment after create
  - get enrollment after approve
  - get enrollment after certificate
  - generate certificate success via Mountebank
- `TC02_Create_Certificate_Success_course_CHE001`
  - create enrollment
  - approve enrollment
  - get enrollment after create
  - get enrollment after approve
  - get enrollment after certificate
  - generate certificate success via Mountebank
- `TC03_Create_Certificate_Success_course_COM001`
  - create enrollment
  - approve enrollment
  - get enrollment after create
  - get enrollment after approve
  - get enrollment after certificate
  - generate certificate success via Mountebank
- `TC04_Create_EmployeeId_Required`
  - create enrollment validation
- `TC05_Create_CourseId_Required`
  - create enrollment validation
- `TC06_Create_Course_Not_Found`
  - create enrollment course not found
- `TC07_Create_Course_Closed`
  - create enrollment course closed
- `TC08_Create_Course_Full`
  - create enrollment course full
- `TC09_Create_Duplicate_PHY001`
  - create enrollment duplicate
- `TC10_Create_Duplicate_CHE001`
  - create enrollment duplicate
- `TC11_Create_Internal_Server_Error`
  - create enrollment internal error simulation
- `TC12_Approve_Invalid_Status`
  - create enrollment setup flow
  - approve invalid status
  - reject enrollment setup flow
- `TC13_Certificate_Progress_99`
  - generate certificate progress not complete
- `TC14_Certificate_Progress_0`
  - generate certificate progress not complete
- `TC15_Certificate_Not_Approved`
  - generate certificate not approved
- `TC16_Certificate_Course_Reject`
  - generate certificate rejected enrollment
- `TC17_Certificate_Api_Error`
  - create enrollment setup flow
  - approve enrollment setup flow
  - certificate API error
  - certificate API timeout

รวม test files ที่รันผ่านตอนนี้: `37`

## Checklist For First Component Test

เป้าหมาย: `create-enrollment.component.spec.ts`

### Setup

- [ ] มี Mongo test runtime แยก database สำหรับ component tests
- [ ] reset database ก่อน test
- [ ] ใช้ mock `CourseRepository` สำหรับ course data
- [ ] build app จาก `app-factory.ts`
- [ ] ยังไม่ต้องใช้ Mountebank สำหรับ create success case

### Test Steps

- [ ] ยิง `POST /enrollments`
- [ ] assert `201`
- [ ] assert `employeeId`, `courseId`, `status`
- [ ] assert `enrollmentId` เป็น string
- [ ] query Mongo collection `enrollments`
- [ ] assert document ถูกสร้างจริง
- [ ] assert persisted `status = PENDING_APPROVAL`
- [ ] assert certificate fields ยังเป็น `null`

### Definition of Done

- [ ] component test file รันผ่านด้วย `npm run test:component`
- [ ] mock `CourseRepository`
- [ ] ใช้ Mongo จริงสำหรับ `EnrollmentRepository`
- [ ] assert ทั้ง HTTP และ DB state
