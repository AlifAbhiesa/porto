"use client"

import { useEffect, useRef, useState } from "react"
import { ImageClassifier, FilesetResolver } from "@mediapipe/tasks-vision"

interface Classification {
    categoryName: string
    score: number
}

const Demo = () => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [classifications, setClassifications] = useState<Classification[]>([])
    const classifierRef = useRef<ImageClassifier | null>(null)
    const animationRef = useRef<number | null>(null)

    useEffect(() => {
        let isMounted = true

        const initClassifier = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                )

                const classifier = await ImageClassifier.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_classifier/efficientnet_lite0/float32/1/efficientnet_lite0.tflite",
                        delegate: "GPU"
                    },
                    maxResults: 5,
                    runningMode: "VIDEO"
                })

                if (isMounted) {
                    classifierRef.current = classifier
                    await startCamera()
                }
            } catch (err) {
                if (isMounted) {
                    setError("Failed to initialize image classifier")
                    console.error(err)
                }
            }
        }

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment", width: 640, height: 480 }
                })

                if (videoRef.current && isMounted) {
                    videoRef.current.srcObject = stream
                    videoRef.current.onloadedmetadata = async () => {
                        if (isMounted && videoRef.current) {
                            await videoRef.current.play()
                            setIsLoading(false)
                            classifyImages()
                        }
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError("Failed to access camera. Please allow camera permissions.")
                    console.error(err)
                }
            }
        }

        const classifyImages = () => {
            if (!videoRef.current || !canvasRef.current || !classifierRef.current) return

            const video = videoRef.current
            const canvas = canvasRef.current
            const ctx = canvas.getContext("2d")

            if (!ctx || video.readyState !== 4 || video.paused || video.ended) {
                animationRef.current = requestAnimationFrame(classifyImages)
                return
            }

            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
            }
            ctx.drawImage(video, 0, 0)

            try {
                const result = classifierRef.current.classifyForVideo(video, performance.now())

                if (result.classifications && result.classifications[0]) {
                    const categories = result.classifications[0].categories
                    setClassifications(categories.map(cat => ({
                        categoryName: cat.categoryName,
                        score: cat.score
                    })))
                }
            } catch (err) {
                console.error("Classification error:", err)
            }

            animationRef.current = requestAnimationFrame(classifyImages)
        }

        initClassifier()

        return () => {
            isMounted = false
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            if (videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
                tracks.forEach(track => track.stop())
            }
        }
    }, [])

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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                                {isLoading && !error && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                            <p className="text-sm text-secondary">Loading model...</p>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-sm text-red-500">{error}</p>
                                    </div>
                                )}

                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="hidden"
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <p className="text-sm font-medium text-primary">Top Predictions</p>
                                {classifications.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {classifications.map((cls, index) => (
                                            <div key={index} className="flex flex-col gap-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-secondary capitalize">
                                                        {cls.categoryName.replace(/_/g, " ")}
                                                    </span>
                                                    <span className="text-primary font-medium">
                                                        {Math.round(cls.score * 100)}%
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-violet-500 rounded-full transition-all duration-300"
                                                        style={{ width: `${cls.score * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-secondary">
                                        {isLoading ? "Initializing..." : "Point camera at an object"}
                                    </p>
                                )}
                            </div>
                        </div>

                        <p className="text-sm text-secondary">
                            Point your camera at objects to classify them in real-time.
                            The model shows the top 5 predictions with confidence scores.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Demo
