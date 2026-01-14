import Divider from "@/app/components/divider"
import HeroSection from "@/app/components/case-studies/object-detection-architecture/hero-section"
import Description from "@/app/components/case-studies/object-detection-architecture/description"
import RelatedWork from "@/app/components/case-studies/shared/related-work"

const ObjectDetectionArchitecturePage = () => {
  return (
    <main>
      <HeroSection />
      <Divider />
      <Description />
      <Divider />
      <RelatedWork
        title="Platform Engineering & Infrastructure"
        description="Production-grade services using Docker and Kubernetes with comprehensive monitoring, alerting, and cost optimization strategies."
        href="/case-studies/platform-engineering"
        image="/images/case-studies/object-detection-hero.jpeg"
      />
      <Divider />
    </main>
  )
}

export default ObjectDetectionArchitecturePage
