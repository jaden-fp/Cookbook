import { getIconDef } from '../cookbookIcons';

interface Props {
  iconId: string | null | undefined;
  color?: string;
  size?: number;
  strokeWidth?: number;
}

export default function CookbookIcon({ iconId, color = 'white', size = 24, strokeWidth = 2 }: Props) {
  const def = getIconDef(iconId);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {def.elements.map((el, i) => {
        if (el.tag === 'path') return <path key={i} d={el.d} />;
        if (el.tag === 'circle') return <circle key={i} cx={el.cx} cy={el.cy} r={el.r} />;
        if (el.tag === 'line') return <line key={i} x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} />;
        if (el.tag === 'rect') return <rect key={i} x={el.x} y={el.y} width={el.w} height={el.h} rx={el.rx} />;
        return null;
      })}
    </svg>
  );
}
