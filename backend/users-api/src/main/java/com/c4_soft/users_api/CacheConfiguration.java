package com.c4_soft.users_api;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfiguration {

  public static final String REALM_INFO_CACHE = "realmInfo";
}
