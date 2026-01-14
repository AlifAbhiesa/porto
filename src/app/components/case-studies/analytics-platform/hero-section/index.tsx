import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

const HeroSection = () => {
    return (
        <section>
            <div className="container">
                <div className="w-full h-64 md:h-80">
                    <Image
                        src="/images/case-studies/object-detection-hero.jpeg"
                        alt="Analytics Platform"
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
                                <span className="text-xs sm:text-sm font-medium text-primary">Case Study</span>
                            </Badge>
                            <Badge variant="outline" className="py-1.5 px-3 rounded-lg">
                                <span className="text-xs sm:text-sm font-medium text-primary">Data Engineering</span>
                            </Badge>
                            <Badge variant="outline" className="py-1.5 px-3 rounded-lg">
                                <span className="text-xs sm:text-sm font-medium text-primary">Analytics</span>
                            </Badge>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                            Scalable Analytics Platform
                        </h1>
                        <p className="text-lg text-secondary">
                            Production-grade data pipelines using n8n orchestration with ClickHouse
                            for high-throughput analytics and Metabase for self-service BI.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HeroSection
