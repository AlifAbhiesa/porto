import Divider from "@/app/components/divider"
import HeroSection from "@/app/components/case-studies/platform-engineering/hero-section"
import Description from "@/app/components/case-studies/platform-engineering/description"
import RelatedWork from "@/app/components/case-studies/shared/related-work"

const PlatformEngineeringPage = () => {
  return (
    <main>
      <HeroSection />
      <Divider />
      <Description />
      <Divider />
      <RelatedWork
        title="Scalable Analytics Platform"
        description="Production-grade data pipelines using n8n orchestration with ClickHouse for high-throughput analytics and Metabase for self-service BI."
        href="/case-studies/analytics-platform"
        image="/images/case-studies/object-detection-hero.jpeg"
      />
      <Divider />
    </main>
  )
}

export default PlatformEngineeringPage
