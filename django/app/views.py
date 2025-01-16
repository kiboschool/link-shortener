from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseNotFound
from urllib.parse import urlparse
import random
import string

from .models import Url

# helper for generating a random short string
CHARS = string.ascii_letters + string.digits
def random_short_name():
     return "".join(random.choices(CHARS, k=6))

def new_or_create(request):
    if request.method == 'GET':
        return new(request)
    elif request.method == 'POST':
        return create(request)

def new(request):
    return render(request, 'new.html')

def create(request):
    url = request.POST['url']
    parsed = urlparse(url)
    if not parsed.scheme:
        parsed = urlparse("https://" + url)
    url = parsed.geturl()
    shortened = random_short_name()
    u = Url(shortened=shortened, original=url)
    u.save()
    shortened_url = request.scheme + "://" + request.get_host() + "/" + shortened
    return render(request, 'created.html', {
        "shortened_url": shortened_url,
        "original": url
        })

def short(request, short):
    try:
        url = Url.objects.get(shortened=short)
        return redirect(url.original)
    except Url.DoesNotExist:
        return HttpResponseNotFound("No such shortcode")

def all(request):
    pagesize = 50
    page = int(request.GET.get('page', 1))
    start = (page - 1) * pagesize
    end = start + pagesize
    urls = Url.objects.all()[start:end]
    urls = [{
        "shortened_url": request.scheme + "://" + request.get_host() + "/" + url.shortened,
         "original": url.original,
         "shortened": url.shortened,
         } for url in urls]
    next_page = None
    if len(urls) == pagesize:
        next_page = page + 1
    return render(request, 'all.html', {
        "urls": urls,
        "next_page": next_page
    })

def edit(request, short):
    if request.method == "POST":
        return update(request, short)
    try:
        url = Url.objects.get(shortened=short)
        return render(request, 'edit.html', {
            "hostname": request.get_host(),
            "url": url,
            "error": None
        })
    except Url.DoesNotExist:
        return HttpResponseNotFound("No such shortcode")

def update(request, short):
    try:
        url = Url.objects.get(shortened=short)
        updated_shortname = request.POST['shortened']
        if updated_shortname:
            url.shortened = updated_shortname
            url.save()
        return redirect("/urls/edit/" + url.shortened)
    except Url.DoesNotExist:
        return HttpResponseNotFound("No such shortcode")

def delete(request, short):
    try:
        url = Url.objects.get(shortened=short)
        url.delete()
        return redirect("/urls")
    except Url.DoesNotExist:
        return HttpResponseNotFound("No such shortcode")
