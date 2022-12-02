from django.urls import path

from . import views

urlpatterns = [
    path('', views.new_or_create, name='new_or_create'),
    path('urls', views.all, name='all'),
    path('urls/edit/<str:short>', views.edit, name='edit'),
    path('urls/update/<str:short>', views.update, name='update'),
    path('urls/delete/<str:short>', views.delete, name='short'),
    path('<str:short>', views.short, name='short'),
]