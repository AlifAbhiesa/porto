import Divider from "@/app/components/divider"
import HeroSection from "@/app/components/case-studies/object-detection/hero-section"
import Description from "@/app/components/case-studies/object-detection/description"
import Demo from "@/app/components/case-studies/object-detection/demo"
import RelatedWork from "@/app/components/case-studies/shared/related-work"

const ObjectDetectionPage = () => {
  return (
    <main>
      <HeroSection />
      <Divider />
      <Description />
      <Divider />
      <Demo />
      <Divider />
      <RelatedWork
        title="Realtime Image Classification"
        description="Real-time image classification using deep learning models to categorize objects and scenes in your camera feed."
        href="/case-studies/image-classification"
        image="/images/case-studies/image-classification-hero.jpg"
      />
      <Divider />
    </main>
  )
}

export default ObjectDetectionPage
