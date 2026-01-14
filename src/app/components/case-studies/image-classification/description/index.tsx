const Description = () => {
    return (
        <section>
            <div className="container">
                <div className="border-x border-primary/10">
                    <div className="flex flex-col gap-8 max-w-3xl mx-auto px-4 sm:px-7 py-11 md:py-16">
                        <div className="flex flex-col gap-4">
                            <p className="text-sm tracking-[2px] text-primary uppercase font-medium">
                                About Image Classification
                            </p>
                        </div>

                        <div className="flex flex-col gap-6 text-secondary leading-relaxed">
                            <p>
                                Image classification is a fundamental computer vision task that involves
                                categorizing an entire image into one of several predefined classes.
                                Unlike object detection which locates multiple objects, classification
                                answers the question &quot;what is the main subject of this image?&quot;
                                This technology is widely used in applications like photo organization,
                                medical imaging, and quality control.
                            </p>

                            <p>
                                This demo uses a MobileNet model optimized for real-time inference in
                                web browsers. MobileNet is designed to be lightweight while maintaining
                                good accuracy, making it ideal for mobile and edge devices. The model
                                can classify images into 1000 different categories from the ImageNet
                                dataset, including animals, objects, vehicles, and scenes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Description
