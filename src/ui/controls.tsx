export function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="row">
      <label>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="num">{format(value)}</span>
    </div>
  );
}

export function NumInput({
  value,
  onChange,
  step = 0.1,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (Number.isFinite(v)) onChange(v);
      }}
    />
  );
}

function format(n: number): string {
  return Math.abs(n) >= 10
    ? n.toFixed(1)
    : Math.abs(n) >= 1
      ? n.toFixed(2)
      : n.toFixed(3);
}
