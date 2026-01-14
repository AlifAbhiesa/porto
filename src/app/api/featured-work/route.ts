import { NextResponse } from "next/server";

const featureWork = [
    {
        title: "Scalable Analytics Platform",
        description: "Production-grade data pipelines using n8n orchestration with ClickHouse for high-throughput analytics and Metabase for self-service BI.",
        roles: ["Data Engineer", "Backend Engineer"],
        image: "/images/case-studies/object-detection-hero.jpeg",
        url: "/case-studies/analytics-platform"
    },
    {
        title: "Event-Driven Object Detection",
        description: "Near real-time object detection system using event-driven architecture with Kafka, Cloud Run, and cost-controlled GPU scaling.",
        roles: ["AI Engineer", "Platform Engineer"],
        image: "/images/case-studies/image-classification-hero.jpg",
        url: "/case-studies/object-detection-architecture"
    }
]

export const GET = async () => {
    return NextResponse.json({
        featureWork
    });
};