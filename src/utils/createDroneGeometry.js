import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils'

export function createDroneGeometry() {
  const parts = []

  // === BODY ===
  const body = new THREE.SphereGeometry(0.5, 32, 32)
  body.scale(1.4, 0.35, 2.5) // capsule-like
  parts.push(body)

  // === ARM + MOTOR MOUNT + PROPELLER (repeat per corner) ===
  const armLength = 2.2
  const armRadius = 0.04
  const motorRadius = 0.15
  const propSize = [0.9, 0.05, 0.15]

  const positions = [
    [1.5, 0, 1.5],
    [-1.5, 0, 1.5],
    [1.5, 0, -1.5],
    [-1.5, 0, -1.5],
  ]

  positions.forEach(([x, y, z]) => {
  // Arm: from body to motor mount
  const arm = new THREE.CylinderGeometry(armRadius, armRadius, armLength, 12)
  const armDir = new THREE.Vector3(x, 0, z).normalize()
  const armMid = armDir.clone().multiplyScalar(armLength / 2)

  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), // cylinder default Y axis
    armDir
  )

arm.applyQuaternion(quaternion)
arm.translate(armMid.x, 0, armMid.z)
parts.push(arm)

    // Motor mount
    const motor = new THREE.CylinderGeometry(motorRadius, motorRadius, 0.25, 16)
    motor.translate(x, 0.05, z)
    parts.push(motor)

    // Propeller
    const blade = new THREE.BoxGeometry(...propSize)
    // blade.translate(x, 0.23, z)
    // parts.push(blade)
  })

  // === CAMERA POD (rounded, hanging) ===
  const camera = new THREE.SphereGeometry(0.15, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2)
  camera.rotateX(Math.PI) // point the rounded side down
  camera.translate(0, -0.17, 0) // hang off the front of the longer body
  parts.push(camera)


  // === LANDING LEGS ===
  const legHeight = 0.4
  const legSpread = 0.5
  const legWidth = 0.05

  const leg1 = new THREE.BoxGeometry(legWidth, legHeight, legWidth)
  leg1.translate(-legSpread, -0.2, -0.6)
  parts.push(leg1)

  const leg2 = leg1.clone()
  leg2.translate(legSpread * 2, 0, 0)
  parts.push(leg2)

  const leg3 = new THREE.BoxGeometry(legWidth, legHeight, legWidth)
  leg3.translate(-legSpread, -0.2, 0.6)
  parts.push(leg3)

  const leg4 = leg3.clone()
  leg4.translate(legSpread * 2, 0, 0)
  parts.push(leg4)

  return mergeGeometries(parts)
}
