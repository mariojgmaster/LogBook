import { Input, type InputProps } from 'antd';

export function DurationHoursField(props: Omit<InputProps, 'type'>) {
  return (
    <Input
      {...props}
      inputMode="decimal"
      autoComplete="off"
      suffix={<span aria-hidden="true">h</span>}
      placeholder="Ex.: 0,5"
    />
  );
}
