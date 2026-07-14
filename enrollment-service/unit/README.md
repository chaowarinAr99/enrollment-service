# Unit Test Layout

โครงนี้กลับไปใช้รูปแบบเดิมแบบเป๊ะที่สุด: `1 TC = 1 folder` ใต้ `success/` และ `alternative/`

## Test Taxonomy Note

- `unit test`
  - ทดสอบเฉพาะ `EnrollmentServiceImpl`
  - mock ทุก dependency ของ service
- `component test`
  - ทดสอบ `enrollment-service` ตัวเดียวผ่าน app จริง
  - ใช้ Mongo จริงสำหรับ `EnrollmentRepository`
  - fake `CourseRepository` และ `CertificateService`
- `Bruno API test`
  - ยิง HTTP flow ของ `enrollment-service`
  - ใช้ Mountebank จำลอง certificate API ใน local runtime
- `cross-repo integration`
  - ทดสอบ `enrollment-service` คุยกับ `certificate-service` จริง

## Structure
```text
unit/
  success/
    enrollment-service/
      TC01/
        create-enrollment.spec.ts
        approve-enrollment.spec.ts
        reject-enrollment.spec.ts
        generate-certificate.spec.ts
      TC02/
        create-enrollment.spec.ts
        approve-enrollment.spec.ts
        generate-certificate.spec.ts
      TC03/
        create-enrollment.spec.ts
        approve-enrollment.spec.ts
        generate-certificate.spec.ts
      TC18/
        get-enrollment-by-id.spec.ts
  alternative/
    enrollment-service/
      TC04/
        create-enrollment-failed-employeeId-missing.spec.ts
      TC05/
        create-enrollment-failed-courseId-missing.spec.ts
      TC06/
        create-enrollment-failed-course-not-found.spec.ts
      TC07/
        create-enrollment-failed-course-not-open-for-enrollment.spec.ts
      TC08/
        create-enrollment-failed-course-is-full.spec.ts
      TC09/
        create-enrollment-failed-already-enrolled-status-is-PENDING_APPROVAL.spec.ts
      TC10/
        create-enrollment-failed-already-enrolled-status-is-APPROVED.spec.ts
      TC11/
        create-enrollment-failed-database-connection-failed.spec.ts
      TC12/
        approve-enrollment-failed-enrollmentId-missing.spec.ts
        reject-enrollment.spec.ts
      TC13/
        approve-enrollment-failed-approvedBy-missing.spec.ts
        reject-enrollment-failed-enrollmentId-missing.spec.ts
        generate-certificate.spec.ts
      TC14/
        approve-enrollment-failed-enrollment-not-found.spec.ts
        reject-enrollment-failed-rejectedBy-missing.spec.ts
        generate-certificate.spec.ts
      TC15/
        approve-enrollment-failed-invalid-status-approved.spec.ts
        reject-enrollment-failed-enrollment-not-found.spec.ts
        generate-certificate.spec.ts
      TC16/
        approve-enrollment-failed-invalid-status-rejected.spec.ts
        reject-enrollment-failed-invalid-status-approved.spec.ts
        generate-certificate.spec.ts
      TC17/
        approve-enrollment-failed-database-connection-failed.spec.ts
        reject-enrollment-failed-invalid-status-rejected.spec.ts
        generate-certificate.spec.ts
      TC19/
        get-enrollment-by-id-failed-enrollmentId-missing.spec.ts
      TC20/
        get-enrollment-by-id-failed-enrollment-not-found.spec.ts
```

## Scope
- ทดสอบเฉพาะ `EnrollmentServiceImpl`
- mock `courseRepository` และ `enrollmentRepository` ทุกเคส
- mock `certificateService` สำหรับ `generateCertificate`
- ไม่แตะ controller, HTTP, MongoDB, Docker, Mountebank

## Guidelines
- `beforeEach` + `jest.clearAllMocks()`
- 1 scenario ต่อ 1 `it`
- อิงข้อมูลจาก TC เดิมใน `success` และ `alternative` แล้วต่อเลขสำหรับ `getEnrollmentById`
