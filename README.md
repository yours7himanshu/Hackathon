# Medi Buddy – Hackathon Project

## Prerequisites

Before setting up the project, ensure the following are installed:

- **PostgreSQL**  
- **Node.js**  
- **pnpm** (Package Manager)

---

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yours7himanshu/Hackathon.git
   cd Hackathon
   ```

2. **Create Environment Variables File**

   Create a file named `.env.local` in the root of the project and add the following environment variables:

   ```env
   FIRECRAWL_API_KEY=****

   GROQ_API_KEY=****

   AUTH_SECRET=****

   MAX_DURATION=60

   BLOB_READ_WRITE_TOKEN=****

   POSTGRES_URL=****

   REASONING_MODEL='llama-3.3-70b-versatile'

   BYPASS_JSON_VALIDATION=false

   UPSTASH_REDIS_REST_URL=https://discrete-ray-26330.upstash.io

   UPSTASH_REDIS_REST_TOKEN=****

   BYPASS_JSON_VALIDATION=true

   TOGETHER_API_KEY=****

   NEXT_PUBLIC_NEWS_API_KEY=****
   ```

   > 🔔 **Note**: Replace all the `****` placeholders with your actual API keys and credentials.

3. **Install Dependencies**
   ```bash
   pnpm install
   ```

4. **Migrate the Database**
   ```bash
   pnpm db:migrate
   ```

5. **Run the Development Server**
   ```bash
   pnpm dev
   ```

---

## Team: **Super-AI-BROS**

- **Tarandeep Singh**
- **Himanshu Dinkar**
- **Namit Jain**
- **Prayag Parashar**

---

## Problem Statement:  
**What Medi Buddy Solves**

Despite significant advances in AI and healthcare technology, there is still a lack of **domain-specific Large Language Models (LLMs)** for medical applications. Key issues include:

- Inaccurate and unreliable responses to specialized medical queries
- Lack of real-time updates based on the latest medical research and news
- Inadequate tools to help researchers, doctors, and users analyze medical reports in depth

This gap **limits the effectiveness** of AI in healthcare and impacts the reliability of information available to professionals and the public.

---

## Our Solution:  
**Medi Buddy – A Domain-Specific Medical Agent**

We are building a specialized **medical LLM agent** that can:

- **Accurately answer** a wide range of medical-related questions
- **Provide real-time updates** on the latest medical research and news
- **Assist in analyzing complex medical reports** for researchers, doctors, and regular users

By combining state-of-the-art NLP techniques with **continuously updated medical knowledge**, our solution aims to:

- Bridge the current gap
- Improve the **accessibility, reliability, and impact** of AI in the healthcare sector

---

## Challenges We Faced

### 1. Chat Feature Development

While integrating the chat feature using **Groq** (initially planned with **OpenRouter**), we faced the following issues:

- A **bug** caused the **Deep Research** feature to malfunction — it could no longer properly think and analyze scraped data.

### 2. Changes Implemented

- Temporarily **limited the scraping capabilities** to maintain system stability.
- Despite the bug, we **cannot revert to OpenRouter** because:
  - **Groq is approximately 100× faster** than OpenRouter.
  
We are actively working on a fix to **restore full functionality** while maintaining the performance benefits Groq offers.

---
