# Factory Pattern – Phân tích & Áp dụng trong Cinema Booking Project

---

## 1. Tính chất cốt lõi của Factory Pattern

> **"Đừng gọi `new` trực tiếp — hãy để Factory quyết định tạo ra cái gì."**

| Tính chất | Giải thích ngắn gọn |
|---|---|
| **Encapsulation of creation** | Logic khởi tạo object nằm trong Factory, consumer không cần biết bên trong làm gì |
| **Single Responsibility** | Nơi tạo object tách biệt hoàn toàn khỏi nơi sử dụng |
| **Open/Closed** | Thêm loại mới → thêm vào Factory, không sửa code cũ |
| **Loose coupling** | Consumer phụ thuộc vào interface/contract, không phụ thuộc vào class cụ thể |

**Factory Method** → một hàm/class đảm nhận việc tạo **một loại** object theo tham số.  
**Abstract Factory** → một "siêu nhà máy" tạo ra **họ các object liên quan** (family of products).

---

## 2. Tư duy nhà máy có thể đơn giản hoá những phần nào trong project này?

Sau khi điều tra toàn bộ `frontend/src/`, có **5 vùng** rõ ràng đang lặp lại pattern tạo object thủ công:

### 🔴 Vùng 1 — `handleApiResponse` / `handleError` bị sao chép 10+ lần
**Vị trí:** Tất cả service files  
`movieService.js`, `roomService.js`, `scheduleService.js`, `seatService.js`, `promotionService.js`, `serviceService.js`, `reviewService.js`, `ticketService.js`, `paymentService.js`, `userService.js`

Mỗi file đều tự định nghĩa riêng 2 hàm gần như giống hệt nhau:
```js
// Lặp lại ở 10 files!
const handleApiResponse = (response) => ({ success: true, data: response.data.data, ... });
const handleError = (error) => ({ success: false, message: error.response?.data?.message || "Lỗi kết nối server" });
```
→ **Factory Method** có thể tạo một `ServiceResponseFactory` dùng chung.

---

### 🔴 Vùng 2 — Payment provider switching trong `PaymentProcess.jsx` *(Đánh giá cao nhất — xem mục 3)*
**Vị trí:** `components/booking/PaymentProcess.jsx`

Logic `if (method === 'MOMO') { ... } else { ... }` nằm inline trong component, kết hợp với `ticketService.createMoMoPayment` / `ticketService.createVNPayPayment` gọi thủ công. Đây là điểm mở rộng điển hình của Factory.

---

### 🟡 Vùng 3 — VNPayRedirect & MoMoRedirect là 2 component gần như giống hệt nhau
**Vị trí:** `components/payment/VNPayRedirect.jsx`, `MoMoRedirect.jsx`

Cả 2 file có logic y chang nhau, chỉ khác tên provider trong chuỗi text. Một `PaymentRedirectFactory` có thể sinh ra component theo provider.

---

### 🟡 Vùng 4 — Tất cả service classes đều có cùng cấu trúc CRUD
**Vị trí:** `roomService.js`, `scheduleService.js`, `seatService.js`, `movieService.js`...

Mỗi service lặp đúng pattern: `getAll`, `getById`, `create`, `update`, `delete`, `getPaginated`. Một `BaseCrudServiceFactory` có thể sinh ra service object cho từng resource.

---

### 🟢 Vùng 5 — `apiClient.js` tạo 2 axios instance thủ công
**Vị trí:** `services/apiClient.js`

`publicApiClient` và `apiClient` được tạo thủ công với cùng config, chỉ khác ở interceptor. Một `AxiosClientFactory` có thể tạo instance theo loại (public/private/multipart).

---

## 3. Vùng đáng giá nhất: Payment Provider Factory

### Lý do chọn vùng này
- **Tác động trực tiếp** đến nghiệp vụ cốt lõi: đặt vé & thanh toán
- **Sẵn sàng mở rộng**: dự án đang có VNPay + MoMo, rất có thể thêm ZaloPay, PayOS... sau này
- **`if/else` phân nhánh theo provider** đang nằm trực tiếp trong React component — vi phạm SRP
- **3 chỗ rải rác** đang "biết" về provider: `PaymentProcess.jsx`, `ticketService.js`, `paymentService.js`

---

### Code cũ — Vấn đề

**`ticketService.js`** — 2 method song song, logic tạo payment bị nhân đôi:
```js
// ticketService.js
createVNPayPayment: async (paymentData) => {
  try {
    const response = await apiClient.post("/payment/vn_pay/create", paymentData);
    return handleApiResponse(response);
  } catch (error) {
    return handleError(error);
  }
},

createMoMoPayment: async (paymentData) => {
  try {
    const response = await apiClient.post("/payment/momo/create", paymentData);  // ← chỉ khác endpoint
    return handleApiResponse(response);
  } catch (error) {
    return handleError(error);
  }
},
```

**`PaymentProcess.jsx`** — `if/else` quyết định provider nằm giữa component:
```jsx
// PaymentProcess.jsx — dòng 52-57
let result;
if (method === 'MOMO') {
  result = await ticketService.createMoMoPayment(paymentData);
} else {
  result = await ticketService.createVNPayPayment(paymentData);
}

// Dòng 62: tiếp tục phân nhánh để xử lý URL trả về khác nhau
const url = typeof result.data === 'object' ? result.data.payUrl : result.data;

// Dòng 89: lại phân nhánh khi show message
showInfo(`Đã tạo liên kết thanh toán ${paymentMethod === 'MOMO' ? 'MoMo' : 'VNPay'}...`);
```

**Hệ quả khi thêm ZaloPay:**  
Phải sửa `ticketService.js` (thêm method), `PaymentProcess.jsx` (thêm `else if`), `paymentService.js` (thêm `refundZaloPay`) — **3 file khác nhau.**

---

### Code mới — Áp dụng Factory Method Pattern

#### Bước 1: Tạo file `src/services/payment/paymentProviderFactory.js`

```js
// src/services/payment/paymentProviderFactory.js
import apiClient from "../apiClient";

// ─── Shared response helpers ──────────────────────────────────────────────────
const handleApiResponse = (response) => ({
  success: true,
  data: response.data.data,
  message: response.data.message,
});

const handleError = (error) => ({
  success: false,
  message: error.response?.data?.message || "Lỗi kết nối server",
});

// ─── Contract (interface) mà mọi provider phải tuân theo ─────────────────────
// createPayment(paymentData)  → { success, data: { payUrl } }
// refund(refundData)          → { success, data }
// getDisplayName()            → string
// extractPayUrl(data)         → string

// ─── VNPay Provider ──────────────────────────────────────────────────────────
const VNPayProvider = {
  getDisplayName: () => "VNPay",

  async createPayment(paymentData) {
    try {
      const response = await apiClient.post("/payment/vn_pay/create", paymentData);
      const raw = handleApiResponse(response);
      // VNPay trả về URL dạng string thẳng
      return { ...raw, data: { payUrl: raw.data } };
    } catch (error) {
      return handleError(error);
    }
  },

  async refund(refundData) {
    try {
      const response = await apiClient.post("/payment/vn_pay/refund", refundData);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

// ─── MoMo Provider ───────────────────────────────────────────────────────────
const MoMoProvider = {
  getDisplayName: () => "MoMo",

  async createPayment(paymentData) {
    try {
      const response = await apiClient.post("/payment/momo/create", paymentData);
      const raw = handleApiResponse(response);
      // MoMo trả về object có field payUrl
      return { ...raw, data: { payUrl: raw.data?.payUrl ?? raw.data } };
    } catch (error) {
      return handleError(error);
    }
  },

  async refund(refundData) {
    try {
      const response = await apiClient.post("/payment/momo/refund", refundData);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

// ─── Factory ─────────────────────────────────────────────────────────────────
const PROVIDERS = {
  VNPAY: VNPayProvider,
  MOMO: MoMoProvider,
  // Thêm provider mới: ZALOPAY: ZaloPayProvider,  ← chỉ thêm vào đây
};

/**
 * Factory Method: trả về provider tương ứng với tên.
 * @param {string} providerName  "VNPAY" | "MOMO"
 * @returns {object} provider
 */
export function createPaymentProvider(providerName = "VNPAY") {
  const key = providerName.toUpperCase();
  const provider = PROVIDERS[key];

  if (!provider) {
    throw new Error(
      `[PaymentProviderFactory] Provider "${providerName}" không được hỗ trợ. ` +
      `Các provider hợp lệ: ${Object.keys(PROVIDERS).join(", ")}`
    );
  }

  return provider;
}

export default createPaymentProvider;
```

---

#### Bước 2: Đơn giản hoá `PaymentProcess.jsx`

```jsx
// Trước — PaymentProcess.jsx (dòng 49-65, có if/else rải rác)
// Sau — chỉ cần 2 dòng:

import { createPaymentProvider } from '../../services/payment/paymentProviderFactory';

const createPaymentUrl = async () => {
  setLoading(true);
  try {
    const method = bookingData.phuongThucThanhToan?.toUpperCase() || 'VNPAY';
    setPaymentMethod(method);

    // ✅ Factory quyết định provider — component không cần biết chi tiết
    const provider = createPaymentProvider(method);
    const paymentData = { amount: bookingData.tongTien, orderId: bookingData.maHD };
    const result = await provider.createPayment(paymentData);

    if (result.success) {
      setPaymentUrl(result.data.payUrl); // ✅ Interface đã chuẩn hoá — không cần typeof check
      showInfo(`Đã tạo liên kết ${provider.getDisplayName()}. Vui lòng hoàn tất trong 5 phút.`);
    } else {
      showError(result.message);
      onPaymentFailure();
    }
  } catch (error) {
    showError(error.message || 'Có lỗi xảy ra khi tạo thanh toán');
    onPaymentFailure();
  }
  setLoading(false);
};
```

---

#### Bước 3: Khi thêm ZaloPay (chứng minh Open/Closed)

```js
// paymentProviderFactory.js — CHỈ thêm đúng 1 chỗ, không sửa gì khác

const ZaloPayProvider = {
  getDisplayName: () => "ZaloPay",
  async createPayment(paymentData) { /* ... */ },
  async refund(refundData) { /* ... */ },
};

const PROVIDERS = {
  VNPAY: VNPayProvider,
  MOMO: MoMoProvider,
  ZALOPAY: ZaloPayProvider,   // ← thêm 1 dòng, xong
};
```

`PaymentProcess.jsx` không cần sửa gì. `ticketService.js` không cần sửa gì.

---

## 4. Ưu điểm thực tiễn

| # | Ưu điểm | Biểu hiện cụ thể trong project |
|---|---|---|
| **1** | **Xoá `if/else` khỏi component** | `PaymentProcess.jsx` giảm từ 3 chỗ phân nhánh theo provider → 0, component chỉ còn gọi `provider.createPayment()` |
| **2** | **Thêm provider mới không gây rủi ro** | Thêm ZaloPay = thêm 1 object vào `PROVIDERS`, không chạm vào component hay service cũ |
| **3** | **Chuẩn hoá interface** | Xóa bỏ điều kiện `typeof result.data === 'object' ? result.data.payUrl : result.data` — mọi provider đều trả về `{ payUrl }` |
| **4** | **Lỗi bị bắt sớm & rõ ràng** | Nếu truyền provider không hợp lệ, Factory throw ngay với message có nghĩa, thay vì component crash ngầm |
| **5** | **Dễ test độc lập** | Có thể mock `createPaymentProvider('VNPAY')` và test từng provider riêng biệt, không cần mount toàn bộ component |
| **6** | **Tập trung refund logic** | `paymentService.refundVNPay` và `refundMoMo` hợp nhất vào trong từng provider → `provider.refund(data)` |

