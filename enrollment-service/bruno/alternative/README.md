# Alternative Scenarios

โฟลเดอร์นี้แยกเป็น `1 folder = 1 case` เพื่อให้อ่านง่ายและรันทีละเคสได้ชัดเจน

## หมายเหตุสำคัญ
- เคส duplicate ต้องใช้ `employeeId + courseId` เดิมที่มี active enrollment อยู่แล้ว
- เคส approve invalid status ใช้ enrollment ที่เป็น `REJECTED` ใน seed เดิม
- เคส internal server error เป็น placeholder หากต้องการบังคับให้ backend fail เพิ่มเติม
