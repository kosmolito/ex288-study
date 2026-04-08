# ex288-study

This repository contains study materials and notes for the `Red Hat Certified OpenShift Application Developer` (EX288) exam.

You can practice locally with OpenShift Local (CRC) or on the OpenShift Platforms.
The idea is to have a self-contained repository with all the necessary resources and instructions to prepare for the EX288 exam.

I am focusing much more on the practical aspects of the exam, so you will find a lot of hands-on exercises and examples.

## Getting Started (CRC)

Make sure you have CRC (CodeReady Containers) installed and set up on your local machine. You can follow the official documentation to get it up and running: [CodeReady Containers](https://developers.redhat.com/products/openshift-local)

```bash
# Set up CRC (CodeReady Containers) and start the OpenShift cluster locally.
crc setup
crc start

# Wait for CRC to start and then log in to the OpenShift cluster using the provided credentials.

# Apply OpenShift Pipelines Operator
cat <<-EOF | oc apply -f -
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  labels:
    operators.coreos.com/openshift-pipelines-operator-rh.openshift-operators: ""
  name: openshift-pipelines-operator-rh
  namespace: openshift-operators
spec:
  channel: latest
  installPlanApproval: Automatic
  name: openshift-pipelines-operator-rh
  source: redhat-operators
  sourceNamespace: openshift-marketplace
EOF
```

## Helm

### Deploy Application

```bash
# Install the Helm chart
helm install lamp-app helm/lamp-app/ --namespace helm --create-namespace \
    --values helm/lamp-app/values.yaml \
    --wait

# Check the status of the Helm release
helm status lamp-app --namespace helm

# Get the resources created by the Helm release
kubectl get all -n helm -l app=lamp-app
```

### Convert Helm Chart to Kubernetes Manifests

```bash
# Convert the Helm chart to Kubernetes manifests and save to a file
# The --skip-tests flag is used to exclude test resources from the output, which are not needed for deployment.
# For OpenShift compatibility, we set the security context adaptation to force, which ensures that the generated manifests are compatible with OpenShift's security requirements. (maridb)
helm template lamp-app --skip-tests helm/lamp-app/ \
  --set global.compatibility.openshift.adaptSecurityContext=force \
  --values helm/lamp-app/values.yaml > kustomize/lamp-app/base/helm-generated.yaml

# Remove namespace from the generated YAML to allow it to be applied in any namespace.
sed -i.bak '/namespace:/d' kustomize/lamp-app/base/helm-generated.yaml

# Optionally, you can clean up the generated YAML file by removing Helm-specific data.
sed -i.bak '\#app.kubernetes.io/managed-by.*Helm#d' kustomize/lamp-app/base/helm-generated.yaml
sed -i.bak '\#helm.sh/chart.*mariadb#d' kustomize/lamp-app/base/helm-generated.yaml
sed -i.bak '\#podAffinity:#d' kustomize/lamp-app/base/helm-generated.yaml
sed -i.bak '\#nodeAffinity:#d' kustomize/lamp-app/base/helm-generated.yaml
sed -i.bak '\#nodePort: null#d' kustomize/lamp-app/base/helm-generated.yaml
sed -i.bak '\#  annotations:#d' kustomize/lamp-app/base/helm-generated.yaml
sed -i.bak '\#checksum/configuration#d' kustomize/lamp-app/base/helm-generated.yaml
rm kustomize/lamp-app/base/helm-generated.yaml.bak
```

### Cleanup

```bash
# Uninstall the Helm release
helm uninstall lamp-app --namespace helm

# Check if the resources are deleted
kubectl get all -n helm

# Optionally, delete the namespace
kubectl delete namespace helm
```

### Notes

- Ensure that you have Helm installed and configured to connect to your Kubernetes cluster before running the commands.
- The `values.yaml` file contains the configuration values for the Helm chart. You can modify it according to your requirements before installing the application.
- The `--wait` flag ensures that the Helm installation waits until all resources are in a ready state before completing the installation process.
- Always check the status of the Helm release and the resources created to ensure that the application is deployed successfully.
- When uninstalling the application, make sure to verify that all resources have been deleted to avoid any leftover resources in the cluster.
- You can also use `helm list --namespace lamp-app` to see all the Helm releases in the `lamp-app` namespace.
- For more advanced usage, you can explore additional Helm commands and options to manage your application deployments effectively.

## Kustomize

### Deploy Application

```bash
# Create a project/namespace for the Kustomize deployment
oc new-project kustomize

# Apply the Kustomize configuration
oc apply -k kustomize/lamp-app/overlays/dev -n kustomize # or prod

# Give service account anyuid permissions to run the container with any user ID
oc adm policy add-scc-to-user anyuid -z lamp-app-mariadb -n kustomize

# Check the status of the deployed resources
oc get all -n kustomize -l app=lamp-app

# Navigate to the application with curl
curl $(oc get route lamp-app -o jsonpath='{.spec.host}')
```

### Cleanup

```bash
# Delete the Kustomize resources
oc delete -k kustomize/lamp-app/overlays/dev -n kustomize # or prod

# Check if the resources are deleted
oc get all -n kustomize

# Optionally, delete the namespace
oc delete namespace kustomize
```

## OpenShift Pipelines

```bash
# Create a project/namespace for the OpenShift Pipelines
oc new-project pipelines
```

### simple-username-pipeline

```bash
oc apply -f openshift-pipelines/simple-username-pipeline/01_simple-username-task.yaml -n pipelines
oc apply -f openshift-pipelines/simple-username-pipeline/02_simple-username-pipeline.yaml -n pipelines

tkn pipeline start simple-username-pipeline --namespace pipelines \
  -p USERNAME=kosmolito \
  --use-param-defaults
```

### fetch-test-build-deploy

```bash
# Create a secret to pull and push images to Docker Hub. Replace the placeholders with your actual Docker Hub credentials.
oc create secret docker-registry registry-secret -n pipelines \
  --docker-server=docker.io \
  --docker-username=<your-dockerhub-username> \
  --docker-password=<your-dockerhub-password> \
  --docker-email=<your-email>

# Link the secret to the pipeline service account so that it can be used to pull and push images.
oc secret link registry-secret pipeline --for=pull,mount -n pipelines


# Optional: if your git repository is private, create a secret for git authentication and link it to the pipeline service account.
oc create secret generic git-secret -n pipelines \
    --type=kubernetes.io/basic-auth \
    --from-literal=username=<your-git-username> \
    --from-literal=password=<your-git-password>

# Annotate the secret with the git repository URL to allow Tekton to use it for authentication.
oc annotate secret git-secret tekton.dev/git-0=<your-git-repository-url> -n pipelines

# Link the git secret to the pipeline service account.
oc secret link git-secret pipeline -n pipelines

oc apply -f openshift-pipelines/fetch-test-build-deploy/01_get-git-short-hash-task.yaml -n pipelines
oc apply -f openshift-pipelines/fetch-test-build-deploy/01_helm-task.yaml -n pipelines

oc apply -f openshift-pipelines/fetch-test-build-deploy/02_build-push-deploy-pipeline.yaml -n pipelines
oc apply -f openshift-pipelines/fetch-test-build-deploy/02_build-push-helm-deploy-pipeline.yaml -n pipelines

tkn pipeline start build-push-deploy-pipeline --namespace pipelines \
  -p name=fetch-test-build-deploy-app \
  -p GIT_REPO_URL=https://github.com/kosmolito/ex288-study.git \
  -p CONTEXT=s2i-multi-lang-demo/nodejs-docker \
  -p DOCKERFILE=Dockerfile \
  -w name=shared,openshift-pipelines/claimName=volume-template.yaml \
  --use-param-defaults

# Check the status of the pipeline run
tkn pipelinerun logs -f <pipelinerun-name> -n pipelines
```

### Cleanup

```bash
# Delete the pipeline resources
oc delete -f openshift-pipelines/simple-username-pipeline/01_simple-username-task.yaml -n pipelines
oc delete -f openshift-pipelines/simple-username-pipeline/02_simple-username-pipeline.yaml -n pipelines
oc delete -f openshift-pipelines/fetch-test-build-deploy/01_get-git-short-hash-task.yaml -n pipelines
oc delete -f openshift-pipelines/fetch-test-build-deploy/01_helm-task.yaml -n pipelines
oc delete -f openshift-pipelines/fetch-test-build-deploy/02_build-push-deploy-pipeline.yaml -n pipelines
oc delete -f openshift-pipelines/fetch-test-build-deploy/02_build-push-helm-deploy-pipeline.yaml -n pipelines
```

## OpenShift Template

### Deploy Application

```bash
# Create a project/namespace for the OpenShift templates
oc new-project templates

# Apply the OpenShift templates
oc apply -f openshift-template/nginx-example-docker-strategy.yaml -n templates
oc apply -f openshift-template/nginx-example-source-strategy.yaml -n templates

# Create a new application using the Docker strategy template
oc new-app --template=nginx-example-docker-strategy -n templates \
    -p NAME=nginx-docker \
    -p SOURCE_REPOSITORY_URL=https://github.com/kosmolito/ex288-study.git \
    -p SOURCE_REPOSITORY_REF=main \
    -p CONTEXT_DIR=s2i-multi-lang-demo/nginx-docker

# Check the status of the builds and deployments
oc logs -f buildconfig/nginx-docker -n templates

# Get all resources created by the template
oc get all -l app=nginx-docker -n templates

# Navigate to the application URL
curl $(oc get route nginx-docker -o jsonpath='{.spec.host}' -n templates)

# Create a new application using the Source strategy template
oc new-app --template=nginx-example-source-strategy -n templates \
    -p NAME=nginx-source \
    -p NGINX_VERSION=latest \
    -p SOURCE_REPOSITORY_URL=https://github.com/kosmolito/ex288-study.git \
    -p SOURCE_REPOSITORY_REF=main \
    -p CONTEXT_DIR=s2i-multi-lang-demo/nginx

# Check the status of the builds and deployments
oc logs -f buildconfig/nginx-source -n templates

# Get all resources created by the template
oc get all -l app=nginx-source -n templates

# Navigate to the application URL
curl $(oc get route nginx-source -o jsonpath='{.spec.host}' -n templates)
```

### Cleanup

```bash
# Delete the applications created by the templates
oc delete all -l app=nginx-docker -n templates
oc delete all -l app=nginx-source -n templates

# Delete the OpenShift templates
oc delete template nginx-example-docker-strategy -n templates
oc delete template nginx-example-source-strategy -n templates

# Check if the resources are deleted
oc get all -n templates

# Optionally, delete the namespace
oc delete namespace templates
```

## S2I Multi-Language Demo

This folder contains simple applications for testing Source-to-Image (S2I) builds in OpenShift.

### Structure

* `nodejs/` - Node.js (Express)
* `python/` - Python (Flask)
* `golang/` - Go (net/http)
* `quarkus/` - Java (Quarkus)
* `springboot/` - Java (Spring Boot)

Each folder contains an independent app that listens on port `8080`.

### Create Project/Namespace for S2I Demo applications

```bash
# Create project/namespace for the S2I demo
oc new-project s2i
```

### Check Available Builder Images

Create an app in OpenShift using the desired language and context directory:

```bash
# To see available builder images:
oc new-app -S --image-stream=nodejs

# Example for Node.js:
Image streams (oc new-app --image-stream=<image-stream> [--code=<source>])
-----
nodejs
  Project: openshift
  Tags:    18-minimal-ubi8, 18-minimal-ubi9, 18-ubi8, 18-ubi8-minimal, 18-ubi9, 18-ubi9-minimal, 20-minimal-ubi8, 20-minimal-ubi9, 20-ubi8, 20-ubi8-minimal, 20-ubi9, 20-ubi9-minimal, latest

oc new-app -S --image-stream=python

# Example for Python:
➜  s2i-multi-lang-demo git:(main) ✗ oc new-app -S --image-stream=python
Image streams (oc new-app --image-stream=<image-stream> [--code=<source>])
-----
python
  Project: openshift
  Tags:    3.12-ubi8, 3.12-ubi9, 3.6-ubi8, 3.8-ubi8, 3.9-ubi8, 3.9-ubi9, latest

oc new-app -S --image-stream=golang

# Example for Go:
Image streams (oc new-app --image-stream=<image-stream> [--code=<source>])
-----
golang
  Project: openshift
  Tags:    1.18-ubi8, 1.18-ubi9, latest

oc new-app -S --image-stream=java

# Example for Quarkus, usually using generic Java builder:
Image streams (oc new-app --image-stream=<image-stream> [--code=<source>])
-----
java
  Project: openshift
  Tags:    latest, openjdk-11-ubi8, openjdk-17-ubi8, openjdk-8-ubi8
java-runtime
  Project: openshift
  Tags:    latest, openjdk-11-ubi8, openjdk-17-ubi8, openjdk-8-ubi8
```

### Deploy Node.js application

```bash
oc new-app --name=nodejs -n s2i \
    --strategy=source \
    --context-dir=s2i-multi-lang-demo/nodejs \
    --labels type=s2i \
    openshift/nodejs:18-minimal-ubi9~https://github.com/kosmolito/ex288-study.git#main

# Check the status of the build and deployment
oc logs -f buildconfig/nodejs -n s2i
oc get all -l app=nodejs -n s2i

# Expose the service to create a route
oc expose svc/nodejs -n s2i

# Navigate to the application URL
curl $(oc get route nodejs -o jsonpath='{.spec.host}' -n s2i)
```

### Deploy Python application

```bash
oc new-app --name=python -n s2i \
    --strategy=source \
    --context-dir=s2i-multi-lang-demo/python \
    --labels type=s2i \
    openshift/python:3.12-ubi9~https://github.com/kosmolito/ex288-study.git#main

# Check the status of the build and deployment
oc logs -f buildconfig/python -n s2i
oc get all -l app=python -n s2i

# Expose the service to create a route
oc expose svc/python -n s2i

# Navigate to the application URL
curl $(oc get route python -o jsonpath='{.spec.host}' -n s2i)
```

### Deploy Go application

```bash
oc new-app --name=golang -n s2i \
    --strategy=source \
    --context-dir=s2i-multi-lang-demo/golang \
    --labels type=s2i \
    openshift/golang:1.18-ubi9~https://github.com/kosmolito/ex288-study.git#main

# Check the status of the build and deployment
oc logs -f buildconfig/golang -n s2i
oc get all -l app=golang -n s2i

# Expose the deployment to create a service with port 8080
oc expose deployment/golang --port=8080 -n s2i

# Expose the service to create a route
oc expose svc/golang -n s2i

# Navigate to the application URL
curl $(oc get route golang -o jsonpath='{.spec.host}' -n s2i)
```

### Deploy Java applications (Quarkus and Spring Boot)

```bash
oc new-app --name=quarkus -n s2i \
    --strategy=source \
    --context-dir=s2i-multi-lang-demo/quarkus \
    --labels type=s2i \
    openshift/java:openjdk-17-ubi8~https://github.com/kosmolito/ex288-study.git#main

# Check the status of the build and deployment
oc logs -f buildconfig/quarkus -n s2i
oc get all -l app=quarkus -n s2i

# Expose the service to create a route
oc expose svc/quarkus -n s2i

# Navigate to the application URL
curl $(oc get route quarkus -o jsonpath='{.spec.host}' -n s2i)
````

```bash
oc new-app --name=springboot -n s2i \
    --strategy=source \
    --context-dir=s2i-multi-lang-demo/springboot \
    --labels type=s2i \
    openshift/java:openjdk-17-ubi8~https://github.com/kosmolito/ex288-study.git#main

# Check the status of the build and deployment
oc logs -f buildconfig/springboot -n s2i
oc get all -l app=springboot -n s2i

# Expose the service to create a route
oc expose svc/springboot -n s2i

# Navigate to the application URL
curl $(oc get route springboot -o jsonpath='{.spec.host}' -n s2i)
```

### Deploy Node.js application using Docker strategy

```bash
oc new-app --name=nodejs-docker -n s2i \
    --strategy=docker \
    --context-dir=s2i-multi-lang-demo/nodejs-docker \
    --labels type=s2i \
    https://github.com/kosmolito/ex288-study.git#main

# Check the status of the build and deployment
oc logs -f buildconfig/nodejs-docker -n s2i
oc get all -l app=nodejs-docker -n s2i

# Expose the service to create a route
oc expose svc/nodejs-docker -n s2i

# Navigate to the application URL
curl $(oc get route nodejs-docker -o jsonpath='{.spec.host}' -n s2i)
```

### Cleanup

```bash
oc delete all -l type=s2i -n s2i

# Optionally, delete the namespace
oc delete namespace s2i
```

### Notes

- No Dockerfiles are required (uses S2I builder images)
- Each app is minimal and intended for testing builds only

## Image Streams

```bash
# Create a project/namespace for the Image Streams
oc new-project streams

# Create an Image Stream for the bitnami/nginx image
oc import-image my-nginx --from=docker.io/bitnami/nginx:latest \
  --namespace streams \
  --confirm

# You can import with a specific tag if needed:
oc import-image my-nginx:stable --from=docker.io/bitnami/nginx:latest \
  --namespace streams \
  --confirm

# You can add additional tags to the same Image Stream:
oc tag my-nginx:latest my-nginx:unstable -n streams

# Check the Image Stream
oc get is -n streams

# Example output:
NAME       IMAGE REPOSITORY                                                                TAGS                     UPDATED
my-nginx   default-route-openshift-image-registry.apps-crc.testing/imagestreams/my-nginx   unstable,latest,stable   10 seconds ago

# Create a new application using the Image Stream (image stream is referenced as namespace/image-stream:tag)
oc new-app --name=nginx-imagestream --image-stream=streams/my-nginx:stable -n streams

# Check the status of the deployment
oc get all -l app=nginx-imagestream -n streams

# Expose the service to create a route
oc expose svc/nginx-imagestream -n streams

# Navigate to the application URL
curl $(oc get route nginx-imagestream -o jsonpath='{.spec.host}' -n streams)
```

### Cleanup

```bash
oc delete all -l app=nginx-imagestream -n streams

oc delete is my-nginx -n streams

# Check if the resources are deleted
oc get all -n streams

# Optionally, delete the namespace
oc delete namespace streams
```
