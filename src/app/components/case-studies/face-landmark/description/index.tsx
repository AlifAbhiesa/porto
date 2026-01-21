const Description = () => {
    return (
        <section>
            <div className="container">
                <div className="border-x border-primary/10">
                    <div className="flex flex-col gap-8 max-w-3xl mx-auto px-4 sm:px-7 py-11 md:py-16">
                        <div className="flex flex-col gap-4">
                            <p className="text-sm tracking-[2px] text-primary uppercase font-medium">
                                About Face Landmark Detection
                            </p>
                        </div>

                        <div className="flex flex-col gap-6 text-secondary leading-relaxed">
                            <p>
                                Face landmark detection is a computer vision technique that identifies and tracks
                                specific facial feature points in real-time. The MediaPipe Face Landmarker model
                                detects 478 landmarks on a human face, covering key areas such as eyes, eyebrows,
                                nose, lips, and the face contour. These landmarks provide precise spatial coordinates
                                that can be used for various applications including face recognition, emotion detection,
                                and augmented reality filters.
                            </p>

                            <p>
                                In this implementation, the detected landmark coordinates are displayed as numerical
                                outputs at the bottom of the camera frame. These numbers represent the normalized
                                x, y, and z coordinates of each facial point. By saving these coordinates to a database,
                                you can create a unique facial signature for each person. This signature can later be
                                used for face matching by comparing the stored landmark positions with newly detected
                                faces, enabling applications like attendance systems, access control, and personalized
                                user experiences.
                            </p>

                            <p>
                                The matching process works by calculating the similarity between two sets of landmark
                                coordinates using distance metrics like Euclidean distance or cosine similarity.
                                A high similarity score indicates a match, while variations account for differences
                                in pose, expression, and lighting conditions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Description
