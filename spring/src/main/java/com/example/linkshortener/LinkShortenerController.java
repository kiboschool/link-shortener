package com.example.linkshortener;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.ui.Model;

import java.util.Arrays;
import java.util.List;

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
  public String createUrl(Model model) {
    return "created";
  }

  @GetMapping("/urls")
  public String allUrls(Model model) {
    List<Url> urls = repository.findAll();
    model.addAttribute("urls", urls);
    return "all";
  }

  @PostMapping("/urls/delete/{short}")
  public String deleteUrl() {
    return "all";
  }

  @GetMapping("/urls/edit/{short}")
  public String editUrl() {
    return "edit";
  }

  @PostMapping("/urls/edit/{short}")
  public String updateUrl() {
    return "edit";
  }

  @GetMapping("/{short}")
  public String urlRedirect() {
    return "all";
  }
}
