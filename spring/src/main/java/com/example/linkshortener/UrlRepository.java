package com.example.linkshortener;

import java.util.List;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.PagingAndSortingRepository;

public interface UrlRepository extends PagingAndSortingRepository<Url, Long>, CrudRepository<Url, Long> {

  List<Url> findAll();

  Url findById(long id);

  Url findByShortened(String shortened);

  Url save(Url url);
}
