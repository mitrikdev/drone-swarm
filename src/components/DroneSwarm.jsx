import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createDroneGeometry } from '../utils/createDroneGeometry'

const DroneSwarm = forwardRef(function DroneSwarm({
  color,
  roughness,
  metalness,
  clearcoat,
  emissive,
  emissiveIntensity,
  initialCount = 100,
  formation = 'cube',
  deltaGroupSize = 25,
  cameraRef,
  povMode,
  povIndex,
  onTelemetryUpdate 
}, ref) {
  const spacing = 8
  const meshRef = useRef()
  const dummy = new THREE.Object3D()
  const [geometry] = useState(() => createDroneGeometry())
  const targetPositions = useRef([])
  const currentPositions = useRef([])
  const activeFlags = useRef([])
  const OFFSCREEN_ORIGIN = new THREE.Vector3(200, -100, 200)
  const [prevCount, setPrevCount] = useState(initialCount)

  useImperativeHandle(ref, () => ({
    getDronePosition: (index) => currentPositions.current[index]?.clone()
  }))

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

    const telemetry = []

    for (let i = 0; i < targetPositions.current.length; i++) {
      const target = targetPositions.current[i]
      const current = currentPositions.current[i]
      if (!target || !current) continue

      current.lerp(target, 0.015)
      dummy.position.copy(current)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      telemetry.push({
        id: i,
        position: { x: (current.x).toFixed(5), y: (current.y).toFixed(5), z: (current.z).toFixed(5) }
      })
    }

    meshRef.current.instanceMatrix.needsUpdate = true

    if (onTelemetryUpdate) {
      onTelemetryUpdate(telemetry)
    }

    if (povMode && cameraRef?.current) {
      const target = currentPositions.current[povIndex]
      if (target) {
        const offset = new THREE.Vector3(0, -0.7, 0)
        const cameraPos = target.clone().add(offset)

        cameraRef.current.position.copy(cameraPos)
        cameraRef.current.rotation.set(THREE.MathUtils.degToRad(15), THREE.MathUtils.degToRad(-180), 0)
        // cameraRef.current.lookAt(target)
      }
    }

  })

  return (<>
      {/* //helper cube
      <mesh position={currentPositions.current[povIndex]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh> */}
      <instancedMesh ref={meshRef} args={[geometry, null, 1000]} frustumCulled={false}>
        <meshStandardMaterial
          color={color}
          roughness={roughness}
          metalness={metalness}
          clearcoat={clearcoat}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </instancedMesh>
    </>
  )
})

export default DroneSwarm