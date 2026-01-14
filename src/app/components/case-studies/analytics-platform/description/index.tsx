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
                                I designed and implemented production-grade data pipelines using n8n as a no-code
                                orchestration layer, responsible for ingesting, validating, and transforming data
                                from multiple sources at scale. The pipelines are built with fault-tolerant workflows,
                                retry mechanisms, batching, and asynchronous processing to reliably handle millions
                                of incoming events and API requests.
                            </p>

                            <p>
                                Data is normalized and enriched within the pipeline before being written downstream,
                                ensuring schema consistency and minimizing downstream processing overhead.
                            </p>

                            <h3 className="text-lg font-semibold text-primary mt-4">Storage & Analytics</h3>
                            <p>
                                For storage and analytics, the pipelines stream data into ClickHouse, chosen for its
                                column-oriented architecture, high ingestion throughput, and sub-second analytical
                                query performance. Tables are designed with appropriate partitioning, ordering keys,
                                and TTL policies to optimize write performance, query latency, and storage cost.
                            </p>

                            <p>
                                This setup allows the system to ingest dozens of datasets per day while keeping
                                infrastructure cost low, even under sustained high write volume. The architecture
                                is horizontally scalable and capable of maintaining predictable performance as
                                data volume grows.
                            </p>

                            <h3 className="text-lg font-semibold text-primary mt-4">Self-Service BI Layer</h3>
                            <p>
                                On the analytics layer, I integrated Metabase as a self-service BI tool on top of
                                ClickHouse. Optimized schemas and pre-aggregated views enable fast dashboard rendering
                                with low query latency, even on large datasets. Role-based access and dataset abstraction
                                allow non-technical users to build and maintain their own dashboards without engineering
                                involvement, while the underlying pipeline remains stable, scalable, and production-ready
                                for long-term use.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Description
