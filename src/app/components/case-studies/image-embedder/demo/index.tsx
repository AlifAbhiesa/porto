"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ImageEmbedder, FilesetResolver } from "@mediapipe/tasks-vision"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return "Only JPEG, PNG, and WebP images are allowed."
    }
    if (file.size > MAX_FILE_SIZE) {
        return "File size must be under 10MB."
    }
    return null
}

function renderImageSafely(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
            URL.revokeObjectURL(url)
            resolve(img)
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error("Failed to load image."))
        }
        img.src = url
    })
}

const Demo = () => {
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [image1, setImage1] = useState<File | null>(null)
    const [image2, setImage2] = useState<File | null>(null)
    const [preview1, setPreview1] = useState<string | null>(null)
    const [preview2, setPreview2] = useState<string | null>(null)
    const [similarity, setSimilarity] = useState<number | null>(null)
    const [embedding1, setEmbedding1] = useState<number[] | null>(null)
    const [embedding2, setEmbedding2] = useState<number[] | null>(null)
    const [copiedSlot, setCopiedSlot] = useState<1 | 2 | null>(null)
    const [isComparing, setIsComparing] = useState(false)
    const embedderRef = useRef<ImageEmbedder | null>(null)
    const fileInput1Ref = useRef<HTMLInputElement | null>(null)
    const fileInput2Ref = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        let isMounted = true

        const initEmbedder = async () => {
            try {
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

                if (isMounted) {
                    embedderRef.current = embedder
                    setIsLoading(false)
                }
            } catch (err) {
                if (isMounted) {
                    setError("Failed to initialize Image Embedder model.")
                    console.error(err)
                }
            }
        }

        initEmbedder()

        return () => {
            isMounted = false
            embedderRef.current?.close()
        }
    }, [])

    // Cleanup preview URLs on unmount
    useEffect(() => {
        return () => {
            if (preview1) URL.revokeObjectURL(preview1)
            if (preview2) URL.revokeObjectURL(preview2)
        }
    }, [preview1, preview2])

    const handleFileSelect = useCallback((slot: 1 | 2) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const validationError = validateFile(file)
        if (validationError) {
            setError(validationError)
            e.target.value = ""
            return
        }

        setError(null)
        setSimilarity(null)

        const previewUrl = URL.createObjectURL(file)

        if (slot === 1) {
            if (preview1) URL.revokeObjectURL(preview1)
            setImage1(file)
            setPreview1(previewUrl)
        } else {
            if (preview2) URL.revokeObjectURL(preview2)
            setImage2(file)
            setPreview2(previewUrl)
        }
    }, [preview1, preview2])

    const handleCompare = async () => {
        if (!image1 || !image2 || !embedderRef.current) return

        setIsComparing(true)
        setError(null)

        try {
            const [img1, img2] = await Promise.all([
                renderImageSafely(image1),
                renderImageSafely(image2)
            ])

            const result1 = embedderRef.current.embed(img1)
            const result2 = embedderRef.current.embed(img2)

            const vec1 = Array.from(result1.embeddings[0].floatEmbedding ?? [])
            const vec2 = Array.from(result2.embeddings[0].floatEmbedding ?? [])
            setEmbedding1(vec1)
            setEmbedding2(vec2)

            const cosineSimilarity = ImageEmbedder.cosineSimilarity(
                result1.embeddings[0],
                result2.embeddings[0]
            )

            setSimilarity(cosineSimilarity)
        } catch (err) {
            setError("Failed to compare images. Please try different files.")
            console.error(err)
        } finally {
            setIsComparing(false)
        }
    }

    const handleReset = () => {
        if (preview1) URL.revokeObjectURL(preview1)
        if (preview2) URL.revokeObjectURL(preview2)
        setImage1(null)
        setImage2(null)
        setPreview1(null)
        setPreview2(null)
        setSimilarity(null)
        setEmbedding1(null)
        setEmbedding2(null)
        setCopiedSlot(null)
        setError(null)
        if (fileInput1Ref.current) fileInput1Ref.current.value = ""
        if (fileInput2Ref.current) fileInput2Ref.current.value = ""
    }

    const handleCopyEmbedding = async (slot: 1 | 2) => {
        const vec = slot === 1 ? embedding1 : embedding2
        if (!vec) return
        await navigator.clipboard.writeText(JSON.stringify(vec))
        setCopiedSlot(slot)
        setTimeout(() => setCopiedSlot(null), 2000)
    }

    const formatEmbeddingPreview = (vec: number[]): string => {
        const preview = vec.slice(0, 8).map(v => v.toFixed(6)).join(", ")
        return `[${preview}, ... ${vec.length - 8} more]`
    }

    const getSimilarityLabel = (score: number): { text: string; color: string } => {
        if (score >= 0.8) return { text: "Very Similar", color: "text-green-500" }
        if (score >= 0.5) return { text: "Somewhat Similar", color: "text-yellow-500" }
        if (score >= 0.2) return { text: "Slightly Similar", color: "text-orange-500" }
        return { text: "Not Similar", color: "text-red-500" }
    }

    return (
        <section>
            <div className="container">
                <div className="border-x border-primary/10">
                    <div className="flex flex-col gap-6 max-w-3xl mx-auto px-4 sm:px-7 py-11 md:py-16">
                        <div className="flex flex-col gap-4">
                            <p className="text-sm tracking-[2px] text-primary uppercase font-medium">
                                Live Demo
                            </p>
                        </div>

                        {isLoading && !error && (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm text-secondary">Loading Image Embedder model...</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {!isLoading && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Image 1 Upload */}
                                    <div className="flex flex-col gap-3">
                                        <p className="text-sm font-medium text-primary">Image 1</p>
                                        <label className="relative flex flex-col items-center justify-center aspect-square border-2 border-dashed border-primary/20 rounded-lg cursor-pointer hover:border-violet-500/50 transition-colors overflow-hidden">
                                            {preview1 ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={preview1}
                                                    alt="Image 1 preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 p-4 text-center">
                                                    <svg className="w-8 h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-xs text-secondary">Click to upload</span>
                                                    <span className="text-xs text-secondary/60">JPEG, PNG, WebP (max 10MB)</span>
                                                </div>
                                            )}
                                            <input
                                                ref={fileInput1Ref}
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.webp"
                                                onChange={handleFileSelect(1)}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    {/* Image 2 Upload */}
                                    <div className="flex flex-col gap-3">
                                        <p className="text-sm font-medium text-primary">Image 2</p>
                                        <label className="relative flex flex-col items-center justify-center aspect-square border-2 border-dashed border-primary/20 rounded-lg cursor-pointer hover:border-violet-500/50 transition-colors overflow-hidden">
                                            {preview2 ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={preview2}
                                                    alt="Image 2 preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 p-4 text-center">
                                                    <svg className="w-8 h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-xs text-secondary">Click to upload</span>
                                                    <span className="text-xs text-secondary/60">JPEG, PNG, WebP (max 10MB)</span>
                                                </div>
                                            )}
                                            <input
                                                ref={fileInput2Ref}
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.webp"
                                                onChange={handleFileSelect(2)}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCompare}
                                        disabled={!image1 || !image2 || isComparing}
                                        className="flex-1 py-3 px-5 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isComparing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Comparing...
                                            </span>
                                        ) : (
                                            "Compare Similarity"
                                        )}
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        disabled={!image1 && !image2}
                                        className="py-3 px-5 text-sm font-medium rounded-lg border border-primary/20 hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Reset
                                    </button>
                                </div>

                                {/* Similarity Result */}
                                {similarity !== null && (
                                    <div className="bg-muted rounded-lg p-6">
                                        <p className="text-sm font-medium text-primary mb-3">Similarity Result</p>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-end gap-2">
                                                <span className="text-4xl font-bold text-primary">
                                                    {(similarity * 100).toFixed(1)}%
                                                </span>
                                                <span className={`text-sm font-medium pb-1 ${getSimilarityLabel(similarity).color}`}>
                                                    {getSimilarityLabel(similarity).text}
                                                </span>
                                            </div>
                                            <div className="w-full bg-primary/10 rounded-full h-2.5">
                                                <div
                                                    className="bg-violet-600 h-2.5 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.max(0, similarity * 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-secondary">
                                                Cosine similarity score: {similarity.toFixed(6)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Embedding Vectors */}
                                {embedding1 && embedding2 && (
                                    <div className="flex flex-col gap-3">
                                        {([1, 2] as const).map((slot) => {
                                            const vec = slot === 1 ? embedding1 : embedding2
                                            return (
                                                <div key={slot} className="bg-muted rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-sm font-medium text-primary">
                                                            Image {slot} Embedding ({vec.length}d)
                                                        </p>
                                                        <button
                                                            onClick={() => handleCopyEmbedding(slot)}
                                                            className="text-xs font-medium px-2.5 py-1 rounded border border-primary/20 hover:border-violet-500/50 transition-colors"
                                                        >
                                                            {copiedSlot === slot ? "Copied!" : "Copy"}
                                                        </button>
                                                    </div>
                                                    <pre className="text-xs font-mono text-secondary overflow-x-auto whitespace-nowrap">
                                                        {formatEmbeddingPreview(vec)}
                                                    </pre>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Cosine Similarity Explanation */}
                                {similarity !== null && (
                                    <div className="border-l-2 border-violet-500/40 pl-4">
                                        <p className="text-sm text-secondary leading-relaxed">
                                            <span className="font-medium text-primary">How cosine similarity works: </span>
                                            Each image is converted into a high-dimensional vector (embedding) that captures its visual features.
                                            Cosine similarity measures the angle between these two vectors — a score of 1.0 means the vectors
                                            point in the exact same direction (identical images), 0.0 means they are orthogonal (completely
                                            unrelated), and negative values indicate opposite directions. Unlike Euclidean distance, cosine
                                            similarity focuses on the orientation rather than magnitude, making it robust for comparing
                                            normalized embeddings regardless of scale.
                                        </p>
                                    </div>
                                )}

                                <p className="text-sm text-secondary">
                                    Upload two images to compare their visual similarity using MediaPipe Image Embedder.
                                    All processing happens locally in your browser — no images are uploaded to any server.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Demo
