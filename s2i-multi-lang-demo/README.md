# S2I Multi-Language Demo

This folder contains simple applications for testing Source-to-Image (S2I) builds in OpenShift.

## Structure

* `nodejs/` - Node.js (Express)
* `python/` - Python (Flask)
* `golang/` - Go (net/http)
* `quarkus/` - Java (Quarkus)
* `springboot/` - Java (Spring Boot)

Each folder contains an independent app that listens on port `8080`.

## Usage

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

```bash
oc new-app --name=nodejs \
    openshift/nodejs:18-minimal-ubi9~https://github.com/kosmolito/ex288-study.git#main \
    --context-dir=s2i-multi-lang-demo/nodejs \
    --labels type=s2i \
    --strategy=source

oc expose svc/nodejs


oc new-app --name=python \
    openshift/python:3.12-ubi9~https://github.com/kosmolito/ex288-study.git#main \
    --context-dir=s2i-multi-lang-demo/python \
    --labels type=s2i \
    --strategy=source

oc expose svc/python

oc new-app --name=golang \
    openshift/golang:1.18-ubi9~https://github.com/kosmolito/ex288-study.git#main \
    --context-dir=s2i-multi-lang-demo/golang \
    --labels type=s2i \
    --strategy=source

oc expose deployment/golang --port=8080
oc expose svc/golang


oc new-app --name=quarkus \
    openshift/java:openjdk-17-ubi8~https://github.com/kosmolito/ex288-study.git#main \
    --context-dir=s2i-multi-lang-demo/quarkus \
    --labels type=s2i \
    --strategy=source

oc expose svc/quarkus


oc new-app --name=springboot \
    openshift/java:openjdk-17-ubi8~https://github.com/kosmolito/ex288-study.git#main \
    --context-dir=s2i-multi-lang-demo/springboot \
    --labels type=s2i \
    --strategy=source

oc expose svc/springboot
```

## Notes

* No Dockerfiles are required (uses S2I builder images)
* Each app is minimal and intended for testing builds only
