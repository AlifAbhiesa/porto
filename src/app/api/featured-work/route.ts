import { NextResponse } from "next/server";

const featureWork = [
    {
        title: "Realtime Object Detection",
        description: "Real-time object detection using EfficientDet-Lite model, demonstrating practical AI implementation in the browser.",
        roles: ["AI Engineer", "Computer Vision"],
        image: "/images/case-studies/object-detection-hero.jpeg",
        url: "/case-studies/object-detection"
    },
    {
        title: "Realtime Image Classification",
        description: "Real-time image classification using deep learning models to categorize objects and scenes.",
        roles: ["AI Engineer", "Machine Learning"],
        image: "/images/case-studies/image-classification-hero.jpg",
        url: "/case-studies/image-classification"
    },
    {
        title: "Face Landmark Detection",
        description: "MediaPipe-powered face landmark detection that extracts facial feature points in real-time. Displays landmark output numbers at the bottom of the camera frame for database storage and subsequent face matching.",
        roles: ["AI Engineer", "Computer Vision"],
        image: "/images/case-studies/face-pattern.webp",
        url: "/case-studies/face-landmark"
    }
]

export const GET = async () => {
    return NextResponse.json({
        featureWork
    });
};