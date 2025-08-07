package com.c4_soft.ui;

import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;

@RestController
@Tag(name = "UiBffSessions",
    description = "Provides information about the current user session on the BFF")
@RequiredArgsConstructor
public class SessionInfoController {

  private final OAuth2AuthorizedClientRepository authorizedClientRepository;

  @GetMapping(path = "/session-info", produces = {MediaType.APPLICATION_JSON_VALUE})
  public SessionInfo getSessionInfo(Authentication authentication) {
    final var attr = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
    final var session = attr.getRequest().getSession(false);
    if (authentication instanceof OAuth2AuthenticationToken oauth) {
      final var authorizedClient = authorizedClientRepository
          .loadAuthorizedClient(oauth.getAuthorizedClientRegistrationId(), oauth, null);
      final var accessToken = authorizedClient == null ? null : authorizedClient.getAccessToken();
      final var refreshToken = authorizedClient == null ? null : authorizedClient.getRefreshToken();
      if (session == null) {
        return new SessionInfo(oauth.getName(), null, null, null, null,
            accessToken == null || accessToken.getIssuedAt() == null ? null
                : accessToken.getIssuedAt().toEpochMilli(),
            accessToken == null || accessToken.getExpiresAt() == null ? null
                : accessToken.getExpiresAt().toEpochMilli(),
            refreshToken == null || refreshToken.getIssuedAt() == null ? null
                : refreshToken.getIssuedAt().toEpochMilli(),
            refreshToken == null || refreshToken.getExpiresAt() == null ? null
                : refreshToken.getExpiresAt().toEpochMilli());
      }
      return new SessionInfo(oauth.getName(), session.getId(), session.getCreationTime(),
          session.getLastAccessedTime(), session.getMaxInactiveInterval(),
          accessToken == null || accessToken.getIssuedAt() == null ? null
              : accessToken.getIssuedAt().toEpochMilli(),
          accessToken == null || accessToken.getExpiresAt() == null ? null
              : accessToken.getExpiresAt().toEpochMilli(),
          refreshToken == null || refreshToken.getIssuedAt() == null ? null
              : refreshToken.getIssuedAt().toEpochMilli(),
          refreshToken == null || refreshToken.getExpiresAt() == null ? null
              : refreshToken.getExpiresAt().toEpochMilli());

    }
    if (session == null) {
      return new SessionInfo("", null, null, null, null, null, null, null, null);
    }
    return new SessionInfo("", session.getId(), session.getCreationTime(),
        session.getLastAccessedTime(), session.getMaxInactiveInterval(), null, null, null, null);
  }

  public static record SessionInfo(@NotNull String name, String sessionId, Long createdAt,
      Long lastAccessedAt, Integer maxInactiveInterval, Long accessIat, Long accessExp,
      Long refreshIat, Long refreshExp) {
  }
}
