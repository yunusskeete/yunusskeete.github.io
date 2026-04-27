---
title: "Spatial Context Protocol - Applied AI Research"
permalink: "/research/scp/"
layout: page
---

*(Conducted as Founder & CEO of [Spatial Intelligence](https://www.spatial-intelligence.co.uk/))*

## Showcase - Spatially-grounded AI agents

### Overview

We represented a 13-room multi-functional building as a LLM-interpretable spatial model. This lightweight model - compact enough to run on the most modest of hardware - grounds the AI agent in the physical space, allowing it to reason directly about position, routes, visual landmarks, and live state within the building. By exposing tooling for building control, our AI agent can observe the live state of the building and respond to queries like "where can I find somewhere quiet to work?" or "turn on all of the lights on the way to the lounge" - in real time, without the need for any additional infrastructure like a database or vector store. The spatial model is the only thing that changes between buildings - author a lightweight model for each location and the same agent is immediately deployable there, with no additional infrastructure or specialist tooling required.

### Examples

Below is a top-down view of a digital model of a 13-room multi-functional building. This model was generated from a single text prompt using [Spatial Intelligence](www.spatial-intelligence.co.uk)'s 3D scene generation technology. It has been augmented with tooling simulation (light toggling via API calls) to simulate building control.

![Top-down view of 13-room multi-functional building](../../assets/images/scp/top_down.png)

#### **Example 1 - Natural language wayfinding**

##### Query: 
> ***"How do I get from the entrance to the changing room?"***

##### Agent Response: 
> *"From the entrance lobby, walk north through the opening in the north wall and follow the corridor to the main junction. At the junction, turn to face the west wall and take the third doorway from the south - between the orange noticeboard and the kitchen door - into the changing room. Total distance: approximately 13.9 m."*

![Example 1 - Natural language wayfinding, A](../../assets/images/scp/showcase_1a.png)
![Example 1 - Natural language wayfinding, B](../../assets/images/scp/showcase_1b.png)

##### Explanation:
The agent traverses the building as a human would, identifies the two-hop route, and produces turn-by-turn directions with named landmarks. Although routes can be cached for efficiency, the agent has no pre-computed routes - "real-time" traversal of the underlying spatial model underpins the system and enables deployment in multiple venues/locations.

---

#### **Example 2 - Location identification from description**

##### Query: 
> ***"I'm not sure where I am. I can see grey metal lockers and a bench running down the middle of the room."***

##### Agent Response:

> *"You are in the **Changing Room** - identified from the grey metal lockers lining the north and south walls and the benches running down the centre. To reach the building exit: go east through the doorway into the main corridor junction, then turn south and follow the corridor to the entrance lobby, approximately 14m total."*

![Example 2 - Location identification from description](../../assets/images/scp/showcase_2a.png)

##### Explanation:

The agent matches a natural language description against its spatial model, identifies the room without being told where the user is, and offers directions to the exit. The same mechanism handles "where can I find somewhere quiet to work?" and similar intent-based queries.

---

#### **Example 3 - Route-conditioned building control**

##### Query: 
> ***"Find me a path to the lounge. Can you turn on the lights for every room I'll pass through on the way?"***

##### Agent Response:

> *"From the entrance lobby, head north through the opening in the north wall into the main corridor. At the corridor junction, turn east and pass through the wide opening into the large briefing and training room. Continue north through the northwest opening in the north wall into the lounge and breakout area - the ping-pong table is in the centre of the room. Lights have been turned on throughout: entrance lobby, corridor, briefing room, and lounge."*

![Example 3 - Route-conditioned building control](../../assets/images/scp/example_3.gif)

##### Explanation:

The agent traverses the building in real-time as a human would, reasoning step-by-step about the live state of the building. It interacts with the building control layer to activate lights as it passes through rooms. Building control is simulated via API calls - exposed via location-specific agent tools/skills. Thus, the spatial model also carries live state and building control through the same underlying system.

---

### Building the spatial model

A building is described to the system from simple inputs - a walkthrough video, photographs, or a basic layout/floorplan. The generated spatial model is compact, interpretable/human-readable, and maintainable without specialist tooling. The same model that drives navigation also carries live state and building control integrations - a single update for building managers and a single source of truth for the agent.

A 13-room building currently takes a few hours end-to-end, with a view towards the authoring process being refined toward a guided, near-automated workflow from a video walkthrough or existing floorplan.