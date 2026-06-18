# Internal Server Error Placeholder

เคสนี้ในระบบปัจจุบันยังไม่มี input ที่บังคับให้ `POST /enrollments` ตอบ `500` ได้โดยตรง

หากต้องการทดสอบจริง ให้ใช้วิธีทำให้ service/repository error ระหว่างรัน เช่น:
- ปิด MongoDB ชั่วคราว
- ทำให้ repository throw error
