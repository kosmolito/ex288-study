# Kustomize

## Usage

```bash
# Apply the Kustomize configuration
oc apply -k lamp-app/overlays/dev # or prod

# Check the status of the deployed resources
oc get all -l app=lamp-app

# Navigate to the application with curl
curl $(oc get route lamp-app -o jsonpath='{.spec.host}')
```

## Cleanup

```bash
# Delete the Kustomize resources
oc delete -k lamp-app/overlays/dev # or prod

# Check if the resources are deleted
oc get all
```
