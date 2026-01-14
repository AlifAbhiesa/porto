import { NextResponse } from "next/server";

const experienceData = [
    {
        icon: "/images/icon/mileapp_logo.jpeg",
        role: "Lead AI and Backend Engineer - MileApp",
        location: "Remote",
        startYear: "2023",
        endYear: "Present",
        bulletPoints: [
            "Led an AI project, achieving 98% detection accuracy to support large-scale merchandising",
            "Designed and implemented a continuous learning pipeline for ML models with regular retraining and accuracy monitoring",
            "Optimized backend handling 10M+ daily requests, cutting infrastructure costs by 50%",
            "Implemented ClickHouse as OLAP solution, improving analytics performance and reducing storage costs",
            "Upgraded Laravel framework from version 10 to 12 with minimal disruption",
            "Mentored team members, improving delivery speed by 50%"
        ]
    },
    {
        icon: "/images/icon/mileapp_logo.jpeg",
        role: "Senior Software Engineer - MileApp",
        location: "Remote",
        startYear: "2022",
        endYear: "2023",
        bulletPoints: [
            "Spearheaded development of core features (field service, automation, licensing)",
            "Built high-performance automation using event driven architecture with Elasticsearch, Kafka, and Redis, reducing processing time by 40%",
            "Implemented Unit tests, increasing coverage to 90%",
            "Built real-time monitoring via Discord alerts for engineering and client teams"
        ]
    },
    {
        icon: "/images/icon/detik-icon.svg",
        role: "Software Engineer - DetikNetwork",
        location: "Jakarta, ID",
        startYear: "2021",
        endYear: "2022",
        bulletPoints: [
            "Developed ticketing platform for transentertainment.com, integrating with Allo Bank payments",
            "Built internal email blast system with Flask + Laravel, improving email throughput by 50% using Celery, RabbitMQ, and Flower"
        ]
    },
    {
        icon: "/images/icon/erloom-icon.svg",
        role: "Software Engineer - Erloom Digital Venture",
        location: "Jakarta, ID",
        startYear: "2020",
        endYear: "2021",
        bulletPoints: [
            "Delivered full-stack Laravel projects for multiple clients with monolithic architecture",
            "Automated VM setup using Ansible, reducing provisioning time by 50%",
            "Implemented CI/CD pipelines via GitLab and optimized load balancing with HAProxy"
        ]
    },
]

const educationData = [
    {
        date: "2015 - 2019",
        title: "Bachelor of Informatics Engineering",
        subtitle: "Institut Teknologi Nasional, Bandung — GPA: 3.68"
    },
];


const projectOverview = {
    caseStudies: [
        { name: "Scalable Analytics Platform", url: "/case-studies/analytics-platform" },
        { name: "Event-Driven Object Detection", url: "/case-studies/object-detection-architecture" },
        { name: "Platform Engineering & Infrastructure", url: "/case-studies/platform-engineering" },
    ],
};


export const GET = async () => {
    return NextResponse.json({
        experienceData,
        educationData,
        projectOverview
    });
};
