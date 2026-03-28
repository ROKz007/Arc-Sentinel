"use client";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PresentationControls, Stage, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Anomaly } from "@/lib/types";

type TwinSceneProps = {
  anomalies: Anomaly[];
};

type ModelProps = { anomalies: Anomaly[]; modelPath: string };

function Model({ anomalies, modelPath }: ModelProps) {
  const gltf = useGLTF(modelPath, true) as any;
  const meshMap = useRef<Record<string, THREE.Mesh | null>>({});

  useEffect(() => {
    if (!gltf || !gltf.scene) return;
    gltf.scene.traverse((node: any) => {
      if (node.isMesh) {
        meshMap.current[node.name] = node;
        if (!node.material) node.material = new THREE.MeshStandardMaterial({ color: "#888888" });
      }
    });
  }, [gltf]);

  useEffect(() => {
    const defaultColor = new THREE.Color("#8b8b8b");
    const highlightColor = new THREE.Color("#ff3333");
    const highlighted = new Set<string>(anomalies.map((a) => a.node_id));

    for (const [name, mesh] of Object.entries(meshMap.current)) {
      if (!mesh || !mesh.material) continue;
      const mat = mesh.material as THREE.Material & { color?: THREE.Color };
      if (mat && "color" in mat && mat.color) {
        mat.color.copy(highlighted.has(name) ? highlightColor : defaultColor);
        mat.needsUpdate = true;
      }
    }
  }, [anomalies]);

  return <primitive object={gltf.scene} dispose={null} />;
}

// Three.js geometry rendered INSIDE Canvas when the .glb model is missing
function FallbackGeometry() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[10, 0.25, 2]} />
        <meshStandardMaterial color={0x334155} roughness={0.8} />
      </mesh>
      <mesh position={[-3, -2, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 4, 8]} />
        <meshStandardMaterial color={0x475569} roughness={0.9} />
      </mesh>
      <mesh position={[3, -2, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 4, 8]} />
        <meshStandardMaterial color={0x475569} roughness={0.9} />
      </mesh>
      <mesh position={[-3, 1.5, 0]} rotation={[0, 0, Math.PI / 5]}>
        <cylinderGeometry args={[0.04, 0.04, 5, 6]} />
        <meshStandardMaterial color={0x94a3b8} />
      </mesh>
      <mesh position={[3, 1.5, 0]} rotation={[0, 0, -Math.PI / 5]}>
        <cylinderGeometry args={[0.04, 0.04, 5, 6]} />
        <meshStandardMaterial color={0x94a3b8} />
      </mesh>
    </group>
  );
}

// HTML overlay rendered OUTSIDE Canvas while model path is resolving
function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10 pointer-events-none">
      <span className="font-mono text-[11px] text-primary/60 animate-pulse uppercase tracking-widest">
        Loading bridge model...
      </span>
    </div>
  );
}

// HTML overlay rendered OUTSIDE Canvas when WebGL fails entirely
function WebGLFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-10 pointer-events-none gap-2">
      <span className="material-symbols-outlined text-primary/40 text-4xl" aria-hidden>view_in_ar</span>
      <span className="font-mono text-[11px] text-primary/40 uppercase tracking-widest">
        3D renderer unavailable
      </span>
      <span className="font-mono text-[10px] text-primary/25 uppercase tracking-wide">
        WebGL not supported in this environment
      </span>
    </div>
  );
}

// Error boundary wraps the Canvas — catches WebGL / R3F init errors
// On error it renders null and signals the parent to show the HTML fallback
class TwinSceneErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn("TwinScene: WebGL context failed", error);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function TwinScene({ anomalies }: TwinSceneProps) {
  const [modelPath, setModelPath] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  // Probe for the model file
  useEffect(() => {
    let cancelled = false;
    const paths = ["/models/bridge.glb", "/model/bridge.glb"];
    (async () => {
      for (const p of paths) {
        try {
          const res = await fetch(p, { method: "HEAD" });
          if (cancelled) return;
          if (res.ok) {
            setModelPath(p);
            useGLTF.preload(p);
            return;
          }
        } catch (_) {
          // try next path
        }
      }
      if (!cancelled) setMissing(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Canvas content is always Three.js elements — rendered inside <Canvas>
  const canvasContent = useMemo(() => {
    if (missing) {
      return (
        <PresentationControls speed={1.5} global zoom={0.5} polar={[-0.1, Math.PI / 4]}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />
          <FallbackGeometry />
        </PresentationControls>
      );
    }
    if (!modelPath) return null;
    return (
      <Suspense fallback={null}>
        <PresentationControls speed={1.5} global zoom={0.5} polar={[-0.1, Math.PI / 4]}>
          <Stage environment="city" intensity={0.5} adjustCamera>
            <Model anomalies={anomalies} modelPath={modelPath} />
          </Stage>
        </PresentationControls>
      </Suspense>
    );
  }, [anomalies, missing, modelPath]);

  return (
    // h-full fills the absolute-inset-0 parent in the HUD viewport
    <div className="relative h-full w-full min-h-[300px]">
      {/* HTML loading overlay — outside Canvas, shown while model path resolves */}
      {!modelPath && !missing && !webglFailed && <LoadingOverlay />}

      {/* HTML WebGL failure — outside Canvas, shown if Canvas errors */}
      {webglFailed && <WebGLFallback />}

      {!webglFailed && (
        <TwinSceneErrorBoundary onError={() => setWebglFailed(true)}>
          <Canvas
            dpr={[1, 2]}
            camera={{ fov: 45, position: [0, 5, 15] }}
            style={{ width: "100%", height: "100%" }}
          >
            <color attach="background" args={["#020617"]} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 10, 5]} intensity={0.6} />
            {canvasContent}
          </Canvas>
        </TwinSceneErrorBoundary>
      )}
    </div>
  );
}
