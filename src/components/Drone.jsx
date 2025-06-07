import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'

function Arm({ rotation }) {
  return (
    <mesh rotation={rotation}>
      <cylinderGeometry args={[0.1, 0.1, 4, 32]} />
      <meshStandardMaterial color="#666" metalness={1} roughness={0.4} />
    </mesh>
  )
}

function PropellerMount({ position }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.2, 0.2, 0.2, 32]} />
      <meshStandardMaterial color="black" metalness={1} roughness={0.3} />
    </mesh>
  )
}

function Propeller({ position }) {
  const ref = useRef()
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.3
  })

  return (
    <mesh position={position} ref={ref}>
      <boxGeometry args={[1.2, 0.05, 0.15]} />
      <meshStandardMaterial color="#222" metalness={0.5} roughness={0.2} />
    </mesh>
  )
}

export default function Drone() {
  const offset = 2.2

  return (
    <group scale={[2, 2, 2]}>
      {/* Drone Body */}
      <mesh>
        <sphereGeometry args={[0.5, 64, 64]} />
        <meshStandardMaterial
          color="#2e70f0"
          metalness={0.8}
          roughness={0.3}
          clearcoat={1}
        />
      </mesh>

      {/* Arms */}
      <Arm rotation={[0, 0, Math.PI / 4]} />
      <Arm rotation={[0, 0, -Math.PI / 4]} />

      {/* Propeller Mounts + Propellers */}
      {[
        [offset, 0, offset],
        [-offset, 0, offset],
        [offset, 0, -offset],
        [-offset, 0, -offset],
      ].map((pos, i) => (
        <group key={i} position={pos}>
          <PropellerMount position={[0, 0.15, 0]} />
          <Propeller position={[0, 0.3, 0]} />
        </group>
      ))}

      {/* Optional: Add environment map */}
      <Environment preset="city" />
    </group>
  )
}
