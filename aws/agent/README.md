# SmartShop Agent

This prototype uses the AWS Strands Agents SDK, which is part of the First Commit Build It track.

The agent receives already-validated shop facts and explains what the owner should check. It is deliberately constrained so the model does not invent inventory or pricing data.

Example:

python agent.py

The model provider can be configured through the Strands SDK for the local development environment. The deterministic transaction path remains independent of the agent.