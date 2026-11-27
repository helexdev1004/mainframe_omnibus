// A tiny isometric drawing kit for inline SVG.
//
// The page's 3D artwork is drawn as vectors with this, rather than by bending
// HTML in CSS 3D: transformed HTML is rasterised and then resampled, which
// leaves text and edges soft. Vectors stay sharp at any size.
//
// Axes: +x runs right-and-down on screen, +y left-and-down, +z straight up.

const COS = 0.8660254; // cos 30°
const SIN = 0.5; // sin 30°

export type Point3 = [x: number, y: number, z: number];

export function project(x: number, y: number, z = 0): [number, number] {
  return [(x - y) * COS, (x + y) * SIN - z];
}

function corners(points: Point3[]) {
  return points
    .map((point) =>
      project(...point)
        .map((n) => n.toFixed(2))
        .join(","),
    )
    .join(" ");
}

/** Lays ordinary 2D artwork flat on the ground plane, raised to height z. */
export function Plane({ z = 0, children }: { z?: number; children: React.ReactNode }) {
  return <g transform={`matrix(${COS} ${SIN} ${-COS} ${SIN} 0 ${-z})`}>{children}</g>;
}

/** A box: its lid and the two walls that face the viewer. */
export function Box({
  x,
  y,
  z = 0,
  w,
  d,
  h,
  top,
  left,
  right,
}: {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  top: string;
  left: string;
  right: string;
}) {
  return (
    <g>
      <polygon
        fill={left}
        points={corners([
          [x, y + d, z + h],
          [x + w, y + d, z + h],
          [x + w, y + d, z],
          [x, y + d, z],
        ])}
      />
      <polygon
        fill={right}
        points={corners([
          [x + w, y, z + h],
          [x + w, y + d, z + h],
          [x + w, y + d, z],
          [x + w, y, z],
        ])}
      />
      <polygon
        fill={top}
        points={corners([
          [x, y, z + h],
          [x + w, y, z + h],
          [x + w, y + d, z + h],
          [x, y + d, z + h],
        ])}
      />
    </g>
  );
}

/** A rounded slab lying on the plane; stacked copies below give it thickness. */
export function Slab({
  x,
  y,
  w,
  d,
  z = 0,
  depth = 8,
  radius = 14,
  fill,
  edge,
  stroke,
  turn = 0,
  children,
}: {
  x: number;
  y: number;
  w: number;
  d: number;
  z?: number;
  depth?: number;
  radius?: number;
  fill: string;
  edge: string;
  stroke?: string;
  /** rotation on the plane, in degrees */
  turn?: number;
  /** artwork drawn on the slab's top face, in plane coordinates */
  children?: React.ReactNode;
}) {
  const layers: number[] = [];
  for (let below = depth; below > 0; below -= 1.5) layers.push(below);

  return (
    <g>
      {layers.map((below) => (
        <Plane key={below} z={z - below}>
          <rect x={x} y={y} width={w} height={d} rx={radius} fill={edge} transform={`rotate(${turn})`} />
        </Plane>
      ))}
      <Plane z={z}>
        <g transform={`rotate(${turn})`}>
          <rect x={x} y={y} width={w} height={d} rx={radius} fill={fill} stroke={stroke} strokeWidth={0.8} />
          {children}
        </g>
      </Plane>
    </g>
  );
}
