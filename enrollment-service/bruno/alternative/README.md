# Alternative Scenarios

โฟลเดอร์นี้แยกเป็น `1 folder = 1 case` เพื่อให้อ่านง่ายและรันทีละเคสได้ชัดเจน

## หมายเหตุสำคัญ
- เคส duplicate ต้องใช้ `employeeId + courseId` เดิมที่มี active enrollment อยู่แล้ว
- `TC12` ใน Bruno ปัจจุบันเป็น flow `create + reject` ของ HR ไม่ใช่ approve invalid status
- ถ้าจะทดสอบ approve invalid status จริง ต้องใช้ enrollment ที่เป็น `REJECTED` แล้วค่อยเรียก `PATCH /approve`
- เคส internal server error เป็น placeholder หากต้องการบังคับให้ backend fail เพิ่มเติม
