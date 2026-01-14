import Divider from "@/app/components/divider"
import HeroSection from "@/app/components/case-studies/analytics-platform/hero-section"
import Description from "@/app/components/case-studies/analytics-platform/description"
import RelatedWork from "@/app/components/case-studies/shared/related-work"

const AnalyticsPlatformPage = () => {
  return (
    <main>
      <HeroSection />
      <Divider />
      <Description />
      <Divider />
      <RelatedWork
        title="Event-Driven Object Detection"
        description="Near real-time object detection system using event-driven architecture with Kafka, Cloud Run, and cost-controlled GPU scaling."
        href="/case-studies/object-detection-architecture"
        image="/images/case-studies/image-classification-hero.jpg"
      />
      <Divider />
    </main>
  )
}

export default AnalyticsPlatformPage
