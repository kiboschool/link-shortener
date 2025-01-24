package main

import (
    "fmt"
    "time"
    "path"
    "strings"
    "math/rand"
    "database/sql"
    "net/http"
    "html/template"
    _ "modernc.org/sqlite"
)

var templates = template.Must(template.ParseGlob("templates/*.html"))

type URL struct {
    ID          int64
    Short       string
    ShortURL    string
    Original string
    CreatedAt   time.Time
}

func initDB(db *sql.DB) error {
    createTable := `
    CREATE TABLE IF NOT EXISTS urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shortened TEXT NOT NULL,
        original_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`
    
    _, err := db.Exec(createTable)
    return err
}

func createURL(db *sql.DB, originalURL string, shortened string) error {
    if !strings.HasPrefix(originalURL, "http") {
        originalURL = "https://" + originalURL
    } 
    _, err := db.Exec(`
        INSERT INTO urls (original_url, shortened) 
        VALUES (?, ?)`,
        originalURL, shortened)
    return err
}

func deleteURL(db *sql.DB, shortened string) error {
    _, err := db.Exec(`
        DELETE FROM urls 
        WHERE shortened = ?`,
        shortened)
    return err
}

func updateURL(db *sql.DB, oldShortened string, newShortened string) error {
    _, err := db.Exec(`
        UPDATE urls 
        SET shortened = ? 
        WHERE shortened = ?`,
        newShortened, oldShortened)
    return err
}

func getURL(db *sql.DB, shortened string) (string, error) {
    var originalURL string
    err := db.QueryRow(`
        SELECT original_url 
        FROM urls 
        WHERE shortened = ?`,
        shortened).Scan(&originalURL)
    return originalURL, err
}

func listURLs(db *sql.DB) ([]URL, error) {
    rows, err := db.Query(`
        SELECT shortened, original_url, created_at 
        FROM urls 
        ORDER BY created_at DESC`)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var urls []URL
    for rows.Next() {
        var u URL
        err := rows.Scan(&u.Short, &u.Original, &u.CreatedAt)
        if err != nil {
            return nil, err
        }
        urls = append(urls, u)
    }
    return urls, nil
}

func handleRedirect(w http.ResponseWriter, r *http.Request, db *sql.DB, shortened string) {
    originalURL, err := getURL(db, shortened)
    if err != nil {
        http.Error(w, "URL not found", http.StatusNotFound)
        return
    }
    http.Redirect(w, r, originalURL, http.StatusFound)
}

const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

func generateRandomString() string {
  b := make([]byte, 6)
  for i := range b {
    b[i] = letters[rand.Intn(len(letters))]
  }
  return string(b)
}

func makeDomainURL(shortened string, r *http.Request) string {
  // note: ought to look at the request to determine the scheme
  return "http://" + r.Host + "/" + shortened
}

// works if the url is... the right shape I guess
func getPathPart(r *http.Request) string {
  _, last := path.Split(r.URL.Path)
  return last
}

func main() {
    
    db, _ := sql.Open("sqlite", "urls.db")
    initDB(db)
    
    http.HandleFunc("/urls", func(w http.ResponseWriter, r *http.Request) {
      urls, err := listURLs(db)
      if err != nil {
        fmt.Println(err)
        http.Error(w, "Could not fetch urls", http.StatusBadRequest)
        return
      }
      for i := range urls { 
        s := makeDomainURL(urls[i].Short, r)
        urls[i].ShortURL = s
      }
      nextPage := 1
      data := struct {
        Urls []URL
        NextPage int
      } {
        urls,
        nextPage,
      }
      templates.ExecuteTemplate(w, "all.html", data)
    })

    http.HandleFunc("/urls/delete/", func(w http.ResponseWriter, r *http.Request) {
      shortened := getPathPart(r)
      fmt.Println("deleting " + shortened)
      err := deleteURL(db, shortened)
      if err != nil {
          fmt.Println(err)
          http.Error(w, "Could not delete url", http.StatusBadRequest)
          return
      }
      http.Redirect(w, r, "/urls", http.StatusFound)
    })

    http.HandleFunc("/urls/edit/", func(w http.ResponseWriter, r *http.Request) {
      if r.Method == http.MethodGet {
        shortened := getPathPart(r)
        fmt.Println("request edit for " + shortened)
        originalURL, err := getURL(db, shortened)
        if err != nil {
          fmt.Println(err)
          http.Error(w, "Could not find url", http.StatusNotFound)
          return
        }
        data := struct {
          Shortened string
          Original string
          ShortURL string
          Hostname string
        } {
          shortened,
          originalURL,
          makeDomainURL(shortened, r),
          "http://" + r.Host + "/",
        }
        templates.ExecuteTemplate(w, "edit.html", data)
      } else if r.Method == http.MethodPost {
        shortened := getPathPart(r)
        if err := r.ParseForm(); err != nil {
          fmt.Println(err)
          http.Error(w, "Could not parse form", http.StatusBadRequest)
          return
        }
        newShortened := r.FormValue("shortened")
        fmt.Println("update " + shortened + " to " + newShortened)
        if err := updateURL(db, shortened, newShortened); err != nil {
          fmt.Println(err)
          http.Error(w, "Could not update url", http.StatusBadRequest)
          return
        }
        http.Redirect(w, r, "/urls/edit/" + newShortened, http.StatusFound)
      } else {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
      }
    })


    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
      if r.Method == http.MethodGet {
        shortened := getPathPart(r)
        if shortened != "" {
          // find and redirect
          handleRedirect(w,r,db,shortened) 
        } else {
          // render the form to create a url
          templates.ExecuteTemplate(w, "new.html", nil)
        }
      } else if r.Method == http.MethodPost {
        // handle the form submission
        if err := r.ParseForm(); err != nil {
          fmt.Println(err)
          http.Error(w, "Could not parse form", http.StatusBadRequest)
          return
        }
        url := r.FormValue("url")
        shortcode := generateRandomString()
        createURL(db, url, shortcode)
        data := struct {
          Original string
          ShortenedUrl string
        } {
          url,
          makeDomainURL(shortcode, r),
        }
        templates.ExecuteTemplate(w, "created.html", data);
      } else {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
      }
    })

    fs := http.FileServer(http.Dir("public"))
    http.Handle("/public/", http.StripPrefix("/public/", fs))
    fmt.Println("listening on :8080")
    err := http.ListenAndServe(":8080", nil)
    fmt.Println(err)
    fmt.Println("exiting")
}
