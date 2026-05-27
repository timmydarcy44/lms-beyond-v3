"use client";

import {
  ContactShadows,
  Environment,
  Float,
  MeshReflectorMaterial,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { HeroPhoneModel } from "@/components/beyond-studio/three/hero-phone-model";

function StudioFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.35, 0]} receiveShadow>
      <planeGeometry args={[24, 24]} />
      <MeshReflectorMaterial
        blur={[280, 120]}
        resolution={512}
        mixBlur={1}
        mixStrength={0.45}
        roughness={0.92}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#050508"
        metalness={0.65}
        mirror={0.35}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

function VolumetricRig() {
  const key = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.SpotLight>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (key.current) key.current.intensity = 1.85 + Math.sin(t * 0.8) * 0.15;
    if (rim.current) rim.current.intensity = 0.9 + Math.cos(t * 0.6) * 0.1;
  });

  return (
    <>
      <ambientLight intensity={0.18} color="#8fa4ff" />
      <directionalLight
        position={[6, 10, 6]}
        intensity={0.35}
        color="#c8d4ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={24}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0001}
      />
      <spotLight
        ref={key}
        position={[4.5, 6, 5]}
        angle={0.42}
        penumbra={1}
        intensity={1.85}
        color="#b4c4ff"
        castShadow
      />
      <spotLight
        ref={rim}
        position={[-5, 2, -2]}
        angle={0.55}
        penumbra={0.9}
        intensity={0.9}
        color="#3d5a9e"
      />
      <pointLight position={[0, -1, 3]} intensity={0.25} color="#1e3a5f" />
    </>
  );
}

function SceneContent() {
  return (
    <>
      <VolumetricRig />
      <Environment preset="studio" environmentIntensity={0.65} />
      <Float speed={0.4} rotationIntensity={0.02} floatIntensity={0.12}>
        <HeroPhoneModel />
      </Float>
      <StudioFloor />
      <ContactShadows
        position={[0, -2.34, 0]}
        opacity={0.55}
        scale={14}
        blur={2.8}
        far={5}
        color="#000000"
        resolution={1024}
      />
    </>
  );
}

export function HeroPhoneScene({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_42%,rgba(72,110,220,0.22),transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_30%_at_50%_100%,rgba(30,50,100,0.15),transparent)]" />
      <Canvas
        className="h-full w-full touch-none"
        shadows
        camera={{ position: [0, 0.12, 5.4], fov: 28, near: 0.1, far: 100 }}
        onCreated={({ scene }) => {
          scene.background = null;
        }}
        dpr={[1, 2]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
      >
        <fog attach="fog" args={["#050508", 8, 22]} />
        <SceneContent />
      </Canvas>
    </div>
  );
}
