import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createDroneGeometry } from '../utils/createDroneGeometry'

export default function DroneSwarm({
  initialCount = 100,
  formation = 'cube',
  deltaGroupSize = 25
}) {
  const spacing = 8
  const meshRef = useRef()
  const dummy = new THREE.Object3D()
  const [geometry] = useState(() => createDroneGeometry())
  const targetPositions = useRef([])
  const currentPositions = useRef([])
  const activeFlags = useRef([])
  const OFFSCREEN_ORIGIN = new THREE.Vector3(200, -100, 200)
  const [prevCount, setPrevCount] = useState(initialCount)


function sampleSvgPathPoints(svgPath, numPoints, scale = 0.15, y = 5) {
  const commands = svgPath.match(/[a-df-z][^a-df-z]*/ig)
  if (!commands) return []

  let points = []
  let x = 0, z = 0
  for (let cmd of commands) {
    const type = cmd[0]
    const args = cmd.slice(1).trim().split(/[\s,]+/).map(Number)
    if (type === 'M' || type === 'L') {
      for (let i = 0; i < args.length; i += 2) {
        x = args[i]
        z = args[i + 1]
        points.push({ x: x * scale, y, z: z * scale })
      }
    } else if (type === 'h') {
      for (let i = 0; i < args.length; i++) {
        x += args[i]
        points.push({ x: x * scale, y, z: z * scale })
      }
    } else if (type === 'v') {
      for (let i = 0; i < args.length; i++) {
        z += args[i]
        points.push({ x: x * scale, y, z: z * scale })
      }
    }
    // Add more command support as needed
  }

  if (points.length <= numPoints) return points.map(p => new THREE.Vector3(p.x, p.y, p.z))

  // Downsample to match drone count
  const step = points.length / numPoints
  const sampled = []
  for (let i = 0; i < numPoints; i++) {
    const index = Math.floor(i * step)
    const { x, y, z } = points[index]
    sampled.push(new THREE.Vector3(x, y, z))
  }
  return sampled
}

  useEffect(() => {
    const newPositions = []
    const active = []
    const cols = Math.ceil(Math.sqrt(initialCount))
    const rows = Math.ceil(initialCount / cols)

    for (let i = 0; i < initialCount; i++) {
      let x = 0, y = 5, z = 0

      switch (formation) {
        case 'grid': {
          const col = i % cols
          const row = Math.floor(i / cols)
          const xOffset = (cols - 1) * spacing * 0.5
          const zOffset = (rows - 1) * spacing * 0.5
          x = col * spacing - xOffset
          z = row * spacing - zOffset
          break
        }

        case 'cube': {
          const layerSize = Math.ceil(Math.cbrt(initialCount))
          const lx = i % layerSize
          const ly = Math.floor(i / (layerSize * layerSize))
          const lz = Math.floor(i / layerSize) % layerSize
          const offset = spacing * (layerSize - 1) * 0.5
          x = lx * spacing - offset
          y = ly * spacing
          z = lz * spacing - offset
          break
        }

        case 'circle': {
          const droneSpacing = 8
          const y = 5
          const newPositions = []
          let placed = 0
          let ring = 0

          while (placed < initialCount) {
            const radius = ring * droneSpacing
            const circumference = 2 * Math.PI * radius
            const dronesThisRing = ring === 0 ? 1 : Math.floor(circumference / droneSpacing)

            for (let j = 0; j < dronesThisRing && placed < initialCount; j++) {
              if (ring === 0) {
                newPositions.push(new THREE.Vector3(0, y, 0))
                placed++
                continue
              }

              const angle = (j / dronesThisRing) * Math.PI * 2
              const x = Math.cos(angle) * radius
              const z = Math.sin(angle) * radius
              newPositions.push(new THREE.Vector3(x, y, z))
              placed++
            }

            ring++
          }

          targetPositions.current = newPositions
          const nextCurrent = []
          for (let i = 0; i < initialCount; i++) {
            if (currentPositions.current[i]) {
              nextCurrent[i] = currentPositions.current[i]
            } else {
              nextCurrent[i] = OFFSCREEN_ORIGIN.clone()
            }
          }
          currentPositions.current = nextCurrent
          return
        }

        case 'delta': {
          const groupSize = deltaGroupSize
          const groupIndex = Math.floor(i / groupSize)
          const iInGroup = i % groupSize
          const half = Math.floor(groupSize / 2)
          const direction = iInGroup < half ? -1 : 1
          const dx = Math.abs(iInGroup - half)

          const groupZOffset = -groupIndex * spacing * 1
          x = dx * spacing * direction
          z = -dx * spacing + groupZOffset
          y = 5
          break
        }

        case 'x-line': {
          x = (i - initialCount / 2) * spacing
          break
        }

        case 'y-line': {
          y = (i - initialCount / 2) * spacing
          break
        }

        case 'z-line': {
          z = (i - initialCount / 2) * spacing
          break
        }

        case 'sphere': {
          const phi = Math.acos(-1 + (2 * i) / initialCount)
          const theta = Math.sqrt(initialCount * Math.PI) * phi
          const r = spacing * 3
          x = r * Math.cos(theta) * Math.sin(phi)
          y = r * Math.sin(theta) * Math.sin(phi)
          z = r * Math.cos(phi)
          break
        }

        case 'spiral': {
          const angleStep = 0.3
          const verticalStep = 1.2
          const radius = 12
          const angle = i * angleStep
          x = Math.cos(angle) * radius
          z = Math.sin(angle) * radius
          y = i * verticalStep + 5
          break
        }
        
        default:
          break
      }

      newPositions.push(new THREE.Vector3(x, y, z))
      active.push(true)
    }

    // Mark drones to fly off if count is reduced
    if (initialCount < prevCount) {
      for (let i = initialCount; i < prevCount; i++) {
        newPositions[i] = OFFSCREEN_ORIGIN.clone()
        active[i] = false
      }
    }

    targetPositions.current = newPositions
    activeFlags.current = active

    const nextCurrent = []
    for (let i = 0; i < newPositions.length; i++) {
      if (currentPositions.current[i]) {
        nextCurrent[i] = currentPositions.current[i]
      } else {
        nextCurrent[i] = OFFSCREEN_ORIGIN.clone()
      }
    }

    currentPositions.current = nextCurrent
    setPrevCount(initialCount)
  }, [formation, initialCount, deltaGroupSize])

  useFrame(() => {
    if (!meshRef.current || targetPositions.current.length === 0) return

    const lerpSpeed = 0.015
    const count = targetPositions.current.length
    for (let i = 0; i < count; i++) {
      const target = targetPositions.current[i]
      const current = currentPositions.current[i]
      if (!target || !current) continue

      current.lerp(target, lerpSpeed)

      dummy.position.copy(current)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1.5, 1.5, 1.5)
      dummy.updateMatrix()

      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.count = count
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[geometry, null, 1000]}>
      <meshStandardMaterial
        color="#f0f0f0"
        roughness={0.3}
        metalness={0.4}
        clearcoat={1}
        emissive="#222"
        emissiveIntensity={0.05}
      />
    </instancedMesh>
  )
}
