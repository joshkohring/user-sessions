package com.c4_soft.users_api.users;

import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.oidc.StandardClaimNames;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.c4_soft.users_api.keycloak.AdminApiService;
import io.micrometer.observation.annotation.Observed;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * @author Jerome Wacongne ch4mp&#64;c4-soft.com
 */
@RestController
@RequestMapping(path = "/users")
@Tag(name = "Users")
@RequiredArgsConstructor
public class UsersController {

  private final AdminApiService adminApi;

  /**
   * Requires the user to be authenticated.
   * 
   * @param auth
   * @return Returns information contained in the access token about the resource owner on behalf of
   *         whom it was issued.
   */
  @GetMapping(path = "/me",
      produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_PROBLEM_JSON_VALUE})
  @PreAuthorize("isAuthenticated()")
  @Observed
  public CurrentUser getMe(JwtAuthenticationToken jwtAuth) {
    final var exp = jwtAuth.getToken().getExpiresAt();
    return new CurrentUser(jwtAuth.getName(),
        (String) jwtAuth.getTokenAttributes().get(StandardClaimNames.PREFERRED_USERNAME),
        jwtAuth.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList(),
        exp == null ? Long.MAX_VALUE : exp.getEpochSecond(),
        (String) jwtAuth.getTokenAttributes().get(StandardClaimNames.EMAIL));
  }

  @GetMapping(path = "/op-session",
      produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_PROBLEM_JSON_VALUE})
  @PreAuthorize("isAuthenticated()")
  @Observed
  public OpSession getOpSession(JwtAuthenticationToken jwtAuth) {
    final var realmInfo =
        adminApi.getRealmInfo(adminApi.getRealmName(jwtAuth.getToken().getIssuer()));
    final var iat = jwtAuth.getToken().getIssuedAt().getEpochSecond();
    final var duration =
        List.of(realmInfo.getSsoSessionMaxLifespan(), realmInfo.getClientSessionMaxLifespan())
            .stream().filter(d -> d != null && d > 0).min(Integer::compareTo).orElse(0);
    return new OpSession(iat, jwtAuth.getToken().getExpiresAt().getEpochSecond(), iat + duration);
  }
}
