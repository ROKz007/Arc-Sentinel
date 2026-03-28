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
    // Build a map of mesh names -> mesh references for quick lookup
    gltf.scene.traverse((node: any) => {
      if (node.isMesh) {
        meshMap.current[node.name] = node;
        // Ensure standard material exists
        if (!node.material) node.material = new THREE.MeshStandardMaterial({ color: "#888888" });
      }
    });
  }, [gltf]);

  useEffect(() => {
    // Reset colors, then highlight any nodes present in anomalies
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

export default function TwinScene({ anomalies }: TwinSceneProps) {
  const [modelPath, setModelPath] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  // Probe for available model path (supports both /model and /models)
  useEffect(() => {
    let cancelled = false;
    const paths = ["/model/bridge.glb", "/models/bridge.glb"];
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
          // try next
        }
      }
      if (!cancelled) setMissing(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const content = useMemo(() => {
    if (missing) return <Fallback />;
    if (!modelPath) return <Loading />;
    return (
      <Suspense fallback={<Loading />}>
        <PresentationControls speed={1.5} global zoom={0.5} polar={[-0.1, Math.PI / 4]}>
          <Stage environment="city" intensity={0.5} adjustCamera>
            <Model anomalies={anomalies} modelPath={modelPath} />
          </Stage>
        </PresentationControls>
      </Suspense>
    );
  }, [anomalies, missing, modelPath]);

  return (
    <div className="h-64 w-full rounded overflow-hidden">
      <TwinSceneErrorBoundary>
        <Canvas dpr={[1, 2]} camera={{ fov: 45 }}>
          <color attach="background" args={["#020617"]} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />
          {content}
        </Canvas>
      </TwinSceneErrorBoundary>
    </div>
  );
}

class TwinSceneErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn("TwinScene render failed, showing placeholder", error);
  }

  render() {
    if (this.state.hasError) {
      return <Fallback />;
    }
    return this.props.children;
  }
}


// Fallback geometry: simple bridge deck, piers, and cables
function Fallback() {
  return (
    <group>
      {/* Bridge deck */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[10, 0.25, 2]} />
        <meshStandardMaterial color={0x334155} roughness={0.8} />
      </mesh>
      {/* Left pier */}
      <mesh position={[-3, -2, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 4, 8]} />
        <meshStandardMaterial color={0x475569} roughness={0.9} />
      </mesh>
      {/* Right pier */}
      <mesh position={[3, -2, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 4, 8]} />
        <meshStandardMaterial color={0x475569} roughness={0.9} />
      </mesh>
      {/* Left cable */}
      <mesh position={[-3, 1.5, 0]} rotation={[0, 0, Math.PI / 5]}>
        <cylinderGeometry args={[0.04, 0.04, 5, 6]} />
        <meshStandardMaterial color={0x94a3b8} />
      </mesh>
      {/* Right cable */}
      <mesh position={[3, 1.5, 0]} rotation={[0, 0, -Math.PI / 5]}>
        <cylinderGeometry args={[0.04, 0.04, 5, 6]} />
        <meshStandardMaterial color={0x94a3b8} />
      </mesh>
    </group>
  );
}

function Loading() {
  return (
    <div className="h-64 w-full bg-slate-900 border border-slate-800 rounded flex items-center justify-center text-slate-400 text-sm">
      Loading bridge model...
    </div>
  );
}
