// src/main/java/com/example/linkshortener/WebConfig.java

package com.example.linkshortener;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.core.annotation.Order;

@Configuration
@Order(Integer.MIN_VALUE)  // Highest precedence
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/style.css", "/favicon.ico")
               .addResourceLocations("classpath:/public/")
               .setCachePeriod(3600);

    }
}
