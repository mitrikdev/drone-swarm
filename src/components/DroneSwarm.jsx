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

      case 'anduril': {
      const path = `M 419.4 100.5 l 54.8 146 h -30.3 l -11.6 -31.3 H 372 l -11.6 31.4 h -29.7 l 54.5 -146 Z m -38 89.3 h 41.3 L 402 133.7 Z M 611.6 246.6 h -26 l -68.3 -100.7 v 100.7 h -28.7 v -146 h 30.3 l 64.1 95.7 v -95.8 h 28.7 Z M 637.2 100.5 h 50.3 c 46 0 74 28.5 74 73 s -28 73 -74 73 h -50.3 Z M 687.5 221 c 28.2 0 44.5 -18.7 44.5 -47.3 c 0 -29 -16.3 -47.4 -44.7 -47.4 h -20.8 v 94.7 Z M 777.8 188.2 v -87.6 h 30 v 86.6 c 0 24.6 12 35.2 30.2 35.2 c 18.3 0 30.3 -10.6 30.3 -35.2 v -86.6 h 29.9 v 87.6 c 0 40.3 -24.3 60.4 -60.3 60.4 s -60.1 -20.1 -60.1 -60.4 Z M 951.4 246.6 h -29.9 v -146 h 59.8 c 33.6 0 54.5 15.8 54.5 46 c 0 22.1 -12 37 -32.5 42.9 l 36.4 57.1 h -34.2 l -33.7 -54.3 h -20.4 Z m 28.3 -79.3 c 17.5 0 26.4 -7.6 26.4 -20.6 c 0 -13.2 -9 -20.7 -26.4 -20.7 h -28.3 v 41.3 Z M 1085.6 246.6 h -29.9 v -146 h 30 Z M 1111 100.5 h 30 v 120.2 h 67.1 v 25.9 h -97 Z M 294.3 205 c -2.9 -1.4 -5.7 -3 -8.5 -4.6 a 145.3 145.3 0 0 1 -25.8 -19.3 c -2.7 -2.5 -5.4 -5.1 -7.9 -7.9 A 145.2 145.2 0 0 1 214 83.6 l -0.3 -8.7 v -0.8 a 1.5 1.5 0 0 0 -1.5 -1.6 h -57.6 a 1.5 1.5 0 0 0 -1.5 1.6 v 0.8 l -0.3 8.7 a 145.4 145.4 0 0 1 -37.3 88.7 c -2.5 2.8 -5.2 5.5 -7.9 8 A 147 147 0 0 1 81.8 200 a 146 146 0 0 1 -8.5 4.6 a 1.5 1.5 0 0 0 -0.7 2 c 1.3 3 2.6 5.8 4 8.4 a 120.3 120.3 0 0 0 18.9 26.8 c 2.2 2.4 4.6 4.7 7 7 a 120.5 120.5 0 0 0 162.5 0.3 c 2.5 -2.3 4.8 -4.6 7 -6.9 a 120.5 120.5 0 0 0 19 -26.7 a 102 102 0 0 0 4 -8.5 a 1.5 1.5 0 0 0 -0.7 -2 Z m -173.5 39.1 a 1.5 1.5 0 0 1 -2.4 1.3 q -2.7 -2 -5.2 -4.2 c -2.6 -2.2 -4.8 -4.4 -6.9 -6.5 a 108 108 0 0 1 -17.1 -23.3 a 1.5 1.5 0 0 1 0.5 -2 a 158.8 158.8 0 0 0 23.4 -17.4 c 2.6 -2.3 5.2 -4.8 7.6 -7.3 a 156 156 0 0 0 40 -72 a 1.5 1.5 0 0 1 3 0 a 196.4 196.4 0 0 0 12.7 41 a 1.5 1.5 0 0 1 0 1.3 a 186.5 186.5 0 0 1 -39.4 54.5 a 85.3 85.3 0 0 0 -7 7 a 38.6 38.6 0 0 0 -8.7 18.5 a 37.4 37.4 0 0 0 -0.6 6.7 v 2.4 Z m 97.3 -29 a 1.5 1.5 0 0 1 -0.3 2.4 a 67 67 0 0 1 -33.6 9.3 h -0.3 a 66.7 66.7 0 0 1 -34.6 -9.7 a 1.5 1.5 0 0 1 -0.3 -2.3 c 3 -3 6 -6.2 8.7 -9.4 a 199.1 199.1 0 0 0 24.4 -34.7 a 1.5 1.5 0 0 1 2.6 0 a 199.2 199.2 0 0 0 33.4 44.5 Z m -80.4 11.4 a 1.5 1.5 0 0 1 2.1 -0.4 a 79.2 79.2 0 0 0 44.1 13.4 l 3.6 -0.1 a 76.4 76.4 0 0 0 9.4 -1 a 79.8 79.8 0 0 0 31.3 -12.4 a 1.5 1.5 0 0 1 1.8 0.1 a 199.2 199.2 0 0 0 20.9 15.6 a 1.5 1.5 0 0 1 0 2.5 a 107.8 107.8 0 0 1 -66 23.4 h -0.9 a 113 113 0 0 1 -14.7 -1 a 106.3 106.3 0 0 1 -30.7 -9 a 1.5 1.5 0 0 1 -0.6 -0.5 a 26.5 26.5 0 0 1 -0.2 -30.6 Z m 99.8 -10 l -7.2 -6.5 a 186.6 186.6 0 0 1 -40.5 -56.3 a 166 166 0 0 1 -5 -11.8 a 184.8 184.8 0 0 1 -12 -55 a 1.5 1.5 0 0 1 1.5 -1.7 h 26 a 1.5 1.5 0 0 1 1.6 1.4 l 0.8 8.5 a 158 158 0 0 0 44.2 90.4 c 2.4 2.5 5 4.9 7.6 7.2 a 157.1 157.1 0 0 0 23.4 17.2 a 1.5 1.5 0 0 1 0.5 2 a 107.5 107.5 0 0 1 -15.6 21.4 a 1.5 1.5 0 0 1 -1.9 0.3 a 187.1 187.1 0 0 1 -23.4 -17.1 Z`
      const svgPoints = sampleSvgPathPoints(path, initialCount)
      targetPositions.current = svgPoints
      return
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
