package com.c4_soft.users_api.keycloak;

import java.net.URL;
import org.keycloak.admin.api.RealmsAdminApi;
import org.keycloak.admin.model.RealmRepresentation;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import com.c4_soft.users_api.CacheConfiguration;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminApiService {

  private final RealmsAdminApi realmsAdminApi;

  @Cacheable(cacheNames = CacheConfiguration.REALM_INFO_CACHE, key = "#realmName")
  public RealmRepresentation getRealmInfo(String realmName) {
    final var response = realmsAdminApi.adminRealmsRealmGet(realmName);
    return response.getBody();
  }

  public String getRealmName(URL issuer) {
    if (issuer == null) {
      return null;
    }
    final var segments = issuer.getPath().split("/");
    return segments.length > 0 ? segments[segments.length - 1] : null;
  }

}
