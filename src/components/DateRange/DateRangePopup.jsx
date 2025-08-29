// src/components/DateRange/DateRangePopup.jsx

import React, { useLayoutEffect, useEffect, useRef, useState, useMemo} from 'react';
import ReactDOM from 'react-dom';
import styles from './DateRangePopup.module.css';
import { ChevronLeft, ChevronRight, Clock, ChevronDown } from 'lucide-react';
import dayjs from 'dayjs';

// 단일 월 달력을 렌더링하는 내부 컴포넌트
const CalendarMonth = ({ monthDate, startDate, endDate }) => {
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const startOfMonth = monthDate.startOf('month');
  const daysInMonth = monthDate.daysInMonth();
  const startDayOfWeek = startOfMonth.day();

  const days = [];
  // 달력의 시작 부분에 이전 달의 날짜를 null로 채웁니다.
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  // 현재 달의 날짜를 채웁니다.
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(startOfMonth.date(i));
  }

  // props로 받은 날짜를 기준으로 각종 상태(범위 내, 시작, 끝)를 동적으로 확인하는 함수들
  const isDayInRange = (day) =>
    day && day.isAfter(startDate.subtract(1, 'day')) && day.isBefore(endDate);
  const isRangeStart = (day) => day && day.isSame(startDate, 'day');
  const isRangeEnd = (day) => day && day.isSame(endDate, 'day');

  return (
    <div className={styles.monthContainer}>
      <h3 className={styles.monthTitle}>{monthDate.format('MMMM YYYY')}</h3>
      <div className={styles.calendarGrid}>
        {daysOfWeek.map((day) => (
          <div key={`${monthDate.format('YYYY-MM')}-${day}`} className={styles.dayHeader}>
            {day}
          </div>
        ))}
        {days.map((day, index) => (
          <button
            key={index}
            className={`
              ${styles.dayCell}
              ${isDayInRange(day) ? styles.selectedRange : ''}
              ${isRangeStart(day) ? styles.rangeStart : ''}
              ${isRangeEnd(day) ? styles.rangeEnd : ''}
            `}
            disabled={!day}
          >
            {day ? day.date() : ''}
          </button>
        ))}
      </div>
    </div>
  );
};

// 메인 팝업 컴포넌트
const DateRangePopup = ({ startDate, endDate, setStartDate, setEndDate, onClose, triggerRef }) => {
  const popupRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [opacity, setOpacity] = useState(0);

  useLayoutEffect(() => {
    if (!triggerRef.current || !popupRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popupRect = popupRef.current.getBoundingClientRect();
    const margin = 8;
    
    const topPositionBelow = triggerRect.bottom + margin;

    if (topPositionBelow + popupRect.height > window.innerHeight) {
      const topPositionAbove = triggerRect.top - popupRect.height - margin;
      setPosition({
        top: topPositionAbove,
        left: triggerRect.left,
      });
    } else {
      setPosition({
        top: topPositionBelow,
        left: triggerRect.left,
      });
    }
    
    setOpacity(1);

  }, [triggerRef]);

  const [startTime, setStartTime] = useState({ hh: '', mm: '', ss: '', ampm: 'AM' });
  const [endTime, setEndTime] = useState({ hh: '', mm: '', ss: '', ampm: 'AM' });

  useEffect(() => {
    const now = dayjs();
    const currentTime = {
        hh: now.format('hh'),
        mm: now.format('mm'),
        ss: now.format('ss'),
        ampm: now.format('A'),
    };
    setStartTime(currentTime);
    setEndTime(currentTime);

    setStartDate(dayjs(startDate).hour(now.hour()).minute(now.minute()).second(now.second()).toDate());
    setEndDate(dayjs(endDate).hour(now.hour()).minute(now.minute()).second(now.second()).toDate());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTimeChange = (type, part, value) => {
    const sanitizedValue = value.replace(/[^0-9]/g, '');
    const setter = type === 'start' ? setStartTime : setEndTime;
    setter(prev => ({ ...prev, [part]: sanitizedValue }));
  };

  const handleAmPmChange = (type, value) => {
      const setter = type === 'start' ? setStartTime : setEndTime;
      setter(prev => ({...prev, ampm: value}));
  };

  const handleTimeBlur = (type, part, value) => {
    const numericValue = parseInt(value, 10);
    let finalValue = isNaN(numericValue) ? '00' : value;

    if (numericValue < 10 && value.length < 2) {
      finalValue = `0${numericValue}`;
    }
    if (value === '') {
      finalValue = '00';
    }

    const setter = type === 'start' ? setStartTime : setEndTime;
    setter(prev => ({ ...prev, [part]: finalValue }));
  };

  useEffect(() => {
    const updateDate = (originalDate, time) => {
      let hour = parseInt(time.hh, 10) || 0;
      if (time.ampm === 'PM' && hour < 12) hour += 12;
      if (time.ampm === 'AM' && hour === 12) hour = 0;
      return dayjs(originalDate)
        .hour(hour)
        .minute(parseInt(time.mm, 10) || 0)
        .second(parseInt(time.ss, 10) || 0)
        .toDate();
    };
    setStartDate(updateDate(startDate, startTime));
    setEndDate(updateDate(endDate, endTime));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, endTime]);

  const timezone = useMemo(() => {
    const offset = dayjs().format('Z');
    return `GMT${offset}`;
  }, []);

  const start = dayjs(startDate);
  const end = dayjs(endDate);
  
  const firstMonth = end.subtract(1, 'month');
  const secondMonth = end;

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={popupRef}
        className={styles.popupContainer}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          opacity: opacity,
          transition: 'opacity 0.1s ease-in-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.calendarsWrapper}>
          <button className={`${styles.navButton} ${styles.navLeft}`}><ChevronLeft size={18} /></button>
          <CalendarMonth monthDate={firstMonth} startDate={start} endDate={end} />
          <CalendarMonth monthDate={secondMonth} startDate={start} endDate={end} />
          <button className={`${styles.navButton} ${styles.navRight}`}><ChevronRight size={18} /></button>
        </div>
        <div className={styles.timeControls}>
            <div className={styles.timeGroup}>
              <label>Start time</label>
              <div className={styles.timeInput}>
                <Clock size={16} className={styles.timeIcon} />
                <input type="text" value={startTime.hh} onChange={(e) => handleTimeChange('start', 'hh', e.target.value)} onBlur={(e) => handleTimeBlur('start', 'hh', e.target.value)} maxLength={2} />
                <span>:</span>
                <input type="text" value={startTime.mm} onChange={(e) => handleTimeChange('start', 'mm', e.target.value)} onBlur={(e) => handleTimeBlur('start', 'mm', e.target.value)} maxLength={2} />
                <span>:</span>
                <input type="text" value={startTime.ss} onChange={(e) => handleTimeChange('start', 'ss', e.target.value)} onBlur={(e) => handleTimeBlur('start', 'ss', e.target.value)} maxLength={2} />
                <div className={styles.selectWrapper}>
                  <select value={startTime.ampm} onChange={(e) => handleAmPmChange('start', e.target.value)}>
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                  <ChevronDown size={14} className={styles.selectArrow} />
                </div>
                <span className={styles.timezone}>{timezone}</span>
              </div>
            </div>
            <div className={styles.timeGroup}>
              <label>End time</label>
              <div className={styles.timeInput}>
                <Clock size={16} className={styles.timeIcon} />
                <input type="text" value={endTime.hh} onChange={(e) => handleTimeChange('end', 'hh', e.target.value)} onBlur={(e) => handleTimeBlur('end', 'hh', e.target.value)} maxLength={2} />
                <span>:</span>
                <input type="text" value={endTime.mm} onChange={(e) => handleTimeChange('end', 'mm', e.target.value)} onBlur={(e) => handleTimeBlur('end', 'mm', e.target.value)} maxLength={2} />
                <span>:</span>
                <input type="text" value={endTime.ss} onChange={(e) => handleTimeChange('end', 'ss', e.target.value)} onBlur={(e) => handleTimeBlur('end', 'ss', e.target.value)} maxLength={2} />
                <div className={styles.selectWrapper}>
                  <select value={endTime.ampm} onChange={(e) => handleAmPmChange('end', e.target.value)}>
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                  <ChevronDown size={14} className={styles.selectArrow} />
                </div>
                <span className={styles.timezone}>{timezone}</span>
              </div>
            </div>
          </div>
      </div>
    </div>,
    document.body
  );
};

export default DateRangePopup;
