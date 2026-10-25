// Original pixel-art sprites for the Unsubscribality Easter egg, drawn from character grids.

type Palette = Readonly<Record<string, string>>;

function PixelSprite({
  rows,
  palette,
  className,
}: {
  readonly rows: readonly string[];
  readonly palette: Palette;
  readonly className?: string;
}) {
  const width = rows[0]?.length ?? 0;
  const rects: { x: number; y: number; w: number; fill: string }[] = [];

  // Merge horizontal runs of the same colour into one rect each.
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const fill = palette[row[x]];
      let end = x + 1;
      while (end < row.length && row[end] === row[x]) {
        end++;
      }
      if (fill) {
        rects.push({ x, y, w: end - x, fill });
      }
      x = end;
    }
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${rows.length}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {rects.map(({ x, y, w, fill }) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={1} fill={fill} />
      ))}
    </svg>
  );
}

// o outline, w paper, l paper shade, b flap, r SUGNL stamp, e eyes, m mouth
const NEWSLETTER_ROWS = [
  "..oooooooooooooooooo..",
  ".owwwwwwwwwwwwwwwrrro.",
  "owbwwwwwwwwwwwwwwrrrwo",
  "owwbwwwwwwwwwwwwbrrrwo",
  "owwwbwwwwwwwwwwbwwwwwo",
  "owwwwbwwwwwwwwbwwwwwwo",
  "owwwwwbbwwwwbbwwwwwwwo",
  "owwwwwwwbbbbwwwwwwwwwo",
  "owwwwwwwwwwwwwwwwwwwwo",
  "owwwwweewwwwwweewwwwwo",
  "owwwwweewwwwwweewwwwwo",
  "owwwwwwwwwwwwwwwwwwwwo",
  "owwwwwwwwmmmmwwwwwwwwo",
  "owwwwwwwmwwwwmwwwwwwwo",
  "ollllllllllllllllllllo",
  ".oooooooooooooooooooo.",
];

const NEWSLETTER_PALETTE: Palette = {
  o: "#0b1030",
  w: "#f4f7ff",
  l: "#c7d3f6",
  b: "#3d6ff7",
  r: "#ff4f2f",
  e: "#0b1030",
  m: "#0b1030",
};

// o outline, w fill, g glow edge
const CURSOR_ROWS = [
  "o...........",
  "oo..........",
  "owo.........",
  "owwo........",
  "owwwo.......",
  "owwwwo......",
  "owwwwwo.....",
  "owwwwwwo....",
  "owwwwwwwo...",
  "owwwwwwwwo..",
  "owwwwwwwwwo.",
  "owwwwwwoooo.",
  "owwwowwo....",
  "owwo.owwo...",
  "owo..owwo...",
  "oo....owwo..",
  "......oooo..",
];

const CURSOR_PALETTE: Palette = {
  o: "#0b1030",
  w: "#ffffff",
};

export function PixelNewsletter({ className }: { readonly className?: string }) {
  return <PixelSprite rows={NEWSLETTER_ROWS} palette={NEWSLETTER_PALETTE} className={className} />;
}

export function PixelCursor({ className }: { readonly className?: string }) {
  return <PixelSprite rows={CURSOR_ROWS} palette={CURSOR_PALETTE} className={className} />;
}

const ARROW_ROWS = ["...o...", "..ooo..", ".ooooo.", "ooooooo", "..ooo..", "..ooo..", "..ooo.."];
const ARROW_PALETTE: Palette = { o: "currentColor" };
const ARROW_ROTATION = { up: 0, right: 90, down: 180, left: 270 } as const;

export type ArrowDirection = keyof typeof ARROW_ROTATION;

export function PixelArrow({ direction, className }: { readonly direction: ArrowDirection; readonly className?: string }) {
  return (
    <span className={className} style={{ display: "inline-block", transform: `rotate(${ARROW_ROTATION[direction]}deg)` }}>
      <PixelSprite rows={ARROW_ROWS} palette={ARROW_PALETTE} className="block h-full w-full" />
    </span>
  );
}
