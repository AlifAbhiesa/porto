"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"

// ─── Hardcoded Data ──────────────────────────────────────────────────────────

const SENTENCES = [
  {
    text: "The cat sat on the mat",
    tokens: ["The", "cat", "sat", "on", "the", "mat"],
  },
  {
    text: "A dog played in the park",
    tokens: ["A", "dog", "played", "in", "the", "park"],
  },
  {
    text: "The kitten rested on the rug",
    tokens: ["The", "kitten", "rested", "on", "the", "rug"],
  },
  {
    text: "Machine learning transforms data",
    tokens: ["Machine", "learning", "transforms", "data"],
  },
  {
    text: "Deep learning processes information",
    tokens: ["Deep", "learning", "processes", "information"],
  },
]

// 8D sentence embeddings (crafted so similar sentences have high cosine similarity)
const SENTENCE_EMBEDDINGS: number[][] = [
  [0.82, 0.61, 0.12, -0.31, 0.88, -0.21, 0.41, 0.09],  // cat on mat
  [0.71, 0.49, 0.33, -0.11, 0.58, 0.22, 0.53, -0.18],   // dog in park
  [0.79, 0.58, 0.14, -0.27, 0.85, -0.17, 0.44, 0.07],   // kitten on rug (similar to 0)
  [0.11, -0.29, 0.81, 0.72, -0.18, 0.62, -0.12, 0.88],  // ML
  [0.14, -0.24, 0.77, 0.67, -0.14, 0.57, -0.07, 0.84],  // DL (similar to 3)
]

// Per-token 4D embeddings for the first sentence (for attention demo)
const TOKEN_EMBED_DIM = 4
const TOKEN_EMBEDDINGS: Record<number, number[][]> = {
  0: [ // "The cat sat on the mat"
    [0.1, 0.3, -0.2, 0.5],   // The
    [0.9, 0.7, 0.1, -0.3],   // cat
    [0.2, -0.1, 0.8, 0.4],   // sat
    [0.0, 0.2, -0.1, 0.6],   // on
    [0.1, 0.3, -0.2, 0.5],   // the
    [-0.2, 0.5, 0.3, 0.8],   // mat
  ],
  1: [
    [0.1, 0.2, -0.1, 0.4],
    [0.8, 0.6, 0.2, -0.2],
    [0.3, -0.2, 0.7, 0.5],
    [0.0, 0.1, -0.1, 0.5],
    [0.1, 0.3, -0.2, 0.5],
    [0.1, 0.4, 0.6, 0.7],
  ],
  2: [
    [0.1, 0.3, -0.2, 0.5],
    [0.85, 0.65, 0.15, -0.25],
    [0.15, -0.05, 0.75, 0.45],
    [0.0, 0.2, -0.1, 0.6],
    [0.1, 0.3, -0.2, 0.5],
    [-0.15, 0.45, 0.35, 0.75],
  ],
  3: [
    [0.6, -0.3, 0.7, 0.2],
    [0.4, 0.8, -0.1, 0.6],
    [0.3, 0.1, 0.9, -0.2],
    [0.7, -0.4, 0.2, 0.5],
  ],
  4: [
    [0.5, -0.2, 0.6, 0.3],
    [0.4, 0.8, -0.1, 0.6],
    [0.2, 0.0, 0.8, -0.1],
    [0.6, -0.3, 0.3, 0.4],
  ],
}

// Weight matrices for Q, K, V (4x4)
const W_Q = [
  [0.5, -0.2, 0.3, 0.1],
  [0.1, 0.6, -0.1, 0.4],
  [-0.3, 0.2, 0.7, -0.2],
  [0.2, -0.1, 0.1, 0.5],
]

const W_K = [
  [0.4, 0.1, -0.2, 0.3],
  [-0.1, 0.5, 0.2, -0.1],
  [0.3, -0.3, 0.6, 0.1],
  [0.1, 0.2, -0.1, 0.4],
]

const W_V = [
  [0.3, -0.1, 0.2, 0.4],
  [0.2, 0.4, -0.3, 0.1],
  [-0.1, 0.3, 0.5, -0.2],
  [0.4, -0.2, 0.1, 0.3],
]

// ─── Math Helpers ────────────────────────────────────────────────────────────

function matMul(a: number[][], b: number[][]): number[][] {
  const rows = a.length
  const cols = b[0].length
  const k = b.length
  const result: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0))
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      for (let p = 0; p < k; p++) {
        result[i][j] += a[i][p] * b[p][j]
      }
    }
  }
  return result
}

function softmaxRow(row: number[]): number[] {
  const max = Math.max(...row)
  const exps = row.map((v) => Math.exp(v - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((v) => v / sum)
}

function transpose(m: number[][]): number[][] {
  return m[0].map((_, j) => m.map((row) => row[j]))
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

function computeAttention(tokenEmbeds: number[][]) {
  const Q = matMul(tokenEmbeds, W_Q)
  const K = matMul(tokenEmbeds, W_K)
  const V = matMul(tokenEmbeds, W_V)

  const dK = Math.sqrt(TOKEN_EMBED_DIM)
  const scores = matMul(Q, transpose(K)).map((row) => row.map((v) => v / dK))
  const attentionWeights = scores.map(softmaxRow)
  const output = matMul(attentionWeights, V)

  return { Q, K, V, scores, attentionWeights, output }
}

// ─── Color Helpers ───────────────────────────────────────────────────────────

function valueToColor(v: number, min: number, max: number): string {
  const t = max === min ? 0.5 : (v - min) / (max - min)
  // Blue (cold) -> White -> Red (hot)
  if (t < 0.5) {
    const s = t * 2
    const r = Math.round(59 + s * 196)
    const g = Math.round(130 + s * 125)
    const b = Math.round(246 - s * 20)
    return `rgb(${r},${g},${b})`
  } else {
    const s = (t - 0.5) * 2
    const r = 255
    const g = Math.round(255 - s * 175)
    const b = Math.round(226 - s * 160)
    return `rgb(${r},${g},${b})`
  }
}

function attentionToColor(v: number): string {
  // 0 = transparent blue, 1 = solid violet
  const r = Math.round(109 + v * 30)
  const g = Math.round(40 + v * 20)
  const b = Math.round(217 + v * 38)
  const a = 0.15 + v * 0.85
  return `rgba(${r},${g},${b},${a})`
}

// ─── 3D Canvas Matrix Renderer ───────────────────────────────────────────────

interface Matrix3DProps {
  matrix: number[][]
  rowLabels?: string[]
  colLabels?: string[]
  title: string
  width?: number
  height?: number
  colorMode?: "diverging" | "attention"
}

function Matrix3DCanvas({ matrix, rowLabels, colLabels, title, width = 380, height = 320, colorMode = "diverging" }: Matrix3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotRef = useRef({ x: -0.5, y: 0.6 })
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.clearRect(0, 0, width, height)

    const rows = matrix.length
    const cols = matrix[0].length
    const cellSize = Math.min(36, 200 / Math.max(rows, cols))
    const rx = rotRef.current.x
    const ry = rotRef.current.y

    const cosY = Math.cos(ry), sinY = Math.sin(ry)
    const cosX = Math.cos(rx), sinX = Math.sin(rx)

    const allVals = matrix.flat()
    const minVal = Math.min(...allVals)
    const maxVal = Math.max(...allVals)

    function project(x: number, y: number, z: number): { px: number; py: number; depth: number } {
      const x1 = x * cosY - z * sinY
      const z1 = x * sinY + z * cosY
      const y1 = y * cosX - z1 * sinX
      const z2 = y * sinX + z1 * cosX
      const scale = 400 / (400 + z2)
      return {
        px: width / 2 + x1 * scale,
        py: height / 2 + y1 * scale,
        depth: z2,
      }
    }

    // Collect cells with depth for z-sorting
    const cells: { r: number; c: number; depth: number }[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - cols / 2) * cellSize
        const y = (r - rows / 2) * cellSize
        const val = matrix[r][c]
        const z = colorMode === "attention" ? val * 30 : val * 25
        const p = project(x, y, z)
        cells.push({ r, c, depth: p.depth })
      }
    }
    cells.sort((a, b) => b.depth - a.depth)

    // Draw cells
    for (const { r, c } of cells) {
      const x = (c - cols / 2) * cellSize
      const y = (r - rows / 2) * cellSize
      const val = matrix[r][c]
      const z = colorMode === "attention" ? val * 30 : val * 25
      const barHeight = Math.abs(val) * (colorMode === "attention" ? 20 : 15)

      const p0 = project(x - cellSize * 0.4, y - cellSize * 0.4, z)
      const p1 = project(x + cellSize * 0.4, y - cellSize * 0.4, z)
      const p2 = project(x + cellSize * 0.4, y + cellSize * 0.4, z)
      const p3 = project(x - cellSize * 0.4, y + cellSize * 0.4, z)

      const color = colorMode === "attention"
        ? attentionToColor(val)
        : valueToColor(val, minVal, maxVal)

      // Top face
      ctx.beginPath()
      ctx.moveTo(p0.px, p0.py)
      ctx.lineTo(p1.px, p1.py)
      ctx.lineTo(p2.px, p2.py)
      ctx.lineTo(p3.px, p3.py)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = "rgba(0,0,0,0.15)"
      ctx.lineWidth = 0.5
      ctx.stroke()

      // Right side
      if (barHeight > 1) {
        const pb0 = project(x + cellSize * 0.4, y - cellSize * 0.4, z - barHeight)
        const pb1 = project(x + cellSize * 0.4, y + cellSize * 0.4, z - barHeight)
        ctx.beginPath()
        ctx.moveTo(p1.px, p1.py)
        ctx.lineTo(p2.px, p2.py)
        ctx.lineTo(pb1.px, pb1.py)
        ctx.lineTo(pb0.px, pb0.py)
        ctx.closePath()
        ctx.fillStyle = color
        ctx.globalAlpha = 0.7
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.stroke()

        // Front side
        const pb2 = project(x - cellSize * 0.4, y + cellSize * 0.4, z - barHeight)
        ctx.beginPath()
        ctx.moveTo(p2.px, p2.py)
        ctx.lineTo(p3.px, p3.py)
        ctx.lineTo(pb2.px, pb2.py)
        ctx.lineTo(pb1.px, pb1.py)
        ctx.closePath()
        ctx.fillStyle = color
        ctx.globalAlpha = 0.5
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.stroke()
      }

      // Value label
      const center = project(x, y, z + 3)
      ctx.fillStyle = "#1C212B"
      ctx.font = `${Math.max(8, cellSize * 0.28)}px Inter, system-ui, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(val.toFixed(2), center.px, center.py)
    }

    // Title
    ctx.fillStyle = "#677084"
    ctx.font = "bold 13px Inter, system-ui, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(title, width / 2, 18)

    // Row labels
    if (rowLabels) {
      ctx.font = "11px Inter, system-ui, sans-serif"
      ctx.textAlign = "right"
      ctx.fillStyle = "#677084"
      for (let r = 0; r < rows; r++) {
        const y = (r - rows / 2) * cellSize
        const p = project(-cols / 2 * cellSize - 8, y, 0)
        ctx.fillText(rowLabels[r] || "", p.px, p.py)
      }
    }

    // Col labels
    if (colLabels) {
      ctx.font = "11px Inter, system-ui, sans-serif"
      ctx.textAlign = "center"
      ctx.fillStyle = "#677084"
      for (let c = 0; c < cols; c++) {
        const x = (c - cols / 2) * cellSize
        const p = project(x, -rows / 2 * cellSize - 12, 0)
        ctx.fillText(colLabels[c] || "", p.px, p.py)
      }
    }

    // Drag instruction
    ctx.fillStyle = "#aaa"
    ctx.font = "10px Inter, system-ui, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("drag to rotate", width / 2, height - 8)
  }, [matrix, width, height, colorMode, title, rowLabels, colLabels])

  useEffect(() => {
    draw()
  }, [draw])

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { dragging: true, lastX: e.clientX, lastY: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return
    const dx = e.clientX - dragRef.current.lastX
    const dy = e.clientY - dragRef.current.lastY
    rotRef.current.y += dx * 0.008
    rotRef.current.x += dy * 0.008
    dragRef.current.lastX = e.clientX
    dragRef.current.lastY = e.clientY
    draw()
  }
  const onPointerUp = () => {
    dragRef.current.dragging = false
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, cursor: "grab", touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  )
}

// ─── 3D Vector Space Visualization ───────────────────────────────────────────

// Project 8D embeddings to 3D using dims that best separate clusters
const VECTORS_3D = SENTENCE_EMBEDDINGS.map((e) => ({
  x: e[0],      // dim 0: animal(high) vs tech(low)
  y: e[3],      // dim 3: animal(neg) vs tech(pos)
  z: e[4],      // dim 4: animal(pos) vs tech(neg)
}))

const VECTOR_COLORS = ["#6d28d9", "#2563eb", "#a855f7", "#dc2626", "#f97316"]
const VECTOR_LABELS_SHORT = ["S1", "S2", "S3", "S4", "S5"]

interface VectorSpace3DProps {
  highlightA?: number
  highlightB?: number
  width?: number
  height?: number
}

function VectorSpace3D({ highlightA, highlightB, width = 480, height = 420 }: VectorSpace3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotRef = useRef({ x: -0.45, y: 0.7 })
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    const rx = rotRef.current.x
    const ry = rotRef.current.y
    const cosY = Math.cos(ry), sinY = Math.sin(ry)
    const cosX = Math.cos(rx), sinX = Math.sin(rx)

    const scale3D = 120

    function project(x: number, y: number, z: number): { px: number; py: number; depth: number } {
      const x1 = x * cosY - z * sinY
      const z1 = x * sinY + z * cosY
      const y1 = y * cosX - z1 * sinX
      const z2 = y * sinX + z1 * cosX
      const persp = 500 / (500 + z2)
      return {
        px: width / 2 + x1 * persp,
        py: height / 2 - y1 * persp,
        depth: z2,
      }
    }

    function drawArrowHead(ctx: CanvasRenderingContext2D, fromPx: number, fromPy: number, toPx: number, toPy: number, size: number) {
      const angle = Math.atan2(toPy - fromPy, toPx - fromPx)
      ctx.beginPath()
      ctx.moveTo(toPx, toPy)
      ctx.lineTo(toPx - size * Math.cos(angle - 0.4), toPy - size * Math.sin(angle - 0.4))
      ctx.lineTo(toPx - size * Math.cos(angle + 0.4), toPy - size * Math.sin(angle + 0.4))
      ctx.closePath()
      ctx.fill()
    }

    // ── Draw axis grid planes (subtle) ──
    const gridSteps = 5
    const gridMax = 1.0
    ctx.globalAlpha = 0.08
    ctx.strokeStyle = "#677084"
    ctx.lineWidth = 0.5
    for (let i = 0; i <= gridSteps; i++) {
      const t = (i / gridSteps) * gridMax * scale3D
      // XY plane (z=0) horizontal lines
      const a1 = project(0, t, 0), a2 = project(gridMax * scale3D, t, 0)
      ctx.beginPath(); ctx.moveTo(a1.px, a1.py); ctx.lineTo(a2.px, a2.py); ctx.stroke()
      // XY plane vertical lines
      const b1 = project(t, 0, 0), b2 = project(t, gridMax * scale3D, 0)
      ctx.beginPath(); ctx.moveTo(b1.px, b1.py); ctx.lineTo(b2.px, b2.py); ctx.stroke()
      // XZ plane (y=0) lines
      const c1 = project(0, 0, t), c2 = project(gridMax * scale3D, 0, t)
      ctx.beginPath(); ctx.moveTo(c1.px, c1.py); ctx.lineTo(c2.px, c2.py); ctx.stroke()
      const d1 = project(t, 0, 0), d2 = project(t, 0, gridMax * scale3D)
      ctx.beginPath(); ctx.moveTo(d1.px, d1.py); ctx.lineTo(d2.px, d2.py); ctx.stroke()
    }
    ctx.globalAlpha = 1

    // ── Draw axes ──
    const axisLen = 1.1 * scale3D
    const origin = project(0, 0, 0)

    const axes = [
      { end: project(axisLen, 0, 0), color: "#ef4444", label: "X (d0)" },
      { end: project(0, axisLen, 0), color: "#22c55e", label: "Y (d3)" },
      { end: project(0, 0, axisLen), color: "#3b82f6", label: "Z (d4)" },
    ]

    // Draw negative axis dashes
    const negAxes = [
      project(-axisLen * 0.5, 0, 0),
      project(0, -axisLen * 0.5, 0),
      project(0, 0, -axisLen * 0.5),
    ]
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1
    negAxes.forEach((neg, i) => {
      ctx.strokeStyle = axes[i].color
      ctx.globalAlpha = 0.3
      ctx.beginPath()
      ctx.moveTo(origin.px, origin.py)
      ctx.lineTo(neg.px, neg.py)
      ctx.stroke()
    })
    ctx.setLineDash([])
    ctx.globalAlpha = 1

    // Positive axes
    for (const axis of axes) {
      ctx.beginPath()
      ctx.moveTo(origin.px, origin.py)
      ctx.lineTo(axis.end.px, axis.end.py)
      ctx.strokeStyle = axis.color
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Axis arrow
      ctx.fillStyle = axis.color
      drawArrowHead(ctx, origin.px, origin.py, axis.end.px, axis.end.py, 8)

      // Axis label
      ctx.font = "bold 11px Inter, system-ui, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(axis.label, axis.end.px + (axis.end.px - origin.px) * 0.12, axis.end.py + (axis.end.py - origin.py) * 0.12)
    }

    // ── Origin dot ──
    ctx.beginPath()
    ctx.arc(origin.px, origin.py, 3, 0, Math.PI * 2)
    ctx.fillStyle = "#94a3b8"
    ctx.fill()

    // ── Collect vectors with depth for z-sorting ──
    const vectorsWithDepth = VECTORS_3D.map((v, i) => {
      const tip = project(v.x * scale3D, v.y * scale3D, v.z * scale3D)
      return { i, tip, depth: tip.depth }
    }).sort((a, b) => b.depth - a.depth)

    // ── Draw vectors ──
    for (const { i, tip } of vectorsWithDepth) {
      const isHighlighted = highlightA === i || highlightB === i
      const isAnyHighlighted = highlightA !== undefined && highlightB !== undefined
      const alpha = isAnyHighlighted ? (isHighlighted ? 1 : 0.2) : 0.85
      const lineWidth = isHighlighted ? 3 : 2

      ctx.globalAlpha = alpha

      // Dashed projection lines to planes
      ctx.setLineDash([3, 3])
      ctx.lineWidth = 0.7
      ctx.strokeStyle = VECTOR_COLORS[i]

      const v = VECTORS_3D[i]
      // Project to XY plane (drop z)
      const xyProj = project(v.x * scale3D, v.y * scale3D, 0)
      ctx.beginPath(); ctx.moveTo(tip.px, tip.py); ctx.lineTo(xyProj.px, xyProj.py); ctx.stroke()
      // Vertical line from XY projection to X axis
      const xProj = project(v.x * scale3D, 0, 0)
      ctx.beginPath(); ctx.moveTo(xyProj.px, xyProj.py); ctx.lineTo(xProj.px, xProj.py); ctx.stroke()

      ctx.setLineDash([])

      // Main vector arrow
      ctx.beginPath()
      ctx.moveTo(origin.px, origin.py)
      ctx.lineTo(tip.px, tip.py)
      ctx.strokeStyle = VECTOR_COLORS[i]
      ctx.lineWidth = lineWidth
      ctx.stroke()

      // Arrow head
      ctx.fillStyle = VECTOR_COLORS[i]
      drawArrowHead(ctx, origin.px, origin.py, tip.px, tip.py, isHighlighted ? 12 : 9)

      // Label
      const labelOffset = 14
      const dx = tip.px - origin.px
      const dy = tip.py - origin.py
      const mag = Math.sqrt(dx * dx + dy * dy) || 1
      const lx = tip.px + (dx / mag) * labelOffset
      const ly = tip.py + (dy / mag) * labelOffset

      ctx.font = `bold ${isHighlighted ? 13 : 11}px Inter, system-ui, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // Label background
      const labelText = VECTOR_LABELS_SHORT[i]
      const tm = ctx.measureText(labelText)
      const pad = 4
      ctx.fillStyle = "rgba(255,255,255,0.85)"
      ctx.fillRect(lx - tm.width / 2 - pad, ly - 7 - pad / 2, tm.width + pad * 2, 14 + pad)
      ctx.strokeStyle = VECTOR_COLORS[i]
      ctx.lineWidth = 1
      ctx.strokeRect(lx - tm.width / 2 - pad, ly - 7 - pad / 2, tm.width + pad * 2, 14 + pad)

      ctx.fillStyle = VECTOR_COLORS[i]
      ctx.fillText(labelText, lx, ly)

      // Dot at tip
      ctx.beginPath()
      ctx.arc(tip.px, tip.py, isHighlighted ? 5 : 3.5, 0, Math.PI * 2)
      ctx.fillStyle = VECTOR_COLORS[i]
      ctx.fill()
    }

    ctx.globalAlpha = 1

    // ── Draw angle arc between highlighted vectors ──
    if (highlightA !== undefined && highlightB !== undefined && highlightA !== highlightB) {
      const vA = VECTORS_3D[highlightA]
      const vB = VECTORS_3D[highlightB]
      const sim = cosineSimilarity(SENTENCE_EMBEDDINGS[highlightA], SENTENCE_EMBEDDINGS[highlightB])
      const angle = Math.acos(Math.min(1, Math.max(-1, sim)))

      // Draw arc in screen space
      const tipA = project(vA.x * scale3D, vA.y * scale3D, vA.z * scale3D)
      const tipB = project(vB.x * scale3D, vB.y * scale3D, vB.z * scale3D)
      const angleA = Math.atan2(tipA.py - origin.py, tipA.px - origin.px)
      const angleB = Math.atan2(tipB.py - origin.py, tipB.px - origin.px)

      ctx.beginPath()
      const arcR = 40
      // Draw arc from angleA to angleB (shorter path)
      let startAngle = angleA
      let endAngle = angleB
      let diff = endAngle - startAngle
      if (diff > Math.PI) diff -= 2 * Math.PI
      if (diff < -Math.PI) diff += 2 * Math.PI
      ctx.arc(origin.px, origin.py, arcR, startAngle, startAngle + diff, diff < 0)
      ctx.strokeStyle = "#f59e0b"
      ctx.lineWidth = 2
      ctx.stroke()

      // Angle label
      const midA = startAngle + diff / 2
      const angleDeg = (angle * 180 / Math.PI).toFixed(1)
      ctx.fillStyle = "#f59e0b"
      ctx.font = "bold 12px Inter, system-ui, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(`${angleDeg}°`, origin.px + (arcR + 18) * Math.cos(midA), origin.py + (arcR + 18) * Math.sin(midA))

      // Similarity label
      ctx.fillStyle = "#1C212B"
      ctx.font = "bold 13px Inter, system-ui, sans-serif"
      ctx.fillText(`Cosine Similarity: ${sim.toFixed(4)}`, width / 2, 22)
    }

    // Drag instruction
    ctx.fillStyle = "#aaa"
    ctx.font = "10px Inter, system-ui, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("drag to rotate", width / 2, height - 8)
  }, [width, height, highlightA, highlightB])

  useEffect(() => {
    draw()
  }, [draw])

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { dragging: true, lastX: e.clientX, lastY: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return
    const dx = e.clientX - dragRef.current.lastX
    const dy = e.clientY - dragRef.current.lastY
    rotRef.current.y += dx * 0.008
    rotRef.current.x += dy * 0.008
    dragRef.current.lastX = e.clientX
    dragRef.current.lastY = e.clientY
    draw()
  }
  const onPointerUp = () => {
    dragRef.current.dragging = false
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, cursor: "grab", touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function NLPExplorerPage() {
  const [selectedSentence, setSelectedSentence] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [compareA, setCompareA] = useState(0)
  const [compareB, setCompareB] = useState(2)

  const sentence = SENTENCES[selectedSentence]
  const embedding = SENTENCE_EMBEDDINGS[selectedSentence]
  const tokenEmbeds = TOKEN_EMBEDDINGS[selectedSentence]
  const attention = computeAttention(tokenEmbeds)

  const steps = [
    { label: "Tokenization", num: 1 },
    { label: "Embeddings", num: 2 },
    { label: "Attention", num: 3 },
    { label: "Cosine Similarity", num: 4 },
  ]

  return (
    <main>
      <div className="container">
        <div className="border-x border-primary/10">
          <div className="flex flex-col gap-8 max-w-4xl mx-auto px-4 sm:px-7 py-11 md:py-16">
            {/* Header */}
            <Link href="/" className="text-sm text-violet-700 hover:underline">
              &larr; Back to Home
            </Link>

            <div className="flex flex-col gap-3">
              <h1 className="text-3xl font-bold">How AI Understands Language</h1>
              <p className="text-secondary text-base leading-relaxed">
                An interactive simulation that walks you through how modern AI (Transformers)
                processes text &mdash; from raw sentences to mathematical representations.
                Select a sentence below and step through each stage to see what happens under the hood.
              </p>
              <p className="text-xs text-muted-foreground">
                Note: All values shown are hardcoded approximations for educational purposes, not from a real model.
              </p>
            </div>

            {/* Sentence Selector */}
            <div className="flex flex-col gap-3">
              <h4>Choose a sentence</h4>
              <div className="grid gap-2">
                {SENTENCES.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedSentence(i); setActiveStep(0) }}
                    className={`text-left py-3 px-4 rounded-lg border text-sm transition-all ${
                      selectedSentence === i
                        ? "border-violet-500 bg-violet-50 text-violet-900 font-medium"
                        : "border-primary/10 hover:border-violet-300 text-secondary"
                    }`}
                  >
                    <span className="text-xs text-muted-foreground mr-2">S{i + 1}</span>
                    &ldquo;{s.text}&rdquo;
                  </button>
                ))}
              </div>
            </div>

            {/* Step Navigation */}
            <div className="flex gap-2 flex-wrap">
              {steps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeStep === i
                      ? "bg-violet-600 text-white"
                      : "bg-muted text-secondary hover:bg-violet-100"
                  }`}
                >
                  Step {step.num}: {step.label}
                </button>
              ))}
            </div>

            {/* ─── Step 1: Tokenization ──────────────────────────── */}
            {activeStep === 0 && (
              <section className="flex flex-col gap-5">
                <h2 className="text-2xl font-semibold">Step 1: Tokenization</h2>
                <div className="bg-violet-50 rounded-lg p-5">
                  <h5 className="text-violet-900 mb-2">What is tokenization?</h5>
                  <p className="text-sm text-violet-800 leading-relaxed">
                    Before AI can understand text, it needs to break the sentence into smaller pieces called <strong>tokens</strong>.
                    Think of it like cutting a sentence into individual words (or sometimes sub-words).
                    Each token becomes a separate unit that the model processes independently.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-primary">Input sentence:</p>
                  <div className="bg-muted rounded-lg px-4 py-3 font-mono text-sm">
                    &ldquo;{sentence.text}&rdquo;
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-primary">After tokenization ({sentence.tokens.length} tokens):</p>
                  <div className="flex flex-wrap gap-2">
                    {sentence.tokens.map((token, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 bg-white border border-violet-200 rounded-lg px-3 py-2 shadow-sm"
                      >
                        <span className="text-[10px] text-violet-400 font-mono">#{i}</span>
                        <span className="font-mono text-sm font-medium text-violet-900">{token}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-secondary">
                  <span className="text-lg">&#x2192;</span>
                  <span>Each token will be converted into a numerical vector in the next step.</span>
                </div>
              </section>
            )}

            {/* ─── Step 2: Embeddings ────────────────────────────── */}
            {activeStep === 1 && (
              <section className="flex flex-col gap-5">
                <h2 className="text-2xl font-semibold">Step 2: Embeddings</h2>
                <div className="bg-violet-50 rounded-lg p-5">
                  <h5 className="text-violet-900 mb-2">What are embeddings?</h5>
                  <p className="text-sm text-violet-800 leading-relaxed">
                    AI can&apos;t read words directly &mdash; it needs numbers. An <strong>embedding</strong> is a list of numbers
                    (a vector) that represents the meaning of a word or sentence.
                    Similar meanings get similar numbers. Think of it as giving each word a unique &ldquo;coordinate&rdquo;
                    in a mathematical space where meaning has direction and distance.
                  </p>
                </div>

                {/* Sentence embedding bar chart */}
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-primary">
                    Sentence embedding vector (8 dimensions):
                  </p>
                  <div className="bg-white border border-primary/10 rounded-lg p-4">
                    <div className="flex items-end gap-1 h-40 justify-center">
                      {embedding.map((val, i) => {
                        const maxAbs = Math.max(...embedding.map(Math.abs))
                        const h = (Math.abs(val) / maxAbs) * 100
                        const isNeg = val < 0
                        return (
                          <div key={i} className="flex flex-col items-center gap-1 flex-1 max-w-12">
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {val.toFixed(2)}
                            </span>
                            <div className="w-full flex items-end" style={{ height: 120 }}>
                              <div
                                className="w-full rounded-t-sm transition-all duration-500"
                                style={{
                                  height: `${h}%`,
                                  backgroundColor: isNeg ? "#ef4444" : "#6d28d9",
                                  opacity: 0.7 + (Math.abs(val) / maxAbs) * 0.3,
                                  marginTop: "auto",
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground">d{i}</span>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      Each bar represents one dimension. Purple = positive, Red = negative.
                    </p>
                  </div>
                </div>

                {/* 3D Token Embeddings */}
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-primary">
                    Token-level embeddings as a 3D matrix (tokens x dimensions):
                  </p>
                  <div className="bg-white border border-primary/10 rounded-lg p-4 flex justify-center overflow-hidden">
                    <Matrix3DCanvas
                      matrix={tokenEmbeds}
                      rowLabels={sentence.tokens}
                      colLabels={["d0", "d1", "d2", "d3"]}
                      title="Token Embedding Matrix"
                      width={420}
                      height={340}
                    />
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    Each row is a token, each column is a dimension. The height of each cell represents
                    its value. Drag the matrix to rotate it in 3D and see the values from different angles.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Key insight:</strong> Real models use 768+ dimensions. We use 4-8 here for visualization.
                    More dimensions = more nuance in capturing meaning.
                  </p>
                </div>
              </section>
            )}

            {/* ─── Step 3: Attention ─────────────────────────────── */}
            {activeStep === 2 && (
              <section className="flex flex-col gap-5">
                <h2 className="text-2xl font-semibold">Step 3: Attention Mechanism</h2>
                <div className="bg-violet-50 rounded-lg p-5">
                  <h5 className="text-violet-900 mb-2">What is Attention?</h5>
                  <p className="text-sm text-violet-800 leading-relaxed">
                    Attention is the core innovation of Transformers. It lets each word &ldquo;look at&rdquo; every
                    other word in the sentence to understand context. For example, in &ldquo;The <strong>cat</strong> sat
                    on the <strong>mat</strong>&rdquo;, the word &ldquo;sat&rdquo; pays attention to &ldquo;cat&rdquo; (who
                    is sitting?) and &ldquo;mat&rdquo; (where?).
                  </p>
                </div>

                {/* Q, K, V explanation */}
                <div className="bg-white border border-primary/10 rounded-lg p-5 flex flex-col gap-4">
                  <h5>The Q, K, V Trick</h5>
                  <p className="text-sm text-secondary leading-relaxed">
                    Each token creates three vectors by multiplying its embedding with learned weight matrices:
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm font-semibold text-blue-900">Q (Query)</p>
                      <p className="text-xs text-blue-700 mt-1">
                        &ldquo;What am I looking for?&rdquo; &mdash; Each token asks a question about what information it needs.
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm font-semibold text-green-900">K (Key)</p>
                      <p className="text-xs text-green-700 mt-1">
                        &ldquo;What do I contain?&rdquo; &mdash; Each token advertises what information it holds.
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-sm font-semibold text-orange-900">V (Value)</p>
                      <p className="text-xs text-orange-700 mt-1">
                        &ldquo;Here&apos;s my actual info&rdquo; &mdash; The content that gets passed along when attended to.
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs font-mono text-center text-secondary">
                      Attention(Q, K, V) = softmax(Q &middot; K<sup>T</sup> / &radic;d) &middot; V
                    </p>
                  </div>
                </div>

                {/* 3D Q, K, V matrices */}
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-primary">Q, K, V matrices in 3D:</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="bg-white border border-blue-200 rounded-lg p-2 flex justify-center overflow-hidden">
                      <Matrix3DCanvas
                        matrix={attention.Q}
                        rowLabels={sentence.tokens}
                        title="Q (Query)"
                        width={260}
                        height={240}
                      />
                    </div>
                    <div className="bg-white border border-green-200 rounded-lg p-2 flex justify-center overflow-hidden">
                      <Matrix3DCanvas
                        matrix={attention.K}
                        rowLabels={sentence.tokens}
                        title="K (Key)"
                        width={260}
                        height={240}
                      />
                    </div>
                    <div className="bg-white border border-orange-200 rounded-lg p-2 flex justify-center overflow-hidden">
                      <Matrix3DCanvas
                        matrix={attention.V}
                        rowLabels={sentence.tokens}
                        title="V (Value)"
                        width={260}
                        height={240}
                      />
                    </div>
                  </div>
                </div>

                {/* Attention Heatmap */}
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-primary">Attention weights (who pays attention to whom):</p>
                  <div className="bg-white border border-primary/10 rounded-lg p-4 overflow-x-auto">
                    <table className="mx-auto border-collapse">
                      <thead>
                        <tr>
                          <th className="p-1 text-[10px] text-muted-foreground"></th>
                          {sentence.tokens.map((t, i) => (
                            <th key={i} className="p-1 text-[10px] text-muted-foreground font-normal text-center min-w-10">
                              {t}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {attention.attentionWeights.map((row, r) => (
                          <tr key={r}>
                            <td className="p-1 text-[10px] text-muted-foreground text-right pr-2 font-medium">
                              {sentence.tokens[r]}
                            </td>
                            {row.map((val, c) => (
                              <td
                                key={c}
                                className="p-1 text-center min-w-10"
                                style={{ backgroundColor: attentionToColor(val) }}
                              >
                                <span className="text-[10px] font-mono text-white font-medium"
                                  style={{ textShadow: "0 0 3px rgba(0,0,0,0.5)" }}>
                                  {val.toFixed(2)}
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      Each row shows how much a token (left) pays attention to each other token (top).
                      Brighter = more attention. Each row sums to 1.0 (softmax).
                    </p>
                  </div>
                </div>

                {/* 3D Attention Tensor */}
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-primary">Attention weights as a 3D tensor:</p>
                  <div className="bg-white border border-primary/10 rounded-lg p-4 flex justify-center overflow-hidden">
                    <Matrix3DCanvas
                      matrix={attention.attentionWeights}
                      rowLabels={sentence.tokens}
                      colLabels={sentence.tokens}
                      title="Attention Weight Tensor"
                      colorMode="attention"
                      width={440}
                      height={380}
                    />
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    The height of each cell represents the attention weight &mdash; taller cells mean stronger attention.
                    Notice how content words (nouns, verbs) tend to attend more strongly to each other
                    than to function words (the, on, in).
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Multi-head attention:</strong> Real transformers run many attention &ldquo;heads&rdquo; in parallel
                    (e.g., 12 heads), each focusing on different relationships &mdash; one head might track
                    grammar, another might track meaning, etc. We show a single head here for clarity.
                  </p>
                </div>
              </section>
            )}

            {/* ─── Step 4: Cosine Similarity ─────────────────────── */}
            {activeStep === 3 && (
              <section className="flex flex-col gap-5">
                <h2 className="text-2xl font-semibold">Step 4: Cosine Similarity</h2>
                <div className="bg-violet-50 rounded-lg p-5">
                  <h5 className="text-violet-900 mb-2">What is Cosine Similarity?</h5>
                  <p className="text-sm text-violet-800 leading-relaxed">
                    Once sentences are converted to vectors (embeddings), we need a way to measure
                    how <strong>similar</strong> two sentences are. Cosine similarity measures the <strong>angle</strong> between
                    two vectors: if they point in the same direction, similarity is close to <strong>1.0</strong> (very similar).
                    If perpendicular, it&apos;s <strong>0</strong>. If opposite, it&apos;s <strong>-1.0</strong>.
                  </p>
                </div>

                {/* Formula */}
                <div className="bg-white border border-primary/10 rounded-lg p-4">
                  <p className="text-xs font-mono text-center text-secondary">
                    cos(A, B) = (A &middot; B) / (|A| &times; |B|) = &Sigma;(a<sub>i</sub> &times; b<sub>i</sub>) / (&radic;&Sigma;a<sub>i</sub>&sup2; &times; &radic;&Sigma;b<sub>i</sub>&sup2;)
                  </p>
                </div>

                {/* Similarity Matrix */}
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-primary">Similarity between all 5 sentences:</p>
                  <div className="bg-white border border-primary/10 rounded-lg p-4 overflow-x-auto">
                    <table className="mx-auto border-collapse">
                      <thead>
                        <tr>
                          <th className="p-1.5"></th>
                          {SENTENCES.map((_, i) => (
                            <th key={i} className="p-1.5 text-[10px] text-muted-foreground font-normal">
                              S{i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {SENTENCES.map((_, r) => (
                          <tr key={r}>
                            <td className="p-1.5 text-[10px] text-muted-foreground text-right pr-2 font-medium max-w-24 truncate">
                              S{r + 1}
                            </td>
                            {SENTENCES.map((_, c) => {
                              const sim = cosineSimilarity(SENTENCE_EMBEDDINGS[r], SENTENCE_EMBEDDINGS[c])
                              const bg = sim > 0.95
                                ? "bg-violet-600 text-white"
                                : sim > 0.85
                                  ? "bg-violet-400 text-white"
                                  : sim > 0.5
                                    ? "bg-violet-200 text-violet-900"
                                    : sim > 0
                                      ? "bg-violet-50 text-violet-700"
                                      : "bg-red-50 text-red-700"
                              return (
                                <td key={c} className={`p-1.5 text-center rounded-sm min-w-12 ${bg}`}>
                                  <span className="text-[11px] font-mono font-medium">
                                    {sim.toFixed(2)}
                                  </span>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex flex-col gap-1 mt-3">
                      {SENTENCES.map((s, i) => (
                        <p key={i} className="text-[10px] text-muted-foreground">
                          <span className="font-medium">S{i + 1}:</span> {s.text}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3D Vector Space - All Sentences */}
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-primary">All 5 sentence vectors in 3D space:</p>
                  <div className="bg-white border border-primary/10 rounded-lg p-4 flex justify-center overflow-hidden">
                    <VectorSpace3D width={480} height={400} />
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {SENTENCES.map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: VECTOR_COLORS[i] }} />
                        <span className="text-[10px] text-secondary">S{i + 1}: {s.text}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    Each arrow is a sentence&apos;s embedding projected from 8D into 3D.
                    Vectors pointing in similar directions are semantically similar.
                    Notice how S1/S3 (cat/kitten) cluster together, and S4/S5 (ML/DL) cluster together.
                    Drag to rotate and see the clustering from different angles.
                  </p>
                </div>

                {/* Interactive Comparison */}
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-primary">Compare two sentences &mdash; see the angle between vectors:</p>
                  <div className="bg-white border border-primary/10 rounded-lg p-5">
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground block mb-1">Sentence A</label>
                        <select
                          value={compareA}
                          onChange={(e) => setCompareA(Number(e.target.value))}
                          className="w-full border border-primary/10 rounded-lg px-3 py-2 text-sm bg-white"
                        >
                          {SENTENCES.map((s, i) => (
                            <option key={i} value={i}>S{i + 1}: {s.text}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground block mb-1">Sentence B</label>
                        <select
                          value={compareB}
                          onChange={(e) => setCompareB(Number(e.target.value))}
                          className="w-full border border-primary/10 rounded-lg px-3 py-2 text-sm bg-white"
                        >
                          {SENTENCES.map((s, i) => (
                            <option key={i} value={i}>S{i + 1}: {s.text}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-center overflow-hidden">
                      <VectorSpace3D
                        highlightA={compareA}
                        highlightB={compareB}
                        width={480}
                        height={380}
                      />
                    </div>

                    <div className="flex flex-col gap-2 mt-4">
                      <p className="text-sm text-secondary leading-relaxed">
                        The <strong style={{ color: "#f59e0b" }}>yellow arc</strong> shows the angle between the two highlighted vectors.
                        A <strong>small angle</strong> means similar meaning, a <strong>large angle</strong> means different topics.
                        Non-highlighted vectors are dimmed so you can focus on the comparison.
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-1.5 rounded-full bg-violet-600" />
                          <span className="text-[10px] text-secondary">0.90&ndash;1.00: Very similar</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-1.5 rounded-full bg-violet-400" />
                          <span className="text-[10px] text-secondary">0.70&ndash;0.89: Related</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-1.5 rounded-full bg-violet-200" />
                          <span className="text-[10px] text-secondary">0.30&ndash;0.69: Somewhat</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-1.5 rounded-full bg-gray-200" />
                          <span className="text-[10px] text-secondary">0.00&ndash;0.29: Different</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>Real-world use:</strong> This is exactly how search engines, recommendation systems,
                    and chatbots find relevant content &mdash; they convert text to embeddings and find the
                    closest matches using cosine similarity.
                  </p>
                </div>
              </section>
            )}

            {/* Summary */}
            <div className="bg-muted rounded-lg p-5 flex flex-col gap-2 mt-4">
              <h5>The Full Pipeline</h5>
              <div className="flex flex-wrap items-center gap-2 text-sm text-secondary">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${activeStep === 0 ? "bg-violet-600 text-white" : "bg-white border border-primary/10"}`}>
                  1. Tokenize
                </span>
                <span>&#x2192;</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${activeStep === 1 ? "bg-violet-600 text-white" : "bg-white border border-primary/10"}`}>
                  2. Embed
                </span>
                <span>&#x2192;</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${activeStep === 2 ? "bg-violet-600 text-white" : "bg-white border border-primary/10"}`}>
                  3. Attend
                </span>
                <span>&#x2192;</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${activeStep === 3 ? "bg-violet-600 text-white" : "bg-white border border-primary/10"}`}>
                  4. Compare
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Text &#x2192; Tokens &#x2192; Number vectors &#x2192; Context-aware representations &#x2192; Semantic comparison
              </p>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
