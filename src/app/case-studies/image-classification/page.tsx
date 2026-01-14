import Divider from "@/app/components/divider"
import HeroSection from "@/app/components/case-studies/image-classification/hero-section"
import Description from "@/app/components/case-studies/image-classification/description"
import Demo from "@/app/components/case-studies/image-classification/demo"
import RelatedWork from "@/app/components/case-studies/shared/related-work"

const ImageClassificationPage = () => {
  return (
    <main>
      <HeroSection />
      <Divider />
      <Description />
      <Divider />
      <Demo />
      <Divider />
      <RelatedWork
        title="Realtime Object Detection"
        description="Real-time object detection using EfficientDet-Lite model to detect and locate objects in your camera feed."
        href="/case-studies/object-detection"
        image="/images/case-studies/object-detection-hero.jpeg"
      />
      <Divider />
    </main>
  )
}

export default ImageClassificationPage
