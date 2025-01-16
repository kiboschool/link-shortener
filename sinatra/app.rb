require 'sinatra'
require 'sqlite3'

DB = SQLite3::Database.new( "database.db" ) 
DB.results_as_hash = true

def setup_db!
  DB.execute(<<-stmt)
    create table if not exists urls (
      id integer primary key autoincrement,
      original text not null,
      shortened text not null unique,
      created timestamp not null default current_timestamp
    );
  stmt
end
setup_db!

def create_url(shortened, original)
  DB.execute(<<-stmt, original: original, shortened: shortened)
    INSERT INTO urls (original, shortened) VALUES (:original, :shortened)
  stmt
end

def select_url(shortened)
  DB.query("SELECT * FROM urls WHERE urls.shortened = :shortened", shortened: shortened)
end

def update_url(url, shortened)
  DB.execute("UPDATE urls SET shortened = :shortened WHERE urls.id = :id", shortened: shortened, id: url["id"])
end

PAGE_SIZE = 50
def select_all_urls(page)
  DB.query("SELECT * FROM urls LIMIT :limit OFFSET :offset", limit: PAGE_SIZE, offset: PAGE_SIZE * (page - 1))
end

def delete_from_db(shortened)
  DB.execute("DELETE FROM urls WHERE urls.shortened = :shortened", shortened: shortened)
end

CHARS = "abcdefghijklmnopqrstuvwxyz0123456789".split('').freeze
def random_short_name
  6.times.map { CHARS.sample }.join
end

def canonicalize(url)
  if url.start_with?("http")
    url
  else
    "https://" + url
  end
end

get '/' do
  erb :new
end

post "/" do
  original = canonicalize(params["url"])
  shortened = random_short_name
  created = create_url(shortened, original)
  erb :created, {}, original: original, shortened_url: uri(shortened)
end

get '/urls' do
  page = params["page"] || 1
  urls = select_all_urls(page)
  erb :all, {}, urls: urls, next_page: page + 1
end

get '/urls/edit/:short' do
  url = select_url(params["short"]).first
  erb :edit, {}, url: url, error: nil
end

post '/urls/edit/:short' do
  url = select_url(params["short"]).first
  shortened = params['shortened']
  update_url(url, shortened)
  redirect to("urls/edit/#{shortened}"), 302
end

post '/urls/delete/:short' do
  url = select_url(params["short"]).first
  delete_from_db(params["short"])
  redirect(to("urls"), 302)
end

get '/:short' do
  url = select_url(params["short"]).first
  if url
    redirect url['original'], 302
  else
    halt 404, "shortlink not found"
  end
end
