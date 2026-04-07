# OpenShift Template

## Usage

```bash
# Apply the OpenShift templates
oc apply -f nginx-example-docker-strategy.yaml
oc apply -f nginx-example-source-strategy.yaml

# Create a new application using the Docker strategy template
oc new-app --template=nginx-example-docker-strategy \
    -p NAME=nginx-docker \
    -p SOURCE_REPOSITORY_URL=https://github.com/kosmolito/ex288-study.git
    -p SOURCE_REPOSITORY_REF=main
    -p CONTEXT_DIR=s2i-multi-lang-demo/nginx-docker

# Check the status of the builds and deployments
oc logs -f buildconfig/nginx-docker

# Get all resources created by the template
oc get bc,deploy,svc,route,is --selector app=nginx-docker

# Navigate to the application URL
curl $(oc get route nginx-docker -o jsonpath='{.spec.host}')

# Create a new application using the Source strategy template
oc new-app --template=nginx-example-source-strategy \
    -p NAME=nginx-source \
    -p NGINX_VERSION=latest \
    -p SOURCE_REPOSITORY_URL=https://github.com/kosmolito/ex288-study.git \
    -p SOURCE_REPOSITORY_REF=main \
    -p CONTEXT_DIR=s2i-multi-lang-demo/nginx

# Check the status of the builds and deployments
oc logs -f buildconfig/nginx-source

# Get all resources created by the template
oc get bc,deploy,svc,route,is --selector app=nginx-source

# Navigate to the application URL
curl $(oc get route nginx-source -o jsonpath='{.spec.host}')
```

## Cleanup

```bash
# Delete the applications created by the templates
oc delete all -l app=nginx-docker
oc delete all -l app=nginx-source

# Delete the OpenShift templates
oc delete template nginx-example-docker-strategy
oc delete template nginx-example-source-strategy
```
