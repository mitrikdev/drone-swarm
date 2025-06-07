import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import DroneSwarm from './components/DroneSwarm'
import { Leva, useControls } from 'leva'
import './App.css'

function CameraController({ view, droneCount }) {
  const controlsRef = useRef()
  const { camera } = useThree()

  useEffect(() => {
    const spacing = 8
    const cols = Math.min(droneCount, 10)
    const rows = Math.ceil(droneCount / cols)
    const gridWidth = cols * spacing
    const gridDepth = rows * spacing
    const boundingSize = Math.max(gridWidth, gridDepth)

    const fov = 50 * (Math.PI / 180)
    const zoomDistance = (boundingSize / 2) / Math.tan(fov / 2)

    let pos, target

    switch (view) {
      case 'top-down':
        pos = [0, zoomDistance, 0]
        target = [0, 0, 0]
        break
      case 'side':
        pos = [zoomDistance, 5, 0]
        target = [0, 5, 0]
        break
      case 'angled':
        pos = [zoomDistance * 0.6, zoomDistance * 0.4, zoomDistance * 0.6]
        target = [0, 5, 0]
        break
      default:
        pos = [0, zoomDistance * 0.25, zoomDistance]
        target = [0, 5, 0]
    }

    camera.position.set(...pos)
    controlsRef.current?.target.set(...target)
    controlsRef.current?.update()
  }, [view, camera, droneCount])

  return <OrbitControls ref={controlsRef} />
}


export default function App() {
  const [count, setCount] = useState(100)
  const [formation, setFormation] = useState('grid')
  const [deltaGroupSize, setDeltaGroupSize] = useState(25)
  const [view, setView] = useState('default')

  const { droneCount, formationType, deltaGroupCount, cameraView } = useControls({
    droneCount: {
      value: count,
      min: 1,
      max: 500,
      step: 1,
      onChange: setCount
    },
    formationType: {
      options: ['x-line', 'y-line', 'z-line', 'grid', 'delta', 'circle', 'spiral', 'cube', 'sphere','anduril'],
      value: formation,
      onChange: setFormation
    },
    deltaGroupCount: {
      value: deltaGroupSize,
      min: 5,
      max: 100,
      step: 1,
      onChange: setDeltaGroupSize
    },
    cameraView: {
      options: ['default', 'top-down', 'side', 'angled'],
      value: view,
      onChange: setView
    }
  })

  return (
    <div className="canvas-container">
      <Leva collapsed={false} />
      <Canvas camera={{ fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} intensity={1.2} />
        <DroneSwarm
          initialCount={count}
          formation={formation}
          deltaGroupSize={deltaGroupSize}
        />
        <CameraController view={view} droneCount={count} />
      </Canvas>
    </div>
  )
}
