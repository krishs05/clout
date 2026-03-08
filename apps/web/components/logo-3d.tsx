"use client";

import { type ComponentPropsWithoutRef, type JSX, useId, useMemo, useRef } from "react";
import { Float } from "@react-three/drei";
import { Canvas, type ThreeElements, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { cn } from "@/lib/utils";

interface Logo3DProps {
  className?: string;
}

type BrandCrownMark3DProps = ThreeElements["group"] & {
  accentIndex?: number;
  animate?: boolean;
  spinSpeed?: number;
};

const BRAND_ACCENTS = [0x8b5cf6, 0x6366f1, 0xa78bfa, 0x4f46e5] as const;
const FILL_DEPTH = 0.14;
const STROKE_RADIUS = 0.072;

function svgCoordinate(x: number, y: number, z = 0): THREE.Vector3 {
  return new THREE.Vector3((x - 24) * 0.12, (24 - y) * 0.12, z);
}

function createPolygonShape(points: Array<[number, number]>): THREE.Shape {
  const shape = new THREE.Shape();
  const [firstX, firstY] = points[0];
  shape.moveTo((firstX - 24) * 0.12, (24 - firstY) * 0.12);

  for (const [x, y] of points.slice(1)) {
    shape.lineTo((x - 24) * 0.12, (24 - y) * 0.12);
  }

  shape.closePath();
  return shape;
}

function extrudeShape(shape: THREE.Shape, bevelSize: number): THREE.ExtrudeGeometry {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: FILL_DEPTH,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize,
    bevelThickness: 0.035,
  });

  geometry.translate(0, 0, -FILL_DEPTH / 2);
  return geometry;
}

function createTube(points: Array<[number, number]>, radius = STROKE_RADIUS): THREE.TubeGeometry {
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map(([x, y]) => svgCoordinate(x, y))),
    64,
    radius,
    16,
    false,
  );
}

function CrownGeometry(): {
  baseStroke: THREE.TubeGeometry;
  centerFill: THREE.ExtrudeGeometry;
  innerLeftStroke: THREE.TubeGeometry;
  innerRightStroke: THREE.TubeGeometry;
  leftFill: THREE.ExtrudeGeometry;
  leftStroke: THREE.TubeGeometry;
  outerStroke: THREE.TubeGeometry;
  rightFill: THREE.ExtrudeGeometry;
  rightStroke: THREE.TubeGeometry;
  shadowGeometry: THREE.TorusGeometry;
} {
  const centerShape = createPolygonShape([
    [12, 34],
    [16, 16],
    [24, 24],
    [32, 16],
    [36, 34],
  ]);
  const leftShape = createPolygonShape([
    [16, 34],
    [8, 22],
    [16, 26],
  ]);
  const rightShape = createPolygonShape([
    [32, 34],
    [40, 22],
    [32, 26],
  ]);

  return {
    baseStroke: createTube(
      [
        [12, 34],
        [18, 35.5],
        [24, 36],
        [30, 35.5],
        [36, 34],
      ],
      STROKE_RADIUS * 0.8,
    ),
    centerFill: extrudeShape(centerShape, 0.02),
    innerLeftStroke: createTube(
      [
        [14.2, 28],
        [14.2, 34],
      ],
      STROKE_RADIUS * 0.54,
    ),
    innerRightStroke: createTube(
      [
        [33.8, 28],
        [33.8, 34],
      ],
      STROKE_RADIUS * 0.54,
    ),
    leftFill: extrudeShape(leftShape, 0.016),
    leftStroke: createTube(
      [
        [8, 22],
        [16, 26],
        [16, 34],
      ],
      STROKE_RADIUS * 0.78,
    ),
    outerStroke: createTube([
      [8, 22],
      [16, 16],
      [12, 34],
      [24, 24],
      [36, 34],
      [32, 16],
      [40, 22],
    ]),
    rightFill: extrudeShape(rightShape, 0.016),
    rightStroke: createTube(
      [
        [40, 22],
        [32, 26],
        [32, 34],
      ],
      STROKE_RADIUS * 0.78,
    ),
    shadowGeometry: new THREE.TorusGeometry(1.68, 0.055, 18, 120),
  };
}

function HeroLights(): JSX.Element {
  return (
    <>
      <ambientLight intensity={0.7} color="#5b4de8" />
      <directionalLight position={[-4, 5, 7]} intensity={1.25} color="#ffffff" />
      <pointLight position={[3.5, 2.4, 4]} intensity={0.65} color="#8b5cf6" />
      <pointLight position={[-3, 0.5, 3.5]} intensity={0.45} color="#6366f1" />
      <pointLight position={[0, -3, 4]} intensity={0.2} color="#a78bfa" />
    </>
  );
}

function CrownCore({
  accentIndex = 0,
  animate = true,
  spinSpeed = 0.2,
  ...props
}: BrandCrownMark3DProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const { baseStroke, centerFill, innerLeftStroke, innerRightStroke, leftFill, leftStroke, outerStroke, rightFill, rightStroke, shadowGeometry } =
    useMemo(() => CrownGeometry(), []);
  const accentColor = BRAND_ACCENTS[accentIndex] ?? BRAND_ACCENTS[0];

  const primaryStrokeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x8b5cf6),
        metalness: 0.12,
        roughness: 0.18,
        emissive: new THREE.Color(0x6366f1),
        emissiveIntensity: 0.28,
      }),
    [],
  );
  const secondaryStrokeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x6366f1),
        metalness: 0.12,
        roughness: 0.18,
        emissive: new THREE.Color(0x8b5cf6),
        emissiveIntensity: 0.22,
      }),
    [],
  );
  const fillMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0x7c5cff),
        transparent: true,
        opacity: 0.2,
        roughness: 0.1,
        transmission: 0.16,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        emissive: new THREE.Color(0x6366f1),
        emissiveIntensity: 0.12,
      }),
    [],
  );
  const orbMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xe8eaff),
        roughness: 0.08,
        metalness: 0.04,
        clearcoat: 1,
        emissive: new THREE.Color(0xa78bfa),
        emissiveIntensity: 0.1,
      }),
    [],
  );
  const shadowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accentColor),
        transparent: true,
        opacity: 0.22,
      }),
    [accentColor],
  );

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    if (animate) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * spinSpeed) * 0.08;
    }
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      0.035 + Math.sin(state.clock.elapsedTime * 0.8) * 0.012,
      0.06,
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      Math.sin(state.clock.elapsedTime * 1.1) * 0.025,
      0.08,
    );
  });

  return (
    <group ref={groupRef} {...props}>
      <mesh
        geometry={shadowGeometry}
        material={shadowMaterial}
        scale={[1.16, 0.14, 1]}
        position={[0, -1.92, -0.16]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      <mesh geometry={centerFill} material={fillMaterial} position={[0, 0, -0.05]} />
      <mesh geometry={leftFill} material={fillMaterial} position={[0, 0, -0.05]} />
      <mesh geometry={rightFill} material={fillMaterial} position={[0, 0, -0.05]} />

      <mesh geometry={outerStroke} material={primaryStrokeMaterial} castShadow receiveShadow />
      <mesh geometry={leftStroke} material={secondaryStrokeMaterial} castShadow receiveShadow />
      <mesh geometry={rightStroke} material={secondaryStrokeMaterial} castShadow receiveShadow />
      <mesh geometry={innerLeftStroke} material={primaryStrokeMaterial} castShadow receiveShadow />
      <mesh geometry={innerRightStroke} material={primaryStrokeMaterial} castShadow receiveShadow />
      <mesh geometry={baseStroke} material={primaryStrokeMaterial} castShadow receiveShadow />

      {[
        [16, 12, 0.05, 0.12],
        [24, 20, 0.08, 0.17],
        [32, 12, 0.05, 0.12],
        [8, 18, 0.02, 0.09],
        [40, 18, 0.02, 0.09],
      ].map(([x, y, z, radius], index) => (
        <mesh
          key={`${x}-${y}`}
          material={orbMaterial}
          position={svgCoordinate(x, y, z)}
          castShadow
          receiveShadow
          scale={1 + index * 0.02}
        >
          <sphereGeometry args={[radius, 24, 24]} />
        </mesh>
      ))}
    </group>
  );
}

function HeroMark(): JSX.Element {
  return (
    <Float speed={0.72} rotationIntensity={0.015} floatIntensity={0.05}>
      <group position={[0, -0.06, 0]} rotation={[0.02, -0.035, 0]}>
        <CrownCore scale={0.84} spinSpeed={0.28} />
      </group>
    </Float>
  );
}

export function BrandCrownMark3D(props: BrandCrownMark3DProps): JSX.Element {
  return <CrownCore {...props} />;
}

export function Logo3D({ className }: Logo3DProps): JSX.Element {
  return (
    <div className={cn("relative overflow-hidden rounded-[1.75rem]", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.26),transparent_42%),linear-gradient(180deg,rgba(20,20,44,0.96),rgba(10,10,11,0.99))]" />
      <div className="absolute left-1/2 top-[18%] h-36 w-36 -translate-x-1/2 rounded-full bg-violet-400/16 blur-3xl" />
      <div className="absolute bottom-8 left-1/2 h-24 w-52 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="absolute inset-[1px] rounded-[calc(1.75rem-1px)] border border-white/[0.06]" />
      <Canvas camera={{ position: [0, 0.02, 9.4], fov: 28 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <HeroLights />
        <HeroMark />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0b]/72 to-transparent" />
    </div>
  );
}

export function LogoIcon({
  className,
  ...props
}: ComponentPropsWithoutRef<"svg">): JSX.Element {
  const gradientId = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#808CF8" />
          <stop offset="100%" stopColor="#808CF8" />
        </linearGradient>
      </defs>
      <ellipse
        cx="24"
        cy="40"
        rx="14"
        ry="2"
        fill="#808CF8"
        opacity="0.15"
      />
      <path
        d="M12 34 L16 16 L24 24 L32 16 L36 34 Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.1"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M16 34 L8 22 L16 26 Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.2"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M32 34 L40 22 L32 26 Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.2"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="12" r="2" fill="#e0e7ff" />
      <circle cx="24" cy="20" r="2.5" fill="#e0e7ff" />
      <circle cx="32" cy="12" r="2" fill="#e0e7ff" />
      <circle cx="8" cy="18" r="1.5" fill="#e0e7ff" opacity="0.8" />
      <circle cx="40" cy="18" r="1.5" fill="#e0e7ff" opacity="0.8" />
      <path
        d="M12 34 C12 36 36 36 36 34"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
