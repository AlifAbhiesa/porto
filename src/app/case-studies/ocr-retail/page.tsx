import Divider from "@/app/components/divider"
import HeroSection from "@/app/components/case-studies/ocr-retail/hero-section"
import Description from "@/app/components/case-studies/ocr-retail/description"
import RelatedWork from "@/app/components/case-studies/shared/related-work"

const OcrRetailPage = () => {
  return (
    <main>
      <HeroSection />
      <Divider />
      <Description />
      <Divider />
      <RelatedWork
        title="Realtime Object Detection"
        description="Real-time object detection using EfficientDet-Lite model, demonstrating practical AI implementation in the browser."
        href="/case-studies/object-detection"
        image="/images/case-studies/object-detection-hero.jpeg"
      />
      <Divider />
    </main>
  )
}

export default OcrRetailPage
