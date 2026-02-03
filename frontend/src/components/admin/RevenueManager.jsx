import React, {useEffect, useState} from 'react';
import {ChevronDown, ChevronUp, DollarSign, Download, Film, Minus, TrendingUp, Users} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import invoiceService from "../../services/invoiceService.js";
import {useToast} from "../common/Toast.jsx";
import * as XLSX from "xlsx-js-style";

const RevenueManager = () => {
    const [dateRange, setDateRange] = useState('today');
    const [selectedRoom, setSelectedRoom] = useState('all');
    const [invoice, setInvoice] = useState([]);
    const [movies, setMovie] = useState([]);
    const [roomRevenue, setRoomRevenue] = useState([]);
    const {showSuccess, showError} = useToast();
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [prevRevenue, setPrevRevenue] = useState([]);
    const [prevMovie, setPrevMovie] = useState([]);
    const [prevStartDate, setPrevStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [prevEndDate, setPrevEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyRevenue, setDailyRevenue] = useState([]);
    const [avgPrevTicketPrice, setAvgPrevTicketPrice] = useState(0);
    const [totalPrevSchedule, setTotalPrevSchedule] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalTickets, setTotalTickets] = useState(0);
    const [avgTicketPrice, setAvgTicketPrice] = useState(0);
    const [totalSchedule, setTotalSchedule] = useState(0);
    const [totalPrevRevenue, setTotalPrevRevenue] = useState(0);
    const [totalPrevTicket, setTotalPrevTicket] = useState(0);

    const [exportType, setExportType] = useState('full');
    const exportToExcel = async () => {
        try {
            // Lấy dữ liệu dựa trên exportType
            let exportData = [];
            let sheetName = '';
            
            // Tạo workbook
            const wb = XLSX.utils.book_new();
            
            const cinemaName = 'RẠP CHIẾU PHIM CINEMA';
            const reportTitle = 'BÁO CÁO DOANH THU';
            const periodText = dateRange === 'today' ? 'Hôm nay' : 
                            dateRange === 'week' ? 'Tuần này' :
                            dateRange === 'month' ? 'Tháng này' :
                            dateRange === 'year' ? 'Năm nay' :
                            `Từ ${startDate} đến ${endDate}`;
            const exportDate = `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`;
            
            // === SHEET 1: TỔNG QUAN ===
            if (exportType === 'full' || exportType === 'summary') {
                const ws1Data = [
                    [cinemaName],
                    [reportTitle],
                    [`Kỳ báo cáo: ${periodText}`],
                    [exportDate],
                    [],
                    ['CHỈ TIÊU', 'GIÁ TRỊ HIỆN TẠI', 'GIÁ TRỊ KỲ TRƯỚC', 'THAY ĐỔI (%)'],
                    ['Tổng doanh thu', totalRevenue, totalPrevRevenue, trend(totalPrevRevenue, totalRevenue).toFixed(2)],
                    ['Vé đã bán', totalTickets, totalPrevTicket, trend(totalPrevTicket, totalTickets).toFixed(2)],
                    ['Giá vé trung bình', avgTicketPrice, avgPrevTicketPrice, trend(avgPrevTicketPrice, avgTicketPrice).toFixed(2)],
                    ['Số suất chiếu', totalSchedule, totalPrevSchedule, trend(totalPrevSchedule, totalSchedule).toFixed(2)]
                ];
                
                const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
                
                // Merge cells
                ws1['!merges'] = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
                    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
                    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
                    { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }
                ];
                
                // Style tiêu đề
                ws1.A1.s = {
                    font: { bold: true, sz: 18, color: { rgb: "667eea" } },
                    alignment: { horizontal: "center", vertical: "center" },
                    fill: { fgColor: { rgb: "E8EAF6" } }
                };
                
                ws1.A2.s = {
                    font: { bold: true, sz: 14, color: { rgb: "764ba2" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
                
                ws1.A3.s = {
                    font: { sz: 11, italic: true, color: { rgb: "666666" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
                
                ws1.A4.s = {
                    font: { sz: 10, italic: true, color: { rgb: "999999" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
                
                // Style header
                const headerStyle = {
                    fill: { fgColor: { rgb: "667eea" } },
                    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        top: { style: "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } },
                        right: { style: "thin", color: { rgb: "000000" } }
                    }
                };
                
                for (let C = 0; C <= 3; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: 5, c: C });
                    if (!ws1[cellAddress]) ws1[cellAddress] = { t: 's', v: '' };
                    ws1[cellAddress].s = headerStyle;
                }
                
                // Style data rows
                for (let R = 6; R <= 9; R++) {
                    for (let C = 0; C <= 3; C++) {
                        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                        if (!ws1[cellAddress]) continue;
                        
                        ws1[cellAddress].s = {
                            alignment: { horizontal: C === 0 ? "left" : "center", vertical: "center" },
                            border: {
                                top: { style: "thin", color: { rgb: "CCCCCC" } },
                                bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                                left: { style: "thin", color: { rgb: "CCCCCC" } },
                                right: { style: "thin", color: { rgb: "CCCCCC" } }
                            }
                        };
                        
                        if (R % 2 === 0) {
                            ws1[cellAddress].s.fill = { fgColor: { rgb: "F5F5F5" } };
                        }
                        
                        // Format số
                        if (C >= 1 && C <= 2) {
                            ws1[cellAddress].t = 'n';
                            ws1[cellAddress].z = '#,##0';
                        }
                        
                        // Màu cho % thay đổi
                        if (C === 3) {
                            const value = parseFloat(ws1[cellAddress].v);
                            ws1[cellAddress].s.font = {
                                bold: true,
                                color: { rgb: value >= 0 ? "28a745" : "dc3545" }
                            };
                        }
                    }
                }
                
                ws1['!cols'] = [
                    { wch: 25 },
                    { wch: 20 },
                    { wch: 20 },
                    { wch: 15 }
                ];
                
                ws1['!rows'] = [
                    { hpt: 25 },
                    { hpt: 20 },
                    { hpt: 16 },
                    { hpt: 16 },
                    { hpt: 10 },
                    { hpt: 20 }
                ];
                
                XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');
            }
            
            // === SHEET 2: TOP PHIM ===
            if (exportType === 'full' || exportType === 'movies') {
                const ws2Data = [
                    [cinemaName],
                    ['TOP 5 PHIM DOANH THU CAO NHẤT'],
                    [`Kỳ báo cáo: ${periodText}`],
                    [exportDate],
                    [],
                    ['STT', 'Tên phim', 'Doanh thu (VND)', 'Vé bán', 'Suất chiếu', 'Xu hướng'],
                    ...movieTrend.map((movie, index) => [
                        index + 1,
                        movie.tenPhim,
                        movie.tongDoanhThu,
                        movie.soLuongVeDaBan,
                        movie.soLuongSuatChieu,
                        movie.xuHuong === 'up' ? `↑ ${movie.thayDoi}%` : 
                        movie.xuHuong === 'down' ? `↓ ${movie.thayDoi}%` : 'Mới'
                    ])
                ];
                
                const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
                
                ws2['!merges'] = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
                    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
                    { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
                    { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } }
                ];
                
                // Style tiêu đề
                ws2.A1.s = {
                    font: { bold: true, sz: 18, color: { rgb: "667eea" } },
                    alignment: { horizontal: "center", vertical: "center" },
                    fill: { fgColor: { rgb: "E8EAF6" } }
                };
                
                ws2.A2.s = {
                    font: { bold: true, sz: 14, color: { rgb: "764ba2" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
                
                ws2.A3.s = {
                    font: { sz: 11, italic: true, color: { rgb: "666666" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
                
                ws2.A4.s = {
                    font: { sz: 10, italic: true, color: { rgb: "999999" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
                
                // Style header
                for (let C = 0; C <= 5; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: 5, c: C });
                    if (!ws2[cellAddress]) ws2[cellAddress] = { t: 's', v: '' };
                    ws2[cellAddress].s = {
                        fill: { fgColor: { rgb: "667eea" } },
                        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } },
                            right: { style: "thin", color: { rgb: "000000" } }
                        }
                    };
                }
                
                // Style data rows
                for (let R = 6; R < 6 + movieTrend.length; R++) {
                    for (let C = 0; C <= 5; C++) {
                        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                        if (!ws2[cellAddress]) continue;
                        
                        ws2[cellAddress].s = {
                            alignment: { horizontal: C === 1 ? "left" : "center", vertical: "center" },
                            border: {
                                top: { style: "thin", color: { rgb: "CCCCCC" } },
                                bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                                left: { style: "thin", color: { rgb: "CCCCCC" } },
                                right: { style: "thin", color: { rgb: "CCCCCC" } }
                            }
                        };
                        
                        if (R % 2 === 0) {
                            ws2[cellAddress].s.fill = { fgColor: { rgb: "F5F5F5" } };
                        }
                        
                        // Format số tiền
                        if (C === 2) {
                            ws2[cellAddress].t = 'n';
                            ws2[cellAddress].z = '#,##0';
                            ws2[cellAddress].s.font = { bold: true, color: { rgb: "28a745" } };
                        }
                        
                        // Format xu hướng
                        if (C === 5) {
                            const text = ws2[cellAddress].v;
                            if (text.includes('↑')) {
                                ws2[cellAddress].s.font = { bold: true, color: { rgb: "28a745" } };
                            } else if (text.includes('↓')) {
                                ws2[cellAddress].s.font = { bold: true, color: { rgb: "dc3545" } };
                            }
                        }
                    }
                }
                
                ws2['!cols'] = [
                    { wch: 6 },
                    { wch: 30 },
                    { wch: 18 },
                    { wch: 12 },
                    { wch: 12 },
                    { wch: 15 }
                ];
                
                XLSX.utils.book_append_sheet(wb, ws2, 'Top phim');
            }
            
            // === SHEET 3: DOANH THU THEO PHÒNG ===
            if (exportType === 'full' || exportType === 'rooms') {
                const ws3Data = [
                    [cinemaName],
                    ['DOANH THU THEO PHÒNG CHIẾU'],
                    [`Kỳ báo cáo: ${periodText}`],
                    [exportDate],
                    [],
                    ['Tên phòng', 'Doanh thu (VND)', 'Vé bán', 'Giá TB/vé', 'Tỷ trọng (%)'],
                    ...roomRevenue.map(room => [
                        room.name,
                        room.revenue,
                        room.tickets,
                        room.revenue / room.tickets,
                        room.percentage
                    ]),
                    [],
                    ['TỔNG CỘNG', totalRevenue, totalTickets, avgTicketPrice, '100.00']
                ];
                
                const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
                
                ws3['!merges'] = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
                    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
                    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
                    { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } }
                ];
                
                // Style tiêu đề
                ws3.A1.s = {
                    font: { bold: true, sz: 18, color: { rgb: "667eea" } },
                    alignment: { horizontal: "center", vertical: "center" },
                    fill: { fgColor: { rgb: "E8EAF6" } }
                };
                
                ws3.A2.s = {
                    font: { bold: true, sz: 14, color: { rgb: "764ba2" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
                
                ws3.A3.s = {
                    font: { sz: 11, italic: true, color: { rgb: "666666" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
                
                ws3.A4.s = {
                    font: { sz: 10, italic: true, color: { rgb: "999999" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
                
                // Style header
                for (let C = 0; C <= 4; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: 5, c: C });
                    if (!ws3[cellAddress]) ws3[cellAddress] = { t: 's', v: '' };
                    ws3[cellAddress].s = {
                        fill: { fgColor: { rgb: "667eea" } },
                        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } },
                            right: { style: "thin", color: { rgb: "000000" } }
                        }
                    };
                }
                
                // Style data rows
                for (let R = 6; R < 6 + roomRevenue.length; R++) {
                    for (let C = 0; C <= 4; C++) {
                        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                        if (!ws3[cellAddress]) continue;
                        
                        ws3[cellAddress].s = {
                            alignment: { horizontal: C === 0 ? "left" : "center", vertical: "center" },
                            border: {
                                top: { style: "thin", color: { rgb: "CCCCCC" } },
                                bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                                left: { style: "thin", color: { rgb: "CCCCCC" } },
                                right: { style: "thin", color: { rgb: "CCCCCC" } }
                            }
                        };
                        
                        if (R % 2 === 0) {
                            ws3[cellAddress].s.fill = { fgColor: { rgb: "F5F5F5" } };
                        }
                        
                        // Format số
                        if (C >= 1) {
                            ws3[cellAddress].t = 'n';
                            ws3[cellAddress].z = '#,##0';
                        }
                    }
                }
                
                // Style tổng cộng
                const summaryRow = 6 + roomRevenue.length + 1;
                for (let C = 0; C <= 4; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: summaryRow, c: C });
                    if (!ws3[cellAddress]) continue;
                    ws3[cellAddress].s = {
                        font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
                        fill: { fgColor: { rgb: "28a745" } },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: {
                            top: { style: "medium", color: { rgb: "000000" } },
                            bottom: { style: "medium", color: { rgb: "000000" } },
                            left: { style: "medium", color: { rgb: "000000" } },
                            right: { style: "medium", color: { rgb: "000000" } }
                        }
                    };
                    if (C >= 1) {
                        ws3[cellAddress].t = 'n';
                        ws3[cellAddress].z = '#,##0';
                    }
                }
                
                ws3['!cols'] = [
                    { wch: 20 },
                    { wch: 18 },
                    { wch: 12 },
                    { wch: 15 },
                    { wch: 15 }
                ];
                
                XLSX.utils.book_append_sheet(wb, ws3, 'Theo phòng');
            }
            
            // === SHEET 4: DOANH THU THEO KHUNG GIỜ ===
            if (exportType === 'full' || exportType === 'timeslot') {
                const totalTimeSlot = timeSlotRevenue.reduce((sum, slot) => sum + slot.doanhThu, 0);
                
                const ws4Data = [
                    [cinemaName],
                    ['DOANH THU THEO KHUNG GIỜ'],
                    [`Kỳ báo cáo: ${periodText}`],
                    [exportDate],
                    [],
                    ['Khung giờ', 'Doanh thu (VND)', 'Tỷ trọng (%)'],
                    ...timeSlotRevenue.map(slot => [
                        slot.time,
                        slot.doanhThu,
                        totalTimeSlot > 0 ? ((slot.doanhThu / totalTimeSlot) * 100).toFixed(2) : 0
                    ]),
                    [],
                    ['TỔNG CỘNG', totalTimeSlot, '100.00']
                ];
                
                const ws4 = XLSX.utils.aoa_to_sheet(ws4Data);
                
                ws4['!merges'] = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
                    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
                    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
                    { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } }
                ];
                
                // Style giống các sheet trên
                ws4.A1.s = {
                    font: { bold: true, sz: 18, color: { rgb: "667eea" } },
                    alignment: { horizontal: "center", vertical: "center" },
                    fill: { fgColor: { rgb: "E8EAF6" } }
                };
                
                ws4.A2.s = {
                    font: { bold: true, sz: 14, color: { rgb: "764ba2" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
                
                ws4.A3.s = {
                    font: { sz: 11, italic: true, color: { rgb: "666666" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
                
                ws4.A4.s = {
                    font: { sz: 10, italic: true, color: { rgb: "999999" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
                
                // Style header và data
                for (let C = 0; C <= 2; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: 5, c: C });
                    if (!ws4[cellAddress]) ws4[cellAddress] = { t: 's', v: '' };
                    ws4[cellAddress].s = {
                        fill: { fgColor: { rgb: "667eea" } },
                        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } },
                            right: { style: "thin", color: { rgb: "000000" } }
                        }
                    };
                }
                
                for (let R = 6; R < 6 + timeSlotRevenue.length; R++) {
                    for (let C = 0; C <= 2; C++) {
                        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                        if (!ws4[cellAddress]) continue;
                        
                        ws4[cellAddress].s = {
                            alignment: { horizontal: "center", vertical: "center" },
                            border: {
                                top: { style: "thin", color: { rgb: "CCCCCC" } },
                                bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                                left: { style: "thin", color: { rgb: "CCCCCC" } },
                                right: { style: "thin", color: { rgb: "CCCCCC" } }
                            }
                        };
                        
                        if (R % 2 === 0) {
                            ws4[cellAddress].s.fill = { fgColor: { rgb: "F5F5F5" } };
                        }
                        
                        if (C >= 1) {
                            ws4[cellAddress].t = 'n';
                            ws4[cellAddress].z = '#,##0';
                        }
                    }
                }
                
                // Style tổng cộng
                const summaryRow = 6 + timeSlotRevenue.length + 1;
                for (let C = 0; C <= 2; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: summaryRow, c: C });
                    if (!ws4[cellAddress]) continue;
                    ws4[cellAddress].s = {
                        font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
                        fill: { fgColor: { rgb: "28a745" } },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: {
                            top: { style: "medium", color: { rgb: "000000" } },
                            bottom: { style: "medium", color: { rgb: "000000" } },
                            left: { style: "medium", color: { rgb: "000000" } },
                            right: { style: "medium", color: { rgb: "000000" } }
                        }
                    };
                    if (C >= 1) {
                        ws4[cellAddress].t = 'n';
                        ws4[cellAddress].z = '#,##0';
                    }
                }
                
                ws4['!cols'] = [
                    { wch: 15 },
                    { wch: 20 },
                    { wch: 15 }
                ];
                
                XLSX.utils.book_append_sheet(wb, ws4, 'Theo khung giờ');
            }
            
            // === SHEET 5: DOANH THU THEO NGÀY ===
            if (exportType === 'full' || exportType === 'daily') {
                const totalDaily = dailyRevenue.reduce((sum, day) => sum + day.tongTien, 0);
                
                const ws5Data = [
                    [cinemaName],
                    ['DOANH THU THEO NGÀY'],
                    [`Kỳ báo cáo: ${periodText}`],
                    [exportDate],
                    [],
                    ['Ngày', 'Doanh thu (VND)', 'Tỷ trọng (%)'],
                    ...dailyRevenue.map(day => [
                        day.date,
                        day.tongTien,
                        totalDaily > 0 ? ((day.tongTien / totalDaily) * 100).toFixed(2) : 0
                    ]),
                    [],
                    ['TỔNG CỘNG', totalDaily, '100.00']
                ];
                
                const ws5 = XLSX.utils.aoa_to_sheet(ws5Data);
                
                ws5['!merges'] = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
                    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
                    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
                    { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } }
                ];
                
                // Style giống các sheet trên
                ws5.A1.s = {
                    font: { bold: true, sz: 18, color: { rgb: "667eea" } },
                    alignment: { horizontal: "center", vertical: "center" },
                    fill: { fgColor: { rgb: "E8EAF6" } }
                };
                
                ws5.A2.s = {
                    font: { bold: true, sz: 14, color: { rgb: "764ba2" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
                
                ws5.A3.s = {
                    font: { sz: 11, italic: true, color: { rgb: "666666" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
                
                ws5.A4.s = {
                    font: { sz: 10, italic: true, color: { rgb: "999999" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
                
                // Style header và data
                for (let C = 0; C <= 2; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: 5, c: C });
                    if (!ws5[cellAddress]) ws5[cellAddress] = { t: 's', v: '' };
                    ws5[cellAddress].s = {
                        fill: { fgColor: { rgb: "667eea" } },
                        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } },
                            right: { style: "thin", color: { rgb: "000000" } }
                        }
                    };
                }
                
                for (let R = 6; R < 6 + dailyRevenue.length; R++) {
                    for (let C = 0; C <= 2; C++) {
                        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                        if (!ws5[cellAddress]) continue;
                        
                        ws5[cellAddress].s = {
                            alignment: { horizontal: "center", vertical: "center" },
                            border: {
                                top: { style: "thin", color: { rgb: "CCCCCC" } },
                                bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                                left: { style: "thin", color: { rgb: "CCCCCC" } },
                                right: { style: "thin", color: { rgb: "CCCCCC" } }
                            }
                        };
                        
                        if (R % 2 === 0) {
                            ws5[cellAddress].s.fill = { fgColor: { rgb: "F5F5F5" } };
                            }
                        
                        if (C >= 1) {
                            ws5[cellAddress].t = 'n';
                            ws5[cellAddress].z = '#,##0';
                        }
                    }
                }
                
                // Style tổng cộng
                const summaryRow = 6 + dailyRevenue.length + 1;
                for (let C = 0; C <= 2; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: summaryRow, c: C });
                    if (!ws5[cellAddress]) continue;
                    ws5[cellAddress].s = {
                        font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
                        fill: { fgColor: { rgb: "28a745" } },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: {
                            top: { style: "medium", color: { rgb: "000000" } },
                            bottom: { style: "medium", color: { rgb: "000000" } },
                            left: { style: "medium", color: { rgb: "000000" } },
                            right: { style: "medium", color: { rgb: "000000" } }
                        }
                    };
                    if (C >= 1) {
                        ws5[cellAddress].t = 'n';
                        ws5[cellAddress].z = '#,##0';
                    }
                }
                
                ws5['!cols'] = [
                    { wch: 15 },
                    { wch: 20 },
                    { wch: 15 }
                ];
                
                XLSX.utils.book_append_sheet(wb, ws5, 'Theo ngày');
            }
            
            // Xuất file Excel
            const fileName = `BaoCaoDoanhThu_${periodText.replace(/ /g, '_')}_${new Date().getTime()}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            showSuccess('Xuất báo cáo Excel thành công!');
            
        } catch (error) {
            console.error('Error exporting:', error);
            showError('Lỗi khi xuất Excel');
        }
    };
    function setToday() {
        const today = new Date();

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const firstday = today.toLocaleDateString('en-CA');
        const lastday = yesterday.toLocaleDateString('en-CA');

        setStartDate(firstday);
        setEndDate(firstday);

        setPrevStartDate(lastday);
        setPrevEndDate(lastday);
    };
    

    function setThisWeek() {
        const curr = new Date();

        const first = curr.getDate() - curr.getDay() + 1;
        const last = first + 6;

        const firstDate = new Date(curr);
        firstDate.setDate(first);

        const lastDate = new Date(curr);
        lastDate.setDate(last);

        const firstday = firstDate.toLocaleDateString('en-CA');
        const lastday = lastDate.toLocaleDateString('en-CA');

        setStartDate(firstday);
        setEndDate(lastday);

        // Tính tuần trước (dựa trên clone, không dùng curr nữa)
        const prevFirstDate = new Date(firstDate);
        prevFirstDate.setDate(firstDate.getDate() - 7);
        const prevLastDate = new Date(lastDate);
        prevLastDate.setDate(lastDate.getDate() - 7);

        const prevFirst = prevFirstDate.toLocaleDateString('en-CA');
        const prevLast = prevLastDate.toLocaleDateString('en-CA');

        setPrevStartDate(prevFirst);
        setPrevEndDate(prevLast);
    };

    function setThisMonth() {
        const curr = new Date();
        const first = new Date(curr.getFullYear(), curr.getMonth(), 1).toLocaleDateString('en-CA');
        const last = new Date(curr.getFullYear(), curr.getMonth() + 1, 0).toLocaleDateString('en-CA');
        setStartDate(first);
        setEndDate(last);

        const prevFirst = new Date(curr.getFullYear(), curr.getMonth() - 1, 1).toLocaleDateString('en-CA');
        const prevLast = new Date(curr.getFullYear(), curr.getMonth(), 0).toLocaleDateString('en-CA');
        setPrevStartDate(prevFirst);
        setPrevEndDate(prevLast);
    };

    function setThisYear() {
        const curr = new Date();
        const first = new Date(curr.getFullYear(), 0, 1).toLocaleDateString('en-CA');
        const last = new Date(curr.getFullYear(), 11, 31).toLocaleDateString('en-CA');
        setStartDate(first);
        setEndDate(last);
        const prevFirst = new Date(curr.getFullYear() - 1, 0, 1).toLocaleDateString('en-CA');
        const prevLast = new Date(curr.getFullYear() - 1, 11, 31).toLocaleDateString('en-CA');
        setPrevStartDate(prevFirst);
        setPrevEndDate(prevLast);
    };

    // Hàm lấy danh sách 7 ngày, tuần hoặc tháng gần nhất
    function getTimeRange(type = "today") {
        const today = new Date();
        let range = [];

        if (type === "today") {
            // Lấy 7 ngày gần nhất
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                range.push(d.toLocaleDateString('en-CA')); // yyyy-mm-dd
            }
        }

        else if (type === "week") {
            // Lấy tất cả ngày trong tuần hiện tại (từ Thứ Hai đến Chủ Nhật)
            const first = today.getDate() - today.getDay() + 1; // Thứ Hai
            for (let i = 0; i < 7; i++) {
                const d = new Date(today);
                d.setDate(first + i);
                range.push(d.toLocaleDateString('en-CA'));
            }
        }

        if (type === "month") {
            // Lấy tất cả ngày trong tháng hiện tại
            const year = today.getFullYear();
            const month = today.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            for (let i = 1; i <= daysInMonth; i++) {
                const d = new Date(year, month, i);
                range.push(d.toLocaleDateString('en-CA'));
            }
        }

        if (type === "year") {
            // Lấy 12 tháng trong năm hiện tại
            const year = today.getFullYear();
            for (let i = 0; i < 12; i++) {
                range.push(`${year}-${String(i + 1).padStart(2, "0")}`);
            }
        }

        else if (type === "custom") {
            const start = new Date(startDate);
            const end = new Date(endDate);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                range.push(d.toLocaleDateString('en-CA'));
            }
        }

        return range;
    }


    function setCustomDateRange(start, end) {
        setStartDate(start);
        setEndDate(end);

        const startDt = new Date(start);
        const endDt = new Date(end);
        const diffTime = Math.abs(endDt - startDt);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const prevEndDt = new Date(startDt);
        prevEndDt.setDate(startDt.getDate() - 1);
        const prevStartDt = new Date(prevEndDt);
        prevStartDt.setDate(prevEndDt.getDate() - diffDays + 1);
        setPrevStartDate(prevStartDt.toLocaleDateString('en-CA'));
        setPrevEndDate(prevEndDt.toLocaleDateString('en-CA'));
    };

    useEffect(() => {
        if (dateRange === 'today') {
            setToday();
        }
        else if (dateRange === 'week') {
            setThisWeek();
        }
        else if (dateRange === 'month') {
           setThisMonth();
        }
        else if (dateRange === 'year') {
           setThisYear();
        }
        else {
            setCustomDateRange(startDate, endDate)
        }
    }, [dateRange]);


    useEffect(() => {
        const fetchData = async () => {
            console.log(startDate, endDate);
            await fetchInvoice(startDate, endDate, prevStartDate, prevEndDate);
            await fetchPhim(startDate, endDate, prevStartDate, prevEndDate);
        };
        fetchData();
    }, [startDate, endDate]);


    useEffect(() => {
        if (invoice.length > 0) {
            const roomGroup = invoice.reduce((acc, curr) => {
                const room = curr.tenPhong;
                if (!acc[room]) acc[room] = { name: room, revenue: 0, tickets: 0 };
                acc[room].revenue += curr.tongTien;
                acc[room].tickets += curr.soLuongVe;
                return acc;
            }, {});

            const totalRevenue = Object.values(roomGroup).reduce((sum, r) => sum + r.revenue, 0);
            const roomRevenueResult = Object.values(roomGroup).map(r => ({
                ...r,
                percentage: ((r.revenue / totalRevenue) * 100).toFixed(1),
            }));

            setRoomRevenue(roomRevenueResult);
            setDailyRevenue(calcDailyRevenue(dateRange))
        }
        if (invoice.length === 0) setRoomRevenue([]);
        setDailyRevenue(calcDailyRevenue(dateRange))

        setTotalRevenue(invoice.reduce((sum, day) => sum + day.tongTien, 0) || 0)
        setTotalTickets(invoice.reduce((sum, day) => sum + day.soLuongVe, 0) || 0)

        console.log(totalRevenue, totalTickets);
        setTotalSchedule(new Set(
            invoice.map(item => item.thoiGianBatDau)
        ).size || 0)

        setTotalPrevRevenue(prevRevenue.reduce((sum, day) => sum + day.tongTien, 0))
        setTotalPrevTicket(prevRevenue.reduce((sum, day) => sum + day.soLuongVe,0))
        setTotalPrevSchedule(new Set(
            prevRevenue.map(item => item.thoiGianBatDau)
        ).size || 0)

    },[invoice])

    useEffect(() => {
        setAvgTicketPrice((totalRevenue / totalTickets) || 0)
        setAvgPrevTicketPrice((totalPrevRevenue / totalPrevTicket) || 0)
    }, [totalRevenue, totalTickets]);


    const fetchInvoice = async (ngayBD, ngayKT, ngayTruocBD, ngayTruocKT) => {
        const result = await invoiceService.getAllInvoice(ngayBD, ngayKT);
        if (result.success) {
            setInvoice(result.data);
            console.log(result.data);
        }
        else showError(result.data)

        const resultPrev = await invoiceService.getAllInvoice(ngayTruocBD, ngayTruocKT);
        if (resultPrev.success) {
            setPrevRevenue(resultPrev.data);
        }
        else showError(resultPrev.data)
    }

    const fetchPhim = async(NgayBD, NgayKT, NgayTruocBD, NgayTruocKT) => {
        const result = await invoiceService.getAllPhimInvoice(NgayBD, NgayKT);
        console.log(result.data);
        if (result.success) {
            setMovie(result.data.slice(0,5));
        }
        else showError(result.data)

        const resultPrev = await invoiceService.getAllPhimInvoice(NgayTruocBD, NgayTruocKT);
        if (resultPrev.success) {
            setPrevMovie(result.data);
        }
        else showError(resultPrev.data)
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const trend = (start, end) => {
        if (start === 0 && end === 0) return 0
        if (start === 0) return 100
        return (((end - start) / (start)) * 100)
    }

    const movieTrend = movies.map(item => {
        const prev = prevMovie.find(p => p.tenPhim === item.tenPhim);
        const prevRevenue = prev ? prev.tongDoanhThu : 0;
        const trend = prevRevenue ? ((item.tongDoanhThu - prevRevenue) / prevRevenue) * 100 : 0;
        return {
            ...item,
            xuHuong: (trend < 0) ? 'up' : (trend === 0) ? 'flat' : 'down',
            thayDoi: Math.abs(trend.toFixed(2))
        };
    });



    const calcDailyRevenue = (type = 'today') => {
        const range = getTimeRange(type);
        return range.map(date => {
            const invoicesInDate = invoice.filter(i => i.ngayLap.startsWith(date));
            const total = invoicesInDate.reduce((sum, i) => sum + i.tongTien, 0);
            const [year, month, day] = date.split('-');
            let formattedDate = `${day}-${month}`;
            if (day === undefined) {
                formattedDate = `${month}-${year}`;
            }
            return {date:formattedDate, tongTien: total};
        });
    }

    const timeSlots = [
        { start: 8, end: 10, label: "08-10h" },
        { start: 10, end: 12, label: "10-12h" },
        { start: 12, end: 14, label: "12-14h" },
        { start: 14, end: 16, label: "14-16h" },
        { start: 16, end: 18, label: "16-18h" },
        { start: 18, end: 20, label: "18-20h" },
        { start: 20, end: 22, label: "20-22h" },
        { start: 22, end: 24, label: "22-24h" },
    ];


    const timeSlotRevenue = timeSlots.map(slot => {
        const total = invoice.reduce((sum, inv) => {
            const hour = new Date(inv.thoiGianBatDau).getHours();
            if (hour >= slot.start && hour < slot.end) {
                return sum + inv.tongTien;
            }
            return sum;
        }, 0);
        return { time: slot.label, doanhThu: total };
    });

    return (
        <>
            <link
                href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
                rel="stylesheet"
            />
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

            <div className="bg-light min-vh-100 py-4">
                <div className="container-fluid" style={{ maxWidth: '1800px' }}>
                    {/* Header */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="bg-success text-white p-3 rounded">
                                        <TrendingUp size={32} />
                                    </div>
                                    <div>
                                        <h1 className="mb-0 h3">Thống Kê Doanh Thu</h1>
                                        <p className="text-muted mb-0">Báo cáo tổng quan và phân tích</p>
                                    </div>
                                </div>
                                <div className="d-flex gap-2 align-items-center">
                                    <select
                                        className="form-select"
                                        style={{
                                            height: 40,
                                            width: 200,
                                        }}
                                        value={dateRange}
                                        onChange={(e) => setDateRange(e.target.value)}
                                    >
                                        <option value="today">Hôm nay</option>
                                        <option value="week">Tuần này</option>
                                        <option value="month">Tháng này</option>
                                        <option value="year">Năm nay</option>
                                        <option value="custom">Tùy chọn</option>
                                    </select>
                                    {(dateRange === 'custom') ? (
                                    <div>
                                        <label htmlFor="startDate">Ngày bắt đầu</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            id="startDate"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            placeholder="Ngày bắt đầu"
                                        />
                                    </div>) : (<></>)}
                                    {(dateRange === 'custom') ? (
                                    <div>
                                        <label htmlFor="endDate">Ngày kết thúc</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            id="endDate"
                                            value={endDate}
                                            onChange={(e) => {setEndDate(e.target.value)}}
                                            placeholder="Ngày kết thúc"
                                        />
                                    </div>) : (<></>)}
                                    <div >
                                        <select
                                            className="form-select"
                                            style={{ height: 40, width: 250 }}
                                            value={exportType}
                                            onChange={(e) => setExportType(e.target.value)}
                                        >
                                            <option value="full">📊 Báo cáo đầy đủ</option>
                                            <option value="summary">📈 Báo cáo Tổng quan</option>
                                            <option value="movies">🎬 Báo cáo Top phim</option>
                                            <option value="rooms">🏢 Báo cáo Theo phòng</option>
                                            <option value="timeslot">⏰ Báo cáo Theo giờ</option>
                                            <option value="daily">📅 Báo cáo Theo ngày</option>
                                        </select>
                                    </div>
                                    
                                    <button 
                                        className="btn btn-success"
                                        style={{
                                            height: 40,
                                        }}
                                        onClick={exportToExcel}
                                    >
                                        <Download size={20} className="me-2" /> Xuất Excel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="row g-3 mb-4">
                        <div className="col-lg-3 col-md-6">
                            <div className="card shadow-sm border-0 h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div>
                                            <p className="text-muted mb-1 small">Tổng Doanh Thu</p>
                                            <h3 className="mb-0 text-success fw-bold">{formatCurrency(totalRevenue)}</h3>
                                        </div>
                                        <div className="bg-success bg-opacity-10 p-3 rounded">
                                            <DollarSign size={32} className="text-success" />
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-1 mt-2">
                                        {trend(totalPrevRevenue,totalRevenue) > 0 ? (
                                            <span className="badge bg-success bg-opacity-25 text-success">
                                                    <ChevronUp size={14} style={{ verticalAlign: 'middle' }} />
                                                    {trend(totalPrevRevenue, totalRevenue).toFixed(1)}%
                                            </span>
                                        ): (
                                            <span className="badge bg-danger bg-opacity-25 text-danger">
                                                    <ChevronDown size={14} style={{ verticalAlign: 'middle' }} />
                                                {Math.abs(trend(totalPrevRevenue, totalRevenue).toFixed(1))}%
                                            </span>
                                            )}
                                        {(dateRange === 'today') ? (
                                            <small className="text-muted">so với hôm qua</small>
                                        ) : (dateRange === 'week') ? (
                                            <small className="text-muted">so với tuần trước</small>
                                        ) : (
                                            dateRange === 'month') ? (
                                            <small className="text-muted">so với tháng trước</small>
                                        ) : ( dateRange === 'year') ? (
                                                <small className="text-muted">so với năm trước</small> )
                                            :  (<small className="text-muted">so với kỳ trước</small> )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6">
                            <div className="card shadow-sm border-0 h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div>
                                            <p className="text-muted mb-1 small">Vé Đã Bán</p>
                                            <h3 className="mb-0 text-primary fw-bold">{formatNumber(totalTickets)}</h3>
                                        </div>
                                        <div className="bg-primary bg-opacity-10 p-3 rounded">
                                            <Users size={32} className="text-primary" />
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-1 mt-2">
                                        {trend(totalPrevTicket,totalTickets) > 0 ? (
                                            <span className="badge bg-success bg-opacity-25 text-success">
                                                    <ChevronUp size={14} style={{ verticalAlign: 'middle' }} />
                                                {trend(totalPrevTicket, totalTickets).toFixed(1)}%
                                            </span>
                                        ): (
                                            <span className="badge bg-danger bg-opacity-25 text-danger">
                                                    <ChevronDown size={14} style={{ verticalAlign: 'middle' }} />
                                                {Math.abs(trend(totalPrevTicket, totalTickets).toFixed(1))}%
                                            </span>
                                        )}
                                        {(dateRange === 'today') ? (
                                            <small className="text-muted">so với hôm qua</small>
                                        ) : (dateRange === 'week') ? (
                                            <small className="text-muted">so với tuần trước</small>
                                        ) : (
                                            dateRange === 'month') ? (
                                            <small className="text-muted">so với tháng trước</small>
                                        ) : ( dateRange === 'year') ? (
                                            <small className="text-muted">so với năm trước</small> )
                                         :  (<small className="text-muted">so với kỳ trước</small> )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6">
                            <div className="card shadow-sm border-0 h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div>
                                            <p className="text-muted mb-1 small">Giá Vé Trung Bình</p>
                                            <h3 className="mb-0 text-info fw-bold">{formatCurrency(avgTicketPrice)}</h3>
                                        </div>
                                        <div className="bg-info bg-opacity-10 p-3 rounded">
                                            <DollarSign size={32} className="text-info" />
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-1 mt-2">
                                        {trend(avgPrevTicketPrice,avgTicketPrice) > 0 ? (
                                            <span className="badge bg-success bg-opacity-25 text-success">
                                                    <ChevronUp size={14} style={{ verticalAlign: 'middle' }} />
                                                {trend(avgPrevTicketPrice, avgTicketPrice).toFixed(1)}%
                                            </span>
                                        ): (
                                            <span className="badge bg-danger bg-opacity-25 text-danger">
                                                    <ChevronDown size={14} style={{ verticalAlign: 'middle' }} />
                                                {Math.abs(trend(avgPrevTicketPrice, avgTicketPrice).toFixed(1))}%
                                            </span>
                                        )}
                                        {(dateRange === 'today') ? (
                                            <small className="text-muted">so với hôm qua</small>
                                        ) : (dateRange === 'week') ? (
                                            <small className="text-muted">so với tuần trước</small>
                                        ) : (
                                            dateRange === 'month') ? (
                                            <small className="text-muted">so với tháng trước</small>
                                        ) : ( dateRange === 'year') ? (
                                                <small className="text-muted">so với năm trước</small> )
                                            :  (<small className="text-muted">so với kỳ trước</small> )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-md-6">
                            <div className="card shadow-sm border-0 h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div>
                                            <p className="text-muted mb-1 small">Suất Chiếu</p>
                                            <h3 className="mb-0 text-warning fw-bold">{totalSchedule}</h3>
                                        </div>
                                        <div className="bg-warning bg-opacity-10 p-3 rounded">
                                            <Film size={32} className="text-warning" />
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-1 mt-2">
                                        {trend(totalPrevSchedule,totalSchedule) > 0 ? (
                                            <span className="badge bg-success bg-opacity-25 text-success">
                                                    <ChevronUp size={14} style={{ verticalAlign: 'middle' }} />
                                                {trend(totalPrevSchedule, totalSchedule).toFixed(1)}%
                                            </span>
                                        ): (
                                            <span className="badge bg-danger bg-opacity-25 text-danger">
                                                    <ChevronDown size={14} style={{ verticalAlign: 'middle' }} />
                                                {Math.abs(trend(totalPrevSchedule, totalSchedule).toFixed(1))}%
                                            </span>
                                        )}             {(dateRange === 'today') ? (
                                        <small className="text-muted">so với hôm qua</small>
                                    ) : (dateRange === 'week') ? (
                                        <small className="text-muted">so với tuần trước</small>
                                    ) : (
                                        dateRange === 'month') ? (
                                        <small className="text-muted">so với tháng trước</small>
                                    ) : ( dateRange === 'year') ? (
                                            <small className="text-muted">so với năm trước</small> )
                                        :  (<small className="text-muted">so với kỳ trước</small> )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-4 mb-4">
                        {/* Biểu đồ doanh thu theo ngày */}
                        <div className="col-lg-8">
                            <div className="card shadow-sm h-100">
                                <div className="card-header bg-white">
                                    <h5 className="mb-0">Doanh Thu Theo Ngày</h5>
                                </div>
                                <div className="card-body">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={dailyRevenue}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip
                                                formatter={(value) => formatCurrency(value)}
                                                labelStyle={{ color: '#000' }}
                                            />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="tongTien"
                                                stroke="#0d6efd"
                                                strokeWidth={3}
                                                name="Doanh thu"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Doanh thu theo phòng */}
                        <div className="col-lg-4">
                            <div className="card shadow-sm h-100">
                                <div className="card-header bg-white">
                                    <h5 className="mb-0">Doanh Thu Theo Phòng</h5>
                                </div>
                                <div className="card-body">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={roomRevenue}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="revenue"
                                            >
                                                {roomRevenue.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-4 mb-4">
                        {/* Top phim */}
                        <div className="col-lg-7">
                            <div className="card shadow-sm">
                                <div className="card-header bg-white d-flex align-items-center justify-content-between">
                                    <h5 className="mb-0">Top Phim Doanh Thu Cao</h5>

                                             {(dateRange === 'today') ? (
                                                 <span className="badge bg-primary">hôm nay</span>
                                             ) : (dateRange === 'week') ? (
                                                 <span className="badge bg-primary">tuần hiện tại</span>
                                             ) : (
                                                 dateRange === 'month') ? (
                                                 <span className="badge bg-primary">tháng hiện tại</span>
                                             ) : ( dateRange === 'year') ? (
                                                 <span className="badge bg-primary">năm nay</span>
                                             ) : (
                                                 <span className="badge bg-primary">từ {startDate} đến {endDate}</span>
                                             )}


                                </div>
                                <div className="card-body p-0">
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead className="table-light">
                                            <tr>
                                                <th className="ps-3">#</th>
                                                <th>Tên Phim</th>
                                                <th className="text-end">Doanh Thu</th>
                                                <th className="text-center">Vé Bán</th>
                                                <th className="text-center">Suất Chiếu</th>
                                                <th className="text-center">Xu Hướng</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {movieTrend.map((movie, index) => (
                                                <tr key={movie.tenPhim}>
                                                    <td className="ps-3 fw-bold">{index + 1}</td>
                                                    <td>
                                                        <div className="fw-semibold">{movie.tenPhim}</div>
                                                    </td>
                                                    <td className="text-end">
                              <span className="fw-bold text-success">
                                {formatCurrency(movie.tongDoanhThu)}
                              </span>
                                                    </td>
                                                    <td className="text-center">{formatNumber(movie.soLuongVeDaBan)}</td>
                                                    <td className="text-center">
                                                        <span className="badge bg-info">{movie.soLuongSuatChieu}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        {movie.xuHuong === 'up' ? (
                                                            <span className="badge bg-success bg-opacity-25 text-success">
                                  <ChevronUp size={14} style={{ verticalAlign: 'middle' }} />
                                                                {movie.thayDoi}%
                                </span>
                                                        ) : (movie.xuHuong === 'down' ? (
                                                            <span className="badge bg-danger bg-opacity-25 text-danger">
                                  <ChevronDown size={14} style={{ verticalAlign: 'middle' }} />
                                                                {Math.abs(movie.thayDoi)}%
                                </span> ) : ( <span className="badge bg-primary bg-opacity-25 text-primary">
                                                                mới
                                </span> )
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Doanh thu theo khung giờ */}
                        <div className="col-lg-5">
                            <div className="card shadow-sm">
                                <div className="card-header bg-white">
                                    <h5 className="mb-0">Doanh Thu Theo Khung Giờ</h5>
                                </div>
                                <div className="card-body">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={timeSlotRevenue}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="time" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                            <Bar dataKey="doanhThu" fill="#198754" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chi tiết theo phòng */}
                    <div className="row g-4">
                        <div className="col-12">
                            <div className="card shadow-sm">
                                <div className="card-header bg-white">
                                    <h5 className="mb-0">Chi Tiết Doanh Thu Theo Phòng</h5>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        {roomRevenue.map((room, index) => (
                                            <div key={room.name} className="col-md-4">
                                                <div className="card border-start border-4" style={{ borderColor: COLORS[index % COLORS.length] }}>
                                                    <div className="card-body">
                                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                                            <h5 className="mb-0">{room.name}</h5>
                                                            <span className="badge" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                                {room.percentage}%
                              </span>
                                                        </div>
                                                        <div className="mb-2">
                                                            <small className="text-muted d-block">Doanh thu</small>
                                                            <h4 className="mb-0 text-success">{formatCurrency(room.revenue)}</h4>
                                                        </div>
                                                        <div className="row g-2">
                                                            <div className="col-6">
                                                                <small className="text-muted d-block">Vé bán</small>
                                                                <strong>{formatNumber(room.tickets)}</strong>
                                                            </div>
                                                            <div className="col-6">
                                                                <small className="text-muted d-block">TB/vé</small>
                                                                <strong>{formatCurrency(room.revenue / room.tickets)}</strong>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default RevenueManager;