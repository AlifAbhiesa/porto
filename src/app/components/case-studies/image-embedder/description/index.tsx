const Description = () => {
    return (
        <section>
            <div className="container">
                <div className="border-x border-primary/10">
                    <div className="flex flex-col gap-8 max-w-3xl mx-auto px-4 sm:px-7 py-11 md:py-16">
                        <div className="flex flex-col gap-4">
                            <p className="text-sm tracking-[2px] text-primary uppercase font-medium">
                                About Image Embedder
                            </p>
                        </div>

                        <div className="flex flex-col gap-6 text-secondary leading-relaxed">
                            <p>
                                Image embedding is a technique that converts an image into a compact numerical
                                vector (embedding) that captures its visual features. Two images with similar
                                content will produce embeddings that are close together in the vector space,
                                enabling efficient similarity comparison without pixel-by-pixel analysis.
                            </p>

                            <p>
                                This implementation uses MediaPipe&apos;s Image Embedder with the MobileNet V3 Small
                                model to generate L2-normalized embeddings for each uploaded image. The similarity
                                between two images is then computed using cosine similarity, which measures the
                                angle between two embedding vectors — a score of 1.0 means identical, while 0.0
                                means completely different.
                            </p>

                            <p>
                                All processing runs entirely in your browser using WebAssembly. No images are
                                uploaded to any server, ensuring complete privacy. Uploaded files are validated
                                for type and size, and image data is released from memory immediately after
                                embedding extraction.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Description
