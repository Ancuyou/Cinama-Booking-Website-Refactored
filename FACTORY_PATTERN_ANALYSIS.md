# Factory / Abstract Factory Pattern – Phân tích & Áp dụng trong Cinema Booking Project

---

## 1. Tính chất cốt lõi — một dòng

> **"Đừng gọi `new` trực tiếp — hãy để Factory quyết định tạo ra cái gì."**

| | Factory Method | Abstract Factory |
|---|---|---|
| **Tạo ra** | Một object theo tham số | Cả **họ** các object liên quan (family of products) |
| **Keyword** | `createSomething(type)` | `getGateway(provider)` → trả về provider biết `createPayment + refund + verify` |
| **Mở rộng** | Thêm `case` mới vào factory | Thêm 1 **class mới** implement interface, factory tự nhận ra |
| **Dùng khi** | Object tạo ra đơn giản, ít thao tác | Object tạo ra là 1 nhóm behavior phức tạp, có nhiều operation |

**Factory Method** → khi consumer cần **1 loại object** được tạo linh hoạt theo điều kiện.  
**Abstract Factory** → khi consumer cần **1 bộ behavior đồng bộ** (ví dụ: cùng provider thì createPayment + refund + verify phải đồng bộ nhau, không thể trộn lẫn).

---

## 2. Khi nào nên dùng Factory? Khi nào dùng Abstract Factory?

### Dùng Factory Method khi:
- Có **một loại object** nhưng cần chọn implementation khác nhau theo điều kiện
- Logic tạo object đơn giản, ít field
- Ví dụ điển hình: `EmailTemplateFactory.create("OTP")` → trả về 1 `EmailTemplate`

### Dùng Abstract Factory khi:
- Cần tạo ra **một nhóm object liên quan** mà phải **đồng bộ với nhau**
- Consumer không được trộn lẫn product của hai factory khác nhau
- Có nhiều "gia đình" implementation, mỗi gia đình có nhiều operation
- Ví dụ điển hình: Payment Gateway — nếu dùng MoMo thì `createPayment + refund` đều phải là MoMo, không thể dùng `createPayment MoMo` nhưng lại `refund VNPay`

### Dấu hiệu nhận biết cần Abstract Factory trong code:
```
❌ Dấu hiệu cần refactor:
   - if (provider == "MOMO") { ... } else if (provider == "VNPAY") { ... }  ← nhiều nơi
   - Service chứa logic của nhiều provider trong cùng 1 file
   - Thêm provider mới → phải sửa nhiều file khác nhau
```

---

## 3. Điểm áp dụng trong project — Payment Gateway

### Tại sao chọn đây?

Trong `HoaDonService.java` (file ~700 dòng), có **4 method payment song song**:

| Method | Dòng code | Logic |
|---|---|---|
| `createMoMoQR()` | ~30 dòng | Build HMAC-SHA256 + `CreateMomoRequest` |
| `refundMomo()` | ~25 dòng | Build HMAC-SHA256 + `CreateMomoRefundRequest` |
| `createVnPayRequest()` | ~50 dòng | Build `Map<String,String>` + URL encode + HMAC-SHA512 |
| `refundVnPay()` | ~60 dòng | Build `JsonObject` + HTTP POST thủ công + parse response |

`HoaDonService` đang **biết quá nhiều** về cả 2 provider — vi phạm **Single Responsibility Principle**. Khi thêm ZaloPay, sẽ phải sửa file 700+ dòng này.

---

## 4. So sánh Code cũ và Code mới

### 4.1 Cấu trúc file

```
❌ TRƯỚC (không có Factory):

HoaDonService.java  (700+ dòng)
├── @Value momo.partnerCode / accessKey / secretKey / ...  ← 7 config MoMo
├── @Value backend.base-url                                ← 1 config VNPay
├── @Autowired MomoAPI                                     ← phụ thuộc trực tiếp SDK MoMo
├── createMoMoQR()          ← 30 dòng HMAC-SHA256 + build MoMo request
├── refundMomo()            ← 25 dòng HMAC-SHA256 + build MoMo refund request
├── checkmomorefund()       ← 20 dòng check trạng thái hoàn tiền MoMo
├── createVnPayRequest()    ← 50 dòng Map + URL encode + HMAC-SHA512
├── refundVnPay()           ← 60 dòng JsonObject + HTTP POST thủ công
└── updatePaymentStatus()   ← logic business chính
```

```
✅ SAU (có Abstract Factory):

payment/
├── PaymentGateway.java         ← interface: createPayment + refund + checkRefundStatus
├── PaymentResult.java          ← unified response (thay String / CreateMomoResponse)
├── MomoPaymentGateway.java     ← toàn bộ ~120 dòng logic MoMo nằm ở đây
├── VNPayPaymentGateway.java    ← toàn bộ ~110 dòng logic VNPay nằm ở đây
└── PaymentGatewayFactory.java  ← factory trung tâm

HoaDonService.java  (đã xóa hoàn toàn 165+ dòng MoMo/VNPay)
├── @Autowired PaymentGatewayFactory  ← 1 dòng thay 8 @Value + 1 @Autowired MomoAPI
├── createPaymentViaFactory()   ← 4 dòng, thay createMoMoQR + createVnPayRequest
├── refundViaFactory()          ← 4 dòng, thay refundMomo + refundVnPay
├── checkRefundStatusViaFactory() ← 4 dòng, thay checkmomorefund
└── updatePaymentStatus()       ← logic business chính (không đổi)

HoaDonController.java  (đã xóa import MoMo-specific)
├── POST /vn_pay/create   → createPaymentViaFactory()      ← không còn gọi createVnPayRequest
├── POST /vn_pay/refund   → refundViaFactory()             ← không còn gọi refundVnPay
├── POST /momo/create     → createPaymentViaFactory()      ← không còn gọi createMoMoQR
├── POST /momo/refund     → refundViaFactory()             ← không còn gọi refundMomo
└── POST /checkrefund     → checkRefundStatusViaFactory()  ← không còn gọi checkmomorefund
```

---

### 4.2 Interface — Contract của mọi provider

```java
// ✅ MỚI: payment/PaymentGateway.java
// Đây là "hợp đồng" mà MomoPaymentGateway và VNPayPaymentGateway đều phải ký.
// HoaDonService chỉ biết đến interface này — không biết provider nào đang chạy.

public interface PaymentGateway {
    PaymentResult createPayment(PaymentRequest paymentRequest, HttpServletRequest httpRequest) throws IOException;
    PaymentResult refund(PaymentRequest paymentRequest, HttpServletRequest httpRequest) throws IOException;
    String getProviderName();   // "MOMO" | "VNPAY" | "ZALOPAY"
}
```

```java
// ✅ MỚI: payment/PaymentResult.java
// Chuẩn hoá response — mọi provider đều trả về cùng một kiểu,
// không còn: String (VNPay) vs CreateMomoResponse (MoMo)

@Data @Builder
public class PaymentResult {
    private boolean success;
    private String payUrl;        // URL redirect thanh toán
    private String message;
    private String rawResponseCode;
    private String transactionId;
}
```

---

### 4.3 Code cũ — `HoaDonService` biết quá nhiều

```java
// ❌ CŨ: HoaDonService.java
// Hai method tạo thanh toán — logic HOÀN TOÀN khác nhau nằm cùng 1 class

// ─── MoMo: HMAC-SHA256, partnerCode, requestType ─────────────────────────────
public CreateMomoResponse createMoMoQR(PaymentRequest paymentRequest) {
    String rawSignature = "accessKey=" + accessKey +
            "&amount=" + amount +
            "&extraData=" + extraData +
            "&ipnUrl=" + notifyUrl +
            "&orderId=" + orderId +
            "&orderInfo=" + orderInfo +
            "&partnerCode=" + partnerCode +
            "&redirectUrl=" + returnUrl +
            "&requestId=" + requestId +
            "&requestType=" + requestType;                  // ← MoMo-specific
    String signature = PaymentConfig.hmacSHA256(secretKey, rawSignature);  // ← SHA256

    CreateMomoRequest request = CreateMomoRequest.builder()
            .partnerCode(partnerCode).requestType(requestType)
            .ipnUrl(notifyUrl).redirectUrl(returnUrl)
            // ... 10 fields MoMo-specific
            .build();
    return momoAPI.createMomoQR(request);
    // Trả về CreateMomoResponse — type MoMo-specific
}

// ─── VNPay: HMAC-SHA512, vnp_Params Map, URL encode thủ công ─────────────────
public String createVnPayRequest(PaymentRequest paymentRequest, ...) throws IOException {
    Map<String, String> vnp_Params = new HashMap<>();
    vnp_Params.put("vnp_Version", PaymentConfig.vnp_Version);  // ← VNPay-specific
    vnp_Params.put("vnp_Command", PaymentConfig.vnp_Command);  // ← VNPay-specific
    // ... 10 fields VNPay-specific

    // Build hash + URL encode thủ công (50 dòng)
    List fieldNames = new ArrayList(vnp_Params.keySet());
    Collections.sort(fieldNames);
    StringBuilder hashData = new StringBuilder();
    // ... vòng lặp 20 dòng
    String vnp_SecureHash = PaymentConfig.hmacSHA512(PaymentConfig.secretKey, ...); // ← SHA512
    return PaymentConfig.vnp_PayUrl + "?" + queryUrl;
    // Trả về String — type VNPay-specific
}
```

```java
// ❌ CŨ: Controller phải biết cả 2 kiểu trả về khác nhau
// POST /vn_pay/create  → gọi createVnPayRequest() → nhận String
// POST /momo/create   → gọi createMoMoQR()        → nhận CreateMomoResponse
// 2 endpoint riêng biệt chỉ vì service trả về 2 kiểu khác nhau
```

---

### 4.4 Code mới — Factory Pattern

```java
// ✅ MỚI: payment/MomoPaymentGateway.java
// Toàn bộ logic MoMo đóng gói trong đây — HoaDonService không biết file này tồn tại

@Component
@RequiredArgsConstructor
@Slf4j
public class MomoPaymentGateway implements PaymentGateway {

    private final MomoAPI momoAPI;
    @Value("${momo.partnerCode}") private String partnerCode;
    // ... các @Value MoMo-specific

    @Override
    public String getProviderName() { return "MOMO"; }

    @Override
    public PaymentResult createPayment(PaymentRequest req, HttpServletRequest http) throws IOException {
        // ... toàn bộ logic MoMo (HMAC-SHA256, build request, gọi API)
        CreateMomoResponse momoResponse = momoAPI.createMomoQR(request);
        if (momoResponse.getResultCode() == 0) {
            return PaymentResult.success(momoResponse.getPayUrl()); // ← chuẩn hoá về PaymentResult
        }
        return PaymentResult.failure(momoResponse.getMessage(), String.valueOf(momoResponse.getResultCode()));
    }

    @Override
    public PaymentResult refund(PaymentRequest req, HttpServletRequest http) throws IOException {
        // ... toàn bộ logic refund MoMo (HMAC-SHA256 khác, build CreateMomoRefundRequest)
    }
}
```

```java
// ✅ MỚI: payment/PaymentGatewayFactory.java
// Spring tự inject tất cả PaymentGateway beans — Factory không cần if/else

@Component
@RequiredArgsConstructor
public class PaymentGatewayFactory {

    private final Map<String, PaymentGateway> gatewayBeans; // Spring inject tất cả @Component

    public PaymentGateway getGateway(String provider) {
        PaymentGateway gateway = gatewayBeans.values().stream()
                .filter(g -> g.getProviderName().equalsIgnoreCase(provider))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "[PaymentGatewayFactory] Provider \"" + provider + "\" không hỗ trợ"));

        log.info("[FACTORY] getGateway({}) → {}@{}", provider,
                gateway.getClass().getSimpleName(),
                Integer.toHexString(System.identityHashCode(gateway)));
        return gateway;
    }
}
```

```java
// ✅ MỚI: HoaDonService.java — method mới chỉ 5 dòng, không biết MoMo hay VNPay
@Autowired
private PaymentGatewayFactory paymentGatewayFactory;

public PaymentResult createPaymentViaFactory(PaymentRequest paymentRequest,
                                              HttpServletRequest httpRequest) throws IOException {
    HoaDon hoaDon = getHoaDonByMaHD(paymentRequest.getOrderId());
    String provider = hoaDon.getPhuongThucThanhToan(); // "MOMO" hoặc "VNPAY"

    PaymentGateway gateway = paymentGatewayFactory.getGateway(provider); // ← Factory quyết định
    return gateway.createPayment(paymentRequest, httpRequest);            // ← Không if/else
}

public PaymentResult refundViaFactory(PaymentRequest paymentRequest,
                                       HttpServletRequest httpRequest) throws IOException {
    HoaDon hoaDon = getHoaDonByMaHD(paymentRequest.getOrderId());
    String provider = hoaDon.getPhuongThucThanhToan();

    PaymentGateway gateway = paymentGatewayFactory.getGateway(provider); // ← Factory quyết định
    return gateway.refund(paymentRequest, httpRequest);                   // ← Không if/else
}
```

---

### 4.5 Thêm ZaloPay — chứng minh Open/Closed Principle

```java
// ✅ Khi thêm ZaloPay, CHỈ tạo 1 file mới — không sửa gì khác:

// payment/ZaloPayPaymentGateway.java  ← FILE MỚI DUY NHẤT
@Component
public class ZaloPayPaymentGateway implements PaymentGateway {

    @Override
    public String getProviderName() { return "ZALOPAY"; }

    @Override
    public PaymentResult createPayment(PaymentRequest req, HttpServletRequest http) throws IOException {
        // ... logic ZaloPay
    }

    @Override
    public PaymentResult refund(PaymentRequest req, HttpServletRequest http) throws IOException {
        // ... logic refund ZaloPay
    }
}

// Spring tự inject ZaloPayPaymentGateway vào PaymentGatewayFactory.gatewayBeans
// HoaDonService.createPaymentViaFactory() không thay đổi 1 dòng nào
// PaymentGatewayFactory không thay đổi 1 dòng nào
```

**Tóm tắt so sánh:**

| | ❌ Code cũ (không Factory) | ✅ Code mới (Abstract Factory) |
|---|---|---|
| **Thêm ZaloPay** | Sửa `HoaDonService` (700 dòng) | Tạo 1 file mới |
| **HoaDonService biết** | MoMo + VNPay chi tiết | Chỉ biết `PaymentGateway` interface |
| **Kiểu trả về** | `String` (VNPay) / `CreateMomoResponse` (MoMo) | `PaymentResult` thống nhất |
| **if/else trong service** | Có (ngầm qua 2 method riêng) | Không có |
| **Test từng provider** | Phải mock toàn bộ `HoaDonService` | Mock từng Gateway độc lập |
| **Số file bị ảnh hưởng khi thêm provider** | 3–4 file | 1 file |

---

## 5. Demo thực tế — Chạy test tính năng

### Điều kiện cần

| Thành phần | Trạng thái cần |
|---|---|
| Backend Spring Boot | Đang chạy (`localhost:8080`) |
| Frontend Vite | Đang chạy (`localhost:5173`) |
| Database | Đã seed đủ phim, suất chiếu, ghế |
| File log backend | Mở sẵn để xem `[FACTORY]` log |

---

### Bước 1 — Khởi động hệ thống

Mở **2 terminal** song song:

```bash
# Terminal 1 — Backend
cd backend
mvnw spring-boot:run
```

```bash
# Terminal 2 — Frontend
cd frontend
npm run dev
```

Chờ backend in ra `Started MovieTickerApplication` trước khi tiếp tục.

---

### Bước 2 — Đặt vé và chọn phương thức thanh toán

1. Truy cập `http://localhost:5173`
2. Chọn phim → chọn suất chiếu → chọn ghế → bấm **Đặt vé**
3. Tại màn hình thanh toán, chọn **MoMo** hoặc **VNPay**
4. Bấm **Xác nhận thanh toán**

---

### Bước 3 — Quan sát Factory log trong terminal backend

Khi bấm xác nhận, backend gọi `createPaymentViaFactory()`. Kiểm tra log:

```
# Luồng với MoMo:
[FACTORY] getGateway(MOMO) → MomoPaymentGateway@3a7d9f1c
[FACTORY] MomoGateway.createPayment() → orderId=HD17603..., resultCode=0

# Luồng với VNPay:
[FACTORY] getGateway(VNPAY) → VNPayPaymentGateway@5b2e8a40
[FACTORY] VNPayGateway.createPayment() → orderId=HD17603...
```

**Điều cần chú ý:**
- `MomoPaymentGateway@3a7d9f1c` — địa chỉ hex không đổi qua nhiều request → Spring quản lý singleton, Factory không `new` mỗi lần
- Provider được quyết định tự động từ `hoaDon.getPhuongThucThanhToan()` — không có `if/else` nào trong `HoaDonService`

---

### Bước 4 — Test trực tiếp bằng curl (không cần frontend)

**Tạo đơn hàng trước** (cần token đăng nhập):

```bash
# Đăng nhập lấy token
curl -s -X POST http://localhost:8080/api/auth/token \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}" \
  | python -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])"
```

**Gọi factory endpoint — MoMo:**

```bash
curl -X POST http://localhost:8080/api/payment/momo/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d "{\"orderId\":\"<MA_HD>\",\"amount\":100000}"
```

Kết quả mong đợi:
```json
{
  "code": 201,
  "message": "Tạo thanh toán thành công",
  "data": {
    "resultCode": 0,
    "payUrl": "https://test-payment.momo.vn/v2/gateway/pay?...",
    "message": "Thành công."
  }
}
```

**Gọi factory endpoint — VNPay:**

```bash
curl -X POST http://localhost:8080/api/payment/vn_pay/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d "{\"orderId\":\"<MA_HD>\",\"amount\":100000}"
```

Kết quả mong đợi:
```json
{
  "code": 201,
  "message": "Tạo thanh toán thành công",
  "data": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=..."
}
```

---

### Bước 5 — Test provider không tồn tại (kiểm tra Factory error handling)

Tạo hóa đơn test với `phuongThucThanhToan = "ZALOPAY"` rồi gọi:

```bash
curl -X POST http://localhost:8080/api/payment/vn_pay/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d "{\"orderId\":\"<MA_HD_ZALOPAY>\",\"amount\":100000}"
```

Backend sẽ trả về lỗi rõ ràng từ Factory:
```json
{
  "code": 400,
  "message": "Tạo thanh toán thất bại: [PaymentGatewayFactory] Provider \"ZALOPAY\" không được hỗ trợ. Các provider hợp lệ: MOMO, VNPAY"
}
```

Log backend:
```
[FACTORY] getGateway(ZALOPAY) → IllegalArgumentException: Provider "ZALOPAY" không được hỗ trợ
```

---

### Bước 6 — Kiểm tra Open/Closed: thêm ZaloPay không sửa code cũ

Để chứng minh Abstract Factory thực sự đóng/mở, tạo file demo:

```java
// Tạo file: payment/ZaloPayPaymentGateway.java
@Component
public class ZaloPayPaymentGateway implements PaymentGateway {

    @Override
    public String getProviderName() { return "ZALOPAY"; }

    @Override
    public PaymentResult createPayment(PaymentRequest req, HttpServletRequest http) throws IOException {
        // Demo: trả về mock result
        log.info("[FACTORY] ZaloPayGateway.createPayment() → orderId={}", req.getOrderId());
        return PaymentResult.success("https://zalopay.mock/pay?orderId=" + req.getOrderId());
    }

    @Override
    public PaymentResult refund(PaymentRequest req, HttpServletRequest http) throws IOException {
        return PaymentResult.refundSuccess("ZALOPAY_" + System.currentTimeMillis(), "Hoàn tiền ZaloPay thành công");
    }
}
```

Restart backend, tạo hóa đơn với `phuongThucThanhToan = "ZALOPAY"` rồi gọi lại curl — lần này thành công:

```
[FACTORY] getGateway(ZALOPAY) → ZaloPayPaymentGateway@7c3d2e1a   ← tự động nhận
[FACTORY] ZaloPayGateway.createPayment() → orderId=HD17603...
```

**`HoaDonService.java`, `PaymentGatewayFactory.java` — không thay đổi 1 dòng nào.**

---

## 6. Tổng kết

```
Abstract Factory Pattern trong Payment Gateway:

  HoaDonService                     PaymentGatewayFactory
  ─────────────                     ─────────────────────
  createPaymentViaFactory()  ──────► getGateway("MOMO")
                                              │
                          ┌───────────────────┼──────────────────────┐
                          ▼                   ▼                      ▼
               MomoPaymentGateway   VNPayPaymentGateway   ZaloPayPaymentGateway
               ──────────────────   ──────────────────   ─────────────────────
               createPayment()      createPayment()      createPayment()
               refund()             refund()             refund()
               getProviderName()    getProviderName()    getProviderName()
                    │                    │                    │
                    └────────────────────┴────────────────────┘
                                         │
                                  PaymentGateway (interface)
                                  PaymentResult  (unified response)
```

**Nguyên tắc được tuân thủ:**
- ✅ **SRP** — Mỗi gateway file chỉ biết logic của 1 provider
- ✅ **OCP** — Thêm provider mới không sửa code cũ
- ✅ **DIP** — `HoaDonService` phụ thuộc vào `PaymentGateway` interface, không phụ thuộc vào class cụ thể
- ✅ **Testability** — Mock từng gateway độc lập mà không cần mount `HoaDonService`
