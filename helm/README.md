# Deploy application using Helm

## Usage

## Install Application

```bash
# Navigate to the application directory
cd lamp-app

# Install the Helm chart
helm install lamp-app . --namespace lamp-app --create-namespace \
    --values values.yaml
    -- wait

# Check the status of the Helm release
helm status lamp-app --namespace lamp-app

# Get the resources created by the Helm release
kubectl get all -n lamp-app
```

## Uninstall Application

```bash
# Uninstall the Helm release
helm uninstall lamp-app --namespace lamp-app

# Check if the resources are deleted
kubectl get all -n lamp-app
```

## Notes

- Ensure that you have Helm installed and configured to connect to your Kubernetes cluster before running the commands.
- The `values.yaml` file contains the configuration values for the Helm chart. You can modify it according to your requirements before installing the application.
- The `--wait` flag ensures that the Helm installation waits until all resources are in a ready state before completing the installation process.
- Always check the status of the Helm release and the resources created to ensure that the application is deployed successfully.
- When uninstalling the application, make sure to verify that all resources have been deleted to avoid any leftover resources in the cluster.
- You can also use `helm list --namespace lamp-app` to see all the Helm releases in the `lamp-app` namespace.
- For more advanced usage, you can explore additional Helm commands and options to manage your application deployments effectively.
