"use client"

import { useEffect, useRef, useState } from "react"
import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision"

const Demo = () => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const detectorRef = useRef<ObjectDetector | null>(null)
    const animationRef = useRef<number | null>(null)

    useEffect(() => {
        let isMounted = true

        const initDetector = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                )

                const detector = await ObjectDetector.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
                        delegate: "GPU"
                    },
                    scoreThreshold: 0.5,
                    runningMode: "VIDEO"
                })

                if (isMounted) {
                    detectorRef.current = detector
                    await startCamera()
                }
            } catch (err) {
                if (isMounted) {
                    setError("Failed to initialize object detector")
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
                            detectObjects()
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

        const detectObjects = () => {
            if (!videoRef.current || !canvasRef.current || !detectorRef.current) return

            const video = videoRef.current
            const canvas = canvasRef.current
            const ctx = canvas.getContext("2d")

            if (!ctx || video.readyState !== 4 || video.paused || video.ended) {
                animationRef.current = requestAnimationFrame(detectObjects)
                return
            }

            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
            }

            ctx.drawImage(video, 0, 0)

            try {
                const result = detectorRef.current.detectForVideo(video, performance.now())

                if (result.detections) {
                    result.detections.forEach((detection) => {
                        const box = detection.boundingBox
                        const category = detection.categories[0]

                        if (!box || !category) return

                        ctx.strokeStyle = "#8B5CF6"
                        ctx.lineWidth = 3
                        ctx.strokeRect(box.originX, box.originY, box.width, box.height)

                        ctx.fillStyle = "#8B5CF6"
                        const label = `${category.categoryName} ${Math.round(category.score * 100)}%`
                        const textWidth = ctx.measureText(label).width
                        ctx.fillRect(box.originX, box.originY - 25, textWidth + 10, 25)

                        ctx.fillStyle = "#FFFFFF"
                        ctx.font = "16px sans-serif"
                        ctx.fillText(label, box.originX + 5, box.originY - 7)
                    })
                }
            } catch (err) {
                console.error("Detection error:", err)
            }

            animationRef.current = requestAnimationFrame(detectObjects)
        }

        initDetector()

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

                        <p className="text-sm text-secondary">
                            Point your camera at objects to detect them in real-time.
                            The model can detect 80 different object categories.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Demo
