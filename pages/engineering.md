---
title: "Engineering"
permalink: "/engineering/"
layout: page
mermaid: true
---

## Overview

I build across the full stack - from Python APIs through to cloud infrastructure and ML systems to TypeScript frontends and dashboards - with a focus on shipping AI-powered products that are reliable and scalable. My engineering work sits at the intersection of AI engineering, systems design, and DevOps, grounded in software engineering fundamentals.

---

## Case Study: Scalable Agentic 3D Scene Generation

The [Compositional 3D Scene Building](https://www.spatial-intelligence.co.uk/scene-generator) pipeline at [Spatial Intelligence](https://www.spatial-intelligence.co.uk/) generates production-ready 3D environments from natural language descriptions. Architecturally, the core challenge is that scene generation is multi-stage, GPU-bound, and highly variable in duration - making synchronous request handling unworkable at scale.

**Key design decisions:**

- **Async job queue** (Azure Service Bus) decouples the client-facing API from compute-intensive workers, providing durability and natural backpressure without coupling request latency to generation time
- **KEDA autoscaling** on Azure Container Apps scales the orchestrator worker pool directly from queue depth, keeping idle compute cost near zero while handling burst load
- **Stateless workers with externalised state** - all checkpoints and artifacts written to Blob Storage, with a `progress.json` manifest surfaced through the broker, so any worker replica can be interrupted or replaced without job loss
- **Independent GPU and CPU services** (Blender rendering pool, convex decomposition, geometry generation) run as separate ACA services and scale independently of the orchestrator, matching resource allocation to workload type
- **LLM orchestration** - GPT agents drive multi-stage scene planning; CLIP-indexed vector search (Weaviate) retrieves semantically relevant 3D objects and materials without manual curation

**Architecture diagram:**
```mermaid
graph TB
    subgraph CLIENT["Client Layer"]
        C[Browser · Frontend Dashboard]
        API_C[API Client / SDK]
    end

    subgraph PUB_API["Public API Layer"]
        GW["API Gateway\nauth · rate limiting\nversioned routes"]
        BROKER["Broker Service\nFastAPI · /v1/jobs\nSAS URL generation\nstage progress surfacing"]
        PG[(Postgres\nJob Store)]
        BROKER --- PG
    end

    subgraph QUEUE_LAYER["Job Queue Layer"]
        MQ["Azure Service Bus\nper-job messages\ndurable · backpressure"]
    end

    subgraph AZURE["Azure"]
        subgraph ACA_ENV["Azure Container Apps Environment (KEDA-scaled)"]
            subgraph WORKERS["Orchestrator Worker Pool · N replicas · autoscale on queue depth"]
                W["cli_entrypoint → pipeline\nFloor Plan → Furniture → Wall\nCeiling → Manipuland\nDrake Physics (in-process)"]
            end

            subgraph GPU_SVCS["GPU Services · independent ACA services"]
                BL_POOL["Blender Pool\nbpy · EEVEE · autoscale\n:8000"]
                GEO["Geometry Generation Service"]
            end

            subgraph CPU_SVCS["CPU Services · independent ACA services"]
                CVX_POOL["Convex Decomposition Pool\nhorizontally scaled"]
            end
        end

        subgraph STORAGE["Storage"]
            BLOB["Azure Blob Storage\nall artifacts + checkpoints\nprogress.json · manifest.json"]
        end

        subgraph OBS["Observability"]
            AI["Application Insights\nstructured logs · traces\nrequest metrics"]
        end
    end

    subgraph EXT_SVCS["External Services"]
        OAI["OpenAI API\nGPT-5 · LLM agents\nGPT-Image · reference images"]
        FAL["fal.ai\nserverless 3D generation"]
        VDB["Hosted Vector DB\nWeaviate Cloud\npre-computed CLIP embeddings\n3D Objects · Materials"]
        AZ_OAI["Azure OpenAI\n(optional: data residency)"]
    end

    C & API_C -->|"HTTPS"| GW
    GW --> BROKER
    BROKER -->|"enqueue job"| MQ
    BROKER -->|"reads progress.json\nmanifest.json"| BLOB

    MQ -->|"KEDA scale trigger"| WORKERS

    W -->|"render requests"| BL_POOL
    W -->|"collision mesh"| CVX_POOL
    W -->|"image → GLB"| GEO
    W -->|"vector search"| VDB
    W -->|"LLM calls\nimage gen"| OAI
    W -->|"stage checkpoints\nartifact writes"| BLOB

    GEO -->|"serverless queue"| FAL

    W -.->|"structured logs\ntraces"| AI
    BROKER -.->|"traces"| AI
    BL_POOL -.->|"traces"| AI
```

---

## Stack

| Domain | Technologies |
|---|---|
| **Backend** | Python · FastAPI · REST |
| **AI / ML** | LLM orchestration · vector search · computer vision · PyTorch |
| **Cloud** | Azure (ACA · Service Bus · Blob Storage · Application Insights · Azure AI Foundry) · AWS (Lambda · S3) |
| **Containerisation** | Docker · Azure Container Registry |
| **Databases** | PostgreSQL · MongoDB · Redis · Weaviate |
| **Frontend** | TypeScript · Vue.js · React · Tailwind CSS |
