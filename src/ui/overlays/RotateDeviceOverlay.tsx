export function RotateDeviceOverlay() {
  return (
    <div className="rotate-device-overlay" role="status" aria-label="Please rotate your device">
      <div className="rotate-device-content">
        <div className="rotate-device-icon">📱</div>
        <div className="rotate-device-arrow">↻</div>
        <h2 className="rotate-device-title">ROTATE DEVICE</h2>
        <p className="rotate-device-text">
          This mission is optimized for landscape mode.
        </p>
      </div>
    </div>
  )
}
