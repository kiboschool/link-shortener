package com.example.linkshortener;

import java.util.Arrays;
import java.util.List;

import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.server.ResponseStatusException;

@Controller
public class LinkShortenerController {

  private final UrlRepository repository;

  LinkShortenerController(UrlRepository repository) {
    this.repository = repository;
  }

  @GetMapping("/")
  public String index(Model model) {
    return "new";
  }

  @PostMapping("/")
  public String createUrl(@RequestParam String url, Model model, UriComponentsBuilder uriComponentsBuilder) {
    Url created = new Url(url);
    repository.save(created);
    String shortenedUrl = uriComponentsBuilder
            .replacePath(created.getShortened())
            .replaceQuery(null)
            .build().toUriString();
    model.addAttribute("original", url);
    model.addAttribute("shortened_url", shortenedUrl);
    return "created";
  }

  @GetMapping("/urls")
  public String allUrls(Model model, ServletRequest request) {
    List<Url> urls = repository.findAll();
    String host = request.getServerName() + ":" + request.getServerPort();
    String protocol = "https";
    urls.forEach(url -> url.setShortenedUrl(protocol + "://" + host + "/" + url.getShortened()));
    model.addAttribute("urls", urls);
    return "all";
  }

  @PostMapping("/urls/delete/{shortUrl}")
  public String deleteUrl(@PathVariable String shortUrl) {
    Url url = repository.findByShortened(shortUrl);
    if (url != null) {
      repository.deleteById(url.getId());
      return "redirect:/urls";
    } else {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
    }
  }

  @GetMapping("/urls/edit/{shortUrl}")
  public String editUrl(@PathVariable String shortUrl, Model model, ServletRequest request) {
    Url url = repository.findByShortened(shortUrl);
    if (url != null) {
      String host = request.getServerName() + ":" + request.getServerPort();
      String protocol = "https";
      url.setShortenedUrl(protocol + "://" + host + "/" + url.getShortened());
      model.addAttribute("url", url);
      model.addAttribute("hostname", host);
      return "edit";
    } else {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
    }
  }

  @PostMapping("/urls/edit/{shortUrl}")
  public String updateUrl(@PathVariable String shortUrl, @RequestParam String shortened, Model model, ServletRequest request) {
    Url url = repository.findByShortened(shortUrl);
    if (url != null) {
      try {
        url.setShortened(shortened);
        repository.save(url);
        return "redirect:/urls/edit/" + url.getShortened();
      } catch (DataIntegrityViolationException e) {
        // duplicate
        String host = request.getServerName() + ":" + request.getServerPort();
        String protocol = "https";
        url.setShortenedUrl(protocol + "://" + host + "/" + url.getShortened());
        model.addAttribute("url", url);
        model.addAttribute("hostname", host);
        model.addAttribute("error", "There's already another link with that shortname. Choose another");
        return "edit";
      }
    } else {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
    }
  }

  @GetMapping("/{shortUrl:[^.]+}")
  public String urlRedirect(@PathVariable String shortUrl) {
    Url url = repository.findByShortened(shortUrl);
    if (url != null) {
      return "redirect:" + url.getOriginal();
    } else {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
    }
  }
}
