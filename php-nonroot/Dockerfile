FROM php:8.2-apache

# Install mysqli
RUN docker-php-ext-install mysqli

# Fix Apache port for OpenShift
RUN sed -i 's/80/8080/g' /etc/apache2/ports.conf \
 && sed -i 's/:80/:8080/g' /etc/apache2/sites-available/000-default.conf

# Allow arbitrary UID (critical for OpenShift)
RUN chgrp -R 0 /var/www/html /var/run/apache2 /var/log/apache2 \
 && chmod -R g=u /var/www/html /var/run/apache2 /var/log/apache2

EXPOSE 8080