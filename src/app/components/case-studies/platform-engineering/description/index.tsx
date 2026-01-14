const Description = () => {
    return (
        <section>
            <div className="container">
                <div className="border-x border-primary/10">
                    <div className="flex flex-col gap-8 max-w-3xl mx-auto px-4 sm:px-7 py-11 md:py-16">
                        <div className="flex flex-col gap-4">
                            <p className="text-sm tracking-[2px] text-primary uppercase font-medium">
                                About This Project
                            </p>
                        </div>

                        <div className="flex flex-col gap-6 text-secondary leading-relaxed">
                            <p>
                                I have broad experience setting up and operating production-grade services
                                using Docker and Kubernetes, covering the full lifecycle from development
                                to deployment. This includes designing CI/CD pipelines, containerizing
                                services, managing environment configuration, pointing and managing DNS,
                                and implementing auto-scaling strategies at both application and
                                infrastructure levels.
                            </p>

                            <p>
                                I am comfortable deploying workloads across managed and self-hosted
                                environments, ensuring reliability, repeatability, and minimal
                                operational overhead.
                            </p>

                            <h3 className="text-lg font-semibold text-primary mt-4">Observability & Reliability</h3>
                            <p>
                                From an observability and reliability standpoint, I design and maintain
                                monitoring and alerting systems using tools such as Grafana, along with
                                metrics exporters and logging pipelines. These systems provide real-time
                                visibility into service health, resource utilization, throughput, and
                                latency, enabling proactive issue detection and data-driven scaling decisions.
                            </p>

                            <p>
                                Monitoring is treated as a first-class component of the architecture
                                rather than an afterthought, ensuring long-term system stability under
                                production traffic.
                            </p>

                            <h3 className="text-lg font-semibold text-primary mt-4">Cost Analysis & Optimization</h3>
                            <p>
                                In addition to system delivery, I have strong capability in server-side
                                cost analysis and optimization. I can analyze traffic patterns, request
                                volume, data growth, disk usage, and retention requirements to define
                                and execute cost-reduction strategies without sacrificing performance
                                or reliability.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Description
