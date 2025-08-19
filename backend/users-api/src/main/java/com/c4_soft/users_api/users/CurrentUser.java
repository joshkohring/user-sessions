package com.c4_soft.users_api.users;

import java.util.List;
import jakarta.validation.constraints.NotNull;

/**
 * @param sub the current user subject
 * @param preferredUsername
 * @param roles
 * @param exp the expiration time of the user session on the OP in seconds since epoch
 * @param email
 */
public record CurrentUser(@NotNull String sub, @NotNull String preferredUsername,
    @NotNull List<String> roles, long exp, String email) {
  public static final CurrentUser ANONYMOUS =
      new CurrentUser("", "", List.of(), Long.MAX_VALUE, null);
}