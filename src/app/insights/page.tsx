import Link from "next/link"
import Divider from "@/app/components/divider"

const qna = [
    {
        question: "What's the difference between fine-tuning and RAG, and when do you use each?",
        answer: `Fine-tuning is when you retrain or adapt a model's weights on your own dataset so the model internalizes domain-specific knowledge or behavior. RAG (Retrieval-Augmented Generation) keeps the model as-is but feeds it relevant context from an external knowledge base at inference time.

In practice, I use RAG when the knowledge changes frequently, like product catalogs, internal docs, or support tickets, because you just update the vector store without retraining anything. Fine-tuning makes more sense when you need the model to behave differently, for example following a specific output format consistently, adopting a particular tone, or learning a niche domain where generic models fall short.

In retail projects, I've mostly used RAG for anything document-heavy and fine-tuning when we needed a specialized classifier or extraction model that had to run fast and cheap at the edge.`
    },
    {
        question: "What is embedding similarity and how does cosine distance work?",
        answer: `Embeddings are dense vector representations of text, images, or anything really, where semantically similar items end up close together in vector space. Cosine distance measures the angle between two vectors. If two embeddings point in roughly the same direction, cosine similarity is close to 1, meaning they're semantically similar regardless of their magnitude.

I've used this extensively in product matching pipelines. For example, when doing OCR on price tags, the extracted text is rarely a perfect match to the product name in our catalog. By embedding both the OCR output and catalog entries, then ranking by cosine similarity, we find the closest product even when the text has typos or abbreviations. It's simple, fast, and surprisingly effective for fuzzy matching at scale.`
    },
    {
        question: "Explain the transformer attention mechanism in plain terms. What's a vector database and why does it matter for LLM apps?",
        answer: `The attention mechanism lets a model decide which parts of the input are most relevant to each other. Instead of processing tokens sequentially, the model computes a relevance score between every pair of tokens. So when it's processing the word "it" in a sentence, it can attend strongly to the noun "it" refers to, even if it's far away. That's the core of why transformers are so good at understanding context.

A vector database is a storage system optimized for similarity search over high-dimensional vectors. When you embed documents into vectors, you need something that can efficiently find the nearest neighbors out of millions of entries. Traditional databases can't do this well. Tools like Qdrant, Pinecone, or pgvector are built specifically for this.

For LLM apps, this is the backbone of RAG. Your documents are chunked, embedded, and stored in a vector DB. At query time, you embed the user's question, find the most relevant chunks via similarity search, and pass those chunks as context to the LLM. Without a vector database, RAG at any meaningful scale doesn't work.`
    },
    {
        question: "What's the difference between precision and recall? What does it mean for a model to \"hallucinate\" and how do you reduce it?",
        answer: `Precision answers the question "of everything the model flagged as positive, how many were actually correct?" Recall answers "of everything that was actually positive, how many did the model catch?" There's usually a trade-off. If you tighten the threshold, precision goes up but recall drops because you miss more edge cases.

In the retail AI project I led, this trade-off was very real. For product detection, we needed high recall so we don't miss products on the shelf, but also acceptable precision so we don't flag random objects as products. We tuned confidence thresholds per product category based on what mattered more for each use case.

Hallucination is when an LLM generates confident-sounding information that's factually wrong or made up. I reduce it by grounding the model's output. That means using RAG to provide real context, constraining outputs with structured schemas, and adding validation layers that cross-check extracted data against known rules or databases. For receipt extraction, we validate extracted totals against line item sums. If it doesn't add up, we flag it rather than trust the model blindly.`
    },
    {
        question: "What is LLMOps and what does it look like in production?",
        answer: `LLMOps is the operational practice of running LLM-based systems in production reliably. It covers model serving, monitoring, prompt versioning, cost tracking, latency optimization, and feedback loops.

In my experience serving VLMs via vLLM for receipt extraction, LLMOps meant setting up proper inference infrastructure with continuous batching for throughput, monitoring response quality and latency per request, tracking token usage for cost control, and having fallback logic when the model returns malformed output.

It also means treating prompts as code. You version them, test them against evaluation sets, and don't push prompt changes without validating that accuracy holds. In our pipeline, every model update or prompt change went through an evaluation step against a curated test set before it hit production. That's LLMOps in practice. Not just deploying a model, but operating it responsibly.`
    },
    {
        question: "What's the difference between a zero-shot and few-shot prompt?",
        answer: `Zero-shot means you give the model a task with no examples, just the instruction. Few-shot means you include a few input-output examples in the prompt so the model understands the pattern you expect.

I default to zero-shot first because it's cheaper in terms of tokens and often good enough for straightforward tasks. When the output format is specific or the task is ambiguous, I switch to few-shot. For example, when extracting structured data from receipts, a few-shot prompt with 2 or 3 example receipts and their expected JSON output dramatically improved consistency compared to just describing the schema.

The key is that few-shot examples aren't just instructions. They're implicit formatting and reasoning guides. The model picks up on patterns in your examples that are hard to describe explicitly.`
    },
    {
        question: "What is chunking and why does it affect RAG quality?",
        answer: `Chunking is how you split documents into smaller pieces before embedding them for retrieval. It directly affects RAG quality because the chunk is what gets retrieved and fed to the LLM as context. If your chunks are too large, they contain noise that dilutes the relevant information. If they're too small, they lose context and the model can't make sense of them.

I've found that chunk size and overlap matter a lot more than people expect. For structured documents like invoices, I chunk by logical sections such as header, line items, and totals rather than by token count. For unstructured text, I use overlapping chunks, typically 200 to 500 tokens with 50 to 100 token overlap, so that important information at chunk boundaries doesn't get cut in half.

The strategy depends on the retrieval use case. For Q&A over long documents, smaller chunks with semantic similarity work well. For summarization, you need larger chunks that capture full ideas. There's no universal best chunk size. It's always tied to what your downstream model needs to produce a good answer.`
    },
    {
        question: "How do you evaluate an LLM output?",
        answer: `Evaluating LLM output is fundamentally different from evaluating a classifier. There's no single accuracy number. You need multiple dimensions: factual correctness, relevance to the query, format compliance, completeness, and whether it hallucinated.

In practice, I use a combination of automated and human evaluation. For structured extraction tasks like receipt parsing, I compare outputs against ground truth with exact match and fuzzy match metrics. For generative outputs, I use LLM-as-judge approaches where a separate model scores the output on predefined criteria, validated against human ratings.

The most important thing I've learned is that evaluation has to be continuous, not one-time. Models drift, prompts get updated, and edge cases appear in production that weren't in your test set. In our pipeline, we maintain a growing evaluation set sourced from production failures. Every time the model gets something wrong and a human corrects it, that becomes a new test case. That's how you keep evaluation meaningful over time instead of just passing a static benchmark.`
    },
]

const InsightsPage = () => {
    return (
        <main>
            <section>
                <div className="container">
                    <div className="border-x border-primary/10">
                        <div className="flex flex-col gap-6 max-w-3xl mx-auto px-4 sm:px-7 py-10 md:py-16">
                            <Link href="/" className="text-sm text-violet-700 hover:underline">
                                &larr; Back to Home
                            </Link>
                            <div className="flex flex-col gap-4">
                                <p className="text-sm tracking-[2px] text-primary uppercase font-medium">
                                    Things I Keep Learning
                                </p>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                                    AI & LLM Insights
                                </h1>
                                <p className="text-lg text-secondary">
                                    A collection of questions I find interesting and my honest answers based
                                    on real experience building AI systems in production. Not textbook
                                    definitions, just practical takes from someone who has shipped these things.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Divider />
            <section>
                <div className="container">
                    <div className="border-x border-primary/10">
                        <div className="flex flex-col gap-0 max-w-3xl mx-auto">
                            {qna.map((item, index) => (
                                <div key={index}>
                                    <div className="flex flex-col gap-5 px-4 sm:px-7 py-10 md:py-14">
                                        <div className="flex items-start gap-4">
                                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-bold">
                                                {index + 1}
                                            </span>
                                            <h2 className="text-lg sm:text-xl font-semibold text-primary leading-snug">
                                                {item.question}
                                            </h2>
                                        </div>
                                        <div className="pl-12 flex flex-col gap-4 text-secondary leading-relaxed">
                                            {item.answer.split("\n\n").map((paragraph, pIndex) => (
                                                <p key={pIndex}>{paragraph}</p>
                                            ))}
                                        </div>
                                    </div>
                                    {index < qna.length - 1 && <Divider />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            <Divider />
        </main>
    )
}

export default InsightsPage
