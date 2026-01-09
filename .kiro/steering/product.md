# Product Context

## Vision

**Smart Q&A System** is a general-purpose AI chatbot SaaS designed for easy integration and reliable answers. It allows companies to provide 24/7 automated support by simply embedding a single line of code on their website. The system leverages **Gemini 3.0 Flash** to deliver answers based strictly on the tenant's registered knowledge base, minimizing hallucinations.

## Core Capabilities

- **Easy Integration**: Single-line JS tag integration.
- **Domain-Based Multi-Tenancy**: Automatically identifies tenants based on the referring domain (Referer-based auth).
- **Two-Stage AI Response**:
  1. **Category Identification**: Dynamically identifies the intent/category.
  2. **RAG Response**: Generates answers using only relevant knowledge for that category.
- **Management Console**: Allows tenants to manage knowledge (Q&A), categories, and view chat logs (VoC).

## Users

- **Tenant Admin**: Manages bot content, views analytics.
- **End User**: Visitor on the tenant's website interacting with the widget.
- **System Admin**: Manages tenants (onboarding).

## Business Rules

- **Authentication**: Tenants are authenticated by the domain where the widget is hosted.
- **Data Isolation**: Knowledge and logs are strictly isolated by `tenant_id`.
