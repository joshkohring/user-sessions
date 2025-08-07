cd /opt/keycloak/bin/
export KC_DB=postgres
export KC_DB_HOST=user-session.keycloak-db
export KC_DB_PORT=2632
export KC_DB_NAME=keycloak
export KC_DB_SCHEMA=public
export KC_DB_URL=jdbc:postgresql://${KC_DB_HOST}:${KC_DB_PORT}/${KC_DB_NAME}?currentSchema=${KC_DB_SCHEMA}
export KC_DB_USERNAME=keycloak
export KC_DB_PASSWORD=secret
sh ./kc.sh export --dir /tmp/keycloak/ --users realm_file