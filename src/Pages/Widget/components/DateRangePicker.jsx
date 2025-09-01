// src/Pages/Widget/components/DateRangePicker.jsx
import React from "react";

// ✅ 팀 공용 DateRange 그대로 사용 (경로만 확인하세요)
import GlobalDateRangePicker from "../../../components/DateRange/DateRangePicker";

/**
 * 위젯 전용 어댑터:
 * - 두 가지 프롭스 모드 모두 지원
 *   A) startDate, endDate, setStartDate, setEndDate  (지금 NewWidgetPage에서 쓰는 방식)
 *   B) value={{from,to}} / onChange({from,to})        (레거시/다른 페이지가 쓰는 방식)
 * - 내부적으로 공용 DateRange를 그대로 렌더링하므로 팀원 코드에 영향 없음
 */
export default function WidgetDateRangePicker(props) {
  const isControlledA =
    "startDate" in props &&
    "endDate" in props &&
    "setStartDate" in props &&
    "setEndDate" in props;

  const isControlledB =
    "value" in props &&
    "onChange" in props &&
    props.value &&
    (props.value.from || props.value.to);

  // 현재 페이지(NewWidgetPage)는 A 모드를 사용하므로 그대로 패스.
  if (isControlledA) {
    const { startDate, endDate, setStartDate, setEndDate } = props;
    return (
      <GlobalDateRangePicker
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
      />
    );
  }

  // 혹시 모를 레거시 모드도 안전하게 지원
  if (isControlledB) {
    const { value, onChange } = props;
    return <GlobalDateRangePicker value={value} onChange={onChange} />;
  }

  // 안전장치: 아무것도 없으면 기본 7일 범위로 동작
  const now = new Date();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return (
    <GlobalDateRangePicker
      startDate={sevenDaysAgo}
      endDate={now}
      setStartDate={() => {}}
      setEndDate={() => {}}
    />
  );
}
