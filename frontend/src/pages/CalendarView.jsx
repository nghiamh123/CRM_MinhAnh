import React, { useEffect, useRef, useState } from 'react';
import { rentalService } from '../services/api';

const CalendarView = () => {
  const calendarRef = useRef(null);
  const calendarInstanceRef = useRef(null);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  // Helper to get a stable color from user string (id or name)
  const getColorForUser = (userStr) => {
    if (!userStr) return '#3b82f6';
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
      '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', 
      '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#f43f5e'
    ];
    let hash = 0;
    for (let i = 0; i < userStr.length; i++) {
        hash = userStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const res = await rentalService.getAll();
        setRentals(res.data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu đơn thuê: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRentals();
  }, []);

  useEffect(() => {
    // Only initialize if FullCalendar CDN is loaded, the DOM ref is ready, and data is loaded
    if (window.FullCalendar && calendarRef.current && !loading) {
      const events = rentals.map(rental => {
        // Tên khách hàng
        const customerName = rental.customerId?.name || 'Khách lạ';
        // Tổng thiết bị
        const totalDevices = rental.devices?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        
        // FullCalendar yêu cầu mốc 'end' ở event allDay phải là ngày tiếp theo (exclusive)
        // Nên ta cần cộng thêm 1 ngày vào ngày trả (plannedReturnDate)
        let endDateStr = '';
        if (rental.plannedReturnDate) {
          const endDate = new Date(rental.plannedReturnDate);
          endDate.setDate(endDate.getDate() + 1);
          endDateStr = endDate.toISOString().split('T')[0];
        }

        // Tạo màu dựa trên user ID hoặc tên (mỗi người dùng 1 màu)
        const userId = rental.customerId?.id || rental.customerId?._id || rental.customerId || 'stranger';
        let bgColor = getColorForUser(userId.toString());
        
        // Nếu muốn giữ trạng thái mờ đi khi đã trả thì có thể chỉnh opacity hoặc overlay
        if (rental.status === 'returned') {
           // Giữ nguyên màu đặc trưng nhưng nếu cần bạn có thể xử lý làm nhạt màu đi tại đây
        }

        // Tạo danh sách thiết bị cho tooltip (hover)
        const deviceListStr = rental.devices?.map(d => {
          const name = d.device?.name || 'Thiết bị';
          return `${name} (x${d.quantity})`;
        }).join(', ') || 'Không có thông tin thiết bị';

        return {
          id: rental.id,
          title: `${customerName} - ${totalDevices} máy`,
          start: rental.rentalDate ? new Date(rental.rentalDate).toISOString().split('T')[0] : '',
          end: endDateStr,
          allDay: true,
          backgroundColor: bgColor,
          borderColor: 'transparent',
          extendedProps: {
            description: `Thiết bị: ${deviceListStr}`
          }
        };
      });

      // Cleanup instance cũ nếu đã tồn tại
      if (calendarInstanceRef.current) {
        calendarInstanceRef.current.destroy();
      }

      const calendar = new window.FullCalendar.Calendar(calendarRef.current, {
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek'
        },
        height: 'auto',
        events: events,
        locale: 'vi', // Hiển thị tiếng Việt nếu CDN hỗ trợ tiếng Việt mặc định
        buttonText: {
          today: 'Hôm nay',
          month: 'Tháng',
          week: 'Tuần'
        },
        eventMouseEnter: function(info) {
          setTooltip({
            x: info.jsEvent.clientX + 10,
            y: info.jsEvent.clientY + 10,
            content: info.event.extendedProps.description,
            title: info.event.title
          });
        },
        eventMouseLeave: function() {
          setTooltip(null);
        }
      });

      calendar.render();
      calendarInstanceRef.current = calendar;

      return () => {
        calendar.destroy();
      };
    }
  }, [rentals, loading]);

  return (
    <div className="container">
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '2rem' }}>Lịch thuê thiết bị</h1>
      <div className="card">
        {loading ? (
          <p>Đang tải dữ liệu lịch...</p>
        ) : (
          <div ref={calendarRef}></div>
        )}
      </div>

      {/* Custom Immediate Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          top: tooltip.y,
          left: tooltip.x,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          maxWidth: '300px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ fontWeight: 700, marginBottom: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', pb: '4px' }}>
            {tooltip.title}
          </div>
          <div style={{ lineHeight: '1.4' }}>
            {tooltip.content}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
