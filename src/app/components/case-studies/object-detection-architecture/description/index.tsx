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
                                I designed and implemented a near real-time object detection system using an
                                event-driven architecture to handle high-volume image inference workloads.
                                The system leverages Google Cloud Storage events as the ingestion trigger,
                                where every new image upload automatically emits an event that initiates
                                downstream processing.
                            </p>

                            <p>
                                These events are consumed by Cloud Run services and propagated through Kafka,
                                enabling asynchronous, decoupled processing across the inference pipeline.
                                This architecture ensures high availability, fault isolation, and elasticity
                                under variable traffic patterns.
                            </p>

                            <h3 className="text-lg font-semibold text-primary mt-4">Scalable Inference</h3>
                            <p>
                                For inference execution, the system is designed to process thousands of images
                                per second using a scalable consumer-based architecture. Kafka acts as the
                                buffering and load-balancing layer, allowing inference workers to scale
                                independently based on demand.
                            </p>

                            <p>
                                GPU-backed inference services are deployed with explicit throughput and
                                concurrency limits, ensuring predictable performance and stable utilization.
                                The inference pipeline supports horizontal scaling without tight coupling
                                between ingestion rate and processing capacity, making it suitable for
                                bursty and sustained workloads.
                            </p>

                            <h3 className="text-lg font-semibold text-primary mt-4">Cost-Controlled GPU Scaling</h3>
                            <p>
                                A key architectural decision was cost-controlled GPU scaling. Instead of
                                auto-scaling GPUs based on incoming traffic, GPU inference capacity is
                                deliberately capped based on measured GPU inference capability (throughput
                                per second).
                            </p>

                            <p>
                                Under high traffic conditions, the system introduces controlled inference
                                delays via Kafka backpressure, rather than triggering uncontrolled GPU
                                scaling or service failures. This approach prevents GPU cost spikes, avoids
                                server downtime, and guarantees system stability even during traffic surges,
                                making the solution both cost-efficient and production-safe for large-scale
                                deployment.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Description
