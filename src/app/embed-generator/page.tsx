"use client"

import { useState, useRef } from "react"
import { ImageEmbedder, FilesetResolver } from "@mediapipe/tasks-vision"
import Link from "next/link"

interface EmbedEntry {
    id: string
    name: string
    path: string
    vector: number[]
}

function generateId(): string {
    return crypto.randomUUID()
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error(`Failed to load: ${src}`))
        img.src = src
    })
}

const EmbedGeneratorPage = () => {
    const [files, setFiles] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [progress, setProgress] = useState({ current: 0, total: 0, file: "" })
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState(false)
    const embedderRef = useRef<ImageEmbedder | null>(null)

    const fetchFiles = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch("/api/list-img-embeds")
            if (!res.ok) throw new Error("Failed to fetch file list")
            const data = await res.json()
            setFiles(data.files)
        } catch (err) {
            setError("Failed to load file list. Make sure /public/images/img-embeds/ exists.")
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGenerate = async () => {
        if (files.length === 0) return

        setIsGenerating(true)
        setError(null)
        setDone(false)

        try {
            // Init MediaPipe
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            )

            const createEmbedder = async (useGPU: boolean) => {
                return await ImageEmbedder.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_embedder/mobilenet_v3_small/float32/latest/mobilenet_v3_small.tflite",
                        delegate: useGPU ? "GPU" : "CPU"
                    },
                    runningMode: "IMAGE",
                    l2Normalize: true,
                    quantize: false
                })
            }

            let embedder: ImageEmbedder
            try {
                embedder = await createEmbedder(true)
            } catch {
                console.log("GPU delegate failed, falling back to CPU")
                embedder = await createEmbedder(false)
            }
            embedderRef.current = embedder

            const dataset: EmbedEntry[] = []

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const imgPath = `/images/img-embeds/${file}`
                setProgress({ current: i + 1, total: files.length, file })

                const img = await loadImageElement(imgPath)
                const result = embedder.embed(img)
                const vector = Array.from(result.embeddings[0].floatEmbedding ?? [])

                dataset.push({
                    id: generateId(),
                    name: file,
                    path: imgPath,
                    vector
                })
            }

            embedder.close()
            embedderRef.current = null

            // Download as JSON
            const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: "application/json" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "embed-db.json"
            a.click()
            URL.revokeObjectURL(url)

            setDone(true)
        } catch (err) {
            setError("Failed to generate embeddings. Check console for details.")
            console.error(err)
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <main>
            <div className="container">
                <div className="border-x border-primary/10">
                    <div className="flex flex-col gap-6 max-w-3xl mx-auto px-4 sm:px-7 py-11 md:py-16">
                        <Link href="/" className="text-sm text-violet-700 hover:underline">
                            &larr; Back to Home
                        </Link>

                        <h1 className="text-3xl font-bold">Embed Generator</h1>
                        <p className="text-secondary">
                            Browser-based tool to generate image embeddings using MediaPipe Image Embedder.
                            Reads all images from <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/public/images/img-embeds/</code> and
                            outputs <code className="text-xs bg-muted px-1.5 py-0.5 rounded">embed-db.json</code>.
                            Place the downloaded file in <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/public/</code> for the vector search feature.
                        </p>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Step 1: Load file list */}
                        <div className="flex flex-col gap-3">
                            <p className="text-sm font-medium text-primary">Step 1: Load image list</p>
                            <button
                                onClick={fetchFiles}
                                disabled={isLoading || isGenerating}
                                className="w-fit py-2.5 px-5 text-sm font-medium rounded-lg border border-primary/20 hover:border-violet-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? "Loading..." : "Scan Folder"}
                            </button>

                            {files.length > 0 && (
                                <div className="bg-muted rounded-lg p-4">
                                    <p className="text-sm font-medium text-primary mb-2">
                                        Found {files.length} images:
                                    </p>
                                    <ul className="text-xs font-mono text-secondary space-y-1 max-h-48 overflow-y-auto">
                                        {files.map((f) => (
                                            <li key={f} className="truncate">{f}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Step 2: Generate */}
                        {files.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <p className="text-sm font-medium text-primary">Step 2: Generate embeddings</p>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="w-fit py-2.5 px-5 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isGenerating ? "Generating..." : "Generate & Download"}
                                </button>

                                {isGenerating && (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-sm text-secondary">
                                                Processing {progress.current}/{progress.total}
                                            </span>
                                        </div>
                                        <p className="text-xs font-mono text-secondary truncate">{progress.file}</p>
                                        <div className="w-full bg-primary/10 rounded-full h-2">
                                            <div
                                                className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {done && (
                                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                        <p className="text-sm text-green-700 dark:text-green-400">
                                            embed-db.json downloaded. Place it in <code className="text-xs bg-green-100 dark:bg-green-900 px-1.5 py-0.5 rounded">/public/</code> to use with vector search.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}

export default EmbedGeneratorPage
