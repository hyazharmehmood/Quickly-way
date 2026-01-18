# 📦 Order System - Complete Flow Documentation (Urdu/Hindi)

## 🎯 Order Creation Flow (User Journey)

### **Step 1: Service Page se Order Create karna**

1. **User Service Detail Page pe jata hai**
   - Service ka title, description, price dekhta hai
   - Freelancer ki profile dekhta hai
   - Reviews aur ratings check karta hai

2. **"Order Service" Button Click karta hai**
   - Right sidebar mein green button hai
   - Ya phir "Contact me" ke neeche bhi option hai

3. **Order Modal Open hota hai**
   - Service price dikhai deta hai
   - Delivery time select karna hota hai (default: 7 days)
   - Revisions count set karna hota hai (default: 2)
   - Cancellation policy review karna hota hai

4. **Order Submit karta hai**
   - API call: `POST /api/orders`
   - Order create hota hai with status: `PENDING_ACCEPTANCE`
   - Contract automatically generate hota hai
   - Order number generate hota hai (e.g., ORD-2024-0012)

---

## 🔄 Complete Order Lifecycle

### **Phase 1: Order Creation (Client Side)**

```
Client clicks "Order Service"
    ↓
OrderModal opens
    ↓
Client fills form:
  - Delivery time: 7 days
  - Revisions: 2
  - Cancellation policy
    ↓
POST /api/orders
    ↓
Order created:
  - Status: PENDING_ACCEPTANCE
  - Contract: PENDING_ACCEPTANCE
  - Order Number: ORD-2024-XXXX
    ↓
Socket.IO event: order_created
    ↓
Client redirected to Messages page
    ↓
OrderCard appears in chat
```

### **Phase 2: Freelancer Acceptance**

```
Freelancer receives notification
    ↓
Opens chat / Messages page
    ↓
Sees OrderCard with:
  - Order Number
  - Price
  - Delivery Date
  - Status: PENDING_ACCEPTANCE
    ↓
Two options:
  1. Accept Order
  2. Reject Order
```

#### **Option A: Accept Order**

```
Freelancer clicks "Accept"
    ↓
POST /api/orders/[id]/accept
    ↓
Order updated:
  - Status: IN_PROGRESS
  - Contract: ACTIVE
  - Contract becomes IMMUTABLE
    ↓
Socket.IO event: CONTRACT_ACCEPTED
    ↓
Both client & freelancer see updated status
    ↓
Work begins!
```

#### **Option B: Reject Order**

```
Freelancer clicks "Reject"
    ↓
Dialog opens: "Reason for rejection?"
    ↓
Freelancer enters reason
    ↓
POST /api/orders/[id]/reject
    ↓
Order updated:
  - Status: CANCELLED
  - Contract: REJECTED
  - Cancellation reason saved
    ↓
Socket.IO event: CONTRACT_REJECTED
    ↓
Order closed
```

---

### **Phase 3: Work in Progress**

```
Status: IN_PROGRESS
    ↓
Freelancer works on project
    ↓
Can communicate via chat
    ↓
OrderCard shows:
  - Status: IN_PROGRESS
  - Delivery date countdown
  - Revisions available
```

---

### **Phase 4: Delivery**

```
Freelancer completes work
    ↓
Clicks "Deliver" in OrderCard
    ↓
Uploads files / Adds message
    ↓
POST /api/orders/[id]/deliver
  Body: {
    type: "FILE",
    fileUrl: "https://...",
    message: "Here's your delivery"
  }
    ↓
Order updated:
  - Status: DELIVERED
  - Deliverable created
    ↓
Socket.IO event: DELIVERY_SUBMITTED
    ↓
Client sees:
  - Status: DELIVERED
  - "Accept & Complete" button
  - "Request Revision" button
```

---

### **Phase 5: Client Response**

#### **Option A: Accept Delivery**

```
Client reviews delivery
    ↓
Satisfied with work
    ↓
Clicks "Accept & Complete"
    ↓
POST /api/orders/[id]/complete
  Body: {
    deliverableId: "..."
  }
    ↓
Order updated:
  - Status: COMPLETED
  - completedAt: timestamp
    ↓
Socket.IO event: ORDER_COMPLETED
    ↓
Order finished! ✅
```

#### **Option B: Request Revision**

```
Client wants changes
    ↓
Clicks "Request Revision"
    ↓
Dialog opens: "What changes do you need?"
    ↓
Client enters reason
    ↓
POST /api/orders/[id]/revision
  Body: {
    reason: "Need color changes"
  }
    ↓
Order updated:
  - Status: REVISION_REQUESTED
  - revisionsUsed: +1
    ↓
Socket.IO event: REVISION_REQUESTED
    ↓
Freelancer sees revision request
    ↓
Goes back to Phase 4 (Delivery)
```

**Note:** Revisions are limited by `revisionsIncluded` count.

---

## 🎨 UI Components Flow

### **1. Service Detail Page**
```
ServiceDetails.jsx
  ├── Right Sidebar
  │   ├── Price Card
  │   │   ├── "Order Service" Button (NEW!)
  │   │   └── "Contact me" Button
  │   └── Working Hours
  └── Main Content
      └── Service Info
```

### **2. Order Modal**
```
OrderModal.jsx
  ├── Service Price Display
  ├── Delivery Time Input
  ├── Revisions Count Input
  ├── Cancellation Policy Textarea
  └── Create Order Button
```

### **3. Chat Window with Order**
```
ChatWindow.jsx
  ├── Header (User info)
  ├── OrderCard (Top of messages)
  │   ├── Order Number
  │   ├── Status Badge
  │   ├── Price & Delivery Date
  │   └── Action Buttons (role-based)
  └── Messages
```

### **4. OrderCard Actions (Role-Based)**

**For Freelancer:**
- ✅ Accept (when PENDING_ACCEPTANCE)
- ❌ Reject (when PENDING_ACCEPTANCE)
- 📦 Deliver (when IN_PROGRESS or REVISION_REQUESTED)

**For Client:**
- ✅ Accept & Complete (when DELIVERED)
- 🔄 Request Revision (when DELIVERED)

---

## 📱 Real-Time Updates (Socket.IO)

### **Events Emitted:**

1. **`order:created`** - Order banne ke baad
2. **`order:updated`** - Kisi bhi status change pe
3. **`CONTRACT_ACCEPTED`** - Freelancer accept kare
4. **`CONTRACT_REJECTED`** - Freelancer reject kare
5. **`DELIVERY_SUBMITTED`** - Delivery submit ho
6. **`REVISION_REQUESTED`** - Client revision mange
7. **`ORDER_COMPLETED`** - Order complete ho

### **Who Receives Events:**
- Client (order owner)
- Freelancer (service provider)
- Both get real-time updates in chat

---

## 🔐 Security & Authorization

### **Order Creation:**
- ✅ Only CLIENT role can create orders
- ✅ Cannot order own service
- ✅ Must be logged in

### **Order Acceptance:**
- ✅ Only FREELANCER (order owner) can accept
- ✅ Only when status is PENDING_ACCEPTANCE

### **Delivery:**
- ✅ Only FREELANCER can submit delivery
- ✅ Only when status is IN_PROGRESS or REVISION_REQUESTED

### **Completion:**
- ✅ Only CLIENT can complete order
- ✅ Only when status is DELIVERED

---

## 📊 Order Status Flow Diagram

```
PENDING_ACCEPTANCE
    │
    ├─→ [Freelancer Accepts] → IN_PROGRESS
    │
    └─→ [Freelancer Rejects] → CANCELLED ❌

IN_PROGRESS
    │
    └─→ [Freelancer Delivers] → DELIVERED

DELIVERED
    │
    ├─→ [Client Accepts] → COMPLETED ✅
    │
    └─→ [Client Requests Revision] → REVISION_REQUESTED
            │
            └─→ [Freelancer Delivers Again] → DELIVERED
                    │
                    └─→ (Repeat until COMPLETED or revisions exhausted)

Any Status
    │
    └─→ [Dispute Opened] → DISPUTED
```

---

## 🚀 Quick Start Guide

### **For Clients:**

1. Browse services
2. Click on a service
3. Click "Order Service" button
4. Fill order details
5. Submit order
6. Wait for freelancer acceptance
7. Monitor progress in chat
8. Accept delivery or request revision
9. Complete order when satisfied

### **For Freelancers:**

1. Receive order notification
2. Open chat/messages
3. Review order details
4. Accept or reject order
5. Work on project
6. Submit delivery
7. Handle revisions if needed
8. Get paid when order completes

---

## 💡 Important Notes

1. **Contract Immutability:** Once accepted, contract cannot be changed
2. **Revision Limits:** Revisions are limited by `revisionsIncluded`
3. **Real-time Updates:** All changes reflect instantly via Socket.IO
4. **Chat Integration:** Orders automatically appear in relevant conversations
5. **Audit Trail:** Every action is logged in OrderEvent table
6. **IP Tracking:** Client and freelancer IPs are stored for legal purposes

---

## 🐛 Troubleshooting

### **Order not showing in chat?**
- Check if conversation exists
- Verify order has `conversationId`
- Refresh page

### **Cannot accept order?**
- Check if you're the freelancer
- Verify order status is PENDING_ACCEPTANCE
- Check Prisma client is regenerated

### **Socket.IO not updating?**
- Check server is running
- Verify Socket.IO connection
- Check browser console for errors

---

**Implementation Complete! 🎉**

Ab users easily orders create kar sakte hain aur complete flow working hai!


