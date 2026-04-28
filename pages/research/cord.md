---
title: "CORD: Compositional Object Representation via Detection Transformers - Fundamental AI Research"
permalink: "/research/cord/"
layout: page
---

> *A research programme for learning structured, holistic object representations using detection transformers as the training substrate.*

*(Conducted as Founder & CEO of [Spatial Intelligence](https://www.spatial-intelligence.co.uk/))*

## Overview

Object detection has traditionally been cast as a discriminative prediction task:
given an image, localise instances and assign class labels.
The internal representations learned in service of this task are optimised for detection performance, not for the richer understanding of objects that downstream tasks - scene graph generation, few-shot transfer, relational reasoning - demand.
This research programme, **CORD** (**C**ompositional **O**bject **R**epresentation via **D**etection transformers), reconceives the detection transformer as a representation learning substrate.
Rather than treating the object query as a monolithic feature vector whose structure is incidental to the detection objective, CORD introduces a principled architectural framework for decomposing each query into functionally specialised, independently trainable sub-components.
Each sub-component is shaped by a dedicated objective targeting a distinct aspect of object understanding: *what* it is (semantic), *where* it is (spatial), *what it canonically looks like* (class prototype), and *how it relates to everything else in the scene* (relational).
This work builds from a clean DINO-DETR baseline (DINO image encoder, DEtection TRansformer decoder), through a compositional architectural innovation, to two parallel representation learning extensions - producing object query representations substantially richer than those obtainable through detection training alone.

---

## Motivation

Standard detection transformers - from DETR to its many descendants - frame object queries as joint encoders of appearance and location, trained end-to-end via bipartite matching losses.
This design is effective for detection but produces representations with two structural limitations.

First, **entanglement**:
the same query embedding must simultaneously support accurate class prediction (requiring invariance to spatial transformations) and precise bounding box regression (requiring spatial sensitivity).
These are competing objectives acting on a shared representation, and there is no mechanism ensuring that either is satisfied well at the level of internal structure rather than merely at the output head.

Second, **shallowness of object understanding**:
a query that detects a fork correctly encodes nothing about the fact that forks appear near plates and knives, that "fork" as a concept is stable across diverse instance appearances, or that the scene is a dining context.
These are not incidental failures of the detection task - they are aspects of object understanding that detection training structurally cannot induce, because the training signal contains no information about them.

---

More details to come in preprint.
