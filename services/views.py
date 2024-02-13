from django.shortcuts import render


# Create your views here.
def home(request):
    return render(request, 'services/index.html')


def actu(request):
    return render(request, 'services/a-la-une.html')
