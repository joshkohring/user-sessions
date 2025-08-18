package com.c4_soft.ui;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.lang.NonNull;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

/**
 * @author Jerome Wacongne ch4mp&#64;c4-soft.com
 */
@SpringBootApplication
public class UiBffApplication {

  public static void main(String[] args) {
    SpringApplication.run(UiBffApplication.class, args);
  }

  @Component
  @RequiredArgsConstructor
  public class CustomBeanPostProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessBeforeInitialization(@NonNull Object bean, @NonNull String beanName)
        throws BeansException {
      if (bean instanceof OAuth2AuthorizationRequestRedirectFilter oauth2AuthorizationRequestRedirectFilter) {
        return new RestfulOAuth2Filter(oauth2AuthorizationRequestRedirectFilter);
      }
      return bean;
    }
  }

}
