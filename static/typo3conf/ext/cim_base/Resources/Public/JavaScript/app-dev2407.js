
/*************************************************************************/
/********************** FIX POWERMAIL IN POPINS **************************/
/*************************************************************************/

// il faut le paramêtre 'e' pour pouvoir initialiser powermail, ne pas changer l'event donc
$(document).ready(function (e) {

    let formUri = undefined;
    let contentTitle = undefined;
    let jobReference = undefined;

    let dateDebut = undefined;
    let dateFin = undefined;

    // POWERMAIL - Initialize again powermail
    let updatePowermailForm = function ($el, isPopin) {

        let $forms = $el.find('form.powermail_form, form.form-parsley-validation');

        $forms.each(function(index){
            let $form = $(this);

            // return if no form to setup
            if ($form.length === 0)
                return;

            let $submit = $form.find('input[type="submit"], button[type="submit"]');
            let $loader = $form.find('.sk-circle');
            let isPowermail = $form.hasClass('powermail_form');

            // Job
            let $contentTitle = $el.find("#powermail_field_contenttitle");
            let $jobReference = $el.find("#powermail_field_jobreference");

            let $dateDebut = $el.find("#powermail_field_form-date_de_debut");
            let $dateFin = $el.find("#powermail_field_form-date_de_fin");

            // Elected
            let $electedSelect = $el.find('#powermail_field_eluemail');
            let $electedTitle = $el.find("#powermail_field_elutitle");

            let formUriTemp = $('#formContentUri').val() || undefined;
            let contentTitleTemp = $('#contentTitle').val() || undefined;
            let jobReferenceTemp = $('#jobReference').val() || undefined;

            let dateDebutTemp = $('#form_date_debut').val() || undefined;
            let dateFinTemp = $('#form_date_fin').val() || undefined;

            if (formUriTemp !== undefined && formUriTemp !== '') {
                formUri = formUriTemp;
            }

            if (contentTitleTemp !== undefined && contentTitleTemp !== '') {
                contentTitle = contentTitleTemp;
            }

            if (jobReferenceTemp !== undefined && jobReferenceTemp !== '') {
                jobReference = jobReferenceTemp;
            }

            if (dateDebutTemp) {
                dateDebut = dateDebutTemp;
            }
            if (dateFinTemp) {
                dateFin = dateFinTemp;
            }

            if ($electedSelect.find('option:selected').length) {
                $electedTitle.val($electedSelect.find('option:selected').get(0).text);
            }

            if ($form.length > 0) {
                if (formUri !== undefined) {
                    if (isPowermail) {
                        $form.attr('action', formUri);
                        $form.attr('data-powermail-ajax-uri', formUri);
                        $submit.prop('disabled', false);
                        $loader.addClass('hide');
                    }
                }
                $form.parsley();
                //console.log('init parsley');

                // form js validation: success
                //console.log('init form:success');
                $form.parsley().on('form:success', function (formInstance) {

                    // on désactive le submit
                    $submit.prop('disabled', true);
                    $loader.removeClass('hide');
                    // console.log('submit disabled', $submit);

                    // on ne fait le scroll que si powermail car retour en ajax | les autres forms (ex: dashboard: pas d'ajax)
                    if (isPowermail) {
                        // on retire les erreurs sinon on peut pas envoyer de nouveau le form (pb init icheck)
                        $('.powermail_message').remove();

                        let interval = setInterval(function () {

                            let $anchor = $el.find('.powermail_create, .powermail_message');

                            if ($anchor.length > 0) {
                                $anchor = $anchor.eq(0);

                                // init icheck
                                $el.find('.ligne_form.checkbox input, .ligne_form.radio input, .powermail_field .checkbox input, .powermail_field .radio input').iCheck({
                                    checkboxClass: 'icheckbox icheckbox_minimal',
                                    radioClass: 'iradio iradio_minimal'
                                });

                                let offset = 0;
                                let $scrolledElement = $("html");
                                if (isPopin) {
                                    if (Foundation.MediaQuery.current === "small") {
                                        $scrolledElement = $el;
                                        offset = $anchor.offset().top + $scrolledElement.scrollTop();
                                    } else {
                                        $scrolledElement = $el.closest($('.reveal-overlay'));
                                        // offset = $anchor.position().top + parseInt($el.css("top"));
                                        offset = $anchor.offset().top + $scrolledElement.scrollTop();
                                    }
                                } else {
                                    offset = $anchor.offset().top - $("#data-sticky-header").outerHeight();
                                }
                                offset -= 30;

                                // on bind de nouveau
                                updatePowermailForm($el, isPopin);

                                setTimeout(function () {
                                    // $scrolledElement.animate({
                                    //     scrollTop: offset,
                                    // }, 1000);

                                    $scrolledElement.scrollTop(offset);
                                }, 250);

                                clearInterval(interval);
                            }
                        }, 50);
                    }
                });

                // form js validation: error
                // console.log('init form:error');
                $form.parsley().on('form:error', function (formInstance) {
                    let $anchor = $form.find('.parsley-errors-list.filled');

                    if ($anchor.length) {

                        $anchor = $anchor.eq(0).closest('.powermail_fieldwrap, .femanager_fieldset, .ligne_form').eq(0);

                        let offset = 0;
                        let $scrolledElement = $("html");
                        if (isPopin) {
                            if (Foundation.MediaQuery.current === "small") {
                                $scrolledElement = $el;
                            } else {
                                $scrolledElement = $el.closest($('.reveal-overlay'));
                            }
                            offset = $anchor.offset().top + $scrolledElement.scrollTop();
                        } else {
                            offset = $anchor.offset().top - $("#data-sticky-header").outerHeight();
                        }
                        offset -= 80;

                        $scrolledElement.scrollTop(offset);
                    }
                });

                // form checkboxes
                $form.find('.ligne_form.checkbox input, .ligne_form.radio input, .powermail_field .checkbox input, .powermail_field .radio input').iCheck({
                    checkboxClass: 'icheckbox icheckbox_minimal',
                    radioClass: 'iradio iradio_minimal'
                });
            }

            if (isPowermail) {
                if ($contentTitle.length > 0 && contentTitle !== undefined) {
                    $contentTitle
                        .val(contentTitle)
                        .prop('readonly', true);
                }

                if ($jobReference.length > 0 && jobReference !== undefined) {
                    $jobReference
                        .val(jobReference)
                        .prop('readonly', true);
                }

                if ($dateDebut) {
                    $dateDebut.val(dateDebut).prop('readonly', true);
                }
                if ($dateFin) {
                    $dateFin.val(dateFin).prop('readonly', true);
                }

                if ($form.length > 0 && formUri !== undefined && isPopin) {

                    $(document).unbind('submit', 'form[data-powermail-ajax]');
                    $(document).off('submit', 'form[data-powermail-ajax]');

                    if ($el.attr('id') === 'popin_detail' || $el.attr('id') === 'popin_elu') {
                        let PowermailForm = new window.PowermailForm(e);
                        PowermailForm.initialize();
                    }
                }
            }
        });


    };
    setTimeout(function () {
        updatePowermailForm($('#content_page'), false);
    }, 10);

    // POWERMAIL - Fix: When form is loaded in popins, the JS for powermail is not triggered
    $(document).on('open.zf.reveal', '[id^="popin_"]', function () {
        let $popin = $(this);
        setTimeout(function () {
            updatePowermailForm($popin, true);
        }, 250);
    });
});


/*************************************************************************/
/****************** PAUSE VIDEO WHEN VIDEO START PLAYING *****************/
/*************************************************************************/

$(document).on('_page_ready', function () {
    $(document).on('beforeChange', '.slider-for-videos', function (event, slick, currentSlide, nextSlide) {

        let $containerSlide = $(this).find('.bloc_video_cont[data-slick-index="' + currentSlide + '"]');

        // pause the video
        let $iframe = $containerSlide.find('iframe');
        let $video = $containerSlide.find('video');

        if ($iframe.length) {

            // video youtube
            $iframe[0].contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');

        } else if ($video && $video[0] !== undefined) {

            // <video> native
            $video[0].pause();

        }
    });
});


/*************************************************************************/
/************************* ACCESSIBILITY POPIN ***************************/
/*************************************************************************/

// Formulaire: Ecrire à un élu
// Marker champs email (typoscript + lib.listeElus): eluemail
// Marker champs nom (hidden): elutitle

$(document).on('_page_ready', function () {
    $(document).on('change', '#powermail_field_eluemail', function () {
        let $fieldEmail = $(this);
        let $fieldTitle = $('#powermail_field_elutitle');

        if ($fieldTitle.length) {
            let $selected = $fieldEmail.find('option:selected');
            $fieldTitle.val($selected.text());
        }
    });
});


/*************************************************************************/
/******************************** CKEDITOR *******************************/
/*************************************************************************/

$(document).on('_page_ready', function () {
    if (typeof ClassicEditor !== 'undefined') {
        let allEditors = document.querySelectorAll('.form_ckeditor');
        for (let editorId = 0; editorId < allEditors.length; ++editorId) {
            ClassicEditor
                .create(allEditors[editorId], {
                    toolbar: ['heading', '|', 'bold', 'link', 'bulletedList', 'numberedList', 'blockQuote'],
                    heading: {
                        options: [
                            {model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph'},
                            {model: 'heading2', view: 'h2', title: 'Titre 2', class: 'ck-heading_heading2'},
                            {model: 'heading3', view: 'h3', title: 'Titre 3', class: 'ck-heading_heading3'},
                        ]
                    }
                })
                .then(function (editor) {
                })
                .catch(function (error) {
                    console.error(error);
                });
        }
    }
});


/*************************************************************************/
/*************************** EMAIL PROTECTION ****************************/
/*************************************************************************/

$(document).bind('_js_ready', function () {
    $('span.at').replaceWith("&#64;");
    $('span.dot').replaceWith("&#46;");
});


/*************************************************************************/
/************************* ACCESSIBILITY POPIN ***************************/
/*************************************************************************/

// let computeAccessibility = function () {
//     let selectedContrast = $('input[name="contrastes"]:checked').attr('id') || Cookies.get('accessibility_contrast');
//     let selectedFont = $('input[name="police"]:checked').attr('id') || Cookies.get('accessibility_font');
//     let selectedSpacing = $('input[name="interlignage"]:checked').attr('id') || Cookies.get('accessibility_spacing');
//
//     $('#' + selectedContrast).prop('checked', true);
//     $('#' + selectedFont).prop('checked', true);
//     $('#' + selectedSpacing).prop('checked', true);
//
//
//     $("#style-accessibility").remove();
//     $("#style-accessibility-contrast").remove();
//
//     if ((typeof selectedFont !== 'undefined' && selectedFont.length && selectedFont !== 'police_default') || (typeof selectedSpacing !== 'undefined' && selectedSpacing.length && selectedSpacing !== 'interlignage_default')) {
//         $('head').append('<link id="style-accessibility" rel="stylesheet" href="fileadmin/templates/master/assets/assets_site_villemoustaussou/scss/accessibilite.min.css" type="text/css" />');
//     }
//
//     if (typeof selectedContrast !== 'undefined' && selectedContrast.length && selectedContrast !== 'contrastes_default') {
//         $('head').append('<link id="style-accessibility-contrast" rel="stylesheet" href="fileadmin/templates/master/assets/assets_site_villemoustaussou/scss/accessibilite_' + selectedContrast + '.min.css" type="text/css" />');
//     }
//
//     let $body = $("body");
//
//     if ($body.attr('class')) {
//
//         $body.attr('class', function (i, c) {
//             return c.replace(/(^|\s)contrastes_\S+/g, '');
//         });
//
//         $body.attr('class', function (i, c) {
//             return c.replace(/(^|\s)police_\S+/g, '');
//         });
//
//         $body.attr('class', function (i, c) {
//             return c.replace(/(^|\s)interlignage_\S+/g, '');
//         });
//     }
//
//     Cookies.set('accessibility_contrast', selectedContrast);
//     Cookies.set('accessibility_font', selectedFont);
//     Cookies.set('accessibility_spacing', selectedSpacing);
//
//     $body.addClass(selectedContrast);
//     $body.addClass(selectedFont);
//     $body.addClass(selectedSpacing);
// };
//
// $('#popin_accessibilite input').on('change', computeAccessibility);
//
// $(document).on('_js_ready', function () {
//     computeAccessibility();
// });


/*************************************************************************/
/************************ FIX POWERMAIL DATEPICKER ***********************/
/*************************************************************************/

$(document).bind('_js_ready', function () {
    $(function () {
        // fix for IE : remove the default browser datepicker
        $('.powermail_date').click(function (e) {
            e.preventDefault();
        });
        $('.powermail_date').fdatepicker({
            format: 'dd/mm/yyyy',
            language: 'fr',
            disableDblClickSelection: true
        });
        // remove the default IE datepicker
        $('.xdsoft_timepicker, .xdsoft_datetimepicker').remove();
    });
});


$(window).on('popstate', function () {
    // #56554
    // if (typeof list === 'undefined') {
    //     window.location = window.location.href;
    // }
});

$(window).scroll(function () {
    $(document).trigger('_scroll');
});

$('#list_items, #first_display_carto').scroll(function () {
    $(document).trigger('_scroll');
});

// Fix hunt popin
$(window).on("load", function () {

    var scroll;

    $("#filters, #list_items, #first_display_carto, .reveal-overlay").scroll(function () {
        if (typeof scroll !== "undefined") {
            clearTimeout(scroll);
        }

        scroll = setTimeout(function () {
            let images = document.querySelectorAll('img.lazy');
            let observer = new Hunt(images, {
                enter: function (image) {
                    image.src = image.dataset.src;
                }
            });
        }, 25);
    });
});