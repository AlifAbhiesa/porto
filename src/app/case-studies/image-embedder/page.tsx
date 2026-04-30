import Divider from "@/app/components/divider"
import HeroSection from "@/app/components/case-studies/image-embedder/hero-section"
import Description from "@/app/components/case-studies/image-embedder/description"
import Demo from "@/app/components/case-studies/image-embedder/demo"
import VectorSearch from "@/app/components/case-studies/image-embedder/vector-search"
import RelatedWork from "@/app/components/case-studies/shared/related-work"

const ImageEmbedderPage = () => {
  return (
    <main>
      <HeroSection />
      <Divider />
      <Description />
      <Divider />
      <Demo />
      <Divider />
      <VectorSearch />
      <Divider />
      <RelatedWork
        title="Face Landmark Detection"
        description="MediaPipe-powered face landmark detection that extracts facial feature points in real-time for database storage and face matching."
        href="/case-studies/face-landmark"
        image="/images/case-studies/face-pattern.webp"
      />
      <Divider />
    </main>
  )
}

export default ImageEmbedderPage
