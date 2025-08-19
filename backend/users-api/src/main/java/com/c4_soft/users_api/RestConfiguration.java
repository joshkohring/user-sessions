package com.c4_soft.users_api;

import org.keycloak.admin.api.RealmsAdminApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import com.c4_soft.springaddons.rest.RestClientHttpExchangeProxyFactoryBean;

@Configuration
public class RestConfiguration {

  @Bean
  RealmsAdminApi realmsAdminApi(RestClient keycloakAdmin) throws Exception {
    return new RestClientHttpExchangeProxyFactoryBean<>(RealmsAdminApi.class, keycloakAdmin)
        .getObject();
  }

}
