"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ImageEmbedder, FilesetResolver } from "@mediapipe/tasks-vision"
import Image from "next/image"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

interface EmbedEntry {
    id: string
    name: string
    path: string
    vector: number[]
}

interface SearchResult {
    entry: EmbedEntry
    similarity: number
}

function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return "Only JPEG, PNG, and WebP images are allowed."
    }
    if (file.size > MAX_FILE_SIZE) {
        return "File size must be under 10MB."
    }
    return null
}

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i]
        magA += a[i] * a[i]
        magB += b[i] * b[i]
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB)
    return denom === 0 ? 0 : dot / denom
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => {
            URL.revokeObjectURL(src)
            resolve(img)
        }
        img.onerror = () => {
            URL.revokeObjectURL(src)
            reject(new Error("Failed to load image."))
        }
        img.src = src
    })
}

const VectorSearch = () => {
    const [dataset, setDataset] = useState<EmbedEntry[]>([])
    const [dbLoaded, setDbLoaded] = useState(false)
    const [dbError, setDbError] = useState(false)
    const [modelReady, setModelReady] = useState(false)
    const [isLoadingModel, setIsLoadingModel] = useState(true)

    const [queryFile, setQueryFile] = useState<File | null>(null)
    const [queryPreview, setQueryPreview] = useState<string | null>(null)
    const [topK, setTopK] = useState(5)
    const [minConfidence, setMinConfidence] = useState(0.3)
    const [results, setResults] = useState<SearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const embedderRef = useRef<ImageEmbedder | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    // Load embed-db.json
    useEffect(() => {
        fetch("/embed-db.json")
            .then((res) => {
                if (!res.ok) throw new Error("Not found")
                return res.json()
            })
            .then((data: EmbedEntry[]) => {
                setDataset(data)
                setDbLoaded(true)
            })
            .catch(() => {
                setDbError(true)
                setIsLoadingModel(false)
            })
    }, [])

    // Init MediaPipe embedder
    useEffect(() => {
        if (!dbLoaded) return
        let isMounted = true

        const init = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                )

                const createEmbedder = async (useGPU: boolean) =>
                    ImageEmbedder.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_embedder/mobilenet_v3_small/float32/latest/mobilenet_v3_small.tflite",
                            delegate: useGPU ? "GPU" : "CPU"
                        },
                        runningMode: "IMAGE",
                        l2Normalize: true,
                        quantize: false
                    })

                let embedder: ImageEmbedder
                try {
                    embedder = await createEmbedder(true)
                } catch {
                    embedder = await createEmbedder(false)
                }

                if (isMounted) {
                    embedderRef.current = embedder
                    setModelReady(true)
                    setIsLoadingModel(false)
                }
            } catch (err) {
                if (isMounted) {
                    setError("Failed to load Image Embedder model.")
                    setIsLoadingModel(false)
                }
                console.error(err)
            }
        }

        init()
        return () => {
            isMounted = false
            embedderRef.current?.close()
        }
    }, [dbLoaded])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const validationError = validateFile(file)
        if (validationError) {
            setError(validationError)
            e.target.value = ""
            return
        }

        setError(null)
        setResults([])

        if (queryPreview) URL.revokeObjectURL(queryPreview)
        setQueryFile(file)
        setQueryPreview(URL.createObjectURL(file))
    }, [queryPreview])

    const handleSearch = async () => {
        if (!queryFile || !embedderRef.current || dataset.length === 0) return

        setIsSearching(true)
        setError(null)

        try {
            const url = URL.createObjectURL(queryFile)
            const img = await loadImageElement(url)

            const result = embedderRef.current.embed(img)
            const queryVector = Array.from(result.embeddings[0].floatEmbedding ?? [])

            const scored: SearchResult[] = dataset
                .map((entry) => ({
                    entry,
                    similarity: cosineSimilarity(queryVector, entry.vector)
                }))
                .filter((r) => r.similarity >= minConfidence)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, topK)

            setResults(scored)
        } catch (err) {
            setError("Failed to search. Please try a different image.")
            console.error(err)
        } finally {
            setIsSearching(false)
        }
    }

    const handleReset = () => {
        if (queryPreview) URL.revokeObjectURL(queryPreview)
        setQueryFile(null)
        setQueryPreview(null)
        setResults([])
        setError(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    if (dbError) {
        return (
            <section>
                <div className="container">
                    <div className="border-x border-primary/10">
                        <div className="flex flex-col gap-4 max-w-3xl mx-auto px-4 sm:px-7 py-11 md:py-16">
                            <p className="text-sm tracking-[2px] text-primary uppercase font-medium">
                                Vector Search
                            </p>
                            <div className="bg-muted rounded-lg p-6 text-center">
                                <p className="text-sm text-secondary">
                                    No embedding database found. Generate one using the{" "}
                                    <a href="/embed-generator" className="text-violet-700 hover:underline">
                                        Embed Generator
                                    </a>{" "}
                                    and place <code className="text-xs bg-primary/5 px-1.5 py-0.5 rounded">embed-db.json</code> in the <code className="text-xs bg-primary/5 px-1.5 py-0.5 rounded">/public/</code> folder.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section>
            <div className="container">
                <div className="border-x border-primary/10">
                    <div className="flex flex-col gap-6 max-w-3xl mx-auto px-4 sm:px-7 py-11 md:py-16">
                        <p className="text-sm tracking-[2px] text-primary uppercase font-medium">
                            Vector Search
                        </p>

                        {isLoadingModel && (
                            <div className="flex items-center justify-center py-8">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm text-secondary">Loading model & database...</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Dataset Table */}
                        {dbLoaded && (
                            <div className="flex flex-col gap-3">
                                <p className="text-sm font-medium text-primary">
                                    Image Dataset ({dataset.length} entries)
                                </p>
                                <div className="border border-primary/10 rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto max-h-80 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted sticky top-0">
                                                <tr>
                                                    <th className="text-left py-2.5 px-3 font-medium text-primary text-xs">Image</th>
                                                    <th className="text-left py-2.5 px-3 font-medium text-primary text-xs">Name</th>
                                                    <th className="text-left py-2.5 px-3 font-medium text-primary text-xs hidden sm:table-cell">ID</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-primary/5">
                                                {dataset.map((entry) => (
                                                    <tr key={entry.id}>
                                                        <td className="py-2 px-3">
                                                            <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                                                                <Image
                                                                    src={entry.path}
                                                                    alt={entry.name}
                                                                    width={48}
                                                                    height={48}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            <span className="text-xs text-secondary break-all line-clamp-2">{entry.name}</span>
                                                        </td>
                                                        <td className="py-2 px-3 hidden sm:table-cell">
                                                            <span className="text-xs font-mono text-secondary/60">{entry.id.slice(0, 8)}...</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Search Controls */}
                        {modelReady && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Query Image Upload */}
                                    <div className="flex flex-col gap-2 sm:col-span-1">
                                        <p className="text-sm font-medium text-primary">Query Image</p>
                                        <label className="relative flex flex-col items-center justify-center aspect-square border-2 border-dashed border-primary/20 rounded-lg cursor-pointer hover:border-violet-500/50 transition-colors overflow-hidden">
                                            {queryPreview ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={queryPreview} alt="Query preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 p-3 text-center">
                                                    <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                                    </svg>
                                                    <span className="text-xs text-secondary">Upload query</span>
                                                </div>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.webp"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    {/* Parameters */}
                                    <div className="flex flex-col gap-4 sm:col-span-2 justify-center">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-primary">
                                                Top K <span className="text-secondary font-normal">({topK})</span>
                                            </label>
                                            <input
                                                type="range"
                                                min={1}
                                                max={Math.max(dataset.length, 1)}
                                                value={topK}
                                                onChange={(e) => setTopK(Number(e.target.value))}
                                                className="w-full accent-violet-600"
                                            />
                                            <div className="flex justify-between text-xs text-secondary">
                                                <span>1</span>
                                                <span>{dataset.length}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-primary">
                                                Min Confidence <span className="text-secondary font-normal">({(minConfidence * 100).toFixed(0)}%)</span>
                                            </label>
                                            <input
                                                type="range"
                                                min={0}
                                                max={100}
                                                value={minConfidence * 100}
                                                onChange={(e) => setMinConfidence(Number(e.target.value) / 100)}
                                                className="w-full accent-violet-600"
                                            />
                                            <div className="flex justify-between text-xs text-secondary">
                                                <span>0%</span>
                                                <span>100%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSearch}
                                        disabled={!queryFile || isSearching}
                                        className="flex-1 py-3 px-5 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isSearching ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Searching...
                                            </span>
                                        ) : (
                                            "Search Similar Images"
                                        )}
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        disabled={!queryFile}
                                        className="py-3 px-5 text-sm font-medium rounded-lg border border-primary/20 hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Reset
                                    </button>
                                </div>

                                {/* Search Results */}
                                {results.length > 0 && (
                                    <div className="flex flex-col gap-3">
                                        <p className="text-sm font-medium text-primary">
                                            Results ({results.length} matches)
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            {results.map((r, i) => (
                                                <div
                                                    key={r.entry.id}
                                                    className="flex items-center gap-4 p-3 border border-primary/10 rounded-lg"
                                                >
                                                    <span className="text-xs font-mono text-secondary/60 w-5 text-center flex-shrink-0">
                                                        {i + 1}
                                                    </span>
                                                    <div className="w-14 h-14 rounded overflow-hidden bg-muted flex-shrink-0">
                                                        <Image
                                                            src={r.entry.path}
                                                            alt={r.entry.name}
                                                            width={56}
                                                            height={56}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-primary truncate">{r.entry.name}</p>
                                                        <p className="text-xs font-mono text-secondary/60">ID: {r.entry.id.slice(0, 8)}...</p>
                                                    </div>
                                                    <div className="flex flex-col items-end flex-shrink-0">
                                                        <span className={`text-lg font-bold ${
                                                            r.similarity >= 0.8 ? "text-green-500" :
                                                            r.similarity >= 0.5 ? "text-yellow-500" :
                                                            "text-orange-500"
                                                        }`}>
                                                            {(r.similarity * 100).toFixed(1)}%
                                                        </span>
                                                        <span className="text-xs text-secondary">confidence</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {results.length === 0 && queryFile && !isSearching && queryPreview && (
                                    <p className="text-sm text-secondary text-center py-4">
                                        No results yet. Click &quot;Search Similar Images&quot; to find matches.
                                    </p>
                                )}
                            </>
                        )}

                        <p className="text-sm text-secondary">
                            Upload a query image to search for visually similar images in the embedded dataset.
                            All processing happens locally in your browser.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default VectorSearch
