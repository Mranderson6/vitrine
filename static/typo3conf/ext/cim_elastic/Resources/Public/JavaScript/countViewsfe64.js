'use strict';

$(document).on('_page_ready', function () {

    let url = $('#content_page').attr('data-counter-url');

    if(typeof url !== 'undefined') {
        $.ajax({
            method: 'HEAD',
            url: url
        });
    }
});

$(document).on('_page_ready', function () {
    let isSearch = $('#page').hasClass('search');

    if(isSearch) {
        let articles = $("#zone_results").find('article');

        articles.on('click', 'a', function (e){
            e.preventDefault();

            let url = $(this).closest('article').attr('data-counter-url-search');
            let redirect = $(this).attr('href');

            if(typeof url !== 'undefined') {
                $.ajax({
                    method: 'HEAD',
                    url: url
                }).always(function() {
                    window.location = redirect;
                });
            }
        });
    }
});

$(document).on('_page_ready', function () {

        $("#autocomplete_results").on('click', 'a', function (e){
            e.preventDefault();

            let url = $(this).attr('data-counter-url-search');
            let redirect = $(this).attr('href');

            if(typeof url !== 'undefined') {
                $.ajax({
                    method: 'HEAD',
                    url: url
                }).always(function() {
                    window.location = redirect;
                });
            }
        });
});