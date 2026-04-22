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
                                I led a dedicated team focused on a single end-to-end AI project for
                                retail &mdash; from initial dataset collection all the way to production model
                                deployment and continuous improvement. As the project head, I was responsible
                                for both the technical direction and the day-to-day management of the entire team.
                            </p>

                            <h3 className="text-lg font-semibold text-primary mt-4">Team Structure</h3>
                            <p>
                                The team consisted of 10 people with clearly defined roles:
                            </p>
                            <ul className="list-disc list-inside flex flex-col gap-2 pl-2">
                                <li><span className="font-medium text-primary">5 Data Labellers</span> &mdash; responsible for annotating images following strict labelling guidelines</li>
                                <li><span className="font-medium text-primary">1 Lead Labeller</span> &mdash; reviewing annotation quality, resolving edge cases, and reporting labelling progress</li>
                                <li><span className="font-medium text-primary">2 Implementors</span> &mdash; handling model integration, deployment, and feature implementation on the product side</li>
                                <li><span className="font-medium text-primary">1 Backend Engineer</span> &mdash; building and maintaining APIs, data pipelines, and infrastructure</li>
                                <li><span className="font-medium text-primary">Myself as Head</span> &mdash; leading the project while also developing AI features and maintaining the model directly</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-primary mt-4">End-to-End AI Lifecycle</h3>
                            <p>
                                The project covered every stage of the AI lifecycle. It started with dataset
                                collection &mdash; gathering and curating images from real retail environments. From
                                there, the data went through structured annotation, model training, evaluation,
                                and deployment. But the work didn&apos;t stop at deployment.
                            </p>
                            <p>
                                I designed and implemented a continuous learning pipeline driven by user feedback.
                                When the model made predictions in production, user corrections and feedback were
                                collected. Selected images were filtered through a rule-based selection process,
                                then fed back into the dataset to be labelled and used for retraining. This
                                feedback loop ensured that the model kept improving over time based on real-world
                                usage, not just static benchmark data.
                            </p>

                            <h3 className="text-lg font-semibold text-primary mt-4">SOPs & Parallel Workflows</h3>
                            <p>
                                One of the key challenges was coordinating multiple roles working simultaneously.
                                I established Standard Operating Procedures (SOPs) and structured reporting for
                                every role in the team:
                            </p>
                            <ul className="list-disc list-inside flex flex-col gap-2 pl-2">
                                <li><span className="font-medium text-primary">Data Annotators</span> followed daily labelling targets with clear guidelines and edge-case documentation</li>
                                <li><span className="font-medium text-primary">Lead Labeller</span> reported annotation quality metrics and flagged ambiguous cases for resolution</li>
                                <li><span className="font-medium text-primary">Developers</span> worked on separate, well-scoped tasks with clear acceptance criteria</li>
                            </ul>
                            <p>
                                By breaking down the work, analyzing dependencies, and creating separate task
                                streams, all roles operated in parallel every day. Labellers annotated while
                                developers built features, while the backend engineer maintained pipelines,
                                and while I trained and evaluated models &mdash; all moving forward simultaneously
                                without blocking each other.
                            </p>

                            <h3 className="text-lg font-semibold text-primary mt-4">Quality & Transparency</h3>
                            <p>
                                The project was maintained with minimal tech debt. Model accuracy remained stable
                                and consistently improved through the feedback-driven retraining cycles. Training
                                results were fully transparent &mdash; every training run was documented with metrics,
                                dataset versions, and evaluation results so the team and stakeholders always had
                                clear visibility into model performance.
                            </p>
                            <p>
                                This combination of structured team management, clear SOPs, parallel execution,
                                and a well-designed continuous learning pipeline allowed the project to run
                                efficiently day-to-day while steadily improving the AI model that powered the
                                retail solution.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Description
