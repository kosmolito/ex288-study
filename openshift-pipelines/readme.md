# OpenShift Pipelines

## simple-username-pipeline

```bash
oc apply -f simple-username-pipeline/01_simple-username-task.yaml
oc apply -f simple-username-pipeline/02_simple-username-pipeline.yaml

tkn pipeline start simple-username-pipeline \
  -p USERNAME=kosmolito \
  --use-param-defaults
```

## fetch-test-build-deploy

```bash
# Create a secret to pull and push images to Docker Hub. Replace the placeholders with your actual Docker Hub credentials.
oc create secret docker-registry registry-secret \
  --docker-server=docker.io \
  --docker-username=<your-dockerhub-username> \
  --docker-password=<your-dockerhub-password> \
  --docker-email=<your-email>

# Link the secret to the pipeline service account so that it can be used to pull and push images.
oc secret link registry-secret pipeline --for=mount


# Optional: if your git repository is private, create a secret for git authentication and link it to the pipeline service account.
oc create secret generic git-secret \
    --type=kubernetes.io/basic-auth \
    --from-literal=username=<your-git-username> \
    --from-literal=password=<your-git-password>

# Annotate the secret with the git repository URL to allow Tekton to use it for authentication.
oc annotate secret git-secret tekton.dev/git-0=<your-git-repository-url>

# Link the git secret to the pipeline service account.
oc secret link git-secret pipeline

oc apply -f fetch-test-build-deploy/01_get-git-short-hash-task.yaml
oc apply -f fetch-test-build-deploy/01_helm-task.yaml

oc apply -f fetch-test-build-deploy/02_build-push-deploy-pipeline.yaml
oc apply -f fetch-test-build-deploy/02_build-push-helm-deploy-pipeline.yaml

tkn pipeline start build-push-deploy-pipeline \
  -p name=fetch-test-build-deploy-app \
  -p GIT_REPO_URL=https://github.com/kosmolito/ex288-study.git \
  -p CONTEXT=s2i-multi-lang-demo/nodejs-docker \
  -p DOCKERFILE=Dockerfile \
  -w name=shared,claimName=volume-template.yaml \
  --use-param-defaults
```
