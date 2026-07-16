import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PresentationControls, Environment, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const TokenShape = () => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      meshRef.current.rotation.y += 0.005;
    }
    
    // Smooth mouse parallax
    if (groupRef.current) {
      const targetX = (state.pointer.x * Math.PI) / 4;
      const targetY = (state.pointer.y * Math.PI) / 4;
      
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetY, 0.05);
      
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, state.pointer.x * 2, 0.05);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, state.pointer.y * 2, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={2.5} rotationIntensity={1.5} floatIntensity={2.5}>
      <mesh ref={meshRef}>
        <torusGeometry args={[1.2, 0.4, 64, 128]} />
        <meshPhysicalMaterial 
          color="#ffffff" 
          emissive="#ffffff"
          emissiveIntensity={0.1}
          metalness={0.9} 
          roughness={0.1} 
          clearcoat={1} 
          clearcoatRoughness={0.1}
          transmission={0.5}
          thickness={1.5}
        />
      </mesh>
      
      {/* Inner glowing core */}
      <Sphere args={[0.6, 64, 64]}>
        <MeshDistortMaterial 
          color="#ffffff" 
          emissive="#ffffff" 
          emissiveIntensity={0.5} 
          distort={0.4} 
          speed={3} 
          roughness={0} 
        />
      </Sphere>
    </Float>
    </group>
  );
};

export const FloatingToken = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-[800px] -z-10 opacity-40 pointer-events-none mix-blend-screen overflow-hidden">
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 45 }} 
        gl={{ antialias: true, alpha: true }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
      >
        <Environment preset="city" />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <PresentationControls 
          global 
          polar={[-0.4, 0.2]} 
          azimuth={[-0.4, 0.2]}
        >
          <TokenShape />
        </PresentationControls>
      </Canvas>
    </div>
  );
};
