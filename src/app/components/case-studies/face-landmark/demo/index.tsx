"use client"

import { useEffect, useRef, useState } from "react"
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision"

interface LandmarkData {
    timestamp: number
    landmarks: number[][]
}

const Demo = () => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [landmarkOutput, setLandmarkOutput] = useState<LandmarkData | null>(null)
    const [isSaved, setIsSaved] = useState(false)
    const landmarkerRef = useRef<FaceLandmarker | null>(null)
    const animationRef = useRef<number | null>(null)

    useEffect(() => {
        let isMounted = true

        const createLandmarker = async (vision: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>, useGPU: boolean) => {
            return await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
                    delegate: useGPU ? "GPU" : "CPU"
                },
                runningMode: "VIDEO",
                numFaces: 1
            })
        }

        const initLandmarker = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                )

                let landmarker: FaceLandmarker
                try {
                    // Try GPU first
                    landmarker = await createLandmarker(vision, true)
                } catch {
                    // Fallback to CPU if GPU fails
                    console.log("GPU delegate failed, falling back to CPU")
                    landmarker = await createLandmarker(vision, false)
                }

                if (isMounted) {
                    landmarkerRef.current = landmarker
                    await startCamera()
                }
            } catch (err) {
                if (isMounted) {
                    setError("Failed to initialize face landmarker")
                    console.error(err)
                }
            }
        }

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: 640, height: 480 }
                })

                if (videoRef.current && isMounted) {
                    videoRef.current.srcObject = stream
                    videoRef.current.onloadedmetadata = async () => {
                        if (isMounted && videoRef.current) {
                            await videoRef.current.play()
                            setIsLoading(false)
                            detectLandmarks()
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

        const detectLandmarks = () => {
            if (!videoRef.current || !canvasRef.current || !landmarkerRef.current) return

            const video = videoRef.current
            const canvas = canvasRef.current
            const ctx = canvas.getContext("2d")

            if (!ctx || video.readyState !== 4 || video.paused || video.ended) {
                animationRef.current = requestAnimationFrame(detectLandmarks)
                return
            }

            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
            }

            ctx.save()
            ctx.scale(-1, 1)
            ctx.translate(-canvas.width, 0)
            ctx.drawImage(video, 0, 0)
            ctx.restore()

            try {
                const result = landmarkerRef.current.detectForVideo(video, performance.now())

                if (result.faceLandmarks && result.faceLandmarks.length > 0) {
                    const drawingUtils = new DrawingUtils(ctx)

                    for (const landmarks of result.faceLandmarks) {
                        // Mirror the landmarks for display
                        const mirroredLandmarks = landmarks.map(l => ({
                            ...l,
                            x: 1 - l.x
                        }))

                        // Draw face mesh tesselation
                        drawingUtils.drawConnectors(
                            mirroredLandmarks,
                            FaceLandmarker.FACE_LANDMARKS_TESSELATION,
                            { color: "#C0C0C070", lineWidth: 1 }
                        )

                        // Draw face contours
                        drawingUtils.drawConnectors(
                            mirroredLandmarks,
                            FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
                            { color: "#8B5CF6", lineWidth: 2 }
                        )

                        // Draw eyes
                        drawingUtils.drawConnectors(
                            mirroredLandmarks,
                            FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
                            { color: "#30FF30", lineWidth: 1 }
                        )
                        drawingUtils.drawConnectors(
                            mirroredLandmarks,
                            FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
                            { color: "#30FF30", lineWidth: 1 }
                        )

                        // Draw eyebrows
                        drawingUtils.drawConnectors(
                            mirroredLandmarks,
                            FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
                            { color: "#FF3030", lineWidth: 1 }
                        )
                        drawingUtils.drawConnectors(
                            mirroredLandmarks,
                            FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
                            { color: "#FF3030", lineWidth: 1 }
                        )

                        // Draw lips
                        drawingUtils.drawConnectors(
                            mirroredLandmarks,
                            FaceLandmarker.FACE_LANDMARKS_LIPS,
                            { color: "#FF30FF", lineWidth: 1 }
                        )

                        // Extract landmark coordinates for output
                        const landmarkCoords = landmarks.map(l => [
                            parseFloat(l.x.toFixed(6)),
                            parseFloat(l.y.toFixed(6)),
                            parseFloat(l.z.toFixed(6))
                        ])

                        setLandmarkOutput({
                            timestamp: Date.now(),
                            landmarks: landmarkCoords
                        })
                    }
                } else {
                    setLandmarkOutput(null)
                }
            } catch (err) {
                console.error("Detection error:", err)
            }

            animationRef.current = requestAnimationFrame(detectLandmarks)
        }

        initLandmarker()

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

    const handleSaveToDatabase = () => {
        if (!landmarkOutput) return

        // Simulate saving to database
        console.log("Saving landmark data to database:", landmarkOutput)

        // In a real application, you would send this to your API:
        // await fetch('/api/save-landmarks', {
        //     method: 'POST',
        //     body: JSON.stringify(landmarkOutput)
        // })

        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 2000)
    }

    const formatLandmarkPreview = () => {
        if (!landmarkOutput) return "No face detected"

        const { landmarks } = landmarkOutput
        // Show first 5 landmarks as preview
        const preview = landmarks.slice(0, 5).map((l, i) =>
            `[${i}]: (${l[0]}, ${l[1]}, ${l[2]})`
        ).join('\n')

        return `Total: ${landmarks.length} landmarks\n\n${preview}\n... and ${landmarks.length - 5} more`
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

                            {/* Landmark output display at bottom of camera frame */}
                            {landmarkOutput && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-violet-400 font-medium mb-1">
                                                Face Landmark Output ({landmarkOutput.landmarks.length} points)
                                            </p>
                                            <p className="text-xs font-mono truncate">
                                                [{landmarkOutput.landmarks[0]?.join(', ')}], [{landmarkOutput.landmarks[1]?.join(', ')}], ...
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleSaveToDatabase}
                                            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                                                isSaved
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-violet-600 hover:bg-violet-700 text-white'
                                            }`}
                                        >
                                            {isSaved ? 'Saved!' : 'Save to DB'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-secondary">
                            Position your face in front of the camera to detect 478 facial landmarks.
                            The landmark coordinates shown at the bottom can be saved to a database
                            for face matching applications.
                        </p>

                        {/* Detailed landmark output panel */}
                        <div className="bg-muted rounded-lg p-4">
                            <p className="text-sm font-medium text-primary mb-2">Landmark Data Preview</p>
                            <pre className="text-xs font-mono text-secondary whitespace-pre-wrap overflow-x-auto">
                                {formatLandmarkPreview()}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Demo
