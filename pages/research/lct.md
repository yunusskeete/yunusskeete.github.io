---
title: "Latent Cycle Transformers - Fundamental AI Research"
permalink: "/research/lct/"
layout: page
---

*(Conducted as Founder & CEO of [Spatial Intelligence](https://www.spatial-intelligence.co.uk/))*

## Overview

Standard language models predict the next token - a discrete symbol drawn from a fixed vocabulary. This is effective but imposes a flat, step-by-step view of language that conflates low-level surface form with high-level semantic structure. Latent Cycle Transformers (LCTs) take a different approach: rather than predicting tokens, they predict embeddings - and they do so simultaneously across multiple temporal scales, under a closed-loop consistency constraint.

The result is a generative model that reasons hierarchically over continuous latent representations, with an inductive bias toward latent spaces that are simultaneously compressive, predictive, and reconstructive.

## Motivation

Language is structured at many scales. Words predict other words; phrases constrain the evolution of clauses; paragraph-level semantics governs local sentence choices. Flat autoregressive models process these scales implicitly, through depth and attention span, with no explicit multi-scale inductive bias.

At the same time, operating in token space introduces a fundamental bottleneck: the model must commit to discrete symbols at each step, discarding the geometric richness of the underlying continuous representation. Errors in early tokens propagate irrecoverably; the model cannot reason over uncertain or interpolated intermediate states.

LCTs address both of these limitations by moving generation entirely into continuous latent space and imposing a hierarchical, bidirectionally-consistent structure on the dynamics within that space.

## Architecture
LCTs are built around three interacting components:

**Bidirectional latent predictors.** At each level of the hierarchy, two predictors operate in opposing temporal directions: one forecasts future latent embeddings from past context, one backcasts past embeddings from future context. Both are trained via masked MSE against frozen or EMA-stabilised target embeddings. Training in both directions provides a richer, more symmetric supervisory signal than unidirectional forecasting alone.

**Closed-loop cycle consistency.** Beyond training each direction independently, an explicit cycle consistency loss enforces that the forward-predicted and backward-predicted latents derived from the same input agree with each other. This closes the latent loop - the model cannot maintain a directional prediction that is inconsistent with what the opposing direction produces from the same sequence. The effect is a temporal self-consistency constraint that shapes the latent manifold toward coherent, symmetric dynamics.

**Variational hierarchical dynamics.** Inter-level transitions are governed by variational inference. Each level of the hierarchy produces a latent summary of the level below; the transition is stochastic, parameterised by a learned approximate posterior. This enables the model to capture uncertainty across scales, propagate ambiguity upward rather than resolving it prematurely, and generate diverse rollouts by sampling at any level of the hierarchy.

## Training Objective
The full LCT objective combines three terms across all hierarchy levels:
* **Latent forecasting loss** - MSE between forward-predicted embeddings and target embeddings at each scale
* **Latent backcasting loss** - MSE between backward-predicted embeddings and target embeddings at each scale
* **Cycle consistency loss** - MSE between forward and backward predictions derived from the same input, enforcing directional coherence
* **Variational KL loss** - KL divergence between the approximate posterior and the prior at each inter-level transition

The joint optimisation over these terms encourages the model to discover latent representations that satisfy all three desiderata: compressible (each level abstracts the level below), predictive (future states are foreseeable from past latents), and reconstructive (past states are recoverable from future latents).

## Why This Matters
The LCT framework reframes language modelling as a problem of latent dynamics learning rather than symbol prediction. This has several practical consequences:
* Generation operates over smooth, continuous trajectories rather than discrete token sequences, enabling gradient-based planning and interpolation in generation
* Multi-scale structure is explicit and learnable, rather than implicit in attention patterns
* Cycle consistency provides a self-supervisory signal that does not require any labelled data or auxiliary tasks
* Variational inference at inter-level transitions gives the model a principled way to represent and propagate uncertainty across scales
