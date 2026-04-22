import Divider from "@/app/components/divider"
import HeroSection from "@/app/components/case-studies/ai-retail-leadership/hero-section"
import Description from "@/app/components/case-studies/ai-retail-leadership/description"
import RelatedWork from "@/app/components/case-studies/shared/related-work"

const AiRetailLeadershipPage = () => {
  return (
    <main>
      <HeroSection />
      <Divider />
      <Description />
      <Divider />
      <RelatedWork
        title="OCR Solutions for Retail"
        description="End-to-end OCR pipelines for price tag reading, invoice extraction with rule-based parsing, and dynamic receipt understanding using Vision Language Models."
        href="/case-studies/ocr-retail"
        image="/images/case-studies/ocr-retail-hero.jpg"
      />
      <Divider />
    </main>
  )
}

export default AiRetailLeadershipPage
