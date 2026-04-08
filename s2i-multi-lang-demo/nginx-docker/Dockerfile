FROM nginx:latest

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy app content
COPY html/ /usr/share/nginx/html/

# Fix permissions for OpenShift random UID
RUN chmod -R g+w /var/cache/nginx /var/run /var/log/nginx \
    && chgrp -R 0 /var/cache/nginx /var/run /var/log/nginx

# Expose port (OpenShift prefers non-root, but nginx image handles it)
EXPOSE 8080

# Adjust nginx to run on non-root port
RUN sed -i 's/listen       80;/listen 8080;/' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]