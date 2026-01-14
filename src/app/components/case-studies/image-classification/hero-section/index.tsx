import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

const HeroSection = () => {
    return (
        <section>
            <div className="container">
                <div className="w-full h-64 md:h-80">
                    <Image
                        src="/images/case-studies/image-classification-hero.jpg"
                        alt="Image Classification"
                        width={1200}
                        height={400}
                        className="w-full h-full object-cover"
                        priority
                    />
                </div>
                <div className="border-x border-primary/10">
                    <div className="flex flex-col gap-6 max-w-3xl mx-auto px-4 sm:px-7 py-10 md:py-16">
                        <Link href="/" className="text-sm text-violet-700 hover:underline">
                            &larr; Back to Home
                        </Link>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="py-1.5 px-3 rounded-lg">
                                <span className="text-xs sm:text-sm font-medium text-primary">Featured Work</span>
                            </Badge>
                            <Badge variant="outline" className="py-1.5 px-3 rounded-lg">
                                <span className="text-xs sm:text-sm font-medium text-primary">AI/ML</span>
                            </Badge>
                            <Badge variant="outline" className="py-1.5 px-3 rounded-lg">
                                <span className="text-xs sm:text-sm font-medium text-primary">Machine Learning</span>
                            </Badge>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                            Realtime Image Classification
                        </h1>
                        <p className="text-lg text-secondary">
                            Real-time image classification using deep learning models to
                            categorize objects and scenes in your camera feed.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HeroSection
