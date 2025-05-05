# Realchat Friendzone

A real-time chat application with friend management features, built with modern technologies and deployed on Kubernetes, builted with microservice like Redis and RabbitMQ.

## Project Structure

```
realchat-friendzone/
├── app/
│   ├── backend/           # Node.js API server
│   ├── frontend/          # Next.js frontend application
│   └── chat-api/          # WebSocket server for chat and notifications
├── terraform/
│   ├── main/           # Main Terraform configuration
│   └── modules/           # Terraform modules for EKS setup
├── k8s/
│   ├── k8s-basic/         # Basic Kubernetes configurations
│   │   ├── deployments...    # Deployment configurations
│   │   ├── services...      # Service configurations
│   │   └── ingress...       # Ingress configurations
│   └── environment/              # Helm charts for application components
│   └── advance/

```

## Application Components

### Backend (Node.js API)

The backend service handles user authentication, friend management, and data persistence. It's built with:

- Express.js for RESTful API endpoints
- MongoDB for database storage
- JWT for authentication
- Input validation middleware
- Dockerized for containerized deployment

#### Key Features:
- User registration and authentication
- Friend requests and management
- User profile management
- Chat history persistence

### Frontend (Next.js)

The frontend provides a responsive user interface built with:

- Next.js for server-side rendering and routing
- React for component-based UI
- Tailwind CSS for styling
- Redis for data cache
- WebSocket client for real-time communication

#### Key Features:
- Responsive design for mobile and desktop
- Real-time chat interface
- Friend list and management
- User profiles and settings

### Chat API (WebSocket Server)

The chat-api handles real-time communication between users:

- Built with RabbitMq for messaging
- Real-time message delivery
- User presence detection (online/offline)
- Typing indicators
- Notification system

## Infrastructure

### Terraform Configuration

The terraform directory contains infrastructure-as-code for provisioning an Amazon EKS (Elastic Kubernetes Service) cluster:

- `main`: folder for terraform deployment
- `modules/`: Modular components for EKS setup
  - VPC configuration
  - EKS cluster setup
  - Node groups management
  - IAM roles and policies

### Kubernetes Deployment

#### Basic Kubernetes Configuration (`k8s/k8s-basic/`)

- **Deployments**: Container specifications and replica configurations
- **Services**: Internal networking and load balancing
- **Ingress**: External access configuration
- **Redis**: Redis for system cache
- **RabbitMQ**: RabbitMQ for messaging



#### Environment Components (`k8s/environment/`)

- **ArgoCD**: GitOps continuous delivery tool for Kubernetes
  - Application definitions
  - Sync policies
  - Access control configuration

- **Ingress Nginx**: Nginx-based Ingress controller
  - TLS configuration
  - Rate limiting
  - Path-based routing

#### Advanced Deployment (`k8s/advance/`)
  - Blue/Green deployment strategy using Argo Rollouts
  - Progressive delivery configurations
  - Automated rollback policies

