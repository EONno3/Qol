import { useState } from "react";

interface Props {
  disabled: boolean;
  onDeploy: () => void;
  label?: string;
}

export function SlideToDeploy({ disabled, onDeploy, label = "밀어서 출격 ▶" }: Props) {
  const [value, setValue] = useState(0);

  function handleChange(next: number) {
    if (disabled) return;
    if (next >= 100) {
      setValue(100);
      onDeploy();
    } else {
      setValue(next);
    }
  }

  return (
    <div className={`slide-deploy ${disabled ? "disabled" : ""}`}>
      <div className="slide-track">
        <div className="slide-fill" style={{ width: `${value}%` }} />
        <span className="slide-label">
          {disabled ? "출격 불가" : label}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          disabled={disabled}
          aria-label="밀어서 출격"
          onChange={(e) => handleChange(Number(e.target.value))}
          onMouseUp={() => value < 100 && setValue(0)}
          onTouchEnd={() => value < 100 && setValue(0)}
        />
      </div>
    </div>
  );
}
