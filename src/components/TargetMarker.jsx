import React from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function TargetMarker({ position }) {
  const markerRef = React.useRef()

  useFrame(() => {
    if (markerRef.current) {
      markerRef.current.rotation.y += 0.01 // slight spin
    }
  })

  return (
    <group ref={markerRef} position={position}>
      {/* Head of the pin */}
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.3} />
      </mesh>

      {/* Pin shaft (cone) */}
      <mesh position={[0, 1.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.1, 2, 32]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  )
}
