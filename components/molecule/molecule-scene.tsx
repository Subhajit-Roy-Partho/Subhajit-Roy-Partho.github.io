"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const RING_COUNT = 6;
const RING_RADIUS = 1.3;

function useCluster() {
  return useMemo(() => {
    const outer: THREE.Vector3[] = [];
    for (let i = 0; i < RING_COUNT; i++) {
      const a = (i / RING_COUNT) * Math.PI * 2;
      outer.push(new THREE.Vector3(Math.cos(a) * RING_RADIUS, Math.sin(a) * RING_RADIUS, 0));
    }
    return { center: new THREE.Vector3(0, 0, 0), outer };
  }, []);
}

function Bond({ a, b }: { a: THREE.Vector3; b: THREE.Vector3 }) {
  const ref = useRef<THREE.Mesh>(null);
  useEffect(() => {
    if (!ref.current) return;
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a);
    ref.current.position.copy(mid);
    ref.current.scale.set(1, dir.length(), 1);
    ref.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  }, [a, b]);

  return (
    <mesh ref={ref}>
      <cylinderGeometry args={[0.02, 0.02, 1, 6]} />
      <meshStandardMaterial color="#8fb4c9" transparent opacity={0.6} />
    </mesh>
  );
}

function Cluster({ scroll, pointer }: { scroll: React.RefObject<number>; pointer: React.RefObject<{ x: number; y: number }> }) {
  const group = useRef<THREE.Group>(null);
  const { center, outer } = useCluster();
  const baseScroll = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    if (baseScroll.current === null) baseScroll.current = scroll.current;
    const relative = scroll.current - baseScroll.current;

    group.current.rotation.y += delta * 0.25 + relative * 0.00012;
    group.current.rotation.x += (pointer.current.y * 0.3 - group.current.rotation.x) * 0.05;
    group.current.rotation.z += (pointer.current.x * 0.15 - group.current.rotation.z) * 0.05;

    const targetScale = 1 + Math.min(Math.max(relative * 0.0003, -0.15), 0.2);
    group.current.scale.setScalar(group.current.scale.x + (targetScale - group.current.scale.x) * 0.06);
  });

  const colors = ["#22d3ee", "#a78bfa"];

  return (
    <group ref={group}>
      <mesh position={center}>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color="#eef1f6" emissive="#22d3ee" emissiveIntensity={0.25} roughness={0.4} />
      </mesh>
      {outer.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.22, 20, 20]} />
          <meshStandardMaterial color={colors[i % 2]} emissive={colors[i % 2]} emissiveIntensity={0.4} roughness={0.4} />
        </mesh>
      ))}
      {outer.map((p, i) => (
        <Bond key={`c-${i}`} a={center} b={p} />
      ))}
      {outer.map((p, i) => (
        <Bond key={`r-${i}`} a={p} b={outer[(i + 1) % outer.length]} />
      ))}
    </group>
  );
}

export default function MoleculeScene() {
  const scroll = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });

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
    <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 3]} intensity={20} color="#22d3ee" />
      <pointLight position={[-3, -2, -3]} intensity={16} color="#a78bfa" />
      <Cluster scroll={scroll} pointer={pointer} />
    </Canvas>
  );
}
