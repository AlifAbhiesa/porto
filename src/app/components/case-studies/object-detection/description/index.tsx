const Description = () => {
    return (
        <section>
            <div className="container">
                <div className="border-x border-primary/10">
                    <div className="flex flex-col gap-8 max-w-3xl mx-auto px-4 sm:px-7 py-11 md:py-16">
                        <div className="flex flex-col gap-4">
                            <p className="text-sm tracking-[2px] text-primary uppercase font-medium">
                                About Object Detection
                            </p>
                        </div>

                        <div className="flex flex-col gap-6 text-secondary leading-relaxed">
                            <p>
                                Object detection is a computer vision technique that identifies and locates objects
                                within images or video streams. Unlike simple image classification which only tells
                                you what&apos;s in an image, object detection provides both the category of each object
                                and its precise location through bounding boxes. This technology powers many
                                real-world applications from autonomous vehicles detecting pedestrians to retail
                                systems monitoring inventory on shelves.
                            </p>

                            <p>
                                The EfficientDet-Lite model used in this demo is optimized for edge devices and
                                web browsers, offering a balance between accuracy and speed. It can detect 80
                                different object categories from the COCO dataset, including people, vehicles,
                                animals, and everyday items. The model processes each video frame independently,
                                analyzing visual features to predict both what objects are present and where they
                                are located in the frame.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Description
