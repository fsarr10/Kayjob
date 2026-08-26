import Svg, { Circle, Defs, LinearGradient, Line, Path, Rect, Stop } from "react-native-svg";

export function KayJobLogo({ size = 54 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#16213D" />
          <Stop offset="100%" stopColor="#1B2A4A" />
        </LinearGradient>
        <LinearGradient id="rise" x1="0%" y1="100%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#E8862C" />
          <Stop offset="100%" stopColor="#F4B94A" />
        </LinearGradient>
      </Defs>
      <Rect width="200" height="200" rx="46" fill="url(#bg)" />
      <Circle cx="168" cy="34" r="70" fill="#F4B94A" opacity="0.08" />
      <Line x1="76" y1="52" x2="76" y2="148" stroke="#F7F4EE" strokeWidth="20" strokeLinecap="round" />
      <Line x1="76" y1="106" x2="132" y2="148" stroke="#F7F4EE" strokeWidth="20" strokeLinecap="round" />
      <Line x1="76" y1="106" x2="136" y2="50" stroke="url(#rise)" strokeWidth="20" strokeLinecap="round" />
      <Path d="M148 34 L152 44 L162 48 L152 52 L148 62 L144 52 L134 48 L144 44 Z" fill="#F4B94A" />
    </Svg>
  );
}
