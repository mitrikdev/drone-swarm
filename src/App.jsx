import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useThree, useFrame} from '@react-three/fiber'
import { Stats, OrbitControls } from '@react-three/drei'
import DroneSwarm from './components/DroneSwarm'
import { Leva, useControls } from 'leva'
import * as THREE from 'three'
import { Sky, Grid  } from '@react-three/drei'
import { createDroneGeometry } from './utils/createDroneGeometry'
import './App.css'

const loadingTime = 3000

function CameraController({ view, droneCount, dronePositions, povMode, povIndex }) {
  const controlsRef = useRef()
  const { camera } = useThree()

  useEffect(() => {
    if (!camera) return

      if (povMode && dronePositions.length > 0) {
        const target = dronePositions[povIndex]
        if (!target) return

        const offset = new THREE.Vector3(0, 5, -10)
        const camPos = target.clone().add(offset)
        camera.position.lerp(camPos, 0.2)
        camera.lookAt(target)
        return
      }

      const spacing = 8
      const cols = Math.min(droneCount, 10)
      const rows = Math.ceil(droneCount / cols)
      const boundingSize = Math.max(cols * spacing, rows * spacing)
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
    }, [view, camera, droneCount, dronePositions, povMode, povIndex])

  return <OrbitControls ref={controlsRef} />
}

function LoadingDroneMesh() {
  const meshRef = useRef()
  const [geometry] = useState(() => createDroneGeometry())

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02
      meshRef.current.rotation.x = Math.sin(performance.now() / 500) * 0.4
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial color="#f0f0f0" metalness={0.5} roughness={0.2} />
    </mesh>
  )
}

function LoadingDroneScene() {
  return (
    <Canvas camera={{ fov: 50, position: [0, 0, 10] }}>
      <ambientLight />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <LoadingDroneMesh />
    </Canvas>
  )
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(100)
  const [formation, setFormation] = useState('grid')
  const [deltaGroupSize, setDeltaGroupSize] = useState(25)
  const [view, setView] = useState('default')
  const [povMode, setPovMode] = useState(false)
  const [povIndex, setPovIndex] = useState(0)
  const [dronePositions, setDronePositions] = useState([])
  const [telemetry, setTelemetry] = useState([])
  const swarmRef = useRef()
  const cameraRef = useRef()

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), loadingTime)
    return () => clearTimeout(timeout)
  }, [])

  const { droneCount, formationType, deltaGroupCount, cameraView, /*dronePOV*/ /*, povTarget,*/ color, 
    roughness,
    metalness,
    clearcoat,
    emissive,
    emissiveIntensity,
  } = useControls({
    droneCount: {
      value: count,
      min: 1,
      max: 529,
      step: 1,
      onChange: setCount
    },
    formationType: {
      options: ['x-line', 'y-line', 'z-line', 'grid', 'delta', 'circle', 'spiral', 'cube', 'sphere'],
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
    },
    /*dronePOV: {
      value: false,
      onChange: setPovMode
    },*/
    // "Drone #": {
    //   value: count-count,
    //   min: 0,
    //   max: count - 1 ,
    //   step: 1,
    //   onChange: setPovIndex
    // }
    color: { value: '#f0f0f0' },
    roughness: {  
                  min: 0,
                  max: 1,
                  step: .1,
                  value: 0.3 
               },
    metalness: {  
                  min: 0,
                  max: 1,
                  step: .1,
                  value: 0.4 
               },
    clearcoat: {  
                  min: 0,
                  max: 1,
                  step: .1,
                  value: 1 
               },
    emissive: { value: '#222222' },
    emissiveIntensity: {  
                  min: 0,
                  max: 1,
                  step: .01,
                  value: 0.05 
               },
  },[count])

  const {ambientInensity,
  pLightX,
  pLightY,
  pLightZ,
  dIntensiity} = useControls({
    ambientInensity : { value:0.5, min:0, max:10, step:0.1},
    pLightX : { value:10, min:-100, max:100, step:10},
    pLightY : { value:20, min:-100, max:100, step:10},
    pLightZ : { value:10, min:-100, max:100, step:10},
    dIntensiity : { value:1.2, min:0, max:100, step:0.1},
  })

  const handleTelemetryUpdate = (data) => {
    setTelemetry(data)
  }


  return (<>
    {loading && 
    <div className="canvas-container">
      <LoadingDroneScene />
    </div>}

    <div className="canvas-container">
    <Leva collapsed={false} />


      <Canvas onCreated={({ camera }) => (cameraRef.current = camera)} camera={{ fov: 50, near: 0.1, far: 2000}}>
        <Sky 
          sunPosition={[500, -20, 0]} 
          distance={450000} 
          turbidity={8} 
          rayleigh={6} 
          mieCoefficient={0.005} 
          mieDirectionalG={0.7}
        />
        <ambientLight intensity={ambientInensity} />
        <directionalLight position={[pLightX, pLightY, pLightZ]} intensity={dIntensiity} />
        <DroneSwarm
          color={color}
          roughness={roughness}
          metalness={metalness}
          clearcoat={clearcoat}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          ref={swarmRef}
          initialCount={count}
          formation={formation}
          deltaGroupSize={deltaGroupSize}
          onUpdatePositions={setDronePositions}
          cameraRef={cameraRef}
          povMode={povMode}
          povIndex={povIndex}
          onTelemetryUpdate={handleTelemetryUpdate}
        />
        <CameraController
          view={view}
          droneCount={count}
          dronePositions={dronePositions}
          povMode={povMode}
          povIndex={povIndex}
        />
        <group position={[0, 0, 0]}>
          <axesHelper args={[135]} />
        </group>
        <Grid 
          position={[0, 0, 0]} 
          args={[500, 500]}  // [width, height]
          cellSize={5}      // bigger = coarser grain
          cellThickness={1}
          sectionSize={20}
          sectionThickness={2}
          fadeDistance={500}
          fadeStrength={2}
        />
        <Stats />
      </Canvas>

       {telemetry[povIndex] && (
        <div className="telemetry-box">
          <h4>Drone #</h4> 
          <input type='number' min='0' max={count-1} step='1' value={povIndex} 
          onChange={e=>{
                let d = (e.target.value).toString()
                if (/^0\d+/.test(d)) {
                  d = d.replace(/^0+/, '')
                }
                
                if(!/^\d+$/.test(d) || d > count-1){

                  setPovIndex(povIndex) 
                } 
                else{
                  setPovIndex(d)
                }
                }
              }
            />
          <button style={{marginLeft:'.35rem'}} onClick={()=>setPovMode(!povMode)}>{povMode ? 'Exit' : 'Enter'} POV Mode</button>
          
          <button onClick={()=>povIndex-1  < 0 ? null : setPovIndex(povIndex-1)} style={{marginLeft:'5.5rem'}}>Back</button>
          <button onClick={()=>povIndex+1  > count ? null :setPovIndex(povIndex+1)} style={{marginLeft:'1rem'}}>Forward</button>
          <br/>
          <br/>
          <h4>Drone {povIndex} Telemetry:</h4>
          <pre>{JSON.stringify(telemetry[povIndex], null, 2)}</pre>
        </div>
      )}
    </div>
    </>
  )
}
