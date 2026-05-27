"use client";

import { Html, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { Group } from "three";

import { PhoneDashboardUI } from "@/components/beyond-studio/ui/phone-dashboard";
import { useHeroDeviceScroll } from "@/components/beyond-studio/three/hero-device-scroll";

const TITANIUM = new THREE.Color("#1a1b22");
const GRAPHITE = new THREE.Color("#0c0d12");

function TitaniumFrame() {
  return (
    <>
      <RoundedBox args={[1.62, 3.28, 0.14]} radius={0.14} smoothness={12} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={TITANIUM}
          metalness={1}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.08}
          reflectivity={1}
          envMapIntensity={1.4}
        />
      </RoundedBox>
      {/* Chamfer highlight edge */}
      <RoundedBox args={[1.64, 3.3, 0.142]} radius={0.145} smoothness={12}>
        <meshPhysicalMaterial
          color="#2a2d38"
          metalness={1}
          roughness={0.15}
          transparent
          opacity={0.35}
          side={THREE.BackSide}
        />
      </RoundedBox>
    </>
  );
}

function ScreenAssembly() {
  return (
    <group position={[0, 0, 0.072]}>
      {/* Screen well */}
      <mesh castShadow>
        <planeGeometry args={[1.44, 2.96]} />
        <meshStandardMaterial color={GRAPHITE} metalness={0.2} roughness={0.85} />
      </mesh>
      {/* Live UI */}
      <Html
        transform
        occlude={false}
        position={[0, 0, 0.002]}
        distanceFactor={1.05}
        style={{
          width: 332,
          pointerEvents: "none",
          transform: "translateZ(0)",
        }}
      >
        <div className="overflow-hidden rounded-[1.85rem] ring-1 ring-white/[0.08]">
          <PhoneDashboardUI />
        </div>
      </Html>
      {/* Glass laminate */}
      <mesh position={[0, 0, 0.018]}>
        <planeGeometry args={[1.46, 2.98]} />
        <meshPhysicalMaterial
          transparent
          transmission={0.97}
          thickness={0.35}
          roughness={0.04}
          ior={1.45}
          color="#88aaff"
          opacity={0.12}
          metalness={0}
          envMapIntensity={1.2}
        />
      </mesh>
    </group>
  );
}

/** Rounded plane via extrude alternative — use small RoundedBox for island */
function DynamicIsland() {
  return (
    <RoundedBox args={[0.44, 0.1, 0.02]} radius={0.05} smoothness={4} position={[0, 1.22, 0.088]}>
      <meshStandardMaterial color="#050508" metalness={0.85} roughness={0.25} />
    </RoundedBox>
  );
}

function SideButtons() {
  return (
    <group>
      <mesh position={[0.84, 0.55, 0]} castShadow>
        <boxGeometry args={[0.03, 0.22, 0.06]} />
        <meshStandardMaterial color="#25262e" metalness={0.9} roughness={0.35} envMapIntensity={0.8} />
      </mesh>
      <mesh position={[0.84, 0.2, 0]} castShadow>
        <boxGeometry args={[0.03, 0.14, 0.06]} />
        <meshStandardMaterial color="#25262e" metalness={0.9} roughness={0.35} envMapIntensity={0.8} />
      </mesh>
      <mesh position={[-0.84, 0.35, 0]} castShadow>
        <boxGeometry args={[0.03, 0.28, 0.06]} />
        <meshStandardMaterial color="#25262e" metalness={0.9} roughness={0.35} envMapIntensity={0.8} />
      </mesh>
    </group>
  );
}

function ScreenGlow() {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.intensity = 0.35 + Math.sin(t * 1.2) * 0.12;
  });
  return (
    <pointLight
      ref={ref}
      position={[0, 0, 0.25]}
      color="#6b8cff"
      intensity={0.4}
      distance={3}
    />
  );
}

export function HeroPhoneModel() {
  const group = useRef<Group>(null);
  const scroll = useHeroDeviceScroll();
  const drift = useRef(0);
  const targetRot = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (!group.current) return;
    drift.current += delta;

    const idleY = Math.sin(drift.current * 0.55) * 0.06;
    const idleX = Math.cos(drift.current * 0.4) * 0.03;
    const mx = state.pointer.x * 0.55;
    const my = state.pointer.y * 0.32;

    targetRot.current.y += (mx + idleY * 0.3 - targetRot.current.y) * 0.035;
    targetRot.current.x += (-my + idleX - targetRot.current.x) * 0.035;

    group.current.rotation.y = targetRot.current.y + scroll * 0.08;
    group.current.rotation.x = targetRot.current.x - scroll * 0.12;
    group.current.position.y = Math.sin(drift.current * 0.5) * 0.06 - scroll * 0.35;
    group.current.position.z = scroll * 0.15;
  });

  return (
    <group ref={group} scale={1.72}>
      <ScreenGlow />
      <TitaniumFrame />
      <ScreenAssembly />
      <DynamicIsland />
      <SideButtons />
    </group>
  );
}
