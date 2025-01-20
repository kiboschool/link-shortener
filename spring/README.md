# Link Shortener - Spring Boot

* Create short urls that redirect to an original url.

Uses the Spring Boot framework, and the H2 database.

## Get Started

Requires a recent jdk and gradle.

```sh
gradle bootRun
```

Gradle will install the dependencies before starting the development server.

## Files

- `LinkShortenerController.java` has most of the logic for the application
- Templates (using Thymeleaf) are in /resources/templates
- Static files are in /resources/static
- h2 configured to just use the 'file' database (it writes / reads from `h2db.mv.db`)
