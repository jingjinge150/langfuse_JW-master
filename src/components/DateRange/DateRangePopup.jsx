import React, {
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import ReactDOM from "react-dom";
import styles from "./DateRangePopup.module.css";
import { ChevronLeft, ChevronRight, Clock, ChevronDown } from "lucide-react";
import dayjs from "dayjs";

const sameDay = (a, b) => a && b && dayjs(a).isSame(b, "day");

const makeRange = (start, count, step = 1) =>
  Array.from({ length: count }, (_, i) => start + i * step);

/** 한 달 렌더 */
const CalendarMonth = ({
  monthDate,
  startDate,
  endDate,
  draftEnd,
  selectingStart,
  onDayClick,
  onDayHover,
}) => {
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const startOfMonth = monthDate.startOf("month");
  const daysInMonth = monthDate.daysInMonth();
  const firstDow = startOfMonth.day();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(startOfMonth.date(i));

  const inDraftRange = (day) => {
    if (!day) return false;
    const s = startDate;
    const e = selectingStart ? draftEnd : endDate;
    if (!s || !e) return false;
    const lo = dayjs(s) < dayjs(e) ? s : e;
    const hi = dayjs(s) < dayjs(e) ? e : s;
    return (
      day.isAfter(dayjs(lo).subtract(1, "day")) &&
      day.isBefore(dayjs(hi).add(1, "day"))
    );
  };

  return (
    <div className={styles.monthContainer}>
      <h3 className={styles.monthTitle}>{monthDate.format("MMMM YYYY")}</h3>
      <div className={styles.calendarGrid}>
        {daysOfWeek.map((d) => (
          <div
            key={`${monthDate.format("YYYY-MM")}-${d}`}
            className={styles.dayHeader}
          >
            {d}
          </div>
        ))}
        {cells.map((day, idx) => {
          const isStart = day && startDate && sameDay(day, startDate);
          const isEnd = day && endDate && sameDay(day, endDate);
          const isInRange = day && inDraftRange(day);
          return (
            <button
              key={idx}
              type="button"
              className={[
                styles.dayCell,
                !day ? styles.blank : "",
                isInRange ? styles.selectedRange : "",
                isStart ? styles.rangeStart : "",
                isEnd ? styles.rangeEnd : "",
              ].join(" ")}
              disabled={!day}
              onClick={() => day && onDayClick(day.toDate())}
              onMouseEnter={() => day && onDayHover(day.toDate())}
            >
              {day ? day.date() : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const DateRangePopup = ({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  onClose,
  triggerRef,
}) => {
  const popupRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [opacity, setOpacity] = useState(0);

  // 🔧 위치 계산 & z-index는 CSS에서
  useLayoutEffect(() => {
    if (!triggerRef?.current || !popupRef?.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popupRect = popupRef.current.getBoundingClientRect();
    const margin = 8;
    const below = triggerRect.bottom + margin;

    const top =
      below + popupRect.height > window.innerHeight
        ? triggerRect.top - popupRect.height - margin
        : below;

    setPosition({ top, left: triggerRect.left });
    setOpacity(1);
  }, [triggerRef]);

  // 🔥 열릴 때마다 기준월을 endDate로 재설정 (고정 현상 방지)
  const [baseMonth, setBaseMonth] = useState(dayjs(endDate).startOf("month"));
  useEffect(() => {
    setBaseMonth(dayjs(endDate).startOf("month"));
  }, [endDate]); // 팝업이 열릴 때 상위에서 전달되는 endDate 기준으로 다시 잡음

  const leftMonth = useMemo(() => baseMonth.subtract(1, "month"), [baseMonth]);
  const rightMonth = useMemo(() => baseMonth, [baseMonth]);

  // 시간 입력
  const [startTime, setStartTime] = useState({
    hh: "",
    mm: "",
    ss: "",
    ampm: "AM",
  });
  const [endTime, setEndTime] = useState({
    hh: "",
    mm: "",
    ss: "",
    ampm: "AM",
  });

  useEffect(() => {
    const apply = (d) => {
      const dj = dayjs(d);
      const h24 = dj.hour();
      const ampm = h24 >= 12 ? "PM" : "AM";
      const hh12 = h24 % 12 === 0 ? 12 : h24 % 12;
      return {
        hh: String(hh12).padStart(2, "0"),
        mm: dj.format("mm"),
        ss: dj.format("ss"),
        ampm,
      };
    };
    setStartTime(apply(startDate));
    setEndTime(apply(endDate));
    // 기준월도 최신화
    setBaseMonth(dayjs(endDate).startOf("month"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 팝업 최초 오픈 시 동기화

  const pad2 = (s) => (s === "" ? "00" : s.length === 1 ? `0${s}` : s);
  const handleTimeChange = (type, part, raw) => {
    const v = raw.replace(/[^0-9]/g, "").slice(0, 2);
    (type === "start" ? setStartTime : setEndTime)((prev) => ({
      ...prev,
      [part]: v,
    }));
  };
  const handleAmPmChange = (type, v) => {
    (type === "start" ? setStartTime : setEndTime)((prev) => ({
      ...prev,
      ampm: v,
    }));
  };

  useEffect(() => {
    const toDateWithTime = (orig, t) => {
      let hh = parseInt(pad2(t.hh), 10) || 0;
      if (t.ampm === "PM" && hh < 12) hh += 12;
      if (t.ampm === "AM" && hh === 12) hh = 0;
      return dayjs(orig)
        .hour(hh)
        .minute(parseInt(pad2(t.mm), 10) || 0)
        .second(parseInt(pad2(t.ss), 10) || 0)
        .toDate();
    };
    setStartDate(toDateWithTime(startDate, startTime));
    setEndDate(toDateWithTime(endDate, endTime));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, endTime]);

  // 범위 선택
  const [selectingStart, setSelectingStart] = useState(true);
  const [draftEnd, setDraftEnd] = useState(null);

  const onDayClick = (d) => {
    if (selectingStart) {
      setStartDate(dayjs(d).startOf("day").toDate());
      setSelectingStart(false);
      setDraftEnd(null);
      setBaseMonth(dayjs(d).startOf("month")); // 시작 찍으면 기준월도 이동
    } else {
      let s = dayjs(startDate).startOf("day");
      let e = dayjs(d).startOf("day");
      if (e.isBefore(s)) [s, e] = [e, s];
      setStartDate(s.toDate());
      setEndDate(e.endOf("day").toDate());
      setSelectingStart(true);
      setDraftEnd(null);
    }
  };
  const onDayHover = (d) => {
    if (!selectingStart) setDraftEnd(d);
  };

  // 연/월 셀렉트 (넓은 범위 이동)
  const years = useMemo(() => {
    const thisYear = dayjs().year();
    return makeRange(thisYear - 10, 21); // 현재 기준 ±10년
  }, []);
  const months = useMemo(() => makeRange(0, 12), []);

  const gotoYM = (y, m) =>
    setBaseMonth(dayjs().year(y).month(m).startOf("month"));

  const timezone = useMemo(() => `GMT${dayjs().format("Z")}`, []);

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={popupRef}
        className={styles.popupContainer}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          opacity,
          transition: "opacity .1s",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 연/월 셀렉터 */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <select
            value={baseMonth.year()}
            onChange={(e) =>
              gotoYM(parseInt(e.target.value, 10), baseMonth.month())
            }
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={baseMonth.month()}
            onChange={(e) =>
              gotoYM(baseMonth.year(), parseInt(e.target.value, 10))
            }
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m + 1}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.calendarsWrapper}>
          <button
            type="button"
            className={`${styles.navButton} ${styles.navLeft}`}
            onClick={() => setBaseMonth((m) => m.subtract(1, "month"))}
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>

          <CalendarMonth
            monthDate={baseMonth.subtract(1, "month")}
            startDate={dayjs(startDate)}
            endDate={dayjs(endDate)}
            draftEnd={draftEnd ? dayjs(draftEnd) : null}
            selectingStart={selectingStart}
            onDayClick={onDayClick}
            onDayHover={onDayHover}
          />
          <CalendarMonth
            monthDate={baseMonth}
            startDate={dayjs(startDate)}
            endDate={dayjs(endDate)}
            draftEnd={draftEnd ? dayjs(draftEnd) : null}
            selectingStart={selectingStart}
            onDayClick={onDayClick}
            onDayHover={onDayHover}
          />

          <button
            type="button"
            className={`${styles.navButton} ${styles.navRight}`}
            onClick={() => setBaseMonth((m) => m.add(1, "month"))}
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* 시간 입력 */}
        <div className={styles.timeControls}>
          <div className={styles.timeGroup}>
            <label>Start time</label>
            <div className={styles.timeInput}>
              <Clock size={16} className={styles.timeIcon} />
              <input
                type="text"
                value={startTime.hh}
                onChange={(e) =>
                  handleTimeChange("start", "hh", e.target.value)
                }
                maxLength={2}
              />
              <span>:</span>
              <input
                type="text"
                value={startTime.mm}
                onChange={(e) =>
                  handleTimeChange("start", "mm", e.target.value)
                }
                maxLength={2}
              />
              <span>:</span>
              <input
                type="text"
                value={startTime.ss}
                onChange={(e) =>
                  handleTimeChange("start", "ss", e.target.value)
                }
                maxLength={2}
              />
              <div className={styles.selectWrapper}>
                <select
                  value={startTime.ampm}
                  onChange={(e) => handleAmPmChange("start", e.target.value)}
                >
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
              <input
                type="text"
                value={endTime.hh}
                onChange={(e) => handleTimeChange("end", "hh", e.target.value)}
                maxLength={2}
              />
              <span>:</span>
              <input
                type="text"
                value={endTime.mm}
                onChange={(e) => handleTimeChange("end", "mm", e.target.value)}
                maxLength={2}
              />
              <span>:</span>
              <input
                type="text"
                value={endTime.ss}
                onChange={(e) => handleTimeChange("end", "ss", e.target.value)}
                maxLength={2}
              />
              <div className={styles.selectWrapper}>
                <select
                  value={endTime.ampm}
                  onChange={(e) => handleAmPmChange("end", e.target.value)}
                >
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
