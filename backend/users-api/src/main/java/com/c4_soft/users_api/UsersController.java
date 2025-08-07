package com.c4_soft.users_api;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.oidc.StandardClaimNames;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.micrometer.observation.annotation.Observed;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;

/**
 * @author Jerome Wacongne ch4mp&#64;c4-soft.com
 */
@RestController
@RequestMapping(path = "/users")
@Tag(name = "Users")
@RequiredArgsConstructor
public class UsersController {

  /**
   * Allowed to anonymous requests.
   * 
   * @param auth
   * @return Returns information contained in the access token about the resource owner on behalf of
   *         whom it was issued, or empty strings in case of an anonymous request. The roles are
   *         only those granted for the client for which the access token was issued (with which the
   *         user logged in).
   */
  @GetMapping(path = "/me",
      produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_PROBLEM_JSON_VALUE})
  @Observed
  public CurrentUser getMe(Authentication auth) {
    if (auth instanceof JwtAuthenticationToken jwtAuth) {
      final var exp = jwtAuth.getToken().getExpiresAt();
      return new CurrentUser(jwtAuth.getName(),
          (String) jwtAuth.getTokenAttributes().get(StandardClaimNames.PREFERRED_USERNAME),
          jwtAuth.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList(), exp == null ? Long.MAX_VALUE : exp.getEpochSecond(),
          (String) jwtAuth.getTokenAttributes().get(StandardClaimNames.EMAIL));
    }
    return CurrentUser.ANONYMOUS;
  }

  public static record CurrentUser(@NotNull String sub, @NotNull String preferredUsername, @NotNull List<String> roles, long exp, String email) {
    public static final CurrentUser ANONYMOUS = new CurrentUser("", "", List.of(), Long.MAX_VALUE, null);
  }
}
