"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Stars } from "@react-three/drei";
import * as THREE from "three";

const TURNS = 6;
const POINTS_PER_TURN = 48;
const RADIUS = 1.6;
const HEIGHT = 9;
const RUNG_STRIDE = 6;

function useHelixStrands() {
  return useMemo(() => {
    const total = TURNS * POINTS_PER_TURN;
    const strandA: THREE.Vector3[] = [];
    const strandB: THREE.Vector3[] = [];

    for (let i = 0; i <= total; i++) {
      const t = (i / total) * TURNS * Math.PI * 2;
      const y = (i / total) * HEIGHT - HEIGHT / 2;
      strandA.push(new THREE.Vector3(Math.cos(t) * RADIUS, y, Math.sin(t) * RADIUS));
      strandB.push(new THREE.Vector3(Math.cos(t + Math.PI) * RADIUS, y, Math.sin(t + Math.PI) * RADIUS));
    }

    return { strandA, strandB };
  }, []);
}

function Rungs({ strandA, strandB }: { strandA: THREE.Vector3[]; strandB: THREE.Vector3[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = Math.floor(strandA.length / RUNG_STRIDE);

  useEffect(() => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = strandA[i * RUNG_STRIDE];
      const b = strandB[i * RUNG_STRIDE];
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const dir = b.clone().sub(a);
      const len = dir.length();

      dummy.position.copy(mid);
      dummy.scale.set(1, len, 1);
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count, strandA, strandB]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[0.018, 0.018, 1, 6]} />
      <meshStandardMaterial color="#8fb4c9" emissive="#22d3ee" emissiveIntensity={0.15} roughness={0.5} />
    </instancedMesh>
  );
}

function Helix({ pointer, scroll }: { pointer: React.RefObject<{ x: number; y: number }>; scroll: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const { strandA, strandB } = useHelixStrands();

  useFrame((_, delta) => {
    if (!group.current) return;
    const autoRotate = delta * 0.12;
    const scrollRotate = scroll.current * 0.0025;
    group.current.rotation.y += autoRotate;

    const targetTilt = pointer.current.y * 0.35;
    const targetSpin = scrollRotate;
    group.current.rotation.x += (targetTilt - group.current.rotation.x) * 0.04;
    group.current.rotation.z += (pointer.current.x * 0.2 - group.current.rotation.z) * 0.04;
    group.current.position.y = -scroll.current * 0.0015;
    void targetSpin;
  });

  return (
    <group ref={group}>
      <Line points={strandA} color="#22d3ee" lineWidth={2.2} />
      <Line points={strandB} color="#a78bfa" lineWidth={2.2} />
      <Rungs strandA={strandA} strandB={strandB} />
    </group>
  );
}

export default function DnaScene() {
  const pointer = useRef({ x: 0, y: 0 });
  const scroll = useRef(0);

  useEffect(() => {
    function onScroll() {
      scroll.current = window.scrollY;
    }
    function onPointerMove(e: PointerEvent) {
      pointer.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 8.5], fov: 45 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.55} />
        <pointLight position={[5, 5, 5]} intensity={40} color="#22d3ee" />
        <pointLight position={[-5, -3, -5]} intensity={30} color="#a78bfa" />
        <Stars radius={40} depth={30} count={1200} factor={2} fade speed={0.4} />
        <Helix pointer={pointer} scroll={scroll} />
      </Canvas>
    </div>
  );
}
