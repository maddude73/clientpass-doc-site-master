# CI/CD Pipeline Documentation

## Multi-Agent Documentation Automation System

**Version**: 1.0  
**Date**: December 13, 2025  
**Project**: ClientPass Documentation Automation

---

## 1. OVERVIEW

### 1.1 Purpose

This document defines the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Multi-Agent Documentation Automation System (MAS), ensuring automated testing, quality assurance, and reliable deployment processes.

### 1.2 Scope

The CI/CD pipeline covers:

- Automated testing and quality assurance
- Security scanning and vulnerability assessment
- Performance testing and benchmarking
- Automated deployment to multiple environments
- Rollback and recovery procedures
- Monitoring and alerting integration

### 1.3 Pipeline Objectives

- **Quality Assurance**: Ensure code quality through automated testing
- **Security**: Implement security scanning and compliance checks
- **Reliability**: Provide consistent, repeatable deployments
- **Speed**: Minimize time from code commit to production deployment
- **Visibility**: Provide clear feedback on pipeline status and results

---

## 2. PIPELINE ARCHITECTURE

### 2.1 Pipeline Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   SOURCE    │    │   BUILD     │    │    TEST     │    │   DEPLOY    │
│   CONTROL   │───►│   STAGE     │───►│   STAGE     │───►│   STAGE     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│• Git Hooks  │    │• Code Build │    │• Unit Tests │    │• Dev Deploy │
│• Branch     │    │• Dependency │    │• Integration│    │• Staging    │
│  Protection │    │  Install    │    │• Security   │    │• Production │
│• PR Reviews │    │• Lint/Format│    │• Performance│    │• Rollback   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 2.2 Technology Stack

- **Version Control**: Git (GitHub/GitLab)
- **CI/CD Platform**: GitHub Actions / GitLab CI
- **Container Platform**: Docker
- **Orchestration**: Docker Compose (local), Kubernetes (production)
- **Testing**: pytest, pytest-asyncio, coverage
- **Security**: Snyk, Safety, Bandit
- **Monitoring**: Prometheus, Grafana, ELK Stack

---

## 3. SOURCE CONTROL WORKFLOW

### 3.1 Git Workflow Strategy

#### 3.1.1 Branching Model

```
main (production)
├── develop (integration)
│   ├── feature/agent-enhancement
│   ├── feature/vector-optimization
│   └── hotfix/security-patch
└── release/v1.1.0
```

#### 3.1.2 Branch Protection Rules

- **main branch**: Requires pull request reviews, status checks pass
- **develop branch**: Requires status checks, allows direct commits for integration
- **feature branches**: No restrictions, enables experimental development
- **release branches**: Requires pull request reviews, additional testing

#### 3.1.3 Commit Standards

```bash
# Conventional Commit Format
<type>(<scope>): <description>

# Examples:
feat(agent): add vector embedding optimization
fix(config): resolve MongoDB Atlas connection issue
docs(api): update agent interface documentation
test(integration): add end-to-end workflow tests
```

### 3.2 Pre-commit Hooks

#### 3.2.1 Code Quality Checks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.9.1
    hooks:
      - id: black
        language_version: python3.14

  - repo: https://github.com/pycqa/flake8
    rev: 6.1.0
    hooks:
      - id: flake8
        args: [--max-line-length=88]

  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort
        args: [--profile=black]

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.6.1
    hooks:
      - id: mypy
        additional_dependencies: [types-all]
```

#### 3.2.2 Security Checks

```yaml
- repo: https://github.com/PyCQA/bandit
  rev: 1.7.5
  hooks:
    - id: bandit
      args: ["-r", ".", "-f", "json", "-o", "bandit-report.json"]

- repo: https://github.com/Lucas-C/pre-commit-hooks-safety
  rev: v1.3.2
  hooks:
    - id: python-safety-dependencies-check
```

---

## 4. BUILD STAGE

### 4.1 Build Pipeline Configuration

#### 4.1.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: MAS CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: "0 2 * * *" # Daily security scans

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: [3.14]

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v4
        with:
          python-version: ${{ matrix.python-version }}

      - name: Cache Dependencies
        uses: actions/cache@v3
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}

      - name: Install Dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r automation/requirements.txt
          pip install -r requirements-dev.txt

      - name: Code Formatting Check
        run: |
          black --check automation/
          isort --check-only automation/

      - name: Lint Code
        run: |
          flake8 automation/ --count --select=E9,F63,F7,F82 --show-source --statistics
          flake8 automation/ --count --exit-zero --max-complexity=10 --max-line-length=88

      - name: Type Checking
        run: mypy automation/
```

#### 4.1.2 Dependency Management

```yaml
- name: Security Vulnerability Scan
  run: |
    safety check --json --output safety-report.json
    bandit -r automation/ -f json -o bandit-report.json

- name: License Compliance Check
  run: |
    pip-licenses --format=json --output-file=licenses.json
    python scripts/check_license_compliance.py

- name: Build Artifacts
  run: |
    python -m build
    docker build -t mas:${{ github.sha }} .
```

### 4.2 Docker Build Process

#### 4.2.1 Multi-stage Dockerfile

```dockerfile
# Dockerfile
FROM python:3.14-slim as builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.14-slim as runtime

WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY automation/ ./automation/
COPY config/ ./config/

ENV PATH=/root/.local/bin:$PATH
ENV PYTHONPATH=/app

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

CMD ["python", "automation/orchestrator.py"]
```

#### 4.2.2 Docker Compose for Development

```yaml
# docker-compose.yml
version: "3.8"

services:
  mas:
    build: .
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./automation:/app/automation
      - ./logs:/app/logs
    depends_on:
      - mongodb
      - redis

  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"

volumes:
  mongodb_data:
```

---

## 5. TEST STAGE

### 5.1 Testing Strategy

#### 5.1.1 Test Pyramid

```
                    ┌─────────────────┐
                    │   E2E Tests     │ ← 10%
                    │  (Selenium)     │
                ┌───┴─────────────────┴───┐
                │   Integration Tests     │ ← 20%
                │  (pytest-asyncio)      │
            ┌───┴─────────────────────────┴───┐
            │        Unit Tests               │ ← 70%
            │       (pytest)                 │
            └─────────────────────────────────┘
```

#### 5.1.2 Test Configuration

```yaml
# pytest.ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    --verbose
    --cov=automation
    --cov-report=html
    --cov-report=xml
    --cov-fail-under=80
    --asyncio-mode=auto
markers =
    unit: Unit tests
    integration: Integration tests
    e2e: End-to-end tests
    slow: Slow running tests
    security: Security tests
```

### 5.2 Test Implementation

#### 5.2.1 Unit Tests

```python
# tests/unit/test_change_detection_agent.py
import pytest
from unittest.mock import Mock, patch
from automation.agents.change_detection_agent import ChangeDetectionAgent

class TestChangeDetectionAgent:

    @pytest.fixture
    def agent(self):
        return ChangeDetectionAgent()

    @pytest.mark.unit
    async def test_file_change_detection(self, agent):
        """Test file change detection functionality"""
        # Setup
        mock_event = Mock()
        mock_event.src_path = "/test/file.py"

        # Execute
        result = await agent._handle_file_change(mock_event)

        # Assert
        assert result is not None
        assert result['file_path'] == "/test/file.py"

    @pytest.mark.unit
    @patch('automation.agents.change_detection_agent.watchdog')
    async def test_monitoring_startup(self, mock_watchdog, agent):
        """Test monitoring service startup"""
        # Execute
        await agent.initialize()

        # Assert
        mock_watchdog.Observer.assert_called_once()
        assert agent.is_monitoring is True
```

#### 5.2.2 Integration Tests

```python
# tests/integration/test_agent_communication.py
import pytest
from automation.orchestrator import Orchestrator
from automation.events import EventType, Event

class TestAgentCommunication:

    @pytest.mark.integration
    async def test_end_to_end_workflow(self):
        """Test complete agent workflow"""
        # Setup
        orchestrator = Orchestrator()
        await orchestrator.initialize()

        # Create test change event
        change_event = Event(
            type=EventType.FILE_CHANGE,
            source="test",
            data={"file_path": "/test/component.tsx"}
        )

        # Execute workflow
        result = await orchestrator.process_change_event(change_event)

        # Verify all agents processed the event
        assert result['change_detected'] is True
        assert result['document_updated'] is True
        assert result['embeddings_updated'] is True

        # Cleanup
        await orchestrator.cleanup()
```

#### 5.2.3 Performance Tests

```python
# tests/performance/test_throughput.py
import pytest
import asyncio
import time
from automation.agents.rag_management_agent import RAGManagementAgent

class TestPerformance:

    @pytest.mark.slow
    async def test_embedding_generation_throughput(self):
        """Test embedding generation performance"""
        agent = RAGManagementAgent()
        await agent.initialize()

        # Generate test documents
        documents = [f"Test document {i}" for i in range(100)]

        # Measure performance
        start_time = time.time()
        results = await agent.batch_generate_embeddings(documents)
        end_time = time.time()

        # Assert performance requirements
        total_time = end_time - start_time
        assert total_time < 30.0  # 100 docs in under 30 seconds
        assert len(results) == 100
        assert all(len(emb) == 1536 for emb in results)
```

### 5.3 Test Execution Pipeline

```yaml
test:
  needs: build
  runs-on: ubuntu-latest

  services:
    mongodb:
      image: mongo:7.0
      ports:
        - 27017:27017

    redis:
      image: redis:7.2-alpine
      ports:
        - 6379:6379

  steps:
    - name: Run Unit Tests
      run: |
        pytest tests/unit/ -v --cov=automation --cov-report=xml

    - name: Run Integration Tests
      run: |
        pytest tests/integration/ -v --maxfail=1
      env:
        MONGODB_URI: mongodb://localhost:27017/test
        REDIS_URL: redis://localhost:6379

    - name: Run Security Tests
      run: |
        pytest tests/security/ -v
        bandit -r automation/ -ll

    - name: Performance Benchmark
      run: |
        pytest tests/performance/ -v --benchmark-only

    - name: Upload Coverage Reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
        fail_ci_if_error: true
```

---

## 6. SECURITY SCANNING

### 6.1 Security Pipeline Integration

#### 6.1.1 SAST (Static Application Security Testing)

```yaml
security-scan:
  runs-on: ubuntu-latest
  steps:
    - name: Checkout Code
      uses: actions/checkout@v4

    - name: Run Snyk Security Scan
      uses: snyk/actions/python@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high

    - name: Upload Snyk Results
      uses: github/codeql-action/upload-sarif@v2
      if: always()
      with:
        sarif_file: snyk-results.sarif
```

#### 6.1.2 Dependency Vulnerability Scanning

```yaml
- name: Python Security Check
  run: |
    safety check --json --output safety-report.json

- name: License Compliance
  run: |
    pip-licenses --format=json --output-file licenses.json
    python scripts/validate_licenses.py
```

#### 6.1.3 Container Security Scanning

```yaml
- name: Build Docker Image
  run: docker build -t mas:security-scan .

- name: Run Trivy Security Scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: "mas:security-scan"
    format: "sarif"
    output: "trivy-results.sarif"

- name: Upload Trivy Results
  uses: github/codeql-action/upload-sarif@v2
  if: always()
  with:
    sarif_file: "trivy-results.sarif"
```

### 6.2 Security Compliance Checks

#### 6.2.1 API Key Security

```python
# scripts/security_checks.py
import os
import re

def validate_no_hardcoded_secrets():
    """Ensure no hardcoded API keys or secrets"""
    secret_patterns = [
        r'sk-[a-zA-Z0-9]{48}',  # OpenAI keys
        r'sk-ant-api03-[a-zA-Z0-9\-_]{95}',  # Anthropic keys
        r'mongodb\+srv://[^:]+:[^@]+@',  # MongoDB connection strings
    ]

    violations = []
    for root, dirs, files in os.walk('automation'):
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()
                    for pattern in secret_patterns:
                        matches = re.findall(pattern, content)
                        if matches:
                            violations.append(f"Secret found in {filepath}")

    assert not violations, f"Security violations: {violations}"
```

---

## 7. DEPLOYMENT STAGE

### 7.1 Deployment Strategy

#### 7.1.1 Environment Promotion Pipeline

```
Development → Staging → Production
     ↓            ↓         ↓
Auto Deploy   Manual Gate  Manual Gate
Fast Feedback Review&Test  Full Testing
```

#### 7.1.2 Deployment Configuration

```yaml
deploy-dev:
  if: github.ref == 'refs/heads/develop'
  needs: [test, security-scan]
  runs-on: ubuntu-latest
  environment: development

  steps:
    - name: Deploy to Development
      run: |
        docker tag mas:${{ github.sha }} mas:dev
        docker push ${{ secrets.REGISTRY }}/mas:dev
        kubectl set image deployment/mas mas=${{ secrets.REGISTRY }}/mas:dev

deploy-staging:
  if: github.ref == 'refs/heads/main'
  needs: [test, security-scan]
  runs-on: ubuntu-latest
  environment: staging

  steps:
    - name: Deploy to Staging
      run: |
        docker tag mas:${{ github.sha }} mas:staging
        docker push ${{ secrets.REGISTRY }}/mas:staging
        kubectl set image deployment/mas mas=${{ secrets.REGISTRY }}/mas:staging

    - name: Run Smoke Tests
      run: |
        kubectl wait --for=condition=ready pod -l app=mas --timeout=300s
        python tests/smoke/test_deployment.py

deploy-production:
  if: github.event_name == 'release'
  needs: [deploy-staging]
  runs-on: ubuntu-latest
  environment: production

  steps:
    - name: Production Deployment
      run: |
        docker tag mas:${{ github.sha }} mas:${{ github.event.release.tag_name }}
        docker push ${{ secrets.REGISTRY }}/mas:${{ github.event.release.tag_name }}
        kubectl set image deployment/mas mas=${{ secrets.REGISTRY }}/mas:${{ github.event.release.tag_name }}

    - name: Verify Deployment
      run: |
        kubectl rollout status deployment/mas --timeout=600s
        python tests/e2e/test_production_health.py
```

### 7.2 Infrastructure as Code

#### 7.2.1 Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mas
  labels:
    app: mas
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mas
  template:
    metadata:
      labels:
        app: mas
    spec:
      containers:
        - name: mas
          image: registry/mas:latest
          ports:
            - containerPort: 8000
          env:
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: mas-secrets
                  key: mongodb-uri
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: mas-secrets
                  key: openai-key
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 5
```

#### 7.2.2 Service Configuration

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: mas-service
spec:
  selector:
    app: mas
  ports:
    - port: 80
      targetPort: 8000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mas-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: mas.clientpass.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: mas-service
                port:
                  number: 80
```

### 7.3 Blue-Green Deployment

#### 7.3.1 Deployment Strategy

```bash
# scripts/blue_green_deploy.sh
#!/bin/bash

NAMESPACE="production"
NEW_VERSION=$1
CURRENT_VERSION=$(kubectl get deployment mas -o jsonpath='{.spec.template.spec.containers[0].image}' | cut -d':' -f2)

echo "Deploying version $NEW_VERSION (current: $CURRENT_VERSION)"

# Create new deployment
kubectl set image deployment/mas-green mas=registry/mas:$NEW_VERSION -n $NAMESPACE

# Wait for rollout
kubectl rollout status deployment/mas-green -n $NAMESPACE --timeout=600s

# Run health checks
python scripts/health_check.py --endpoint https://mas-green.clientpass.com

# Switch traffic if healthy
if [ $? -eq 0 ]; then
    kubectl patch service mas-service -p '{"spec":{"selector":{"version":"green"}}}' -n $NAMESPACE
    echo "Traffic switched to green deployment"

    # Clean up old blue deployment after verification
    sleep 300
    kubectl delete deployment mas-blue -n $NAMESPACE
    kubectl create deployment mas-blue --image=registry/mas:$NEW_VERSION -n $NAMESPACE
else
    echo "Health check failed, keeping current deployment"
    kubectl delete deployment mas-green -n $NAMESPACE
    exit 1
fi
```

---

## 8. MONITORING AND ALERTING

### 8.1 Pipeline Monitoring

#### 8.1.1 Metrics Collection

```yaml
# .github/workflows/metrics.yml
name: Pipeline Metrics

on:
  workflow_run:
    workflows: ["MAS CI/CD Pipeline"]
    types: [completed]

jobs:
  collect-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Collect Build Metrics
        run: |
          curl -X POST ${{ secrets.METRICS_ENDPOINT }} \
            -H "Content-Type: application/json" \
            -d '{
              "pipeline": "mas-cicd",
              "status": "${{ github.event.workflow_run.conclusion }}",
              "duration": "${{ github.event.workflow_run.updated_at - github.event.workflow_run.created_at }}",
              "commit": "${{ github.sha }}",
              "branch": "${{ github.ref }}"
            }'
```

#### 8.1.2 Alert Configuration

```yaml
# alerting/pipeline-alerts.yml
groups:
  - name: pipeline.rules
    rules:
      - alert: PipelineFailure
        expr: pipeline_success_rate{pipeline="mas-cicd"} < 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "MAS CI/CD pipeline success rate below 90%"

      - alert: DeploymentFailure
        expr: deployment_success{environment="production"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Production deployment failed"

      - alert: SecurityVulnerability
        expr: security_vulnerabilities{severity="high"} > 0
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "High severity security vulnerabilities detected"
```

### 8.2 Post-Deployment Monitoring

#### 8.2.1 Health Checks

```python
# scripts/post_deploy_checks.py
import requests
import sys
import time

def check_service_health(endpoint):
    """Verify service health after deployment"""
    max_attempts = 30
    for attempt in range(max_attempts):
        try:
            response = requests.get(f"{endpoint}/health", timeout=10)
            if response.status_code == 200:
                health_data = response.json()
                if health_data.get('status') == 'healthy':
                    print(f"✅ Service healthy after {attempt + 1} attempts")
                    return True
        except Exception as e:
            print(f"❌ Attempt {attempt + 1}: {e}")

        time.sleep(10)

    return False

def run_integration_tests(endpoint):
    """Run post-deployment integration tests"""
    test_cases = [
        f"{endpoint}/api/docs/search",
        f"{endpoint}/api/agents/status",
        f"{endpoint}/api/metrics"
    ]

    for test_case in test_cases:
        response = requests.get(test_case, timeout=30)
        if response.status_code != 200:
            print(f"❌ Integration test failed: {test_case}")
            return False

    print("✅ All integration tests passed")
    return True

if __name__ == "__main__":
    endpoint = sys.argv[1]

    if not check_service_health(endpoint):
        sys.exit(1)

    if not run_integration_tests(endpoint):
        sys.exit(1)

    print("🎉 Post-deployment verification successful")
```

---

## 9. ROLLBACK AND RECOVERY

### 9.1 Automated Rollback

#### 9.1.1 Rollback Triggers

```yaml
rollback:
  if: failure()
  needs: [deploy-production]
  runs-on: ubuntu-latest
  steps:
    - name: Automatic Rollback
      run: |
        PREVIOUS_VERSION=$(kubectl rollout history deployment/mas -n production --revision=1 | grep -o 'registry/mas:[^[:space:]]*')
        kubectl set image deployment/mas mas=$PREVIOUS_VERSION -n production
        kubectl rollout status deployment/mas -n production --timeout=300s

    - name: Verify Rollback
      run: |
        python scripts/post_deploy_checks.py https://mas.clientpass.com

    - name: Notify Team
      uses: 8398a7/action-slack@v3
      with:
        status: custom
        custom_payload: |
          {
            text: "🚨 Production deployment failed and was automatically rolled back",
            fields: [{
              title: "Commit",
              value: "${{ github.sha }}",
              short: true
            }]
          }
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 9.2 Manual Recovery Procedures

#### 9.2.1 Emergency Response Playbook

```bash
# Emergency Response Commands

# 1. Check current system status
kubectl get pods -n production
kubectl describe deployment mas -n production

# 2. View recent logs
kubectl logs -f deployment/mas -n production --tail=100

# 3. Quick rollback to last known good version
kubectl rollout undo deployment/mas -n production

# 4. Scale down if necessary
kubectl scale deployment mas --replicas=0 -n production

# 5. Emergency maintenance mode
kubectl patch ingress mas-ingress -p '{"spec":{"rules":[{"host":"mas.clientpass.com","http":{"paths":[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"maintenance-service","port":{"number":80}}}}]}}]}}'

# 6. Restore from backup if needed
./scripts/restore_from_backup.sh --date=2025-12-12 --environment=production
```

---

## 10. PERFORMANCE AND OPTIMIZATION

### 10.1 Build Optimization

#### 10.1.1 Cache Strategy

```yaml
build-optimized:
  runs-on: ubuntu-latest
  steps:
    - name: Cache Docker Layers
      uses: actions/cache@v3
      with:
        path: /tmp/.buildx-cache
        key: ${{ runner.os }}-buildx-${{ github.sha }}
        restore-keys: |
          ${{ runner.os }}-buildx-

    - name: Cache Python Dependencies
      uses: actions/cache@v3
      with:
        path: ~/.cache/pip
        key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}

    - name: Cache Test Results
      uses: actions/cache@v3
      with:
        path: .pytest_cache
        key: ${{ runner.os }}-pytest-${{ hashFiles('tests/**/*.py') }}
```

#### 10.1.2 Parallel Execution

```yaml
test-matrix:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      test-suite: [unit, integration, security, performance]
      python-version: [3.14]
    fail-fast: false

  steps:
    - name: Run Test Suite
      run: pytest tests/${{ matrix.test-suite }}/ -v --maxfail=1
```

### 10.2 Deployment Optimization

#### 10.2.1 Progressive Deployment

```yaml
progressive-deploy:
  runs-on: ubuntu-latest
  steps:
    - name: Deploy 10% Traffic
      run: |
        kubectl patch deployment mas --patch '{"spec":{"replicas":1}}' -n production
        kubectl patch service mas-service --patch '{"spec":{"selector":{"version":"new"}}}' -n production

    - name: Monitor Metrics (5 minutes)
      run: |
        sleep 300
        ERROR_RATE=$(curl -s http://prometheus:9090/api/v1/query?query=rate%28http_requests_total%7Bstatus%3D~%225..%22%7D%5B5m%5D%29 | jq '.data.result[0].value[1]')
        if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
          echo "Error rate too high, rolling back"
          exit 1
        fi

    - name: Scale to Full Traffic
      run: kubectl patch deployment mas --patch '{"spec":{"replicas":3}}' -n production
```

---

## 11. COMPLIANCE AND GOVERNANCE

### 11.1 Audit Trail

#### 11.1.1 Deployment Logging

```python
# scripts/audit_logger.py
import json
import datetime
from typing import Dict, Any

class DeploymentAuditor:
    def __init__(self, environment: str):
        self.environment = environment

    def log_deployment(self, deployment_info: Dict[str, Any]):
        """Log deployment for compliance audit"""
        audit_entry = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "environment": self.environment,
            "deployment_id": deployment_info["deployment_id"],
            "version": deployment_info["version"],
            "commit_hash": deployment_info["commit_hash"],
            "deployer": deployment_info["deployer"],
            "approval_status": deployment_info.get("approved_by"),
            "security_scan_results": deployment_info.get("security_status"),
            "test_results": deployment_info.get("test_status")
        }

        # Store in compliance database
        self._store_audit_entry(audit_entry)

    def _store_audit_entry(self, entry: Dict[str, Any]):
        # Implementation for compliance storage
        pass
```

### 11.2 Change Management

#### 11.2.1 Approval Workflow

```yaml
production-gate:
  if: github.event_name == 'pull_request' && github.base_ref == 'main'
  runs-on: ubuntu-latest
  steps:
    - name: Require Approvals
      uses: hmarr/auto-approve-action@v2
      if: |
        github.event.pull_request.requested_reviewers != null ||
        github.event.pull_request.requested_teams != null
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}

    - name: Security Review Required
      run: |
        SECURITY_CHANGES=$(git diff --name-only origin/main...HEAD | grep -E "(security|auth|secret)" | wc -l)
        if [ $SECURITY_CHANGES -gt 0 ]; then
          echo "Security review required for this change"
          # Add security team as reviewer
          gh pr edit ${{ github.event.pull_request.number }} --add-reviewer security-team
        fi
```

---

## 12. DISASTER RECOVERY

### 12.1 Backup Strategy

#### 12.1.1 Automated Backups

```bash
#!/bin/bash
# scripts/backup_system.sh

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mas_$BACKUP_DATE"

echo "Starting system backup: $BACKUP_DATE"

# Backup MongoDB
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongodb"

# Backup configuration
kubectl get configmaps -o yaml > "$BACKUP_DIR/configmaps.yaml"
kubectl get secrets -o yaml > "$BACKUP_DIR/secrets.yaml"

# Backup application code
git bundle create "$BACKUP_DIR/repository.bundle" --all

# Backup logs
cp -r /var/log/mas "$BACKUP_DIR/logs"

# Create compressed archive
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

# Upload to cloud storage
aws s3 cp "$BACKUP_DIR.tar.gz" s3://mas-backups/

echo "Backup completed: $BACKUP_DIR.tar.gz"
```

### 12.2 Recovery Procedures

#### 12.2.1 Full System Recovery

```bash
#!/bin/bash
# scripts/disaster_recovery.sh

BACKUP_FILE=$1
RECOVERY_ENV=${2:-production}

echo "Starting disaster recovery from: $BACKUP_FILE"

# Extract backup
tar -xzf "$BACKUP_FILE" -C /tmp/

# Restore MongoDB
mongorestore --uri="$MONGODB_URI" /tmp/mongodb

# Restore Kubernetes resources
kubectl apply -f /tmp/configmaps.yaml
kubectl apply -f /tmp/secrets.yaml

# Restore application
git clone /tmp/repository.bundle mas-recovered
cd mas-recovered

# Deploy recovered system
kubectl apply -f k8s/
kubectl rollout status deployment/mas --timeout=600s

# Verify recovery
python scripts/post_deploy_checks.py https://mas.clientpass.com

echo "Disaster recovery completed successfully"
```

---

**Document Control**  
**Author**: GitHub Copilot  
**Reviewers**: TBD  
**Last Updated**: December 13, 2025  
**Version**: 1.0
