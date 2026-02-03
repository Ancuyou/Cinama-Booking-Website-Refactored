// Debug Promotion & Payment Amount
// Copy vào console khi ở trang booking để debug khuyến mãi

console.log('💰 Debugging Promotion & Payment Amounts...\n');

// Helper để format tiền
const formatMoney = (amount) => (amount || 0).toLocaleString('vi-VN') + ' VNĐ';

// Debug function cho booking data
const debugBookingAmounts = (bookingData) => {
  console.log('📊 Booking Data Analysis:');
  console.log('- Mã đơn hàng:', bookingData.maHD);
  console.log('- Tổng tiền hiển thị:', formatMoney(bookingData.tongTien));
  console.log('- Tổng tiền vé:', formatMoney(bookingData.tongTienVe));
  console.log('- Tổng tiền dịch vụ:', formatMoney(bookingData.tongTienDichVu));
  console.log('- Ghi chú:', bookingData.ghiChu);
  
  // Parse ghi chú để lấy thông tin chi tiết
  if (bookingData.ghiChu) {
    const lines = bookingData.ghiChu.split('\n');
    lines.forEach(line => console.log('  ' + line));
  }
  
  console.log('- Số vé:', (bookingData.danhSachVe || []).length);
  console.log('- Dịch vụ:', (bookingData.danhSachDichVu || []).length);
};

// Test với API thực
const testPaymentCalculation = async (orderId) => {
  console.log(`\n🧮 Testing Payment Calculation for ${orderId}...`);
  
  try {
    const response = await fetch(`http://localhost:8080/api/payment/detail/${orderId}`);
    const result = await response.json();
    
    if (result.code === 200) {
      const invoice = result.data;
      console.log('✅ Invoice loaded successfully');
      
      debugBookingAmounts(invoice);
      
      // Tính toán thủ công
      console.log('\n🧮 Manual Calculation:');
      
      let totalTickets = 0;
      (invoice.danhSachVe || []).forEach(ticket => {
        totalTickets += ticket.thanhTien || 0;
        console.log(`- Vé ${ticket.tenGhe}: ${formatMoney(ticket.thanhTien)}`);
      });
      console.log(`Total tickets: ${formatMoney(totalTickets)}`);
      
      let totalServices = 0;
      (invoice.danhSachDichVu || []).forEach(service => {
        totalServices += service.thanhTien || 0;
        console.log(`- Dịch vụ ${service.tenDichVu}: ${formatMoney(service.giaDichVu)} x ${service.soLuong} = ${formatMoney(service.thanhTien)}`);
      });
      console.log(`Total services: ${formatMoney(totalServices)}`);
      
      const subtotal = totalTickets + totalServices;
      console.log(`Subtotal: ${formatMoney(subtotal)}`);
      
      const discount = subtotal - (invoice.tongTien || 0);
      console.log(`Discount applied: ${formatMoney(discount)}`);
      console.log(`Final total: ${formatMoney(invoice.tongTien)}`);
      
      // So sánh với thông tin từ API
      console.log('\n📊 API vs Manual Comparison:');
      console.log(`API tongTienVe: ${formatMoney(invoice.tongTienVe)} vs Manual: ${formatMoney(totalTickets)}`);
      console.log(`API tongTienDichVu: ${formatMoney(invoice.tongTienDichVu)} vs Manual: ${formatMoney(totalServices)}`);
      
      const apiDiscount = (invoice.tongTienVe || 0) + (invoice.tongTienDichVu || 0) - (invoice.tongTien || 0);
      console.log(`API discount: ${formatMoney(apiDiscount)} vs Manual: ${formatMoney(discount)}`);
      
    } else {
      console.log('❌ Failed to load invoice:', result.message);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

// Test với sample data
const testSampleOrder = () => {
  console.log('\n📝 Testing with sample data...');
  testPaymentCalculation('HD1760166753197107');
};

// Export for manual use
window.debugPayment = {
  debugBookingAmounts,
  testPaymentCalculation,
  testSampleOrder,
  formatMoney
};

console.log(`
💡 Payment Debug Tool Ready!

Usage:
- debugPayment.testSampleOrder()                    // Test with sample order
- debugPayment.testPaymentCalculation('HD123456')   // Test specific order
- debugPayment.debugBookingAmounts(bookingData)     // Debug booking object

This will help identify:
1. Where promotion discount is calculated wrong
2. Differences between API amounts and displayed amounts  
3. Manual calculation vs API calculation
`);

// Auto-test with sample
testSampleOrder();