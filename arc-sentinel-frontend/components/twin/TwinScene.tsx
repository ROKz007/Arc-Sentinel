"use client";
import React, { Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Anomaly } from "@/lib/types";

type TwinSceneProps = {
  anomalies: Anomaly[];
};

function Model({ anomalies }: { anomalies: Anomaly[] }) {
  const gltf = useGLTF("/models/bridge.glb", true) as any;
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
  return (
    <div className="h-64 w-full rounded overflow-hidden">
      <Canvas camera={{ position: [0, 4, 8], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <Suspense fallback={null}>
          <Model anomalies={anomalies} />
        </Suspense>
        <OrbitControls enablePan={true} enableZoom={true} />
      </Canvas>
    </div>
  );
}
