'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

const PRESETS = [
  { id: 'tl', label: 'Top Left' },
  { id: 'tc', label: 'Top Mid' },
  { id: 'tr', label: 'Top Right' },
  { id: 'ml', label: 'Mid Left' },
  { id: 'mc', label: 'Center' },
  { id: 'mr', label: 'Mid Right' },
  { id: 'bl', label: 'Bot Left' },
  { id: 'bc', label: 'Bot Mid' },
  { id: 'br', label: 'Bot Right' },
]

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pfpInputRef = useRef<HTMLInputElement>(null)
  const pfpImgRef = useRef<HTMLImageElement | null>(null)
  const logoImgRef = useRef<HTMLImageElement | null>(null)

  const [pfpName, setPfpName] = useState('')
  const [hasCanvas, setHasCanvas] = useState(false)
  const [circleMode, setCircleMode] = useState(false)
  const [dragMode, setDragMode] = useState(true)
  const [preset, setPreset] = useState('tr')
  const [logoSize, setLogoSize] = useState(22)
  const [logoOpacity, setLogoOpacity] = useState(100)
  const [logoPadding, setLogoPadding] = useState(5)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [status, setStatus] = useState('Awaiting input')
  const [statusActive, setStatusActive] = useState(false)

  const logoPos = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const dragOff = useRef({ x: 0, y: 0 })

  const showToast = (msg: string) => {
    setToast(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }

  const getLogoPixelSize = useCallback((canvas: HTMLCanvasElement) => {
    const logo = logoImgRef.current
    const s = Math.min(canvas.width, canvas.height) * (logoSize / 100)
    const aspect = logo ? logo.width / logo.height : 1
    return { w: s * aspect, h: s }
  }, [logoSize])

  const computePresetPos = useCallback((canvas: HTMLCanvasElement, pos: string) => {
    const pad = logoPadding / 100
    const { w, h } = getLogoPixelSize(canvas)
    const wf = w / canvas.width
    const hf = h / canvas.height
    const map: Record<string, [number, number]> = {
      tl: [pad, pad],
      tc: [0.5 - wf / 2, pad],
      tr: [1 - wf - pad, pad],
      ml: [pad, 0.5 - hf / 2],
      mc: [0.5 - wf / 2, 0.5 - hf / 2],
      mr: [1 - wf - pad, 0.5 - hf / 2],
      bl: [pad, 1 - hf - pad],
      bc: [0.5 - wf / 2, 1 - hf - pad],
      br: [1 - wf - pad, 1 - hf - pad],
    }
    const [x, y] = map[pos] ?? [1 - wf - pad, pad]
    return { x, y }
  }, [logoPadding, getLogoPixelSize])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const pfp = pfpImgRef.current
    if (!canvas || !pfp) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const SIZE = 1000
    canvas.width = SIZE
    canvas.height = SIZE
    ctx.clearRect(0, 0, SIZE, SIZE)

    if (circleMode) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2)
      ctx.clip()
    }

    ctx.drawImage(pfp, 0, 0, SIZE, SIZE)

    if (circleMode) ctx.restore()

    const logo = logoImgRef.current
    if (logo) {
      const { w, h } = getLogoPixelSize(canvas)
      const lx = logoPos.current.x * SIZE
      const ly = logoPos.current.y * SIZE
      ctx.globalAlpha = logoOpacity / 100
      ctx.drawImage(logo, lx, ly, w, h)
      ctx.globalAlpha = 1
    }

    setHasCanvas(true)
    setStatusActive(true)
    setStatus(circleMode ? 'Circle crop active' : 'Ready to export')
  }, [circleMode, getLogoPixelSize, logoOpacity])

  // Load logo on mount (baked-in official logo)
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      logoImgRef.current = img
      if (pfpImgRef.current && canvasRef.current) {
        const pos = computePresetPos(canvasRef.current, preset)
        logoPos.current = pos
        draw()
      }
    }
    img.src = '/ritual-logo.jpg'
  }, []) // eslint-disable-line

  // Redraw when settings change
  useEffect(() => {
    if (!pfpImgRef.current || !canvasRef.current) return
    const pos = computePresetPos(canvasRef.current, preset)
    logoPos.current = pos
    draw()
  }, [preset, logoSize, logoOpacity, logoPadding, circleMode, draw, computePresetPos])

  const loadPfp = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        pfpImgRef.current = img
        setPfpName(file.name)
        if (canvasRef.current) {
          const pos = computePresetPos(canvasRef.current, preset)
          logoPos.current = pos
        }
        draw()
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) loadPfp(file)
  }

  // Canvas drag logic
  const canvasCoords = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const isOverLogo = (px: number, py: number) => {
    const canvas = canvasRef.current
    if (!canvas || !logoImgRef.current) return false
    const { w, h } = getLogoPixelSize(canvas)
    const lx = logoPos.current.x * canvas.width
    const ly = logoPos.current.y * canvas.height
    return px >= lx && px <= lx + w && py >= ly && py <= ly + h
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onMouseDown = (e: MouseEvent) => {
      if (!dragMode || !logoImgRef.current) return
      const { x, y } = canvasCoords(e)
      if (isOverLogo(x, y)) {
        isDragging.current = true
        dragOff.current = {
          x: x - logoPos.current.x * canvas.width,
          y: y - logoPos.current.y * canvas.height,
        }
        canvas.classList.add('dragging')
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const { x, y } = canvasCoords(e)
      const { w, h } = getLogoPixelSize(canvas)
      logoPos.current = {
        x: Math.max(0, Math.min(1 - w / canvas.width, (x - dragOff.current.x) / canvas.width)),
        y: Math.max(0, Math.min(1 - h / canvas.height, (y - dragOff.current.y) / canvas.height)),
      }
      draw()
    }

    const onMouseUp = () => {
      isDragging.current = false
      canvas.classList.remove('dragging')
    }

    const onTouchStart = (e: TouchEvent) => {
      if (!dragMode || !logoImgRef.current) return
      e.preventDefault()
      const { x, y } = canvasCoords(e)
      if (isOverLogo(x, y)) {
        isDragging.current = true
        dragOff.current = {
          x: x - logoPos.current.x * canvas.width,
          y: y - logoPos.current.y * canvas.height,
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return
      e.preventDefault()
      const { x, y } = canvasCoords(e)
      const { w, h } = getLogoPixelSize(canvas)
      logoPos.current = {
        x: Math.max(0, Math.min(1 - w / canvas.width, (x - dragOff.current.x) / canvas.width)),
        y: Math.max(0, Math.min(1 - h / canvas.height, (y - dragOff.current.y) / canvas.height)),
      }
      draw()
    }

    const onTouchEnd = () => { isDragging.current = false }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [dragMode, draw, getLogoPixelSize]) // eslint-disable-line

  const handleDownload = () => {
    if (!pfpImgRef.current) { showToast('Upload a profile picture first'); return }
    draw()
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'ritual-pfp.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    showToast('Ritual PFP downloaded! 🔮')
  }

  const handleCopy = async () => {
    if (!pfpImgRef.current) { showToast('Upload a profile picture first'); return }
    draw()
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        showToast('Copied to clipboard!')
      })
    } catch {
      showToast('Copy not supported — use download instead')
    }
  }

  const handleShare = () => {
    if (!pfpImgRef.current) { showToast('Upload a profile picture first'); return }
    const text = encodeURIComponent('Just ritualized my PFP with @ritual_net 🔮 Join the ritual → ritual.net #Ritual')
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  return (
    <main className="min-h-screen relative">
      {/* Background layers */}
      <div className="fixed inset-0 grid-bg pointer-events-none z-0" />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
          opacity: 0.4,
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        {/* Header */}
        <header className="py-10 mb-12" style={{ borderBottom: '1px solid #27272A' }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 bg-white flex items-center justify-center text-black text-xs font-bold"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              >R</div>
              <div>
                <div className="text-white font-bold tracking-widest uppercase text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Ritual</div>
                <div className="text-xs tracking-widest uppercase" style={{ color: '#A1A1AA', fontFamily: 'Space Mono, monospace' }}>PFP Maker</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs tracking-widest uppercase px-3 py-1" style={{ border: '1px solid #27272A', color: '#A1A1AA', fontFamily: 'Space Mono, monospace' }}>
                Community Tool
              </span>
              <span className="flex items-center gap-2 text-xs tracking-widest uppercase px-2 py-1" style={{ border: '1px solid #27272A', color: '#A1A1AA', fontFamily: 'Space Mono, monospace' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse inline-block" />
                Live
              </span>
            </div>
          </div>
        </header>

        <div className="grid gap-6" style={{ gridTemplateColumns: 'clamp(300px,380px,100%) 1fr' }}>
          {/* Left panel */}
          <div className="flex flex-col gap-5">

            {/* Upload PFP */}
            <div className="p-7" style={{ background: '#111111', border: '1px solid #27272A' }}>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs tracking-widest uppercase" style={{ color: '#A1A1AA', fontFamily: 'Space Mono, monospace' }}>01 — Profile Picture</span>
                <div className="flex-1 h-px" style={{ background: '#27272A' }} />
              </div>
              <div
                className="relative p-7 text-center cursor-pointer transition-all"
                style={{ border: `1px dashed ${pfpName ? '#fff' : '#27272A'}`, background: '#0A0A0A' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => pfpInputRef.current?.click()}
              >
                <input
                  ref={pfpInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) loadPfp(f) }}
                />
                <div className="w-8 h-8 mx-auto mb-3 flex items-center justify-center text-base" style={{ border: '1px solid #27272A' }}>⬆</div>
                <div className="text-sm" style={{ color: '#A1A1AA', fontFamily: 'Space Mono, monospace' }}>
                  {pfpName ? `✓ ${pfpName}` : 'Upload your PFP'}
                </div>
                <div className="text-xs mt-1.5" style={{ color: '#52525B', fontFamily: 'Space Mono, monospace' }}>
                  PNG, JPG, WEBP · drag & drop or click
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="p-7" style={{ background: '#111111', border: '1px solid #27272A' }}>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs tracking-widest uppercase" style={{ color: '#A1A1AA', fontFamily: 'Space Mono, monospace' }}>02 — Customize</span>
                <div className="flex-1 h-px" style={{ background: '#27272A' }} />
              </div>

              {/* Position presets */}
              <div className="text-xs tracking-widest uppercase mb-3" style={{ color: '#A1A1AA', fontFamily: 'Space Mono, monospace' }}>Logo Position</div>
              <div className="grid grid-cols-3 gap-1.5 mb-5">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p.id)}
                    className="py-2 px-1 text-center transition-all text-xs tracking-wider uppercase"
                    style={{
                      fontFamily: 'Space Mono, monospace',
                      background: preset === p.id ? '#fff' : '#0A0A0A',
                      color: preset === p.id ? '#000' : '#A1A1AA',
                      border: `1px solid ${preset === p.id ? '#fff' : '#27272A'}`,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="h-px mb-5" style={{ background: '#27272A' }} />

              {/* Sliders */}
              {[
                { label: 'Logo Size', value: logoSize, setValue: setLogoSize, min: 5, max: 60, unit: '%' },
                { label: 'Logo Opacity', value: logoOpacity, setValue: setLogoOpacity, min: 10, max: 100, unit: '%' },
                { label: 'Padding', value: logoPadding, setValue: setLogoPadding, min: 0, max: 15, unit: '%' },
              ].map((s) => (
                <div key={s.label} className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs" style={{ color: '#A1A1AA', fontFamily: 'Space Mono, monospace' }}>{s.label}</span>
                    <span className="text-xs text-white" style={{ fontFamily: 'Space Mono, monospace' }}>{s.value}{s.unit}</span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    value={s.value}
                    onChange={(e) => s.setValue(Number(e.target.value))}
                  />
                </div>
              ))}

              <div className="h-px my-5" style={{ background: '#27272A' }} />

              {/* Toggles */}
              {[
                { label: 'Circular crop (X/Twitter)', value: circleMode, toggle: () => setCircleMode(v => !v) },
                { label: 'Drag to reposition', value: dragMode, toggle: () => setDragMode(v => !v) },
              ].map((t) => (
                <div key={t.label} className="flex items-center justify-between mb-3">
                  <span className="text-xs" style={{ color: '#A1A1AA', fontFamily: 'Space Mono, monospace' }}>{t.label}</span>
                  <div
                    onClick={t.toggle}
                    className="w-9 h-5 relative cursor-pointer transition-colors"
                    style={{ background: t.value ? '#fff' : '#27272A', border: '1px solid #27272A' }}
                  >
                    <div
                      className="absolute top-0.5 w-3.5 h-3.5 transition-all"
                      style={{ background: t.value ? '#000' : '#71717A', left: t.value ? '18px' : '2px' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Export */}
            <div className="p-7" style={{ background: '#111111', border: '1px solid #27272A' }}>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs tracking-widest uppercase" style={{ color: '#A1A1AA', fontFamily: 'Space Mono, monospace' }}>03 — Export</span>
                <div className="flex-1 h-px" style={{ background: '#27272A' }} />
              </div>

              <button
                onClick={handleDownload}
                className="w-full py-4 font-bold tracking-widest uppercase text-sm relative overflow-hidden transition-all hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: '#fff', color: '#000', border: 'none', fontFamily: 'Syne, sans-serif' }}
              >
                ✦ &nbsp;Ritualize My PFP
              </button>

              <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                <button
                  onClick={handleCopy}
                  className="py-3 text-xs tracking-widest uppercase transition-all hover:text-white"
                  style={{ background: 'transparent', border: '1px solid #27272A', color: '#A1A1AA', fontFamily: 'Space Mono, monospace' }}
                >
                  ◻ Copy Image
                </button>
                <button
                  onClick={handleShare}
                  className="py-3 text-xs tracking-widest uppercase transition-all hover:text-white"
                  style={{ background: 'transparent', border: '1px solid #27272A', color: '#A1A1AA', fontFamily: 'Space Mono, monospace' }}
                >
                  ↗ Share on X
                </button>
              </div>
            </div>
          </div>

          {/* Right preview */}
          <div className="sticky top-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs tracking-widest uppercase" style={{ color: '#A1A1AA', fontFamily: 'Space Mono, monospace' }}>Live Preview</span>
              <div className="flex-1 h-px" style={{ background: '#27272A' }} />
            </div>

            <div
              className="relative flex items-center justify-center min-h-96 overflow-hidden"
              style={{ background: '#0A0A0A', border: '1px solid #27272A' }}
            >
              {!hasCanvas && (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div
                    className="w-16 h-16 flex items-center justify-center text-2xl opacity-40"
                    style={{
                      border: '1px solid #27272A',
                      background: '#111',
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    }}
                  >◈</div>
                  <p className="text-xs tracking-widest uppercase opacity-40" style={{ color: '#A1A1AA', fontFamily: 'Space Mono, monospace' }}>
                    Your ritualized PFP appears here
                  </p>
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[480px] block"
                style={{ display: hasCanvas ? 'block' : 'none' }}
              />
            </div>

            {/* Status bar */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ background: '#0A0A0A', border: '1px solid #27272A', borderTop: 'none' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ background: statusActive ? '#22C55E' : '#52525B' }}
                />
                <span className="text-xs tracking-wider" style={{ color: '#A1A1AA', fontFamily: 'Space Mono, monospace' }}>{status}</span>
              </div>
              <span className="text-xs" style={{ color: '#A1A1AA', fontFamily: 'Space Mono, monospace' }}>1000×1000px</span>
            </div>

            {/* Hint box */}
            <div className="mt-3 p-4" style={{ border: '1px solid #27272A', background: '#0A0A0A' }}>
              <div className="text-xs tracking-widest uppercase mb-2" style={{ color: '#A1A1AA', fontFamily: 'Space Mono, monospace' }}>Instructions</div>
              <div className="text-xs leading-relaxed" style={{ color: '#52525B', fontFamily: 'Space Mono, monospace' }}>
                → Upload your PFP above<br />
                → Official Ritual logo loads automatically<br />
                → Click &amp; drag logo on canvas to reposition<br />
                → Toggle circle crop for X/Twitter<br />
                → Hit &ldquo;Ritualize My PFP&rdquo; to download
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastVisible && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 text-sm tracking-wider toast-enter z-50"
          style={{ background: '#fff', color: '#000', fontFamily: 'Space Mono, monospace' }}
        >
          {toast}
        </div>
      )}
    </main>
  )
}
