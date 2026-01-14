import Link from "next/link"
import Image from "next/image"

interface RelatedWorkProps {
    title: string
    description: string
    href: string
    image: string
}

const RelatedWork = ({ title, description, href, image }: RelatedWorkProps) => {
    return (
        <section>
            <div className="container">
                <div className="border-x border-primary/10">
                    <div className="flex flex-col gap-6 max-w-3xl mx-auto px-4 sm:px-7 py-11 md:py-16">
                        <div className="flex flex-col gap-4">
                            <p className="text-sm tracking-[2px] text-primary uppercase font-medium">
                                Related Work
                            </p>
                        </div>

                        <Link href={href} className="group block">
                            <div className="flex flex-col sm:flex-row gap-6 p-4 border border-primary/10 rounded-lg hover:border-violet-500/50 transition-colors">
                                <div className="relative w-full sm:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                        src={image}
                                        alt={title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <div className="flex flex-col gap-2 justify-center">
                                    <h4 className="text-lg font-semibold group-hover:text-violet-700 transition-colors">
                                        {title}
                                    </h4>
                                    <p className="text-secondary text-sm">
                                        {description}
                                    </p>
                                    <span className="text-violet-700 text-sm font-medium">
                                        View case study &rarr;
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default RelatedWork
