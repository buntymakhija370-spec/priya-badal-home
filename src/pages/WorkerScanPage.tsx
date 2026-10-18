import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { BackLink } from '../components/workshop/WorkshopUi'
import { scanWorkshopBarcode, type WorkshopAuth } from '../lib/workshopClient'
import { stageLabel } from '../lib/workshopTypes'
import './WorkersApp.css'

type Ctx = { auth: WorkshopAuth | null }

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
}

export function WorkerScanPage() {
  const { auth } = useOutletContext<Ctx>()
  const navigate = useNavigate()
  const workerId = auth?.role === 'worker' ? auth.workerId : ''

  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningRef = useRef(false)

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  async function claim(barcode: string) {
    if (!workerId || !barcode.trim()) return
    setBusy(true)
    setMsg(null)
    try {
      const result = await scanWorkshopBarcode({ barcode: barcode.trim(), workerId })
      setMsg(result.message)
      setTimeout(() => {
        navigate(`/workers/home/job/${result.order.id}/${result.stage.stageId}`, { replace: true })
      }, 500)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Scan failed')
      setBusy(false)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    await claim(code)
  }

  async function startCamera() {
    setCameraError(null)
    const Detector = (window as unknown as { BarcodeDetector?: new (opts?: { formats: string[] }) => BarcodeDetectorLike })
      .BarcodeDetector
    if (!Detector) {
      setCameraError('Camera barcode scan needs Chrome / Edge. Use a USB scanner or type the code.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      setCameraOn(true)
      await new Promise((r) => setTimeout(r, 50))
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      const detector = new Detector({ formats: ['code_128', 'qr_code', 'code_39'] })
      scanningRef.current = true
      const tick = async () => {
        if (!scanningRef.current || !videoRef.current) return
        try {
          const codes = await detector.detect(videoRef.current)
          const value = codes[0]?.rawValue
          if (value) {
            scanningRef.current = false
            setCode(value)
            stopCamera()
            await claim(value)
            return
          }
        } catch {
          /* keep trying */
        }
        if (scanningRef.current) requestAnimationFrame(() => void tick())
      }
      requestAnimationFrame(() => void tick())
    } catch {
      setCameraError('Could not open camera — allow permission, or type the barcode.')
      setCameraOn(false)
    }
  }

  function stopCamera() {
    scanningRef.current = false
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOn(false)
  }

  if (!auth || auth.role !== 'worker') return null

  return (
    <main className="ws-detail">
      <header className="ws-detail-head">
        <BackLink to="/workers/home" label="My jobs" />
        <div>
          <h2>Scan barcode</h2>
          <p className="ws-muted">
            Scan the department label stuck on the job to claim that work as {auth.name.split(' ')[0]}.
          </p>
        </div>
      </header>

      {msg && <p className="ws-banner">{msg}</p>}

      <section className="ws-panel ws-panel--actions">
        <h3>Barcode / scanner</h3>
        <p className="ws-muted">
          USB / Bluetooth scanners work like a keyboard — click the box and scan. Or type the code from
          the label (example: <code>PB|PBH-2403|EDG</code>).
        </p>
        <form className="ws-form" onSubmit={(e) => void onSubmit(e)}>
          <label>
            Code
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="PB|PBH-2403|EDG"
              disabled={busy}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button type="submit" className="ws__primary" disabled={busy || !code.trim()}>
            {busy ? 'Claiming…' : 'Claim work'}
          </button>
        </form>
      </section>

      <section className="ws-panel">
        <h3>Phone camera</h3>
        {!cameraOn ? (
          <button type="button" className="ws__secondary" onClick={() => void startCamera()}>
            Open camera scanner
          </button>
        ) : (
          <div className="ws-scan-cam">
            <video ref={videoRef} playsInline muted className="ws-scan-cam__video" />
            <button type="button" className="ws__secondary" onClick={stopCamera}>
              Stop camera
            </button>
          </div>
        )}
        {cameraError && <p className="ws-banner ws-banner--error">{cameraError}</p>}
      </section>

      <section className="ws-panel">
        <h3>How it works</h3>
        <ol className="ws-steps">
          <li>Manager posts order and prints department barcodes.</li>
          <li>Stick the matching label on the panel / job sheet.</li>
          <li>Worker scans → work is assigned to them → open job screen.</li>
          <li>Start work, post status, mark stage complete.</li>
        </ol>
        <p className="ws-muted">Departments: {['DSN', 'CUT', 'EDG', 'BOR', 'PNT', 'LTH', 'OXD'].join(' · ')}</p>
        <p className="ws-muted">
          Your role:{' '}
          {auth.workerRole === 'multi' ? 'Multi' : stageLabel(auth.workerRole as 'designing')}
        </p>
      </section>
    </main>
  )
}
