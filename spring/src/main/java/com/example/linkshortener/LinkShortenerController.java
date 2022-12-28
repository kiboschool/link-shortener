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

  @GetMapping("/")
  public String index(Model model) {
    return "new";
  }

  @GetMapping("/urls")
  public String urls(Model model) {
    String message = "this is inserted in the template";
    List<String> tasks = Arrays.asList("a", "b", "c", "d", "e", "f", "g");
    model.addAttribute("message", message);
    model.addAttribute("tasks", tasks);
    return "bar";
  }

  @GetMapping("/{short}")
  public String urlRedirect() {
    return "redirect";
  }

}
