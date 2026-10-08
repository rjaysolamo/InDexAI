import type { CSSProperties } from "react";

const paths = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  folder:
    "M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z",
  search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  plus: "M12 5v14 M5 12h14",
  wallet:
    "M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h16v11H5a3 3 0 0 1-3-3V6 M21 12h-6v5h6",
  flow: "M6 7v10 M6 12h12 M18 7v10 M3 3h6v4H3z M15 3h6v4h-6z M3 17h6v4H3z M15 17h6v4h-6z",
  activity: "M3 12h4l3-8 4 16 3-8h4",
  book: "M12 5v16 M12 5C9 2 4 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-2-1-7-2-10 1",
  clock: "M12 8v4l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  check: "M5 12l4 4L19 6",
  close: "M6 6l12 12 M6 18 18 6",
  copy: "M9 9h12v12H9z M15 5V2H2v13h3",
  chevron: "M9 5l7 7-7 7",
  globe:
    "M2 12h20 M12 2c7 7 7 13 0 20-7-7-7-13 0-20 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  shield: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z M8 12l3 3 5-6",
  menu: "M3 6h18 M3 12h18 M3 18h18",
};
export type IconName = keyof typeof paths;
export default function Icon({
  name,
  size = 20,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
