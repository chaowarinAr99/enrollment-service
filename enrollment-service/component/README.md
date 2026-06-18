# Component Test Roadmap

โฟลเดอร์นี้ใช้สำหรับ component tests ของ `enrollment-service`

เอกสาร design แบบ corrected พร้อม checklist อยู่ที่:

```text
component/COMPONENT_TEST_DESIGN.md
```

นิยามของ component test ในโปรเจกต์นี้:

- mock `CourseRepository`
- ใช้ MongoDB จริงเฉพาะ `EnrollmentRepository`
- ใช้ app/service จริง
- ใช้ Mountebank จำลอง external certificate API
- ตรวจทั้ง HTTP response และ state ใน database

## Target Structure

```text
component/
  README.md
  setup/
    app-factory.ts
    mongo-test-runtime.ts
    mountebank-client.ts
  success/
    enrollment-service/
      TC01_Create_Certificate_Success_course_PHY001/
        create-enrollment.component.spec.ts
        approve-enrollment.component.spec.ts
        get-enrollment-by-id.component.spec.ts
        generate-certificate-success.component.spec.ts
      TC02_Create_Certificate_Success_course_CHE001/
      TC03_Create_Certificate_Success_course_COM001/
  alternative/
    enrollment-service/
      TC04_Create_EmployeeId_Required/
      TC05_Create_CourseId_Required/
      TC06_Create_Course_Not_Found/
      TC07_Create_Course_Closed/
      TC08_Create_Course_Full/
      TC09_Create_Duplicate_PHY001/
        create-enrollment-duplicate.component.spec.ts
      TC10_Create_Duplicate_CHE001/
      TC11_Create_Internal_Server_Error/
      TC12_Approve_Invalid_Status/
        approve-enrollment-invalid-status.component.spec.ts
      TC13_Certificate_Progress_99/
        generate-certificate-progress-not-complete.component.spec.ts
      TC14_Certificate_Progress_0/
      TC15_Certificate_Not_Approved/
      TC16_Certificate_Course_Reject/
      TC17_Certificate_Api_Error/
        generate-certificate-api-error.component.spec.ts
        generate-certificate-timeout.component.spec.ts
```

## What Each File Is For

### `setup/app-factory.ts`
- สร้าง Express app สำหรับ test
- register routes
- inject mock `CourseRepository`, real `EnrollmentRepository`, และ certificate client
- ใช้แทนการรัน `npm run start` จากภายนอกใน test suite

### `setup/mongo-test-runtime.ts`
- connect Mongo test database
- reset database ก่อนแต่ละ suite หรือแต่ละ test
- close connection หลังจบ
- แยก DB name ของ component test ออกจาก local runtime ปกติ
- ดูแลเฉพาะ `enrollments` collection ตามขอบเขต component test ปัจจุบัน

### `setup/mountebank-client.ts`
- helper สำหรับ load / delete imposter จาก test code
- ใช้กับเคส success, invalid response, api error, timeout

### `success/enrollment-service/TCxx_*/`
- mirror โครงสร้างของ Bruno ในระดับ TC folder
- ตอนนี้ implementation จริงอยู่ใน `TC01`
- `TC02` และ `TC03` เป็น placeholder สำหรับ copy pattern ต่อ

### `alternative/enrollment-service/TCxx_*/`
- mirror โครงสร้างของ Bruno ในระดับ TC folder
- บาง TC มีไฟล์ test แล้ว
- บาง TC เป็น placeholder เพื่อให้เห็น roadmap ที่ยังค้างอยู่

## Recommended Build Order

1. `setup/mongo-test-runtime.ts`
2. `setup/app-factory.ts`
3. `success/enrollment-service/TC01_Create_Certificate_Success_course_PHY001/*`
4. copy pattern ไป `TC02`, `TC03`
5. ไล่ alternative ตาม `TC04-TC17`

## Current Progress

- Component tests implemented: `37`
- Current passing command:

```bash
npm run test:component
```

Implemented now:

- `TC01`
  - `create-enrollment.component.spec.ts`
  - `approve-enrollment.component.spec.ts`
  - `get-enrollment-after-create.component.spec.ts`
  - `get-enrollment-after-approve.component.spec.ts`
  - `get-enrollment-after-certificate.component.spec.ts`
  - `generate-certificate-success.component.spec.ts`
- `TC02`
  - `create-enrollment.component.spec.ts`
  - `approve-enrollment.component.spec.ts`
  - `get-enrollment-after-create.component.spec.ts`
  - `get-enrollment-after-approve.component.spec.ts`
  - `get-enrollment-after-certificate.component.spec.ts`
  - `generate-certificate-success.component.spec.ts`
- `TC03`
  - `create-enrollment.component.spec.ts`
  - `approve-enrollment.component.spec.ts`
  - `get-enrollment-after-create.component.spec.ts`
  - `get-enrollment-after-approve.component.spec.ts`
  - `get-enrollment-after-certificate.component.spec.ts`
  - `generate-certificate-success.component.spec.ts`
- `TC04`
  - `create-enrollment.component.spec.ts`
- `TC05`
  - `create-enrollment.component.spec.ts`
- `TC06`
  - `create-enrollment.component.spec.ts`
- `TC07`
  - `create-enrollment.component.spec.ts`
- `TC08`
  - `create-enrollment.component.spec.ts`
- `TC09`
  - `create-enrollment-duplicate.component.spec.ts`
- `TC10`
  - `create-enrollment-duplicate.component.spec.ts`
- `TC11`
  - `create-enrollment.component.spec.ts`
- `TC12`
  - `create-enrollment.component.spec.ts`
  - `approve-enrollment-invalid-status.component.spec.ts`
  - `reject-enrollment.component.spec.ts`
- `TC13`
  - `generate-certificate-progress-not-complete.component.spec.ts`
- `TC14`
  - `generate-certificate-progress-not-complete.component.spec.ts`
- `TC15`
  - `generate-certificate-not-approved.component.spec.ts`
- `TC16`
  - `generate-certificate-rejected.component.spec.ts`
- `TC17`
  - `create-enrollment.component.spec.ts`
  - `approve-enrollment.component.spec.ts`
  - `generate-certificate-api-error.component.spec.ts`
  - `generate-certificate-timeout.component.spec.ts`

## Definition of Done

- component tests ใช้ Mongo จริงสำหรับ `EnrollmentRepository`
- mock `CourseRepository` ได้ตาม definition ปัจจุบัน
- external certificate behavior ถูกควบคุมด้วย Mountebank
- ทุก test ตรวจ response และ DB state
- มี command CLI แยกเช่น `npm run test:component`
