# 🎯 Test Strategy & Execution Framework

เอกสารฉบับนี้กำหนดกลยุทธ์การทดสอบ (Test Strategy) โดยยึดหลักการผลักดันการทำ Automation ลงไปยังระดับที่ต่ำที่สุด (Lowest Level Possible) เพื่อความรวดเร็ว แม่นยำ และประหยัดค่าใช้จ่าย

---

## 🏗️ 1. Core Strategy: The Efficiency Hierarchy

เราจะแบ่งระดับการทดสอบตามความเหมาะสมของ Layer โดยมีลำดับความสำคัญดังนี้:

| Level | Focus Area | Tools/Method |
| :--- | :--- | :--- |
| **1. Unit Test** | Logic, Calculation, Validation, Condition, Mapping | Developer/SDET เขียนในระดับ Code |
| **2. API Test** | Contract, Req/Res, Permission, Integration | Automated API Testing (Postman, Playwright, Newman) |
| **3. Manual Test** | Human Judgment, UX/UI Feeling, High Complexity | Human Tester (Exploratory) |

---

## 🔍 2. Classification Criteria (เกณฑ์การแยก Level)

### ✅ Unit Test (The Logic Layer)
*เน้นทดสอบ Logic ภายในที่ไม่ต้องพึ่งพา UI, Database หรือ External Service*
* **สูตรคำนวณ:** (เช่น ส่วนลด, ภาษี, ราคาสุทธิ)
* **Validation:** การตรวจสอบความถูกต้องของข้อมูล (Input Validation)
* **Business Rule:** กฎทางธุรกิจต่างๆ
* **Data Transformation:** การแปลงรูปแบบข้อมูล (Mapping)
* **ตัวอย่าง:**
    * Coupon 10% จากยอด 600 บาท ต้องลด 60 บาท
    * ค่า Qty = 0 ต้อง Invalid
    * COD Amount ต้องเท่ากับ Final Amount

### ✅ API Test (The Integration Layer)
*เน้นทดสอบพฤติกรรมของ Endpoint และการทำงานร่วมกันระหว่าง Service*
* **Endpoint Behavior:** ตรวจสอบ Request/Response
* **Security & Permission:** ตรวจสอบสิทธิ์การเข้าถึง (Auth/Role)
* **State Verification:** ตรวจสอบฐานข้อมูลหลังการเรียก API
* **ตัวอย่าง:**
    * `POST /orders` สำเร็จต้องได้รับ `finalAmount = 540`
    * ส่ง `codAmount` ไม่ตรงกับ `finalAmount` ต้องได้รับ Error `400`
    * User ไม่มีสิทธิ์เข้าถึงต้องได้รับ `403 Forbidden`

### ✅ Manual Test (The Human Layer)
*เน้นสิ่งที่ระบบอัตโนมัติเลียนแบบความรู้สึกมนุษย์ไม่ได้ หรือลงทุนทำ Auto ไม่คุ้มค่า*
* **UX/UI Feeling:** ความลื่นไหล การจัดวาง (Layout)
* **Visual Correctness:** สีสัน Wording ความถูกต้องทางสายตา
* **Third-party Behavior:** ระบบภายนอกที่ควบคุมไม่ได้
* **ตัวอย่าง:**
    * ปุ่มดูเด่นและเข้าใจง่ายหรือไม่?
    * ข้อความ Error Message สื่อสารชัดเจนไหม?
    * Layout บน Mobile แตกหรือไม่?

---

## 📝 3. Test Strategy Mapping Template

*ใช้ Section นี้เป็นส่วนหนึ่งของ Blueprint ในการวางแผนแต่ละ Scenario*

> **Scenario ID:** [รหัสอ้างอิง]
>
> **Automated Test Scope:**
> - **Unit:** [ระบุ Function/Logic ที่จะทำ Unit Test]
> - **API:** [ระบุ Endpoint และ Case ที่จะทำ API Test]
>
> **Manual Test Scope:**
> - [ระบุสิ่งที่ต้องใช้คนตรวจ]
>
> **Not Covered / Low Priority:**
> - [ระบุ Edge Case ที่จะไม่ทดสอบในรอบนี้]
>
> **Reason:**
> - [เหตุผลที่เลือก Scope ดังกล่าว]

---

## 💡 4. Team's Core Philosophy (ประโยคกลางสำหรับทีม)

> "ทีมเราจะเน้นการทำ **Automated Test ในระดับ Unit และ API ให้มากที่สุด** โดยเลือก Automate เฉพาะส่วนที่เป็น Logic, Validation, Business Rule, Contract และ Service Behavior ส่วนที่ต้องอาศัยการตัดสินใจจากผู้ใช้ ความถูกต้องด้าน UI/UX หรือไม่คุ้มค่าต่อการลงทุนทำ Automation จะถูกจัดไว้ใน **Manual Test** เพื่อให้ได้ผลลัพธ์ที่รวดเร็วและแม่นยำที่สุด"