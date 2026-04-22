import Link from "next/link"

const Description = () => {
    const models = [
        {
            name: "EasyOCR",
            description: "Ready-to-use OCR with 80+ language support. Used for straightforward text extraction from price tags and labels.",
            url: "https://github.com/jaidedai/easyocr",
        },
        {
            name: "FireRed-OCR",
            description: "High-accuracy OCR model for complex document layouts with multi-language support.",
            url: "https://huggingface.co/FireRedTeam/FireRed-OCR",
        },
        {
            name: "LFM2.5-VL-450M",
            description: "Compact Vision Language Model from Liquid AI, efficient for lightweight OCR and document understanding tasks.",
            url: "https://huggingface.co/LiquidAI/LFM2.5-VL-450M",
        },
        {
            name: "Qianfan-OCR",
            description: "Baidu's OCR model with strong performance on structured and semi-structured documents like invoices and receipts.",
            url: "https://huggingface.co/baidu/Qianfan-OCR",
        },
        {
            name: "PaddleOCR-VL-1.5",
            description: "Vision-language OCR model from PaddlePaddle, combining visual understanding with text extraction for end-to-end document parsing.",
            url: "https://huggingface.co/PaddlePaddle/PaddleOCR-VL-1.5",
        },
    ]

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
                                Optical Character Recognition (OCR) is one of the most common and impactful use cases
                                in the retail industry. Throughout my work, I have implemented OCR solutions ranging
                                from straightforward text extraction to complex document understanding pipelines,
                                each tailored to specific business needs in retail operations.
                            </p>

                            <h3 className="text-lg font-semibold text-primary mt-4">Price Tag Reading & Product Matching</h3>
                            <p>
                                I built an OCR pipeline for reading price tags captured in-store by field agents.
                                The system extracts product names and prices from tag images using a combination
                                of image preprocessing (adaptive thresholding, perspective correction) and OCR
                                engines. The extracted text is then passed through a fuzzy matching algorithm
                                to find the closest matching product in the catalog database, enabling automated
                                price monitoring and competitor price comparison at scale.
                            </p>

                            <h3 className="text-lg font-semibold text-primary mt-4">Invoice Data Extraction with Rule-Based Parsing</h3>
                            <p>
                                For structured documents like invoices, I implemented an extraction pipeline that
                                combines OCR with static rule-based parsing. Since invoice layouts from known
                                suppliers follow consistent templates, the system uses predefined coordinate
                                regions and regex patterns to reliably extract fields such as invoice number,
                                date, vendor name, line items, and totals. The extracted data is validated
                                against business rules and saved to the database, eliminating manual data entry
                                and significantly reducing processing time for accounts payable workflows.
                            </p>

                            <h3 className="text-lg font-semibold text-primary mt-4">Dynamic Receipt Extraction with VLM & vLLM</h3>
                            <p>
                                For receipts and documents with highly variable layouts, traditional rule-based
                                approaches fall short. I implemented a Vision Language Model (VLM) based extraction
                                pipeline that understands document structure visually and semantically. The model
                                receives receipt images and extracts structured data including merchant info,
                                line items, quantities, prices, taxes, and totals regardless of the receipt format.
                            </p>
                            <p>
                                To serve the VLM efficiently in production, I deployed it using vLLM (Easy, fast,
                                and cheap LLM serving for everyone), which provides high-throughput inference with
                                continuous batching, PagedAttention for memory efficiency, and OpenAI-compatible
                                API endpoints. This setup keeps inference costs low while maintaining fast response
                                times, making it practical for high-volume retail document processing.
                            </p>

                            <h3 className="text-lg font-semibold text-primary mt-4">Impact</h3>
                            <p>
                                These OCR solutions collectively address the most common document processing
                                challenges in retail: from simple, high-accuracy extraction on known formats
                                to flexible, AI-powered understanding of arbitrary documents. The approach of
                                matching complexity to the problem &mdash; rule-based for static layouts, VLM for
                                dynamic ones &mdash; ensures both cost efficiency and accuracy across use cases.
                            </p>

                            <h3 className="text-lg font-semibold text-primary mt-4">Models & Tools Used</h3>
                            <div className="flex flex-col gap-3">
                                {models.map((model, index) => (
                                    <Link
                                        key={index}
                                        href={model.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col gap-1 p-4 border border-primary/10 rounded-lg hover:border-violet-500/50 transition-colors"
                                    >
                                        <span className="text-sm font-semibold text-violet-700">{model.name}</span>
                                        <span className="text-sm text-secondary">{model.description}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Description
