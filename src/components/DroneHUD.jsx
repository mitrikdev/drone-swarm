import React from 'react'

export default function DroneHUD({ telemetry }) {
  if (!telemetry) return null

  const { id, position, signal, battery } = telemetry

  return (
    <div className="drone-hud">
      <h3>Drone ID: {id.toString().padStart(3, '0')}</h3>
      <hr />
      <div>
        <strong>📍 Position</strong>
        <div>X: {+position.x > 0 ? '+' : ''}{(+position.x).toFixed(2)}</div>
        <div>Y: {+position.y > 0 ? '+' : ''}{(+position.y).toFixed(2)}</div>
        <div>Z: {+position.z > 0 ? '+' : ''}{(+position.z).toFixed(2)}</div>
      </div>
      <div>📶 Signal: {signal}%</div>
      <div>🔋 Battery: {battery}%</div>
      <div className="battery-bar">
        <div
          className="battery-fill"
          style={{ width: `${battery}%` }}
        />
      </div>
    </div>
  )
}
